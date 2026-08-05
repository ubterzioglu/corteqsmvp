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
    id: "20260805-cadde-acilis-duzeltme-sql",
    title: "Cadde açılış düzeltme SQL'i bekliyor — 6 üye boş akış görüyor",
    description:
      "Çalıştırılacak dosya: docs/operations/2026-08-05-cadde-acilis-duzeltme.sql (psql -f ile, Türkçe karakterler -c'den geçmez). İki eksiği kapatır. (1) Migration 20260805120000 (izleyici geo köprüsü) canlıda ÇALIŞTI — cadde_resolve_viewer_location fonksiyonu yerinde — ama supabase_migrations.schema_migrations kaydı yazılmadı; kayıt olmadan `npm run check:migrations` sonsuza dek 'uygulanmamış' der. Bu repoda üçüncü kez oluyor (18 Temmuz, 20 Temmuz, şimdi): tablo/fonksiyon varlığı migration kaydı olduğu anlamına GELMEZ. (2) Global yönlendirme postları 4 ülkeyi hedeflemiyor. Sıra sorunu: açılış script'i çalıştığında katalogda 18 aktif ülke vardı ve 4 global posta 18'er hedef yazıldı; ardından backfill 4 ülke daha ekledi (Güney Afrika, İtalya, Moldova, Suudi Arabistan). O ülkelerdeki üyelerin konumu artık çözülüyor — yani 'konumu çözülemeyen herkese her şeyi göster' emniyet supabı devreye girmiyor — ama hiçbir post onları hedeflemiyor, akış boş kalıyor. ÖLÇÜM (5 Ağustos, canlı): 22 aktif ülke, 82 hedef satırı, hedeflenmemiş ülke 4, boş akış gören üye 6. YAPISAL NOT: 'global post' bugün N adet hedef satırıyla, yani bir ANLIK GÖRÜNTÜYLE ifade ediliyor; katalog trigger'la büyüdükçe bu her yeni ülkede yeniden bayatlayacak. Kalıcı çözüm 'global'i sayım yerine ÖZELLİK olarak ifade etmek — ayrı karar.",
    priority: "kritik",
    actions: [
      { label: "Cadde'yi Aç", to: "/cadde" },
      { label: "İş Panosunu Aç", to: "/admin/workshop/cadde" },
    ],
  },
  {
    id: "20260805-cadde-geo-katalog-temizligi",
    title: "Şehir kataloğu temizliği (m78+m79) — migration revize edildi, çalıştırılmayı bekliyor",
    description:
      "Çalıştırılacak dosya: supabase/migrations/20260804190000_cadde_geo_data_cleanup.sql (psql -f ile). Pano maddesi m78 (yanlış ülkeye bağlı şehirler) + m79 (büyük/küçük harf). Canlıda ölçülen bozukluk: 9 şehir küçük harfle başlıyor (ankara, izmir, ısparta, diyarbakır, bilecik, kingston, ashford, aschaffenburg, vancouver), 1'i tamamen büyük (MAXHÜTTE-HAIDHOF), Vancouver ABD'ye bağlı görünüyor. DİKKAT — migration 4 Ağustos'ta yazıldı ve 5 Ağustos'ta BAYATLADI, bu yüzden revize edildi: 20260805140000 katalogda eksik ülkeleri eklerken İtalya'yı ve ona bağlı DOĞRU bir Roma kaydını da ekledi, yani canlıda artık iki Roma var (biri ABD'ye biri İtalya'ya bağlı). Dosyanın ilk hali ABD'deki Roma'yı İtalya'ya TAŞIYORDU — çalıştırılsa ikinci bir kopya üretirdi ve fold eşleşmesi (limit 1) hangisini seçeceğini garanti etmediği için sessiz yanlış eşleşme doğardı. Revizyon: taşıma yerine SİLME, ama silmeden önce 7 FK tablosunda referans sayılıyor (6'sı ON DELETE SET NULL — sessiz veri kaybı riski) ve referans varsa migration duruyor. Salt-okunur prova canlıya karşı koşuldu: 10 harf düzeltmesi, 1 mükerrer silme, 0 bağlı satır. Türkçe dönüşümler elle yazıldı — initcap() 'izmir'i 'Izmir' yapar, doğrusu 'İzmir'. UYGULANDIKTAN SONRA: dosyayı supabase/migrations/applied/ altına taşı, yoksa check:migrations onu hiç görmez.",
    priority: "normal",
    actions: [{ label: "İş Panosunu Aç", to: "/admin/workshop/cadde" }],
  },
  {
    id: "20260805-cadde-profil-konum-serbest-metin",
    title: "Profil konumu hâlâ serbest metin — bozuk değer birikmeye devam ediyor",
    description:
      "ÇÖZÜLEN KISIM (canlıda, doğrulandı): hedef eşleşmesi artık aksan/harf-durumu duyarsız (migration 20260805130000, cadde_fold_text) ve profil konum verisinin bir kısmı onarıldı (20260805140000: 4 ülke + 4 şehir eklendi, 21 ülke + 3 şehir değeri düzeltildi). Paylaşabilen üye 42'den 104'e çıktı. KALAN GERÇEK İŞ: profil formu hâlâ SERBEST METİN. Bugünkü düzeltmeler mevcut kayıtları onarır, TEKRARINI ÖNLEMEZ — yarın biri yine 'Germany' yazacak. ÖLÇÜM (5 Ağustos, canlı, 126 profil): 17 üyenin ülkesi, 20 üyenin şehri katalogda karşılıksız (München/Münih, Böblingen, 'Düsseldorf/Grevenbroich' tek alanda iki şehir, Çankaya=Ankara ilçesi, 15 WhatsApp toplu-import kaydı 'Belirtilmedi'). Bunlar bugün zarar görmüyor: konumu çözülemeyen 44 üye emniyet supabı sayesinde tüm postları görüyor. YAPILMAYACAK: telefon ülke kodundan ülke çıkarımı — bu üründe sistematik olarak yanıltır, +90 numaralı bir diaspora üyesi Berlin'de yaşıyor olabilir. YAPILACAK: profil formunu cadde_countries/cadde_cities'ten beslenen seçim listesine çevir; katalog dar (22 ülke / 55 şehir), birlikte genişletilmeli.",
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
    id: "20260802-coolify-deploy-birikti",
    title: "Coolify deploy birikti — 2 günün işi hâlâ görünmüyor",
    description:
      "2-3 Ağustos'ta yapılan hiçbir şey canlıda görünmüyor: Cadde redesign'ın tamamı (F1-F23) + 4 görsel ince ayar, taşınma araçlarındaki slider→radyo buton düzeltmesi, Meslek/Maaş aracı iyileştirmesi + havuz 5→68, Komuta Merkezi'nin tamamlanan-görevler akordiyonu, /tools hub görsel yenilemesi + ZGEN Nesil Bulucu (18. araç) + uzay temalı giriş bandı, ve bu panele eklenen kayıtların kendisi. Hepsi ana kodda ve push'lu; geriye yalnız Coolify'dan yeni sürümü yayınlamak kaldı.",
    priority: "kritik",
    actions: [{ label: "İş Panosunu Aç", to: "/admin/workshop/cadde" }],
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
