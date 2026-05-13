import type { Root, Paragraph, Html, RootContent } from "mdast";
import type { Plugin } from "unified";

const OPEN_RE = /^!(\w[\w-]*)\s*(.*)$/;
const END_RE = /^!end$/;

function extractText(node: RootContent): string {
  if ("value" in node) return (node as any).value;
  if ("children" in node) return (node as any).children.map(extractText).join("");
  return "";
}

function paragraphText(node: Paragraph): string {
  return node.children.map(extractText).join("");
}

const remarkComponents: Plugin<[], Root> = () => {
  return (tree) => {
    const children = tree.children;
    let i = 0;

    while (i < children.length) {
      const node = children[i];
      if (node.type !== "paragraph") { i++; continue; }

      const fullText = paragraphText(node as Paragraph);
      const lines = fullText.split("\n");

      const openMatch = lines[0].match(OPEN_RE);
      if (!openMatch || openMatch[1] === "end") { i++; continue; }

      const name = openMatch[1];
      const args = openMatch[2].trim();

      // Find !end — either within this paragraph or in a following one
      let endIdx = lines.findIndex((l, idx) => idx > 0 && END_RE.test(l.trim()));

      if (endIdx !== -1) {
        // !end is within the same paragraph
        const bodyLines = lines.slice(1, endIdx);
        const body = bodyLines.join("\n").trim();
        const argsAttr = args ? ` data-args="${args.replace(/"/g, '&quot;')}"` : "";

        const htmlNode: Html = {
          type: "html",
          value: `<div data-mdplus-component="${name}"${argsAttr}>${body}</div>`,
        };

        const remaining = lines.slice(endIdx + 1).join("\n").trim();
        const replacements: RootContent[] = [htmlNode];
        if (remaining) {
          replacements.push({
            type: "paragraph",
            children: [{ type: "text", value: remaining }],
          } as Paragraph);
        }

        children.splice(i, 1, ...replacements);
        i += replacements.length;
        continue;
      }

      // !end not in this paragraph — collect following nodes
      const bodyParts: string[] = [];
      if (lines.length > 1) {
        bodyParts.push(lines.slice(1).join("\n"));
      }

      let j = i + 1;
      let foundEnd = false;

      while (j < children.length) {
        const next = children[j];
        const nextText = next.type === "paragraph" ? paragraphText(next as Paragraph) : "";

        if (nextText) {
          const nextLines = nextText.split("\n");
          const endLineIdx = nextLines.findIndex(l => END_RE.test(l.trim()));
          if (endLineIdx !== -1) {
            bodyParts.push(nextLines.slice(0, endLineIdx).join("\n"));
            foundEnd = true;
            break;
          }
          bodyParts.push(nextText);
        } else if (next.type === "list") {
          const items: string[] = [];
          for (const li of (next as any).children) {
            const p = li.children?.[0];
            if (p) items.push(extractText(p));
          }
          bodyParts.push(items.join("\n"));
        }
        j++;
      }

      const body = bodyParts.join("\n").trim();
      const argsAttr = args ? ` data-args="${args.replace(/"/g, '&quot;')}"` : "";
      const htmlNode: Html = {
        type: "html",
        value: `<div data-mdplus-component="${name}"${argsAttr}>${body}</div>`,
      };

      const removeCount = foundEnd ? j - i + 1 : j - i;
      children.splice(i, removeCount, htmlNode);
      i++;
    }
  };
};

export default remarkComponents;
