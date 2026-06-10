// Cadde 3.0 kural katmanı — DB tarafındaki can_post_kopru / is_cadde_profile_complete
// fonksiyonlarının TS aynası. GERÇEK enforce DB'dedir (security definer RPC + RLS);
// buradaki fonksiyonlar UI guard'ları ve truth-table testleri içindir.
// SQL kaynağı: supabase/migrations/20260610182000_cadde300_003_actor_context.sql

export type CaddeMissingGateField = "country" | "city" | "phone_verification";

export type CaddeActorContext = {
  userId: string | null;
  roleKey: string | null;
  featureKeys: ReadonlySet<string>;
  country: string | null;
  city: string | null;
  phoneE164: string | null;
  phoneVerifiedAt: string | null;
  isPhoneVerified: boolean;
  phoneRequired: boolean;
  isTRResident: boolean;
  isDiasporaResident: boolean;
  indivRelocating: boolean;
  digitalCommunityEnabled: boolean;
  profilePublic: boolean;
  missingGateFields: CaddeMissingGateField[];
  canEnterCadde: boolean;
  canPostCadde: boolean;
  canPostKopru: boolean;
};

// TR "bireysel" sayılan flat roller; geri kalan tüm roller kurumsal aktör kuralına tabidir
// (User_CityAmbassador ve User_BloggerVlogger dahil). SQL ile birebir aynı liste.
const INDIVIDUAL_ROLE_KEYS: ReadonlySet<string> = new Set([
  "User_Standard",
  "User_DiasporaMember",
  "User_Contributor",
]);

export function isIndividualRoleKey(roleKey: string | null): boolean {
  return roleKey !== null && INDIVIDUAL_ROLE_KEYS.has(roleKey);
}

export type CaddeGateInput = {
  country: string | null;
  city: string | null;
  phoneRequired: boolean;
  isPhoneVerified: boolean;
};

export function computeMissingGateFields(input: CaddeGateInput): CaddeMissingGateField[] {
  const missing: CaddeMissingGateField[] = [];
  if (!input.country?.trim()) missing.push("country");
  if (!input.city?.trim()) missing.push("city");
  if (input.phoneRequired && !input.isPhoneVerified) missing.push("phone_verification");
  return missing;
}

export type KopruRuleInput = {
  isAdminOrModerator: boolean;
  profileComplete: boolean;
  hasBridgeFeature: boolean;
  isDiasporaResident: boolean;
  isTRResident: boolean;
  isIndividualRole: boolean;
  indivRelocating: boolean;
  digitalCommunityEnabled: boolean;
};

/** CKS §7.2 Köprü paylaşım truth table'ı — public.can_post_kopru ile birebir. */
export function canPostKopruRule(input: KopruRuleInput): boolean {
  if (input.isAdminOrModerator) return true;
  if (!input.profileComplete) return false;
  if (!input.hasBridgeFeature) return false;
  if (input.isDiasporaResident) return true;
  if (!input.isTRResident) return false;
  if (input.isIndividualRole) return input.indivRelocating;
  return input.digitalCommunityEnabled;
}

export type CaddePostRuleInput = {
  profileComplete: boolean;
  hasPostCreateFeature: boolean;
};

/** public.can_post_cadde ile birebir. */
export function canPostCaddeRule(input: CaddePostRuleInput): boolean {
  return input.profileComplete && input.hasPostCreateFeature;
}

const MISSING_FIELD_LABELS: Record<CaddeMissingGateField, string> = {
  country: "Ülke",
  city: "Şehir",
  phone_verification: "Telefon Doğrulaması",
};

export function missingGateFieldLabel(field: CaddeMissingGateField): string {
  return MISSING_FIELD_LABELS[field];
}

// RPC'lerin sabit hata kodları → kullanıcı dostu Türkçe mesaj (spec §23).
const CADDE_RPC_ERROR_MESSAGES: Record<string, string> = {
  cadde_auth_required: "Bu işlem için giriş yapın.",
  cadde_profile_incomplete: "Caddeye paylaşım için önce profilinde ülke ve şehir bilgini tamamla.",
  phone_verification_required: "Bu işlem için telefon doğrulaması gerekiyor.",
  cadde_post_permission_denied: "Hesabının Cadde paylaşım yetkisi bulunmuyor.",
  cadde_bridge_permission_denied: "Köprü akışına paylaşım yetkin bulunmuyor. Profil ayarlarından Köprü koşullarını kontrol et.",
  cadde_tr_scope_restricted: "Türkiye yerleşik üyeler normal Cadde'de yalnız Türkiye kapsamına paylaşabilir. Ülke filtresini Türkiye seç veya Köprü modunu kullan.",
  cadde_invalid_post_type: "Geçersiz paylaşım tipi.",
  cadde_invalid_body: "Paylaşım metni 1-4000 karakter olmalı.",
  cadde_invalid_title: "Başlık en fazla 160 karakter olabilir.",
  cadde_rate_limit: "Çok hızlı işlem yapıyorsun. Lütfen biraz bekleyip tekrar dene.",
  cadde_banned: "Hesabın Cadde'de kısıtlanmış durumda.",
};

/** Supabase RPC hatasını kullanıcıya gösterilebilir mesaja çevirir. */
export function resolveCaddeRpcErrorMessage(error: unknown, fallback = "İşlem tamamlanamadı. Lütfen tekrar dene."): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  for (const [code, message] of Object.entries(CADDE_RPC_ERROR_MESSAGES)) {
    if (raw.includes(code)) return message;
  }
  return fallback;
}

/** RPC'den dönen jsonb'yi güvenli biçimde CaddeActorContext'e çevirir. */
export function mapActorContext(raw: unknown): CaddeActorContext | null {
  if (raw === null || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;

  const str = (key: string): string | null => (typeof value[key] === "string" ? (value[key] as string) : null);
  const bool = (key: string): boolean => value[key] === true;

  const featureKeys = new Set<string>(
    Array.isArray(value.featureKeys) ? (value.featureKeys as unknown[]).filter((k): k is string => typeof k === "string") : [],
  );
  const missingGateFields = (Array.isArray(value.missingGateFields) ? (value.missingGateFields as unknown[]) : [])
    .filter((f): f is CaddeMissingGateField => f === "country" || f === "city" || f === "phone_verification");

  return {
    userId: str("userId"),
    roleKey: str("roleKey"),
    featureKeys,
    country: str("country"),
    city: str("city"),
    phoneE164: str("phoneE164"),
    phoneVerifiedAt: str("phoneVerifiedAt"),
    isPhoneVerified: bool("isPhoneVerified"),
    phoneRequired: bool("phoneRequired"),
    isTRResident: bool("isTRResident"),
    isDiasporaResident: bool("isDiasporaResident"),
    indivRelocating: bool("indivRelocating"),
    digitalCommunityEnabled: bool("digitalCommunityEnabled"),
    profilePublic: value.profilePublic !== false,
    missingGateFields,
    canEnterCadde: bool("canEnterCadde"),
    canPostCadde: bool("canPostCadde"),
    canPostKopru: bool("canPostKopru"),
  };
}
