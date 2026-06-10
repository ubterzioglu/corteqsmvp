import type { AttributeRowViewModel } from "@/lib/public-catalog-profile-view-model";

import type { PublicSectionRendererProps } from "./renderer-registry";

const isAttributeRow = (row: unknown): row is AttributeRowViewModel =>
  typeof row === "object" &&
  row !== null &&
  typeof (row as AttributeRowViewModel).label === "string" &&
  typeof (row as AttributeRowViewModel).value === "string";

const AttributesGridSection = ({ section }: PublicSectionRendererProps) => {
  const rows = Array.isArray(section.content.rows)
    ? section.content.rows.filter(isAttributeRow)
    : [];
  if (rows.length === 0) return null;

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.key ?? row.label}
          className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3"
        >
          <dt className="text-xs font-medium text-muted-foreground">{row.label}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-foreground">
            {row.href ? (
              <a
                href={row.href}
                target="_blank"
                rel="noreferrer"
                className="break-all text-primary underline-offset-4 hover:underline"
              >
                {row.value}
              </a>
            ) : (
              row.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default AttributesGridSection;
