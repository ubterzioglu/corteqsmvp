import type { PublicProfileSectionViewModel } from "@/lib/public-catalog-profile-view-model";

import PublicProfileSectionList from "./PublicProfileSectionList";
import type { ProfileAccent } from "./public-profile-utils";

interface PublicProfileSidebarProps {
  sections: PublicProfileSectionViewModel[];
  accent: ProfileAccent;
  children?: React.ReactNode;
}

/** Sticky on desktop only; flows inline below the main column on mobile. */
const PublicProfileSidebar = ({ sections, accent, children }: PublicProfileSidebarProps) => (
  <aside className="space-y-5 self-start lg:sticky lg:top-24">
    <PublicProfileSectionList sections={sections} accent={accent} />
    {children}
  </aside>
);

export default PublicProfileSidebar;
