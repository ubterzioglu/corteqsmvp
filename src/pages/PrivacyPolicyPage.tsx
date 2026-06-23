import LegalLayout from "./LegalLayout";

const PrivacyPolicyPage = () => (
  <LegalLayout title="Gizlilik Politikası" seoKey="privacy">
    <p>
      CorteQS olarak kişisel verilerinizi; hizmetlerimizi sunmak, topluluk deneyimini güvenli
      tutmak ve yasal yükümlülüklerimizi yerine getirmek amacıyla işleriz. Bu politika,
      web sitemiz, üyelik akışlarımız, iletişim formlarımız ve resmi topluluk kanallarımız
      üzerinden toplanan verilerin nasıl kullanıldığını özetler.
    </p>

    <h2>1. Hangi verileri topluyoruz?</h2>
    <ul>
      <li>Kimlik ve iletişim bilgileri: ad, soyad, e-posta, telefon veya WhatsApp numarası</li>
      <li>Profil ve topluluk verileri: ülke, şehir, ilgi alanları, seçtiğiniz kategoriler</li>
      <li>İçerik verileri: paylaşımlar, yorumlar, başvuru formları ve gönüllü olarak sunduğunuz bilgiler</li>
      <li>Teknik veriler: IP adresi, cihaz bilgisi, tarayıcı türü ve temel kullanım kayıtları</li>
    </ul>

    <h2>2. Verileri hangi amaçlarla işliyoruz?</h2>
    <ul>
      <li>Hesap oluşturmak, oturum yönetmek ve platform özelliklerini sunmak</li>
      <li>Topluluk deneyimini kişiselleştirmek ve şehir bazlı eşleşmeleri göstermek</li>
      <li>Destek taleplerini, iş birliği başvurularını ve topluluk iletişimini yürütmek</li>
      <li>Güvenlik, dolandırıcılık önleme ve kötüye kullanım tespiti yapmak</li>
      <li>Yasal yükümlülükleri yerine getirmek ve hak taleplerini yönetmek</li>
    </ul>

    <h2>3. Hukuki dayanak</h2>
    <p>
      Türkiye'de veri işleme faaliyetlerimiz esas olarak <strong>KVKK m.5</strong> kapsamındaki
      açık rıza, sözleşmenin kurulması veya ifası, hukuki yükümlülük ve meşru menfaat
      sebeplerine dayanır. Avrupa Ekonomik Alanı ve Birleşik Krallık kullanıcıları için benzer
      işlemler <strong>GDPR Art. 6</strong> kapsamındaki uygun hukuki dayanaklarla yürütülür.
      Gerekli durumlarda açık rıza ayrıca alınır.
    </p>

    <h2>4. WhatsApp ve topluluk iletişimi</h2>
    <p>
      Resmi WhatsApp topluluğumuza katıldığınızda veya bize bu kanal üzerinden yazdığınızda,
      telefon numaranız ve paylaştığınız içerikler ilgili platform sağlayıcısının kuralları
      çerçevesinde işlenebilir. CorteQS, bu verileri yalnızca destek, topluluk koordinasyonu ve
      talep yönetimi amaçlarıyla kullanır; üçüncü kişilere pazarlama amacıyla satmaz.
    </p>

    <h2>5. Veri paylaşımı</h2>
    <p>Kişisel verilerinizi satmayız. Sınırlı paylaşım yalnızca aşağıdaki durumlarda yapılır:</p>
    <ul>
      <li>Barındırma, veri tabanı, e-posta veya analitik gibi teknik hizmet sağlayıcılarla</li>
      <li>Ödeme, güvenlik veya yasal yükümlülük süreçlerinde gerekli iş ortaklarıyla</li>
      <li>Kanunen yetkili kamu kurumları veya yargı mercileriyle</li>
    </ul>

    <h2>6. Uluslararası veri aktarımı</h2>
    <p>
      CorteQS global bir ürün olduğu için bazı hizmet sağlayıcılarımız farklı ülkelerde yer alabilir.
      KVKK kapsamındaki yurt dışı aktarım yükümlülükleri ile GDPR kapsamındaki uygun güvence
      mekanizmaları dikkate alınarak hareket edilir; teknik ve sözleşmesel önlemler uygulanır.
    </p>

    <h2>7. Saklama süresi</h2>
    <p>
      Veriler yalnızca gerekli olduğu süre boyunca saklanır. Süreler; hizmetin niteliği,
      hukuki yükümlülükler, destek kayıtları ve güvenlik ihtiyaçları dikkate alınarak belirlenir.
      Saklama süresi sona erdiğinde veri silinir, anonimleştirilir veya erişimi kısıtlanır.
    </p>

    <h2>8. Haklarınız</h2>
    <p>
      Uygulanan mevzuata bağlı olarak verilerinize erişme, düzeltme, silme, işlemeyi kısıtlama,
      itiraz etme ve uygun olduğu ölçüde veri taşınabilirliği talep etme haklarına sahipsiniz.
      KVKK kapsamındaki talepleriniz için ayrıca veri sorumlusuna başvuru hakkınız bulunur.
    </p>

    <h2>9. Başvuru ve iletişim</h2>
    <p>
      Gizlilik talepleri, veri hakları başvuruları veya bu politikanın yorumlanmasına ilişkin
      sorularınız için <a href="mailto:info@corteqs.net">info@corteqs.net</a> adresine yazabilirsiniz.
      Web sitemiz: <a href="https://corteqs.net/legal/privacy">https://corteqs.net/legal/privacy</a>
    </p>

    <h2>10. Güncellemeler</h2>
    <p>
      Bu politika zaman zaman güncellenebilir. Esaslı değişiklikler bu sayfada yayımlanır ve
      gerektiğinde ek bildirimler sağlanır.
    </p>
  </LegalLayout>
);

export default PrivacyPolicyPage;
