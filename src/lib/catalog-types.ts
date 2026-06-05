export interface CatalogItemRules {
  platformRoleKey: string | null;
  attributes: CatalogItemAttribute[];
  features: CatalogItemFeature[];
  sections: CatalogItemSection[];
  overrides: CatalogItemOverrides;
}

export interface CatalogItemAttribute {
  key: string;
  label: string;
  dataType: string;
  visibility: "public" | "private" | "admin_only";
  isRequired: boolean;
  displayOrder: number;
  isOverride: boolean;
  isEnabled?: boolean;
}

export interface CatalogItemFeature {
  key: string;
  label?: string;
  isEnabled: boolean;
  isOverride: boolean;
}

export interface CatalogItemSection {
  key: string;
  label?: string;
  isVisible: boolean;
  displayOrder: number;
  isOverride: boolean;
}

export interface CatalogItemOverrides {
  attributes: CatalogItemAttribute[];
  features: CatalogItemFeature[];
  sections: CatalogItemSection[];
}

export interface CatalogItemEditor {
  userId: string;
  fullName: string;
  email: string;
  membershipRole: "owner" | "manager" | "editor" | "contributor" | "viewer";
  status: "active" | "pending" | "revoked" | "suspended";
  grantedAt: string;
}

export interface AttributeOverrideConfig {
  isEnabled?: boolean;
  displayOrder?: number | null;
  overrideLabel?: string | null;
}
