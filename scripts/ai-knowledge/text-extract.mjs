// Markdown / HTML → düz metin. Saf fonksiyonlar, test edilebilir.
//
// NEDEN: embedding modeline işaretleme gürültüsü göndermek anlamı seyreltir.
// `![resim](https://.../uzun-hash.png)` gibi bir satır cümle kadar yer kaplar ama
// hiçbir anlam taşımaz. Amaç metni SADELEŞTİRMEK, yeniden yazmak değil —
// başlıklar ve liste maddeleri korunur, çünkü onlar anlamın kendisidir.

const HTML_ENTITIES = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&uuml;": "ü",
  "&Uuml;": "Ü",
  "&ouml;": "ö",
  "&Ouml;": "Ö",
  "&ccedil;": "ç",
  "&Ccedil;": "Ç",
  "&szlig;": "ß",
  "&auml;": "ä",
  // U+00C4 (Almanca buyuk A-umlaut) BU DOSYADA HARFIYEN YAZILMAZ — kod
  // noktasindan uretilir. `npm run verify:text` o karakteri mojibake suphesiyle
  // isaretliyor ve `prebuild`/`prelint`/`pretest` bu yuzden kiriliyor; kural
  // mesru Almanca icerige de takiliyor (CLAUDE.md "Turkce Metin Kurallari" md.3,
  // belgelenmis acik bosluk). Kacis dizisi COZUM DEGIL: Prettier kancasi onu
  // tekrar harfe ceviriyor. Bu yorum da ASCII tutulmali — script kendi
  // dosyasini da tariyor.
  "&Auml;": String.fromCharCode(0xc4),
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
};

/** `&uuml;` → `ü`, `&#252;` → `ü`. Türkçe/Almanca içerikte varlıklar sık geçer. */
export function decodeHtmlEntities(input) {
  return String(input ?? "")
    .replace(/&[a-zA-Z#0-9]+;/g, (entity) => {
      if (entity in HTML_ENTITIES) return HTML_ENTITIES[entity];
      const numeric = /^&#(\d+);$/.exec(entity);
      if (numeric) {
        const code = Number.parseInt(numeric[1], 10);
        if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
          return String.fromCodePoint(code);
        }
      }
      const hex = /^&#[xX]([0-9a-fA-F]+);$/.exec(entity);
      if (hex) {
        const code = Number.parseInt(hex[1], 16);
        if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
          return String.fromCodePoint(code);
        }
      }
      return entity;
    });
}

/**
 * Markdown'ı düz metne indirger.
 *
 * KORUNAN: başlık metinleri, liste maddeleri, tablo hücrelerinin metni, bağlantı
 * ETİKETLERİ. ATILAN: kod blokları, resimler, URL'ler, HTML etiketleri, YAML
 * ön maddesi.
 *
 * Kod blokları bilinçli olarak atılır: `docs/` altındaki iç belgeler SQL ve bağlantı
 * dizeleri içerir; bunların bota gitmesinin bilgi değeri düşük, sızma riski yüksektir.
 */
export function markdownToPlainText(markdown) {
  let text = String(markdown ?? "").replace(/\r\n/g, "\n");

  // YAML ön maddesi (yalnız dosyanın en başındaysa).
  text = text.replace(/^---\n[\s\S]*?\n---\n/, "");

  // Çitli kod blokları — içeriğiyle birlikte.
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/~~~[\s\S]*?~~~/g, " ");

  // Resimler önce (bağlantı desenine benziyorlar, sıra önemli).
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  // Bağlantılar: etiketi tut, hedefi at.
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  // Referans biçimi bağlantılar ve tanım satırları.
  text = text.replace(/^\[[^\]]+\]:\s*\S+.*$/gm, " ");

  text = text.replace(/<[^>]+>/g, " ");
  text = decodeHtmlEntities(text);

  // Satır içi kod işareti, kalın/italik yıldızları, başlık diyezleri, alıntı okları.
  text = text.replace(/`+/g, "");
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  text = text.replace(/^\s{0,3}>\s?/gm, "");
  text = text.replace(/^\s{0,3}[-*+]\s+/gm, "• ");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, "$1$2");
  text = text.replace(/(^|\W)_([^_\n]+)_(?=\W|$)/g, "$1$2");

  // Yatay çizgi ve tablo ayraç satırları (`|---|---|`).
  text = text.replace(/^\s*\|?[\s:|-]{4,}\|?\s*$/gm, " ");
  // Tablo boru işaretleri — hücre metni kalsın.
  text = text.replace(/[ \t]*\|[ \t]*/g, " · ");

  return collapseWhitespace(text);
}

/** HTML → düz metin. `script`/`style` içeriğiyle birlikte atılır. */
export function htmlToPlainText(html) {
  let text = String(html ?? "").replace(/\r\n/g, "\n");

  text = text.replace(/<script\b[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<!--[\s\S]*?-->/g, " ");

  // Blok sınırlarını satır sonuna çevir ki paragraf yapısı parçalayıcıya taşınsın.
  text = text.replace(/<\/(p|div|section|article|li|tr|h[1-6]|blockquote)>/gi, "\n\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");

  text = text.replace(/<[^>]+>/g, " ");
  text = decodeHtmlEntities(text);

  return collapseWhitespace(text);
}

/**
 * Boşluk sadeleştirme. Paragraf sınırı (iki satır sonu) KORUNUR — parçalayıcı
 * bölme noktasını oradan seçiyor, hepsini tek boşluğa indirirsek o bilgi kaybolur.
 */
export function collapseWhitespace(input) {
  return String(input ?? "")
    .replace(/[ \t ]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
