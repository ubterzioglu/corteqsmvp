import {
  HIDDEN_ROLE_SPECIFIC_ATTRIBUTE_KEYS,
  SPECIAL_PROFILE_ATTRIBUTE_KEYS,
} from "@/lib/profile-attribute-keys";
import {
  EDUCATION_ATTRIBUTE_KEYS,
  isEducationAttributeKey,
} from "@/lib/profile-education";
import { SOCIAL_ATTRIBUTE_CONFIGS, SOCIAL_ATTRIBUTE_KEYS } from "@/lib/profile-social-links";
import type { ProfileAttributeState } from "@/lib/member-profile";

/** Profil formunun dört bölümü. Her nitelik en fazla birine girer. */
export interface GroupedProfileAttributes {
  common: ProfileAttributeState[];
  education: ProfileAttributeState[];
  socialMedia: ProfileAttributeState[];
  roleSpecific: ProfileAttributeState[];
}

/** "Kişisel bilgiler" bölümünde toplu görünürlük anahtarına bağlı olan alanlar. */
const COMMON_ATTRIBUTE_KEYS = ["country", "city", "bio_short"] as const;

/**
 * Profil niteliklerini form bölümlerine ayırır ve her bölümü kendi kanonik
 * sırasına sokar.
 *
 * Eleme kuralları (sıra önemlidir — ilk eşleşen kazanır):
 * 1. Ortak alanlar (ülke/şehir/kısa biyografi).
 * 2. Öğrenim alanları — kişisel bilgilerin içinde ama **alan başına**
 *    görünürlükle çizilir; ortak alanların toplu anahtarına bağlanmaz
 *    (varsayılan gizli).
 * 3. `SPECIAL_PROFILE_ATTRIBUTE_KEYS` — kendi özel kartı olanlar, elenir.
 * 4. Sosyal medya.
 * 5. `HIDDEN_ROLE_SPECIFIC_ATTRIBUTE_KEYS` — elenir.
 * 6. Kalan her şey role özel.
 *
 * ⚠️ Sıralama `indexOf` ile sabit listelere dayanır, alfabetik DEĞİLDİR —
 * Türkçe harf sırası burada devreye girmez ve girmemelidir.
 */
export function groupProfileAttributes(
  attributes: readonly ProfileAttributeState[] | null | undefined,
): GroupedProfileAttributes {
  const common: ProfileAttributeState[] = [];
  const education: ProfileAttributeState[] = [];
  const socialMedia: ProfileAttributeState[] = [];
  const roleSpecific: ProfileAttributeState[] = [];

  for (const attribute of attributes ?? []) {
    if ((COMMON_ATTRIBUTE_KEYS as readonly string[]).includes(attribute.attributeKey)) {
      common.push(attribute);
    } else if (isEducationAttributeKey(attribute.attributeKey)) {
      education.push(attribute);
    } else if (SPECIAL_PROFILE_ATTRIBUTE_KEYS.has(attribute.attributeKey)) {
      continue;
    } else if (SOCIAL_ATTRIBUTE_KEYS.has(attribute.attributeKey)) {
      socialMedia.push(attribute);
    } else if (HIDDEN_ROLE_SPECIFIC_ATTRIBUTE_KEYS.has(attribute.attributeKey)) {
      continue;
    } else {
      roleSpecific.push(attribute);
    }
  }

  socialMedia.sort((left, right) => {
    const leftIndex = SOCIAL_ATTRIBUTE_CONFIGS.findIndex((item) => item.key === left.attributeKey);
    const rightIndex = SOCIAL_ATTRIBUTE_CONFIGS.findIndex((item) => item.key === right.attributeKey);
    return leftIndex - rightIndex;
  });

  education.sort(
    (left, right) =>
      EDUCATION_ATTRIBUTE_KEYS.indexOf(left.attributeKey) -
      EDUCATION_ATTRIBUTE_KEYS.indexOf(right.attributeKey),
  );

  return { common, education, socialMedia, roleSpecific };
}
