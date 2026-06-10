import type { PublicProfileSectionViewModel } from "@/lib/public-catalog-profile-view-model";

import PublicProfileSectionFrame from "./PublicProfileSectionFrame";
import type { ProfileAccent } from "./public-profile-utils";
import { resolvePublicSectionRenderer } from "./section-renderers/renderer-registry";

interface PublicProfileSectionListProps {
  sections: PublicProfileSectionViewModel[];
  accent: ProfileAccent;
}

/**
 * Card grid following the IndividualPublicView pattern: "main" sections span
 * the full width, "sidebar" sections sit side by side on md+ screens.
 */
const PublicProfileSectionList = ({ sections, accent }: PublicProfileSectionListProps) => {
  if (sections.length === 0) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {sections.map((section) => {
        const { Component, Icon } = resolvePublicSectionRenderer(section.componentKey);
        return (
          <div key={section.key} className={section.placement === "main" ? "md:col-span-2" : ""}>
            <PublicProfileSectionFrame
              title={section.label}
              description={section.componentKey ? null : section.description}
              Icon={Icon}
              accent={accent}
            >
              <Component section={section} />
            </PublicProfileSectionFrame>
          </div>
        );
      })}
    </div>
  );
};

export default PublicProfileSectionList;
