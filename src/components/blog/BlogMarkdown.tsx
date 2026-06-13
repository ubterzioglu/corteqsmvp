// src/components/blog/BlogMarkdown.tsx
// Blog içeriğini güvenli biçimde render eder. react-markdown HTML enjekte etmez
// (dangerouslySetInnerHTML kullanmaz), remark-gfm ile tablo desteği sağlar.
// Stil için @tailwindcss/typography `prose` sınıfları kullanılır.

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BlogMarkdownProps {
  content: string;
  className?: string;
}

export default function BlogMarkdown({ content, className }: BlogMarkdownProps) {
  return (
    <div
      className={
        "prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-foreground " +
        "prose-p:leading-relaxed prose-p:text-foreground/90 prose-a:text-primary " +
        "prose-strong:text-foreground prose-table:text-sm prose-th:text-left " +
        (className ?? "")
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
