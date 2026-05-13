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
    if (!document.scripts.length || !containerRef.current) return;
    const root = containerRef.current;

    // Snapshot original innerHTML on first mount so it survives StrictMode cleanup
    root.querySelectorAll("[data-mdplus-component]").forEach((el) => {
      if (!el.hasAttribute("data-mdplus-original")) {
        el.setAttribute("data-mdplus-original", el.innerHTML);
      }
    });

    const allScripts = document.scripts.join("\n\n");
    const scriptEl = window.document.createElement("script");
    scriptEl.textContent = `
      (function() {
        const container = document.querySelector('[data-mdplus-root]');
        const mdplus = {
          mount(name, fn) {
            const els = container.querySelectorAll('[data-mdplus-component="' + name + '"]');
            els.forEach(el => {
              el.innerHTML = el.getAttribute('data-mdplus-original') || '';
              fn(el);
            });
          }
        };
        ${allScripts}
      })();
    `;
    root.appendChild(scriptEl);

    return () => {
      scriptEl.remove();
      root.querySelectorAll("[data-mdplus-component]").forEach((el) => {
        el.innerHTML = "";
      });
    };
  }, [document.scripts, document.markdown]);

  const processedStyles = document.styles.map(preprocessMds);

  return (
    <>
      {processedStyles.map((css, i) => (
        <style key={i}>{css}</style>
      ))}
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
