// Founding 1000 — Hoş Geldin E-postası
// Domain (corteqs.net) aktif olduğunda transactional email akışına bağlanacak.
// Şimdilik metin + basit HTML şablonu burada saklanıyor.

export const FOUNDING1000_WELCOME_SUBJECT =
  "CorteQS Kurucu 1000'e Hoş Geldiniz 🎉";

export const FOUNDING1000_WELCOME_TEXT = `Merhaba,

CorteQS Kurucu 1000 arasına katıldığınız için teşekkür ederiz. Sizi, platformumuzun ilk yol arkadaşları arasında görmekten mutluluk duyuyoruz.

Platformumuz şu anda hızlı bir yapım aşamasında. Hemen her hafta yeni bir özellik landing page'imize ekleniyor ve CorteQS deneyimini adım adım geliştiriyoruz.

Lansmanımızı 29 Ekim'de gerçekleştirmeyi planlıyoruz. Kurucu 1000 üyeleri, lansmandan itibaren geçerli olmak üzere 1 yıl boyunca üyeliklerini garantiye almış olacak. Ayrıca aramıza katılımınız, sosyal medya hesaplarımızda da duyurulacak.

Kontrol panellerinizi kullanıma açtıktan sonra sizi gelişmelerden haberdar edeceğiz. Bu süreçte hızlı erişim ve bilgi almak için CorBot WhatsApp hattımızı da kullanabilirsiniz:

🤖 CorBot — WhatsApp Bot
https://wa.me/491637084577?text=Merhaba

Tekrar hoş geldiniz.

Sevgiler,
CorteQS Ekibi
`;

export const FOUNDING1000_WELCOME_HTML = `
<!doctype html>
<html lang="tr">
  <body style="margin:0;padding:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
            <tr>
              <td style="background:linear-gradient(135deg,#0EA5A4 0%,#0F766E 100%);padding:28px 32px;color:#ffffff;">
                <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:0.85;">CorteQS</div>
                <div style="font-size:24px;font-weight:800;margin-top:6px;">Kurucu 1000'e Hoş Geldiniz 🎉</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;font-size:15px;line-height:1.65;">
                <p style="margin:0 0 14px;">Merhaba,</p>
                <p style="margin:0 0 14px;">
                  <strong>CorteQS Kurucu 1000</strong> arasına katıldığınız için teşekkür ederiz.
                  Sizi, platformumuzun ilk yol arkadaşları arasında görmekten mutluluk duyuyoruz.
                </p>
                <p style="margin:0 0 14px;">
                  Platformumuz şu anda hızlı bir yapım aşamasında. Hemen her hafta yeni bir özellik
                  landing page'imize ekleniyor ve CorteQS deneyimini adım adım geliştiriyoruz.
                </p>
                <p style="margin:0 0 14px;">
                  Lansmanımızı <strong>29 Ekim</strong>'de gerçekleştirmeyi planlıyoruz.
                  Kurucu 1000 üyeleri, lansmandan itibaren geçerli olmak üzere
                  <strong>1 yıl boyunca üyeliklerini garantiye almış</strong> olacak.
                  Ayrıca aramıza katılımınız, sosyal medya hesaplarımızda da duyurulacak.
                </p>
                <p style="margin:0 0 20px;">
                  Kontrol panellerinizi kullanıma açtıktan sonra sizi gelişmelerden haberdar edeceğiz.
                  Bu süreçte hızlı erişim ve bilgi almak için CorBot WhatsApp hattımızı da kullanabilirsiniz:
                </p>
                <p style="margin:0 0 24px;text-align:center;">
                  <a href="https://wa.me/491637084577?text=Merhaba"
                     style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;">
                    🤖 CorBot — WhatsApp Bot
                  </a>
                </p>
                <p style="margin:0 0 6px;">Tekrar hoş geldiniz.</p>
                <p style="margin:0;">Sevgiler,<br/><strong>CorteQS Ekibi</strong></p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background:#f1f5f9;font-size:12px;color:#64748b;text-align:center;">
                © CorteQS — Global Türk Diasporası Platformu
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
