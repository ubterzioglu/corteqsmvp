import LegalLayout from "./LegalLayout";

const PrivacyPolicy = () => (
  <LegalLayout title="Gizlilik Politikası / Privacy Policy">
    <p>
      CorteQS ("Platform", "biz", "bize") olarak, kişisel verilerinizin korunmasına büyük önem
      veriyoruz. Bu Gizlilik Politikası; Türkiye Cumhuriyeti{" "}
      <strong>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)</strong>, Avrupa Birliği{" "}
      <strong>Genel Veri Koruma Tüzüğü (GDPR — Regulation EU 2016/679)</strong>, Birleşik Krallık{" "}
      <strong>UK GDPR & Data Protection Act 2018</strong>, ABD{" "}
      <strong>California Consumer Privacy Act (CCPA / CPRA)</strong>, Kanada{" "}
      <strong>PIPEDA</strong>, Avustralya <strong>Privacy Act 1988 (APPs)</strong>, İsviçre{" "}
      <strong>nFADP</strong> ve Brezilya <strong>LGPD</strong> başta olmak üzere yürürlükteki
      tüm ilgili veri koruma mevzuatına uygun olarak hazırlanmıştır.
    </p>

    <h2>1. Veri Sorumlusu / Data Controller</h2>
    <p>
      <strong>CorteQS Global Ltd.</strong>
      <br />
      İletişim: <a href="mailto:privacy@corteqs.com">privacy@corteqs.com</a>
      <br />
      Veri Koruma Görevlisi (DPO): <a href="mailto:dpo@corteqs.com">dpo@corteqs.com</a>
    </p>

    <h2>2. İşlenen Kişisel Veriler</h2>
    <ul>
      <li><strong>Kimlik:</strong> Ad, soyad, kullanıcı adı.</li>
      <li><strong>İletişim:</strong> E-posta, telefon (WhatsApp), ülke, şehir, adres.</li>
      <li><strong>Hesap & Profil:</strong> Şifre (hash), avatar, hesap türü (kullanıcı, danışman, işletme...).</li>
      <li><strong>İçerik:</strong> CV, sunum, belgeler, mesajlar, talepler, teklifler, yorumlar.</li>
      <li><strong>İşlem:</strong> Hizmet talepleri, hoşgeldin paketi siparişleri, ödeme metaverisi.</li>
      <li><strong>Konum:</strong> Şehir / ülke seviyesinde (kesin koordinat opsiyoneldir).</li>
      <li><strong>Teknik:</strong> IP, tarayıcı, cihaz, çerez, log kayıtları.</li>
    </ul>

    <h2>3. İşleme Amaçları ve Hukuki Sebepler</h2>
    <ul>
      <li>Hizmetin sunulması (sözleşmenin ifası — GDPR Art. 6/1-b · KVKK m.5/2-c).</li>
      <li>Yasal yükümlülüklerin yerine getirilmesi (GDPR Art. 6/1-c · KVKK m.5/2-ç).</li>
      <li>Meşru menfaat — güvenlik, sahtecilik önleme (GDPR Art. 6/1-f · KVKK m.5/2-f).</li>
      <li>Açık rıza — pazarlama, profil eşleştirme (GDPR Art. 6/1-a · KVKK m.5/1).</li>
    </ul>

    <h2>4. Veri Aktarımı / Data Transfers</h2>
    <p>
      Verileriniz <strong>AB (Frankfurt)</strong> ve <strong>İsviçre</strong> bölgelerindeki Supabase
      altyapısında saklanır. Türkiye dışına aktarımlarda KVKK m.9 uyarınca{" "}
      <strong>açık rıza</strong> veya <strong>yeterli koruma kararı</strong>; AB dışı aktarımlarda
      <strong> Standard Contractual Clauses (SCCs)</strong> uygulanır. Hizmet sağlayıcılarımız:
      Supabase Inc., Cloudflare, Resend, Lovable Cloud, Stripe.
    </p>

    <h2>5. Saklama Süreleri</h2>
    <ul>
      <li>Aktif hesap verileri: hesap aktif olduğu sürece + 3 yıl.</li>
      <li>Faturalandırma kayıtları: 10 yıl (vergi mevzuatı).</li>
      <li>Çerez verileri: 6–24 ay.</li>
      <li>Pazarlama izinleri: izin geri alınana kadar.</li>
    </ul>

    <h2 id="rights">6. Haklarınız / Your Rights</h2>
    <p>
      KVKK m.11, GDPR Art. 15-22, CCPA §1798.100-130, PIPEDA Schedule 1, APPs 12-13 ve LGPD Art. 18
      kapsamında aşağıdaki haklara sahipsiniz:
    </p>
    <ul>
      <li>Bilgi alma ve erişim hakkı.</li>
      <li>Düzeltme ve güncelleme hakkı.</li>
      <li>Silme / unutulma hakkı (right to be forgotten).</li>
      <li>İşlemenin sınırlandırılması hakkı.</li>
      <li>Veri taşınabilirliği hakkı (data portability).</li>
      <li>İtiraz hakkı ve otomatik karara tabi olmama hakkı.</li>
      <li>Açık rızanızı geri çekme hakkı.</li>
      <li>Denetim otoritesine şikâyet hakkı (KVK Kurulu, EDPB, ICO, CPPA, OPC, OAIC...).</li>
      <li>"Do Not Sell or Share My Personal Information" (CCPA için).</li>
    </ul>
    <p>
      Bu haklarınızı kullanmak için: <a href="mailto:privacy@corteqs.com">privacy@corteqs.com</a>{" "}
      adresine yazın. Talebiniz 30 gün içinde ücretsiz olarak yanıtlanır.
    </p>

    <h2>7. Çocuklar</h2>
    <p>
      Platform 16 yaş altı kullanıcılara yönelik değildir. 16 yaş altı kişiden bilerek veri
      toplamayız.
    </p>

    <h2>8. Güvenlik</h2>
    <p>
      End-to-end TLS 1.3, AES-256 şifreleme, Row-Level Security (RLS), düzenli sızma testleri,
      ISO 27001 uyumlu süreçler.
    </p>

    <h2>9. Değişiklikler</h2>
    <p>
      Politika güncellendiğinde önemli değişiklikler için size e-posta ile bildirim gönderilir.
    </p>
  </LegalLayout>
);

export default PrivacyPolicy;
