import LegalLayout from "./LegalLayout";

const CookiePolicy = () => (
  <LegalLayout title="Çerez Politikası / Cookie Policy">
    <p>
      CorteQS, ePrivacy Direktifi (EU 2002/58/EC), GDPR ve KVKK kapsamında çerez kullanımı
      hakkında sizi bilgilendirir.
    </p>

    <h2>1. Çerez Türleri</h2>
    <ul>
      <li><strong>Zorunlu çerezler:</strong> Oturum, güvenlik (rıza gerektirmez).</li>
      <li><strong>İşlevsel çerezler:</strong> Dil, tema, diaspora seçimi.</li>
      <li><strong>Analitik çerezler:</strong> Sayfa istatistikleri (rıza gerektirir).</li>
      <li><strong>Pazarlama çerezleri:</strong> Reklam, retargeting (rıza gerektirir).</li>
    </ul>

    <h2>2. Tercihlerinizi Yönetme</h2>
    <p>
      Sayfanın altında çıkan çerez bandından "Tümünü Kabul Et", "Sadece Zorunlu" veya "Reddet"
      seçeneklerinden birini seçebilirsiniz. Tarayıcı ayarlarından da çerezleri istediğiniz
      zaman silebilirsiniz.
    </p>

    <h2>3. Saklama Süreleri</h2>
    <p>Oturum: tarayıcı kapanınca; kalıcı çerezler: 6–24 ay.</p>

    <h2>4. İletişim</h2>
    <p>
      <a href="mailto:privacy@corteqs.com">privacy@corteqs.com</a>
    </p>
  </LegalLayout>
);

export default CookiePolicy;
