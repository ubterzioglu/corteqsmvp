// Admin "Yapılacaklar" listesi — insan eli gerektiren (soft) operasyon işlerinin tek kaynağı.
// Durum Raporu sayfasındaki Yapılacaklar kartı buradan beslenir; her madde ilgili ekrana
// giden aksiyon butonları taşır. Tamamlandı işareti KİŞİSEL ve tarayıcı-yereldir
// (localStorage, AdminTodoListCard) — updates-seen ile aynı desen; ekipçe ortak durum
// gerekirse revision_requests benzeri bir tabloya taşınır (bilinçli sadelik).
//
// Yeni madde eklerken: id benzersiz (YYYYMMDD-slug), aksiyonlarda iç rota için `to`,
// uygulama dışı statik dosya/harici bağlantı için `href` kullan (ikisinden yalnız biri).

export type AdminTodoAction = {
  label: string;
  /** Uygulama içi rota (react-router Link). */
  to?: string;
  /** Statik dosya ya da harici bağlantı (yeni sekmede açılır). */
  href?: string;
};

export type AdminTodoEntry = {
  /** Benzersiz kimlik — tamamlandı takibi bu id ile yapılır. Format: YYYYMMDD-slug. */
  id: string;
  title: string;
  description: string;
  priority: "kritik" | "normal";
  actions: AdminTodoAction[];
};

export const ADMIN_TODOS: AdminTodoEntry[] = [
  {
    id: "20260805-cadde-profil-konum-serbest-metin",
    title: "Profil formu ile Cadde katalogu AYRI listeler — konum eşleşmesi bu yüzden kopuyor",
    description:
      "ÇÖZÜLEN KISIM (canlıda, doğrulandı): hedef eşleşmesi artık aksan/harf-durumu duyarsız (migration 20260805130000, cadde_fold_text), profil konum verisinin bir kısmı onarıldı (20260805140000: 4 ülke + 4 şehir eklendi, 21 ülke + 3 şehir değeri düzeltildi) ve katalog temizlendi (20260804190000: 10 şehir adı düzeldi, mükerrer Roma silindi, Vancouver Kanada'ya bağlandı). Paylaşabilen üye 42'den 104'e çıktı. ÇÜRÜTÜLDÜ (5 Ağustos akşamı ölçüldü): 'profil formu hâlâ serbest metin' TEŞHİSİ YANLIŞTI. Form zaten seçim listesi kullanıyor (ProfilePage.tsx:1610, SearchableCountrySelect/SearchableCitySelect). KALAN GERÇEK İŞ BAŞKA: form ile Cadde AYRI KATALOGLARDAN besleniyor — form geo_countries (251) / geo_cities (76.990) sunuyor, Cadde cadde_countries (22) / cadde_cities (54) ile eşleştiriyor. Üye geçerli bir şehir seçiyor ('München'), Cadde katalogunda karşılığı yok ('Münih'), eşleşme kopuyor. Tekrarı önleyen şey formu 'seçim listesine çevirmek' değil, İKİ LİSTEYİ UZLAŞTIRMAK. ÖLÇÜM (5 Ağustos, canlı, 126 profil): 17 üyenin ülkesi, 20 üyenin şehri katalogda karşılıksız (München/Münih, Böblingen, 'Düsseldorf/Grevenbroich' tek alanda iki şehir, Çankaya=Ankara ilçesi, 15 WhatsApp toplu-import kaydı 'Belirtilmedi'). Bunların çoğu bugün zarar görmüyor: konumu çözülemeyen 44 üye emniyet supabı sayesinde tüm postları görüyor. TEK İSTİSNA — cenkkarakuz@gmail.com: ülke alanına da şehir alanına da 'vancouver' yazmış, yani ŞEHRİ çözülüyor (Kanada/Vancouver) ama ÜLKESİ çözülmüyor. Emniyet supabı sadece 'ne ülke ne şehir çözülüyor' durumunda devreye girdiği için bu hesap kapalı kalıyor ve akışta 0 post görüyor — 156 üye içinde boş akış gören tek hesap. Pratik etkisi bugün sıfır: hesap bugüne kadar HİÇ giriş yapmamış. Düzeltmek tek satır (ülke alanını 'Kanada' yap; çıkarım şehirden geliyor, telefon kodundan DEĞİL) ama üye verisine dokunmak karar ister. YAPILMAYACAK: telefon ülke kodundan ülke çıkarımı — bu üründe sistematik olarak yanıltır, +90 numaralı bir diaspora üyesi Berlin'de yaşıyor olabilir. YAPILACAK: iki katalogu uzlaştır — köprü kolonları ZATEN VAR ve kısmen dolu (cadde_countries.geo_country_id 18/22, cadde_cities.geo_city_id 49/54; eksik 9 satırın hepsi 20260805140000'de elle eklenen kayıtlar). AÇIKTA KALAN DEĞERLER (5 Ağustos akşamı, distinct ölçüm): şehirde 68 farklı değerin 60'ı, ülkede 29'un 26'sı çözülüyor. Çözülmeyenlerin kütlesi katalog boşluğu DEĞİL: 'Belirtilmedi' 14 ülke + 13 şehir kaydı ve bunlar WhatsApp bot kayıt akışından gelen ESKİ VERİ (arşiv yedeklerinde 'register / WhatsApp Bot / @wa.local' satırları; bugün hiçbir kod bu değeri yazmıyor). Gerçek katalog boşluğu yalnız 4 üye: München, Böblingen, Çankaya (Ankara ilçesi), 'Düsseldorf/Grevenbroich'. Çöp değer 4 üye: Mb, Vanuu, a, De. Yani iş, sanıldığı gibi form yeniden yazımı değil; 9 köprü satırı + 1 şehir ekleme + ~8 kaydın onarımı. YAPISAL NOT: emniyet supabının 'ülkesi çözülmeyen ama şehri çözülen' durumu kapsamaması ayrı bir tasarım sorusu.",
    priority: "normal",
    actions: [
      { label: "Cadde'yi Aç", to: "/cadde" },
      { label: "İş Panosunu Aç", to: "/admin/workshop/cadde" },
    ],
  },
  {
    id: "20260731-hos-geldin-anahtarini-ac",
    title: "Hoş geldin mailini yayına al",
    description:
      "Bildirim Ayarları'ndan kendine örnek hoş geldin maili gönder, Gmail/Outlook'ta gerçek görünümü kontrol et; beğendiysen 'Üyeye hoş geldin maili' anahtarını aç. DİKKAT: anahtar kapalıyken kaydolan üyeler bu maili hiç almaz ve sonradan telafi edilmez — geciktikçe mailsiz üye birikir.",
    priority: "kritik",
    actions: [{ label: "Bildirim Ayarları'nı Aç", to: "/admin/notifications" }],
  },
  {
    id: "20260731-loginli-qa-turu",
    title: "Login'li QA turu — kapsam Cadde redesign ile büyüdü (~45-60 dk)",
    description:
      "F1-F23 Cadde redesign batch'leri bittiği için kapsam genişledi. Eski kalemler: @mention bildirimi, korumalı markayla cafe açınca 'Parodi' önerisi, telefonda hero metni, ABD şehir filtresi · Hazırlık testi sonunda buton tıklanması, 'Hangi Şehir'e UK yazınca şehir dönmesi · Referral: profilde kod girip '✓ Doğrulandı' kilidi. YENİ (2 Ağustos): tepki seti (5 emoji, popover yok), yorum panelinde Enter ile gönderme + sessiz yenileme, Paylaş butonu (Web Share/kopyalama), composer'da konum default'unun kendi profilinden gelmesi, +1 hedef ülke/şehir seçimi, emoji picker, koyu palet genel görünüm · Komuta Merkezi: 'Tamamlanan Görevler' akordiyonunun açılıp kapanması ve aksiyonların çalışması.",
    priority: "normal",
    actions: [
      { label: "Cadde'yi Aç", to: "/cadde" },
      { label: "Hazırlık Testi", to: "/tools/tasinma-hazirlik-skoru" },
      { label: "Hangi Şehir Testi", to: "/tools/sehir-eslestirme" },
      { label: "Profilim", to: "/profile" },
      { label: "Referral Yönetimi", to: "/admin/referral" },
      { label: "Komuta Merkezi", to: "/admin/workspace/command-center" },
    ],
  },
  {
    id: "20260731-pano-yapildi-cevirisi",
    title: "QA bitince revizyon panosunu 'yapıldı'ya çevirt",
    description:
      "2 Ağustos'taki F1-F23 batch'leri bittikten sonra pano hazır madde sayısı 44'e çıktı (m1-m47 arası, birkaç boşluk hariç) — hepsi 'inceleniyor' durumunda bekliyor: kodları canlıda ama henüz gözle doğrulanmadıkları için bilinçli olarak 'yapıldı' denmedi. Login'li QA turunu bitirince Claude'a 'panoyu çevir' demen yeterli; her maddede hangi değişikliğin karşıladığını anlatan kanıt yorumu zaten var.",
    priority: "normal",
    actions: [{ label: "Revizyon Panosu", to: "/admin/revision-requests" }],
  },
  {
    id: "20260802-sonuc-cta-karari",
    title: "Taşınma araçları sonuç butonları: gerçek link mi, 'Yakında' mı?",
    description:
      "30 Temmuz'da tüm araçların sonuç ekranındaki yönlendirme butonları gerçek linke çevrilmişti. 2 Ağustos'taki meslek/maaş güncellemesiyle aynı commit'te bu butonlar (Tekrar Çöz hariç) sessizce yeniden 'Yakında' rozetiyle kilitlendi — hem meslek/maaş hem diğer 9 araç için, çünkü bileşen paylaşımlı. Bilinçli bir geri alma mı yoksa istemeden mi oldu belli değil; hangisi doğruysa ona göre ya butonlar tekrar açılmalı ya da bu kayıt kapatılmalı.",
    priority: "normal",
    actions: [{ label: "Bir Aracı Dene", to: "/tools" }],
  },
  {
    id: "20260802-supabase-custom-domain-google-ekrani",
    title: "Google giriş ekranındaki çirkin adresi düzelt (Custom Domain)",
    description:
      "Google ile giriş yapan üyeler onay ekranında 'injprdrsklkxgnaiixzh.supabase.co uygulamasında oturum açın' görüyor — güven vermiyor. Kalıcı çözüm plan olarak hazır: Supabase'de Custom Domain add-on'unu aç, bir alt domain bağla (öneri: auth.corteqs.net — henüz KARARLAŞTIRILMADI), Google Cloud Console'a yeni callback URI ekle, sonunda Coolify'daki VITE_SUPABASE_URL'i yeni domaine çevirip deploy et. Kod tarafında değişiklik gerekmiyor. Tam adım listesi ve kim-ne-yapar tablosu docs/operations/2026-08-02-supabase-custom-domain-google-oauth.md dosyasında — henüz hiçbir adım başlamadı, add-on bile açılmadı.",
    priority: "normal",
    actions: [
      {
        label: "Supabase Dashboard'ı Aç",
        href: "https://supabase.com/dashboard/project/injprdrsklkxgnaiixzh",
      },
    ],
  },
  {
    id: "20260731-ilk-1800-ozetini-dogrula",
    title: "İlk 18:00 günlük özetini doğrula",
    description:
      "Panel güncellemeleri artık anlık tekil mail yerine günde tek özet olarak gidiyor (18:00-18:15 Berlin). Bir sonraki güncelleme kaydı girildiği gün saat 18:00'den sonra gelen kutunu kontrol et: TEK birleşik mail gelmeli. Acil duyuru gerekirse Bildirim Ayarları'ndaki 'Şimdi gönder' erken boşaltır (yine tek özet).",
    priority: "normal",
    actions: [{ label: "Bildirim Ayarları'nı Aç", to: "/admin/notifications" }],
  },
];
