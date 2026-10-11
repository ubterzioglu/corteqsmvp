// scripts/strip-html-comments.mjs
// Derlenen index.html'den HTML yorumlarını söker (vite.config.ts → transformIndexHtml).
//
// Neden: index.html'deki geliştirici uyarıları ("BURAYA SABİT canonical EKLEME",
// "Buraya inline <script> EKLEME" …) prerender dahil HER istemciye gidiyordu. GEO
// denetimi (2026-10-11, geo-optimizer 4.19) emir kipindeki bu yorumları AI crawler'a
// yönelik "prompt injection" olarak işaretledi; ayrıca iç mimari notlarını açığa
// çıkarıyorlardı. Yorumlar KAYNAKTA KALIR (geliştiriciye uyarıdır), yalnız çıktıdan
// silinir.
//
// <script>/<style> blokları DOKUNULMADAN geçer: içlerindeki "<!--" metni HTML
// yorumu değildir ve silinmesi JSON-LD'yi ya da betiği bozar.

// Tek geçiş: yorum ve script/style bloğu aynı desende yarışır, soldan ilk başlayan
// kazanır (tarayıcının ayrıştırma sırası). Ayrı geçişler yanlıştır — index.html'de
// "inline <script> EKLEME" metni bir YORUMUN içinde geçiyor; önce script bloğu
// aranırsa eşleşme yorumun ortasından başlar ve yorum yarım kalır.
const COMMENT_OR_RAW_TEXT = /<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const BLANK_LINE_RUN = /\n[ \t]*\n(?:[ \t]*\n)+/g;

/**
 * @param {string} html
 * @returns {string} yorumları silinmiş HTML; script/style içeriği aynen korunur.
 */
export function stripHtmlComments(html) {
  return html
    .replace(COMMENT_OR_RAW_TEXT, (match, rawTextTag) => (rawTextTag ? match : ""))
    .replace(BLANK_LINE_RUN, "\n\n");
}

/** Vite eklentisi: yalnız build çıktısında çalışır, dev sunucusu kaynağı aynen gösterir. */
export function stripHtmlCommentsPlugin() {
  return {
    name: "strip-html-comments",
    apply: "build",
    enforce: "post",
    transformIndexHtml(html) {
      return stripHtmlComments(html);
    },
  };
}
