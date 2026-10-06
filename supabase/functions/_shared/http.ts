/**
 * Edge function'ların ortak JSON yanıtı.
 *
 * Eskiden bu gövde 10 fonksiyonda birebir tekrar tanımlıydı. Content-Type'ın `charset=utf-8`
 * taşıması Türkçe karakterler içindir; kopyalardan biri sessizce farklılaşırsa yalnız o
 * fonksiyonda metin bozulur. Tek kaynak: `http.test.ts` sözleşmesi yerel kopyayı yasaklar.
 *
 * ⚠️ `Content-Type`, CORS başlıkları yayıldıktan SONRA yazılır: çağıranın başlık nesnesi
 * (`corsHeaders`) yanlışlıkla başka bir Content-Type taşısa bile yanıt JSON kalır.
 */
export function jsonResponse(
  body: unknown,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}
