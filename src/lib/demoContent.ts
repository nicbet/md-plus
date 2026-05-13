import type { MdPlusDocument } from "./fileLoader";
import demoMd from "../../examples/demo.md?raw";
import demoMds from "../../examples/demo.mds?raw";
import demoMdt from "../../examples/demo.mdt?raw";
import rfcMd from "../../examples/rfc-auto-updates.md?raw";
import runbookMd from "../../examples/runbook-build-failures.md?raw";
import sharedTheme from "../../examples/lib/theme.mds?raw";
import sharedComponents from "../../examples/lib/components.mdt?raw";

function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1] : raw;
}

export const demoFiles: { name: string; baseName: string; doc: MdPlusDocument }[] = [
  {
    name: "rfc-auto-updates.md",
    baseName: "rfc-auto-updates",
    doc: { name: "rfc-auto-updates.md", markdown: stripFrontmatter(rfcMd), styles: [sharedTheme], scripts: [sharedComponents] },
  },
  {
    name: "runbook-build-failures.md",
    baseName: "runbook-build-failures",
    doc: { name: "runbook-build-failures.md", markdown: stripFrontmatter(runbookMd), styles: [sharedTheme], scripts: [sharedComponents] },
  },
  {
    name: "architecture.md",
    baseName: "Demo",
    doc: { name: "demo.md", markdown: demoMd, styles: [demoMds], scripts: [demoMdt] },
  },
];
