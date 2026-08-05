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
    id: "20260805-cadde-hedef-eslesmesi-fold",
    title: "AÇIK BIRAKILDI: Cadde'de paylaşım üyelerin çoğu için kırık — hedef eşleşmesi",
    description:
      "5 Ağustos'ta teşhis edildi, düzeltmesi BİLİNÇLİ olarak ertelendi — bu kaydın amacı unutulmamasını sağlamak. Sorun: paylaşımın hedef ülkesi profilden HAM geliyor (get_cadde_actor_context), create_cadde_post_v2 ise bunu birebir isimle eşleştiriyor (c.name = country_name). Profilinde 'Türkiye' yazan üye, tabloda 'Turkiye' (diakritiksiz) kayıtlı olduğu için eşleşmiyor ve paylaşımı cadde_invalid_targets ile reddediliyor. CANLIDA ÖLÇÜLDÜ: en kalabalık grup 38 üye 'Türkiye' — hiçbiri paylaşım yapamıyor; ilk 25 değerde eşleşen 41 üyeye karşılık eşleşmeyen 72 üye var (Belirtilmedi 14, Qatar 3, türkiye 3, Deutschland, Abd, Tr, İngiltere...). Akış (okuma) tarafı 29 Temmuz'da cadde_fold_text ile aksan/harf duyarsız hale getirilmişti; create_cadde_post_v2 atlanmış. DÜZELTME: o iki join'i cadde_fold_text'e çevirecek bir migration — veri temizliği tek başına yetmez, çünkü Qatar/Deutschland/Abd gibi değerler hiçbir listede yok. Yapıldığında bu kayıt kapatılmalı. NOT: hatanın görünen yüzü (kullanıcının genel 'İşlem tamamlanamadı' mesajı görmesi) commit 1cd7ef8 ile ZATEN düzeltildi — deploy sonrası artık gerçek sebep yazıyor; kırık olan paylaşımın kendisi.",
    priority: "kritik",
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
