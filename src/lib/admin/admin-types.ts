// Admin servis katmanı için paylaşılan tipler.
// Faz 4 (clean-code refactor) ile src/lib/admin.ts'ten ayrıştırıldı.
// Geriye uyumluluk: bu tipler src/lib/admin.ts barrel'i üzerinden de export edilir.

export type AttributeRule = {
  is_enabled: boolean;
  is_required: boolean;
  is_public_default: boolean;
  user_can_edit: boolean;
  user_can_hide: boolean;
  requires_admin_approval_on_change: boolean;
  sort_order: number;
};

export type RoleManagementAttribute = {
  key: string;
  label: string;
  description: string | null;
  admin_note: string | null;
  rule: AttributeRule;
};

export type RoleManagementFeature = {
  key: string;
  label: string;
  description: string | null;
  admin_note: string | null;
  is_active_globally: boolean;
  is_enabled: boolean;
};

export type SectionRule = {
  is_enabled: boolean;
  requires_approval: boolean;
  sort_order: number;
};

export type RoleManagementSection = {
  key: string;
  label: string;
  description: string | null;
  admin_note: string | null;
  section_area: string;
  rule: SectionRule;
};

export type RoleManagementBundle = {
  role: { id: string; key: string; label: string };
  attributes: RoleManagementAttribute[];
  features: RoleManagementFeature[];
  sections: RoleManagementSection[];
};
