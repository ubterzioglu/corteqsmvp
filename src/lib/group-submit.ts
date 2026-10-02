// G18 · S1 formunun motor tipleri + istemcileri — TEK KAYNAK.
//
// Kaynaklar: `docs/dijital-gruplar/01_politika_v1.1.md` §2 (form alanları),
// §5 (7 kategori — "Diğer" YOK), §10 (Grup Sözü) · `02_motor-tasarimi.md` §3.A
// (ekleme akışı). Sunucu kapısı `submit_group_v1` (migration 20261002080000),
// önizleme `group-preview` edge fonksiyonu. Sözleşme testleri:
// `src/lib/group-submit.test.ts` (birim) + `src/lib/group-submit-schema.test.ts`
// (migration + edge kilidi).
//
// ⚠️ types.ts regen BORCU (G12): `submit_group_v1` üretilmiş tiplerde YOK —
// `as never` deseni bilinçli (emsal: brainstorming-api.ts:347). Regen
// geldiğinde (kullanıcı login'i gerek) bu dosya tip kazanır.
import { supabase } from "@/integrations/supabase/client";

/** Politika §5 — 7 kategori, birebir etiketler. "Diğer" YOKTUR. */
export const MOTOR_CATEGORIES = [
  { value: "sehir-yasam", label: "Şehir & Yaşam" },
  { value: "meslek-kariyer", label: "Meslek & Kariyer" },
  { value: "is-girisim", label: "İş & Girişim" },
  { value: "alumni-akademik", label: "Alumni & Akademik" },
  { value: "dayanisma-yardim", label: "Dayanışma & Yardım" },
  // Politika §5 + kırmızı çizgi 6: Aile & Çocuk YALNIZ Seviye-2 doğrulanmış
  // kuruluşlara açık. Seviye sistemi G06/K09'da — o gelene dek KİLİTLİ
  // (sunucu da reddeder: group_submit_category_locked).
  { value: "aile-cocuk", label: "Aile & Çocuk", locked: true },
  { value: "hobi-kultur", label: "Hobi & Kültür" },
] as const;

export type MotorCategory = (typeof MOTOR_CATEGORIES)[number]["value"];

/** Politika §10 — formda BİREBİR gösterilir (kısaltma/yeniden yazım YASAK). */
export const GROUP_PLEDGE_TEXT =
  "CorteQS'te listelenen her grubun çalışan bir linki ve belirli bir amacı vardır. " +
  "Grup sahibi istemezse grubu 24 saat içinde kaldırırız. Vize, oturum veya belge satan, " +
  "yatırım vaat eden ya da kişisel veri isteyen grupları yayınlamayız. Grup sayfasındaki " +
  "gönderiler önce grup yöneticisinin, sonra ekibimizin onayından geçer. Telefon numaranızı " +
  "hiçbir grup sahibiyle veya üçüncü kişiyle paylaşmayız.";

export type MotorPlatform = "whatsapp" | "telegram" | "discord";

/**
 * Tasarım §3.A adım 2: platform linkten türetilir, BAŞKA ALAN ADI REDDEDİLİR.
 * Şema-çıpalı desenler `group-preview/index.ts` ve `submit_group_v1` ile
 * birebir aynıdır (üçü de sözleşme testiyle kilitli — biri kayarsa test düşer).
 */
export function detectMotorPlatform(url: string): MotorPlatform | null {
  const link = url.trim();
  if (/^https?:\/\/chat\.whatsapp\.com\//i.test(link)) return "whatsapp";
  if (/^https?:\/\/(t\.me|telegram\.me)\//i.test(link)) return "telegram";
  if (/^https?:\/\/(discord\.gg|discord\.com\/invite)\//i.test(link)) return "discord";
  return null;
}

export const MOTOR_PLATFORM_LABELS: Record<MotorPlatform, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  discord: "Discord",
};

/** `submit_group_v1` raise kodları → Türkçe kullanıcı mesajı. */
export const GROUP_SUBMIT_ERROR_MESSAGES: Record<string, string> = {
  group_submit_auth_required: "Grup eklemek için giriş yapmalısınız.",
  group_submit_pledge_required: "Grup Sözü onayı zorunludur.",
  group_submit_admin_answer_required: "\"Bu grubun admini misin?\" sorusunu yanıtlayın.",
  group_submit_name_required: "Grup adı zorunludur.",
  group_submit_description_required: "Kısa açıklama zorunludur.",
  group_submit_description_too_long: "Kısa açıklama en fazla 160 karakter olabilir.",
  group_submit_invalid_category: "Geçerli bir kategori seçin.",
  group_submit_category_locked:
    "Aile & Çocuk kategorisi şu anda kapalı — yakında doğrulanmış kuruluşlara açılacak.",
  group_submit_link_unsupported:
    "Yalnızca WhatsApp, Telegram ve Discord davet linkleri destekleniyor.",
  group_submission_banned: "Grup ekleme yetkiniz askıya alınmış. Ekiple iletişime geçin.",
  group_submit_rate_limited: "Günlük grup gönderim sınırına ulaştınız (günde en fazla 5).",
  group_submit_country_not_found: "Ülke katalogda bulunamadı — listeden seçin.",
  group_submit_city_required: "Global olmayan grup için şehir zorunludur.",
  group_submit_city_not_found: "Şehir katalogda bulunamadı — listeden seçin.",
};

export interface GroupSubmitParams {
  link: string;
  groupName: string;
  category: MotorCategory;
  shortDescription: string;
  countryCode: string;
  cityId: string | null;
  isGlobal: boolean;
  claimsAdmin: boolean;
  pledgeAccepted: boolean;
  heroImage?: string | null;
}

export type GroupSubmitResult =
  | {
      result: "submitted";
      landing_id: string;
      slug: string;
      listing_status: string;
      ownership: string;
      review_flagged: boolean;
    }
  | {
      result: "already_listed";
      landing_id: string;
      slug: string;
      group_name: string;
      ownership: string;
      listing_status: string;
    };

/** Gönderim: TEK kapı `submit_group_v1` (doğrudan tabloya insert YOK). */
export async function submitGroupV1(params: GroupSubmitParams): Promise<GroupSubmitResult> {
  const { data, error } = await supabase.rpc("submit_group_v1" as never, {
    p_link: params.link.trim(),
    p_group_name: params.groupName,
    p_category: params.category,
    p_short_description: params.shortDescription,
    p_country_code: params.countryCode,
    p_city_id: params.cityId,
    p_is_global: params.isGlobal,
    p_claims_admin: params.claimsAdmin,
    p_pledge_accepted: params.pledgeAccepted,
    p_hero_image: params.heroImage ?? null,
  } as never);

  if (error) {
    // RPC hataları DÜZ NESNE — instanceof Error ile daraltma YOK; message
    // raise kodunu taşır (KR03/G serisi deseni).
    const message = GROUP_SUBMIT_ERROR_MESSAGES[error.message] ?? "Grup gönderilemedi. Lütfen tekrar deneyin.";
    throw new Error(message);
  }

  return data as GroupSubmitResult;
}

export type GroupPreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "unsupported" }
  | { status: "failed"; message: string }
  | { status: "done"; data: GroupPreviewData };

/**
 * Önizleme sonucu gönderimi blokluyor mu: kesin ölü link (`invalid`) veya
 * zaten listede (`exists`). `unknown`/`failed` BLOKLAMAZ — tasarım §3.A adım 4:
 * form önizlemeye asla takılmaz (politika §2 "davet sayfası açılıyor mu"
 * kontrolünün istemci yakası yalnız kesin kanıtta durur).
 */
export function previewBlocksSubmit(preview: GroupPreviewState): boolean {
  if (preview.status !== "done") return false;
  if (preview.data.exists) return true;
  return preview.data.read_result === "invalid";
}

export interface GroupPreviewData {
  exists: boolean;
  // exists=true
  slug?: string;
  group_name?: string;
  ownership?: string;
  listing_status?: string;
  // exists=false
  platform?: MotorPlatform;
  read_result?: "ok" | "invalid" | "unknown";
  name?: string | null;
  description?: string | null;
  image_url?: string | null;
}

/**
 * Önizleme: `group-preview` edge (tasarım §3.A 3-4). Girişli kullanıcı ister
 * (form zaten girişe bağlı); link YANITA yazılmaz (G08 kural 8 — sunucu da
 * döndürmez). Başarısızlık formu ASLA bloklamaz — `unknown`'da alanlar elle
 * doldurulur; yalnız `invalid` (kesin ölü link) gönderimi durdurur (politika §2
 * "davet sayfası açılıyor mu" kontrolü).
 */
export async function fetchGroupPreview(url: string): Promise<GroupPreviewData> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Önizleme için giriş yapmalısınız.");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const response = await fetch(`${supabaseUrl}/functions/v1/group-preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url: url.trim() }),
  });

  const payload = (await response.json().catch(() => null)) as (GroupPreviewData & { error?: string }) | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Önizleme alınamadı. Lütfen tekrar deneyin.");
  }
  if (!payload) throw new Error("Önizleme alınamadı. Lütfen tekrar deneyin.");
  return payload;
}

export interface MotorLocation {
  countryCode: string;
  cityId: string | null;
}

/**
 * Katalog çözümü: form adlarıyla çalışır (SearchableCountrySelect/CitySelect ad
 * döndürür), motor `country_code` + `city_id` ister (G10; serbest metin konum YOK).
 * Şehir adı ülke içinde `sort_order`'la tekilleştirilir — autocomplete zaten
 * kataloğun kendisinden gelir, eşleşmeme kullanıcı hatasıdır.
 */
export async function resolveMotorLocation(params: {
  countryName: string;
  cityName: string;
  isGlobal: boolean;
}): Promise<MotorLocation> {
  const { data: countryRow, error: countryError } = await supabase
    .from("geo_countries")
    .select("id, code")
    .eq("name", params.countryName.trim())
    .eq("is_active", true)
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  if (countryError) throw new Error("Ülke çözülemedi. Lütfen tekrar deneyin.");
  if (!countryRow) {
    throw new Error(GROUP_SUBMIT_ERROR_MESSAGES.group_submit_country_not_found);
  }

  if (params.isGlobal) {
    return { countryCode: countryRow.code, cityId: null };
  }

  const { data: cityRow, error: cityError } = await supabase
    .from("geo_cities")
    .select("id")
    .eq("name", params.cityName.trim())
    .eq("country_id", countryRow.id)
    .eq("is_active", true)
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  if (cityError) throw new Error("Şehir çözülemedi. Lütfen tekrar deneyin.");
  if (!cityRow) {
    throw new Error(GROUP_SUBMIT_ERROR_MESSAGES.group_submit_city_not_found);
  }

  return { countryCode: countryRow.code, cityId: cityRow.id };
}

/** Yasaklı gönderici ön kontrolü (G15 yardımcısı — form açılışında okunur). */
export async function checkGroupSubmissionBanned(): Promise<boolean> {
  const { data, error } = await supabase.rpc("group_submission_banned" as never, {
    p_user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
  } as never);
  if (error) return false; // ön kontrol sessiz düşer — trigger sunucuda zaten keser
  return data === true;
}
