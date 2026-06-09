// Backward-compatible barrel — admin servis fonksiyonları domain bazlı
// dosyalara ayrıştırıldı (Faz 4 clean-code refactor). Mevcut tüm import
// noktaları `@/lib/admin` üzerinden çalışmaya devam eder; fonksiyon adları,
// parametreler, RPC string'leri ve dönüş davranışları birebir korunmuştur.

export { userIsAdmin } from "./admin/admin-access-api";

export { setUserRoleAsAdmin, getRoleManagementBundle } from "./admin/admin-role-api";

export {
  setRoleFeatureFlagAsAdmin,
  setUserFeatureOverrideAsAdmin,
  setUserFeatureOverrideDetailedAsAdmin,
  clearUserFeatureOverrideAsAdmin,
  setFeatureGlobalStateAsAdmin,
} from "./admin/admin-feature-api";

export {
  setUserProfileTypeAsAdmin,
  setAttributeRuleAsAdmin,
  updateUserProfileAttributeAsAdmin,
  upsertRoleProfileSectionRuleAsAdmin,
  upsertEntityMetadataAsAdmin,
} from "./admin/admin-profile-api";

export {
  updateUserTaxonomySelectionAsAdmin,
  upsertRoleTaxonomyRuleAsAdmin,
  setTaxonomyOptionActiveAsAdmin,
} from "./admin/admin-taxonomy-api";

export { reviewApprovalRequestAsAdmin } from "./admin/admin-approval-api";

export {
  listReferralSources,
  listReferralTypes,
  listReferralGroups,
  createReferralSource,
  createReferralGroup,
  createReferralType,
  updateReferralSource,
  updateReferralGroup,
  updateReferralType,
  createReferralCode,
  updateReferralCodeEditableFields,
  setReferralCodeActive,
  deleteReferralCodeHard,
} from "./admin/admin-referral-api";

export type {
  AttributeRule,
  RoleManagementAttribute,
  RoleManagementFeature,
  SectionRule,
  RoleManagementSection,
  RoleManagementBundle,
} from "./admin/admin-types";
