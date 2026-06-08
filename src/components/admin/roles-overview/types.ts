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
  // Mirrors admin_list_unified_records: member_profile = catalog_items row with
  // a linked auth user (item_type = 'member'). See src/lib/catalog-types.ts.
  kind: "catalog_item" | "member_profile" | "profile";
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
