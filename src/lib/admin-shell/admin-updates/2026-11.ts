// Ürün güncellemeleri — Kasım 2026 kayıtları (en yeniden eskiye).
// Tek kaynak barrel: ../admin-updates.ts — ekranlar oradan okur, buradan DEĞİL.

import type { AdminUpdateEntry } from "./types.ts";

export const ADMIN_UPDATES_2026_11: AdminUpdateEntry[] = [
  {
    id: "20261108-lansman-l0-plan-ve-tutarsizlik-raporu",
    date: "8 Kasım 2026",
    title: "1 Ocak lansman planı yerinde incelendi: 14 karar 9 Kasım'a, iş 22 küçük adıma bölündü",
    items: [
      "KISACA: Burak'ın 4 Kasım tarihli 1 Ocak lansman planı; canlı veritabanı, Lovable prototipi, Drive ekleri ve Ekim'de alınmış kararlarla karşılaştırıldı. Plan sağlam bir iskelet; ama bazı işlerin zaten yapılmış olduğunu ve Ekim'de verilmiş bazı kararları görmüyor. Sitede bugün değişen bir şey yok; bu adımda yalnız plan ve rapor yazıldı.",
      "EN ÖNEMLİ BULGULAR: (1) Fiyatlar üç belgede üç farklı şekilde yazıyor (5 Ekim kararı, 4 Kasım planı, Gelir Modeli tablosu). (2) Yeni rol yapısına geçiş sanıldığı kadar büyük değil: 180 üyenin 152'si bireysel, değişiklik yalnız 22 kişiyi etkiliyor. (3) Telefon doğrulama kodu yazılı ama sitede kapalı; Meta onayı bekliyor. (4) 'Canlı' sayılan İş İlanları'ndaki 6 ilanın hepsi örnek veri, Etkinlikler'de ise tek kayıt var. (5) 24 saat açık cafe ve Çarşı'daki 5 ilan sınırı zaten çalışıyor.",
      "DOĞRULAMADA ÇIKANLAR: Rapor ayrı bir denetçiyle yeniden ölçüldü ve 12 yeni nokta daha bulundu. En önemlileri: (1) Rol tablosundaki 'eski rol' sütunu gerçek rol kodlarını tutmuyor; Rol Talepleri işi önce doğru bir eşleme tablosuyla başlayacak. (2) Fiyat ayar dosyasında henüz hiç fiyat yok; fiyat sayfasında ise ayrıca bir '%50 indirim' yazısı duruyor. (3) Lovable'dan alınmayacak dediğimiz bir referans kodu (GGVBLA-M7SDSR) 19 Eylül'den beri Kurucu 1000 bölümünde duruyor; bizim kodumuz mu, Lovable kopyası mı, sorulacak. (4) Etkinlik formunda her zaman görünen 'admin onayı' yazısı Ekim kararıyla çelişiyor. Bu düzeltmeler planın başına işlendi.",
      "NASIL İLERLEYECEĞİZ: İş 22 küçük adıma (L0–L21) bölündü. Her adım bitince bu menüye sade bir özet yazılacak. Sıra: önce 9 Kasım kararları, sonra menü, ana sayfa, rol talepleri ve fiyat sayfası (ödemesiz); ardından Cadde, Çarşı, Evim-Evin ve ödeme; 21 Aralık'ta kod dondurma, 30 Aralık'ta son karar.",
      "SİZDEN BEKLENEN: 9 Kasım toplantısında 14 kararın kapanması (fiyat modeli, '+90 numaralar Pasaport alamaz' kuralı, etkinlik onayı, cafe süre ve kapasitesi, Çarşı açılışı ve diğerleri). Kapanmayan kararda önerilen varsayımla ilerlenecek. Ayrıca bekleyen yeniden yayınlama (Coolify) ve 🔴 anahtar yenileme (GB1) hâlâ en acil iki iş.",
      "BİLMENİZ GEREKEN: Burak'ın plan dokümanına dokunulmadı. Ayrıntılı plan, kanıtlarıyla birlikte proje deposundaki planlar ve denetimler klasörlerinde duruyor; Barış için ayrıca okunur bir özet doküman hazırlandı.",
    ],
  },
  {
    id: "20261107-olu-kod-ve-bicim-temizligi",
    date: "7 Kasım 2026",
    title: "Gece sonu: kullanılmayan sohbet kodu silindi, para ve tarih gösterimleri tek yerde",
    items: [
      "KISACA: Üyeye görünen bir değişiklik yok; kod sadeleşti. Kullanılmayan eski kayıt sohbeti silindi, para ve tarih gösterimlerinin kopyaları tek yerde toplandı. Ekranlardaki biçim aynen korundu: eski ve yeni gösterim 3 saat diliminde binlerce örnekle karşılaştırıldı, fark çıkmadı.",
      "KULLANILMAYAN KOD: Önceki güncellemede belirttiğimiz gibi eski kayıt sohbetini hiçbir ekran kullanmıyordu; silindi (binden fazla satır). Sitedeki sohbet asistanı aynen çalışıyor. Silmeden önce hiçbir planın bu kodu geri getirmeyi beklemediği kontrol edildi.",
      "CADDE: Cadde ekranlarındaki tarih gösterimlerine dokunmadan önce bugünkü görünümü kilitleyen testler yazıldı, ardından ortak yere bağlandı.",
      "DENETİM: Her iş bağımsız bir denetçiden ve bilerek bozma denemelerinden geçti; tüm otomatik kontroller yeşil (4.465 test). Değişiklikler ana dala alındı.",
      "SİZDEN BEKLENEN: (1) Sitenin Coolify'dan yeniden yayına alınması — gece turundaki düzeltmeler (sahte ödeme ekranları, etkinlik uyarıları, arama) ancak o zaman üyelere görünür. (2) 🔴 Anahtar yenileme işi (GB1) hâlâ en acil iş.",
    ],
  },
  {
    id: "20261107-gece-turu-son-durum",
    date: "7 Kasım 2026",
    title: "Gece turu tamamlandı: tüm değişiklikler denetlendi ve kayda alındı",
    items: [
      "KISACA: Gece turundaki bütün değişiklikler iki tur bağımsız denetimden geçti, tüm otomatik kontroller yeşil (4.416 test), her konu ayrı kayıt (commit) olarak saklandı. Hâlâ YAYINDA DEĞİL: iki çalışma dalının ana dala alınması ve sitenin yeniden yayına alınması gerekiyor.",
      "SON DENETİMDEN ÇIKAN EK DÜZELTMELER: (1) Yönetici panelindeki tarih gösterimleri, sekme açıkken bilgisayarın saat dilimi değişirse (yolculuk) eski dilimde kalabiliyordu — giderildi, test kilitliyor. (2) Etkinlik formundaki saat uyarısı ekran okuyucular tarafından da duyurulacak biçimde düzenlendi. (3) Hastane sayfasındaki 'online randevu alın' vaadi kaldırıldı; sayfa artık 'örnek hastanelerle deneyin' diyor, demo uyarısını sayfanın üstündeki band gösteriyor.",
      "KAYITLAR (6 konu, ayrı ayrı): sahte ödeme ekranı · demo hastane sayfası · etkinlik saat uyarısı ve 13 saat dilimi · kayıt sohbeti (kullanılmayan kod olduğu not edildi) · yönetici paneli tarih biçimleri · iş listesi (KALANLAR).",
      "İŞ LİSTESİNE YENİ EKLENENLER: kullanılmayan kayıt sohbeti kodunun silinmesi · hastane sayfasının bağlantı hatası ve dernek sayfalarındaki 'online randevu' metinleri (karar bekliyor) · iş ilanı detay sayfalarına demo bandı (karar bekliyor).",
      "SİZDEN BEKLENEN: (1) İki çalışma dalının ana dala alınması (onay bekliyor) ve ardından sitenin Coolify'dan yeniden yayına alınması — bu turun düzeltmeleri ancak o zaman üyelere görünür. (2) 🔴 Anahtar yenileme işi (GB1) hâlâ en acil iş; kapsamı bu gece bir maddeyle genişledi, ayrıntı yalnız plan dosyasında.",
    ],
  },
  {
    id: "20261107-duzeltme-ve-ara-durum",
    date: "7 Kasım 2026",
    title: "Düzeltme ve ara durum: bir önceki güncellemedeki iki ifade düzeltildi",
    items: [
      "KISACA: Bir önceki güncellemedeki ('sahte ödeme ekranları ve etkinlik saat uyarısı') iki ifade bağımsız denetimde yanlış ya da eksik çıktı; aşağıda düzeltiyoruz. Değişiklikler hâlâ yayında değil.",
      "DÜZELTME 1 — KAYIT ASİSTANI: 'Komutlar artık tanınıyor' demiştik; bu YANLIŞTI. Düzeltilen kod sitede hiçbir ekrandan çalışmıyor: sitedeki sohbet asistanı (ana sayfa ve her sayfadaki balon) bu komutları hiç kullanmıyor, eski kayıt sohbeti artık kullanılmayan kod. Üyeler için değişen bir şey yok. Kullanılmayan kodun silinmesi ayrı iş olarak listeye alınacak.",
      "DÜZELTME 2 — HİZMET TALEBİ FORMU: Sahte kart ekranı kaldırılmıştı ama talep gönderilince çıkan bildirim hâlâ 'Ödeme alındı' diyordu. Düzeltildi: artık 'Talep oluşturuldu! 🎉' diyor; formu gerçekten dolduran ve gönderen yeni bir test bunu kilitliyor. Ayrıca ölçüldü: eski sahte kart ekranına yalnız test hesapları değil, sıradan üyeler de ulaşabiliyordu (Premium profil düzeni çoğu bireysel rolde açık).",
      "EK DÜZELTMELER: Hastane randevu sayfasının başlığı hâlâ 'kolayca online randevu alın' diyordu; artık örnek hastanelerle bir deneme olduğunu söylüyor, kart düğmesi 'Demo randevu al' oldu. Eski sahte ödeme rehberleri (docs/stripe) 'güncel değil' olarak işaretlendi; asistanın bilgi tabanından da çıkacaklar.",
      "DENETİM: 25 bağımsız denetçi değişiklikleri bozmaya çalıştı; 34 bulgudan 2'si gerçek çıktı (yukarıdaki iki düzeltme). Testlerin hatayı yakalayıp yakalamadığı 12 ayrı bozma denemesiyle sınandı, 12'si de yakalandı. Düzeltmelerin ikinci denetimi şu an sürüyor.",
      "KARARINIZI BEKLEYEN (yeni): Dernek detay sayfası hâlâ 'Online randevu sistemi' ve 'Online Randevu Al' diyor; bağlantı örnek hastane sayfasına gidiyor. Dernek sayfalarıyla ilgili açık kararın parçası olduğu için dokunulmadı.",
      "SONRAKİ ADIM: İkinci denetim bitince tüm otomatik kontroller koşulacak, her konu ayrı kayıt (commit) olarak saklanacak ve son durum ayrıca bildirilecek. 🔴 Anahtar yenileme işi (GB1) hâlâ en acil iş.",
    ],
  },
  {
    id: "20261107-sahte-odeme-ve-etkinlik-uyarilari",
    date: "7 Kasım 2026",
    title: "Gece turu: iki ekranda sahte ödeme kaldırıldı, etkinlik formuna saat uyarısı geldi",
    items: [
      "KISACA: Üyeyi yanıltabilecek iki 'ödeme' ekranı dürüst hâle getirildi, etkinlik formu yanlış girilen saatleri artık fark ediyor. Değişiklikler HENÜZ YAYINDA DEĞİL: şu an bağımsız denetimden geçiyor; ana dala alınıp site yeniden yayına alınınca üyelere görünür.",
      "HİZMET TALEBİ FORMU: Form gerçek bir talep kaydediyordu ama araya sahte bir kart ödeme ekranı koyup sonunda 'Ödeme Başarılı' diyordu; oysa hiç ödeme alınmıyordu ve üye oraya gerçek kartını yazabilirdi. Sahte ekran kaldırıldı: düğme artık 'Talebi Gönder', ücret satırında 'şu an ücret alınmıyor' yazıyor.",
      "HASTANE RANDEVUSU SAYFASI: Örnek verilerle çalışan bu sayfa kart numarası, son kullanma tarihi ve CVV istiyor, sonunda '✅ Randevu Oluşturuldu!' diyordu. Kart alanları tamamen kaldırıldı, düğme 'Demo randevuyu tamamla' oldu, bildirim 'gerçek randevu oluşturulmadı, ödeme alınmadı' diyor ve sayfanın üstünde artık 'Demo sayfa' bandı çıkıyor.",
      "ETKİNLİK FORMU: Bitiş saati başlangıçtan önce girilirse (ör. 22:00–01:00) 'etkinlik gece yarısını aşıp ertesi gün bitecek' uyarısı, iki saat aynı girilirse '24 saat sürecek' uyarısı çıkıyor. Eskiden yanlış yazılan saat sessizce 23–24 saatlik etkinliğe dönüşüyordu. Uyarı göndermeyi engellemez. Saat dilimi listesine 13 yer eklendi: Belgrad, Üsküp, Saraybosna, Zagreb, Tiran, Tallinn, Riga, Vilnius, Lüksemburg, Malta, Detroit, Phoenix, Melbourne.",
      "KAYIT ASİSTANI: Sohbetli kayıtta 'İPTAL', 'SIFIRLA' gibi büyük harfli ya da 'gec', 'sifirla' gibi Türkçe karaktersiz yazılan komutlar tanınmıyordu; artık tanınıyor.",
      "TEMİZLİK: Yönetici panelindeki yorum, geri bildirim, bildirim ayarları ve radar ekranlarında aynı tarihi biçimleyen 6 kopya tek yerde toplandı. Ekranda değişiklik yok; eski ve yeni biçim 3 saat diliminde 2.876 örnekle karşılaştırıldı, fark çıkmadı.",
      "KARARINIZI BEKLEYENLER: (1) Hastane randevu sayfası, dernek sayfasındaki 'Randevu Al' bağlantısından gelen hastaneyi tanımıyor (bağlantı adı ile sayfanın beklediği ad farklı), her seferinde genel listeye düşüyor; düzeltmek davranışı değiştireceği için onayınızı bekliyor. (2) İş İlanı detay sayfaları da artık 'Demo' bandı alabilir — ilanların 6/6'sı örnek; isterseniz eklenir.",
      "SİZDEN BEKLENEN: Denetim bitince değişikliklerin ana dala alınması ve sitenin Coolify'dan yeniden yayına alınması. 🔴 Önceki güncellemelerdeki anahtar yenileme işi (GB1) hâlâ en acil iş.",
    ],
  },
  {
    id: "20261107-kopya-kod-tekillestirme",
    date: "7 Kasım 2026",
    title: "Akşam turu: kopya kod parçaları tek yerde toplandı, bu sırada üç hata bulunup düzeltildi",
    items: [
      "KISACA: Kodda aynı işi yapan kopya parçalar tek yere toplandı; bunu yaparken üç gerçek hata ortaya çıktı ve düzeltildi. Değişiklikler HENÜZ YAYINDA DEĞİL — ayrı bir dalda (clean-code/w3-tekillestirme) bekliyor; ana dala alınıp site yeniden yayına alınınca üyelere görünür.",
      "DÜZELTİLEN HATA — WHATSAPP GRUP SAYFALARI: Adında büyük 'İ' olan yeni gruplar bozuk sayfa adresi alıyordu ('İstanbul Türkleri' → …/i-stanbul-turkleri). Artık …/istanbul-turkleri. Aynı hata anket formunun adres önerisinde de vardı. Mevcut grupların adresleri DEĞİŞMEDİ — paylaşılmış bağlantılar kırılmaz; düzeltme yalnız yeni eklenenlere uygulanır.",
      "DÜZELTİLEN HATA — BEYİN FIRTINASI: Başlığında 'ı' olan yeni bölümler bozuk anahtar alıyordu ('Kış Okulu' → k-s-okulu). Düzeltildi; mevcut bölümler etkilenmez.",
      "DÜZELTİLEN HATA — İŞ BULMA OLASILIĞI ARACI: 'LinkedIn profilin ne kadar uygun? (1 = düşük, 5 = yüksek)' sorusunda ekrandaki önizleme puanı, veritabanının hesapladığından farklıydı (1 seçene ekranda 0,2, veritabanında 0). Ekran artık veritabanıyla aynı hesaplıyor. Canlı veritabanındaki hesap ayrıca ölçülmedi; ölçüm onayınızı bekleyen işler arasında (CO01).",
      "TEMİZLİK: Göç araçlarının (ülke, şehir, maaş, kariyer, iş bulma, hazırlık) puan hesabındaki 17 kopya yardımcı tek yerde toplandı. Ayrıca oturumdaki kullanıcıyı bulan 5 kopya, sayfa adresi üreten 7 ayrı kod ve 4 yükleme göstergesi tekleştirildi. Görünen tek fark: yönetici panelinde Muhasebe, Radar, Servis Bulucu ve Taşınma sayfaları açılırken ortadaki 'Yükleniyor...' yazısı yerine panelin geri kalanındaki gibi gri yükleme kutuları görünür.",
      "GÜVENCE: Her adım otomatik testle korundu. Ayrı bir denetçi, değişiklikleri bilerek bozmayı iki tur denedi ve bozamadı; eski ve yeni adres üreticileri 34 binden fazla örnekle karşılaştırıldı. Puan hesabında daha önce hiçbir testin korumadığı 28 nokta artık testle kilitli. Tüm kontroller yeşil (4.344 test).",
      "BİLEREK YAPILMAYANLAR: Planda 'kopya' sayılan bazı parçalar ölçülünce aslında farklı çıktı. Referans kodu düzenleyicilerini birleştirmek, referans kodu boş bırakılan kayıt formunu bozardı — dokunulmadı. Tarih gösterimleri de '14 kopya' değil, en az 8 farklı biçim; ayrı bir turda ele alınacak. Ayrıntı: KALANLAR dosyası, CC3 satırı.",
      "SİZDEN BEKLENEN: (1) Bu dalın ana dala alınması ve sitenin Coolify'dan yeniden yayına alınması. (2) Önceki güncellemedeki 🔴 anahtar yenileme işi (GB1) hâlâ en acil iş.",
    ],
  },
  {
    id: "20261107-genel-temizlik-ve-guvenlik",
    date: "7 Kasım 2026",
    title:
      "Büyük temizlik günü: bir güvenlik sızıntısı kapandı, otomatik kontroller 1 aydır ilk kez çalışıyor, dokümanlar toparlandı",
    items: [
      "KISACA: Projenin kodu ve dokümanları baştan sona elden geçirildi. Üç önemli sonuç var: (1) sitedeki yapay zekâ asistanı üyelere göstermemesi gereken iç dokümanları gösteriyordu, kapatıldı; (2) her değişiklikte koşması gereken otomatik kontroller 4 Ekim'den beri hiç çalışmıyordu, yeniden çalışıyor; (3) ülke/şehir seçicilerde 'istanbul' yazınca 'İstanbul' bulunmuyordu, düzeltildi.",
      "GÜVENLİK — ASİSTAN: Site asistanı, 'rehberler' klasöründeki 19 dokümanın hepsini üyelere açıyordu; aralarında başında 'üyelere gösterilmez' yazan iki taslak ve iç teknik rehberler vardı. Artık üyeye yalnız açıkça onaylanmış 1 rehber gidiyor (Belgelerimi Nereye Yüklerim). Eski/arşiv dokümanları da asistandan çıkarıldı; asistan artık bayat bilgiyle cevap vermiyor. Bu değişiklik canlıda uygulandı.",
      "GÜVENLİK — 🔴 SİZİN ACİL İŞİNİZ: Hesap sahibinin yapması gereken, ertelenmemesi gereken bir anahtar yenileme işi var (KALANLAR'da GB1). Ayrıntı bilerek buraya yazılmadı; hazır adım adım plan: docs/plans/2026-10-06-gb1-secret-rotasyonu-plani.md.",
      "OTOMATİK KONTROLLER: Her değişiklikte koşan kalite kontrolü (yazım, test, derleme) 4 Ekim'den beri ilk adımda takılıyordu — yani bir ay boyunca hiçbir değişiklik otomatik denetlenmedi. Neden bulundu ve düzeltildi; bugün iki kez üst üste tamamen yeşil geçti. Ayrıca yeni kontroller eklendi: kod biçimi, kullanılmayan paketler, aşırı karmaşık kod ve doküman düzeni.",
      "DÜZELTİLEN HATALAR: Ülke/şehir seçicide büyük 'İ' ile başlayan yerler küçük harfle aranınca bulunmuyordu (İstanbul, İzmir); Łódź, København gibi Avrupa şehirleri de aksansız yazılınca bulunmuyordu. Yönetici panelindeki etkinlik ve revizyon aramalarında aynı sorun vardı. Lansman listesindeki baş harfler Türkçe kurala uymuyordu (ilker → I yerine İ). Hepsi düzeltildi. Kullanılmayan 16 yazılım paketi kaldırıldı.",
      "İŞARETLER: İş İlanları sayfasındaki 6 ilanın 6'sı da örnek; sayfaya artık 'Demo' bandı çıkıyor. Cadde gönderilerinin genel aramada görünmemesi kararı (6 Ekim) kodda da tamamlandı.",
      "DOKÜMANLAR: 36 kopya doküman silindi, 25 dosyadaki bozuk bağlantı onarıldı. Kalan işler listesi (KALANLAR) 1 Ekim'den beri güncellenmemişti; sonradan yazılan planlardaki 27 açık iş geri alındı. 85 plan dosyasına 'aktif / tamamlandı / yerini başkası aldı' işareti kondu. Ajan kurallar dosyası (CLAUDE.md) bayat rakamlardan arındırıldı.",
      "SİZDEN BEKLENEN: (1) 🔴 Yukarıdaki anahtar yenileme işi. (2) Sitenin yeni sürümünü Coolify'dan yayına almak — arama düzeltmeleri ancak yayına alınınca üyelere görünür. (3) Karar bekleyen maddeler KALANLAR dosyasında §1.9 başlığı altında toplandı (beş güvenlik kapısı, eksik migration kayıtları, WhatsApp bağlantı adresi vb.). Ayrıntılı devir notu: docs/handover/2026-11-07-clean-code-devir-notu.md",
    ],
  },
];
