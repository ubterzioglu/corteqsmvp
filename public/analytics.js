// CorteQS analitik yükleyicisi — Google Analytics (gtag) + Microsoft Clarity.
//
// NEDEN AYRI DOSYA: bu kod 2026-08-04'e kadar index.html içinde iki ayrı inline
// <script> bloğuydu. Güvenlik başlıkları geri getirilirken CSP'nin script-src'ine
// 'unsafe-inline' EKLEMEMEK için buraya taşındı (bkz. nginx.conf.template $csp).
// Inline'a geri taşıma — CSP bloklar ve analitik sessizce ölür.
//
// gtag/js ve Ahrefs script'leri index.html'de <script src> olarak kalır; onlar
// zaten harici dosya ve CSP allowlist'inde host adları geçer.
//
// Yükleme sırası: index.html bunu `defer` ile çağırır. gtag/js `async` olduğu için
// bu dosyadan önce de sonra da gelebilir — sorun değil, gtag snippet'i dataLayer'ı
// iki taraftan da güvenle oluşturur (`window.dataLayer || []`).

// ── Google Analytics ────────────────────────────────────────────────────────
window.dataLayer = window.dataLayer || [];

// gtag global olmalı — GA ve sayfa içi olay çağrıları bu adı bekler.
// Not: `arguments` kullanıldığı için ok fonksiyona çevrilemez.
function gtag() {
  window.dataLayer.push(arguments);
}

gtag("js", new Date());
gtag("config", "G-XMZYTW34LQ");

// ── Microsoft Clarity ───────────────────────────────────────────────────────
// Clarity'nin resmi yükleyicisi; tag script'ini <head>'e enjekte eder.
(function (c, l, a, r, i, t, y) {
  c[a] =
    c[a] ||
    function () {
      (c[a].q = c[a].q || []).push(arguments);
    };
  t = l.createElement(r);
  t.async = 1;
  t.src = "https://www.clarity.ms/tag/" + i;
  y = l.getElementsByTagName(r)[0];
  y.parentNode.insertBefore(t, y);
})(window, document, "clarity", "script", "wdkgdje6rb");
