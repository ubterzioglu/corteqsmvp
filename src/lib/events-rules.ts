// M05 · Etkinlik motoru kuralları — TEK KAYNAK (desen: cadde-rules.ts).
//
// İKİ iş:
//   1. LIMIT AYNASI: `EVENTS_ACTIVE_LIMIT` canlı `event_settings` satırının
//      (events.active_limit = 2, M02 seed) istemci kopyasıdır — YALNIZ UI
//      metinleri için. Yetki/karar SQL'dedir (create_event_v1); buradaki sabit
//      değişirse `events-first-approval.test.ts` migration seed'iyle birebir
//      karşılaştırır ve düşer (ayna sözleşme).
//   2. HATA HARİTASI: etkinlik RPC'lerinin (create_event_v1 · join/leave ·
//      guard) raise kodları → kullanıcı Türkçesi. ⚠️ RPC hataları supabase-js'te
//      DÜZ NESNEDİR (`instanceof Error` ile daraltma YASAK — m75/cadde dersi);
//      çözümleyici message metninden kodu alt diziyle tarar.
//
// Kodlar üç migration'dan gelir: M02 (20261003010000) · M03 (20261003020000) ·
// M04 (20261003030000). Yeni kod ekleyen migration bu haritayı da günceller
// (çift yönlü test kilitler — cadde-error-map deseni).

/** `event_settings.events.active_limit` aynası (M02 seed: 2). */
export const EVENTS_ACTIVE_LIMIT = 2;

/** Etkinlik RPC hata kodları → Türkçe (M02+M03+M04 kodlarının tamamı). */
export const EVENT_RPC_ERROR_MESSAGES: Record<string, string> = {
  // M02 — create_event_v1
  event_auth_required: "Bu işlem için giriş yapmalısınız.",
  event_field_required: "Başlık, açıklama, kategori, tür ve tarih zorunludur.",
  event_active_limit: `Aynı anda en fazla ${EVENTS_ACTIVE_LIMIT} aktif etkinliğiniz olabilir. Geçmiş etkinlikler sayılmaz.`,
  // M03 — events_guard_status (T1)
  event_status_direct_update_forbidden:
    "Etkinliğin yayın durumu yalnız moderatörlerce değiştirilebilir.",
  // M04 — katılım
  event_not_found: "Etkinlik bulunamadı.",
  event_not_published: "Bu etkinlik yayında değil; katılım yalnız yayındaki etkinliklere açık.",
  event_attendee_limit: "Etkinlik kontenjanı dolu.",
  event_attendee_not_joined: "Bu etkinliğe katılmadığın için ayrılma kaydı da yok.",
};

/**
 * RPC hata nesnesinden kullanıcı Türkçesi üretir (cadde `resolveCaddeRpcErrorMessage`
 * deseni): PostgREST hata `message`'ı raise metnini taşır; bilinen kodları alt
 * diziyle tarar, bilinmeyende fallback'e düşer (ham kodu kullanıcıya GÖSTERME).
 */
export function resolveEventRpcErrorMessage(
  error: unknown,
  fallback = "İşlem tamamlanamadı. Lütfen tekrar dene.",
): string {
  const candidates: string[] = [];
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["message", "details", "hint"]) {
      const value = record[key];
      if (typeof value === "string") candidates.push(value);
    }
  }
  if (typeof error === "string") candidates.push(error);

  for (const text of candidates) {
    for (const [code, message] of Object.entries(EVENT_RPC_ERROR_MESSAGES)) {
      if (text.includes(code)) return message;
    }
  }
  return fallback;
}
