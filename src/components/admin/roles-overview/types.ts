export interface RoleListItem {
  id: string;
  key: string;
  label: string;
  is_active: boolean;
  sort_order: number;
}

export interface EntityCatalogItem {
  kind: "attribute" | "feature" | "section";
  key: string;
  label: string;
  description: string | null;
  data_type?: string;
  scope_role?: string;
  section_area?: string;
  sort_order: number;
}

export interface ItemListEntry {
  id: string;
  kind: "catalog_item" | "profile";
  title: string;
  platformRoleKey: string | null;
  status: string;
  claimantEmail: string | null;
  adminEmail: string | null;
}

export interface RoleEntityAssignment {
  attributeRules: {
    attributeKey: string;
    attributeLabel: string;
    is_enabled: boolean;
    is_required: boolean;
    is_public_default: boolean;
  }[];
  featureFlags: {
    featureKey: string;
    featureLabel: string;
    is_enabled: boolean;
  }[];
  sectionRules: {
    sectionKey: string;
    sectionLabel: string;
    is_enabled: boolean;
  }[];
}
