import { getAttributeStringValue, type ProfileAttributeState } from "@/lib/member-profile";
import type { DraftValueMap } from "@/lib/profile-attribute-keys";
import type { ProfileDocumentRecord } from "@/lib/profile-documents";
import { formatBytes } from "@/lib/submissions";

/**
 * Taslak haritasından metin değeri okur.
 *
 * DraftValueMap değeri `string | boolean` taşır (checkbox alanları için).
 * Daraltmayı satır içinde koşullu ifadeyle yapmak ÇALIŞMAZ: dinamik indeksli
 * erişimde (`draftValues[key]`) daraltma ifadenin ikinci yarısına taşınmaz,
 * tip `string | boolean` kalır ve input `value`'suna uymaz. Tek yerde daralt.
 */
export const readDraftText = (values: DraftValueMap, key: string): string => {
  const value = values[key];
  return typeof value === "string" ? value : "";
};

/** RPC'den gelen attribute değerini form taslağının taşıdığı biçime indirger. */
export const mapAttributeDraftValue = (attribute: ProfileAttributeState): string | boolean => {
  if (attribute.dataType === "boolean") {
    return Boolean(attribute.valueJson);
  }

  if (attribute.dataType === "multi_select" && Array.isArray(attribute.valueJson)) {
    return attribute.valueJson.join(", ");
  }

  return getAttributeStringValue(attribute);
};

export const readBooleanAttributeValue = (
  attribute: ProfileAttributeState | null | undefined,
): boolean => attribute?.valueJson === true;

/** Belge kartındaki "PDF • 1,2 MB" alt satırı. */
export const formatDocumentMeta = (document: ProfileDocumentRecord | null): string => {
  if (!document) return "Henüz dosya yüklenmedi.";

  const details = [
    document.contentType ? document.contentType.toUpperCase() : "",
    document.sizeBytes ? formatBytes(document.sizeBytes) : "",
  ].filter(Boolean);

  return details.length ? `${details.join(" • ")}` : "Dosya hazır";
};
