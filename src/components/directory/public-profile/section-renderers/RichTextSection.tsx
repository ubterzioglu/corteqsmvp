import type { PublicSectionRendererProps } from "./renderer-registry";

const RichTextSection = ({ section }: PublicSectionRendererProps) => {
  const text = typeof section.content.text === "string" ? section.content.text : "";
  if (!text.trim()) return null;

  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      {text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line break-words">
            {paragraph}
          </p>
        ))}
    </div>
  );
};

export default RichTextSection;
