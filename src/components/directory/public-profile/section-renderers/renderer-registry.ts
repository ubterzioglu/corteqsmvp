import type { ComponentType } from "react";
import {
  Briefcase,
  FileText,
  Languages,
  LayoutGrid,
  Link as LinkIcon,
  Phone,
  Tags,
  User,
  type LucideIcon,
} from "lucide-react";

import type { PublicProfileSectionViewModel } from "@/lib/public-catalog-profile-view-model";

import AttributesGridSection from "./AttributesGridSection";
import BadgesSection from "./BadgesSection";
import ContactListSection from "./ContactListSection";
import GenericPublicSection from "./GenericPublicSection";
import LanguagesSection from "./LanguagesSection";
import LinksSection from "./LinksSection";
import RichTextSection from "./RichTextSection";
import ServicesSection from "./ServicesSection";

export type PublicSectionRendererProps = {
  section: PublicProfileSectionViewModel;
};

export type PublicSectionRendererDefinition = {
  Component: ComponentType<PublicSectionRendererProps>;
  Icon: LucideIcon;
};

/**
 * componentKey -> renderer. Placement and empty-state decisions live in the
 * view-model (single source); this registry only resolves the visual component.
 * Adding a new renderer = one entry here; unknown keys never break the page.
 */
export const PUBLIC_SECTION_RENDERERS: Record<string, PublicSectionRendererDefinition> = {
  rich_text: { Component: RichTextSection, Icon: FileText },
  attributes: { Component: AttributesGridSection, Icon: User },
  contact_list: { Component: ContactListSection, Icon: Phone },
  services: { Component: ServicesSection, Icon: Briefcase },
  languages: { Component: LanguagesSection, Icon: Languages },
  links: { Component: LinksSection, Icon: LinkIcon },
  badges: { Component: BadgesSection, Icon: Tags },
};

export const GENERIC_PUBLIC_SECTION_RENDERER: PublicSectionRendererDefinition = {
  Component: GenericPublicSection,
  Icon: LayoutGrid,
};

export function resolvePublicSectionRenderer(
  componentKey: string | null,
): PublicSectionRendererDefinition {
  if (!componentKey) return GENERIC_PUBLIC_SECTION_RENDERER;
  return PUBLIC_SECTION_RENDERERS[componentKey] ?? GENERIC_PUBLIC_SECTION_RENDERER;
}
