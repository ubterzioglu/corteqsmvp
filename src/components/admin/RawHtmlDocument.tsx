import { useEffect, useMemo, useRef } from "react";

type RawHtmlDocumentProps = {
  html: string;
  className?: string;
};

const extractTagContent = (html: string, tagName: string) => {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match?.[1]?.trim() ?? "";
};

const extractAllStyleBlocks = (html: string) => {
  return Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((match) => match[1]?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");
};

const scopeDocumentCss = (css: string) => {
  return css
    .replace(/\bhtml\b/g, ".doc-html")
    .replace(/\bbody\b/g, ".doc-body");
};

const RawHtmlDocument = ({ html, className = "" }: RawHtmlDocumentProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  const documentParts = useMemo(() => {
    const title = extractTagContent(html, "title");
    const body = extractTagContent(html, "body") || html;
    const styles = scopeDocumentCss(extractAllStyleBlocks(html));

    return { title, body, styles };
  }, [html]);

  useEffect(() => {
    if (!hostRef.current) return;

    const shadowRoot = hostRef.current.shadowRoot ?? hostRef.current.attachShadow({ mode: "open" });

    shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: #0f172a;
        }

        .doc-html {
          display: block;
        }

        .doc-body {
          display: block;
        }
      </style>
      <style>${documentParts.styles}</style>
      <div class="doc-html">
        <div class="doc-body">${documentParts.body}</div>
      </div>
    `;
  }, [documentParts]);

  return (
    <div className={className}>
      {documentParts.title ? <span className="sr-only">{documentParts.title}</span> : null}
      <div ref={hostRef} />
    </div>
  );
};

export default RawHtmlDocument;
