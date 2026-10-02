// Ürün güncellemeleri — Ekim 2026 kayıtları (en yeniden eskiye).
// Tek kaynak barrel: ../admin-updates.ts — ekranlar oradan okur, buradan DEĞİL.

import type { AdminUpdateEntry } from "./types.ts";

export const ADMIN_UPDATES_2026_10: AdminUpdateEntry[] = [
  {
    id: "20261002-grup-dizini-yeni-dil",
    date: "2 Ekim 2026",
    title: "Grup dizininin yeni dili hazır — sahiplik rozetleri, “Yeni” etiketi, 0-100 skor (deploy kuyruğunda)",
    items: [
      "ROZET DİLİ DEĞİŞTİ: Kartlardaki “Admin onaylı!” / “Üye onaylı!” rozetleri kalktı. Yerine politikanın dili geldi: “Sahibi doğruladı” (gerçek admin ekledi ve kanıtladı), “Üye önerisi” (admin olmayan biri önerdi, sahiplenilmedi), “Yeni” (ilk 72 saat) ve “Onaylı Grup” (sağlık skoru 70+).",
      "“SKOR BEKLENİYOR” KUTUSU KALKTI: Skor hesaplanana kadar kartta skor alanı hiç gösterilmiyor (politika kuralı). Skor gelince 0-100 ölçeğinde “Grup Sağlık Skoru” olarak görünüyor — eski “X / 10” dili bitti.",
      "GİZLİ BİR KUSUR KAPATILDI: Yeni moderasyon motoru bir grubu gizlediğinde/askıya aldığında, dizinin okuduğu eski görünüm yalnızca eski onay alanına baktığı için grup SİTEDE GÖRÜNMEYE DEVAM EDERDİ. Dizin artık her iki sisteme de bakıyor: motor “gizli/askıda/kaldırıldı” dediyse grup anında dizinden düşüyor (canlıda ölçüldü).",
      "SIRALAMA SKORA BAĞLANDI: Gruplar sağlık skoruna göre diziliyor (skoru yüksek olan üste); skoru henüz hesaplanmamış gruplar sonda kalıyor. “Yeni” etiketinin 72 saat eşiği ayar tablosundan yönetiliyor, koda gömülü değil.",
      "FİLTRE VE KARTLAR ARTIK AYNI LİSTE: Kategori filtreleri ile kart rozetleri tek kaynaktan besleniyor — eskiden iki ayrı liste vardı ve birbirinden sessizce kayabilirdi.",
      "⚠️ EKRAN DEPLOY BEKLİYOR: Veritabanı tarafı canlıda ve doğrulandı; yeni kart/filtre görünümü frontend deploy kuyruğunda (form ile aynı). Eski paket deploy’a kadar mevcut diliyle çalışmaya devam eder — hiçbir sayfa kırılmaz (canlı dizin içeriği bugün birebir aynı kaldı, 10 grup).",
    ],
  },
  {
    id: "20261002-grup-ekleme-formu-yenilendi",
    date: "2 Ekim 2026",
    title: "Grup ekleme formu baştan yazıldı — link yapıştır, gerisi otomatik (deploy kuyruğunda)",
    items: [
      "YENİ FORM: Kullanıcı fiilen üç şey yazıyor: link, kısa açıklama (en fazla 160 karakter), şehir. Linki yapıştırınca sistem davet sayfasını SUNUCU tarafında okuyor — grup adı ve görseli otomatik doluyor, platform (WhatsApp/Telegram/Discord) linkten tanınıyor. Platform seçimi ve serbest metin ülke/şehir alanları KALDIRILDI; konum artık coğrafi katalogdan seçiliyor (Global gruplar için hedef ülke + 'Genel').",
      "AYNI GRUP İKİ KEZ EKLENEMEZ: Davet linkinin kodu tekilleştirme anahtarı. Link zaten listedeyse form 'Bu grup zaten listede — sahibi misin?' uyarısı veriyor. Eskiden aynı linkle onlarca kayıt açılabiliyordu.",
      "KARA LİSTE ÖN TARAMASI: 'Vize, oturum, garanti, sinyal, yatırım getirisi, kredi' gibi kelimeler geçen gönderimler OTOMATİK REDDEDİLMİYOR — yalnızca işaretleniyor ve hızlı şeritten geçemiyor. Karar moderatörün (liste ayar tablosunda, kodda sabit değil).",
      "HIZLI ŞERİT HAZIR (ŞU AN KAPALI): Yönetici, kendi grubunu eklerken 'adminiyim' derse ve şerit açıksa grup anında yayına çıkar — karar moderasyon kayıt defterine 'fast_lane' olarak düşer. Normal üyelerde 'adminiyim' beyanı grubu yayına çıkarmaz; sahiplik doğrulama kuyruğu açılır. Şeridi açma kararı insanındır (100 grup önerisi).",
      "GÜNDE 5 GÖNDERİM SINIRI + GRUP SÖZÜ: Spam koruması olarak kullanıcı başına 24 saatte en fazla 5 gönderim (ayarlardan değiştirilebilir). Form, politika metnindeki 'Grup Sözü' onay kutusu işaretlenmeden gönderilemiyor. Yasaklı kullanıcı (ihlal sistemi) formu açtığında uyarıyı görüyor.",
      "⚠️ EKRAN DEPLOY BEKLİYOR: Yeni form, dizin/detay sayfalarıyla aynı kuyrukta — Coolify deploy'undan sonra canlıya çıkar. Eski form deploy'a kadar çalışmaya devam eder (sunucu tarafı kapılar her iki yolu da koruyor). 'Aile & Çocuk' kategorisi doğrulama altyapısı (kurumsal seviye) gelene dek kilitli.",
    ],
  },
  {
    id: "20261002-grup-saglik-skoru",
    date: "2 Ekim 2026",
    title: "Grup sağlık skoru motoru kuruldu — “Onaylı Grup” rozeti otomatik hesaplanacak (ekranlar henüz yok)",
    items: [
      "SKOR NEDİR: Her grup için 0-100 arası bir sağlık skoru hesaplayan motor kuruldu. Kalem kalem: profil bilgileri dolu mu (15), grup kuralları yazılı mı (15), sahibi doğrulanmış mı ve onay kuyruğunu 48 saat içinde eritiyor mu (15), davet linki çalışıyor mu (15), kaç üye “bu gruptayım, tavsiye ederim” dedi (20’ye kadar), son 90 günde onaylanmış şikayet var mı (20).",
      "ROZET KURALI — GİDİP GELMESİN DİYE: Skor 70’e ulaşan grup “Onaylı Grup” rozetini kazanır; rozet ancak skor 65’İN ALTINA düşünce geri alınır. Aradaki bantta rozet yerinde kalır — grup bir gün var bir gün yok diye titremez.",
      "İLK 7 GÜN SKOR YOK: Yeni bir grup yayına çıkınca ilk 7 gün skor hesaplanmaz (boş kalır) — yeni grup “puanı düşük” diye cezalı görünmesin.",
      "TAVSİYE SİSTEMİ: Üyeler bir grup için “tavsiye ederim” diyebilecek; aynı kişi aynı grubu iki kez sayılmaz, tavsiyesini geri çekebilir. İlk 10 tavsiye skora puan olarak yansır, sonrası yansımaz (skor şişirilmesin).",
      "⚠️ EKRANLAR HENÜZ YOK: Bu da altyapı işi — skor kartlarda G19 (dizin), sahip panelinde G21, günlük otomatik hesap ise G22’de bağlanacak. Bugün canlıda hiçbir grubun skoru değişmedi; motorun bütün davranışı canlı veritabanında GERİ ALINAN bir işlemde 16 senaryoyla ölçüldü.",
      "SESSİZ BİR HATA BULUNDU VE KAPATILDI: Eski yönetici ekranı, bir grup kaydını her düzenleyip kaydettiğinde skor alanını sessizce SIFIRLIYORDU (kimse fark etmiyordu çünkü skorlar henüz boştu). Skor sistemi devreye girmeden önce bu davranış ölçüldü ve kapatıldı: skor artık yalnızca motorun kendisi tarafından yazılır; grup sahibi kendi skorunu elle yükseltemez.",
    ],
  },
  {
    id: "20261002-kariyer-sayfasi-ve-basvuru-sistemi",
    date: "2 Ekim 2026",
    title: "Kariyer sayfası baştan yazıldı — 17 ilan, başvuru formu ve yönetici ekranı artık çalışıyor",
    items: [
      "ÖZET: /kariyer sayfası eskiden yalnızca bir ilgi formuydu. Artık gerçek bir işe alım sayfası: 17 açık pozisyon, staj programı, kurucu mektupları ve dosya yükleyebilen bir başvuru formu var.",
      "ZİYARETÇİ NE GÖRÜYOR: İlanlar 5 alana göre süzülebiliyor (çiplere tıklayarak). Bir ilanda “Bu pozisyona başvur” denince seçim otomatik olarak alttaki forma taşınıyor ve sayfa oraya kayıyor. Her ilanın kendi bağlantısı var, yani tek bir ilanı doğrudan paylaşabilirsiniz.",
      "BAŞVURU FORMU: Ad, iletişim, pozisyon seçimi ve üç dosya — CV (zorunlu, en çok 10 MB), ön yazı ve sunum (en çok 25 MB). Dosyalar sürükle-bırak ile de yüklenebiliyor. KVKK onay kutusu BOŞ geliyor; kullanıcı işaretlemeden başvuru gönderilemiyor.",
      "ESKİ İLANLAR SİLİNMEDİ: Önceki dönemin 4 ilanı sayfanın altında “önceki dönem ilanı” rozetiyle duruyor ve onlardan gelen başvurular da aynı yeni sisteme düşüyor. Ne zaman kaldırılacağına ekip karar verecek — yeni ilanlar üzerinden en az bir tam başvuru dönemi geçtikten sonra.",
      "➡️ SİZDEN NE GEREKİYOR — BAŞVURULARI BURADAN OKUYUN: /admin/kadro → “Başvurular”. Yeni bir yönetici grubu açılmadı; mevcut kadro konsoluna 5. madde olarak eklendi. Adayın CV’si ve diğer dosyaları buradan açılıyor.",
      "E-POSTA BİLDİRİMİ AÇIK: Yeni başvuru geldiğinde kurucu ekibe anında mail gidiyor. Bu bildirim TÜM yöneticilere gider — ayrıca abone olmanıza gerek yok, istemeyen kapatır. Canlıda uçtan uca denendi: başvuru girildi, mail 3 saniyede gönderildi, deneme kaydı sonra silindi.",
      "⚠️ GÜVENLİK NOTU — CV’LER MAİLE KONMUYOR: Mailde yalnızca “yeni başvuru var” bilgisi ve adayın adı var; dosya bağlantısı YOK. Sebebi şu: maile gömülen bağlantı posta kutusunda süresiz durur ve o maili ilettiğiniz herkes adayın CV’sini açabilir. Dosyalar yalnızca panelden, 5 dakika geçerli özel bağlantıyla açılıyor.",
      "GELEN HAZIR PAKETTEKİ 3 HATA DÜZELTİLDİ: Dışarıdan gelen kurulum dosyası olduğu gibi çalıştırılsaydı sistem hiç kurulamayacaktı. Ayrıca yüklenen dosyanın adı hiç denetlenmiyordu ve “her türü kabul et” ayarı yüzünden depoya çalıştırılabilir dosya bile konabiliyordu. Üçü de kapatıldı ve canlıda 10 çağrıyla sınandı: izinsiz dosya türü, kural dışı dosya adı ve girişsiz okuma denemelerinin üçü de reddedildi.",
    ],
  },
  {
    id: "20261002-dijital-gruplar-motoru",
    date: "2 Ekim 2026",
    title: "Dijital Gruplar motoru kuruldu — doğrulama, moderasyon ve uyarı sistemi (ekranlar henüz yok)",
    items: [
      "NEDEN: Fikir şu — “Linkini saklama, kapını paylaş.” Ham WhatsApp davet linki ortalıkta dolaşmak yerine CorteQS grup sayfası paylaşılacak; katılmak isteyen kimliğini doğrulayacak, grup sahibi onaylayacak, spam kapıda kalacak.",
      "⚠️ EN ÖNEMLİ UYARI — PANELDE HENÜZ YENİ BİR EKRAN YOK: Bu hafta kurulan her şey arka plandadır. Grup onay kuyruğu, moderasyon ekranı ve bildirimler ayrı işler olarak sırada bekliyor. Yani panele girip “nerede bu?” diye aramayın; kurulan şey altyapı, henüz arayüz değil.",
      "SAHİPLİK DOĞRULAMA: Bir grubun gerçekten sizin olduğunuzu iki yoldan kanıtlayabileceğiniz sistem kuruldu — ya grup açıklamasına size verilen kodu yapıştırırsınız (sistem sayfayı kendisi okuyup kontrol eder) ya da ekran görüntüsü yüklersiniz. Kodlar tek kullanımlık; bir kişinin aynı anda tek açık talebi olabiliyor.",
      "DURUM MAKİNESİ VE KAYIT DEFTERİ: Bir grubun durumu (beklemede / yayında / askıda / kaldırıldı) artık rastgele değiştirilemiyor; yalnızca tanımlı geçişlere izin veriliyor ve her değişiklik kim-ne zaman-neden bilgisiyle kayda geçiyor. “Kaldırıldı” kalıcıdır, geri dönüşü yoktur.",
      "UYARI (STRIKE) SİSTEMİ: Kural ihlalinde kademeli ceza — 1. uyarı yalnızca uyarıdır, 2.’sinde grup 30 gün askıya alınır, 3.’sünde kaldırılır ve grubu EKLEYEN kişi yeni grup ekleyemez. Ağır ihlallerde (kırmızı çizgi) ilk seferde doğrudan kaldırma + yasak uygulanır. Yasaklı kişi hangi yoldan denerse denesin grup ekleyemiyor; yöneticiler bu kuraldan muaf.",
      "EŞİKLER KODDA DEĞİL AYARDA: Kaç uyarıda askı, kaç günlük askı, hangi ihlal kırmızı çizgi — hepsi bir ayar tablosunda duruyor. Yani bu kararları değiştirmek için yazılım güncellemesi gerekmiyor, ayar değişiyor. (Cadde’de aynı deseni kullanıyoruz.)",
      "GRUP SAYFASI GÖNDERİLERİ: Grup sayfalarına gönderi atılabilmesi için altyapı yazıldı. Doğrulanmış grup yöneticisinin ve güvenilir üyenin gönderisi doğrudan yayınlanıyor; diğerleri önce grup sahibinin onayına düşüyor. Sahip 48 saat içinde bakmazsa gönderi otomatik olarak platform kuyruğuna taşınıyor — yani onay beklerken sonsuza kadar asılı kalmıyor.",
      "TASARIM BELGESİNİN 5 VARSAYIMI ÖLÇÜLDÜ VE ÇÜRÜDÜ: Belge, var olduğunu sandığı 5 şeyin üzerine kuruluydu (yorum/beğeni tabloları, telefon doğrulama servisi, kurumsal güven seviyesi gibi). Canlıda ölçtük: hiçbiri yoktu. Varsayımla devam edilseydi çalışmayan bir sistem kurulacaktı; hepsi sıfırdan yazıldı.",
      "⛔ BLOKE OLAN İŞ — KARAR SİZDE: “Kurumsal doğrulama” adımı durduruldu. Sebep: katalog kayıtlarında ZATEN iki ayrı doğrulama alanı var ve ikisi de canlıda kullanılıyor; gelen tasarım üçüncü bir tane istiyor. Üçüncüsünü eklemek “doğrulanmış mı?” sorusunun üç ayrı cevabı olması demek. Hangisinin tek doğru kaynak olacağına karar verilmeden devam edilmeyecek.",
    ],
  },
  {
    id: "20261001-whatsapp-gruplari-guvenlik-acigi",
    date: "1 Ekim 2026",
    title: "⚠️ GÜVENLİK: WhatsApp grup sayfalarında iki açık bulundu ve kapatıldı",
    items: [
      "BİRİNCİ AÇIK — HERKES SINIRSIZ GRUP EKLEYEBİLİYORDU: Hesabı olmayan, giriş bile yapmamış biri sisteme istediği kadar grup kaydı ekleyebiliyordu. Dahası, kaydı BAŞKA BİR KULLANICININ üzerine yazabiliyordu. Günlük sınır da yoktu. Bu, kendiliğinden açık duran bir spam kapısıdır.",
      "DÜZELTİLDİ VE CANLIDA KANITLANDI: Girişsiz ekleme denemesi artık reddediliyor. Kendi adınıza ekleme çalışmaya devam ediyor (form bozulmadı), başkasının adına ekleme reddediliyor. Ayrıca aynı işi iki kez yapan 3 gereksiz kural temizlendi.",
      "İKİNCİ AÇIK — GRUP YÖNETİCİLERİNİN KİŞİSEL BİLGİLERİ HERKESE AÇIKTI: Beklenen sorun yalnızca davet linkiydi. Ölçünce daha ağırı çıktı: 10 grubun 10’unda da grup yöneticisinin ADI, E-POSTASI VE TELEFON NUMARASI giriş yapmamış herkese görünüyordu. Bu, planda yazılı değildi — ölçerek bulundu.",
      "DÜZELTİLDİ: Dizin ve grup detay sayfası artık kişisel bilgi taşımayan ayrı bir kaynaktan okuyor. Davet linki de kayıtla birlikte gelmiyor; yalnızca giriş yapmış kullanıcı istediğinde ayrıca veriliyor.",
      "KULLANICI NE GÖRÜYOR: “Katıl” düğmesi kaybolmuyor. Dört durumun dördünün de karşılığı var — link hazırsa gerçek bağlantı, giriş yoksa “Giriş yap ve katıl”, yükleniyorsa bekleme düğmesi, link yoksa sebebini yazan bir mesaj. (Eski kodda link gelmeyince düğme sessizce hiç çizilmiyordu; o tuzağa düşülmedi.)",
      "NOT: Bu iki açık canlıda uzun süredir açıktı. Kötüye kullanıldığına dair bir iz yok — ama kullanılabilirdi. İkisi de artık kapalı ve canlıda tek tek denenerek doğrulandı.",
    ],
  },
  {
    id: "20261001-yonetici-menusu-numaralari-ve-asistan",
    date: "1 Ekim 2026",
    title: "Yönetici menüsüne sıra numaraları geldi, asistan artık menüyü biliyor",
    items: [
      "NUMARALAR: Yönetici menüsündeki her maddenin artık sabit bir sıra numarası var (toplam 88 madde: 75 ana başlık, 13 alt madde). Amaç konuşmayı kolaylaştırmak — “şu ekrandaki üstten üçüncü” yerine numara söylenebiliyor. Numara tek bir yerden üretiliyor; kenar menü, komut paleti ve asistan aynı listeyi kullanıyor.",
      "ASİSTAN MENÜYÜ ÖĞRENDİ: Site asistanına menünün tamamı öğretildi (madde başına bir kayıt). Artık “X ekranı nerede?” diye sorabilirsiniz.",
      "⚠️ BU BİLGİ YALNIZCA YÖNETİCİYE AÇIK: Menü bilgisi, asistanın yönetici olduğunuzu doğruladığı durumda veriliyor; normal üye sorarsa erişemiyor. Ayrıca asistanın numara UYDURMASINI engelleyen bir fren kondu — bilmediği bir madde için numara icat edemiyor.",
      "SOHBETTEKİ BAĞLANTILAR ARTIK TIKLANABİLİR: Botun yanıtındaki site içi bağlantılar normal link gibi çalışıyor, dış bağlantılar yeni sekmede açılıyor. Zararlı olabilecek bağlantı türleri bilerek tıklanamaz hâlde (düz yazı olarak) gösteriliyor.",
      "SESSİZ BİR HATA DA YAKALANDI: Belgeler asistanın hafızasına yüklenirken, içinde emoji geçen bir belge parçası tam yanlış yerden bölünüyor ve kayıt sessizce düşüyordu (her 93 parçada 1). Onarıldı; ardından 93 parçanın 93’ü de sorunsuz yüklendi.",
    ],
  },
  {
    id: "20261001-tasinma-araclari-sirali-liste-gorseli",
    date: "1 Ekim 2026",
    title: "Taşınma araçlarında sıralı sonuç listesi okunur hâle getirildi",
    items: [
      "NE DEĞİŞTİ: Sonuç listesindeki her madde artık kendi renkli başlık şeridi olan bir kutu. Puan barları kalınlaştırıldı ve sayılar da bandın rengini aldı — hangi seçeneğin önde olduğu bir bakışta görünüyor.",
      "TALEP TEK ARAÇ İÇİN AÇILMIŞTI, DÖRDÜ BİRDEN GÜNCELLENDİ: Ölçtük — bu liste 4 aktif araçta kullanılıyor (ülke eşleştirme, şehir eşleştirme, Almanya banka seçimi, Almanya sigorta seçimi). Yalnızca birini değiştirmek, aynı listenin iki farklı görünüme sahip olması demekti.",
      "RENK TEK BAŞINA BİLGİ TAŞIMIYOR: Bandın Türkçe etiketi her zaman yazılı duruyor ve sayı her zaman görünüyor — renk göremeyen kullanıcı da sıralamayı okuyabiliyor. Puanı olmayan madde renk ALMIYOR; yoksa “0 puan” zayıf bir sonuç sanılırdı.",
    ],
  },
];
