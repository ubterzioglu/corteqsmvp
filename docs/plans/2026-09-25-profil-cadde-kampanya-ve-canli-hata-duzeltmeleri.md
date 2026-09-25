# Profil, Cadde, Kampanya ve canlı hata düzeltmeleri

## Özet

Profil bilgileri genişletilecek, Cadde sadeleştirilecek, “Kurucu 1000” terminolojisi tekleştirilecek; taşınma, hata sınırı, eski paket ve admin ilanlarındaki canlı hatalar kapatılacak. Kampanya ve yarışmalar tek menüde toplanacak. İş sonunda revizyon istekleri kanıtla gözden geçirilip güncellenecek.

## Ürün değişiklikleri

- Tüm aktif profil rolleri için isteğe bağlı, varsayılan gizli ve kullanıcı tarafından düzenlenebilir `Öğrenim durumu` ve `Son bitirdiği üniversite/okul` alanlarını ekle. Öğrenim durumu seçenekleri: İlköğretim, Ortaöğretim, Lise, Ön lisans, Lisans, Yüksek lisans, Doktora.
- İlgi alanlarını profilin kişisel bilgiler alanının hemen altına taşı; bu alanın mevcut herkese açık ve gizlenemez kuralını koru.
- Yan paneldeki `Çarşı & İlgi Alanları` bölümünü yalnız `Cadde` yap. Cadde içeriğinde Çarşı verisi, sorgusu veya bağlantısı kalmasın; Çarşı için üst menü ekleme, ürün açıldığında ayrıca eklenecek.
- Yeni Cafe açıldığında, açanı hariç Cadde’ye erişimi olan tüm kullanıcılar için yalnız uygulama içi `cadde.cafe.opened` bildirimi oluştur. Bildirim Cadde’ye/Cafe’ye derin bağlantı versin ve mevcut Cafe simgesini kullansın.
- Üye teşekkür e-postasının görünür destek ve Reply-To adresini `destek@corteqs.net` yap; şablon, ortam değişkeni örneği ve dağıtım ayarını aynı değerde tut.
- Kullanıcıya görünen tüm “Founding 1000 / Founders 1000” metinlerini `Kurucu 1000` yap. URL, yönlendirme, veritabanı anahtarları ve teknik adlar değişmeden kalacak.
- Başlıktaki iki ayrı Kampanyalar/Yarışmalar bağlantısını tek `Kampanya & Yarışmalar` menüsüne indir; `/campaign` tek merkez ekran olarak kalsın, ayrı sekme oluşturma. Kampanya kartları detay sayfalarına yönlendirmeye devam etsin; kampanya SEO başlığı da güncellensin.

## Canlı hata düzeltmeleri

- Taşınma önerilerini API sınırında normalize et: eksik `explanations`, `score_breakdown`, hizmet dilleri ve checklist belge listeleri güvenli varsayılanlarla gelsin. Bileşenlerde de null güvenliği koru.
- `relocation_rank_locations_v1` için geriye uyumlu migration ile `explanations: []` döndür; servis, checklist ve acil durum akışlarını aynı sözleşme boşlukları açısından tara.
- `AppErrorBoundary`ye `location.key` ile sıfırlanan bir anahtar ekle. Genel sınır son çare olarak kalsın; Public ve Admin düzenlerinde yalnız `<Outlet>` çevresine rota-sınırlı sınır koyarak menü ve geri navigasyonunu erişilebilir tut.
- Eski JS paketleri için `vite:preloadError` akışını düzelt: yalnız yenileme gerçekten başlatıldıysa `preventDefault` çağrılacak. Yenileme sürerken lazy import `undefined` döner veya reddedilirse React’in `.default` okumasını engelleyen bekleyen bir yükleme durumu kullanılacak. Bu yardımcı tüm rota ve dinamik lazy importlarda kullanılacak; yenileme engellenmişse hata normal sınıra ulaşacak.
- Kadro ilanları filtresindeki boş Radix Select değeri yerine `all` sentinel değeri kullan; filtrelemede bunu “tümü” olarak yorumla.

## Revizyon kayıtlarının kapanış denetimi

- Dağıtım ve doğrulama tamamlandıktan sonra Admin > Revizyon İstekleri listesini başlık/alan/içerik üzerinden bu iş kalemleriyle eşleştir.
- Yalnız kodda uygulanıp test ve canlı kontrolle doğrulanan talepleri `Yapıldı` durumuna geçir. Kısmen tamamlanan veya bağımlılığı kalan kayıtları `İnceleniyor`da tut; kanıtsız kayıtları otomatik kapatma ya da iptal etme.
- Her incelenen kayda tek, kısa bir yorum ekle: `Yapıldı:` uygulanan değişiklik; `Yapılacak:` kalan takip işi veya “Yok”; `Gerekli:` doğrulama, dağıtım veya dış bağımlılık. Böylece talep sahibinin neyin tamamlandığını ve sıradaki adımı görmesi sağlanacak.

## Test ve kabul

- Gerçek RPC şekline uygun, `explanations` içermeyen taşınma verisiyle şehir kartı testi ekle; eksik hizmet/checklist alanları için çökme testleri yaz.
- Rota değişiminde hata sınırının sıfırlandığını, kabuk navigasyonunun korunduğunu; preload yenilemesi başlatılan ve soğuma süresinde bastırılan senaryoları test et.
- Profil alanları, ilgi alanı konumu, Cadde Cafe bildirimi, teşekkür e-postası, tek kampanya menüsü ve Kadro filtre sentinel’i için ilgili mevcut testleri güncelle/ekle.
- `npm run test`, `npx tsc -p tsconfig.app.json --noEmit` ve üretim buildini çalıştır.
- Dağıtım sonrası `client_error_reports` içinde `/relocation` açıklama hatası, lazy `.default` hatası ve boş Select değeri hatasının yeni kaydı olmadığını doğrula; ardından revizyon denetimini uygula.

## Varsayımlar

- “Cadde üyeleri”, ayrı üyelik tablosu olmadığı için Cadde’ye erişebilen aktif/onaylı kullanıcılar olarak ele alınır.
- Çarşı navigasyonu bu kapsamda bilinçli olarak eklenmez.
- `Yapıldı` revizyon statüsü yalnız canlıda doğrulanmış işler için kullanılır.
