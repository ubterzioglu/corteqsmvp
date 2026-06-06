import { z } from "zod";

export const PROFILE_ONBOARDING_STORAGE_KEY = "corteqs_profile_onboarding_v1";
export const LEGACY_FORM_BACKUP_STORAGE_KEY = "corteqs_form_backup";
export const PENDING_ONBOARDING_PAYLOAD_VERSION = 1 as const;

export type PendingOnboardingPayloadVersion = typeof PENDING_ONBOARDING_PAYLOAD_VERSION;

export const pendingOnboardingFormSchema = z.object({
  category: z.string().default(""),
  fullname: z.string().default(""),
  country: z.string().default(""),
  city: z.string().default(""),
  business: z.string().default(""),
  field: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  description: z.string().default(""),
  offers_needs: z.string().default(""),
  company_name: z.string().default(""),
  donor_type: z.string().default(""),
  donation_amount: z.string().default(""),
  document_url: z.string().default(""),
  document_name: z.string().default(""),
  referral_source: z.string().default(""),
  referral_detail: z.string().default(""),
  referral_code: z.string().default(""),
  linkedin: z.string().default(""),
  instagram: z.string().default(""),
  tiktok: z.string().default(""),
  facebook: z.string().default(""),
  twitter: z.string().default(""),
  website: z.string().default(""),
  contest_interest: z.boolean().default(false),
  whatsapp_interest: z.boolean().default(false),
  consent: z.boolean().default(false),
});

export const pendingOnboardingPayloadSchema = z.object({
  version: z.literal(PENDING_ONBOARDING_PAYLOAD_VERSION),
  onboardingKey: z.string().min(8),
  mode: z.enum(["register", "support", "backer"]).default("register"),
  savedAt: z.string().min(1),
  form: pendingOnboardingFormSchema,
});

export type PendingOnboardingFormValues = z.infer<typeof pendingOnboardingFormSchema>;
export type PendingOnboardingPayload = z.infer<typeof pendingOnboardingPayloadSchema>;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const readBoolean = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return value === true || value === "true" || value === "on" || value === "yes";
};

const readString = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  return typeof value === "string" ? value : "";
};

export const parsePendingOnboardingPayload = (value: unknown): PendingOnboardingPayload | null => {
  const result = pendingOnboardingPayloadSchema.safeParse(value);
  return result.success ? result.data : null;
};

export const migrateLegacyPendingOnboardingPayload = (
  value: unknown,
  createOnboardingKey: () => string,
): PendingOnboardingPayload | null => {
  if (!isRecord(value)) return null;

  return {
    version: PENDING_ONBOARDING_PAYLOAD_VERSION,
    onboardingKey: createOnboardingKey(),
    mode: "register",
    savedAt: new Date().toISOString(),
    form: pendingOnboardingFormSchema.parse({
      category: readString(value, "category"),
      fullname: readString(value, "fullname"),
      country: readString(value, "country"),
      city: readString(value, "city"),
      business: readString(value, "business"),
      field: readString(value, "field"),
      email: readString(value, "email"),
      phone: readString(value, "phone"),
      description: readString(value, "description"),
      offers_needs: readString(value, "offers_needs"),
      company_name: readString(value, "company_name"),
      donor_type: readString(value, "donor_type"),
      donation_amount: readString(value, "donation_amount"),
      document_url: readString(value, "document_url"),
      document_name: readString(value, "document_name"),
      referral_source: readString(value, "referral_source"),
      referral_detail: readString(value, "referral_detail"),
      referral_code: readString(value, "referral_code"),
      linkedin: readString(value, "linkedin"),
      instagram: readString(value, "instagram"),
      tiktok: readString(value, "tiktok"),
      facebook: readString(value, "facebook"),
      twitter: readString(value, "twitter"),
      website: readString(value, "website"),
      contest_interest: readBoolean(value, "contest_interest"),
      whatsapp_interest: readBoolean(value, "whatsapp_interest"),
      consent: readBoolean(value, "consent"),
    }),
  };
};
