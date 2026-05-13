import type { Root, Paragraph, Html } from "mdast";
import type { Plugin } from "unified";

const COMPONENT_RE = /^!(\w[\w-]*)$/;

const remarkComponents: Plugin<[], Root> = () => {
  return (tree) => {
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      if (node.type !== "paragraph" || node.children.length !== 1) continue;
      const child = node.children[0];
      if (child.type !== "text") continue;

      const match = child.value.match(COMPONENT_RE);
      if (!match) continue;

      const name = match[1];
      const htmlNode: Html = {
        type: "html",
        value: `<div data-mdplus-component="${name}"></div>`,
      };
      (tree.children as (Paragraph | Html)[])[i] = htmlNode;
    }
  };
};

export default remarkComponents;
