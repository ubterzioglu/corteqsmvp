import type { CatalogEntityProfileAttribute } from "@/lib/catalog-entity-api";

/**
 * Draft helpers shared by the catalog attribute editors
 * (CatalogItemEditorPage and the public profile inline editor).
 */

export type CatalogAttributeDraftValue = string | boolean;

export const readDraftValue = (
  attribute: CatalogEntityProfileAttribute,
): CatalogAttributeDraftValue => {
  if (attribute.data_type === "boolean") {
    return attribute.value_json === true;
  }

  if (Array.isArray(attribute.value_json)) {
    return attribute.value_json.join(", ");
  }

  if (typeof attribute.value_json === "string" && attribute.value_json.trim()) {
    return attribute.value_json;
  }

  return attribute.value_text ?? "";
};

export const parseDraftValue = (
  attribute: CatalogEntityProfileAttribute,
  value: CatalogAttributeDraftValue,
): unknown => {
  if (attribute.data_type === "boolean") {
    return Boolean(value);
  }

  if (attribute.data_type === "multi_select") {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value).trim();
};
