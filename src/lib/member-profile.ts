import type { Json } from "@/integrations/supabase/types";
import type { FeatureSource, GenericFeatureKey } from "@/lib/features";
import type { CanonicalRoleSlug, LegacyRoleKey } from "@/lib/profile-types";

export type AttributeDataType = "text" | "textarea" | "select" | "multi_select" | "url" | "phone" | "boolean" | "json";
export type AttributeVisibility = "public" | "private";
export type ApprovalStatus = "draft" | "pending" | "approved" | "rejected" | "cancelled";
export type ApprovalRequestType =
  | "role_change"
  | "directory_visibility"
  | "contact_visibility"
  | "featured_listing"
  | "event_create"
  | "offer_create"
  | "referral_create"
  | "attribute_change"
  | "city_manage";

export type ProfileAttributeValue = string | boolean | string[] | Record<string, Json> | Json[] | null;

export type ProfileAttributeState = {
  attributeKey: string;
  label: string;
  description: string | null;
  dataType: AttributeDataType;
  isSystem: boolean;
  sortOrder: number;
  isRequired: boolean;
  isPublicDefault: boolean;
  userCanEdit: boolean;
  userCanHide: boolean;
  requiresAdminApprovalOnChange: boolean;
  visibility: AttributeVisibility;
  approvalStatus: ApprovalStatus;
  valueText: string | null;
  valueJson: Json | null;
  displayValue: Json | null;
};

export type ProfileFeatureState = {
  key: string;
  isEnabled: boolean;
  source: FeatureSource;
};

export type TaxonomyOptionState = {
  key: string;
  label: string;
  description: string | null;
  isActive: boolean;
  isSelected: boolean;
};

export type TaxonomyGroupState = {
  groupKey: string;
  label: string;
  description: string | null;
  selectionMode: "single" | "multiple";
  isRequired: boolean;
  options: TaxonomyOptionState[];
};

export type PendingApprovalSummary = {
  id: string;
  requestType: ApprovalRequestType;
  status: ApprovalStatus;
  targetRoleKey: string | null;
  targetFeatureKey: string | null;
  targetEntityType: string | null;
  createdAt: string;
  adminNote: string | null;
  payload: Json | null;
};

export type CurrentUserProfilePayload = {
  userId: string;
  email: string | null;
  fullName: string | null;
  profileType: LegacyRoleKey;
  roleKey: LegacyRoleKey;
  roleLabel: string;
  roleDescription: string | null;
  roleSlug: CanonicalRoleSlug;
  features: ProfileFeatureState[];
  attributes: ProfileAttributeState[];
  taxonomyGroups: TaxonomyGroupState[];
  pendingRequests: PendingApprovalSummary[];
  profileCompletion: {
    requiredTotal: number;
    requiredCompleted: number;
    percentage: number;
  };
};

type JsonRecord = Record<string, Json | undefined>;

const isRecord = (value: unknown): value is JsonRecord => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const asRecord = (value: Json | null | undefined): JsonRecord => {
  if (!isRecord(value)) return {};
  return value;
};

const readString = (record: JsonRecord, key: string): string | null => {
  const value = record[key];
  return typeof value === "string" ? value : null;
};

const readBoolean = (record: JsonRecord, key: string, fallback = false): boolean => {
  const value = record[key];
  return typeof value === "boolean" ? value : fallback;
};

const readNumber = (record: JsonRecord, key: string, fallback = 0): number => {
  const value = record[key];
  return typeof value === "number" ? value : fallback;
};

export const mapCurrentUserProfilePayload = (value: Json | null): CurrentUserProfilePayload | null => {
  const record = asRecord(value);
  const userId = readString(record, "user_id");
  const roleKey = readString(record, "role_key");
  const profileType = readString(record, "profile_type");
  const roleSlug = readString(record, "role_slug");

  if (!userId || !roleKey || !profileType || !roleSlug) {
    return null;
  }

  const features = Array.isArray(record.features)
    ? record.features
        .map((item) => {
          const feature = asRecord(item);
          const key = readString(feature, "key");
          const source = readString(feature, "source");
          if (!key || !source) return null;
          return {
            key,
            isEnabled: readBoolean(feature, "is_enabled"),
            source: (source === "override" || source === "role_default" || source === "fallback"
              ? source
              : "fallback") as FeatureSource,
          };
        })
        .filter((item): item is ProfileFeatureState => Boolean(item))
    : [];

  const attributes = Array.isArray(record.attributes)
    ? record.attributes
        .map((item) => {
          const attribute = asRecord(item);
          const attributeKey = readString(attribute, "attribute_key");
          const label = readString(attribute, "label");
          const dataType = readString(attribute, "data_type");
          const visibility = readString(attribute, "visibility");
          const approvalStatus = readString(attribute, "approval_status");
          if (!attributeKey || !label || !dataType || !visibility || !approvalStatus) return null;

          return {
            attributeKey,
            label,
            description: readString(attribute, "description"),
            dataType: dataType as AttributeDataType,
            isSystem: readBoolean(attribute, "is_system"),
            sortOrder: readNumber(attribute, "sort_order", 100),
            isRequired: readBoolean(attribute, "is_required"),
            isPublicDefault: readBoolean(attribute, "is_public_default"),
            userCanEdit: readBoolean(attribute, "user_can_edit", true),
            userCanHide: readBoolean(attribute, "user_can_hide", true),
            requiresAdminApprovalOnChange: readBoolean(attribute, "requires_admin_approval_on_change"),
            visibility: (visibility === "public" ? "public" : "private") as AttributeVisibility,
            approvalStatus: approvalStatus as ApprovalStatus,
            valueText: readString(attribute, "value_text"),
            valueJson: (attribute.value_json as Json | undefined) ?? null,
            displayValue: (attribute.display_value as Json | undefined) ?? null,
          };
        })
        .filter((item): item is ProfileAttributeState => Boolean(item))
    : [];

  const pendingRequests = Array.isArray(record.pending_requests)
    ? record.pending_requests
        .map((item) => {
          const request = asRecord(item);
          const id = readString(request, "id");
          const requestType = readString(request, "request_type");
          const status = readString(request, "status");
          const createdAt = readString(request, "created_at");
          if (!id || !requestType || !status || !createdAt) return null;
          return {
            id,
            requestType: requestType as ApprovalRequestType,
            status: status as ApprovalStatus,
            targetRoleKey: readString(request, "target_role_key"),
            targetFeatureKey: readString(request, "target_feature_key"),
            targetEntityType: readString(request, "target_entity_type"),
            createdAt,
            adminNote: readString(request, "admin_note"),
            payload: (request.payload as Json | undefined) ?? null,
          };
        })
        .filter((item): item is PendingApprovalSummary => Boolean(item))
    : [];

  const taxonomyGroups = Array.isArray(record.taxonomy_groups)
    ? record.taxonomy_groups
        .map((item) => {
          const group = asRecord(item);
          const groupKey = readString(group, "group_key");
          const label = readString(group, "label");
          const selectionMode = readString(group, "selection_mode");
          if (!groupKey || !label || !selectionMode) return null;

          const options = Array.isArray(group.options)
            ? group.options
                .map((optionItem) => {
                  const option = asRecord(optionItem);
                  const key = readString(option, "key");
                  const optionLabel = readString(option, "label");
                  if (!key || !optionLabel) return null;
                  return {
                    key,
                    label: optionLabel,
                    description: readString(option, "description"),
                    isActive: readBoolean(option, "is_active", true),
                    isSelected: readBoolean(option, "is_selected"),
                  };
                })
                .filter((option): option is TaxonomyOptionState => Boolean(option))
            : [];

          return {
            groupKey,
            label,
            description: readString(group, "description"),
            selectionMode: (selectionMode === "multiple" ? "multiple" : "single") as "single" | "multiple",
            isRequired: readBoolean(group, "is_required"),
            options,
          };
        })
        .filter((group): group is TaxonomyGroupState => Boolean(group))
    : [];

  const completionRecord = asRecord(record.profile_completion as Json | undefined);

  return {
    userId,
    email: readString(record, "email"),
    fullName: readString(record, "full_name"),
    profileType: profileType as LegacyRoleKey,
    roleKey: roleKey as LegacyRoleKey,
    roleLabel: readString(record, "role_label") ?? roleKey,
    roleDescription: readString(record, "role_description"),
    roleSlug: roleSlug as CanonicalRoleSlug,
    features,
    attributes,
    taxonomyGroups,
    pendingRequests,
    profileCompletion: {
      requiredTotal: readNumber(completionRecord, "required_total"),
      requiredCompleted: readNumber(completionRecord, "required_completed"),
      percentage: readNumber(completionRecord, "percentage", 100),
    },
  };
};

export const getAttributeStringValue = (attribute: ProfileAttributeState): string => {
  if (typeof attribute.valueText === "string") return attribute.valueText;
  if (typeof attribute.displayValue === "string") return attribute.displayValue;
  if (Array.isArray(attribute.displayValue)) {
    return attribute.displayValue.map((item) => String(item)).join(", ");
  }
  return "";
};

export const getGenericFeatureState = (
  features: ProfileFeatureState[],
  featureKey: GenericFeatureKey,
): ProfileFeatureState | null => {
  return features.find((feature) => feature.key === featureKey) ?? null;
};
