import { Badge } from "@/components/ui/badge";

import type { PublicSectionRendererProps } from "./renderer-registry";

type LanguageEntry = { code: string; proficiency: string | null };

const isLanguageEntry = (entry: unknown): entry is LanguageEntry =>
  typeof entry === "object" && entry !== null && typeof (entry as LanguageEntry).code === "string";

const LanguagesSection = ({ section }: PublicSectionRendererProps) => {
  const languages = Array.isArray(section.content.languages)
    ? section.content.languages.filter(isLanguageEntry)
    : [];
  if (languages.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {languages.map((language) => (
        <Badge key={language.code} variant="secondary" className="text-xs">
          {language.code.toUpperCase()}
          {language.proficiency ? ` · ${language.proficiency}` : ""}
        </Badge>
      ))}
    </div>
  );
};

export default LanguagesSection;
