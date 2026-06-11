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
  // Faz 3 (mig 005-006)
  cadde_invalid_interests: "En fazla 3 geçerli etiket seçebilirsin.",
  cadde_invalid_need_category: "Geçersiz ihtiyaç kategorisi.",
  cadde_admin_required: "Bu işlem yalnız yöneticilere açık.",
  cadde_geo_country_not_found: "Ülke geo kataloğunda bulunamadı.",
  // Faz 4 (mig 008) — Cafe
  cadde_cafe_permission_denied: "Hesabının cafe açma yetkisi bulunmuyor.",
  cadde_cafe_join_permission_denied: "Hesabının cafe katılım yetkisi bulunmuyor.",
  cadde_invalid_cafe_title: "Cafe adı 3-80 karakter olmalı.",
  cadde_invalid_cafe_summary: "Cafe özeti 1-500 karakter olmalı.",
  cadde_invalid_entry_mode: "Geçersiz giriş tipi.",
  cadde_cafe_referral_code_required: "Davet kodlu giriş için en az 4 karakterlik bir kod belirle.",
  cadde_cafe_question_required: "Onaylı giriş için bir giriş sorusu belirle.",
  cadde_invalid_cafe_time: "Cafe bitişi başlangıçtan sonra olmalı.",
  cadde_cafe_duration_exceeded: "Cafe süresi izin verilen üst sınırı aşıyor.",
  cadde_invalid_cafe_capacity: "Kapasite 1'den küçük olamaz.",
  cadde_cafe_not_found: "Cafe bulunamadı.",
  cadde_cafe_archived: "Bu cafe arşivlendi; yeni katılım ve paylaşım kapalı.",
  cadde_cafe_ended: "Bu cafe sona erdi; yeni katılım ve paylaşım kapalı.",
  cadde_cafe_full: "Cafe kapasitesi dolu.",
  cadde_cafe_tr_only: "Bu cafe yalnız Türkiye yerleşik üyelere açık.",
  cadde_cafe_invalid_referral: "Davet kodu geçersiz.",
  cadde_cafe_answer_required: "Katılmak için giriş sorusunu yanıtla.",
  cadde_cafe_join_denied: "Bu cafe'ye katılım talebin daha önce reddedilmiş.",
  cadde_cafe_member_not_found: "Üyelik kaydı bulunamadı.",
  cadde_cafe_not_pending: "Bu üyelik talebi zaten sonuçlanmış.",
  cadde_cafe_owner_required: "Bu işlem yalnız cafe sahibine veya moderatöre açık.",
  cadde_cafe_membership_required: "Bu cafe'de paylaşım için önce odaya katıl.",
};

/** Supabase RPC hatasını kullanıcıya gösterilebilir mesaja çevirir. */
export function resolveCaddeRpcErrorMessage(error: unknown, fallback = "İşlem tamamlanamadı. Lütfen tekrar dene."): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  for (const [code, message] of Object.entries(CADDE_RPC_ERROR_MESSAGES)) {
    if (raw.includes(code)) return message;
  }
  return fallback;
}

// ── Cafe adı moderasyonu (R-05, spec §13.3) ─────────────────────────────────
// Frontend ilk hat: bariz ihlalleri form'da keser. Şüpheli sinyaller Faz 7'de
// moderasyon kuyruğuna da düşecek; buradaki liste kuyruğun yerine geçmez.

export type CafeNameModerationResult = { ok: true } | { ok: false; reason: string };

const CAFE_NAME_BLOCKLIST: ReadonlyArray<RegExp> = [
  /\b(amk|aq|orospu|piç|sik|yarrak|göt|amcık)\b/i, // küfür
  /\b(akp|chp|mhp|hdp|dem\s*parti|iyi\s*parti)\b/i, // parti propagandası
  /\b(porn|porno|escort|bahis|casino|kumar)\b/i, // yetişkin/kumar spam
  /(https?:\/\/|www\.)/i, // ad içinde URL
];

export function moderateCaddeCafeName(name: string): CafeNameModerationResult {
  const trimmed = name.trim();
  if (trimmed.length < 3) return { ok: false, reason: "Cafe adı en az 3 karakter olmalı." };
  if (trimmed.length > 80) return { ok: false, reason: "Cafe adı en fazla 80 karakter olabilir." };
  if (/(.)\1{5,}/.test(trimmed)) return { ok: false, reason: "Cafe adı spam benzeri tekrar içeriyor." };
  for (const pattern of CAFE_NAME_BLOCKLIST) {
    if (pattern.test(trimmed)) {
      return { ok: false, reason: "Cafe adı uygunsuz veya yasaklı içerik barındırıyor." };
    }
  }
  return { ok: true };
}

// ── Cafe giriş kuralı (§7.3) — public.can_join_cadde_cafe'nin TS AYNASI ─────
// GERÇEK enforce DB'dedir; bu fonksiyon UI guard'ları ve truth-table testleri içindir.
// SQL kaynağı: supabase/migrations/20260611100000_cadde300_008_cafe.sql

export type CaddeCafeEntryMode = "open" | "approval" | "referral";

export type CafeJoinRuleInput = {
  isAdminOrModerator: boolean;
  isArchivedOrInactive: boolean;
  hasEnded: boolean;
  capacity: number | null;
  approvedCount: number;
  phoneRequired: boolean;
  isPhoneVerified: boolean;
  isTRCafe: boolean;
  isTRResident: boolean;
  hasTRPhone: boolean;
};

/** Dönüş: null = katılabilir; aksi halde RPC hata kodu (SQL ile birebir sıra). */
export function canJoinCafeRule(input: CafeJoinRuleInput): string | null {
  if (input.isArchivedOrInactive) return "cadde_cafe_archived";
  if (input.hasEnded) return "cadde_cafe_ended";
  if (input.isAdminOrModerator) return null;
  if (input.capacity !== null && input.approvedCount >= input.capacity) return "cadde_cafe_full";
  if (input.phoneRequired && !input.isPhoneVerified) return "phone_verification_required";
  if (input.isTRCafe) {
    if (!input.isTRResident) return "cadde_cafe_tr_only";
    if (input.phoneRequired && !input.hasTRPhone) return "cadde_cafe_tr_only";
  }
  return null;
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
