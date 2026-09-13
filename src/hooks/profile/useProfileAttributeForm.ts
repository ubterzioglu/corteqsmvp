import { useEffect, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";
import type {
  AttributeVisibility,
  CurrentUserProfilePayload,
  ProfileAttributeState,
} from "@/lib/member-profile";
import {
  updateProfileAttribute,
  upsertIndividualProfileDetailsPatch,
  type IndividualProfileDetailsRow,
  type MyReferralCodeUsage,
} from "@/lib/member-profile-api";
import { mapAttributeDraftValue, readDraftText } from "@/lib/profile-attribute-drafts";
import {
  JOB_SEEKING_OPT_IN_ATTRIBUTE_KEY,
  LINKEDIN_ATTRIBUTE_KEY,
  MOVING_SOON_OPT_IN_ATTRIBUTE_KEY,
  REFERRAL_CODE_ATTRIBUTE_KEY,
  VOLUNTEER_MENTORSHIP_OPT_IN_ATTRIBUTE_KEY,
  WEBSITE_ATTRIBUTE_KEY,
  type DraftValueMap,
  type DraftVisibilityMap,
} from "@/lib/profile-attribute-keys";
import { PHONE_ATTRIBUTE_KEY, PHONE_INVALID_MESSAGE, normalizePhoneE164 } from "@/lib/profile-phone";
import { SOCIAL_ATTRIBUTE_KEYS, ensureHttpsUrl, normalizeSocialMediaValue } from "@/lib/profile-social-links";

export type GroupedProfileAttributes = {
  common: ProfileAttributeState[];
  socialMedia: ProfileAttributeState[];
  roleSpecific: ProfileAttributeState[];
};

export type UseProfileAttributeFormParams = {
  /** Taslakların tohumlandığı kaynak; null iken mevcut taslak korunur. */
  profile: CurrentUserProfilePayload | null;
  groupedAttributes: GroupedProfileAttributes;
  phoneAttribute: ProfileAttributeState | null;
  /** B12: kilitli referral kodu toplu kayıtta tekrar gönderilmez. */
  myReferralUsage: MyReferralCodeUsage | null;
  isIndividualProfile: boolean;
  userId: string | undefined;
  refreshProfile: () => Promise<void>;
};

export type UseProfileAttributeFormResult = {
  draftValues: DraftValueMap;
  draftVisibilities: DraftVisibilityMap;
  commonAttributesAllVisible: boolean;
  socialMediaAllVisible: boolean;
  phoneError: string | null;
  savingAttributeKey: string | null;
  savingCommonAttributes: boolean;
  savingSocialMedia: boolean;
  savingRoleSpecificAttributes: boolean;
  savingPreferenceKey: string | null;
  handleDraftChange: (attributeKey: string, nextValue: string | boolean) => void;
  handleDraftVisibilityChange: (attributeKey: string, nextVisibility: AttributeVisibility) => void;
  handlePhoneDraftChange: (nextValue: string) => void;
  handleCommonAllVisibleChange: (checked: boolean) => void;
  handleSocialAllVisibleChange: (checked: boolean) => void;
  handleSaveAttribute: (attribute: ProfileAttributeState) => Promise<void>;
  handleSavePhone: () => Promise<void>;
  handleSaveCommonAttributes: () => Promise<void>;
  handleSaveSocialMedia: () => Promise<void>;
  handleSaveRoleSpecificAttributes: () => Promise<void>;
  handleSavePreferenceToggle: (attributeKey: string, checked: boolean) => Promise<void>;
  handleSaveLinkCard: (attribute: ProfileAttributeState) => Promise<void>;
};

/**
 * Profil formunun tamamı: taslak değer/görünürlük durumu ve tüm kaydetme akışları.
 *
 * Sayfa yalnız sunumu kurar; hangi alanın nasıl normalize edilip hangi RPC'ye
 * gittiği burada tek yerde durur.
 */
export const useProfileAttributeForm = ({
  profile,
  groupedAttributes,
  phoneAttribute,
  myReferralUsage,
  isIndividualProfile,
  userId,
  refreshProfile,
}: UseProfileAttributeFormParams): UseProfileAttributeFormResult => {
  const { toast } = useToast();
  const [draftValues, setDraftValues] = useState<DraftValueMap>({});
  const [draftVisibilities, setDraftVisibilities] = useState<DraftVisibilityMap>({});
  const [socialMediaAllVisible, setSocialMediaAllVisible] = useState(true);
  const [commonAttributesAllVisible, setCommonAttributesAllVisible] = useState(true);
  const [savingAttributeKey, setSavingAttributeKey] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [savingCommonAttributes, setSavingCommonAttributes] = useState(false);
  const [savingSocialMedia, setSavingSocialMedia] = useState(false);
  const [savingRoleSpecificAttributes, setSavingRoleSpecificAttributes] = useState(false);
  const [savingPreferenceKey, setSavingPreferenceKey] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const nextValues: DraftValueMap = {};
    const nextVisibilities: DraftVisibilityMap = {};
    for (const attribute of profile.attributes) {
      nextValues[attribute.attributeKey] = mapAttributeDraftValue(attribute);
      nextVisibilities[attribute.attributeKey] = attribute.visibility;
    }
    setDraftValues(nextValues);
    setDraftVisibilities(nextVisibilities);
  }, [profile]);

  // Grup toggle'larını yüklenen profilin gerçek görünürlüğünden türet: bir grup
  // "public" sayılır ancak ve ancak gruptaki TÜM alanlar public ise. Aksi halde
  // toggle "public" gösterip public profil göstermez (görünürlük tutarsızlığı).
  // Boş grupları tutars (varsayılan açık) — kullanıcının ilk dolduruşunu engellemez.
  useEffect(() => {
    setCommonAttributesAllVisible(
      groupedAttributes.common.length === 0 ||
        groupedAttributes.common.every((attribute) => attribute.visibility === "public"),
    );
    setSocialMediaAllVisible(
      groupedAttributes.socialMedia.length === 0 ||
        groupedAttributes.socialMedia.every((attribute) => attribute.visibility === "public"),
    );
  }, [groupedAttributes]);

  const handleDraftChange = (attributeKey: string, nextValue: string | boolean) => {
    setDraftValues((current) => ({ ...current, [attributeKey]: nextValue }));
  };

  const handleDraftVisibilityChange = (attributeKey: string, nextVisibility: AttributeVisibility) => {
    setDraftVisibilities((current) => ({ ...current, [attributeKey]: nextVisibility }));
  };

  const handlePhoneDraftChange = (nextValue: string) => {
    if (phoneError) setPhoneError(null);
    handleDraftChange(PHONE_ATTRIBUTE_KEY, nextValue);
  };

  const setGroupVisibility = (attributes: ProfileAttributeState[], checked: boolean) => {
    setDraftVisibilities((current) => {
      const updated = { ...current };
      attributes.forEach((attribute) => {
        updated[attribute.attributeKey] = checked ? "public" : "private";
      });
      return updated;
    });
  };

  const handleCommonAllVisibleChange = (checked: boolean) => {
    setCommonAttributesAllVisible(checked);
    setGroupVisibility(groupedAttributes.common, checked);
  };

  const handleSocialAllVisibleChange = (checked: boolean) => {
    setSocialMediaAllVisible(checked);
    setGroupVisibility(groupedAttributes.socialMedia, checked);
  };

  const buildAttributePayload = (attribute: ProfileAttributeState) => {
    const rawValue = draftValues[attribute.attributeKey];
    const visibility = draftVisibilities[attribute.attributeKey] ?? attribute.visibility;

    // Her dal boolean, string[] veya string üretir — hepsi geçerli Json.
    // `unknown` yazmak RPC imzasıyla uyuşmuyordu (unknown Json'a atanamaz).
    let valueToSend: Json = rawValue ?? null;
    if (attribute.dataType === "boolean") {
      valueToSend = Boolean(rawValue);
    } else if (attribute.dataType === "multi_select") {
      valueToSend = String(rawValue ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      const textValue = String(rawValue ?? "").trim();
      valueToSend = SOCIAL_ATTRIBUTE_KEYS.has(attribute.attributeKey) || attribute.attributeKey === LINKEDIN_ATTRIBUTE_KEY
        ? normalizeSocialMediaValue(attribute.attributeKey, textValue)
        : attribute.attributeKey === WEBSITE_ATTRIBUTE_KEY && textValue
          ? ensureHttpsUrl(textValue)
        : textValue;
    }

    return { valueToSend, visibility };
  };

  const handleSaveAttribute = async (attribute: ProfileAttributeState) => {
    const { valueToSend, visibility } = buildAttributePayload(attribute);

    if (attribute.dataType !== "boolean") {
      const textValue = String(valueToSend ?? "").trim();
      if (!textValue) {
        toast({
          title: "Alan boş",
          description: `${attribute.label} alanını doldurmadan kaydedemezsiniz.`,
          variant: "destructive",
        });
        return;
      }
    }

    setSavingAttributeKey(attribute.attributeKey);
    try {
      const result = (await updateProfileAttribute(attribute.attributeKey, valueToSend, visibility)) as { status?: string } | null;
      await refreshProfile();
      toast({
        title: result?.status === "pending" ? "Onay Bekliyor" : "Alan Güncellendi",
        description:
          result?.status === "pending"
            ? `${attribute.label} değişikliği admin onay kuyruğuna alındı.`
            : `${attribute.label} kaydedildi.`,
      });
    } catch (error) {
      toast({
        title: "Alan kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingAttributeKey(null);
    }
  };

  // WS1 madde 1: telefon her zaman private yazılır; biçim E.164'e indirgenir.
  // Ülke bilgisi numaradan TÜRETİLMEZ (madde 10) — yalnız biçim doğrulanır.
  const handleSavePhone = async () => {
    if (!phoneAttribute) return;
    const normalized = normalizePhoneE164(readDraftText(draftValues, PHONE_ATTRIBUTE_KEY));
    if (!normalized) {
      setPhoneError(PHONE_INVALID_MESSAGE);
      return;
    }

    setPhoneError(null);
    setSavingAttributeKey(PHONE_ATTRIBUTE_KEY);
    try {
      await updateProfileAttribute(PHONE_ATTRIBUTE_KEY, normalized, "private");
      handleDraftChange(PHONE_ATTRIBUTE_KEY, normalized);
      await refreshProfile();
      toast({
        title: "Telefon kaydedildi",
        description: "Numaran yalnız sana ve yöneticilere görünür; herkese açık profilde gösterilmez.",
      });
    } catch (error) {
      toast({
        title: "Telefon kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingAttributeKey(null);
    }
  };

  const handleSaveCommonAttributes = async () => {
    if (!groupedAttributes.common.length) return;

    const attributesToSave = groupedAttributes.common.filter((attribute) => {
      const rawValue = draftValues[attribute.attributeKey];
      if (attribute.dataType === "boolean") return true;
      const textValue = String(rawValue ?? "").trim();
      return textValue.length > 0;
    });

    if (!attributesToSave.length) {
      toast({ title: "Kaydedilecek alan bulunamadı", description: "En az bir ortak alanı doldurun." });
      return;
    }

    setSavingCommonAttributes(true);
    try {
      for (const attribute of attributesToSave) {
        const { valueToSend, visibility } = buildAttributePayload(attribute);
        await updateProfileAttribute(attribute.attributeKey, valueToSend, visibility);
      }

      await refreshProfile();
      toast({
        title: "Ortak profil alanları kaydedildi",
        description: "İsim, konum, biyografi ve görünürlük ayarları güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Ortak alanlar kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingCommonAttributes(false);
    }
  };

  const handleSaveSocialMedia = async () => {
    if (!groupedAttributes.socialMedia.length) return;

    setSavingSocialMedia(true);
    try {
      for (const attribute of groupedAttributes.socialMedia) {
        const rawValue = String(draftValues[attribute.attributeKey] ?? "").trim();
        if (!rawValue) continue;
        const normalizedValue = normalizeSocialMediaValue(attribute.attributeKey, rawValue);
        const visibility = draftVisibilities[attribute.attributeKey] ?? attribute.visibility;
        await updateProfileAttribute(attribute.attributeKey, normalizedValue, visibility);
      }

      await refreshProfile();
      toast({
        title: "Sosyal medya alanları kaydedildi",
        description: "Bağlantılar ve görünürlük ayarları güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Sosyal medya alanları kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingSocialMedia(false);
    }
  };

  const handleSaveRoleSpecificAttributes = async () => {
    if (!groupedAttributes.roleSpecific.length) return;

    const attributesToSave = groupedAttributes.roleSpecific.filter((attribute) => {
      // Kilitli referral kodu tekrar gönderilmez — UI'da zaten salt-okunur (B12).
      if (attribute.attributeKey === REFERRAL_CODE_ATTRIBUTE_KEY && myReferralUsage) return false;
      const rawValue = draftValues[attribute.attributeKey];
      if (attribute.dataType === "boolean") return true;
      return String(rawValue ?? "").trim().length > 0;
    });

    if (!attributesToSave.length) {
      toast({
        title: "Kaydedilecek alan bulunamadı",
        description: "En az bir rolüne özel alanı doldurun.",
      });
      return;
    }

    // Hata-toleranslı döngü (B12): bir alanın hatası diğerlerini engellemez; hatalar
    // toplanır, kalanlar kaydedilir, sonda tek özet toast gösterilir. (Eski davranış
    // ilk hatada tüm kaydı çökertiyordu — referral 42501 regresyonunun ikinci yarısı.)
    setSavingRoleSpecificAttributes(true);
    const failures: string[] = [];
    let savedCount = 0;
    try {
      for (const attribute of attributesToSave) {
        try {
          const { valueToSend, visibility } = buildAttributePayload(attribute);
          await updateProfileAttribute(attribute.attributeKey, valueToSend, visibility);
          savedCount += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
          failures.push(`${attribute.label}: ${message}`);
        }
      }

      if (savedCount > 0) {
        await refreshProfile();
      }

      if (failures.length === 0) {
        toast({
          title: "Rolüne özel alanlar kaydedildi",
          description: "Yeni bireysel onboarding alanları ve diğer rol özel alanlar güncellendi.",
        });
      } else {
        toast({
          title: savedCount > 0
            ? `${savedCount} alan kaydedildi, ${failures.length} alan kaydedilemedi`
            : "Rolüne özel alanlar kaydedilemedi",
          description: failures.join(" · "),
          variant: "destructive",
        });
      }
    } finally {
      setSavingRoleSpecificAttributes(false);
    }
  };

  const patchIndividualProfileDetails = async (
    patchBuilder: (current: IndividualProfileDetailsRow | null) => Record<string, unknown>,
  ) => {
    if (!userId || !isIndividualProfile) return;
    await upsertIndividualProfileDetailsPatch(userId, patchBuilder);
  };

  const handleSavePreferenceToggle = async (attributeKey: string, checked: boolean) => {
    setSavingPreferenceKey(attributeKey);
    try {
      await updateProfileAttribute(attributeKey, checked, "public");

      if (attributeKey === JOB_SEEKING_OPT_IN_ATTRIBUTE_KEY) {
        await patchIndividualProfileDetails(() => ({
          job_seeking: checked,
        }));
      }

      if (attributeKey === MOVING_SOON_OPT_IN_ATTRIBUTE_KEY) {
        await patchIndividualProfileDetails((current) => {
          const existingDetailCard =
            current?.detail_card && typeof current.detail_card === "object" ? current.detail_card : {};
          const existingRelocation =
            existingDetailCard.relocation && typeof existingDetailCard.relocation === "object"
              ? (existingDetailCard.relocation as Record<string, unknown>)
              : {};

          return {
            detail_card: {
              ...existingDetailCard,
              relocation: {
                ...existingRelocation,
                enabled: checked,
              },
            },
          };
        });
      }

      if (attributeKey === VOLUNTEER_MENTORSHIP_OPT_IN_ATTRIBUTE_KEY) {
        await patchIndividualProfileDetails(() => ({
          mentor_opt_in: checked,
        }));
      }

      await refreshProfile();
      toast({
        title: "Tercih güncellendi",
        description: checked ? "Profil tercihi görünür oldu." : "Profil tercihi kapatıldı.",
      });
    } catch (error) {
      toast({
        title: "Tercih kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingPreferenceKey(null);
    }
  };

  const handleSaveLinkCard = async (attribute: ProfileAttributeState) => {
    const { valueToSend, visibility } = buildAttributePayload(attribute);
    const normalizedValue = typeof valueToSend === "string" ? valueToSend : String(valueToSend ?? "");

    setSavingAttributeKey(attribute.attributeKey);
    try {
      await updateProfileAttribute(attribute.attributeKey, normalizedValue, visibility);

      if (attribute.attributeKey === LINKEDIN_ATTRIBUTE_KEY) {
        await patchIndividualProfileDetails((current) => {
          const frontCard =
            current?.front_card && typeof current.front_card === "object" ? current.front_card : {};
          const profileSettings =
            current?.profile_settings && typeof current.profile_settings === "object" ? current.profile_settings : {};

          return {
            front_card: {
              ...frontCard,
              linkedin_url: normalizedValue || null,
              linkedin_visible: visibility === "public",
            },
            profile_settings: {
              ...profileSettings,
              linkedin: normalizedValue || "",
            },
          };
        });
      }

      if (attribute.attributeKey === WEBSITE_ATTRIBUTE_KEY) {
        await patchIndividualProfileDetails((current) => {
          const profileSettings =
            current?.profile_settings && typeof current.profile_settings === "object" ? current.profile_settings : {};

          return {
            profile_settings: {
              ...profileSettings,
              website_links: normalizedValue ? [normalizedValue] : [],
              websites: normalizedValue ? [normalizedValue] : [],
            },
          };
        });
      }

      await refreshProfile();
      toast({
        title: "Bağlantı kaydedildi",
        description: `${attribute.label} güncellendi.`,
      });
    } catch (error) {
      toast({
        title: "Bağlantı kaydedilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingAttributeKey(null);
    }
  };

  return {
    draftValues,
    draftVisibilities,
    commonAttributesAllVisible,
    socialMediaAllVisible,
    phoneError,
    savingAttributeKey,
    savingCommonAttributes,
    savingSocialMedia,
    savingRoleSpecificAttributes,
    savingPreferenceKey,
    handleDraftChange,
    handleDraftVisibilityChange,
    handlePhoneDraftChange,
    handleCommonAllVisibleChange,
    handleSocialAllVisibleChange,
    handleSaveAttribute,
    handleSavePhone,
    handleSaveCommonAttributes,
    handleSaveSocialMedia,
    handleSaveRoleSpecificAttributes,
    handleSavePreferenceToggle,
    handleSaveLinkCard,
  };
};
