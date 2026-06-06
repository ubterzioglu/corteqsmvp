import { supabase } from "@/integrations/supabase/client";
import { updateProfileAttribute } from "@/lib/member-profile-api";
import {
  LEGACY_FORM_BACKUP_STORAGE_KEY,
  migrateLegacyPendingOnboardingPayload,
  parsePendingOnboardingPayload,
  PENDING_ONBOARDING_PAYLOAD_VERSION,
  pendingOnboardingFormSchema,
  PROFILE_ONBOARDING_STORAGE_KEY,
  type PendingOnboardingFormValues,
  type PendingOnboardingPayload,
} from "@/lib/pending-onboarding-schemas";
import {
  createOnboardingKey,
  normalizePendingFormPayload,
  type NormalizedPendingOnboardingPayload,
} from "@/lib/pending-onboarding-normalize";
import {
  insertSubmissionWithCompatibility,
  toSubmissionInsert,
  validateReferralCodeBeforeSubmit,
  type SubmissionFormMode,
} from "@/lib/submissions";

export type CurrentOnboardingActivation = {
  id: string;
  batchId: string;
  status: string;
  sourceSubmissionId: string;
  emailNormalized: string;
  inviteSentAt: string | null;
  activatedAt: string | null;
  submission: {
    fullname: string;
    email: string;
    country: string;
    city: string;
    business: string;
    field: string;
    referralCode: string;
    referralSource: string;
  };
};

type ActivationDraftInput = {
  fullName: string;
  country: string;
  city: string;
  businessOrOrganization: string;
  interestFocus: string;
  businessVisibility: "public" | "private";
  interestVisibility: "public" | "private";
  referralCode: string;
  referralSource: string;
};

const hasWindow = () => typeof window !== "undefined";
const getLocalStorage = () => (hasWindow() ? window.localStorage : null);
const getSessionStorage = () => (hasWindow() ? window.sessionStorage : null);

const readStorageValue = (key: string, storage: Storage | null) => {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorageValue = (key: string, value: string, storage: Storage | null) => {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

const removeStorageValue = (key: string, storage: Storage | null) => {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // ignore storage errors
  }
};

export const buildPendingOnboardingPayload = (params: {
  form: Partial<PendingOnboardingFormValues>;
  mode?: SubmissionFormMode;
  onboardingKey?: string;
}): PendingOnboardingPayload => {
  return {
    version: PENDING_ONBOARDING_PAYLOAD_VERSION,
    onboardingKey: params.onboardingKey ?? createOnboardingKey(),
    mode: params.mode ?? "register",
    savedAt: new Date().toISOString(),
    form: pendingOnboardingFormSchema.parse(params.form),
  };
};

export const savePendingOnboardingPayload = (payload: PendingOnboardingPayload) => {
  writeStorageValue(PROFILE_ONBOARDING_STORAGE_KEY, JSON.stringify(payload), getLocalStorage());
};

export const loadPendingOnboardingPayload = (): PendingOnboardingPayload | null => {
  const localStorage = getLocalStorage();
  const sessionStorage = getSessionStorage();

  const currentValue = readStorageValue(PROFILE_ONBOARDING_STORAGE_KEY, localStorage);
  if (currentValue) {
    try {
      return parsePendingOnboardingPayload(JSON.parse(currentValue));
    } catch {
      removeStorageValue(PROFILE_ONBOARDING_STORAGE_KEY, localStorage);
    }
  }

  const legacyValue = readStorageValue(LEGACY_FORM_BACKUP_STORAGE_KEY, sessionStorage);
  if (!legacyValue) return null;

  try {
    const migrated = migrateLegacyPendingOnboardingPayload(JSON.parse(legacyValue), createOnboardingKey);
    if (migrated) {
      savePendingOnboardingPayload(migrated);
    }
    removeStorageValue(LEGACY_FORM_BACKUP_STORAGE_KEY, sessionStorage);
    return migrated;
  } catch {
    removeStorageValue(LEGACY_FORM_BACKUP_STORAGE_KEY, sessionStorage);
    return null;
  }
};

export const clearPendingOnboardingPayload = () => {
  removeStorageValue(PROFILE_ONBOARDING_STORAGE_KEY, getLocalStorage());
  removeStorageValue(LEGACY_FORM_BACKUP_STORAGE_KEY, getSessionStorage());
};

const ensureAuthenticatedUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) {
    throw new Error("Oturum bulunamadi.");
  }
  return data.user;
};

export const finalizeAuthenticatedSubmission = async (payload: PendingOnboardingPayload) => {
  const user = await ensureAuthenticatedUser();
  const normalized = normalizePendingFormPayload(payload);
  const submission = toSubmissionInsert(
    {
      ...normalized.formEntries,
      email: user.email?.trim() || normalized.emailNormalized,
    },
    normalized.mode,
    normalized.form.consent,
  );

  submission.referral_code = await validateReferralCodeBeforeSubmit(submission.referral_code);

  const result = await insertSubmissionWithCompatibility({
    ...submission,
    user_id: user.id,
    onboarding_key: normalized.onboardingKey,
  });

  clearPendingOnboardingPayload();

  return {
    duplicate: Boolean(result && "duplicate" in result && result.duplicate),
    submissionId: result?.id ?? null,
  };
};

export const resumePendingOnboarding = async () => {
  const pendingPayload = loadPendingOnboardingPayload();
  if (!pendingPayload) return null;
  return finalizeAuthenticatedSubmission(pendingPayload);
};

const mapCurrentOnboardingActivation = (value: unknown): CurrentOnboardingActivation | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const submission = record.submission as Record<string, unknown> | undefined;
  if (
    typeof record.id !== "string" ||
    typeof record.batch_id !== "string" ||
    typeof record.status !== "string" ||
    typeof record.source_submission_id !== "string" ||
    typeof record.email_normalized !== "string" ||
    !submission
  ) {
    return null;
  }

  return {
    id: record.id,
    batchId: record.batch_id,
    status: record.status,
    sourceSubmissionId: record.source_submission_id,
    emailNormalized: record.email_normalized,
    inviteSentAt: typeof record.invite_sent_at === "string" ? record.invite_sent_at : null,
    activatedAt: typeof record.activated_at === "string" ? record.activated_at : null,
    submission: {
      fullname: typeof submission.fullname === "string" ? submission.fullname : "",
      email: typeof submission.email === "string" ? submission.email : "",
      country: typeof submission.country === "string" ? submission.country : "",
      city: typeof submission.city === "string" ? submission.city : "",
      business: typeof submission.business === "string" ? submission.business : "",
      field: typeof submission.field === "string" ? submission.field : "",
      referralCode: typeof submission.referral_code === "string" ? submission.referral_code : "",
      referralSource: typeof submission.referral_source === "string" ? submission.referral_source : "",
    },
  };
};

export const getCurrentOnboardingActivation = async () => {
  const { data, error } = await supabase.rpc("get_current_profile_onboarding_activation");
  if (error) throw error;
  return mapCurrentOnboardingActivation(data);
};

export const activateCurrentOnboardingProfile = async (draft: ActivationDraftInput) => {
  const trimmedFullName = draft.fullName.trim();
  const trimmedCountry = draft.country.trim();
  const trimmedCity = draft.city.trim();
  const trimmedBusiness = draft.businessOrOrganization.trim();
  const trimmedInterest = draft.interestFocus.trim();
  const trimmedReferralCode = draft.referralCode.trim().toUpperCase();
  const trimmedReferralSource = draft.referralSource.trim();

  if (!trimmedFullName || !trimmedCountry || !trimmedCity) {
    throw new Error("Ad Soyad, ulke ve sehir gerekli.");
  }

  await updateProfileAttribute("full_name", trimmedFullName, "public");
  await updateProfileAttribute("country", trimmedCountry, "public");
  await updateProfileAttribute("city", trimmedCity, "public");

  if (trimmedBusiness) {
    await updateProfileAttribute("business_or_organization", trimmedBusiness, draft.businessVisibility);
  }

  if (trimmedInterest) {
    await updateProfileAttribute("interest_focus", trimmedInterest, draft.interestVisibility);
  }

  if (trimmedReferralCode) {
    await updateProfileAttribute("referral_code", trimmedReferralCode, "private");
  }

  if (trimmedReferralSource) {
    await updateProfileAttribute("referral_source", trimmedReferralSource, "private");
  }

  const { data, error } = await supabase.rpc("complete_current_profile_onboarding_activation");
  if (error) throw error;
  return data;
};

export const resendCurrentOnboardingActivationLink = async (email: string) => {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    throw new Error("E-posta bulunamadi.");
  }

  const redirectTo = `${window.location.origin}/welcome/activate`;
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectTo,
    },
  });

  if (error) throw error;
};

export type PendingOnboardingStoragePreview = NormalizedPendingOnboardingPayload;
