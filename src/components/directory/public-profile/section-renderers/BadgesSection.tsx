import { Badge } from "@/components/ui/badge";

import type { PublicSectionRendererProps } from "./renderer-registry";

const BadgesSection = ({ section }: PublicSectionRendererProps) => {
  const badges = Array.isArray(section.content.badges)
    ? section.content.badges.filter((badge): badge is string => typeof badge === "string" && badge.trim() !== "")
    : [];
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Badge key={badge} variant="outline" className="text-xs">
          {badge}
        </Badge>
      ))}
    </div>
  );
};

export default BadgesSection;
