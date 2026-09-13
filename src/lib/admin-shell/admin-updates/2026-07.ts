// Ürün güncellemeleri — Temmuz 2026 kayıtları (en yeniden eskiye).
// Tek kaynak barrel: ../admin-updates.ts — ekranlar oradan okur, buradan DEĞİL.

import type { AdminUpdateEntry } from "./types.ts";

export const ADMIN_UPDATES_2026_07: AdminUpdateEntry[] = [
  {
    id: "20260731-yapilacaklar-karti",
    date: "31 Temmuz 2026",
    title:
      "Durum Raporu sayfasına butonlu 'Yapılacaklar' kartı eklendi — bekleyen el işleri artık panelde",
    items: [
      "Şimdiye kadar 'sende kalanlar' listesi yalnızca sohbet mesajlarında ve devir notlarında yaşıyordu — panelde görünmüyordu. Artık Durum Raporu sayfasının üstünde bir Yapılacaklar kartı var: her madde kısa açıklamasıyla listeleniyor ve seni doğrudan ilgili ekrana götüren butonlar taşıyor.",
      "İlk beş madde: hoş geldin mailini yayına alma (kritik) · login gerektiren QA turu (Cadde/Araçlar/Referral test butonlarıyla) · kafe ikonu seçimi (5 öneri tek sayfada, buton oradan açıyor) · QA sonrası revizyon panosu çevirisi · ilk 18:00 günlük özetinin doğrulanması.",
      "Tamamlandı işareti kişiseldir: kutucuğu işaretlediğinde madde senin tarayıcında alta düşer ve soluklaşır — başka admin'in listesi etkilenmez. Ekipçe ortak takip gerekirse veritabanına taşınacak (bilinçli sade başlangıç).",
      "Kafe ikonu önerileri de yayına kondu: 5 varyant (CC monogram, C-kupa, ince belli çay bardağı, sohbet-fincan, asma tabela) 48/24/16 px boyutlarında ve örnek kafe kartı bağlamında tek sayfada karşılaştırılıyor.",
      "Durum: kod ana koda alındı, deploy sonrası panelde görünür.",
    ],
  },
  {
    id: "20260730-gunluk-ozet-maili",
    date: "30 Temmuz 2026",
    title:
      "Güncelleme mailleri artık gün boyu tek tek değil, akşam 18:00'de TEK özet mail olarak gelecek",
    items: [
      "Bugün fark edilen sorun: panele giren her kayıt, commit anında aboneye ayrı bir mail oluyordu — bugün gelen kutusuna 13 ayrı 'admin güncellemesi' maili düştü. Sıklığı sınırlayan bir kıstas yoktu.",
      "Yeni düzen: gün içinde girilen kayıtlar kuyrukta biriktiriliyor ve her akşam 18:00'de (Avrupa saati) hepsi tek mailde, bölüm bölüm gönderiliyor. Aboneler yine kendi maillerini ayrı ayrı alıyor; birleşen şey kayıtlar.",
      "'Yeni üye kaydoldu' ve üyeye giden 'hoş geldin' mailleri bu değişiklikten etkilenmedi — onlar doğası gereği anlık kalıyor.",
      "Paneldeki 'Şimdi gönder' düğmesi gücünü korudu: 18:00'i beklemeden, birikenleri yine tek özet mail olarak erken gönderebilirsin. Bildirim Ayarları sayfasının açıklamasına da bu kural yazıldı.",
      "Teknik taraf: kuyruğa 'vadesi geldiğinde gönder' alanı eklendi, gönderim fonksiyonu bekleyen güncelleme kayıtlarını tek zarfta birleştiriyor; hâlihazırdaki 15 dakikalık otomatik drenaj özeti 18:00-18:15 arasında yola çıkarıyor. Bu kaydın kendisi de yeni düzenin ilk yolcusu — 18:00 özetiyle gelmiş olmalı.",
    ],
  },
  {
    id: "20260730-mail-hatti-zohoya-gecti",
    date: "30 Temmuz 2026",
    title:
      "Mail sistemi Zoho'ya taşındı ve ÇALIŞIYOR — bekleyen 11 bildirim maili kurtarılıp gönderildi",
    items: [
      "Sabahki kayıtta 'mail servisinin anahtarı geçersiz, yenilenmesi bekleniyor' demiştik. Karar değişti: eski servis (Resend) tamamen bırakıldı, gönderim artık kendi Zoho Mail hesabımız üzerinden yapılıyor. Yani dışarıdan yeni bir anahtar beklemeye gerek kalmadı.",
      "Geçiş sırasında bir platform sınırına takıldık: hazır mail kütüphanesi, sunucumuzun izin verdiği işlem süresini tek mailde aşıp çöküyordu. Çözüm olarak gönderim katmanı sıfırdan, çok daha hafif şekilde yazıldı. Yayına almadan önce üç bağımsız kontrol turundan geçirildi.",
      "SONUÇ (canlıda doğrulandı): kuyrukta bekleyen 11 mail — bugünün 9 durum raporu + 2 yeni üye bildirimi — tek seferde, hatasız gönderildi. Gelen kutunda olmaları lazım. Kuyrukta bekleyen mail kalmadı.",
      "Site formlarından gelen başvuru bildirimleri de aynı hatta taşındı — yani 29 Temmuz'da yakalanan 'başvuru maili sessizce gitmiyor' arızasının kökü de kapanmış oldu.",
      "Hoş geldin maili altyapısı da canlıya alındı: veritabanı değişikliği uygulandı, gönderici yayında. Tek eksik genel anahtarın açılması — önce panelden 'Bana örnek hoş geldin maili gönder' ile gerçek görünümü kontrol etmen bekleniyor.",
      "Durum: mail hattı uçtan uca ÇALIŞIYOR. Hoş geldin maili anahtarı bilinçli kapalı; örnek mail kontrolünden sonra açılacak.",
    ],
  },
  {
    id: "20260730-profil-referral-dogrulama",
    date: "30 Temmuz 2026",
    title:
      "Profildeki referral kodu artık gerçekten doğrulanıyor — ve yönetici panelindeki 'Kullanımlar' listesi geri geldi",
    items: [
      "İki eski arıza kapandı. Birincisi: üye profilindeki referral kodu alanı Haziran'daki sistem yenilemesinden beri KAYDEDİLEMİYORDU — üstelik bu hata, 'Rolüne Özel Alanları Kaydet' düğmesindeki diğer alanların kaydını da yarıda kesiyordu. Artık alan kaydediliyor ve bir alanın hatası diğerlerini engellemiyor.",
      "Kod artık ön kayıt formundakiyle aynı sıkılıkta doğrulanıyor: geçersiz, süresi dolmuş ya da pasif kod kabul edilmiyor ve Türkçe bir açıklamayla reddediliyor.",
      "KİLİT kuralı: bir üye kodunu bir kez doğrulattıktan sonra değiştiremiyor ve silemiyor — alan '✓ Doğrulandı' rozetiyle salt-okunur görünüyor. Değişiklik gerekirse yönetici devreye girecek.",
      "İkinci arıza: yönetici panelindeki /admin/referral ekranında 'Kullanımlar' listesi bir yetki eksiği yüzünden hep boş görünüyor ve hata sessizce yutuluyordu. Yetki onarıldı, sessiz yutma bitti; liste artık Ad · E-posta · Kaynak rozeti (Ön kayıt / Profil) · Tarih biçiminde.",
      "Geçmiş de tamamlandı: profillere daha önce girilmiş 36 koddan gerçek bir koda karşılık gelen 35'i kullanım kaydına işlendi; kod sayaçları yeniden hesaplandı ve satırlarla birebir tutuyor. Eşleşmeyen 1 serbest metin kaydına dokunulmadı.",
      "Durum: veritabanı değişiklikleri canlıya UYGULANDI ve senaryo testleriyle doğrulandı; arayüz değişiklikleri ana kodda, deploy bekliyor.",
    ],
  },
  {
    id: "20260730-araclar-modulu-onarimi",
    date: "30 Temmuz 2026",
    title:
      "Araçlar modülü onarıldı: kırık sonuç butonları, 5 meslek, 2 şehir ve 'UK'de şehir bulunamadı' devri kapandı",
    items: [
      "Sonuç ekranındaki yönlendirme butonları: pano 'ikisi çalışmıyor' diyordu, gerçek durum daha kötüydü — butonların TAMAMI tıklanamıyordu ve iki bağlantı hiç var olmayan bir adrese gidiyordu. Adresler veritabanındaki 9 hesaplama fonksiyonunun içinde gömülüymüş; hepsi onarıldı, butonlar artık gerçek birer bağlantı. Daha önce üretilmiş sonuçlardaki kırık linkler de düzeltildi.",
      "Meslek listesi 5 kayıttan 35'e çıktı (doktor, diş hekimi, mimar, avukat, veri bilimci, elektrikçi, şoför… 12 meslek ailesi). Formdaki seçenek listesi artık tablodan besleniyor — yeni meslek eklemek deploy gerektirmiyor.",
      "Şehir listesi 2 kayıttan 32'ye çıktı (Londra, Manchester, New York, Toronto, Dubai, Münih, Paris, Viyana… 12 ülke). 'UK seçtim, şehir bulunamadı' şikâyetinin kök nedeni buydu: araç dünyada yalnızca Berlin ve Amsterdam'ı tanıyordu.",
      "Üçüncü ve gizli neden: ülke sorusu serbest metin — kullanıcı 'UK' yazınca sistem uluslararası kod olan 'GB' ile eşleştiremiyordu. Artık yaygın yazımlar (UK, İngiltere, USA, ABD, Almanya, Hollanda…) kendiliğinden doğru koda çevriliyor.",
      "Yine de hedef ülkede veri yoksa ekran artık boş kalmıyor: diğer ülkelerin en uygun şehirleri sıralanıyor ve durum açıklamada dürüstçe belirtiliyor.",
      "İki küçük kazanım daha: test sonucu artık kalıcı bir adrese sahip — başka sayfaya gidip GERİ dönünce ya da F5'te sonuç kaybolmuyor. Ve halka açık dizin aramasında yönetici/moderatör hesaplarının listelenmesini engelleyen koruma eklendi.",
      "Şehir verilerine dair dürüst not: yeni şehirlerin puanları (maliyet, güvenlik, konut…) küratörlü İLK tahminlerdir — mevcut Berlin/Amsterdam kayıtlarıyla aynı yöntem. Veri kaynakları bağlandıkça rafine edilecek.",
      "Durum: veritabanı değişiklikleri canlıya UYGULANDI (meslek/şehir listeleri hemen etkili); buton düzeltmeleri ana kodda, deploy bekliyor.",
    ],
  },
  {
    id: "20260730-revizyon-panosu-gercege-dondu",
    date: "30 Temmuz 2026",
    title:
      "Revizyon panosu gerçeğe döndürüldü: 43 'açık' maddenin 18'i aslında yapılmıştı — hepsine kanıt yazıldı",
    items: [
      "Sabahki tespitin uygulaması: pano kodun gerisinde kalmıştı. 43 açık maddenin 14'ü son iki günün Cadde çalışmalarıyla, 4'ü de bugünkü Araçlar onarımıyla zaten karşılanmış durumdaydı.",
      "18 maddenin her birine 'bunu hangi değişiklik çözdü' bilgisini içeren bir kanıt yorumu düşüldü ve durumları 'inceleniyor'a çekildi. Bilinçli olarak 'yapıldı' DENMEDİ — çünkü işlerin çoğu henüz canlıya deploy edilmedi; pano olduğundan iyi görünmemeli. Deploy + kontrol sonrası 'yapıldı'ya çevrilecekler.",
      "Bir madde ('beğeni listesi hover ile açılsın') bugünkü Cadde workshop kararıyla üst yazıldı: workshop tepki emojilerini tamamen açık gösterme kararı aldı, hover çözümü gereksizleşti. Maddeye not düşüldü, kapatma kararı workshop uygulamasına bırakıldı.",
      "Panonun güncel fotoğrafı: 25 açık · 18 inceleniyor · 6 yapıldı · 4 iptal. Kalan 25'in çoğu ürün kararı bekleyen ('tasarım planı nedir?', 'konuşalım') ya da ayrı proje gerektiren büyük işler (Bütçe geliştirmeleri, marketplace, grafikli sonuç ekranları).",
      "Durum: pano güncellemeleri doğrudan canlı veritabanına işlendi — panelde şimdi görünür durumda.",
    ],
  },
  {
    id: "20260730-bildirim-maili-anahtari-gecersiz",
    date: "30 Temmuz 2026",
    title:
      "Bildirim maillerinin neden gitmediği bulundu: mail servisinin anahtarı geçersiz — 8 mail kuyrukta bekliyor",
    items: [
      "Bugünün güncellemeleri kaydedildiğinde sistem 8 bildirim maili göndermeyi denedi ve 8'i de başarısız oldu. Sebep canlı kuyruktan okundu: mail servisi (Resend) 'API anahtarı geçersiz' cevabı veriyor.",
      "Bu, 29 Temmuz'da yakalanan 'form başvuru maillerinin sessizce gitmemesi' arızasının gerçek nedenidir. O gün teşhis 'anahtar fonksiyon ortamında tanımlı değil' şeklindeydi; bugün anlaşıldı ki anahtar TANIMLI ama ÇÜRÜK. Yani eksik ayar değil, yenilenmesi gereken bir anahtar.",
      "İyi haber: 8 mail kaybolmadı, kuyrukta 'bekliyor' durumunda duruyor. Anahtar yenilendiği anda tekrar denenip gönderilebilir.",
      "Sınır: sistem bir maili 5 kez denedikten sonra pes ediyor ve o kaydı bir daha denemiyor. Şu an 1 deneme kullanılmış durumda, 4 hak kaldı. Deneme sayacı yalnızca yeni bir güncelleme kaydı yazıldığında ilerliyor — sıradan kod değişiklikleri sayacı harcamıyor.",
      "YAPILACAK: mail servisinin panelinden yeni anahtar üretilip sunucu ortamına yazılması. Bu yapılmadan hoş geldin maili de çalışmaz — o iş de bu anahtara bağlı.",
      "Durum (aynı gün güncellendi): anahtar YENİLENMEDİ — karar değişti, Resend tamamen bırakıldı ve sistem Zoho'ya taşındı. Kuyruktaki mailler kurtarılıp gönderildi; ayrıntı 'Mail sistemi Zoho'ya taşındı' kaydında.",
    ],
  },
  {
    id: "20260730-butce-sekmesi-menude-durum-raporu-tek-kaynak",
    date: "30 Temmuz 2026",
    title:
      "Bütçe sekmesi artık menüde, durum raporu tek kaynağa bağlandı — ve revizyon listesinin 14 maddesi aslında bitmiş çıktı",
    items: [
      "MUHASEBE > BÜTÇE sekmesi menüye eklendi. Sayfanın kendisi ve veritabanı iki gün önce hazırdı ama menüde hiçbir bağlantısı yoktu — yani adresi elle yazmayan kimse sayfaya ulaşamıyordu. Artık Muhasebe grubunun altında 'Bütçe' olarak duruyor ve arama kutusundan da bulunuyor.",
      "Bu sayfanın (Durum Raporu) beslendiği güncelleme listesi iki ayrı yerde tutuluyordu: biri ortak listede, biri sayfanın içinde kopya olarak. Doğal sonucu şuydu — bir tarafa yazılan kayıt diğerinde görünmüyordu. Kopya kaldırıldı, sayfa artık doğrudan ortak listeyi okuyor. Bundan sonra bir güncelleme yazıldığında hem zil menüsünde hem burada aynı anda görünür.",
      "Revizyon Talepleri panosu denetlendi ve pano ile gerçek arasında ciddi bir fark bulundu: 53 maddeden 43'ü 'açık' görünüyor, ama bunların 14'ü son iki günün Cadde çalışmalarıyla zaten yapılmış (kafe kontenjanları, temalar, marka koruması, Çarşı fotoğraf/video, tek kutulu paylaşım, etiketleme, Cafeler başlığı, geri bildirim bağlantısı, saatler, şehir filtresi). Yani listeye bakan biri bitmiş işleri bekliyor sanıyor.",
      "Panoyu düzeltme işi bilinçli olarak bu kayda dahil EDİLMEDİ: her maddenin hangi çalışmayla karşılandığı kanıtıyla yazılacak ve maddeler 'yapıldı' değil 'inceleniyor' olarak işaretlenecek — çünkü bu işler henüz canlıya çıkmadı, pano da olduğundan iyi görünmemeli.",
      "Ayrıca sıradaki iki iş için yol haritası yazıldı: (1) profilde girilen referral kodunun gerçekten doğrulanması ve yönetici panelinde 'kim hangi kodu kullandı' listesinin geri gelmesi — bugün o alan kaydedilemiyor ve liste boş görünüyor; (2) revizyon panosunun gerçeğe döndürülmesi ve Araçlar modülündeki kırık yönlendirme bağlantılarının onarılması.",
      "Bu üç ayrı doküman (dünün kapanış notu + iki yol haritası) birbirinden habersiz aynı işleri tekrar ediyordu; tek bir devir planına indirildi ve iş, her biri tek oturumda bitecek 25 adıma bölündü. Ayrıca toplantıda kullanılmak üzere tek dosyalık bir HTML durum raporu üretildi: yönetici özeti, karar bekleyen başlıklar, kritik bulgular ve 25 adımın bağımlılık sırası.",
      "NEDEN PANELDE HENÜZ GÖRÜNMÜYOR: bu güncelleme listesi sitenin kodunun içine gömülü olarak yayınlanıyor. Yani kayıt yazılıp ana koda alınsa bile, sitenin yeni sürümü yayınlanana (deploy) kadar panelde belirmiyor. Son iki günün tüm kayıtları bu yüzden görünmüyor — eksik değil, yayınlanmamış durumda.",
      "Durum: kod ana koda alındı, deploy bekliyor. Bekleyen deploy kuyruğu artık dört kalem: bildirim altyapısı, Cadde V1, hoş geldin maili ve bu iş.",
    ],
  },
  {
    id: "20260729-cadde-sehir-eslestirme-onarimi",
    date: "29 Temmuz 2026",
    title:
      "Cadde'de üyelerin %89'u 'şehirsiz' görünüyormuş — akışın şehir eşleştirmesi onarıldı",
    items: [
      "Cadde akışı sana en yakın içeriği öne çıkarmak için 'aynı şehirdeyiz' sinyalini kullanıyor. Ölçüldü: şehri kayıtlı 110 üyeden yalnızca 12'sinde (%11) bu sinyal çalışıyormuş. Yani akış, üyelerin neredeyse tamamı için şehir bilgisini yok saymış gibi davranıyordu.",
      "İki bağımsız sebep vardı. Birincisi yine Türkçe 'İ' harfi: sistem 'İstanbul'u küçültürken sade 'istanbul' yerine farklı bir harf dizisi üretiyor ve ikisini eşleştirmiyordu. En kalabalık grup olan 13 İstanbul üyesi bu yüzden hiç eşleşmiyordu. Aynı sorun ülke tarafında da vardı: üye profilinde 'Türkiye', katalogda 'Turkiye' yazıyordu.",
      "İkinci sebep şehir listesinin boş kalmasıydı. Sitenin genel şehir veritabanında ~77.000 şehir varken Cadde'nin kendi şehir listesinde yalnızca 6 şehir vardı. Doha (9 üye), Ankara (6), İzmir (4), Antalya (3), Frankfurt, Düsseldorf, Dortmund... hiçbiri yoktu. Liste Haziran'da elle 6 şehirle kurulmuş ve bir daha büyütülmemişti.",
      "SONUÇ (canlıda ölçüldü): şehri tanınan üye sayısı 12'den 99'a çıktı (110 üyeden). Şehir listesi 6'dan 51'e, ülke listesi 5'ten 18'e yükseldi.",
      "Daha da önemlisi: bir gün önce eklenen 'Şehrim' akış filtresi tam da bu üyelerde BOŞ liste döndürüyordu — yani yeni özellik çoğunluk için baştan bozuktu. Artık çalışıyor.",
      "Listenin bir daha çürümemesi için kendini besleyen bir mekanizma kuruldu: bir üye profiline şehir yazdığında o şehir genel veritabanından Cadde listesine doğru saat dilimiyle birlikte kendiliğinden ekleniyor.",
      "Kalan 11 üye veri girişi sorunu: profiline 'a', 'Mb', 'Vanuu' gibi anlamsız değerler ya da 'Çankaya' (ilçe), 'München' (katalogda Munich) yazmışlar. Kalıcı çözüm profilde şehri serbest metin olarak yazdırmak yerine listeden seçtirmek — bu ayrı bir iş olarak duruyor.",
      "Durum: veritabanı değişiklikleri canlıya UYGULANDI ve doğrulandı, kod ana koda alındı. Geriye sitenin yeni sürümünün yayınlanması (deploy) kaldı.",
    ],
  },
  {
    id: "20260729-cadde-carsi-gorsel-iletisim",
    date: "29 Temmuz 2026",
    title:
      "Çarşı ilanlarına fotoğraf, video ve iletişim bilgisi eklenebiliyor — ücretli ilan altyapısı da hazır (kapalı)",
    items: [
      "Çarşı ilanlarının veritabanında görsel alanı ilk günden beri vardı ama hiçbir forma bağlanmamıştı — yani kullanıcı ilanına görsel ekleyemiyordu. Artık ekleyebiliyor: en fazla 6 fotoğraf + 1 video.",
      "İletişim tercihi düzeltildi. Eskiden ilan sahibi 'telefonla ulaşın' diyebiliyordu ama telefon numarasının kendisi kaydedilmiyordu — yani o ilana ulaşmanın hiçbir yolu yoktu. Artık telefon veya e-posta seçilirse değerini girmek ZORUNLU.",
      "Ücretli ilan altyapısı kuruldu ama KAPALI: V1'de ilan vermek ücretsiz. İleride tek bir ayar açıldığında yeni ilanlar 'ödeme bekliyor' durumunda kaydedilecek, yayına girmeyecek ve kullanıcıya 'Ödemenizi tamamlayarak ilanınızı yayınlayabilirsiniz.' mesajı gösterilecek. Yöneticiler bu kuraldan muaf.",
      "ÖNEMLİ: Bu ücretli mod anahtarı, gerçek ödeme akışı (Stripe) hazır olmadan AÇILMAMALI. Tek başına açılırsa ilanlar taslakta kalır ve kullanıcı ilanını hiçbir şekilde yayınlayamaz.",
      "Çarşı şimdilik 'global' — tüm ülkelerin ilanları tek listede. İleride ülke bazlı Çarşı istenirse tek ayarla kullanıcının kendi ülkesine daraltılabiliyor.",
      "Durum: veritabanı değişikliği canlıya UYGULANDI, kod ana koda alındı, deploy bekliyor. Gerçek dosya yüklemeli uçtan uca ilan verme henüz gerçek cihazda denenmedi.",
    ],
  },
  {
    id: "20260729-cadde-cafe-tema-marka-korumasi",
    date: "29 Temmuz 2026",
    title:
      "Cafelere 16 gerçek tema, 999'a kadar kontenjan ve marka adı koruması geldi (96 marka)",
    items: [
      "Cafe temaları eskiden kodun içine gömülü 7 kategoriydi (IT, Hekimler, Profesyoneller...). Artık veritabanında 16 gerçek tema var: Girişim, Startup, Yatırım, Yazılım, AI, Meslek, HR, Networking, Eğitim, Sağlık, Spor, Gusto, Müzik, Hobi, Party, Gündem. Yeni tema eklemek artık kod değişikliği değil — deploy gerekmiyor.",
      "Kontenjan seçenekleri 10/25/50'den 50/100/250/500/999'a çıkarıldı.",
      "MARKA KORUMASI: Artık isteyen herkes 'Starbucks Cafe' adında bir cafe açamıyor. 96 marka (Türk + uluslararası) listeye eklendi. Bir kullanıcı o markanın yayındaki katalog kaydını yönetiyorsa açabiliyor; yönetmiyorsa kendisine 'Parodi Starbucks Cafe' adı öneriliyor ve tek tıkla uygulanıyor. Yöneticiler muaf — moderasyon için açabilmeleri gerekiyor.",
      "Yeni sayfa: Cadde > Markalar. Marka ekle, pasifleştir, sil; ayrıca bir adın engellenip engellenmeyeceğini önceden deneyebileceğin bir test kutusu var.",
      "Eşleşme kelime bütünlüğüne bakıyor: 'Berlin NIKE Koşu' yakalanıyor, ama 'Teknike Dair' veya 'Metropol' gibi masum adlar yakalanmıyor.",
      "Bilinmesi gereken sınır: sistemde 'doğrulanmış işletme' diye bir kavram YOK — mevcut doğrulama yalnızca telefon doğrulaması. Marka sahipliğinin tek gerçek göstergesi, kullanıcının o markanın katalog kaydını yönetiyor olması.",
      "Durum: veritabanı değişikliği canlıya UYGULANDI, kod ana koda alındı, deploy bekliyor.",
    ],
  },
  {
    id: "20260729-cadde-hashtag-mention-kapsam",
    date: "29 Temmuz 2026",
    title:
      "Cadde'ye serbest hashtag, @etiketleme ve akış filtreleri geldi (Tümü · Şehrim · Ülkem · Etkinlikler · Cafelerim)",
    items: [
      "Cadde'de bugüne kadar kullanıcı kendi etiketini yazamıyor, kimseyi etiketleyemiyordu. Artık paylaşım metnine serbestçe #etiket yazılabiliyor ve @ ile birisi etiketlenebiliyor. Ayrıca trend etiketler bölümü eklendi.",
      "Etiketlenebilecek dört şey var: üye (yalnız profili herkese açık olanlar), katalog kaydı (yayındakiler), cafe (yayında ve arşivlenmemiş), Çarşı ilanı (yayında, onaylı, süresi geçmemiş). Kimin görünür olacağına sistem karar veriyor — kullanıcı görmemesi gereken bir şeyi etiketleyemiyor.",
      "Türkçe titizliği: '#İstanbul' ile '#istanbul' aynı etikete inmezse etiket sayfası ikiye bölünür. Hem tarayıcı hem veritabanı tarafındaki standart küçültme bunu YANLIŞ yapıyordu; iki tarafta da düzeltildi ve beklenen sonuçlar canlı veritabanında ölçülüp teste sabitlendi.",
      "Akış filtreleri: Tümü · Şehrim · Ülkem · Etkinlikler · Cafelerim. 'Cafelerim' yalnızca ONAYLI üye olduğun cafelerin paylaşımlarını gösteriyor.",
      "Yakınımda / Takip Ettiklerim / İş Fırsatları filtreleri görünüyor ama 'Yakında' rozetiyle tıklanamaz durumda. Bilinçli tercih: tıklanabilir olsalardı kullanıcı sessizce yanlış akış görürdü.",
      "Etiketin metni paylaşım anındaki isimdir — etiketlenen kişi sonradan adını değiştirse bile eski paylaşımın metni değişmez.",
      "Durum: veritabanı değişikliği canlıya UYGULANDI, kod ana koda alındı, deploy bekliyor. Etiketleme bildiriminin gerçekten gittiği henüz gerçek kullanıcıyla doğrulanmadı.",
    ],
  },
  {
    id: "20260729-cadde-paylasim-medya-composer",
    date: "29 Temmuz 2026",
    title:
      "Cadde paylaşımlarına fotoğraf ve video eklenebiliyor — paylaşım kutusu 6 alanlı formdan tek kutuya indi",
    items: [
      "Cadde akışı bugüne kadar yalnızca metin taşıyordu. Artık bir paylaşıma en fazla 4 fotoğraf + 1 video eklenebiliyor. Akış kartında ek sayısına göre düzen kuruluyor (1 tam genişlik, 2 yan yana, 3'te ilki büyük, 4'te 2x2) ve tıklayınca ok tuşlarıyla gezilebilen büyük görüntüleyici açılıyor.",
      "Paylaşım kutusu eskiden 6 görünür alanlı bir formdu (tür, başlık, metin, hedef ülke, hedef şehir, etiketler) ve ilk izlenimde 'form doldur' hissi veriyordu. Artık tek bir kutu; altında Fotoğraf · Video · Konum · Etkinlik şeridi var. Paylaşım türü kullanıcıdan gizlendi — seçtiği ekten kendiliğinden anlaşılıyor.",
      "Soru ve İlan/Teklif türleri KAYBOLMADI; katlanan 'Detaylar' panelinde başlık ve hazır etiketlerle birlikte duruyor.",
      "Sadece görsel paylaşmak da meşru sayıldı: metin boş bırakılabiliyor. Ama ne metin ne de görsel varsa paylaşım reddediliyor.",
      "Video tek bir ayarla tamamen kapatılabiliyor — kod değişikliği gerekmiyor.",
      "Durum: veritabanı değişikliği canlıya UYGULANDI ve doğrulandı, kod ana koda alındı, deploy bekliyor. Gerçek dosya yükleme uçtan uca henüz denenmedi.",
    ],
  },
  {
    id: "20260729-uyeye-hos-geldin-maili",
    date: "29 Temmuz 2026",
    title:
      "Yeni üyeye artık markalı bir 'hoş geldin' maili gidiyor — ama bu henüz canlıda DEĞİL",
    items: [
      "Bir üye e-postasını doğruladığı anda kendisine Türkçe, markalı bir karşılama maili gidiyor. Bu, Supabase'in standart 'e-postanı doğrula' mailinin yerine geçmiyor — ondan SONRA gelen ayrı bir mail.",
      "Mevcut bildirim altyapısını (kuyruk, tekrar gönderme, çift gönderme koruması) aynen kullanıyor. Tek fark: alıcı, abone listesinden değil kaydolan üyenin kendisinden geliyor.",
      "Bildirim Ayarları sayfasına 'Bana örnek hoş geldin maili gönder' butonu eklendi — şablonu gerçek bir mail olarak kendine yollayıp gözle kontrol edebiliyorsun. Bu önemli, çünkü tarayıcı önizlemesi Gmail/Outlook'un yaptığı kırpmaları göstermiyor.",
      "Durum (30 Temmuz'da güncellendi): veritabanı değişikliği canlıya UYGULANDI ve mail gönderen servis (artık Zoho üzerinden) yayına alındı. Bu kayıt ilk yazıldığında 'canlıda hiçbir şey yok' diyordu. Kalan tek adım: panelden örnek maili gözle kontrol edip genel anahtarı açmak.",
      "DİKKAT: Genel anahtar açılmadan önce kaydolan üyeler bu maili HİÇ almaz — o sırada kuyruğa düşen kayıtlar 'atlandı' olarak işaretlenir ve bir daha denenmez.",
    ],
  },
  {
    id: "20260729-cadde-arayuz-onarimlari",
    date: "29 Temmuz 2026",
    title:
      "Cadde'de üç can sıkıcı arayüz sorunu düzeltildi: F5 sonrası sayfa sonuna atlama, donuk saatler, yol göstermeyen boş ekranlar",
    items: [
      "F5'e bastığında sayfa en alta, footer'a atlıyordu. Sebep: tarayıcı eski kaydırma konumunu içerik henüz yüklenmeden geri yüklüyor, içerik sonradan büyüdüğünde kullanıcı en altta kalıyordu. Artık kaydırma konumunu tarayıcı değil uygulama yönetiyor.",
      "Dünya saatleri şeridi donuktu — saat yalnızca sayfa çizilirken hesaplanıyordu, dakika hiç değişmiyordu. Artık gerçekten canlı: her dakika başında kendini güncelliyor. Ayrıca 6 sabit şehir yerine kendi saatin + İstanbul + filtrelediğin şehir gösteriliyor; ikonlar yerel saate göre gündoğumu / güneş / günbatımı / ay olarak değişiyor ve gece-gündüz tonu uygulanıyor.",
      "'Aktif Cafe Özeti' başlığı 'Cafeler (Berlin +2)' oldu — ne gösterdiği başlıktan anlaşılıyor.",
      "Çarşı'nın boş ekranı artık yol gösteriyor: 'İlk ilanı sen ver.' + ilan verme butonu.",
      "Cadde'deki geri bildirim bağlantısı WhatsApp'tan kendi /feedback formumuza taşındı — artık kayıt altına alınıyor ve Geri Bildirim sayfasından izlenebiliyor.",
      "Durum: kod ana koda alındı, deploy bekliyor. F5 davranışı ve saat çiplerinin dakika geçişi gerçek cihazda henüz doğrulanmadı.",
    ],
  },
  {
    id: "20260729-form-basvuru-maili-gitmiyormus",
    date: "29 Temmuz 2026",
    title: "Sessiz arıza yakalandı: siteden gelen form başvurularının bildirim maili bir süredir hiç gönderilmiyormuş",
    items: [
      "Bildirim sistemini kurarken tesadüfen ortaya çıktı. Mail gönderen servislerimizin çalışabilmesi için mail sağlayıcımızın anahtarının 'sunucu tarafına' ayrıca tanımlanmış olması gerekiyor. Kontrol edildi: bu anahtar orada hiç yokmuş.",
      "Sonucu şu: /form sayfasından biri başvuru yaptığında bize gelmesi gereken 'yeni başvuru var' maili gönderilmiyormuş. Üstelik sistem hata da vermiyormuş — başvuruyu sessizce kaydedip 'tamam' diyormuş. Bu yüzden bugüne kadar kimse fark etmemiş.",
      "ÖNEMLİ: Başvurular KAYBOLMADI. Hepsi veritabanında duruyor ve admin panelinden görülebiliyor; eksik olan yalnızca 'yeni başvuru geldi' uyarı maili.",
      "Eksik anahtarlar bugün tanımlandı. Yeni bildirim sistemi artık sağlıklı çalışıyor, ancak form başvuru mailinin de düzeldiği bir test başvurusuyla henüz DOĞRULANMADI — sıradaki iş bu.",
      "Ne kadar süredir gitmediği de bilinmiyor. Geçmiş başvuruların kayıtlarına bakılarak çıkarılabilir.",
    ],
  },
  {
    id: "20260729-bildirim-e-postalari",
    date: "29 Temmuz 2026",
    title: "Yeni üye kaydı da artık mail olarak gelebiliyor — ve iki bildirimi de panelden açıp kapatabiliyorsun",
    items: [
      "Bugüne kadar yalnızca 'admin güncellemeleri' maili vardı; o da kodun içine gömülü 3 sabit adrese gidiyordu, sadece geliştirici bilgisayarından commit atılınca çalışıyordu ve aynı güne birden fazla kayıt girildiğinde yalnızca en üsttekini yolluyordu.",
      "Artık iki ayrı bildirim var: (1) siteye yeni bir üye kaydolup e-postasını doğruladığında, (2) buraya yeni bir güncelleme kaydı girildiğinde. İkisi de e-posta olarak gidiyor.",
      "Yeni sayfa: Sistem > Bildirim Ayarları. Burada iki tür bildirimin GENEL anahtarı (tüm platform için aç/kapa — yalnız admin) ve KİŞİSEL aboneliğin (sadece senin hesabın için — 'yeni üye kaydolduğunda bana mail gelsin' / 'yeni güncelleme yayınlandığında bana mail gelsin') ayrı ayrı yönetiliyor. Aynı sayfada son 20 gönderimin durumu ve alıcı sayısı da görünüyor.",
      "Kısayol: üst çubuktaki zarf ikonundan dört anahtarın hepsine her admin sayfasından tek tıkla ulaşabilirsin — ayarlar sayfasına gitmene gerek yok. İkonun köşesinde yeşil nokta varsa o an gerçekten mail alıyorsun demektir.",
      "Kimin mail alacağı artık koddan değil, herkesin kendi tercihinden belirleniyor. Yetkisi alınan bir yönetici, tercihi açık kalsa bile mail almayı otomatik olarak durduruyor.",
      "Güvenlik notu: genel anahtarların ikisi de KAPALI başlıyor. Bildirimler ancak bir admin bu sayfadan anahtarı açtıktan sonra akmaya başlar.",
      "Durum: veritabanı değişikliği canlıya UYGULANDI, mail gönderen servis yayına alındı ve uçtan uca test edildi — çalıştığı doğrulandı. Kod da ana koda alındı. Geriye yalnız sitenin yeni sürümünün yayınlanması (deploy) kaldı; ondan sonra sayfa ve üst çubuktaki zarf ikonu panelde görünür olacak.",
      "Güvenlik gereği iki genel anahtar da KAPALI durumda duruyor. Yani deploy sonrası sen açana kadar kimseye tek bir mail bile gitmiyor.",
    ],
  },
  {
    id: "20260729-tasinma-araci-sonuc-butonlari",
    date: "29 Temmuz 2026",
    title: "Taşınma araçlarının sonuç ekranındaki butonlar düzeltildi: eşit boyutlu 2×2 ızgara + çalışmayanlara 'Yakında' rozeti",
    items: [
      "Bir aracı çözüp sonuç ekranına geldiğinde alttaki yönlendirme butonları farklı farklı boyutlardaydı; etiketi uzun olan buton kocaman, kısa olan minicik görünüyordu. Artık hepsi 2 sütunlu bir ızgarada, birbirine eşit genişlik ve yükseklikte duruyor — en uzun etiket hepsini birlikte büyütüyor.",
      "Daha önemlisi: bu butonların bir kısmı aslında var olmayan sayfalara götürüyordu, yani tıklayan kullanıcı boş ekranla karşılaşıyordu. Şimdi bunlar 'Yakında' rozetiyle ve tıklanamaz halde gösteriliyor — kullanıcı neyin hazır olmadığını görüyor, hataya düşmüyor.",
      "Sonuç ekranına ayrıca 'Tekrar Çöz' butonu eklendi; o her zaman aktif ve rozetsiz.",
      "Hedef sayfalar yayına girdiğinde tek yapılacak iş rozetleri kaldırmak — buton düzeni hazır bekliyor.",
      "Durum (30 Temmuz'da güncellendi): iş ana koda alındı, deploy bekliyor. Bu kayıt ilk yazıldığında 'geliştirici bilgisayarında duruyor' diyordu; aynı gün birleştirildi.",
    ],
  },
  {
    id: "20260729-sosyal-paylasim-migration-hatasi",
    date: "29 Temmuz 2026",
    title: "Sosyal paylaşım deposunda 'sütun bulunamadı' hatası çözüldü — sebebi kayıp bir kurulum kaydıydı",
    items: [
      "Sosyal paylaşım deposuna ait bir veritabanı güncellemesi canlıda zaten tam olarak uygulanmıştı, ama sistemin 'hangi güncellemeler yapıldı' defterine işlenmemişti. Yani iş bitmişti, kaydı tutulmamıştı.",
      "Bu yüzden güncelleme yapılmamış sanılıp elle tekrar çalıştırıldı ve hata verdi: silinmiş bir sütunu arıyordu. Ekranda 'column item_tab does not exist' yazıyordu.",
      "Düzeltme: güncelleme dosyası artık önce 'bu adım daha önce yapılmış mı' diye kontrol ediyor, yapılmışsa atlıyor. Yani ikinci kez çalıştırılsa bile hata vermiyor. Eksik defter kaydı da canlıya elle eklendi.",
      "Bilinmesi gereken kural: bir tablo ya da sütunun canlıda var olması, o güncellemenin deftere işlendiği anlamına gelmiyor. İkisi ayrı ayrı kontrol edilmeli.",
    ],
  },
  {
    id: "20260728-muhasebe-butce-sekmesi-temeli",
    date: "28 Temmuz 2026",
    title: "Muhasebe modülüne yıllık 'Bütçe' sekmesi geliyor — tasarımı, planı ve kodunun büyük bölümü bugün hazırlandı",
    items: [
      "Amaç: departman departman (ör. yazılım, pazarlama) 12 aylık gider bütçesini, gelir beklentisini ve ikisinin birleştiği nakit akışını tek ekrandan planlayabilmek. Ekranın üstünde 'eldeki para bu gidişle kaç ay yeter' özeti (runway) yer alıyor.",
      "Bugün önce bir tasarım dokümanı, ardından adım adım uygulama planı yazıldı. Sonra kodun temel katmanları çıkarıldı: veritabanı tablosu, hesaplama mantığı (aylık toplamlar, bakiye, runway), Supabase bağlantısı, veri çekme kancaları, yazarken kendiliğinden kaydeden otomatik kayıt mekanizması, üç ana panel (Departman Bütçesi, Gelirler, Konsolide Nakit Akışı) ve CSV olarak dışa aktarma. Her parça için testleri de yazıldı.",
      "Durum (30 Temmuz'da güncellendi): iş TAMAMLANDI. Kod ana koda alındı, veritabanı değişikliği canlıya UYGULANDI ve sekme Muhasebe menüsüne 'Bütçe' olarak bağlandı — deploy sonrası panelde görünür olacak. Bu kayıt ilk yazıldığında üç maddenin de eksik olduğunu söylüyordu; menü bağlantısı 30 Temmuz'da, diğer ikisi 28 Temmuz akşamı tamamlandı.",
    ],
  },
  {
    id: "20260728-sitemap-bos-profil-temizligi",
    date: "28 Temmuz 2026",
    title: "Google '236 sayfayı keşfettim ama indekslemedim' diyordu — sebebi bulundu, site haritası gerçek içeriğe indirildi",
    items: [
      "Google Search Console 236 sayfa için 'Keşfedildi – şu anda dizine eklenmedi' uyarısı veriyordu. Kök neden bulundu: Google'a bildirdiğimiz sayfa listesinde (sitemap) gerçek profillerin yanında ~205 adet içi boş 'rol şablonu' kaydı ve 'hakkında' metni boş üye profilleri de vardı. Google bu içi boş sayfaları düşük değerli görüp, gerçek profillere ayıracağı tarama kaynağını onlara harcıyordu.",
      "Düzeltme: listeye artık yalnızca yayınlanmış, herkese açık, şablon olmayan ve 'hakkında' metni dolu profiller giriyor. Liste 312 adresten 107 adrese indi; katalog profili sayısı ~225'ten 20 gerçek profile düştü.",
      "Bilinmesi gereken kural: bir üye/kurum profilinin Google'a bildirilen listeye girebilmesi için 'hakkında' (uzun açıklama) metninin dolu olması gerekiyor. Bu alan boş bırakılırsa profil yayında olsa bile listeye hiç girmiyor — profil sahiplerinden bu metni istemekte fayda var.",
      "Değişiklik ana koda alındı. Google'ın görebilmesi için bir sonraki yayın (deploy) ve ardından Search Console'dan site haritasının yeniden gönderilmesi gerekiyor.",
    ],
  },
  {
    id: "20260728-tools-noindex-karari",
    date: "28 Temmuz 2026",
    title: "Google'ın '16 araç sayfası noindex ile hariç tutuldu' uyarısı incelendi: hata değil, bilinçli tercih",
    items: [
      "Search Console 25 Temmuz'dan beri 16 taşınma aracı sayfasını (ör. /tools/sehir-eslestirme) 'noindex etiketiyle hariç tutuldu' diye raporluyor. İncelendi: bu bir hata değil. Araç sayfaları üyelere özel olduğu için giriş yapmamış bir ziyaretçi — ve Google — o adreste giriş ekranını görüyor; giriş ekranının arama motorlarına 'beni dizine ekleme' demesi de zaten doğru davranış.",
      "Karar: araçlar üyeye özel kalıyor, giriş duvarı yerinde duruyor. Aramada görünürlük /tools ana sayfası üzerinden sağlanıyor — o sayfa herkese açık, dizine eklenebiliyor ve 17 aracın tamamının başlığını ve özetini gösteriyor.",
      "ÖNEMLİ: Search Console'da bu rapordaki 'Doğrulamayı başlat / Sorun giderildi mi?' düğmesine BASILMAMALI. O düğme Google'dan 'noindex kalkmış mı' diye kontrol etmesini ister; sayfalar bilerek öyle kaldığı için doğrulama başarısız olur ve rapor geri döner. Aynı şekilde robots.txt ile engellemek de durumu daha kötü hale getirir. Bu rapor bilgi amaçlıdır, zaman zaman tekrar görünmesi normaldir.",
      "İleriye not: 5 adet Almanya hesaplayıcısı (maaş, vize vb.) tamamen tarayıcı içinde çalışıyor; istenirse bunları herkese açmak, veritabanına dokunmadan yapılabilecek en ucuz SEO kazancı olarak masada duruyor. Şimdilik kapsam dışı bırakıldı.",
      "Karar ve gerekçeleri docs/audits/2026-07-28-tools-noindex-karari.md dosyasına yazıldı.",
    ],
  },
  {
    id: "20260728-sosyal-paylasim-eksik-gorsel-raporu",
    date: "28 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu'nun görsel envanteri çıkarıldı: 100 kartın 70'i hâlâ görselsiz",
    items: [
      "Canlı veritabanı tek tek sorgulanıp hangi kartta görsel var hangisinde yok listelendi: 100 karttan 30'unda görsel var, 70'i tamamen boş.",
      "İyi haber: panelin ilk 12 sırası (BURAK BURAYA BAK kartları) neredeyse tamamlanmış durumda; eksik olan yalnızca birkaç çok varyantlı kartın ek varyantı (ör. item-98'in 3. varyantı).",
      "Bekleyen kısım 13–100 arası: Test Araçları, Diaspora Postları ve Araç Tanıtımları kartlarının neredeyse tamamı hâlâ görsel bekliyor.",
      "Küçük bir uyumsuzluk not edildi: repo klasöründe 34 karta ait 74 dosya varken veritabanında 30 kart görünüyor — yani klasöre eklenmiş ama henüz panele işlenmemiş birkaç dosya olabilir; ayrıca kontrol edilip yüklenecek.",
      "Hangi kartın eksik olduğunun tam listesi docs/social-share-outputs/eksik-gorsel-raporu-2026-07-28.md dosyasında.",
    ],
  },
  {
    id: "20260723-ikinci-profil-talebi-tamamlandi",
    date: "23 Temmuz 2026",
    title: "Üyeler artık ikinci bir profil (ör. hem Bireysel hem İşletme) açmayı talep edebiliyor",
    items: [
      "Bir kullanıcı mevcut profiline hiç dokunmadan, başka bir rol için ikinci bir profil talep edebiliyor. Talep menüsü profil değiştirme ekranına '+ Yeni Profil' olarak eklendi.",
      "Talep admin onayına düşüyor; admin onaylayınca kullanıcının hesabına ikinci, bağımsız bir profil ekleniyor — birinci profili etkilenmiyor. Aynı anda sadece bir bekleyen talep açılabiliyor.",
      "Admin onay ekranına bu talepleri filtreleyip görebileceği yeni bir 'Yeni profil' filtresi eklendi.",
      "Uçtan uca test edildi (talep → onay → ikinci profilin oluşması) ve bugün ana koda (main) alındı — özellik artık kullanıma hazır, yalnızca deploy bekliyor.",
    ],
  },
  {
    id: "20260723-burak-gorsel-semasi-3-haneli-numaralandirma",
    date: "23 Temmuz 2026",
    title: "Burak'ın paylaşım görselleri için numaralandırma şeması güçlendirildi, eski görseller yedeklendi",
    items: [
      "docs/social-share-outputs/ altındaki bazı araçlar (tool-3/4/5) için dosya adlandırma şeması, sırayı/varyantı/prompt numarasını daha net kodlayan 3 haneli bir düzene (<sıra><varyant><promptNo>) güncellendi.",
      "Eski 2 haneli isimlendirmeyle yüklenmiş görseller silinmeden docs/backup/ altına referans yedek olarak taşındı — docs/social-share-outputs/ artık tek doğru kaynak, dosya bir daha silinmeyecek, sadece eklenecek.",
      "İlgili sosyal paylaşım veritabanı kayıtları (social_share_assets, social_share_asset_images) yeni şemaya göre güncellenip canlıda doğrulandı.",
    ],
  },
  {
    id: "20260721-google-indeksleme-sorunlari-teshisi-ve-addwa-yonlendirme",
    date: "21 Temmuz 2026",
    title: "Google'ın sitemizi neden bazı sayfalarda indekslemediği araştırıldı: çoğu aslında sorun değilmiş, bir gerçek eksik bulunup düzeltildi",
    items: [
      "Google Search Console'daki 4 farklı 'indekslenmedi' raporu tek tek incelendi. İkisi aslında sorun değil, Google'ın doğru çalıştığının kanıtı: bir sayfa başka bir sayfaya yönleniyorsa ('Sayfa yönlendirmeli') veya doğru bir canonical etiketi başka bir adrese işaret ediyorsa ('Doğru canonical etiketli alternatif sayfa'), Google bunu bilerek indekslemiyor — bu istenen davranış, düzeltilecek bir hata değil.",
      "Gerçek bir eksik bulundu: /addwa adresi şimdiye kadar yalnızca tarayıcı içinde (JavaScript ile) başka bir sayfaya yönlendiriliyordu, sunucu seviyesinde gerçek bir yönlendirme (HTTP 301) yoktu. Artık sunucu da bu adresi doğrudan 301 ile doğru sayfaya yönlendiriyor — hem arama motorları için daha sağlam hem de biraz daha hızlı.",
      "13 sayfanın (ör. /iletisim, /kariyer, /anket, yasal sayfalar) Google tarafından henüz hiç ziyaret edilmediği görüldü — hepsi zaten site haritasında (sitemap) yer alıyor, kodda eksik bir şey yok; bu sitenin henüz yeni/düşük öncelikli görülmesiyle ilgili, zamanla ya da Search Console'dan tek tek 'dizine ekleme' istenerek çözülür.",
      "Daha önemli bir bulgu: eski mvp.corteqs.net adresi hâlâ canlı ve aynı siteyi yönlendirmeden gösteriyor — bu, Google'ın bazı sayfaları eski adres üzerinden bulup kafasının karışmasına yol açıyor. Bunu çözecek yönlendirme kodu aslında zaten yazılmış durumda (server.mjs içinde), ama şu an canlıda mvp.corteqs.net bu kodu çalıştırmıyor gibi görünüyor — bu bir kod eksikliği değil, bir sunucu/deploy (Coolify) konusu; Coolify panelinden mvp.corteqs.net'in ayrı bir uygulama olup olmadığının kontrol edilmesi gerekiyor.",
    ],
  },
  {
    id: "20260721-social-share-vault-global-id-semasi",
    date: "21 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu'nda görsellerin yanlış karta düşme sorunu kökten çözüldü",
    items: [
      "Bir kartın görseli olduğu halde görselsiz göründüğü fark edildi (ör. 'Annenin sesi' diaspora postu) — kök neden bulundu: eski yükleme script'i, BURAK BURAYA BAK sekmesinin kendi 1-12 numaralandırmasını diğer sekmelerin (Araç Tanıtımları/Diaspora/Test) numaralandırmasıyla karıştırıp bazı görselleri yanlış karta yazmıştı.",
      "Kalıcı çözüm: kartların hangi sekmeden geldiği artık veritabanı kimliğinin bir parçası değil. Her kalem, sekmeden bağımsız, hiç değişmeyen tek bir numara taşıyor (item-1'den item-100'e) — bu sayede aynı karışıklık bir daha oluşamaz.",
      "Bunun sonucunda sayfanın üstündeki filtre butonları (Tümü/Araç Tanıtımları/Diaspora/Test/Burak) kaldırıldı; artık tüm kalemler karışık ama sabit bir sırada tek liste halinde görünüyor.",
      "Mevcut 16 görsel + 16 ek görsel + 1 paylaşım notu yeni numaralandırmaya taşındı, canlı veritabanında doğrulandı — hiçbir görsel veya not kaybolmadı. Kalan ~84 kartın görseli henüz gelmedi, dosyalar gelince yükleme script'i tekrar çalıştırılacak.",
    ],
  },
  {
    id: "20260721-fallback-gorsel-havuzu-haber-radari",
    date: "21 Temmuz 2026",
    title: "Haber Radarı'ndaki haberler artık görselsiz kalmıyor (aynı gün içinde bir yanlış bağlantı da düzeltildi)",
    items: [
      "Haber Radarı'nda onaylanan bazı haberler görselsiz ya da renkli bir placeholder ile görünüyordu, çünkü dış kaynaktan görsel çekmek bilinçli olarak kapalı (telif/güvenlik). Artık böyle durumlarda önceden hazırlanmış bir görsel havuzundan sabit bir görsel otomatik atanıyor.",
      "İlk yazılan haliyle bu havuz yanlışlıkla Hizmet Bulucu'daki mekan kayıtlarına da bağlanmıştı; sadece Haber Radarı için istenmesi üzerine bu bağlantı aynı gün içinde geri alındı — mekan için eklenen 50 görsel havuzdan silindi ve veritabanı bir daha yanlışlıkla açılamayacak şekilde kilitlendi. Hiçbir mekan kaydı bu görselle canlıya çıkmamıştı, yani geri alma tamamen risksiz oldu.",
      "İlgili veritabanı değişiklikleri canlıya uygulandı ve doğrulandı.",
    ],
  },
  {
    id: "20260721-service-finder-evidence-quotes-kirpma",
    date: "21 Temmuz 2026",
    title: "Hizmet Bulucu'nun 0 aday üretme sorunu bulundu ve düzeltildi",
    items: [
      "Bir deneme taramasında 34 kaynak incelendi ama tek bir aday bile üretilmedi. Sebep bulundu: yapay zeka bazen izin verilenden (6) fazla alıntı döndürüyordu ve bu tek fazlalık, adayın tamamen elenmesine yol açıyordu.",
      "Artık fazla alıntı yüzünden aday tamamen silinmiyor — sadece fazla alıntılar izin verilen sayıya kırpılıp aday korunuyor. Veri kalitesi için 6 alıntı sınırı kaldırılmadı, sadece elenme yerine kırpma tercih edildi.",
    ],
  },
  {
    id: "20260720-burak-share-gorsel-canliya-yuklendi-ve-radar-tarama-tetikleme",
    date: "20 Temmuz 2026",
    title: "Burak'ın 32 görseli canlıya yüklendi; bir yükleme hatası tespit edilip düzeltildi; haber tarayıcı elle tetiklenebilir hale getirildi",
    items: [
      "Daha önce sadece koda hazır bekleyen görsel yükleme script'i bugün gerçekten canlı veritabanına karşı çalıştırıldı: docs/social-share-outputs/ altındaki 32 görselin tamamı (14 değil, sayı 32'ye çıkmıştı) doğru araç/varyant/prompt slotuna, 'burak-share' Storage deposuna ve ilgili tablolara başarıyla yüklendi. Artık /admin/social-share-vault sayfasında BURAK BURAYA BAK bölümündeki ilgili kartların altında bu görseller görünüyor.",
      "İlk çalıştırmada script'in 'tekrar çalıştırınca aynı görseli iki kez ekleme' korumasında gerçek bir hata bulundu: ek görseller doğru şekilde 'zaten var' diye tanınamıyordu, bu yüzden test sırasında bazı görseller yanlışlıkla 2-3 kez veritabanına eklendi (18 fazladan kayıt). Bu fazlalıklar tespit edilip, her slotta en eski (ilk yüklenen) kayıt tutularak fazlalıklar hem veritabanından hem depolama alanından temizlendi — hiçbir görsel kaybolmadı, sadece kopyalar silindi. Ardından script'teki hata da kalıcı olarak düzeltildi ve canlıda tekrar test edilerek artık güvenle tekrar tekrar çalıştırılabildiği doğrulandı.",
      "Haber Radarı'nın arka plandaki tarama işlemini (radar-news-scan) günlük otomatik çalışmasının dışında istenildiğinde elle tetikleyebilmek için bir erişim anahtarı (cron secret) yeniden oluşturulup hem Supabase'e hem projenin yerel ayarlarına kaydedildi; fonksiyonun bu anahtarla dışarıdan çağrılabilmesi için küçük bir dağıtım (deploy) ayarı güncellendi. Yapılan test taramasında 6 kaynaktan 65 yeni haber bulunup kuyruğa eklendi (2 kaynak o an geçici olarak yanıt vermedi, sorun değil — bir sonraki taramada tekrar denenir). Kullanıcıya görünen bir arayüz değişikliği yok, bu tamamen bakım/altyapı işlemi.",
      "Ayrıca proje için kullanılan bir yapay zeka servis anahtarı (Gemini) ve Supabase yönetim erişim anahtarı güncellendi — eskisi süresi dolmuş/geçersiz durumdaydı.",
    ],
  },
  {
    id: "20260720-burak-share-gorsel-seed-script-tamamlandi",
    date: "20 Temmuz 2026",
    title: "Burak'ın 14 görseli otomatik yükleme script'i yazıldı ve idempotency hatası giderildi",
    items: [
      "Bir önceki kayıtta sadece hazırlık/tasarım aşamasında olan toplu yükleme script'i (scripts/seed-burak-share-images.mjs) bugün gerçekten yazıldı: docs/social-share-outputs/ altındaki 14 görseli dosya adından çözüp (parseBurakImageFilename) doğru araç/varyant/prompt slotuna, Supabase Storage'daki 'burak-share' deposuna ve ilgili veritabanı tablolarına otomatik yüklüyor.",
      "Dosya adı çözücüde bir kenar durumu hatası bulunup düzeltildi: 2 haneli araç sırası (ör. '11') ile açık varyant hanesi karışabiliyordu; artık açık varyant hanesi her zaman öncelikli okunuyor, testlerle doğrulandı.",
      "Script ilk çalıştırıldığında bir idempotency (tekrar çalıştırınca aynı görseli iki kez eklememe) hatası fark edildi: aynı slota ait ek görselleri karşılaştırırken tam dosya yolu yerine sadece dosya adının bir kısmı karşılaştırılıyordu, bu da bazı görsellerin yanlışlıkla 'zaten var' sayılıp atlanmasına yol açabiliyordu. Karşılaştırma mantığı düzeltildi — script artık güvenle birden fazla kez çalıştırılabilir, hep aynı sonucu verir.",
      "Bu adımda script'in canlı veritabanına karşı gerçek çalıştırılması yapılmadı — sadece kod yazıldı ve testlerle doğrulandı. Görsellerin admin panelinde görünmesi için script'in çalıştırılması gerekiyor.",
    ],
  },
  {
    id: "20260720-burak-share-gorsel-seed-hazirligi",
    date: "20 Temmuz 2026",
    title: "BURAK BURAYA BAK bölümü için 14 görsel repoya eklendi + otomatik yükleme script'inin altyapısı hazırlandı",
    items: [
      "Burak'ın hazırladığı 14 ChatGPT görseli (docs/social-share-outputs/ altına, dosya adı olarak hangi araç/varyant/prompt'a ait olduğunu kodlayan sayısal isimlerle, ör. 101.png, 1221.png) depoya eklendi. Bu görseller henüz veritabanına/admin paneline YÜKLENMEDİ — sadece kaynak dosyalar depoda hazır bekliyor.",
      "Bu sayısal dosya adlarını (hangi araç, hangi varyant, hangi prompt numarası olduğunu) otomatik çözen küçük bir yardımcı fonksiyon (parseBurakImageFilename) yazıldı ve testlerle doğrulandı (12 senaryo: 2, 3 ve 4 haneli dosya adları + geçersiz adlar). Bu fonksiyon, bir sonraki adımda yazılacak toplu yükleme script'inin temelini oluşturuyor.",
      "14 görselin tamamını Supabase Storage'a ('burak-share' deposu) ve ilgili veritabanı tablolarına otomatik işleyecek script için ayrıntılı bir uygulama planı hazırlandı (docs/superpowers/plans/) — script'in kendisi henüz yazılmadı, bu tamamen hazırlık/tasarım aşaması.",
      "Kullanıcıya görünen hiçbir değişiklik yok; bu iş sadece bir sonraki adımın (görsellerin admin panelinde görünmesi) altyapısını hazırlıyor. Kod/veritabanı canlıya etki etmedi, deploy gerekmiyor.",
    ],
  },
  {
    id: "20260720-coklu-gorsel-ve-kompakt-kart-gorunumu",
    date: "20 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu'na birden fazla görsel desteği geldi + kartlar kompaktlaştı",
    items: [
      "Her kalem/varyanta artık kapak görselinin yanına sınırsız sayıda EK görsel eklenebiliyor — 'Görsel' butonunu açınca küçük resim galerisi ve '+ Ekle' kutusu görünüyor, her görsel ayrı ayrı silinebiliyor. Teknik: yeni social_share_asset_images tablosu (canlıda oluşturuldu ve doğrulandı), mevcut tekli kapak görseli sistemiyle birlikte çalışıyor, veri kaybı/taşıma yok.",
      "Görsel eklendiğini fark etmek artık çok daha kolay: akordeon kart kapalıyken bile başlıkta yeşil bir '🖼️ N' rozeti görünüyor (kapak + ek görsellerin toplam sayısı). Kart açıldığında 'Görsel' ve 'Video' butonları, medya varsa gri yerine dolu yeşil renge dönüyor ve görsel sayısını gösteriyor — önceden sadece küçük gri bir yazı vardı, kolayca gözden kaçıyordu.",
      "Görsel Promptu kutuları çok satırlı büyük metin alanından (140px) tek satır, kompakt bir kutuya indirildi — kopyalama butonu zaten üstte olduğu için tüm metni açık görmeye gerek yok, kartlar artık çok daha az yer kaplıyor.",
      "Kart başlığındaki dosya adı etiketi sadeleştirildi: tool-1_p1.png gibi id-bazlı uzun addan, kartın sayfadaki sırasına dayanan kısa bir etikete geçildi (ör. tek varyantlı kalemde '52', çok varyantlı kalemde '521').",
      "tsc/ESLint temiz, migration canlı veritabanına uygulandı ve doğrulandı (tablo + 4 RLS policy). Sitede görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    id: "20260720-prompt-katalogu-sembolik-illustrasyon-ve-dosya-adi-etiketi",
    date: "20 Temmuz 2026",
    title: "Sosyal paylaşım görsel promptları insan-merkezli sembolik illüstrasyon tarzına çevrildi + kartlara dosya adı etiketi eklendi",
    items: [
      "Admin panelindeki Sosyal Medya Paylaşım Deposu'nun (/admin/social-share-vault) 4 kaynağındaki (Araç Tanıtımları, Diaspora Postları, Test Araçları, Burak — 100 kalem, 288 görsel promptu) tamamı, ultra-fotogerçekçi fotoğraf tarzından yeni bir görsel dile çevrildi: her sahnede bir insan figürü kompozisyonun duygusal merkezinde kalıyor, etrafında sahneyi anlatan basit yuvarlak sembolik ikonlar (büyüteç, konum iğnesi, tokalaşma, konuşma balonu vb.) bir hâle/yörünge düzeninde beliriyor. Telefon/laptop ekranları artık ana görsel odak değil, ikincil bir aksesuar. LinkedIn/Instagram metinleri değişmedi.",
      "Kanonik referans dosyası docs/social-share-outputs/prompt-katalogu.html aynı 288 promptla senkronlandı; artık kullanılmayan sonkatalog.html kaynağı depodan kaldırıldı.",
      "Her 'Görsel Promptu' kartının başlığına, o promptun kaydedileceği gerçek dosya adını (ör. tool-1_p1.png, test-tool-4-v2_p1.png) küçük bir etiket olarak gösteren ek eklendi — üretilen görseli hangi ad ile kaydedeceğini artık kart üzerinden görebiliyorsun, ayrıca dosya adlandırma tablosuna bakmana gerek kalmıyor.",
      "Aynı 4 kaynaktaki 144 Reddit postunun tamamının sonuna, mevcut kısa link satırı korunarak iki yeni satır eklendi: WhatsApp topluluk linki ve https://corteqs.net/tools — Reddit'ten gelen ilgiyi doğrudan araçlar sayfasına ve topluluğa yönlendirmek için.",
      "Bu değişiklik yalnızca içerik ve arayüz metni — sayfanın yapısı (dört bölüm, filtre çipleri, medya yükleme paneli) aynı kaldı. tsc/ESLint/UTF-8 metin denetimi/production build temiz. Sitede görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    id: "20260719-revizyon-listesi-51-madde-triyaj",
    date: "19 Temmuz 2026",
    title: "Revizyon İstekleri listesindeki 51 madde tek tek gözden geçirildi: 10 tanesi kapatıldı",
    items: [
      "/admin/revision-requests sayfasındaki 51 açık maddenin tamamı — hem 12 Haziran'daki ilk liste hem 17-18 Temmuz'daki ek liste — kod üzerinden tek tek kontrol edildi: her madde hâlâ geçerli mi, zaten çözülmüş mü, yoksa artık var olmayan bir ekrana mı ait, netleştirildi.",
      "6 madde 'Yapıldı' olarak işaretlendi çünkü kodda zaten karşılandıkları doğrulandı: Cadde paylaşım kutusunun etiketi zaten 'Caddede Paylaş' (şikayetteki 'Paylaşım Oluştur' değil), Hoşgeldin Paketi formu hatasız ve eksiksiz çalışıyor, 'Ağın 5 Katmanı' başlığı zaten 'Ağın 6 Katmanı' olmuş, kategori sıralaması zaten istenen sırada (Uzmanlar-İşletmeler-Kuruluşlar-Topluluklar-Şehir Elçileri-İnsanlar), ana sayfadaki 'Şehir Elçileri' kartı zaten doğru filtrelenmiş şehir elçisi listesine gidiyor, Çarşı'daki boş-kategori metni zaten güncel haline yakın.",
      "4 madde 'İptal' olarak işaretlendi çünkü ait oldukları ekran artık yok: bu maddeler 18 Haziran'da değiştirilen eski ana sayfa tasarımına (Index.tsx / DiasporaSearchBar) aitti — 'Şehir Elçisi araması sonrası tüm dizin geliyor', 'Taşınma Motoru tıklanınca Cadde'ye gidiyor', '8 Kıta' metni ve HERO'daki klişe yazım hatası. Yeni ana sayfa (LandingTrialPage) bu ekranların hiçbirini kullanmıyor; sorunun kendisi artık üretilemiyor.",
      "Kalan 34 madde kod incelemesiyle hâlâ açık/geçerli olarak doğrulandı (ör. Cadde kafe kapasite seçenekleri, kafe 'tema' alanının aslında kategori olması, Cadde'deki WhatsApp geri bildirim linki, 'Aktif Cafe Özeti' başlığı, Çarşı ve Cadde paylaşımında foto/video desteğinin eksikliği) — bunlar listede açık kalmaya devam ediyor, sırayla ele alınacak.",
      "7 madde için kod okuması yeterli kanıt vermedi (ör. sayfa yenilenince kayan scroll davranışı, öznel 'Excel gibi duruyor' tasarım eleştirisi) — bunlar görsel/manuel test gerektiriyor, şimdilik durumları değişmedi.",
      "Bu iş yalnızca veritabanındaki durum (status) alanlarını güncelledi — kod değişikliği yapılmadı, deploy gerekmiyor.",
    ],
  },
  {
    id: "20260719-brainstorming-tek-sutun-akis-ve-build-fix",
    date: "19 Temmuz 2026",
    title: "Brainstorming sayfası tek sütun akışa döndü + build'i kıran iki hata giderildi",
    items: [
      "/admin/brainstorming sayfasındaki ayrı sol bölüm seçim paneli kaldırıldı. Artık her bölüm başlığı, altındaki konu satırları ve yorum akışı eski /statusreport3006 sayfasındaki gibi tek sütunda art arda akıyor — sayfa içi bölüm navigasyonu admin ana sol menüsüyle karışıp kafa karıştırıyordu. Sıralama/düzenleme/silme/yorum aksiyonlarının hepsi aynen çalışmaya devam ediyor; sadece sayfa düzeni sadeleşti. Ayrıca akordeon kartların kapalı başlaması gerektiği netleştirildi (kod zaten doğruydu, canlıda eski build çalıştığı için görünmüyordu — bu iş kapsamında yeni bir yayın tetiklendi).",
      "Build'i her seferinde başarısız kılan iki teknik sorun düzeltildi: (1) Türkçe metin denetim script'i (verify-text-encoding.mjs) docs/reference-clones/ altındaki dondurulmuş üçüncü parti referans kodunu da tarıyordu, oradaki Almanca karakterleri mojibake sanıp build'i durduruyordu — bu klasör artık taramanın dışında. (2) Görsel optimizasyon eklentisi (vite-plugin-image-optimizer) svgo paketi eksik olduğu için SVG optimizasyonunu sessizce atlayıp hata basıyordu — eksik bağımlılık eklendi. Bu ikisi tamamen geliştirici/altyapı tarafı; kullanıcıya görünen bir değişiklik yok ama artık build'ler güvenilir şekilde tamamlanıyor.",
    ],
  },
  {
    id: "20260718-prompt-katalogu-repo-uyumlu-senkron",
    date: "18 Temmuz 2026",
    title: "Sosyal paylaşım görsel prompt kataloğu CorteQS'e özel içerikle güncellendi, mükerrer dosyalar temizlendi",
    items: [
      "docs/social-share-outputs/prompt-katalogu.html içindeki 288 görsel promptunun tamamı, CorteQS ürün terminolojisiyle (Dizin, AI Eşleştirme, Cadde, Çarşı, diaspora ağı vb.) yeniden yazılmış 'repo uyumlu' sürümle değiştirildi. Dosya adları ve repo eşleştirme düzeni aynen korundu; sadece prompt metinleri ve masthead açıklaması güncellendi.",
      "Bu iş sırasında oluşan mükerrer/eskimiş dosyalar depodan kaldırıldı: docs/corteqs-repo-uyumlu-prompt-katalogu.html (artık prompt-katalogu.html ile birebir aynıydı) ile içeriği zaten /admin/revision-requests'e taşınmış olan docs/MVP DÜZELTMELER TEXT.docx ve docs/MVP DÜZELTMELER.xlsx kaynak dosyaları.",
      "Bu değişiklik yalnızca depo içi bir referans dokümanı ve depo hijyeni — uygulama kodu, veritabanı veya kullanıcıya görünen bir sayfa etkilenmedi.",
    ],
  },
  {
    id: "20260718-sosyal-paylasim-vault-100-icerik-tarih-tek-sutun",
    date: "18 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu 100 kaleme çıktı: günlük tarih etiketi, günlük karışan sıra, tek sütun kart",
    items: [
      "Admin panelindeki Sosyal Medya Paylaşım Deposu (/admin/social-share-vault) sayfasındaki kalem sayısı 82'den 100'e çıktı. Diaspora Postları bölümüne 18 yeni post eklendi (18 Araç Tanıtımı + 68 Diaspora Postu + 10 Test Aracı + 12 Burak aracı = 100). Yeni postlar hem CorteQS'in kendi özelliklerini (Cadde, Çarşı, Radar, Blog, Referans/davet sistemi) hem de genel diaspora konularını (ikinci kuşak kimliği, uzaktan çalışma, gurbette yalnızlık, ana dil kaybı, öğrencilik, mentorluk, kadın dayanışması, ambasadörlük) kapsıyor — her biri diğerleriyle aynı formatta: 2 ChatGPT görsel promptu + LinkedIn + Instagram + Reddit postu.",
      "Her kartın başlığına artık sabit bir tarih rozeti ekleniyor: 20 Temmuz'dan başlayarak, kartın listedeki sabit sırasına göre bir sonraki gün atanıyor (20 Tem, 21 Tem, 22 Tem...). Bu tarih kartın kendine ait sabit özelliği — hangi filtre/sıralama uygulanırsa uygulansın değişmiyor. Amaç: '100 gün boyunca her gün hangi içerik önerilsin' sorusuna kabaca bir yanıt vermek.",
      "Kartların görünüm sırası artık günlük olarak değişiyor: sayfa aynı gün içinde kaç kez yenilenirse yenilensin (F5) herkes aynı sırayı görüyor, ama ertesi gün sıra otomatik olarak karışıyor. Böylece 'bugün üstte gördüğüm içerik' her gün farklı oluyor, tek bir kalem sürekli en üstte kalmıyor. Bu sıralama sadece görünüm sırası — kartın üzerindeki sabit tarih rozetini etkilemiyor.",
      "Kart açıldığında içindeki kutular (Görsel Promptu 1, Görsel Promptu 2, LinkedIn, Instagram, Reddit) artık yan yana 2 sütun değil, alt alta tek sütun/tek satır halinde diziliyor — daha uzun ama tek bakışta yukarıdan aşağı okunan bir düzen. Bu değişiklik dört bölümün (Araç Tanıtımları, Diaspora, Test Araçları, Burak) hepsinde aynı şekilde geçerli, çünkü hepsi aynı ortak bileşeni kullanıyor.",
      "Teknik tarafta: veritabanı/migration değişikliği gerekmedi — görsel/video yükleme paneli ve ortak depo (bucket) yeni 18 post için de otomatik çalışıyor. tsc/ESLint temiz, ilgili testler geçti. Sitede görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    id: "20260718-sosyal-paylasim-vault-reddit-ve-medya-genisletme",
    date: "18 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu'na Reddit postu eklendi + görsel/video yükleme artık dört bölümde de var",
    items: [
      "Admin panelindeki Sosyal Medya Paylaşım Deposu (/admin/social-share-vault) sayfasındaki 82 kalemin (10 Araç Tanıtımı, 50 Diaspora Postu, 10 Test Aracı, 12 Burak aracı) her varyantına, LinkedIn ve Instagram'ın yanına üçüncü bir hazır metin eklendi: Reddit postu. Bu metin diğer ikisinden bilinçli olarak farklı bir üslupta — satış dili yerine soru/tartışma tonu, az emoji, hashtag yok, sonunda çıplak bir link var. Kendi Kopyala butonuyla ayrı bir kart olarak görünüyor, sayfa üstündeki 'Tüm Reddit Postları' toplu kopyalama butonu da eklendi.",
      "Görsel ve video yükleme özelliği önceden yalnızca 'Burak' bölümündeydi; artık dört bölümün de her varyantında küçük 'Görsel' ve 'Video' butonlarıyla açılıp kapanan bir panel olarak mevcut. Panel içeriği aynı: doğrudan görsel yükleme, Gmail/Drive linki, Drive video linki ve bir not alanı. Aynı ortak depoyu (görsel dosyaları) ve aynı veritabanı tablosunu (kayıtları) kullanıyor — yeni bir depo/tablo açılmadı, sadece dört bölümün tamamına bağlandı. Burak bölümündeki mevcut yüklemeler hiç etkilenmedi.",
      "'Tümü' filtresi seçiliyken kartlar artık 1'den 82'ye tek seferde sürekli numaralanıyor (önceden her bölüm kendi içinde 1'den başlıyordu, dört bölümde aynı numara tekrar ediyordu — kafa karıştırıcıydı). Bir bölüme (ör. sadece 'Diaspora Postları') filtrelenince numaralar yine o bölümün kendi sırasına dönüyor.",
      "Kaynak filtresinin (Tümü/Araç Tanıtımları/Diaspora/Test/Burak) altına, seçtiğiniz bölüme özel ikinci bir filtre satırı eklendi: Araç Tanıtımları'nda Keşfet/Bağlan/Kullan/Koru kategori çipleri, Diaspora Postları'nda 26 tema çipi (Gurbet, Kimlik, Mutfak vb.). Böylece örneğin sadece 'Bağlan' kategorisindeki araçları ya da sadece 'Bayram' temalı diaspora postlarını görmek için ekstra tıklama yeterli.",
      "Teknik tarafta: veritabanı/migration değişikliği gerekmedi — mevcut social_share_assets tablosu ve burak-share deposu (bucket) aynen kullanıldı, sadece kayıt anahtarları artık hangi bölümden geldiğini de içeriyor (geriye dönük uyumlu, eski Burak kayıtları bozulmadı). tsc/ESLint/testler temiz (1050 testten 3'ü bu değişiklikten bağımsız, önceden de var olan bir bilinen sorun). Sitede görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    id: "20260718-canva-yerine-chatgpt-instagram",
    date: "18 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu'nda Canva görsel promptları kaldırıldı, yerine ChatGPT promptu + Instagram postu geldi",
    items: [
      "Admin panelindeki Sosyal Medya Paylaşım Deposu (/admin/social-share-vault) sayfasındaki 82 kalemin (10 Araç Tanıtımı, 50 Diaspora Postu, 10 Test Aracı, 12 Burak aracı) her varyantındaki eski Canva görsel promptları tamamen kaldırıldı — Canva artık kullanılmıyor. Yerine her varyant için, doğrudan ChatGPT'ye yapıştırılabilecek 2 farklı İngilizce görsel promptu geldi: kare (1:1) format, ortalanmış kompozisyon ve görselde hiç yazı/harf/logo olmaması gibi katı kurallara uyuyor, aynı zamanda hepsi tutarlı bir görsel kimlikte (krem arka plan, teal ana renk, turuncu/mavi/indigo/pembe/sarı vurgu renkleri).",
      "Aynı zamanda her varyanta, LinkedIn postunun yanına ayrı bir Instagram postu eklendi — LinkedIn'in kısaltması değil, Instagram'a özgü kendi üslubuyla (daha kısa, daha samimi, sonunda yoğun bir hashtag bloğu) yeniden yazıldı. Sayfadaki toplu kopyalama butonları da güncellendi: artık 'Tüm Görsel Promptları', 'Tüm LinkedIn Postları' ve 'Tüm Instagram Postları' olarak üç ayrı buton var.",
      "Bu değişiklik sadece içerik ve metin — sayfanın yapısı (dört bölüm, filtre çipleri, paylaşım takip rozetleri) aynı kaldı. tsc/ESLint/testler temiz. Sitede görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    id: "20260718-brainstorming-admin-sekmesi",
    date: "18 Temmuz 2026",
    title: "Durum raporu (/statusreport3006) admin paneline 'Brainstorming' sekmesi olarak taşındı",
    items: [
      "Cadde 3.0 & Premium Panel durum ve karar raporu artık herkese açık bir sayfa değil — /admin/brainstorming altında, sol menüde 'Roller ve AFS' grubunda. Eski /statusreport3006 adresi kaldırıldı, oraya girmeye çalışan herkes artık 404 görür.",
      "İçerik artık statik bir dosyada değil, veritabanında: tüm adminler panelden bölüm ekleyip/düzenleyip/silebiliyor, her bölümün altına konu satırı (teknik + sade açıklama + durum rozeti) ekleyebiliyor, sıralamayı yukarı/aşağı oklarla değiştirebiliyor. Mevcut 15 bölüm/35 satırlık içerik olduğu gibi taşındı.",
      "Yorum sistemi admin kimliğine bağlandı — eskiden herkes serbest isim yazıp anonim yorum bırakabiliyordu, artık sadece giriş yapmış adminler yorum yazabiliyor ve yazan kişi otomatik (e-postasından) görünüyor.",
    ],
  },
  {
    id: "20260718-dunya-kupasi-kaldirildi",
    date: "18 Temmuz 2026",
    title: "Dünya Kupası kampanyası tamamen kaldırıldı",
    items: [
      "Kampanya sona erdiği için /dunya-kupasi ve /dunya-kupasi/kayit sayfaları, /admin/dunya-kupasi onay paneli ve sol menüdeki 'Dünya Kupası' girdisi kaldırıldı.",
      "Veritabanı tarafında worldcup_* RPC'leri, world_cup_registrations/world_cup_campaign_settings tabloları ve world-cup-images depolama (storage) bucket'ı silindi; kampanyaya özel 3 mekân rolü (Bar/Pub, Çay Bahçesi, Nargile) deaktif edildi.",
      "Canlıda tek onaylı başvuru kaydı yönetici test hesabına aitti ve rol ataması yapılmamıştı (Admin rolleri korunur kuralı), bu yüzden gerçek kullanıcı etkisi olmadı.",
    ],
  },
  {
    id: "20260718-revizyon-listesi-mvp-seed",
    date: "18 Temmuz 2026",
    title: "MVP Revizyon Listesi'ndeki 51 madde artık /admin/revision-requests içinde",
    items: [
      "Excel ve Word dosyalarında biriken 51 revizyon/düzeltme notu (12 Haziran ve 17-18 Temmuz tarihli) tek tek Revizyon İstekleri sayfasına (/admin/revision-requests) kayıt olarak eklendi. Her madde kendi bölüm etiketiyle (HERO, CADDE, RADAR, ARAÇLAR vb.) birlikte geldi; hepsi 'Açık' durumda ve varsayılan öncelikte başlıyor.",
      "Bu, mevcut Revizyon İstekleri sisteminin üzerine veri eklemekten ibaret — sayfa, formlar, yorum thread'i ve görsel ekleme özelliği zaten vardı, yeni kod yazılmadı. Artık her madde ayrı ayrı düzenlenebilir, duruma göre filtrelenebilir (İnceleniyor/Yapıldı/İptal), yorum yazılabilir ve ekran görüntüsü eklenebilir.",
      "Aynı başlık + bölüm ikilisi tekrar eklenmeye çalışılırsa migration kendini atlıyor (idempotent) — yani bu migration'ın tekrar çalışması veri çoğaltmıyor.",
      "Sonradan yapılan bir kontrolde, kaynak Excel/Word dosyalarında metnin yanında 5 gerçek ekran görüntüsü de bulundu ama ilk seed'de sadece metin taşınmıştı. 4 tanesi eksiği kapatmak için ilgili maddelere eklendi: arama filtresindeki 'Süper Admin' rozeti bug'ını gösteren ekran görüntüsü ile Cadde paylaşım formu/nav bar/başlık ekran görüntüleri artık kendi maddelerinin altında görünüyor.",
    ],
  },
  {
    id: "20260718-repo-temizligi-uretilen-gorseller",
    date: "18 Temmuz 2026",
    title: "Depo temizliği: otomatik üretilen 36 görsel + kullanılmayan referans klonlar kaldırıldı",
    items: [
      "LinkedIn için otomatik üretilen 36 tanıtım görseli (12 araç × 3 varyant) artık git deposunda tutulmuyor — bu görseller zaten npm run social:generate komutuyla istendiğinde yeniden üretilebiliyor, depoda saklanmasına gerek yoktu. Admin panelindeki otomatik görsel önizlemesi etkilenmedi; görsel dosya bulunamadığında zaten kendiliğinden gizleniyor.",
      "Build ve test sırasında otomatik oluşan geçici klasörler (dist/, test-results/, .playwright-mcp/) depodan temizlendi — bunlar da npm run build / npm run test çalıştırıldığında otomatik yeniden oluşuyor.",
      "Geliştirme sürecinde referans amaçlı klonlanmış üç eski proje klasörü (ref/, ref101/, reference/) kökten docs/reference-clones/ altına taşındı — kod hâlâ duruyor, sadece proje köküne dağılmış hâlde değil, düzenli bir arşiv konumunda.",
      "Bu bir kod/özellik değişikliği değil, tamamen depo hijyeni — kullanıcı tarafında görünür hiçbir fark yok. Sadece geliştirici tarafında depo boyutu küçüldü ve kök klasör daha düzenli hale geldi.",
    ],
  },
  {
    id: "20260718-sosyal-paylasim-vault-birlesik-liste",
    date: "18 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu'ndaki 4 sekme kaldırıldı, tek liste oldu + Burak'ın bölümüne de paylaşım rozetleri geldi",
    items: [
      "Admin panelindeki Sosyal Medya Paylaşım Deposu (/admin/social-share-vault) sayfasında daha önce ayrı sekmeler halinde duran dört bölüm (Araç Tanıtımları, Diaspora Postları, Test Araçları, BURAK BURAYA BAK) artık sekmesiz — tek sayfada, başlıklarıyla art arda sıralı tek liste halinde görünüyor. İçerikte hiçbir kayıp yok, sadece gezinme şekli değişti: artık sekme tıklamadan sayfayı aşağı kaydırarak hepsine ulaşılıyor. Toplu kopyalama butonları da artık tüm bölümlerdeki kalemleri birden kapsıyor.",
      "Diğer üç bölümde zaten var olan LinkedIn / Instagram / Reddit / X / Facebook / Threads paylaşım durumu rozetleri (kırmızı-yeşil, tıklanabilir, kalıcı) artık Burak'ın bölümündeki 12 araç için de görünüyor — önceden sadece o bölümde bu rozetler eksikti, şimdi dört bölüm de aynı paylaşım takibi özelliğine sahip.",
      "Teknik tarafta: mevcut social_share_log tablosunun izin verdiği sekme listesine 'burak' eklendi (küçük bir migration), sayfa bileşeni ve Burak'ın bölüm bileşeni buna göre güncellendi. Yeni tablo/veri kaybı yok, sadece mevcut rozet sistemi dördüncü bölüme de bağlandı. Migration canlı veritabanına uygulandı ve doğrulandı; tüm testler ve build yeşil.",
    ],
  },
  {
    id: "20260714-bireysel-tek-tip-premium-profil",
    date: "14 Temmuz 2026",
    title: "Tüm Bireysel kullanıcılar artık aynı 'premium' profil tasarımını görüyor",
    items: [
      "Daha önce sadece iki test hesabında (Experimental_2/3) denenen zengin profil görünümü — büyük fotoğraf, mor vurgu rengi, üstte 'Premium Profil' etiketi, öne çıkan hızlı aksiyon butonları (e-posta / WhatsApp / telefon), düzenli bölüm sıralaması — artık 'Bireysel' kategorisindeki HER kullanıcıya (Diaspora Üyesi ve benzeri bireysel roller) uygulandı. Danışman, İşletme, Kuruluş, Influencer, Elçi gibi diğer profil kategorileri bu değişiklikten etkilenmedi, eskisi gibi kalmaya devam ediyor.",
      "Hem kendi profilini düzenlerken (/profile) hem başkasının herkese açık profiline bakarken (/directory/catalog/...) aynı yeni tasarım geçerli. Doldurulan bilgiler, görünürlük ayarları ve izinler HİÇBİR ŞEKİLDE değişmedi — sadece görsel sunum güncellendi.",
      "İstisna: platformun iki SuperAdmin hesabı (Umut ve Burak) bu değişikliğin dışında bırakıldı — profilleri bilinçli olarak eski sade/generic görünümde kalmaya devam ediyor, premium tasarımı almıyor. Bu, sadece görsel bir istisna; rol yetkileri, veri ve izinler etkilenmedi.",
      "Profil değiştirme ekranındaki 'Premium Pilot' rozeti de artık tüm Bireysel profil kartlarında görünüyor (önceden sadece iki test hesabında çıkıyordu, SuperAdmin hesapları hariç) — aynı tasarımı paylaştıkları için bilinçli olarak aynı rozet kullanıldı, ayrı bir 'Bireysel' rozeti eklenmedi.",
      "Teknik tarafta: src/lib/profile-presentation.ts içine yeni bir 'individual-premium' sunum config'i eklendi; hangi rolün 'Bireysel' sayıldığı zaten var olan tek kaynaktan (profile-types.ts → getUiProfileType) okunuyor, ikinci bir bakım noktası açılmadı. Admin_SuperAdmin rolü bu kategoriye girse de ayrı bir istisna listesiyle generic sunumda tutuluyor. Deneysel_2/3 pilotu kullanıcı tercihiyle ayrı bir config olarak korundu (aynı görünüm, ayrı anahtar) — ileride ayrışma esnekliği için. Feature flag YOK, kademeli açılım yapılmadı; değişiklik deploy sonrası tüm Bireysel kullanıcılar için anında aktif olacak. Veritabanı/migration değişikliği yok, sadece frontend kodu. 1028 test + tsc kontrolü yeşil; görsel QA deploy sonrası yapılmalı.",
    ],
  },
  {
    id: "20260714-admin-hizli-arac-linkleri",
    date: "14 Temmuz 2026",
    title: "Admin panel üst çubuğuna Clarity / Search Console / Drive'a tek tık erişim eklendi",
    items: [
      "Admin panelin üst çubuğunda (topbar), arama kutusunun solunda üç yeni ikon buton var: Microsoft Clarity, Google Search Console ve ortak Google Drive klasörü. Her birine tıklayınca ilgili sayfa yeni sekmede direkt açılıyor — artık linkleri ayrıca aramaya/yapıştırmaya gerek yok.",
      "Sadece görsel bir eklenti; hiçbir mevcut menü veya sayfa değişmedi.",
    ],
  },
  {
    id: "20260714-admin-rol-dagilimi-karti",
    date: "14 Temmuz 2026",
    title: "Kayıt Veritabanı'na 'Kullanıcı Tipi Dağılımı' kartı eklendi (her rolden kaç kişi var)",
    items: [
      "Admin panelinde Kayıt Veritabanı (/admin/data) sayfasını açtığında artık üstte kapalı gelen yeni bir kart var: 'Kullanıcı Tipi Dağılımı'. Karta tıklayıp açınca, platformdaki HER kullanıcı/kayıt tipinin (ör. Bireysel/Diaspora Üyesi, dernekler, danışmanlar vb.) toplam sayısını tek bakışta görüyorsun — sayfa sayfa saymana gerek kalmadan, veritabanının tamamı için.",
      "Örneğin 'kaç tane bireysel kullanıcımız var' sorusunun cevabı artık bu kartta 'Diaspora Üyesi' satırında duruyor (bireysel kullanıcı rolünün sistemdeki adı budur).",
      "Teknik tarafta: yeni bir admin RPC'si (moderator-gated) rol bazında gruplu sayım yapıyor; otomatik testlerle korunuyor, tüm proje testleri yeşil. Veritabanı tarafının canlıya uygulanması ayrı bir onay adımı olarak bekliyor.",
    ],
  },
  {
    id: "20260714-ucretsiz-rozeti-ve-arac-menusu",
    date: "14 Temmuz 2026",
    title: "Sitede her yere 'Ücretsiz' vurgusu eklendi + masaüstü Araçlar menüsü sadeleşti",
    items: [
      "Giriş ekranında ve /tools altındaki tüm araç kartlarında (hem hub sayfasında hem araç detaylarında) artık göz alıcı yeşil bir '🎉 ÜCRETSİZ' rozeti var — ziyaretçiye ücretsiz olduğumuzu daha net anlatmak için.",
      "Masaüstünde header'daki 'Araçlar' açılır menüsü (dropdown) kaldırıldı; artık tek tıkla doğrudan Araçlar sayfasına (/tools) götürüyor. Önceki popover menü (araç listesini önizleyen) sadeleştirme kapsamında çıkarıldı.",
      "Ayrıca arka planda bir SEO düzeltmesi yapıldı: /tools altındaki tekil araç sayfaları (ör. /tools/xyz) giriş gerektirdiği için Google'ın site haritasından (sitemap) çıkarıldı — bunlar zaten girişsiz görülemiyordu ve Google Search Console'da 'taranmış ama indekslenmemiş' uyarısına yol açıyordu. Sadece herkese açık /tools ana sayfası site haritasında kalmaya devam ediyor.",
    ],
  },
  {
    id: "20260714-revizyon-istekleri-gorsel-ekleme",
    date: "14 Temmuz 2026",
    title: "Revizyon İstekleri'ne görsel ekleme eklendi: hem talebe hem yorumlara çoklu görsel",
    items: [
      "Admin panelindeki Revizyon İstekleri (/admin/revision-requests) sayfasında artık hem bir revizyon talebine hem de talebin altındaki her yoruma birden fazla görsel eklenebiliyor. Bir talep açtıktan sonra detay panelinden, ya da yorum yazarken 'Görsel Ekle' ile ekran görüntüsü/referans görsel paylaşılabiliyor.",
      "Yüklenen görseller veritabanında KALICI olarak saklanıyor ve tüm adminler ortak görüyor — biri bir görsel eklediğinde diğer adminler de aynı anda görüyor. Görseller yalnız adminlere açık özel bir depoda (private bucket) tutuluyor; her görsel tekil olarak silinebiliyor.",
      "Teknik tarafta: yeni revision_request_attachments tablosu + admin-only güvenlik kuralları (RLS) + özel 'revision-attachments' depo tek migration'da; ek API'si otomatik testlerle korunuyor, tüm proje testleri yeşil. Sayfanın görünmesi için bir sonraki yayın (deploy) gerekiyor; veritabanı/depo değişikliğinin canlıya uygulanması ayrı bir onay adımı olarak bekliyor.",
    ],
  },
  {
    id: "20260708-burak-buraya-bak-paylasim-bolumu",
    date: "8 Temmuz 2026",
    title: "Sosyal Medya Paylaşım Deposu'na Burak için yeni 'BURAK BURAYA BAK' sekmesi + görsel/video yükleme eklendi",
    items: [
      "Admin panelindeki Sosyal Medya Paylaşım Deposu (/admin/social-share-vault) sayfasına dördüncü bir sekme eklendi: 'BURAK BURAYA BAK'. Bu sekme, paylaşım için hazırlanmış 12 tanıtım aracının hepsini (10 genel taşınma aracı + Almanya Banka ve Almanya Sigorta) tek yerde topluyor; her araç için 3 varyant, her varyantta hazır Canva görsel promptu ve kopyala-yapıştır Türkçe LinkedIn postu var. Mevcut üç sekmeye (Araç Tanıtımları, Diaspora Postları, Test Araçları) dokunulmadı.",
      "Yeni sekmenin farkı: her Canva promptunun altına bir 'medya paneli' geldi. Buraya (1) doğrudan bir görsel yükleyebilirsin, (2) görsel yüklemek istemezsen onun yerine Gmail/Drive görsel linki yapıştırabilirsin, (3) 'Videoyu Drive'a Yükle' butonuyla ortak Drive klasörü yeni sekmede açılıp videoyu oraya atıp linkini yapıştırabilirsin, (4) kısa bir not düşebilirsin. Alanların hepsi opsiyonel ve birbirinden bağımsız.",
      "Yüklenen görsel ve girilen linkler veritabanında KALICI olarak saklanıyor ve tüm adminler aynı içeriği ortak görüyor — Burak bir görseli yüklediğinde diğer adminler de görüyor, cihaz/oturum fark etmiyor. Görseller yalnız adminlere açık özel bir depoda (private bucket) tutuluyor.",
      "Teknik tarafta: yeni social_share_assets tablosu + admin-only güvenlik kuralları (RLS) + özel 'burak-share' depo tek migration'da; medya API'si otomatik testlerle korunuyor, tüm proje testleri yeşil. Sekmenin görünmesi için bir sonraki yayın (deploy) gerekiyor; veritabanı/depo değişikliğinin canlıya uygulanması ayrı bir onay adımı olarak bekliyor.",
    ],
  },
  {
    id: "20260707-uye-geri-bildirim-sistemi",
    date: "7 Temmuz 2026",
    title: "Üye geri bildirim sistemi eklendi: sitede 'Feedback Ver' butonu + /admin/feedback yönetim sayfası",
    items: [
      "Giriş yapmış her üye artık sitenin üst barında (Profilim'in yanında) 'Feedback Ver' linkini görüyor. Tıklayınca /feedback sayfasındaki basit forma gidiyor: tek bir metin kutusuna hata bildirimi, öneri veya genel görüşünü yazıp gönderiyor. Gönderim sonrası teşekkür ekranı çıkıyor ve üye kaldığı sayfaya dönebiliyor. Üyenin hangi sayfadan geldiği de kayda otomatik işleniyor (geri bildirimin bağlamını görmek için).",
      "Admin paneline yeni 'Üye Geri Bildirimleri' sayfası eklendi (/admin/feedback; menüde Revizyon İstekleri'nin yanında). Gelen her geri bildirim gönderen üyenin e-postası, tarihi ve geldiği sayfayla listeleniyor; durum üç aşamalı yönetiliyor (Yeni / Okundu / Arşiv) ve istenmeyen kayıt listeden kaldırılabiliyor. Tüm adminler aynı listeyi ortak görüyor.",
      "Gizlilik ve güvenlik: geri bildirimleri YALNIZ adminler okuyabiliyor — üyeler birbirinin geri bildirimini göremez (veritabanı seviyesinde kural/RLS). Form giriş gerektiriyor; anonim gönderim yok. Silme işlemi kalıcı silme değil, 'gizle' (soft-delete) — kayıt veritabanında durur, gerekirse geri getirilebilir.",
      "Teknik tarafta: yeni member_feedback tablosu + RLS politikaları tek migration'da; API katmanı 14 yeni otomatik testle korunuyor; tüm proje testleri yeşil. Butonun ve sayfaların görünmesi için bir sonraki yayın (deploy) gerekiyor; veritabanı değişikliğinin canlıya uygulanması ayrı bir onay adımı olarak bekliyor.",
    ],
  },
  {
    id: "20260707-tasinma-araclari-sorular-zorunlu",
    date: "7 Temmuz 2026",
    title: "Taşınma Araçları'nda artık hiçbir soru cevaplanmadan sonraki soruya geçilemiyor",
    items: [
      "Taşınma Araçları'ndaki (/relocation/tools) soru akışlı araçlarda bir boşluk vardı: soruların bir kısmı 'zorunlu' işaretli değildi ve kullanıcı bu soruları hiç cevaplamadan 'İleri' ile geçebiliyordu. Bu da sonuç skorlarının eksik veriyle hesaplanmasına yol açabiliyordu. Artık İSTİSNASIZ her soru cevaplanmadan bir sonraki soruya geçilemiyor; cevapsız 'İleri' denenirse 'Bu soru zorunlu' uyarısı çıkıyor ve akış aynı soruda kalıyor.",
      "Kural her soru tipinde geçerli: tek seçim ve çoklu seçimde en az bir şık, sayı/metin sorularında boş olmayan bir değer, onay sorusunda kutunun işaretlenmesi gerekiyor. Kaydırmalı (1-5 ölçek) sorularda ekranda ortada duran varsayılan değer cevap SAYILMIYOR — kullanıcının kaydırıcıya bilinçli olarak dokunması gerekiyor.",
      "Almanya'ya özel araçlarda değişiklik gerekmedi: Vatandaşlık Testi ve Vize Seçimi zaten cevapsız ilerletmiyordu; Maaş Hesaplama, Para Transferi ve StepStone Karşılaştırma ise soru akışı değil hesaplayıcı/form olduğu için kapsam dışı.",
      "Teknik tarafta: değişiklik ortak soru motorunda (QuestionStepper) tek noktadan yapıldı, veritabanına dokunulmadı — yani gelecekte eklenecek yeni araçlar da otomatik olarak bu kurala tabi. Yeni otomatik testler eklendi. Kullanıcının davranışı görmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    id: "20260705-relocation-gorseller-ve-soru-sayilari-paneli",
    date: "5 Temmuz 2026",
    title: "Taşınma Araçları'ndaki eksik kart görselleri tamamlandı + admin paneline 'Araç Soru Sayıları' bölümü eklendi",
    items: [
      "Taşınma Araçları sayfasında (/relocation/tools) Almanya'ya özel 7 aracın (Banka Seçimi, Sigorta Seçimi, Maaş Hesaplama, Vize Seçimi, Vatandaşlık Testi, Para Transferi, StepStone Maaş Karşılaştırma) kart görseli eksikti — kartlar görselsiz, boş görünüyordu. Diğer 10 aracın stiline uygun (aynı renk paleti ve çizim tarzı) 7 yeni görsel üretilip eklendi; artık sayfadaki 17 kartın tamamında görsel var.",
      "Admin paneline yeni bir 'Araç Soru Sayıları' bölümü eklendi (Taşınma Veri Toplama grubunda; adres: /admin/relocation-tools/soru-sayilari). Bu sayfa, Taşınma Araçları'ndaki 17 aracın HER BİRİNİN kaç sorudan/adımdan oluştuğunu canlı veritabanından çekip tek bir tabloda gösteriyor: araç adı, kategori, tipi (Soru Bankası / Karar Ağacı / Hesaplayıcı) ve toplam soru sayısı. Arama kutusuyla araç adına veya kategoriye göre filtrelenebiliyor. Amaç: hangi aracın soru içeriğinin daha sonra derinleştirilebileceğini tek bakışta görebilmek.",
      "Panel geliştirilirken aynı gün üründe yapılan bir başka değişiklik fark edildi: Taşınma Araçları'ndaki Hızlı/Detaylı mod seçimi kaldırılmıştı (bkz. aşağıdaki '20 soru tek mod' kaydı). Panel buna göre güncellendi; artık Hızlı/Normal diye ayrı iki sayı yerine tek bir 'Toplam Soru' sayısı gösteriyor, gerçek ürün davranışıyla birebir uyumlu.",
      "Teknik tarafta: yeni panel canlı veritabanından üç farklı kaynağı birleştiriyor (ortak soru motoru, Vatandaşlık Testi'nin kendi 469 soruluk havuzu, ve soru kavramı olmayan hesaplayıcı araçlar için sabit alan sayısı) — yeni testler eklendi, tüm proje testleri (979 test) yeşil, 4 ayrı bağımsız kod incelemesinden (review) geçti. Kod deposuna gönderildi ve GitHub'da inceleme (PR #13) açıldı; arayüzün görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    id: "20260705-tasinma-araclari-20-soru-tek-mod",
    date: "5 Temmuz 2026",
    title: "Taşınma Araçları'nda Hızlı/Detaylı mod ayrımı kaldırıldı — 10 araç artık tek akışta sabit 20 soru",
    items: [
      "Taşınma Araçları'ndaki (/relocation/tools) 10 genel değerlendirme aracında (Ülke Seçimi, Meslek/Maaş Karşılaştırma, Taşınma Hazırlık Skoru, Şehir Eşleştirme, Diaspora Ağı Eşleştirme, Yurtdışı Kariyer Yolu, Expat Yaşam Tarzı Persona, İlk 90 Gün Planlayıcı, Öncelikli Taşınma Sorunu, İş Bulma Olasılığı) daha önce var olan 'Hızlı / Detaylı' mod seçimi tamamen kaldırıldı. Kullanıcı artık bir araca girince mod seçmeden doğrudan tek, sabit 20 sorudan oluşan akışa düşüyor (Banka Seçimi ve Sigorta Seçimi araçları zaten böyle çalışıyordu, deneyim buna hizalandı).",
      "Toplam soru sayısı 9 ile 18 arasında değişen 8 araca yeni sorular eklendi (en çok Expat Persona +10 ve Öncelikli Taşınma Sorunu +11 soru aldı) ki hepsi tam 20'ye tamamlansın; yeni sorular her aracın mevcut skorlama mantığına (örn. bütçe uyumu, kariyer/iş piyasası, dil, topluluk gibi boyutlara) ek sinyal olarak bağlandı — skorlama ağırlıkları/temel mantığı değişmedi, sadece daha zengin veriyle besleniyor.",
      "Diaspora Ağı Eşleştirme aracına 4 yeni soru (hedef ülkede tecrübe yılı, tercih edilen görüşme grup boyutu, ilgi alanları, yanıt hızı beklentisi) eklendiği için eşleşme profili veritabanı tablosuna da bu alanlar eklendi; eşleştirme kalitesi bu yeni sinyallerle biraz daha isabetli hale geldi.",
      "Teknik tarafta: hem veritabanı tarafındaki 9 aracın soru bankası + skorlama fonksiyonları hem de arayüz tarafındaki önizleme/test kodları güncellendi (106 otomatik test yeşil), veritabanı değişikliği canlıya uygulandı ve doğrulandı (her aracın tam 20 soru içerdiği teyit edildi). Kod deposuna gönderildi; arayüzdeki mod seçim ekranının kalkması için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    id: "20260701-statusreport3006-sade-sutun-yorum",
    date: "1 Temmuz 2026",
    title: "Durum raporu sayfasına (/statusreport3006) Burak için sade açıklama sütunu + her bölüme yorum alanı eklendi",
    items: [
      "Bir önceki gün eklenen Cadde 3.0 / premium panel durum raporu (corteqs.net/statusreport3006) yeniden düzenlendi. Önceki hali teknik bir insan için yazılmıştı; talep üzerine her satır artık İKİ SÜTUN: solda eski teknik açıklama aynen duruyor, sağda Burak gibi teknik olmayan birinin anlayacağı sade Türkçe karşılığı var. Sayfa daha geniş hale getirildi (iki sütun rahat sığsın diye); telefonda alt alta diziliyor.",
      "Her ana bölümün altına bir YORUM ALANI eklendi. Sayfaya giren herkes (siteye giriş yapmadan) adını yazıp o bölümle ilgili yorum bırakabiliyor; yorumlar veritabanında KALICI ve herkese görünür, böylece ortakla sayfa üzerinde yazışarak ilerlenebiliyor. Spam'e karşı basit bir hız freni ve uzunluk sınırı var.",
      "Teknik tarafta: yorumlar için yeni bir veritabanı tablosu + güvenli kayıt fonksiyonu (RPC) oluşturuldu ve canlıya uygulandı + doğrulandı. Güvenlik: kimse tabloya doğrudan yazamaz, yalnız kontrollü fonksiyon üzerinden yazılır (anonim isim girip yorum yazma bu fonksiyonla sınırlı). Sayfanın kendisi de artık gerçek bir uygulama sayfası (statik dosya değil).",
      "Yorum altyapısı şu anda canlıda çalışıyor; sayfanın yeni iki-sütunlu görünümünün corteqs.net'te görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
  {
    id: "20260701-almanya-araclari-7-yeni-tasinma-araci",
    date: "1 Temmuz 2026",
    title: "Taşınma Araçları'na Almanya'ya özel 7 yeni araç eklendi (banka, sigorta, maaş, vize, vatandaşlık testi, para transferi, StepStone)",
    items: [
      "Referans aldığımız 'almanya101' sitesindeki pratik araçlardan bizde OLMAYANLARI inceleyip CorteQS'in Taşınma Araçları bölümüne (/relocation/tools) ekledik. Mevcut 10 aracın yanına, isimlerinde '(Almanya)' etiketiyle 7 yeni kart geldi; eski araçların düzeni hiç değişmedi.",
      "Yeni araçlar: 1) Banka Seçimi — 20 soruyla Almanya'da sana en uygun 3 bankayı önerir. 2) Sigorta Seçimi — sigortalarını 'önce al / güçlü öneri / opsiyonel' diye önceliklendirir. 3) Maaş Hesaplama — brütten nete ve netten brüte 2026 hesabı (vergi sınıfı, eyalet, kilise vergisi, çocuk, sağlık sigortası). 4) Vize Seçimi — birkaç soruda hangi Almanya vizesine (Mavi Kart, Chancenkarte, Ausbildung vb.) uygun olduğunu söyler. 5) Vatandaşlık Testi — resmî BAMF havuzundan 469 soruyla Einbürgerungstest pratiği (3 mod: tüm sorular, gerçek deneme sınavı, eyalet soruları), her soru Almanca + Türkçe. 6) Para Transferi — Almanya'dan Türkiye'ye en avantajlı gönderim yöntemini ücret + kur sonrası eline geçecek TL'ye göre sıralar. 7) StepStone Maaş Karşılaştırma — maaşını StepStone 2026 raporu medyanlarıyla kıyaslar.",
      "Vatandaşlık testinin 469 sorusu (16 eyalet + genel havuz, görselli sorular dahil) referans sitenin kendi veritabanından çekilip bizim veritabanımıza yüklendi. Tüm araçların veritabanı kayıtları canlıya uygulandı ve doğrulandı (7 araç kartı + 469 soru + skor motorları + güvenlik kuralları aktif).",
      "Teknik not: araçlar mevcut Taşınma Araçları motoruyla uyumlu çalışıyor; hesaplama mantıkları test edildi (80 yeni otomatik test geçti). Maaş hesaplayıcı bilinen bir örnekte (brüt 4.000 € → net 2.617 €) gerçek Alman brutto-netto hesaplayıcılarıyla aynı sonucu verdi. Kartların kullanıcıya görünmesi için bir sonraki yayın (deploy) gerekiyor.",
    ],
  },
];
