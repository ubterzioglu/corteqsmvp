import LegalLayout from "./LegalLayout";

const KVKK = () => (
  <LegalLayout title="KVKK / GDPR / CCPA Aydınlatma Metni">
    <p>
      İşbu Aydınlatma Metni; <strong>6698 sayılı KVKK m.10</strong>,{" "}
      <strong>GDPR Art. 13-14</strong>, <strong>CCPA §1798.100</strong>, <strong>PIPEDA Principle 4.8</strong>,{" "}
      <strong>APP 5</strong> ve <strong>LGPD Art. 9</strong> kapsamında, veri sahibi olarak sizi
      bilgilendirmek amacıyla hazırlanmıştır.
    </p>

    <h2>1. Veri Sorumlusunun Kimliği</h2>
    <p>
      <strong>CorteQS Global Ltd.</strong> — Veri Sorumlusu sıfatıyla.
      <br />
      İletişim: <a href="mailto:kvkk@corteqs.com">kvkk@corteqs.com</a> ·{" "}
      <a href="mailto:dpo@corteqs.com">dpo@corteqs.com</a>
    </p>

    <h2>2. Hangi Verileri İşliyoruz?</h2>
    <ul>
      <li>Kimlik & İletişim verileri</li>
      <li>Hesap, profil ve içerik verileri</li>
      <li>Lokasyon (şehir/ülke), işlem geçmişi</li>
      <li>Çerez ve teknik veriler</li>
    </ul>

    <h2>3. İşleme Amaçları</h2>
    <ul>
      <li>Üyelik ve hesap yönetimi</li>
      <li>Hizmet sunumu ve eşleştirme</li>
      <li>Yasal yükümlülüklerin yerine getirilmesi</li>
      <li>Güvenlik, dolandırıcılık önleme</li>
      <li>Açık rızaya bağlı pazarlama faaliyetleri</li>
    </ul>

    <h2>4. Hukuki Sebepler</h2>
    <ul>
      <li>KVKK m.5/2-c — sözleşmenin ifası için zorunluluk</li>
      <li>KVKK m.5/2-ç — hukuki yükümlülük</li>
      <li>KVKK m.5/2-f — meşru menfaat</li>
      <li>KVKK m.5/1 / GDPR Art. 6/1-a — açık rıza</li>
    </ul>

    <h2>5. Aktarım</h2>
    <p>
      Veriler; bulut altyapı (Supabase, AB/CH bölgesi), e-posta servisleri (Resend), ödeme
      sağlayıcılar (Stripe) ve yasal merciler ile gerektiğinde paylaşılabilir. Yurtdışı
      aktarımlar KVKK m.9 ve GDPR Bölüm V'e uygun yapılır.
    </p>

    <h2>6. Veri Sahibi Hakları (KVKK m.11 / GDPR Art. 15-22)</h2>
    <ul>
      <li>Kişisel verinizin işlenip işlenmediğini öğrenme</li>
      <li>İşlenmişse buna ilişkin bilgi talep etme</li>
      <li>İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
      <li>Yurt içi/dışı üçüncü kişileri bilme</li>
      <li>Eksik/yanlış işlenmişse düzeltilmesini isteme</li>
      <li>KVKK m.7 / GDPR Art. 17 çerçevesinde silinmesini/yok edilmesini isteme</li>
      <li>Düzeltme/silme işlemlerinin üçüncü kişilere bildirilmesini isteme</li>
      <li>Otomatik sistemlerle analiz sonucunda aleyhinize çıkan sonuca itiraz</li>
      <li>Zarara uğramanız hâlinde tazminat talep etme</li>
    </ul>

    <h2>7. Başvuru Yöntemi</h2>
    <p>
      Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ uyarınca yazılı olarak veya
      kayıtlı elektronik posta ile <a href="mailto:kvkk@corteqs.com">kvkk@corteqs.com</a>{" "}
      adresine başvurabilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz olarak
      sonuçlandırılır.
    </p>

    <h2>8. Açık Rıza Beyanı</h2>
    <p>
      Kayıt formlarında "Kişisel verilerimin işlenmesine açık rıza veriyorum" kutusunu
      işaretleyerek; yukarıda belirtilen kişisel verilerinizin, belirtilen amaçlarla, belirtilen
      yöntem ve hukuki sebeplerle işlenmesine, gerektiğinde yurt içi ve yurt dışına
      aktarılmasına özgür iradenizle açık rıza vermiş olursunuz.
    </p>
  </LegalLayout>
);

export default KVKK;
