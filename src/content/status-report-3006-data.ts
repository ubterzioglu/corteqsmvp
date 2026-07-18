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
  date: "30 Haziran 2026 (son güncelleme: 16 Temmuz 2026)",
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
    key: "sosyal-medya-otomasyon",
    group: "Bölüm 3 — Sosyal Medya",
    title: "3. LinkedIn Görsel Üretim Sistemi (16 Temmuz eklendi)",
    intro:
      "BURAK BURAYA BAK sekmesindeki 12 test aracı için Canva'da tek tek uğraşmadan, tek komutla 36 LinkedIn görseli üreten otomatik sistem kuruldu.",
    rows: [
      {
        label: "Ne yapıldı",
        technical:
          "scripts/social-generate/ altında Node CLI: 12 araç x 3 varyant için deterministik SVG arka plan (12 motif, marka renkleri) + Sharp compositing (logo+başlık+açıklama+CTA+domain overlay) ile 1200x1200 PNG üretir. Görsel üretim API'si kullanılmaz — backgroundMethod hep 'deterministic-svg'. npm run social:generate -- --all komutu.",
        plain:
          "12 test aracımızın (Hangi Ülke Sana Uygun, Almanya Banka/Sigorta vb.) her biri için 3 farklı LinkedIn görseli artık otomatik çıkıyor — Canva'da elle uğraşmaya gerek yok. Tek komutla 36 görsel birden üretiliyor.",
        status: "ok",
      },
      {
        label: "Kalite ve düzeltmeler",
        technical:
          "Final code review sonrası 4 minor bulgu giderildi: CLI --variant validasyonu (0/NaN artık hata veriyor), logo çevresindeki hafif seam (navy renk kaynağı logo crop'uyla eşitlendi), shortDescription regex'i maxLen parametresine bağlandı, ve BurakShareTab'a otomatik üretilen görsel önizlemesi (GeneratedImagePreview.tsx) eklendi.",
        plain:
          "Bir kod incelemesinden geçirildi, küçük kusurlar (yanlış komut girilirse sessiz kalması, logo kenarında zar zor görünen çizgi) düzeltildi. Ayrıca admin panelindeki her Canva kutusunun altına üretilen görselin küçük önizlemesi + indir butonu eklendi.",
        status: "ok",
      },
      {
        label: "Kalan iş",
        technical:
          "public/social/generated/ altındaki 36 PNG main'de commit'li ve Coolify deploy sonrası canlıda erişilebilir olacak. Üretilen görsellerin gerçek admin oturumuyla tarayıcıda görsel QA'i yapılmadı (auth gerektiriyor).",
        plain:
          "Kod tarafı tamam ve main'de; kalan tek şey deploy edip panelde gözle bir kontrol etmek.",
        status: "partial",
      },
    ],
  },
  {
    key: "revizyon-gorsel-ekleri",
    group: "Bölüm 4 — Diğer Temmuz İşleri",
    title: "4A. Revizyon istekleri — görsel ekleri (14 Temmuz)",
    intro:
      "Revizyon talebi/yorum akışına görsel ekleme yeteneği eklendi; canlıda ve testli.",
    rows: [
      {
        label: "Ne yapıldı",
        technical:
          "revision_request_attachments tablosu + storage bucket migration'ı (talep XOR yorum CHECK kısıtı); ek API katmanı (fetch/upload/delete/signed-url); ortak RevisionAttachmentGrid bileşeni; talep detay drawer'ına ve yorum thread'ine görsel grid; compose'da çoklu dosya seçimi; yeni talep sonrası panel otomatik açılıyor.",
        plain:
          "Revizyon isteği açarken veya yorum yazarken artık görsel ekleyebiliyorsunuz — hem talebe hem tek tek yorumlara. Birden fazla dosya birden seçilebiliyor.",
        status: "ok",
      },
    ],
  },
  {
    key: "bireysel-premium-sunum",
    group: "Bölüm 4 — Diğer Temmuz İşleri",
    title: "4B. Bireysel profil — tek tip premium sunum (14-15 Temmuz)",
    intro:
      "Experimental_2/3 pilotunda denenen premium hero/kart tasarımı tüm 'Bireysel' kategorisindeki rollere yayıldı.",
    rows: [
      {
        label: "Ne yapıldı",
        technical:
          "profile-types.ts'deki tek kaynak sınıflandırma (getUiProfileType) üzerinden User_*/Admin_* prefix'leri, Job_Candidate, Marketplace_IndividualSeller ve tanımsız rol varsayılanı dahil tüm bireysel profillere premium hero/kart tasarımı uygulandı. Deneysel_2/3 pilotu ayrı config olarak korundu (ileride ayrışma esnekliği için).",
        plain:
          "Herkesin bireysel profili artık daha önce sadece deneme kullanıcılarında gördüğümüz şık/premium görünümde. Kullanıcı doğrudan canlıya almayı tercih etti (kademeli açılım yerine).",
        status: "ok",
      },
      {
        label: "SuperAdmin istisnası",
        technical:
          "İki kurucu hesap (ubterzioglu@gmail.com, burakakcakanat@gmail.com) rol kategorisi olarak 'bireysel' sayılsa da resolveProfilePresentation içinde bilinçli olarak sade/generic görünümde tutuluyor — sadece sunum katmanı, izin/veri modeli değişmedi.",
        plain:
          "Umut ve Burak'ın kendi hesapları bu yeni premium görünümü almıyor, bilinçli olarak eski sade haliyle kalıyor.",
        status: "ok",
      },
    ],
  },
  {
    key: "burak-share-sekme",
    group: "Bölüm 4 — Diğer Temmuz İşleri",
    title: "4C. BURAK BURAYA BAK — 4. sekme (8 Temmuz)",
    intro:
      "/admin/social-share-vault sayfasına Burak için özel bir paylaşım sekmesi eklendi.",
    rows: [
      {
        label: "Ne yapıldı",
        technical:
          "social_share_assets tablosu + RLS + burak-share storage bucket migration'ı; medya asset API'si (slot_key upsert, storage) + testleri; 12 aracın statik içerik verisi; BurakMediaPanel + BurakShareTab (12 araç akordeon + medya yuvaları); 4. sekme 'BURAK BURAYA BAK' + bulk kopyala butonları.",
        plain:
          "Panelde artık 4. bir sekme var: her araç için Burak'ın kullanacağı hazır metinler + görsel/video/link yükleyebileceği kutular, tek tıkla kopyalama butonlarıyla birlikte.",
        status: "ok",
      },
      {
        label: "Durum",
        technical: "Migration canlı DB'de doğrulandı (tablo + bucket + 8 policy). Kod main'de.",
        plain: "Bu bölüm canlıda çalışır durumda, sadece görsel QA (gözle kontrol) bekliyor.",
        status: "ok",
      },
    ],
  },
  {
    key: "uye-geri-bildirim",
    group: "Bölüm 4 — Diğer Temmuz İşleri",
    title: "4D. Üye geri bildirim sistemi (7 Temmuz)",
    intro: "Üyelerin site hakkında geri bildirim bırakabileceği uçtan uca bir sistem eklendi.",
    rows: [
      {
        label: "Ne yapıldı",
        technical:
          "Üst barda giriş yapmış üyeye 'Feedback Ver' linki (geldiği sayfa page_path olarak taşınır); /feedback formu (RequireAuth, submitFeedback); /admin/feedback listesi (Yeni/Okundu/Arşiv durumları + soft-delete, e-posta çözümlemesi); member_feedback tablosu + RLS migration'ı (üye kendi kaydını ekler, görme/güncelleme admin-only). 14 yeni test.",
        plain:
          "Üyeler artık üst menüden 'Feedback Ver'e tıklayıp kısa bir form dolduruyor; adminler bu geri bildirimleri /admin/feedback'te okuyup 'okundu/arşiv' olarak işaretleyebiliyor.",
        status: "ok",
      },
      {
        label: "Durum",
        technical: "Kod main'de, migration canlı DB'de doğrulandı.",
        plain: "Canlıda çalışıyor, kalan sadece görsel QA.",
        status: "ok",
      },
    ],
  },
  {
    key: "header-admin-iyilestirmeler",
    group: "Bölüm 4 — Diğer Temmuz İşleri",
    title: "4E. Header, Araçlar menüsü ve admin panel iyileştirmeleri (14 Temmuz)",
    intro: "Aynı gün içinde yapılan bir dizi küçük ama kullanıcının doğrudan gördüğü iyileştirme.",
    rows: [
      {
        label: "Araçlar açılır menüsü",
        technical:
          "Masaüstünde Genel/Almanya araçları gruplandıran premium tasarımlı dropdown'a geçildi, sonra doğrudan linke çevrildi (sitemap'ten korumalı /tools/:slug alt sayfalarının çıkarılması + GSC indeksleme düzeltmesiyle birlikte); mobilde tam ekran aç/kapa panele dönüştürüldü; araç kartlarına 'Ücretsiz' rozeti eklendi.",
        plain:
          "Üst menüdeki Araçlar açılır listesi hem masaüstünde hem mobilde daha şık ve kullanışlı hale geldi, ücretsiz araçlar artık rozetle belli.",
        status: "ok",
      },
      {
        label: "Admin panel",
        technical:
          "Topbara Clarity/Search Console/Drive'a tek tıkla erişim için AdminQuickToolLinks eklendi; /admin/data'ya rol bazlı kayıt sayılarını gösteren akordeon kart + admin_role_record_counts RPC'si eklendi.",
        plain:
          "Adminler topbardan sık kullanılan araçlara (Clarity, Search Console, Drive) tek tıkla ulaşabiliyor; /admin/data'da her role kaç kayıt düştüğünü akordeon bir kartta görebiliyor.",
        status: "ok",
      },
      {
        label: "Giriş ekranı",
        technical: "LoginPage'e 'Ücretsiz' rozeti eklendi.",
        plain: "Giriş ekranında ücretsiz olduğumuzu vurgulayan bir rozet var artık.",
        status: "ok",
      },
    ],
  },
  {
    key: "relocation-tools-temmuz",
    group: "Bölüm 4 — Diğer Temmuz İşleri",
    title: "4F. Taşınma araçları — küçük düzeltmeler (1-7 Temmuz)",
    rows: [
      {
        label: "Soru akışı ve admin görünümü",
        technical:
          "QuestionStepper artık is_required bayrağına bakmaksızın her soruyu zorunlu sayıyor (slider varsayılan değeri cevap sayılmıyor); admin panelindeki hızlı/normal kolon ayrımı kaldırıldı (ürün artık tek modlu sabit soru akışı kullandığı için); /admin'e canlı soru sayısı sayfası + nav girdisi eklendi; Almanya araçlarının (banka/maaş/para transferi/sigorta) eksik hero görselleri tamamlandı.",
        plain:
          "Taşınma araçlarında bir soruyu cevaplamadan sonrakine geçilemiyor artık. Admin panelindeki soru sayısı ekranı gerçek ürün davranışını yansıtacak şekilde sadeleşti, 7 Almanya aracının eksik kapak görselleri eklendi.",
        status: "ok",
      },
    ],
  },
  {
    key: "kararlar",
    group: "Ortak",
    title: "4. Karar bekleyen başlıklar (ortakla konuşulacak)",
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
