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
    title: "Login'li QA turu (~30 dk)",
    description:
      "Otomatik kontrollerden geçemeyen, göz + oturum isteyen kalemler — Cadde: foto/video paylaşım, @mention bildirimi, F5 sonrası konum, saat çiplerinin dakika geçişi, korumalı markayla cafe açınca 'Parodi' önerisi, telefonda hero metni, ABD şehir filtresi · Araçlar: Hazırlık testi sonunda 4 butonun tıklanması, 'Hangi Şehir'e UK yazınca şehir dönmesi, sonuçtan çıkıp geri dönünce sonucun durması · Referral: profilde kod girip '✓ Doğrulandı' kilidini görmek.",
    priority: "normal",
    actions: [
      { label: "Cadde'yi Aç", to: "/cadde" },
      { label: "Hazırlık Testi", to: "/tools/tasinma-hazirlik-skoru" },
      { label: "Hangi Şehir Testi", to: "/tools/sehir-eslestirme" },
      { label: "Profilim", to: "/profile" },
      { label: "Referral Yönetimi", to: "/admin/referral" },
    ],
  },
  {
    id: "20260731-kafe-ikonu-sec",
    title: "Kafe ikonunu seç (workshop m3)",
    description:
      "Cadde kafe kartları için 5 ikon önerisi hazır: CC monogram · negatif boşluklu C-kupa · ince belli çay bardağı · sohbet-fincan · asma tabela C. Hepsi 48/24/16 px boyutlarında, açık temada ve örnek kafe kartı bağlamında gösteriliyor. Seçimini bildir — kart bileşenine entegre edilecek.",
    priority: "normal",
    actions: [
      { label: "İkon Önerilerini Aç", href: "/docs/kafe-ikon-onerileri.html" },
      { label: "Workshop Panosu", to: "/admin/workshop/cadde" },
    ],
  },
  {
    id: "20260731-pano-yapildi-cevirisi",
    title: "QA bitince revizyon panosunu 'yapıldı'ya çevirt",
    description:
      "Panodaki 18 madde 'inceleniyor' durumunda bekliyor — kodları canlıda ama gözle doğrulanmadıkları için bilinçli olarak 'yapıldı' denmedi. QA turunu bitirince Claude'a 'panoyu çevir' demen yeterli; her maddede hangi değişikliğin karşıladığını anlatan kanıt yorumu zaten var.",
    priority: "normal",
    actions: [{ label: "Revizyon Panosu", to: "/admin/revision-requests" }],
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
