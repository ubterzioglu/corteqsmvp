import LegalLayout from "./LegalLayout";

const ServiceDeliveryPolicy = () => (
  <LegalLayout title="Hizmet Teslim Politikası / Service Delivery Policy" seoKey="serviceDelivery">
    <p>
      CorteQS, fiziksel ürün satan bir mağaza değildir. Platform üzerinden sunulan hizmetler
      dijital erişim, profil oluşturma, dizin görünürlüğü, topluluk araçları, etkinlik/ilan araçları,
      premium üyelik ve benzeri online hizmetlerden oluşur.
    </p>

    <h2>1. Hizmet Kapsamı</h2>
    <p>
      CorteQS; bireyler, danışmanlar, işletmeler, dernekler, bloggerlar, şehir elçileri ve diaspora
      toplulukları için global networking, profil, dizin, marketplace ve topluluk yönetimi araçları
      sunar. Ücretli planlar ve özellikler fiyatlandırma sayfasında açıklanır.
    </p>

    <h2>2. Dijital Teslimat</h2>
    <ul>
      <li>Ücretli dijital hizmetler, ödeme onayından sonra kullanıcı hesabı üzerinden aktif edilir.</li>
      <li>Abonelik erişimi normal şartlarda ödeme onayından hemen sonra veya en geç 24 saat içinde sağlanır.</li>
      <li>Fiziksel kargo, posta veya ürün teslimatı yapılmaz.</li>
      <li>Kullanıcı, hesabına giriş yaparak aktif özelliklerini ve profil/paket durumunu kontrol edebilir.</li>
    </ul>

    <h2>3. Fatura ve Ödeme Onayı</h2>
    <p>
      Ödeme tamamlandıktan sonra kullanıcıya ödeme onayı, makbuz veya fatura bilgisi Stripe,
      e-posta veya CorteQS hesap ekranı üzerinden sağlanabilir. Kurumsal fatura talepleri için
      info@corteqs.net adresi kullanılmalıdır.
    </p>

    <h2>4. Abonelik ve Yenileme</h2>
    <p>
      Aylık veya yıllık aboneliklerde ücretlendirme seçilen plana göre yapılır. Yıllık planlarda
      indirim uygulanabilir. Aboneliklerin yenilenmesi ve iptal koşulları{" "}
      <a href="/legal/refund-cancellation">İade ve İptal Politikası</a> ile{" "}
      <a href="/legal/terms">Kullanım Şartları</a> içinde açıklanır.
    </p>

    <h2>5. Erişim Problemleri</h2>
    <p>
      Ödeme sonrası hizmet erişimi sağlanmazsa kullanıcı, ödeme referansı ve hesap e-posta
      adresiyle birlikte info@corteqs.net üzerinden destek talebi oluşturmalıdır. Teknik sorunlar
      mümkün olan en kısa sürede incelenir.
    </p>

    <h2>6. Kullanıcı Sorumluluğu</h2>
    <ul>
      <li>Kullanıcı, hesap bilgilerini doğru ve güncel tutmalıdır.</li>
      <li>Kullanıcı, profil, ilan, etkinlik veya kampanya içeriklerinin doğruluğundan sorumludur.</li>
      <li>Yasalara, üçüncü kişi haklarına ve platform kurallarına aykırı içerikler askıya alınabilir veya kaldırılabilir.</li>
    </ul>

    <h2>7. Hizmetin Askıya Alınması</h2>
    <p>
      Ödeme başarısız olursa, abonelik sona ererse, kötüye kullanım tespit edilirse veya Kullanım
      Şartları ihlal edilirse, ilgili ücretli özellikler askıya alınabilir veya sonlandırılabilir.
    </p>

    <h2>8. İletişim</h2>
    <p>
      CorteQS Global L.L.C.<br />
      8 The Green, Ste D, Dover, DE 19901, United States<br />
      Email: <a href="mailto:info@corteqs.net">info@corteqs.net</a><br />
      Website: <a href="https://corteqs.net">https://corteqs.net</a>
    </p>

    <hr />

    <h2>English Summary</h2>
    <p>
      CorteQS is not a physical-goods store. Services offered on the platform consist of digital
      access, profile creation, directory visibility, community tools, event/listing tools, premium
      membership, and similar online services.
    </p>

    <h3>Digital Delivery</h3>
    <ul>
      <li>Paid digital services are activated through the user account after payment confirmation.</li>
      <li>Subscription access is normally granted immediately after payment confirmation, or within 24 hours at the latest.</li>
      <li>No physical shipping, postal, or product delivery is performed.</li>
      <li>Users can verify active features and profile/package status by logging into their account.</li>
    </ul>

    <h3>Billing &amp; Payment Confirmation</h3>
    <p>
      After payment, a confirmation, receipt, or invoice may be provided via Stripe, email, or the
      CorteQS account screen. For corporate invoice requests, contact info@corteqs.net.
    </p>

    <h3>Access Problems</h3>
    <p>
      If service access is not provided after payment, the user should open a support request at
      <a href="mailto:info@corteqs.net"> info@corteqs.net</a> with the payment reference and account
      email. Technical issues are reviewed as soon as possible. Paid features may be suspended or
      terminated upon payment failure, subscription expiry, abuse, or breach of the Terms of Service.
    </p>
  </LegalLayout>
);

export default ServiceDeliveryPolicy;
