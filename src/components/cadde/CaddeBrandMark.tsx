// A15 (03.10.2026): Cadde kimlik işareti.
//
// ⚠️ Y1 (m151, 09.09.2026) kimlik ŞERİDİNİ kaldırmıştı ve gerekçelerinden biri
// birebir "ikinci logo — header'da zaten var" idi. Bu bileşen o şeridi GERİ
// GETİRMEZ ve getirmemelidir:
//   · kendi satırı YOKTUR — kapsam şeridinin mevcut çip satırının İÇİNDE durur,
//   · satır yüksekliğini DEĞİŞTİRMEZ (çip py-1.5 ≈ 30px, işaret 24px),
//   · akışın üstüne yeni bir tam genişlik bloğu EKLEMEZ.
// Son madde 05.08.2026'da ÜÇ revizyonla alınmış bir kullanıcı kararıdır: ilk iki
// denemede akışın üstüne konan bloklar paylaşım kutusunu katlamanın altında
// bırakmıştı. Bu işareti büyütüp kendi şeridine taşımak o kusuru geri getirir.
//
// Erişilebilirlik: sayfanın tek h1'i zaten "Diaspora Cadde" diyor (sr-only,
// Y1'de eklendi). İşarete ayrıca metin verilirse ekran okuyucu aynı adı İKİNCİ
// kez okur. Bu yüzden DEKORATİF: alt="" + aria-hidden.
//
// Varlık: `public/cadde-logo.png` — Burak'ın verdiği 2000×2000 / 3,0 MB dosyadan
// üretildi (kenar boşluğu kırpıldı, zemin gerçekten saydamlaştırıldı, 512×512).
// Kaynak dosyada alfa kanalı YOKTU (PNG color type 2); olduğu gibi konsaydı koyu
// modda beyaz bir kutu olarak görünürdü.
const CaddeBrandMark = () => (
  <img
    src="/cadde-logo.png"
    alt=""
    aria-hidden="true"
    width={24}
    height={24}
    decoding="async"
    data-testid="cadde-brand-mark"
    className="h-6 w-6 shrink-0 select-none"
  />
);

export default CaddeBrandMark;
