---
style: ./lib/theme.mds
script: ./lib/components.mdt
---

# Runbook: Build Pipeline Failures

**Owner:** Platform Team · **Last reviewed:** 2026-05-10 · **Severity:** P1

!callout danger
This runbook covers failures in the build pipeline — from `kickOffBuild()` to artifact upload. If builds are stuck, failing, or producing bad artifacts, start here.
!end

## Current Pipeline Health

!metrics
[{ "value": "97.2%", "label": "Build Success Rate", "delta": "-1.8%", "trend": "down" }, { "value": "8.4min", "label": "Avg Build Time", "delta": "+0.6min", "trend": "up" }, { "value": "3", "label": "Active Pipelines" }, { "value": "12", "label": "Queued Builds", "delta": "+8", "trend": "up" }]
!end

## Quick Diagnosis

Before diving into specific scenarios, check these first:

!checklist
Check Azure DevOps status page for platform outages
Verify the build queue depth in Azure Pipelines dashboard
Check if the failure is isolated to one app or affecting all builds
Look at the build logs in Firestore (builds collection, status: failed)
Check if Apple notarization service is responding (macOS builds only)
!end

## Failure Scenarios

!tabs
[{"label": "Build Stuck in Queue", "content": "Symptoms: Build status is queued for >15 minutes. No agent picks it up. Common causes: All Azure agents are busy, agent pool scaled down, or pipeline YAML syntax error. Resolution: Check Azure DevOps Agent Pools. Restart offline agents or cancel stale builds."}, {"label": "Compilation Failure", "content": "Symptoms: Build exits during electron-builder step. Common causes: Native module compilation failure, Node version mismatch, or out-of-memory. Resolution: Check build log for specific error. For OOM: add --max-old-space-size=8192."}, {"label": "Signing Fails", "content": "Symptoms: macOS or Windows signing/notarization step fails. Common causes: Apple notarization service down, certificate expired in Key Vault, or Windows HSM connection lost. Resolution: Check Apple system status. Rotate expired certs in Key Vault."}, {"label": "Artifact Upload Fails", "content": "Symptoms: Build completes but artifacts missing from S3. Common causes: S3 IAM role expired, network timeout on large uploads, or agent disk space exhaustion. Resolution: Verify IAM role in AWS console. Retry upload or clean agent disk."}]
!end

## Escalation Path

If you've followed the steps above and the issue persists:

| Severity | Action | Contact |
|----------|--------|---------|
| Builds queued > 30 min | Scale up agent pool | @platform-oncall |
| All builds failing | Check infrastructure changes | @platform-leads |
| Single app failing | Check app-specific config | @app-support |
| Signing certs expired | Rotate certificates | @security-team |

!callout warning
If more than 50% of builds are failing for >1 hour, this is a **P0 incident**. Page the platform oncall immediately and open an incident channel.
!end

## Recovery Checklist

After resolving a pipeline outage, complete these steps:

!checklist
Verify builds are succeeding again (at least 3 consecutive)
Retry any builds that failed during the outage
Notify affected customers via status page update
Write incident timeline in #incidents Slack channel
Update this runbook if the failure mode was new
Schedule post-mortem within 48 hours
!end

!progress 82 #27ae60 Runbook coverage
!end

---

*Next review due: 2026-06-10 · Owner: @platform-team*
