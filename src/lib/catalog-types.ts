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

// "member_profile" rows are catalog_items with item_type = 'member' and a
// linked auth user (admin_list_unified_records, migration 20260608020000).
// "profile" is retained for the legacy profiles-table shape.
export type UnifiedRecordKind = "catalog_item" | "member_profile" | "profile";

export interface UnifiedRecord {
  id: string;
  kind: UnifiedRecordKind;
  slug: string | null;
  itemType: string | null;
  title: string;
  summary: string | null;
  status: string;
  visibility: string | null;
  verificationStatus: string | null;
  platformRoleKey: string | null;
  primaryCity: string | null;
  primaryCountryCode: string | null;
  categoryLabels: string[];
  sourceTypes: string[];
  createdAt: string;
  updatedAt: string;
  profileType: string | null;
  email: string | null;
}

export interface UnifiedRecordPage {
  records: UnifiedRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CatalogClaim {
  id: string;
  itemId: string;
  itemTitle: string;
  requestedByUserId: string;
  requesterFullName: string;
  requesterEmail: string | null;
  claimType: string;
  note: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  reviewerFullName: string | null;
}

export interface AdminProfileSearchResult {
  id: string;
  fullName: string;
  email: string | null;
}
