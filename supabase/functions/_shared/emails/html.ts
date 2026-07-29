// E-posta şablonları için ortak HTML yardımcıları.
//
// Bu dosya BİLEREK bağımlılıksızdır (Deno API'si, npm paketi, import yok): aynı kaynağı
// üç tüketici birden okur —
//   1. Edge Function (Deno)         → supabase/functions/send-notification-emails/index.ts
//   2. Yerel önizleme (Node)        → scripts/preview-emails.mjs
//   3. Testler (Vitest)             → *.test.ts
// Buraya Deno'ya özgü bir şey eklenirse önizleme ve testler kırılır.

/** Kullanıcıdan gelen her değer HTML'e gömülmeden önce buradan geçmelidir. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
