---
style: ./lib/theme.mds
script: ./lib/components.mdt
---

# RFC-0042: Automatic Update Rollouts

**Author:** Jamie Chen · **Status:** In Review · **Created:** 2026-05-01

!callout warning
This RFC proposes changes to the auto-update pipeline. All stakeholders should review before the May 20 deadline.
!end

## Summary

Currently, when a developer publishes a new release via `todesktop release`, the update is pushed to **100% of users immediately**. This has caused two incidents in the past quarter where broken builds reached all users before the team could react.

This RFC proposes a **staged rollout system** that gradually increases the percentage of users receiving an update, with automatic monitoring and rollback.

!metrics
[{ "value": "2", "label": "Incidents (Q1)", "delta": "+100%", "trend": "up" }, { "value": "34k", "label": "Users Affected" }, { "value": "47min", "label": "Avg Recovery Time", "delta": "-12min", "trend": "down" }, { "value": "99.4%", "label": "Current Uptime", "delta": "-0.5%", "trend": "down" }]
!end

## Motivation

Our user base has grown 4x in the past year, but our release process hasn't evolved. A single bad build now affects tens of thousands of users instead of hundreds. The current "ship to everyone" model was fine at small scale but has become a liability.

Key problems with the current approach:

- **No gradual exposure.** Every release is all-or-nothing. There's no way to test with 1% of users first.
- **Manual rollback only.** When a bad build ships, someone has to notice, wake up, and manually trigger a rollback. Average response time is 47 minutes.
- **No automated health checks.** We have monitoring, but it's not wired into the release pipeline. The dashboards light up, but the pipeline doesn't know.

## Proposed Design

### Rollout Stages

Each release will progress through four stages. The system automatically advances to the next stage if health checks pass, or rolls back if they fail.

| Stage | % of Users | Duration | Health Check |
|-------|-----------|----------|--------------|
| Canary | 1% | 30 min | Crash rate, API errors |
| Early Adopters | 10% | 2 hours | + performance metrics |
| Broad | 50% | 6 hours | + user feedback signals |
| General | 100% | — | Continuous monitoring |

!callout info
Developers can skip stages with `--force-rollout 100` for hotfixes, but this will be logged and flagged in the audit trail.
!end

### Health Check Criteria

The system monitors three signal categories during each rollout stage:

!tabs
[{"label": "Crash Rate", "content": "Threshold: less than 2% crash rate in the new version, measured against baseline. Signal: Crash reports from the Electron crashReporter module, aggregated in 5-minute windows. Rollback trigger: If crash rate exceeds 2x baseline for two consecutive windows."}, {"label": "API Errors", "content": "Threshold: less than 0.5% error rate on all API calls from the new version. Signal: HTTP 5xx responses logged by functions/api, filtered by client version header. Rollback trigger: If error rate exceeds 1% for a single 5-minute window."}, {"label": "Performance", "content": "Threshold: p95 startup time within 20% of baseline. Signal: app-ready timing events reported via telemetry, measured from app.on('ready') to first paint. Rollback trigger: If p95 exceeds threshold for three consecutive windows."}]
!end

### Architecture Changes

The rollout system requires changes to three existing services:

1. **`functions/builds`** — New `rolloutStage` field on the build document. A Cloud Function trigger advances the stage on a timer and checks health signals before proceeding.

2. **`@todesktop/cli`** — The `release` command gains a `--rollout` flag (default: `staged`). The CLI writes the initial rollout config to the build doc.

3. **Update server** — The Cloudflare Worker that serves `update.json` to Electron's `autoUpdater` needs to respect the rollout percentage. It hashes the user's machine ID to deterministically assign them to a rollout bucket.

!callout success
No changes needed to the Builder app itself — the rollout is server-side. Users on existing versions will automatically get staged rollouts.
!end

## Implementation Plan

!progress 35 Overall progress
!end

!checklist
Design rollout state machine and stage transitions
Add rolloutStage field to Firestore build schema
Implement stage-advancement Cloud Function with timer
Wire health check signals (crash rate, API errors, perf)
Add rollback logic with automatic Slack notification
Update CLI release command with --rollout flag
Modify Cloudflare Worker to hash-bucket users
Write integration tests for rollout progression
Run shadow rollout on internal team builds
Documentation and runbook update
Ship to production behind feature flag
Enable for all customers
!end

## Risks and Mitigations

**Risk: Hash bucketing creates inconsistent UX within teams.**
Users on the same team might see different versions during a rollout. Mitigation: Allow org-level opt-in to "early adopter" or "stable" channels.

**Risk: Staged rollouts slow down hotfix delivery.**
When production is broken, you need 100% rollout NOW. Mitigation: The `--force-rollout 100` flag bypasses stages. Usage is logged and requires an incident ticket ID.

**Risk: Health check false positives trigger unnecessary rollbacks.**
A transient spike in crash rate could roll back a perfectly good build. Mitigation: Require two consecutive failing windows before rollback, and allow manual override.

## Open Questions

1. Should we support **per-platform rollouts** (e.g., roll out to macOS first, then Windows)?
2. How do we handle **mandatory security updates** that shouldn't be staged?
3. Should the rollout percentage be configurable per-app, or global?

!callout info
Discussion thread: #eng-releases in Slack. Please leave comments by May 20.
!end

---

*Last updated: May 13, 2026*
