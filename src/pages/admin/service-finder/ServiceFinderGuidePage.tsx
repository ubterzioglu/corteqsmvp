// /admin/service-finder/guide — Hizmet Bulucu kullanım kılavuzu.
import { Link } from "react-router-dom";

import AdminPageGuideAccordion, { type AdminPageGuideSection } from "@/components/admin/AdminPageGuideAccordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const guideSections: AdminPageGuideSection[] = [
  {
    title: "Hizmet Bulucu nedir ve ne yapar?",
    items: [
      "Hizmet Bulucu, belirli bir meslek ve lokasyon için web'i tarayan, bulunan profilleri aday olarak hazırlayan ve onayladıktan sonra doğrudan Katalog'a yayınlayan AI destekli bir keşif motorudur.",
      "Sistem üç katmandan oluşur: tarama motorunu çalıştıran bir arka plan işçisi (Coolify App 2), işleri kuyruğa alan ve izleyen bu admin paneli, ve yayınlanan adayları barındıran Katalog.",
      "Tüm web aramaları Tavily veya SerpAPI üzerinden yapılır; sayfa metinleri Gemini ile analiz edilir. Her adım maliyeti kayıt altına alır — bütçe aşılınca iş otomatik durur.",
      "Yayınlama her zaman manuel onayla gerçekleşir: sistem aday üretir, nihai kararı sen verirsin.",
    ],
  },
  {
    title: "İlk tarama işini oluşturma",
    items: [
      "1. 'Hizmet Bulucu' ana sayfasında 'Hızlı İş Oluştur' kartını aç.",
      "2. Meslek şablonu seç (örn. Doktor, Avukat, Psikolog) — şablon arama terimlerini ve dil konfigürasyonunu otomatik doldurur.",
      "3. İş başlığı, lokasyon (şehir + ülke kodu) gir. Lokasyon tarama sorgularına eklenir.",
      "4. Soft cap ve hard cap değerlerini USD olarak belirle. Soft cap tavsiye edilen durma noktası, hard cap kesin üst limitdir.",
      "5. İlk test için soft cap $0.10, hard cap $0.20 gibi düşük değerler kullan; sistemin düzgün çalıştığını doğruladıktan sonra artır.",
      "6. 'İşi Kuyruğa Al' — iş arka plan işçisi tarafından alınana kadar 'Kuyrukta' durumunda bekler.",
    ],
  },
  {
    title: "İş durumlarını anlama",
    items: [
      "Kuyrukta: iş oluşturuldu, işçi henüz almadı. İşçi çalışmıyorsa bu durumda takılır — Coolify App 2 loglarını kontrol et.",
      "Çalışıyor: işçi aktif olarak arama yapıyor. Sayfa 4 saniyede bir güncellenir, 'Maliyetler' sekmesinde harcama satırları düşmeye başlar.",
      "İncelemede: tarama tamamlandı, adaylar manuel onay bekliyor. En yaygın beklenen durum.",
      "Bütçe durdurdu: hard cap aşıldı veya soft cap geçildi ve işçi durdu. Adaylar varsa incelenebilir.",
      "Tamamlandı: adaylar işlendi (yayınlandı veya reddedildi).",
      "Başarısız: işçi hata aldı — iş detayında 'Olaylar' sekmesini aç, hata mesajını oku, API anahtarlarını ve sağlayıcı konfigürasyonunu kontrol et.",
    ],
  },
  {
    title: "Aday inceleme ve kataloga yayınlama",
    items: [
      "1. İş listesinden 'İncelemede' durumundaki işe tıkla, 'Adaylar' sekmesini aç.",
      "2. Her aday için isim, meslek, hizmet dilleri, lokasyon ve web kaynağı gösterilir. Kanıt alıntıları 'Kaynaklar' sekmesinde.",
      "3. Bilgilerin doğru olduğunu teyit et: isim arama sonucuyla uyuşuyor mu, lokasyon ve dil bilgisi eksiksiz mi?",
      "4. Gerekirse isim, meslek veya dil alanlarını düzeltip 'Kataloğa Yayınla' butonuna bas.",
      "5. Yayın sonrası toast bildirimi katalog kaydının ID'sini gösterir; '/admin/data' üzerinden doğrulayabilirsin.",
      "6. Yanlış veya düşük kaliteli adayları reddet — reddedilen adaylar işin aday listesinden silinir.",
    ],
  },
  {
    title: "Sağlayıcılar ve bütçe ayarları",
    items: [
      "'Sağlayıcılar' ekranında Tavily, SerpAPI ve Gemini bağlantılarını açıp kapatabilirsin.",
      "SerpAPI isteğe bağlıdır; Tavily bulamazsa devreye girer. Kullanmak istemiyorsan 'Sağlayıcılar' ekranından SerpAPI'yi kapat.",
      "Acil durum kill-switch: üç sağlayıcıyı da kapat ve Coolify App 2'yi durdur — yeni iş başlamaz, mevcut iş da durur.",
      "API anahtarları sadece Coolify ortam değişkenlerinde tutulur, repoya veya admin paneline girilmez.",
      "Coolify App 2 (worker) sağlıklı çalışıyorsa başlangıçta 'Service Finder worker başladı: sf-worker-coolify-1' logu görünür.",
    ],
  },
  {
    title: "Meslek şablonları",
    items: [
      "'Meslek Şablonları' ekranında her mesleke özel arama terimleri ve dil konfigürasyonları tanımlanır.",
      "Şablon, iş oluşturulurken seçilir ve sorgu üretimini yönlendirir — şablon ne kadar iyi tanımlanmışsa arama o kadar isabetlidir.",
      "Yeni bir meslek eklemek için şablon oluştur, birkaç test işi çalıştır, aday kalitesini değerlendirip şablonu iyileştir.",
      "Dil konfigürasyonu önemlidir: Almanya'da Türkçe konuşan doktor arıyorsan şablona 'Türkçe', 'Türkisch', 'Türk' gibi terimleri ekle.",
    ],
  },
  {
    title: "Maliyet takibi",
    items: [
      "'Maliyetler' ekranı sağlayıcı bazında toplam harcamayı gösterir.",
      "İş detayındaki 'Maliyetler' sekmesi ise o iş için her arama, ekstraksiyon ve sınıflandırma adımının maliyetini satır satır listeler.",
      "Aylık bütçeyi izlemek için ana sayfadaki 'Aylık Harcama' KPI kartını takip et.",
      "Hard cap taramaları gerçek anlamda durdurur — istemediğin harcamaların önüne geçmek için her işe makul bir hard cap koy.",
    ],
  },
  {
    title: "Sık karşılaşılan sorunlar",
    items: [
      "İş 'Kuyrukta' takılı kalıyor → Coolify App 2 çalışmıyor veya başlamıyor. App 2 loglarına bak; eksik ortam değişkeni varsa işçi başlangıçta hangi değişkenin eksik olduğunu yazar.",
      "'Yapılandırma/yetki hatası' olayı → Tavily veya Gemini API anahtarı yanlış ya da eksik. Anahtarı Coolify'da düzelt, işi 'Yeniden Dene' ile yeniden başlat.",
      "Aday gelmiyor ama maliyet düşüyor → Güven skoru düşük sayfalar 'İlgisiz' sayılıp elenmiştir. Sorgu terimlerini veya şablonu genişlet.",
      "Robots engelledi durumu → Hedef site taramayı engelledi. Bu normaldir, işçi devam eder; o kaynaktan aday bekleme.",
      "Tam geri alma gerekiyorsa → 'docs/plans/service-finder/2026-06-12-e2e.md' dosyasındaki Rollback bölümüne bak.",
    ],
  },
];

const ServiceFinderGuidePage = () => {
  return (
    <div className="space-y-4">
      <AdminPageGuideAccordion
        summary="İş oluşturma, durum takibi, aday inceleme, katalog yayını ve sağlayıcı ayarlarının tamamını bu sayfada bulabilirsin."
        sections={guideSections}
      />

      <Card>
        <CardHeader>
          <CardTitle>Hizmet Bulucu Kullanım Kılavuzu</CardTitle>
          <CardDescription>
            AI destekli web tarama modülünün günlük kullanım standardı.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Hizmet Bulucu üç ekranlı bir iş akışına dayanır: önce <strong>Tarama İşleri</strong>'nde iş oluştur ve kuyruğa al,
            arka plan işçisi taramayı tamamlayınca adayları gözden geçir, beğendiklerini <strong>Katalog</strong>'a yayınla.
            Her şey kayıt altında — maliyetler, olaylar ve kaynaklar iş detayında görünür.
          </p>
          <p>
            Sistem yeni ise önce düşük bütçeli bir canary işiyle ($0.10 / $0.20) başla, ardından şablonları ve bütçeleri
            gerçek operasyona göre ayarla. Sağlayıcı sorunlarında kill-switch olarak <strong>Sağlayıcılar</strong> ekranını kullan.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline">
              <Link to="/admin/service-finder">Ana Sayfa</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/service-finder/jobs">Tarama İşleri</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/service-finder/providers">Sağlayıcılar</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/service-finder/templates">Meslek Şablonları</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/service-finder/costs">Maliyetler</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceFinderGuidePage;
