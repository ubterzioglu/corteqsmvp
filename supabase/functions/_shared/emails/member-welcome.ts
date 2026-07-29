// Üyeye giden hoş geldin e-postası.
//
// Kayıt sonrası e-posta DOĞRULANDIĞINDA gönderilir (auth.users trigger'ı → outbox →
// send-notification-emails). Alıcı üyenin kendisidir; admin bildirimlerinden (`new_member`)
// farklı olarak abone listesine bakılmaz.
//
// ── E-posta HTML'i web HTML'i DEĞİLDİR ─────────────────────────────────────────
// Outlook (Windows) sayfayı Word render motoruyla çizer, Gmail <style> bloğunun çoğunu siler.
// Bu yüzden aşağıdaki kurallar zorunludur; "daha temiz" diye modernleştirmek şablonu bozar:
//   · Yerleşim table tabanlıdır, 600px sabit genişliktedir — flexbox/grid Outlook'ta çalışmaz.
//   · Tüm stiller inline'dır (style="..."), <head> içindeki <style>'a güvenilmez.
//   · Renkler hex sabittir — CSS değişkeni (--primary) maillerde çözülmez.
//   · Görseller varsayılan olarak ENGELLİ açılır: her <img> anlamlı alt metni taşır ve
//     hiçbir kritik bilgi yalnız görselde olmaz.
//   · Metin sürümü (text) her zaman doldurulur; yalnız HTML gönderen mailler spam skorunu yükseltir.
//
// Bağımlılıksızdır — bkz. ./html.ts başlığı (Edge Function + önizleme scripti + testler aynı dosyayı okur).

import { escapeHtml } from "./html.ts";

/** src/index.css'teki --primary (170 65% 42%) teal tonunun hex karşılığı. */
const BRAND = "#25b19a";
const BRAND_DARK = "#17836f";
const TEXT = "#18181b";
const MUTED = "#71717a";
const BORDER = "#e4e4e7";
const PAGE_BG = "#f4f4f5";
const CARD_BG = "#ffffff";

const DEFAULT_SITE_URL = "https://corteqs.net";

/**
 * Sosyal bağlantılar src/components/Footer.tsx ve src/lib/contact-links.ts ile AYNI olmalıdır.
 * Edge Function deploy'u yalnız supabase/functions/ klasörünü yüklediği için src/ altından
 * import edilemez; bu yüzden değerler burada tekrarlanır. Kaymayı member-welcome.test.ts
 * içindeki mirror testi yakalar — Footer'daki bir adresi değiştirirsen burayı da güncelle.
 */
export const SOCIAL_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/corteqs-global" },
  { label: "Instagram", href: "https://www.instagram.com/corteqsturk" },
  { label: "X", href: "https://x.com/turksdiaspora" },
  { label: "YouTube", href: "https://www.youtube.com/@corteqsyoutube" },
  { label: "WhatsApp topluluğu", href: "https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD" },
];

/** Mailde tanıtılan bölümler. Yollar src/App.tsx'teki gerçek public route'lardır. */
const DISCOVER_SECTIONS: ReadonlyArray<{ title: string; description: string; path: string }> = [
  {
    title: "Cadde",
    description:
      "Diasporadaki insanların gündemi: paylaşımlar, kafeler ve çarşı ilanları. Tanış, sor, paylaş.",
    path: "/cadde",
  },
  {
    title: "Rehber",
    description:
      "Ülke ülke, şehir şehir kişiler ve kuruluşlar. Aradığın hizmeti veya iş ortağını bul.",
    path: "/directory",
  },
  {
    title: "Kaynaklar",
    description:
      "Taşınma, vize, iş ve yaşam üzerine rehberler; deneyimlerden süzülmüş pratik bilgiler.",
    path: "/radar/rehberler",
  },
];

export type MemberWelcomeInput = {
  /** auth.users.raw_user_meta_data'dan gelen ad; e-posta+şifre kayıtlarında genelde null. */
  fullName: string | null;
  email: string;
  /** Varsayılan https://corteqs.net — testler ve önizleme başka değer verebilir. */
  siteUrl?: string;
  /** Yanıt adresi; yalnız metinde gösterilir, gönderim başlığını Edge Function ayarlar. */
  replyTo?: string | null;
};

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
};

/** Sondaki eğik çizgiyi temizler — `${siteUrl}/profile` çifte slash üretmesin. */
function normalizeSiteUrl(value: string | undefined): string {
  const raw = (value ?? DEFAULT_SITE_URL).trim();
  const withoutTrailingSlash = raw.replace(/\/+$/, "");
  return withoutTrailingSlash === "" ? DEFAULT_SITE_URL : withoutTrailingSlash;
}

/**
 * Hitapta kullanılacak ilk isim. E-postanın @ öncesi BİLEREK kullanılmaz:
 * "u.terzioglu" gibi bir hitap kişisel değil, hatalı görünür.
 */
function resolveGreetingName(fullName: string | null): string | null {
  const trimmed = (fullName ?? "").trim();
  if (trimmed === "") return null;

  const firstName = trimmed.split(/\s+/)[0];
  return firstName.length > 40 ? null : firstName;
}

function buildDiscoverRowsHtml(siteUrl: string): string {
  return DISCOVER_SECTIONS.map((section) => {
    const url = `${siteUrl}${section.path}`;
    return `
              <tr>
                <td style="padding: 0 0 12px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: separate; border: 1px solid ${BORDER}; border-radius: 8px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <a href="${escapeHtml(url)}" style="color: ${BRAND_DARK}; font-size: 16px; font-weight: 700; text-decoration: none;">${escapeHtml(section.title)}</a>
                        <p style="margin: 6px 0 0 0; color: ${MUTED}; font-size: 14px; line-height: 21px;">${escapeHtml(section.description)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
  }).join("");
}

function buildSocialHtml(): string {
  return SOCIAL_LINKS.map(
    (link) =>
      `<a href="${escapeHtml(link.href)}" style="color: ${MUTED}; font-size: 13px; text-decoration: underline; white-space: nowrap;">${escapeHtml(link.label)}</a>`,
  ).join(`<span style="color: ${BORDER};"> &nbsp;·&nbsp; </span>`);
}

/**
 * Hoş geldin mailinin konu / HTML / düz metin sürümlerini üretir.
 * Saf fonksiyondur — ağ, ortam değişkeni veya tarih üretimi yoktur, testi belirlenimcidir.
 */
export function buildMemberWelcomeEmail(input: MemberWelcomeInput): BuiltEmail {
  const siteUrl = normalizeSiteUrl(input.siteUrl);
  const firstName = resolveGreetingName(input.fullName);
  const greeting = firstName ? `Merhaba ${firstName},` : "Merhaba,";
  const profileUrl = `${siteUrl}/profile`;
  const privacyUrl = `${siteUrl}/legal/privacy`;
  const contactUrl = `${siteUrl}/iletisim`;
  const replyTo = (input.replyTo ?? "").trim();

  const subject = firstName
    ? `CorteQS'e hoş geldin ${firstName}`
    : "CorteQS'e hoş geldin";

  // Gelen kutusunda konu satırının yanında görünen önizleme metni. Boş bırakılırsa
  // Gmail HTML'in ilk çöpünü gösterir; bu yüzden hem gizli div hem de sıfır genişlikli
  // dolgu karakterleri kullanılır (dolgu, gövde metninin önizlemeye sızmasını engeller).
  const preheader = "Kaydın tamamlandı. Profilini tamamlayarak başlayabilirsin.";

  const supportLine = replyTo
    ? `Bir sorun yaşarsan bu maili doğrudan yanıtlayabilir ya da <a href="mailto:${escapeHtml(replyTo)}" style="color: ${BRAND_DARK};">${escapeHtml(replyTo)}</a> adresine yazabilirsin.`
    : `Bir sorun yaşarsan bu maili doğrudan yanıtlayabilir ya da <a href="${escapeHtml(contactUrl)}" style="color: ${BRAND_DARK};">iletişim sayfamızdan</a> bize ulaşabilirsin.`;

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${PAGE_BG}; -webkit-font-smoothing: antialiased;">
<div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; font-size: 1px; line-height: 1px;">${escapeHtml(preheader)}&#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847;</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${PAGE_BG}; border-collapse: collapse;">
  <tr>
    <td align="center" style="padding: 24px 12px;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width: 600px; max-width: 100%; background-color: ${CARD_BG}; border: 1px solid ${BORDER}; border-radius: 12px; border-collapse: separate;">

        <tr>
          <td style="background-color: ${BRAND}; border-radius: 12px 12px 0 0; padding: 24px 32px;">
            <a href="${escapeHtml(siteUrl)}" style="text-decoration: none;">
              <img src="${escapeHtml(siteUrl)}/sharedx/maillogo.png" width="150" alt="CorteQS" style="display: block; width: 150px; max-width: 60%; height: auto; border: 0;">
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding: 32px 32px 8px 32px;">
            <h1 style="margin: 0 0 12px 0; color: ${TEXT}; font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 24px; line-height: 32px; font-weight: 700;">${escapeHtml(greeting)}</h1>
            <p style="margin: 0 0 16px 0; color: ${TEXT}; font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; line-height: 25px;">
              CorteQS'e katıldığın için teşekkür ederiz. Kaydın tamamlandı ve hesabın kullanıma hazır.
            </p>
            <p style="margin: 0 0 24px 0; color: ${MUTED}; font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; line-height: 25px;">
              CorteQS, dünyanın dört bir yanındaki Türk diasporasını birbirine bağlayan bir ağ.
              İlk adım olarak profilini tamamla: seni doğru kişilerle ve fırsatlarla eşleştirebilmemizin yolu bu.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding: 0 32px 32px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color: ${BRAND}; border-radius: 8px;">
                  <a href="${escapeHtml(profileUrl)}" style="display: inline-block; padding: 14px 28px; color: #ffffff; font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; font-weight: 700; line-height: 20px; text-decoration: none;">Profilini tamamla</a>
                </td>
              </tr>
            </table>
            <p style="margin: 12px 0 0 0; color: ${MUTED}; font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 13px; line-height: 20px;">
              Buton çalışmazsa bu adresi tarayıcına yapıştır:<br>
              <a href="${escapeHtml(profileUrl)}" style="color: ${BRAND_DARK}; word-break: break-all;">${escapeHtml(profileUrl)}</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding: 0 32px;">
            <div style="border-top: 1px solid ${BORDER}; font-size: 0; line-height: 0;">&nbsp;</div>
          </td>
        </tr>

        <tr>
          <td style="padding: 28px 32px 8px 32px;">
            <h2 style="margin: 0 0 16px 0; color: ${TEXT}; font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 18px; line-height: 26px; font-weight: 700;">Nereden başlasan?</h2>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">${buildDiscoverRowsHtml(siteUrl)}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding: 20px 32px 32px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: separate; background-color: ${PAGE_BG}; border-radius: 8px;">
              <tr>
                <td style="padding: 16px 20px;">
                  <p style="margin: 0; color: ${TEXT}; font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 14px; line-height: 22px;">
                    <strong>Takıldığın bir yer olursa</strong><br>
                    ${supportLine}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding: 0 32px 32px 32px;">
            <p style="margin: 0; color: ${MUTED}; font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 13px; line-height: 24px;">${buildSocialHtml()}</p>
          </td>
        </tr>

      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width: 600px; max-width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 20px 24px 8px 24px;">
            <p style="margin: 0 0 6px 0; color: ${MUTED}; font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 12px; line-height: 19px;">
              Bu maili <strong>${escapeHtml(input.email)}</strong> adresiyle CorteQS'e üye olduğun için aldın.
            </p>
            <p style="margin: 0; color: ${MUTED}; font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 12px; line-height: 19px;">
              <a href="${escapeHtml(siteUrl)}" style="color: ${MUTED};">corteqs.net</a>
              <span style="color: ${BORDER};"> &nbsp;·&nbsp; </span>
              <a href="${escapeHtml(privacyUrl)}" style="color: ${MUTED};">Gizlilik politikası</a>
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
</body>
</html>`;

  const discoverText = DISCOVER_SECTIONS.map(
    (section) => `- ${section.title}: ${section.description}\n  ${siteUrl}${section.path}`,
  ).join("\n");

  const supportText = replyTo
    ? `Bir sorun yaşarsan bu maili doğrudan yanıtlayabilir ya da ${replyTo} adresine yazabilirsin.`
    : `Bir sorun yaşarsan bu maili doğrudan yanıtlayabilir ya da ${contactUrl} adresinden bize ulaşabilirsin.`;

  const text = [
    greeting,
    "",
    "CorteQS'e katıldığın için teşekkür ederiz. Kaydın tamamlandı ve hesabın kullanıma hazır.",
    "",
    "CorteQS, dünyanın dört bir yanındaki Türk diasporasını birbirine bağlayan bir ağ.",
    "İlk adım olarak profilini tamamla:",
    profileUrl,
    "",
    "Nereden başlasan?",
    discoverText,
    "",
    supportText,
    "",
    SOCIAL_LINKS.map((link) => `${link.label}: ${link.href}`).join("\n"),
    "",
    `Bu maili ${input.email} adresiyle CorteQS'e üye olduğun için aldın.`,
    `Gizlilik politikası: ${privacyUrl}`,
  ].join("\n");

  return { subject, html, text };
}
