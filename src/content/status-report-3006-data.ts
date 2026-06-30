// /statusreport3006 raporunun yapılandırılmış içeriği.
//
// Eski tek-blok HTML, bölüm/satır verisine dönüştürüldü ki:
//  (1) her satırın yanına "teknik" + "sade" (Burak'ın anlayacağı) iki sütun konsun,
//  (2) her ana bölümün altına DB-destekli yorum thread'i açılsın (commentKey).
//
// commentKey = statusreport_comments.section_key ile eşleşir (mig 20260701100000).
// Anahtarlar STABİL kalmalı (değiştirmek o bölümün yorumlarını koparır).

/** İki sütunlu satır: solda teknik, sağda sade açıklama. */
export type ReportRow = {
  /** Kısa konu etiketi (satır başlığı). */
  label: string;
  /** Teknik açıklama (mevcut detaylı dil). */
  technical: string;
  /** Burak için sade Türkçe karşılığı. */
  plain: string;
  /** Durum rozeti (opsiyonel). */
  status?: "ok" | "partial" | "open";
};

export type ReportSection = {
  /** Stabil bölüm anahtarı — yorum thread'i bununla bağlanır. */
  key: string;
  /** Üst grup etiketi (ör. "Bölüm 1 — Cadde 3.0"). */
  group?: string;
  title: string;
  /** Bölüm girişi (opsiyonel, sade dil). */
  intro?: string;
  rows: ReportRow[];
};

export const STATUS_LABELS: Record<NonNullable<ReportRow["status"]>, string> = {
  ok: "🟢 Tamam",
  partial: "🟡 Kısmen",
  open: "🔴 Açık",
};

export const REPORT_META = {
  title: "Cadde 3.0 & Premium Panel — Durum, Eksik ve Karar Raporu",
  subtitle:
    "Burak & UBT için: neyin çalıştığı, neyin maket olduğu, neyin eksik olduğu ve neye karar verilmesi gerektiği. Her satırda solda teknik, sağda sade açıklama; her bölümün altına yorum yazabilirsiniz.",
  date: "30 Haziran 2026",
};

export const REPORT_SECTIONS: ReportSection[] = [
  {
    key: "ozet",
    group: "Genel",
    title: "0. Yönetici Özeti",
    intro:
      "İki cümlede: Cadde 3.0'ın ALTYAPISI (arka plan) çekirdek olarak bitti ve canlıda. Ama kullanıcının gördüğü premium panelin 11 sekmesinden sadece 3'ü gerçekten çalışıyor; 8'i 'yakında' yazan boş ekran — ancak çoğunun arka planı zaten hazır, sadece bağlanması gerekiyor.",
    rows: [
      {
        label: "Cadde altyapısı",
        technical:
          "RPC-only yazma mimarisi (~37 security-definer RPC), CKS feed sıralaması, moderasyon kuyruğu, bildirim, tanıtım/kampanya backend'i, çoklu diaspora — hepsi canlıda ve testli.",
        plain:
          "Cadde'nin görünmeyen motoru hazır ve sağlam: paylaşımlar güvenli kaydediliyor, akış sıralanıyor, uygunsuz içerik için moderasyon var, bildirim ve reklam altyapısı çalışıyor.",
        status: "ok",
      },
      {
        label: "Premium panel",
        technical:
          "11 sekmenin 3'ü işlevsel (Profil Ayarları, Mesaj Kutusu, Hizmet Talepleri); 8'i placeholder. Çoğunun backend'i mevcut, sekmeye bağlanması gerekiyor.",
        plain:
          "Kullanıcının profilinde gördüğü panelde 11 sekme var; sadece 3'ü iş görüyor, 8'i şimdilik boş 'yakında' ekranı. İyi haber: çoğunun verisi zaten hazır, sadece ekrana bağlanacak.",
        status: "partial",
      },
      {
        label: "Gerçekten sıfırdan iş",
        technical:
          "Kalıcı Takip ve Kupon sistemleri sıfırdan backend ister. Ayrıca 'çalışıyor görünen' demo'lar var (Stripe ödemesi, kupon, takip localStorage'da).",
        plain:
          "Tümüyle yeni yapılması gerekenler az: kalıcı 'takip' ve 'kupon' sistemleri. Bir de çalışıyor gibi görünen ama aslında demo olan parçalar var — bunları gerçek sanmayalım.",
        status: "open",
      },
    ],
  },
  {
    key: "a1-backend",
    group: "Bölüm 1 — Cadde 3.0",
    title: "1A. Cadde'nin arka plan (backend) eksikleri",
    intro:
      "Cadde'nin görünmeyen tarafında söz verilip henüz bitmeyen veya bilinçli ertelenen işler.",
    rows: [
      {
        label: "Tip dosyası yenileme (B1)",
        technical:
          "supabase types.ts güncel değil; cadde-internal.ts'te izole bir 'db as any' cast var. Yenilemek için geçerli SUPABASE_ACCESS_TOKEN gerekiyor.",
        plain:
          "Kod ile veritabanı arasındaki 'sözlük' güncel değil; geliştirme sırasında küçük bir kestirme kullanılıyor. Bir komutla düzeltilir, kullanıcıyı etkilemez.",
        status: "open",
      },
      {
        label: "Telefon doğrulama / SMS (D-03)",
        technical:
          "user_verifications altyapısı kurulu ama OTP Edge Function yok ve zorunluluk kapalı. SMS sağlayıcı (Twilio/Vonage vb.) seçimi bekliyor.",
        plain:
          "Telefonla SMS doğrulama için zemin hazır ama açık değil; hangi SMS firması kullanılacak (ve maliyeti) kararı bekliyor. Karar verilince açılır.",
        status: "partial",
      },
      {
        label: "Eski tabloların silinmesi",
        technical:
          "Eski feed/cafe/follow tabloları yazıma kapatıldı (write-revoke) ama DROP edilmedi. Canary sonrası ayrı karar + migration gerekiyor.",
        plain:
          "Cadde'nin eski sürümünden kalan boş tablolar pasifleştirildi ama henüz silinmedi. Bir süre gözlemleyip sonra temizlenecek — acelesi yok, risk düşük.",
        status: "partial",
      },
      {
        label: "Cafe bitiş bildirimi zamanlaması",
        technical:
          "cadde_notify_expiring_cafes() hazır; pg_cron varsa 10 dk'da bir çalışır, yoksa 'scheduler kararı açık' notice'i düşer.",
        plain:
          "Süresi dolan cafe'ler için otomatik bildirim fonksiyonu hazır; ama bunun düzenli çalışması için bir zamanlayıcı gerekiyor — canlıda var mı kontrol edilmeli.",
        status: "partial",
      },
      {
        label: "Görsel moderasyonu",
        technical:
          "Otomatik tarama trigger'ları yalnız metni tarıyor; görsel/medya taraması yok.",
        plain:
          "Uygunsuz içerik denetimi şu an sadece yazılarda çalışıyor. Çarşı'ya görsel yükleme açılırsa, görseller için de bir denetim eklenmeli.",
        status: "open",
      },
    ],
  },
  {
    key: "a2-frontend",
    group: "Bölüm 1 — Cadde 3.0",
    title: "1B. Cadde'nin görünen yüz (frontend) eksikleri",
    intro: "Kullanıcının gözüyle gördüğü tarafta eksik kalan yüzeyler.",
    rows: [
      {
        label: "Public profil vitrini",
        technical:
          "CaddeMyContentCard panel parity tamam; ama açık cafe + çarşı ilanları başkalarının gördüğü katalog profilinde (directory) görünmüyor.",
        plain:
          "Kullanıcı kendi açtığı cafe'leri/ilanlarını kendi panelinde görüyor; ama BAŞKALARI onun profiline bakınca bunları göremiyor. Bu vitrini herkese açmak lazım.",
        status: "open",
      },
      {
        label: "Diaspora seçici (Cadde içi)",
        technical:
          "useCaddeDiasporaKey tüm sorgulara bağlı, header'da global switcher var; Cadde içi görünür switcher yok.",
        plain:
          "Cadde farklı ülke topluluklarını destekliyor ama kullanıcı Cadde içinden topluluğu kolayca değiştiremiyor — bir seçici eklenmeli (küçük iş).",
        status: "partial",
      },
      {
        label: "Premium kademe ekranı (D-07)",
        technical:
          "Cadde'de premium entitlement UI'ı yok; limitler cadde_settings'te sabit.",
        plain:
          "Ücretli/üst üyelik kademesi (ör. daha çok ilan hakkı) için bir ekran yok. İş modeli kararı verilince eklenecek.",
        status: "open",
      },
    ],
  },
  {
    key: "a3-test",
    group: "Bölüm 1 — Cadde 3.0",
    title: "1C. Test ve kalite eksikleri",
    rows: [
      {
        label: "RLS entegrasyon testleri",
        technical:
          "Birim/ayna testleri var; uçtan uca RPC + RLS entegrasyon testi yok.",
        plain:
          "Güvenlik kurallarının uçtan uca otomatik testi yok; şu an elle doğrulamaya bağlı. Otomatik test eklenirse güvenlik hataları erken yakalanır.",
        status: "open",
      },
      {
        label: "Playwright persona matrisi",
        technical:
          "TR-yerleşik / diaspora / business / banlı / admin gibi personalar için E2E test matrisi yok.",
        plain:
          "Farklı kullanıcı tiplerinin (Türkiye'deki, yurtdışındaki, işletme, yasaklı...) akışlarını otomatik test eden bir set yok — bunlar şimdilik elle test ediliyor.",
        status: "open",
      },
    ],
  },
  {
    key: "ref",
    group: "Bölüm 1 — Cadde 3.0",
    title: "1D. Eski 'corteqs_plus' projesinden alınabilecekler",
    intro:
      "Lovable'da yapılan önceki nesil projede güzel fikirler var. Kodu birebir kopyalayamayız (eski tablolara yazıyor, bizde kapalı), ama FİKİR/ARAYÜZ olarak alınabilir.",
    rows: [
      {
        label: "Dünya saatleri bandı",
        technical: "WorldClocksBand.tsx (~152 satır), salt görsel; bağımlılığı az.",
        plain:
          "Farklı ülkelerdeki saatleri gösteren şık bir şerit. Kolayca alınabilir, ilk aday.",
        status: "open",
      },
      {
        label: "Çarşı vitrini + ilan görseli",
        technical:
          "CarsiUserShowcase + görsel yükleme. Bizim 'public profil yüzeyi' eksiğiyle birebir örtüşüyor.",
        plain:
          "Kullanıcının ilanlarını profilinde sergileyen vitrin + ilana fotoğraf ekleme. Bizim eksik listemizdeki işle aynı — öncelikli.",
        status: "open",
      },
      {
        label: "Cafe atmosferi (post-it/anket/jukebox)",
        technical:
          "CafeAmbiance.tsx (~695 satır) tamamen localStorage — kullanıcılar birbirinin notunu görmüyor. Gerçek paylaşım için tablo+RPC+Realtime gerekir.",
        plain:
          "Cafe odasına his katan not duvarı, anket, müzik kutusu. Şu an herkes sadece kendi yazdığını görüyor (sahte). Gerçekten ortak olması ayrı bir iş — karar gerekiyor.",
        status: "open",
      },
      {
        label: "Takip + kişi keşfi",
        technical:
          "useFeedSocial: user_follows + benzerlik skorlaması. Cadde follow grafiğini bilinçle bıraktı; geri gelirse yeni cadde_follows + RPC gerekir.",
        plain:
          "'Birini takip et' ve 'sana benzeyen kişiler' önerisi. Şu an yok; geri istenirse sıfırdan, kalıcı bir sistem kurulmalı (panel 'Takip' sekmesiyle aynı iş).",
        status: "open",
      },
    ],
  },
  {
    key: "panel-sekmeler",
    group: "Bölüm 2 — Premium Panel",
    title: "2A. 11 sekmenin durumu",
    intro:
      "Premium kullanıcının (ör. experimental2@corteqs.net) profilinde gördüğü panel. Bir 'maketi' gerçeğe çevirmek genelde sadece 'var olan veriyi ekrana bağlamak' demek — sıfırdan yazmak değil.",
    rows: [
      {
        label: "1–3: Profil Ayarları, Mesaj Kutusu, Hizmet Talepleri",
        technical:
          "Çalışıyor. (Hizmet Talepleri çalışıyor ama ÖDEMESİ demo — aşağıda 2B.)",
        plain: "Bu üçü iş görüyor. Sadece Hizmet Talepleri'nin ödeme kısmı şimdilik göstermelik.",
        status: "ok",
      },
      {
        label: "4–7: Çarşı, Taşınma, Etkinlik, Takvim",
        technical:
          "Maket ama backend HAZIR (cadde-carsi-api, relocation-api, events, appointments tabloları mevcut). Sadece sekmeye bağlanacak.",
        plain:
          "Şu an 'yakında' ekranı; ama arka planları zaten hazır. Birkaç günde 'dolu' hale getirilebilir — hızlı kazanım.",
        status: "partial",
      },
      {
        label: "8–9: Bildirimler, WhatsApp",
        technical:
          "Kısmen var. Bildirim tablosu var ama üreten tetikleyiciler eksik; WhatsApp tablosu var, UI ref'ten port edilmeli.",
        plain:
          "Yarı hazır. Bildirimler için 'hangi olay bildirim üretsin' kararı; WhatsApp için eski projeden ekran taşınması gerekiyor.",
        status: "partial",
      },
      {
        label: "10–11: Takip, Kuponlar",
        technical:
          "Sıfırdan backend. Takip şu an localStorage (kalıcı değil), Kupon tamamen in-memory mock.",
        plain:
          "Bunlar gerçekten sıfırdan yapılacak. Şu an ikisi de sahte (sayfayı yenileyince kayboluyor). Ürün kararı gerektiriyor.",
        status: "open",
      },
    ],
  },
  {
    key: "panel-borc",
    group: "Bölüm 2 — Premium Panel",
    title: "2B. ⚠️ 'Çalışıyor' görünen ama aslında demo olan parçalar",
    intro: "Bunları 'bitti' sanmayalım — ekranda çalışıyor görünür, arkada gerçek işlem yoktur.",
    rows: [
      {
        label: "Stripe ödemesi",
        technical: "MockStripeCheckout — gerçek tahsilat YOK; 'başarılı' deyince talep kaydediliyor.",
        plain:
          "Ödeme ekranı gerçek Stripe'ı taklit ediyor ama PARA ÇEKMİYOR. Sunum için güzel, ama gerçek satış için bağlanması gerekiyor.",
        status: "open",
      },
      {
        label: "Kupon yönetimi",
        technical: "CouponManager tamamen in-memory mock — sayfa yenilenince kaybolur, DB yok.",
        plain: "Kupon oluştur/listele çalışıyor gibi ama hiçbir yere kaydedilmiyor; yenileyince gidiyor.",
        status: "open",
      },
      {
        label: "Takip",
        technical: "useFollow.ts sadece localStorage — kalıcı değil, kimse takipçisini görmüyor.",
        plain:
          "'Takip et' butonu çalışıyor gibi ama sadece o cihazda kalıyor; gerçek bir takip sistemi değil.",
        status: "open",
      },
    ],
  },
  {
    key: "kararlar",
    group: "Ortak",
    title: "3. Karar bekleyen başlıklar (ortakla konuşulacak)",
    intro:
      "Aşağıdakiler teknik değil, ÜRÜN kararı. Bunlara karar verilmeden bazı işler başlayamaz.",
    rows: [
      {
        label: "Takip sistemi geri gelsin mi?",
        technical: "Yeni cadde_follows tablosu + RPC + CKS skor etkisi + gizlilik kuralı gerekir.",
        plain:
          "Kullanıcılar birbirini takip edebilsin mi? Evetse kalıcı bir sistem kurulacak (panel + Cadde tek sistem). Hayırsa sadece 'keşif önerisi' yeter.",
      },
      {
        label: "Cafe atmosferi gerçek mi olsun?",
        technical: "Gerçek paylaşım = tablo+RPC+Realtime+moderasyon; ya da lokal kalır.",
        plain:
          "Not duvarı/anket/müzik herkese ortak mı görünsün, yoksa kişisel mi kalsın? Önerimiz: önce basit/lokal, sonra gerçek sürüm.",
      },
      {
        label: "SMS sağlayıcı kararı",
        technical: "Twilio / Vonage / Supabase phone / e-posta fallback? Maliyet + KVKK.",
        plain: "Telefon doğrulama için hangi SMS firması? Maliyeti ve yasal tarafı kararı bekliyor.",
      },
      {
        label: "Premium iş modeli + Kupon sahipliği",
        technical:
          "Feature-bazlı entitlement (afs_features) mi, gerçek abonelik (Stripe/Paddle) mi? Kupon işletmeye mi, premium bireysele mi?",
        plain:
          "Ücretli üyelik nasıl olacak ve kuponlar kime ait? (işletme mi verir, üye mi kullanır?) Bu karar hem premium ekranını hem kuponları açar.",
      },
    ],
  },
];
