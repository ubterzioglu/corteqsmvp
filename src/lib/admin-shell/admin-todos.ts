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
    title: "Coolify deploy birikti — bugünün işi hâlâ görünmüyor",
    description:
      "2 Ağustos'ta yapılan hiçbir şey canlıda görünmüyor: Cadde redesign'ın tamamı (F1-F23, 23 batch), taşınma araçlarındaki slider→radyo buton düzeltmesi, Meslek/Maaş aracı iyileştirmesi, Komuta Merkezi'nin tamamlanan-görevler akordiyonu ve bu panele az önce eklenen kayıtların kendisi. Hepsi ana kodda ve push'lu; geriye yalnız Coolify'dan yeni sürümü yayınlamak kaldı.",
    priority: "kritik",
    actions: [{ label: "İş Panosunu Aç", to: "/admin/workshop/cadde" }],
  },
  {
    id: "20260802-meslek-maas-migration-kontrol",
    title: "Meslek/Maaş soru metni güncellemesini canlıya uygula",
    description:
      "20260802143000_profession_salary_question_ux.sql dosyası supabase/migrations/ altında duruyor ama applied/ klasörüne taşınmamış — bu projede bir migration'ın canlıya gerçekten uygulandığının işareti odur. Yani meslek/ülke/şehir sorularındaki yeni yardımcı metinler ve seçici ayarları veritabanında henüz YOK olabilir. Deploy öncesi bunun psql ile uygulanıp uygulanmadığının teyit edilmesi gerekiyor.",
    priority: "normal",
    actions: [{ label: "Soru Sayıları'nı Aç", to: "/admin/relocation-tools/soru-sayilari" }],
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
    id: "20260731-ilk-1800-ozetini-dogrula",
    title: "İlk 18:00 günlük özetini doğrula",
    description:
      "Panel güncellemeleri artık anlık tekil mail yerine günde tek özet olarak gidiyor (18:00-18:15 Berlin). Bir sonraki güncelleme kaydı girildiği gün saat 18:00'den sonra gelen kutunu kontrol et: TEK birleşik mail gelmeli. Acil duyuru gerekirse Bildirim Ayarları'ndaki 'Şimdi gönder' erken boşaltır (yine tek özet).",
    priority: "normal",
    actions: [{ label: "Bildirim Ayarları'nı Aç", to: "/admin/notifications" }],
  },
];
