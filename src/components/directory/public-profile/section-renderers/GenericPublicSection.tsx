import { Badge } from "@/components/ui/badge";

import type { PublicSectionRendererProps } from "./renderer-registry";

/**
 * Fallback renderer for sections without a dedicated component.
 * Renders only safe primitives: strings, numbers, booleans and string arrays.
 * Nested objects and unknown shapes are never dumped to the DOM.
 */
const GenericPublicSection = ({ section }: PublicSectionRendererProps) => {
  const entries = Object.entries(section.content ?? {});

  const safeEntries = entries
    .map(([key, value]) => {
      if (typeof value === "string" && value.trim()) {
        return { key, kind: "text" as const, text: value.trim(), badges: [] as string[] };
      }
      if (typeof value === "number") {
        return { key, kind: "text" as const, text: String(value), badges: [] as string[] };
      }
      if (typeof value === "boolean") {
        return { key, kind: "text" as const, text: value ? "Evet" : "Hayır", badges: [] as string[] };
      }
      if (Array.isArray(value)) {
        const badges = value.filter(
          (entry): entry is string => typeof entry === "string" && entry.trim() !== "",
        );
        if (badges.length > 0) {
          return { key, kind: "badges" as const, text: "", badges };
        }
      }
      return null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (safeEntries.length === 0) {
    if (import.meta.env.DEV) {
      console.warn(
        `GenericPublicSection: "${section.key}" (componentKey: ${section.componentKey ?? "null"}) has no renderable public content.`,
      );
    }
    return section.description ? (
      <p className="text-sm leading-relaxed text-muted-foreground">{section.description}</p>
    ) : (
      <p className="text-sm text-muted-foreground/70">Bu bölümün içeriği yakında eklenecek.</p>
    );
  }

  return (
    <div className="space-y-3">
      {safeEntries.map((entry) =>
        entry.kind === "badges" ? (
          <div key={entry.key} className="flex flex-wrap gap-2">
            {entry.badges.map((badge) => (
              <Badge key={badge} variant="outline" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        ) : (
          <p key={entry.key} className="break-words text-sm leading-relaxed text-muted-foreground">
            {entry.text}
          </p>
        ),
      )}
    </div>
  );
};

export default GenericPublicSection;
