import LegalLayout from "./LegalLayout";

const RefundCancellationPolicy = () => (
  <LegalLayout title="İade ve İptal Politikası / Refund & Cancellation Policy">
    <p>
      Bu politika, CorteQS Global L.L.C. tarafından sunulan dijital platform üyelikleri,
      premium abonelikler, görünürlük paketleri, etkinlik/ilan araçları ve benzeri dijital
      hizmetler için geçerlidir. Fiziksel ürün gönderimi yapılmaz.
    </p>

    <h2>1. Ödeme İşleyicisi</h2>
    <p>
      Ödemeler Stripe veya Stripe tarafından desteklenen ödeme yöntemleri üzerinden güvenli
      şekilde işlenir. CorteQS, tam kart numarası gibi hassas kart bilgilerini kendi
      sunucularında saklamaz.
    </p>

    <h2>2. Ücretsiz Deneme</h2>
    <p>
      Uygun kullanıcılar için sunulan ücretsiz deneme döneminde kredi kartı gerekmeyebilir.
      Deneme süresi sonunda ücretli abonelik yalnızca kullanıcı açıkça ücretli plana geçerse
      başlatılır.
    </p>

    <h2>3. Abonelik İptali</h2>
    <ul>
      <li>Kullanıcılar aboneliklerini istedikleri zaman iptal talebiyle sonlandırabilir.</li>
      <li>İptal, mevcut fatura döneminin sonunda geçerli olur.</li>
      <li>İptalden sonra ücretli özelliklere erişim ilgili dönem sonuna kadar devam edebilir.</li>
      <li>İptal talebi için info@corteqs.net adresine yazılabilir.</li>
    </ul>

    <h2>4. İade Koşulları</h2>
    <p>
      Dijital hizmetler, abonelikler ve platform erişimleri için genel kural olarak, ödeme
      sonrası hizmet erişimi sağlandıktan ve/veya hizmet kullanılmaya başlandıktan sonra iade
      yapılmaz. Ancak aşağıdaki durumlarda iade değerlendirilebilir:
    </p>
    <ul>
      <li>Mükerrer veya hatalı tahsilat yapılması.</li>
      <li>Teknik bir problem nedeniyle hizmete erişimin makul süre içinde sağlanamaması.</li>
      <li>Ödemenin yetkisiz veya hatalı olduğunun makul belgelerle gösterilmesi.</li>
      <li>Geçerli tüketici hukukunun zorunlu olarak iade hakkı tanıdığı durumlar.</li>
    </ul>

    <h2>5. AB/AEA Tüketicileri İçin Cayma Hakkı</h2>
    <p>
      AB/AEA bölgesindeki tüketiciler, geçerli tüketici hukuku kapsamında 14 günlük cayma
      hakkına sahip olabilir. Dijital hizmetin derhal başlamasını talep eden ve hizmetten
      yararlanmaya başlayan kullanıcılar bakımından, geçerli hukuk izin verdiği ölçüde cayma
      hakkı sınırlanabilir veya sona erebilir. Zorunlu tüketici hakları saklıdır.
    </p>

    <h2>6. İade Talebi Süreci</h2>
    <p>
      İade veya iptal talepleri info@corteqs.net adresine gönderilmelidir. Talepte ödeme tarihi,
      kullanılan e-posta adresi, fatura/ödeme referansı ve talep nedeni belirtilmelidir. Talepler
      normal şartlarda 7 iş günü içinde incelenir.
    </p>

    <h2>7. Geri Ödeme Yöntemi</h2>
    <p>
      Onaylanan iadeler mümkün olduğunda ödemenin yapıldığı orijinal ödeme yöntemine geri
      gönderilir. Banka, kart sağlayıcısı veya Stripe kaynaklı işlem süreleri CorteQS kontrolü
      dışında olabilir.
    </p>

    <h2>8. İtiraz ve Chargeback Öncesi İletişim</h2>
    <p>
      Kullanıcılardan, bir ödeme itirazı veya chargeback başlatmadan önce info@corteqs.net
      üzerinden bizimle iletişime geçmeleri rica edilir. Bu, hatalı tahsilat veya erişim sorunlarının
      daha hızlı çözülmesine yardımcı olur.
    </p>

    <h2>9. İletişim</h2>
    <p>
      CorteQS Global L.L.C.<br />
      8 The Green, Ste D, Dover, DE 19901, United States<br />
      Email: <a href="mailto:info@corteqs.net">info@corteqs.net</a><br />
      Website: <a href="https://corteqs.net">https://corteqs.net</a>
    </p>
  </LegalLayout>
);

export default RefundCancellationPolicy;
