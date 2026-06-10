import type { PublicProfileSectionViewModel } from "@/lib/public-catalog-profile-view-model";

import PublicProfileSectionFrame from "./PublicProfileSectionFrame";
import type { ProfileAccent } from "./public-profile-utils";
import { resolvePublicSectionRenderer } from "./section-renderers/renderer-registry";

interface PublicProfileSectionListProps {
  sections: PublicProfileSectionViewModel[];
  accent: ProfileAccent;
}

const PublicProfileSectionList = ({ sections, accent }: PublicProfileSectionListProps) => {
  if (sections.length === 0) return null;

  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const { Component, Icon } = resolvePublicSectionRenderer(section.componentKey);
        return (
          <PublicProfileSectionFrame
            key={section.key}
            title={section.label}
            description={section.componentKey ? null : section.description}
            Icon={Icon}
            accent={accent}
          >
            <Component section={section} />
          </PublicProfileSectionFrame>
        );
      })}
    </div>
  );
};

export default PublicProfileSectionList;
