# MD+

Markdown, extended. MD+ renders standard Markdown files and enhances them with companion **style** (`.mds`) and **script** (`.mdt`) files, turning static documents into interactive, richly styled pages without leaving the Markdown ecosystem.

## Why?

AI agents are exceptionally good at writing Markdown. It's their native output format: concise, structured, and token-efficient. But Markdown documents are plain. They can't show you an architecture diagram you can click through, a status dashboard with live indicators, or a checklist you can actually check off.

HTML can do all of that. It's richer, more visual, and easier on the eyes. But asking an AI agent to produce a full HTML page means paying for thousands of tokens of boilerplate like `<!DOCTYPE>`, `<head>`, `<style>`, wrapper `<div>`s before you get to any actual content. The signal-to-noise ratio is terrible.

MD+ sits in the middle. The AI writes Markdown (what it's best at) and drops in lightweight component calls like `!callout warning` or `!metrics`. The styles and interactive behavior live in companion files that are written once and reused across documents. The result reads like Markdown, renders like a web app, and costs a fraction of the tokens that raw HTML would.

## How It Works

A Markdown file in MD+ can have up to two companion files:

```
runbook.md       ← your content (standard Markdown + GFM)
runbook.mds      ← scoped styles (CSS)
runbook.mdt      ← interactive components (JavaScript)
```

MD+ detects companions automatically by naming convention, or you can import shared libraries explicitly via frontmatter:

```yaml
---
style: ./lib/theme.mds
script: ./lib/components.mdt
---
```

Frontmatter imports load first (shared libraries), then convention-based companions load after (document-specific overrides).

## Styles (`.mds`)

`.mds` files are plain CSS with one addition: the `core` keyword, which scopes selectors to the rendered document container.

```css
core h1 {
  font-size: 2em;
  color: #fff;
}

core .status-card {
  background: #141422;
  border: 1px solid #2a2a3e;
  border-radius: 8px;
  padding: 16px;
}
```

`core` is replaced with `.mdplus-content` at render time, so your styles never leak outside the document.

## Components (`.mdt`)

`.mdt` files define interactive components using vanilla JavaScript. Components are mounted into the document wherever they appear in the Markdown.

### Defining a component

```js
mdplus.mount("callout", (el) => {
  const type = (el.dataset.args || "info").split(" ")[0];
  const body = el.textContent;
  el.textContent = "";

  const div = document.createElement("div");
  div.className = "callout callout-" + type;
  div.innerHTML = "<p>" + body + "</p>";
  el.appendChild(div);
});
```

### Using a component in Markdown

Components are invoked with `!name args` and closed with `!end`:

```markdown
!callout warning
This RFC proposes changes to the auto-update pipeline.
!end
```

Arguments after the component name are available as `el.dataset.args`. The body text between `!name` and `!end` is the element's initial text content.

### Built-in component library

The included `lib/components.mdt` provides examples of components that are reusable across Markdown documents:

| Component   | Usage                                     | Description                                               |
| ----------- | ----------------------------------------- | --------------------------------------------------------- |
| `callout`   | `!callout info\|warning\|success\|danger` | Styled callout box with icon                              |
| `metrics`   | `!metrics` with JSON body                 | Row of metric cards with values, labels, and trend deltas |
| `checklist` | `!checklist` with line-per-item body      | Interactive checklist with progress tracking              |
| `tabs`      | `!tabs` with JSON body                    | Tabbed content panels                                     |
| `progress`  | `!progress 72 Label text`                 | Progress bar with percentage                              |

## Frontmatter

MD+ supports YAML frontmatter for declaring style and script dependencies:

```yaml
---
style: ./lib/theme.mds
script: ./lib/components.mdt
---
```

Both `style` and `script` accept a single path or a list:

```yaml
---
style:
  - ./lib/theme.mds
  - ./lib/dashboard.mds
script:
  - ./lib/components.mdt
  - ./lib/charts.mdt
---
```

## Running Locally

```bash
bun install
bun run dev
```

Open the app in your browser and either:

- Click **Load Demo** to see the built-in example documents
- Click **Open Folder** to open a local directory containing `.md` files (uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API))

## Project Structure

```
src/
  App.tsx                      ← file browser UI, folder/demo loading
  components/
    MarkdownRenderer.tsx       ← renders markdown + injects styles + mounts scripts
  lib/
    fileLoader.ts              ← File System Access API, frontmatter parsing
    mdsPreprocess.ts           ← replaces `core` namespace in .mds files
    remarkComponents.ts        ← remark plugin that transforms !component syntax to HTML
    demoContent.ts             ← bundles example files for the demo
examples/
  demo.md / .mds / .mdt        ← architecture diagram demo
  rfc-auto-updates.md          ← RFC document with callouts, metrics, tabs, checklist
  runbook-build-failures.md    ← runbook with interactive components
  lib/
    theme.mds                  ← shared base styles
    components.mdt             ← shared component library
```

## Security

Opening a folder in MD+ is equivalent to trusting its contents to run code in your browser. `.mdt` files execute arbitrary JavaScript and `.mds` files inject arbitrary CSS into the page. This is by design — it's what makes the interactive components possible.

Only open directories from sources you trust, the same way you would only open an `.html` file from a source you trust.

## Tech Stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [react-markdown](https://github.com/remarkjs/react-markdown) with [remark-gfm](https://github.com/remarkjs/remark-gfm) and [rehype-raw](https://github.com/rehypejs/rehype-raw)

## License

MIT
