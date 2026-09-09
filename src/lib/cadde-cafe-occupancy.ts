// Cafe oda doluluğunun kullanıcıya nasıl yazılacağı (C1, m160).
//
// SORUN (kritik, docs/cadde-300/2026-08-27-ux-degerlendirme.md §5.2):
// Oda başlığı "2/100 üye" yazıyordu. Payda boşluğu VURGULUYOR — kullanıcıya
// "burada olması gereken 100 kişi var, 2 tanesi geldi" diyor. Boş bir platformda
// bu, davet değil başarısızlık ilanı.
//
// ⚠️ İKİ YÜZEY AYRIŞMIŞTI: sağ raydaki cafe kartı (CaddeCafesPanel.tsx) zaten
// yalnız "N üye" yazıyordu; payda sadece oda sayfasında kalmıştı. Bu fonksiyon
// ikisini tek kurala bağlar.
//
// KURAL: payda ancak doluluk anlamlı bir seviyeye ulaşınca gösterilir. Altında
// yalnız üye sayısı yazılır — bilgi kaybı yok, boşluk reklamı da yok.

/** Paydanın görünür olmaya başladığı doluluk oranı (%20). */
export const CAFE_OCCUPANCY_DENOMINATOR_THRESHOLD = 0.2;

/**
 * Oda doluluğunu yazar: "2 üye" ya da yeterince doluysa "45/100 üye".
 *
 * Kapasite tanımsız/0 ise payda zaten yoktur.
 */
export function formatCafeOccupancy(memberCount: number, capacity: number | null | undefined): string {
  if (!capacity || capacity <= 0) return `${memberCount} üye`;

  const ratio = memberCount / capacity;
  return ratio >= CAFE_OCCUPANCY_DENOMINATOR_THRESHOLD
    ? `${memberCount}/${capacity} üye`
    : `${memberCount} üye`;
}
