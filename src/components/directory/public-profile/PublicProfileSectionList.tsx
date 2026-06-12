import type { ReactNode } from "react";

import type { PublicProfileSectionViewModel } from "@/lib/public-catalog-profile-view-model";

import PublicProfileSectionFrame from "./PublicProfileSectionFrame";
import type { ProfileAccent } from "./public-profile-utils";
import { resolvePublicSectionRenderer } from "./section-renderers/renderer-registry";

interface PublicProfileSectionListProps {
  mainSections: PublicProfileSectionViewModel[];
  sidebarSections: PublicProfileSectionViewModel[];
  accent: ProfileAccent;
  /** Extra sidebar content (e.g. trust card) rendered above the sidebar sections. */
  sidebarTop?: ReactNode;
}

const renderSection = (section: PublicProfileSectionViewModel, accent: ProfileAccent) => {
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
};

/**
 * Real two-column layout: main sections fill an ~8-column area, sidebar
 * sections (and the optional trust card) sit in a sticky ~4-column rail on
 * lg+ screens. On mobile everything stacks into a single column with the
 * sidebar content after the main content.
 */
const PublicProfileSectionList = ({
  mainSections,
  sidebarSections,
  accent,
  sidebarTop,
}: PublicProfileSectionListProps) => {
  const hasSidebar = Boolean(sidebarTop) || sidebarSections.length > 0;

  if (mainSections.length === 0 && !hasSidebar) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-8">
        {mainSections.map((section) => renderSection(section, accent))}
      </div>
      {hasSidebar ? (
        <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          {sidebarTop}
          {sidebarSections.map((section) => renderSection(section, accent))}
        </aside>
      ) : null}
    </div>
  );
};

export default PublicProfileSectionList;
