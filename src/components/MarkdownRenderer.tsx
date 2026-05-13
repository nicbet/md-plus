import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import remarkComponents from "../lib/remarkComponents";
import { preprocessMds } from "../lib/mdsPreprocess";
import type { MdPlusDocument } from "../lib/fileLoader";

interface Props {
  document: MdPlusDocument;
}

export default function MarkdownRenderer({ document }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!document.script || !containerRef.current) return;
    const root = containerRef.current;

    root.querySelectorAll("[data-mdplus-component]").forEach((el) => {
      el.innerHTML = "";
    });

    const scriptEl = window.document.createElement("script");
    scriptEl.textContent = `
      (function() {
        const container = document.querySelector('[data-mdplus-root]');
        const mdplus = {
          mount(name, fn) {
            const els = container.querySelectorAll('[data-mdplus-component="' + name + '"]');
            els.forEach(el => fn(el));
          }
        };
        ${document.script}
      })();
    `;
    root.appendChild(scriptEl);

    return () => {
      scriptEl.remove();
      root.querySelectorAll("[data-mdplus-component]").forEach((el) => {
        el.innerHTML = "";
      });
    };
  }, [document.script, document.markdown]);

  const processedStyle = document.style ? preprocessMds(document.style) : null;

  return (
    <>
      {processedStyle && <style>{processedStyle}</style>}
      <div
        ref={containerRef}
        className="mdplus-content"
        data-mdplus-root
      >
        <Markdown
          remarkPlugins={[remarkGfm, remarkComponents]}
          rehypePlugins={[rehypeRaw]}
        >
          {document.markdown}
        </Markdown>
      </div>
    </>
  );
}
