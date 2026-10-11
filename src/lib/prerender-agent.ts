// Prerender ortamı tespiti.
//
// nginx bot isteklerini prerender servisine yollar (nginx.conf.template, $is_bot); servis
// sayfayı headless Chrome'da render edip HTML anlık görüntüsünü bota verir. O tarayıcı
// sayfayı KAYDIRMAZ — "görünüme girince belir" animasyonları (Reveal) başlangıç
// durumunda kalır ve içerik anlık görüntüye `opacity: 0` ile yazılır.
//
// Ölçüm (2026-10-11, GPTBot UA ile canlı ana sayfa): manifesto, Radar, arama, SSS ve
// kayıt çağrısı dahil 8 ana bölüm `opacity: 0` idi; GEO denetimi bunu "gizli metin"
// (cloaking deseni) olarak işaretledi. Prerender'da animasyon kapatılır, içerik görünür.

/** prerender.io renderer'ı UA'ya "Prerender (+https://github.com/prerender/prerender)" ekler. */
const PRERENDER_UA_PATTERN = /\bPrerender\b|HeadlessChrome/i;

export function isPrerenderUserAgent(userAgent: string | null | undefined): boolean {
  return Boolean(userAgent) && PRERENDER_UA_PATTERN.test(userAgent as string);
}

/** Tarayıcıda, sayfa prerender servisinin headless Chrome'unda mı çalışıyor? */
export function isPrerenderEnvironment(): boolean {
  if (typeof navigator === "undefined") return false;
  return isPrerenderUserAgent(navigator.userAgent);
}
