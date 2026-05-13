import type { MdPlusDocument } from "./fileLoader";
import archMd from "../../examples/architecture.md?raw";
import archMds from "../../examples/architecture.mds?raw";
import archMdt from "../../examples/architecture.mdt?raw";

const demoMd = `# Welcome to Markdown Plus

This is a **Markdown Plus** document. It has companion files that add styling and interactivity.

## Features

- Standard Markdown rendering
- Custom styles via \`.mds\` files
- Dynamic behavior via \`.mdt\` files
- Convention over configuration: just name them the same

## A Table

| Feature   | Markdown | MD+  |
|-----------|----------|------|
| Text      | Yes      | Yes  |
| Styles    | No       | Yes  |
| Scripts   | No       | Yes  |

## Interactive Section

Click the button below to see the script in action:

!counter

> "Simplicity is the ultimate sophistication." -- Leonardo da Vinci
`;

const demoMds = `core h1 {
  background: linear-gradient(135deg, #7c83ff, #ff6ec7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 2.5em;
}

core table {
  border: none;
  border-radius: 8px;
  overflow: hidden;
}

core th {
  background: #7c83ff;
  color: #fff;
  border: none;
}

core td {
  border: none;
  border-bottom: 1px solid #2a2a3e;
}

core tr:last-child td {
  border-bottom: none;
}

core .counter-btn {
  padding: 10px 24px;
  font-size: 1em;
  border: 2px solid #7c83ff;
  background: transparent;
  color: #7c83ff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

core .counter-btn:hover {
  background: #7c83ff;
  color: #fff;
}`;

const demoMdt = `mdplus.mount('counter', (el) => {
  let count = 0;
  const btn = document.createElement('button');
  btn.className = 'counter-btn';
  btn.textContent = 'Count: ' + count;
  btn.addEventListener('click', () => {
    count++;
    btn.textContent = 'Count: ' + count;
  });
  el.appendChild(btn);
});`;

const plainMd = `# A Plain Markdown File

This file has **no** companion \`.mds\` or \`.mdt\` files. It renders with default styling and no scripts.

## Just Markdown

- Bullet one
- Bullet two
- Bullet three

\`\`\`javascript
console.log("Hello from a code block");
\`\`\`

That's it. Plain and simple.
`;

export const demoFiles: { name: string; baseName: string; doc: MdPlusDocument }[] = [
  {
    name: "architecture.md",
    baseName: "architecture",
    doc: { name: "architecture.md", markdown: archMd, style: archMds, script: archMdt },
  },
  {
    name: "demo.md",
    baseName: "demo",
    doc: { name: "demo.md", markdown: demoMd, style: demoMds, script: demoMdt },
  },
  {
    name: "plain.md",
    baseName: "plain",
    doc: { name: "plain.md", markdown: plainMd, style: null, script: null },
  },
];
