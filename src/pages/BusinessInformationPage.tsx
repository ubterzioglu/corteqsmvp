import LegalLayout from "./LegalLayout";

const BusinessInformationPage = () => (
  <LegalLayout title="Şirket ve İletişim Bilgileri / Business Information" seoKey="businessInfo">
    <p>
      Bu sayfa, CorteQS platformunun işletme bilgilerini, hizmet açıklamasını ve ödeme sonrası
      destek kanallarını özetler. Stripe, banka, kullanıcı ve iş ortakları için şeffaflık sağlamak
      amacıyla hazırlanmıştır.
    </p>

    <h2>1. Şirket Bilgileri</h2>
    <p>
      Legal name: CorteQS Global L.L.C.<br />
      Business type: Delaware limited liability company<br />
      Registered address: 8 The Green, Ste D, Dover, DE 19901, United States<br />
      Website: <a href="https://corteqs.net">https://corteqs.net</a><br />
      Support email: <a href="mailto:info@corteqs.net">info@corteqs.net</a>
    </p>

    <h2>2. Hizmet Açıklaması</h2>
    <p>
      CorteQS, Türk diasporası ve global topluluklar için networking, profil oluşturma, dizin,
      topluluk, marketplace, işletme/kuruluş tanıtımı ve dijital görünürlük araçları sunan online
      bir platformdur. Platform; bireyler, danışmanlar, işletmeler, dernekler, topluluk yöneticileri,
      bloggerlar ve şehir elçileri için kullanılabilir.
    </p>

    <h2>3. Satılan Ürün/Hizmet Türleri</h2>
    <ul>
      <li>Premium dijital üyelikler ve abonelikler.</li>
      <li>Danışman, işletme veya kuruluş profil görünürlüğü.</li>
      <li>Etkinlik, ilan, kampanya ve topluluk araçları.</li>
      <li>Boost, duyuru, vitrin veya benzeri dijital tanıtım paketleri.</li>
      <li>Bireysel kullanıcılar için ücretsiz temel platform erişimi.</li>
    </ul>

    <h2>4. Teslimat Modeli</h2>
    <p>
      CorteQS hizmetleri tamamen dijital olarak sunulur. Fiziksel ürün gönderimi, kargo veya posta
      teslimatı yapılmaz. Ödeme sonrası erişim kullanıcı hesabı üzerinden aktive edilir.
    </p>

    <h2>5. Ödeme, İade ve İptal</h2>
    <p>
      Ödemeler güvenli ödeme altyapıları üzerinden işlenir. Abonelik, iptal ve iade koşulları için
      lütfen <a href="/legal/refund-cancellation">İade ve İptal Politikası</a> sayfasını inceleyin.
      Dijital hizmet teslim koşulları için <a href="/legal/service-delivery">Hizmet Teslim Politikası</a>
      geçerlidir.
    </p>

    <h2>6. Destek</h2>
    <p>
      Ödeme, abonelik, erişim, fatura veya hesap konularında destek almak için
      <a href="mailto:info@corteqs.net"> info@corteqs.net</a> adresinden bize ulaşabilirsiniz.
      Destek taleplerinde ödeme referansı, hesap e-posta adresi ve sorun açıklaması paylaşılmalıdır.
    </p>

    <h2>7. Güncelleme</h2>
    <p>
      Bu sayfadaki bilgiler şirket, ödeme altyapısı veya hizmet kapsamı değiştikçe güncellenebilir.
    </p>

    <hr />

    <h2>English Summary</h2>
    <p>
      This page summarizes the business information, service description, and post-payment support
      channels of the CorteQS platform. It is provided for transparency toward Stripe, banks, users,
      and business partners.
    </p>

    <h3>Company Details</h3>
    <p>
      Legal name: CorteQS Global L.L.C.<br />
      Business type: Delaware limited liability company<br />
      Registered address: 8 The Green, Ste D, Dover, DE 19901, United States<br />
      Website: <a href="https://corteqs.net">https://corteqs.net</a><br />
      Support email: <a href="mailto:info@corteqs.net">info@corteqs.net</a>
    </p>

    <h3>Service &amp; Delivery Model</h3>
    <p>
      CorteQS is an online platform offering networking, profile creation, directory, community,
      marketplace, business/organization promotion, and digital visibility tools for the Turkish
      diaspora and global communities. All services are delivered digitally; there is no physical
      shipping. Access is activated through the user account after payment. For payment, refund, and
      cancellation terms see the <a href="/legal/refund-cancellation">Refund &amp; Cancellation Policy</a>{" "}
      and <a href="/legal/service-delivery">Service Delivery Policy</a>. For support, contact{" "}
      <a href="mailto:info@corteqs.net">info@corteqs.net</a>.
    </p>
  </LegalLayout>
);

export default BusinessInformationPage;
