// G14 · Grup şikayet sistemi — API katmanı (tasarım §3.E, politika §4/§8).
//
// Tek yazma yolu RPC'lerdir (mig 20261005200000): submit_group_report_v1 ·
// review_group_report_v1. Okuma: group_report_state_v1 (düğmenin dürüst metni) ·
// admin_list_group_reports (moderatör kuyruğu — şikayetçi kimliği yalnız admin'e).
// Bileşende doğrudan supabase.from() YOK.
//
// ⚠️ RPC hataları DÜZ NESNEDİR (message/code/details/hint) — instanceof Error ile
// DARALTMA (KR03 dersi). Kod `message` alanında gelir; Türkçe harita çift yönlü
// sözleşme testiyle migration'daki raise kodlarına kilitli.
// ⚠️ types.ts regen BORCU: yeni RPC'ler üretilmiş tiplerde YOK — `as never` deseni.
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { GROUP_MODERATION_ERROR_MESSAGES } from "@/lib/admin-shell/group-moderation-api";

/**
 * Şikayet sebepleri — politika §4'ün 7 kırmızı çizgisi BİREBİR (sıra = kırmızı
 * çizgi numarası) + "Diğer (açıklama zorunlu)". Anahtarlar DB CHECK'iyle aynıdır;
 * etiketler politika metninden alınır (sözleşme testi politika dosyasına kilitler).
 */
export const GROUP_REPORT_REASONS = [
  { key: "link_broken", redline: 1, label: "Link çalışmıyor, grup dolu veya kapalı" },
  {
    key: "visa_slot_sale",
    redline: 2,
    label: "Vize, oturum, çalışma izni, denklik veya randevu slotu satışı ya da \"garantili\" aracılık",
  },
  {
    key: "crypto_mlm_finance",
    redline: 3,
    label: "Kripto sinyal, yatırım kulübü, MLM, garantili getiri, borç/kredi aracılığı",
  },
  {
    key: "personal_data_request",
    redline: 4,
    label: "Katılım için kimlik, pasaport, adres gibi kişisel veri isteme",
  },
  { key: "hate_violence_adult", redline: 5, label: "Nefret, şiddet, taciz veya yetişkin içerik" },
  {
    key: "minors_unverified",
    redline: 6,
    label:
      "Reşit olmayanlara yönelik grup, Seviye 2 doğrulanmış bir kuruluş (okul, dernek, veli birliği) tarafından eklenmemişse",
  },
  {
    key: "political_campaign",
    redline: 7,
    label: "Parti veya seçim kampanyası aracı olan grup",
  },
  { key: "diger", redline: null, label: "Diğer (açıklama zorunlu)" },
] as const;

export type GroupReportReason = (typeof GROUP_REPORT_REASONS)[number]["key"];

const REASON_KEYS = GROUP_REPORT_REASONS.map((reason) => reason.key) as [GroupReportReason, ...GroupReportReason[]];

export const GROUP_REPORT_NOTE_MAX = 1000;

export function groupReportReasonLabel(key: string): string {
  return GROUP_REPORT_REASONS.find((reason) => reason.key === key)?.label ?? key;
}

/** Gönderim girdisi — sunucu aynı kuralları ZORLAR; bu şema yalnız erken geri bildirimdir. */
export const groupReportInputSchema = z
  .object({
    landingId: z.string().uuid(),
    reason: z.enum(REASON_KEYS),
    note: z.string().trim().max(GROUP_REPORT_NOTE_MAX, "Açıklama en fazla 1000 karakter olabilir.").optional(),
  })
  .refine((value) => value.reason !== "diger" || Boolean(value.note && value.note.length > 0), {
    message: "'Diğer' seçtiysen kısa bir açıklama yazmalısın.",
    path: ["note"],
  });

export type GroupReportInput = z.infer<typeof groupReportInputSchema>;

/** submit/review/state/list kapılarının raise kodları → Türkçe (çift yönlü test kilidi). */
export const GROUP_REPORT_ERROR_MESSAGES: Record<string, string> = {
  group_report_auth_required: "Şikayet için giriş yapmalısın.",
  group_report_group_not_found: "Grup bulunamadı.",
  group_report_group_not_published: "Bu grup şu an yayında değil; şikayet alınmıyor.",
  group_report_own_group: "Kendi grubunu şikayet edemezsin.",
  group_report_invalid_reason: "Geçerli bir şikayet sebebi seç.",
  group_report_note_required: "'Diğer' seçtiysen kısa bir açıklama yazmalısın.",
  group_report_note_too_long: "Açıklama en fazla 1000 karakter olabilir.",
  group_report_phone_required: "Şikayet için telefon doğrulaması gerekir.",
  group_report_account_too_new: "Hesabın çok yeni; şikayet hakkı hesap belirli bir süre kullanıldıktan sonra açılır.",
  group_report_cooldown: "Bu gruba yakın zamanda şikayet gönderdin; aynı gruba tekrar şikayet için beklemelisin.",
  group_report_review_forbidden: "Şikayet kararları yalnız yöneticilere açıktır.",
  group_report_invalid_decision: "Geçersiz karar.",
  group_report_not_found: "Şikayet bulunamadı.",
  group_report_already_reviewed: "Bu şikayet zaten karara bağlanmış.",
};

/** Kod taşıyan hata — arayüz `code`'a göre dal açabilir (ör. telefon → profil yönlendirmesi). */
export class GroupReportError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GroupReportError";
    this.code = code;
  }
}

interface RpcErrorLike {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/** Düz nesne RPC hatasını Türkçe GroupReportError'a çevirir (instanceof Error YOK). */
export function toGroupReportError(error: RpcErrorLike | null | undefined, fallback: string): GroupReportError {
  const code = error?.message ?? "";
  const message =
    GROUP_REPORT_ERROR_MESSAGES[code] ??
    // review → admin_record_group_strike / set_group_status_v1 kodları (G12/G15)
    GROUP_MODERATION_ERROR_MESSAGES[code] ??
    fallback;
  return new GroupReportError(code, message);
}

export interface GroupReportState {
  own_group: boolean;
  published: boolean;
  phone_required: boolean;
  account_too_new: boolean;
  cooldown_until: string | null;
  can_report: boolean;
}

export async function fetchGroupReportState(landingDbId: string): Promise<GroupReportState> {
  const { data, error } = await supabase.rpc("group_report_state_v1" as never, { p_landing_id: landingDbId } as never);
  if (error) throw toGroupReportError(error, "Şikayet durumu okunamadı.");
  return data as GroupReportState;
}

export interface SubmitGroupReportResult {
  report_id: string;
  group_hidden: boolean;
}

export async function submitGroupReport(input: GroupReportInput): Promise<SubmitGroupReportResult> {
  const parsed = groupReportInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new GroupReportError("client_validation", parsed.error.issues[0]?.message ?? "Şikayet bilgileri eksik.");
  }
  const { data, error } = await supabase.rpc("submit_group_report_v1" as never, {
    p_landing_id: parsed.data.landingId,
    p_reason: parsed.data.reason,
    p_note: parsed.data.note ? parsed.data.note : null,
  } as never);
  if (error) throw toGroupReportError(error, "Şikayet gönderilemedi.");
  return data as SubmitGroupReportResult;
}

export interface GroupReportQueueReport {
  id: string;
  reason: string;
  note: string | null;
  reporter_id: string;
  created_at: string;
}

export interface GroupReportQueueItem {
  landing_id: string;
  slug: string;
  group_name: string;
  listing_status: string;
  hidden_reason: string | null;
  open_count: number;
  distinct_reporters: number;
  first_report_at: string;
  reason_counts: Record<string, number> | null;
  reports: GroupReportQueueReport[];
}

/** Moderatör kuyruğu — açık şikayetler grup bazlı (admin RPC; üyeye forbidden). */
export async function fetchGroupReportQueue(): Promise<GroupReportQueueItem[]> {
  const { data, error } = await supabase.rpc("admin_list_group_reports" as never, {} as never);
  if (error) throw toGroupReportError(error, "Şikayet kuyruğu okunamadı.");
  return (data ?? []) as GroupReportQueueItem[];
}

export type GroupReportDecision = "upheld" | "rejected";

export interface ReviewGroupReportResult {
  report_id: string;
  decision: GroupReportDecision;
  closed_reports: number;
  strike: { outcome?: string; strike_no?: number } | null;
  group_republished: boolean;
  listing_status: string;
}

export async function reviewGroupReport(
  reportId: string,
  decision: GroupReportDecision,
  note?: string,
): Promise<ReviewGroupReportResult> {
  const { data, error } = await supabase.rpc("review_group_report_v1" as never, {
    p_report_id: reportId,
    p_decision: decision,
    p_note: note?.trim() ? note.trim() : null,
  } as never);
  if (error) throw toGroupReportError(error, "Şikayet kararı kaydedilemedi.");
  return data as ReviewGroupReportResult;
}
