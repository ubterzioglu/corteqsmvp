import { supabase } from "@/integrations/supabase/client";

type QueryError = {
  message: string;
};

export type CatalogEntityProfileAttribute = {
  attribute_key: string;
  label: string;
  data_type: string;
  is_system: boolean;
  sort_order: number;
  is_required: boolean;
  is_public_default: boolean;
  editor_can_edit: boolean;
  editor_can_hide: boolean;
  requires_admin_approval_on_change: boolean;
  visibility: "public" | "private" | "admin_only";
  approval_status: "draft" | "pending" | "approved" | "rejected";
  value_text: string | null;
  value_json: unknown;
};

export type CatalogEntityProfileFeature = {
  feature_key: string;
  is_enabled: boolean;
  source: "override" | "type_default";
  reason?: string | null;
};

export type CatalogEntityProfile = {
  id: string;
  item_type: string;
  slug: string;
  title: string;
  status: string;
  visibility: string;
  linked_user_id: string | null;
  attributes: CatalogEntityProfileAttribute[];
  features: CatalogEntityProfileFeature[];
};

type CatalogEntityRpcClient = {
  rpc: (
    functionName:
      | "get_catalog_item_profile"
      | "update_catalog_item_attribute"
      | "admin_set_catalog_item_attribute"
      | "admin_set_catalog_item_feature_override"
      | "admin_set_catalog_item_editor",
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: QueryError | null }>;
};

const catalogEntityRpcClient = supabase as unknown as CatalogEntityRpcClient;

export async function getCatalogItemProfile(itemId: string): Promise<CatalogEntityProfile> {
  const { data, error } = await catalogEntityRpcClient.rpc("get_catalog_item_profile", {
    p_item_id: itemId,
  });

  if (error) throw error;

  const payload = (data ?? {}) as Partial<CatalogEntityProfile>;

  return {
    id: payload.id ?? itemId,
    item_type: payload.item_type ?? "",
    slug: payload.slug ?? "",
    title: payload.title ?? "",
    status: payload.status ?? "",
    visibility: payload.visibility ?? "private",
    linked_user_id: payload.linked_user_id ?? null,
    attributes: Array.isArray(payload.attributes) ? payload.attributes : [],
    features: Array.isArray(payload.features) ? payload.features : [],
  };
}

export async function updateCatalogItemAttribute(
  itemId: string,
  attributeKey: string,
  value: unknown,
  visibility?: string,
) {
  const { data, error } = await catalogEntityRpcClient.rpc("update_catalog_item_attribute", {
    p_item_id: itemId,
    p_attribute_key: attributeKey,
    p_value: value,
    p_visibility: visibility ?? null,
  });

  if (error) throw error;
  return data;
}

export async function adminSetCatalogItemAttribute(
  itemId: string,
  attributeKey: string,
  value: unknown,
  visibility = "public",
) {
  const { data, error } = await catalogEntityRpcClient.rpc("admin_set_catalog_item_attribute", {
    p_item_id: itemId,
    p_attribute_key: attributeKey,
    p_value: value,
    p_visibility: visibility,
  });

  if (error) throw error;
  return data;
}

export async function adminSetCatalogItemFeatureOverride(
  itemId: string,
  featureKey: string,
  isEnabled: boolean,
  reason?: string,
) {
  const { data, error } = await catalogEntityRpcClient.rpc("admin_set_catalog_item_feature_override", {
    p_item_id: itemId,
    p_feature_key: featureKey,
    p_is_enabled: isEnabled,
    p_reason: reason ?? null,
  });

  if (error) throw error;
  return data;
}

export async function adminSetCatalogItemEditor(
  itemId: string,
  userId: string,
  role: "editor" | "manager" | "viewer" = "editor",
) {
  const { data, error } = await catalogEntityRpcClient.rpc("admin_set_catalog_item_editor", {
    p_item_id: itemId,
    p_user_id: userId,
    p_role: role,
  });

  if (error) throw error;
  return data;
}
