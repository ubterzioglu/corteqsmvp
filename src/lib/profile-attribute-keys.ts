import { PHONE_ATTRIBUTE_KEY } from "@/lib/profile-phone";
import type { AttributeVisibility } from "@/lib/member-profile";

/** Profil formundaki taslak değerler (checkbox alanları boolean taşır). */
export type DraftValueMap = Record<string, string | boolean>;
/** Profil formundaki taslak görünürlük seçimleri. */
export type DraftVisibilityMap = Record<string, AttributeVisibility>;

export const VISIBILITY_OPTIONS: { value: AttributeVisibility; label: string }[] = [
  { value: "public", label: "Görünür" },
  { value: "private", label: "Gizli" },
];

export const PROFILE_PHOTO_ATTRIBUTE_KEY = "profile_photo_url";
export const LINKEDIN_ATTRIBUTE_KEY = "linkedin_url";
export const WEBSITE_ATTRIBUTE_KEY = "website_url";
export const JOB_SEEKING_OPT_IN_ATTRIBUTE_KEY = "job_seeking_opt_in";
export const MOVING_SOON_OPT_IN_ATTRIBUTE_KEY = "moving_soon_opt_in";
export const VOLUNTEER_MENTORSHIP_OPT_IN_ATTRIBUTE_KEY = "volunteer_mentorship_opt_in";
export const CV_DOCUMENT_ATTRIBUTE_KEY = "cv_doc";
export const PRESENTATION_DOCUMENT_ATTRIBUTE_KEY = "presentation_doc";
export const REFERRAL_CODE_ATTRIBUTE_KEY = "referral_code";
export const REFERRAL_SOURCE_ATTRIBUTE_KEY = "referral_source";

export const PRIVATE_ONLY_ONBOARDING_ATTRIBUTE_KEYS = new Set([
  REFERRAL_CODE_ATTRIBUTE_KEY,
  REFERRAL_SOURCE_ATTRIBUTE_KEY,
]);
// WS1 madde 4 (T19): "Bizi nereden buldunuz?" kayıt akışından tamamen kaldırıldı.
// Attribute canlıda pasif (mig 20260904200000); eski veri taşıyan bir profilde bile
// düzenleyici gösterilmez.
export const HIDDEN_ROLE_SPECIFIC_ATTRIBUTE_KEYS = new Set([
  "full_name",
  "interests",
  REFERRAL_SOURCE_ATTRIBUTE_KEY,
]);
export const SPECIAL_PROFILE_ATTRIBUTE_KEYS = new Set([
  PHONE_ATTRIBUTE_KEY,
  PROFILE_PHOTO_ATTRIBUTE_KEY,
  LINKEDIN_ATTRIBUTE_KEY,
  WEBSITE_ATTRIBUTE_KEY,
  JOB_SEEKING_OPT_IN_ATTRIBUTE_KEY,
  MOVING_SOON_OPT_IN_ATTRIBUTE_KEY,
  VOLUNTEER_MENTORSHIP_OPT_IN_ATTRIBUTE_KEY,
  CV_DOCUMENT_ATTRIBUTE_KEY,
  PRESENTATION_DOCUMENT_ATTRIBUTE_KEY,
]);

// WS1 madde 2 (T19): profil tipi kullanıcıya net görünsün — çip + açıklama.
export const PROFILE_TYPE_TIP =
  "Profil tipin hangi alanları doldurabileceğini ve hangi özellikleri kullanabileceğini belirler. Değiştirmek için aşağıdaki \"Başvurular & Erişimler\" kartından rol başvurusu yap.";

export const PROFILE_CV_BUCKET = "profile-cv-files";
export const PROFILE_PRESENTATION_BUCKET = "profile-presentation-files";
