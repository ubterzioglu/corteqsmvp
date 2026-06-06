import type {
  PendingOnboardingFormValues,
  PendingOnboardingPayload,
} from "@/lib/pending-onboarding-schemas";

export const REFERRAL_SOURCE_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp Grubu" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "x-twitter", label: "X (Twitter)" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "arkadas-tavsiye", label: "Arkadas / Tavsiye" },
  { value: "etkinlik", label: "Etkinlik / Bulusma" },
  { value: "google", label: "Google Arama" },
  { value: "basin-haber", label: "Basin / Haber" },
  { value: "diger", label: "Diger" },
] as const;

const ALLOWED_REFERRAL_SOURCE_VALUES = new Set(REFERRAL_SOURCE_OPTIONS.map((option) => option.value));
const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export type ReferralSourceOption = (typeof REFERRAL_SOURCE_OPTIONS)[number];

export type NormalizedPendingOnboardingPayload = {
  onboardingKey: string;
  mode: "register" | "support" | "backer";
  savedAt: string;
  form: PendingOnboardingFormValues;
  formEntries: Record<string, FormDataEntryValue>;
  emailNormalized: string;
};

export const normalizeEmail = (value: string | null | undefined) => {
  return value?.trim().toLowerCase() ?? "";
};

export const getReferralSourceOptions = (): ReferralSourceOption[] => [...REFERRAL_SOURCE_OPTIONS];

export const createOnboardingKey = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `onb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizePhone = (value: string) => value.replace(/[\s\-().]/g, "");

const requireNonEmpty = (label: string, value: string) => {
  if (!value.trim()) {
    throw new Error(`${label} gerekli.`);
  }
};

export const normalizePendingFormPayload = (
  payload: PendingOnboardingPayload,
): NormalizedPendingOnboardingPayload => {
  const form = {
    ...payload.form,
    category: payload.form.category.trim(),
    fullname: payload.form.fullname.trim(),
    country: payload.form.country.trim(),
    city: payload.form.city.trim(),
    business: payload.form.business.trim(),
    field: payload.form.field.trim(),
    email: payload.form.email.trim(),
    phone: normalizePhone(payload.form.phone),
    description: payload.form.description.trim(),
    offers_needs: payload.form.offers_needs.trim(),
    company_name: payload.form.company_name.trim(),
    donor_type: payload.form.donor_type.trim(),
    donation_amount: payload.form.donation_amount.trim(),
    document_url: payload.form.document_url.trim(),
    document_name: payload.form.document_name.trim(),
    referral_source: payload.form.referral_source.trim(),
    referral_detail: payload.form.referral_detail.trim(),
    referral_code: payload.form.referral_code.trim().toUpperCase(),
    linkedin: payload.form.linkedin.trim(),
    instagram: payload.form.instagram.trim(),
    tiktok: payload.form.tiktok.trim(),
    facebook: payload.form.facebook.trim(),
    twitter: payload.form.twitter.trim(),
    website: payload.form.website.trim(),
  };

  requireNonEmpty("Kategori", form.category);
  requireNonEmpty("Ad Soyad", form.fullname);
  requireNonEmpty("Ulke", form.country);
  requireNonEmpty("Sehir", form.city);
  requireNonEmpty("Istigal / Ilgi Sahasi", form.field);
  requireNonEmpty("Telefon", form.phone);

  const emailNormalized = normalizeEmail(form.email);
  if (!emailNormalized) {
    throw new Error("E-posta gerekli.");
  }

  if (!E164_PHONE_PATTERN.test(form.phone)) {
    throw new Error("Telefon ulke kodu ile baslamali.");
  }

  if (form.referral_source && !ALLOWED_REFERRAL_SOURCE_VALUES.has(form.referral_source)) {
    throw new Error("Referral kaynagi gecersiz.");
  }

  if (form.referral_source === "whatsapp" && !form.referral_detail) {
    throw new Error("WhatsApp kaynagi secildiginde detay gerekli.");
  }

  const formEntries: Record<string, FormDataEntryValue> = {
    category: form.category,
    fullname: form.fullname,
    country: form.country,
    city: form.city,
    business: form.business,
    field: form.field,
    email: emailNormalized,
    phone: form.phone,
    description: form.description,
    offers_needs: form.offers_needs,
    company_name: form.company_name,
    donor_type: form.donor_type,
    donation_amount: form.donation_amount,
    document_url: form.document_url,
    document_name: form.document_name,
    referral_source: form.referral_source,
    referral_detail: form.referral_detail,
    referral_code: form.referral_code,
    linkedin: form.linkedin,
    instagram: form.instagram,
    tiktok: form.tiktok,
    facebook: form.facebook,
    twitter: form.twitter,
    website: form.website,
    contest_interest: form.contest_interest ? "yes" : "",
    whatsapp_interest: form.whatsapp_interest ? "yes" : "",
  };

  return {
    onboardingKey: payload.onboardingKey,
    mode: payload.mode,
    savedAt: payload.savedAt,
    form,
    formEntries,
    emailNormalized,
  };
};
