import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Badge } from "@/components/ui/badge";

const ruleLegendItems = [
  "A: Aktif",
  "Z: Zorunlu",
  "P: Public",
  "D: Düzenler",
  "G: Gizler / Global",
  "O: Onay",
  "R: Rol",
  "S: Sıra",
] as const;

type GuideSection = {
  title: string;
  items: readonly string[];
};

type GuideBlock = {
  heading: string;
  tag?: string;
  sections: GuideSection[];
};

const blocks: GuideBlock[] = [
  {
    heading: "1. Yeni Sistemin Mantığı",
    tag: "Genel Bakış",
    sections: [
      {
        title: "Temel çalışma prensibi",
        items: [
          "Bu menü, yeni üye sistemindeki tüm operasyon ekranlarını tek bir akışta toplar.",
          "Yeni yapıda önce üyeyi bulur, sonra rolünü kontrol eder, gerekiyorsa rol kurallarını düzenler, en sonda da gerçekten ihtiyaç varsa override verirsin.",
          "Temel mantık şudur: genel kural önce rolde çözülür, tekil istisna gerekiyorsa override kullanılır.",
          "Override'ı ilk çözüm olarak kullanma; önce rol seviyesinde çözülüp çözülemeyeceğine bak.",
          "Aynı problem birden fazla kullanıcıda varsa genel kuralı Rol Yönetimi tarafında düzeltmek daha temizdir.",
        ],
      },
      {
        title: "Önerilen çalışma sırası",
        items: [
          "1. Önce Üye Takibi veya ilgili operasyon kaydından kullanıcıyı bul.",
          "2. Sonra Loginli Üyeler & Roller ekranında ana rol atamasını kontrol et.",
          "3. Sorun rol kaynaklıysa Rol Yönetimi ekranında attribute, feature veya section satırını düzelt.",
          "4. Sorun sadece tek kullanıcıya özelse Feature Override ile istisna ver.",
          "5. Son kontrol için Roller Önizleme ve AFS Önizleme ekranlarından kayıt tanımlarını çapraz kontrol et.",
          "6. Veri girişi veya toplu kaynak güncellemesi gerekiyorsa Onboarding Importları tarafına geç.",
        ],
      },
    ],
  },
  {
    heading: "2. Ekranlar ve Ne İşe Yararlar",
    tag: "Menü Haritası",
    sections: [
      {
        title: "Yeni Üyeler menüsündeki ekranlar",
        items: [
          "Üye Takibi: Tüm üye havuzunu, operasyon akışını ve genel üye incelemesini buradan yönetirsin.",
          "Loginli Üyeler & Roller (/admin/new-member/users-roles): Login olmuş kullanıcının aktif rolünü görür, ana rol atamasını burada değiştirirsin. Kullanıcı detaylarını açarak attribute ve taxonomy düzenlemesi de yapabilirsin.",
          "Rol Yönetimi (/admin/new-member/role-management): Rol bazında attribute, feature ve profile section kurallarını tek tabloda görür ve düzenlersin.",
          "Feature Override (/admin/new-member/overrides): Sadece tek kullanıcı için rol varsayımını bozmadan özel feature istisnası verirsin.",
          "Roller Önizleme (/admin/new-member/roles-preview): Sistemde tanımlı aktif rolleri sadece okunur şekilde kontrol edersin.",
          "AFS Önizleme (/admin/new-member/entity-preview): Attribute, Feature ve Section kataloglarını sadece okunur şekilde toplu olarak görürsün.",
          "Onboarding Importları (/admin/new-member/onboarding-imports): Onboarding tarafından gelen veri setlerini, mapping mantığını ve import akışlarını yönetirsin.",
          "Kullanım Klavuzu (/admin/new-member/guide): Bu ekranların hangi sırayla ve hangi durumda kullanılacağını hatırlarsın.",
        ],
      },
      {
        title: "Hangi durumda hangi ekrana gitmelisin?",
        items: [
          "Kullanıcıya yanlış deneyim açılıyorsa önce Loginli Üyeler & Roller ekranında rol doğru mu diye bak.",
          "Aynı sorun o roldeki herkesi etkiliyorsa Rol Yönetimi ekranına git ve genel kuralı orada düzelt.",
          "Sorun sadece bir kişide varsa ve diğer aynı rol kullanıcılarında olmaması gerekiyorsa Feature Override kullan.",
          "Rol adlarını, sluglarını veya açıklamalarını toplu kontrol etmek istiyorsan Roller Önizleme ekranına git.",
          "Bir kaydın attribute mu feature mi section mı olduğunu hızlıca anlamak istiyorsan AFS Önizleme ekranına git.",
          "Onboarding kaynaklı veri eksiği, toplu veri girişi veya import kontrolü gerekiyorsa Onboarding Importları ekranına git.",
        ],
      },
      {
        title: "Diğer admin ekranları",
        items: [
          "/admin — Ana kart grid (arama destekli, tüm linkler tek yerden).",
          "/admin/referral — Referral kaynak/grup/tip ve kod yönetimi.",
          "/admin/approvals — Onay kuyruğu (pending approval_requests).",
          "/admin/audit-logs — Admin değişiklik geçmişi.",
          "/admin/muhasebe/* — Gelir, gider, nakit akışı.",
          "/admin/whatsapp-landings — Topluluk landing sayfaları.",
        ],
      },
    ],
  },
  {
    heading: "3. Tablodaki Kısaltmalar",
    tag: "Referans",
    sections: [
      {
        title: "Harf kodları ne anlama gelir?",
        items: [
          "A = Aktif. İlgili attribute, feature veya section şu anda açık mı onu gösterir.",
          "Z = Zorunlu. Alanın kullanıcı tarafından doldurulmasının zorunlu olup olmadığını gösterir.",
          "P = Public. Alanın varsayılan olarak public görünür olup olmadığını gösterir.",
          "D = Düzenler. Kullanıcının ilgili alanı düzenleyip düzenleyemediğini gösterir.",
          "G = Gizler / Global. Attribute tarafında kullanıcı alanı gizleyebilir mi; feature tarafında ise feature global olarak açık mı onu temsil eder.",
          "O = Onay. Değişiklik admin onayı gerektiriyor mu onu gösterir.",
          "R = Rol. Feature satırında bu özelliğin seçili role açık olup olmadığını gösterir.",
          "S = Sıra. Alanın veya section'ın ekrandaki sıralama değerini gösterir.",
        ],
      },
      {
        title: "Rol Yönetimi ekranını nasıl okumalısın?",
        items: [
          "Tablodaki A rozetleri attribute satırlarını temsil eder; bunlar form alanı davranışını yönetir.",
          "Tablodaki F rozetleri feature satırlarını temsil eder; bunlar modül veya capability açık-kapalı durumunu yönetir.",
          "Tablodaki S rozetleri profile section satırlarını temsil eder; bunlar profil kartında hangi bölümün nasıl göründüğünü yönetir.",
          "Rol seçmeden katalog görünür; rol seçtiğinde aynı satırlar o role ait kurallarla edit moduna döner.",
          "Bir değişikliği kaydetmeden önce bunun rol seviyesi genel kural mı yoksa tekil istisna mı olduğuna karar ver.",
          "Roller Önizleme ve AFS Önizleme ekranları düzenleme için değil, kontrol ve doğrulama içindir.",
        ],
      },
    ],
  },
  {
    heading: "4. Kimlik Doğrulama (Auth)",
    tag: "Auth",
    sections: [
      {
        title: "Nasıl çalışır?",
        items: [
          "AuthProvider tüm uygulamayı sarar; Supabase'den oturum bilgisini çeker ve React context üzerinden yayar.",
          "useAuth() hook'u session, user ve isLoading değerlerini döndürür; herhangi bir bileşenden çağrılabilir.",
          "RequireAuth bileşeni session yoksa kullanıcıyı /login'e yönlendirir. Session varsa children render edilir.",
          "RequireFeature bileşeni hem oturum hem feature kontrolü yapar; feature kapalıysa fallback prop'unu gösterir.",
        ],
      },
      {
        title: "Login akışı adım adım",
        items: [
          "1. Kullanıcı /login sayfasına gider, Google OAuth veya e-posta ile giriş yapar.",
          "2. Supabase callback tetiklenir → onAuthStateChange → AuthProvider state güncellenir.",
          "3. session.user artık dolu → RequireAuth geçilebilir hale gelir.",
          "4. user_profiles.auth_provider alanı giriş yöntemini kaydeder (google / null).",
          "5. Sonraki sayfa yüklemelerinde getSession() ile oturum restore edilir.",
        ],
      },
      {
        title: "İlgili dosyalar",
        items: [
          "src/components/auth/AuthProvider.tsx — oturum state yönetimi",
          "src/components/auth/auth-context.ts — AuthContextValue tip tanımı",
          "src/components/auth/useAuth.ts — context hook sarmalayıcısı",
          "src/components/auth/RequireAuth.tsx — route guard",
          "src/components/auth/RequireFeature.tsx — feature guard",
        ],
      },
    ],
  },
  {
    heading: "5. Rol Sistemi",
    tag: "Roller",
    sections: [
      {
        title: "İki paralel sistem var (dikkat!)",
        items: [
          "Legacy sistem: user_profiles.profile_type alanı kullanır. Değerler: bireysel, danisman, isletme, kurulus-dernek, blogger-vlogger-youtuber, sehir-elcisi.",
          "RolesGo sistemi (Mayıs 2026 MVP): roles ve user_role_assignments tabloları üzerinden çalışır.",
          "Profil kodu düzenlenirken her iki sistemin de kontrol edilmesi gerekir; tek sistem kanonikal hale gelene kadar ikisi paralel yürür.",
        ],
      },
      {
        title: "6 rol tipi ve özellikleri",
        items: [
          "bireysel (individual) — Hizmet almak, etkinliklere katılmak ve diaspora ağını keşfetmek için. Birincil attribute: interests.",
          "danisman (consultant) — Uzmanlık sergilemek, hizmet sunmak, müşteri portföyü büyütmek için. Birincil attribute: expertise_area.",
          "isletme (business) — İşletme tanıtımı, teklif yayını, diaspora müşterilerine ulaşmak için. Birincil attribute: business_category.",
          "kurulus-dernek (organization) — Topluluk, dernek veya resmi yapı yönetimi için. Birincil attribute: organization_type.",
          "blogger-vlogger-youtuber (influencer) — İçerik üretimi, kampanya katılımı, kitle büyütme için. Birincil attribute: main_platform.",
          "sehir-elcisi (ambassador) — Şehirde CorteQS ağını temsil etmek, topluluğu büyütmek için. Birincil attribute: ambassador_city.",
        ],
      },
      {
        title: "Rol atama süreci adım adım",
        items: [
          "1. /admin/new-member/users-roles ekranına git.",
          "2. Kullanıcıyı ada veya e-postaya göre ara.",
          "3. İlgili satırda 'Details' butonuna tıkla.",
          "4. Açılan dialog'da mevcut rol badge olarak görünür.",
          "5. RoleSearchSelect ile yeni rolü seç.",
          "6. 'Tüm Değişiklikleri Kaydet' → admin_set_user_role RPC çağrısı → user_role_assignments güncellenir.",
        ],
      },
      {
        title: "Rol seçimi karar rehberi",
        items: [
          "Kullanıcının TÜM deneyimi değişecekse → rolü burada değiştir.",
          "Sadece tek bir izin farklı olsun istiyorsan → role dokunma, Feature Override ekranına git.",
          "Rol değişimi sonrası profil formu sorunu var mı? → Attribute Yönetimi ekranını kontrol et.",
          "Taxonomy seçim sorunu var mı? → Taxonomy Yönetimi ekranını kontrol et.",
          "Section görünüm sorunu var mı? → Profile Sections ekranını kontrol et.",
          "danisman ve isletme rollerinde taxonomy zorunlu alanları değişebilir; rol değişimi sonrası profili test et.",
        ],
      },
    ],
  },
  {
    heading: "6. Feature Flag Sistemi",
    tag: "Feature Flags",
    sections: [
      {
        title: "Çözümleme önceliği (yüksekten düşüğe)",
        items: [
          "1. override — Bu kullanıcıya özel admin müdahalesi. Her zaman kazanır.",
          "2. role_default — Kullanıcının rolünün varsayılan kuralı.",
          "3. fallback — Ne override ne rol tanımı var; varsayılan değer false (kapalı).",
          "Kaynak nereden geldiğini öğrenmek için getFeatureSource('feature.key') kullanılır.",
          "Feature çözümü debug: kullanıcı feature göremiyorsa sırayla kontrol et → override var mı? → role_default var mı? → global kapalı mı?",
        ],
      },
      {
        title: "Admin feature yönetimi — hangi işlem nerede?",
        items: [
          "Rol için feature aç/kapat → /admin/new-member/roles-features → admin_set_role_feature_flag RPC → O roldeki TÜM kullanıcılar etkilenir.",
          "Tek kullanıcıya override ver → /admin/new-member/overrides → admin_set_user_feature_override_detailed RPC → Sadece o kullanıcı etkilenir.",
          "Override temizle → aynı ekranda → admin_clear_user_feature_override RPC.",
          "Feature'ı dünya genelinde kapat → /admin/new-member/roles-features → admin_set_feature_global_state RPC.",
        ],
      },
      {
        title: "Feature kategorileri (referans)",
        items: [
          "IndividualFeatureKey (legacy): individual.about, individual.service_requests, individual.events, individual.follows, individual.whatsapp, individual.messages, individual.activity, individual.cv_request, individual.job_seeking_badge, individual.moving_soon_badge, individual.volunteer_mentorship",
          "Profil: profile.view_own, profile.edit_own, profile.edit_public, profile.linkedin_card, profile.website_card, profile.cv_upload, profile.presentation_upload",
          "Directory: directory.visible, directory.featured",
          "İletişim: contact.receive, contact.show_whatsapp",
          "İçerik: content.create, content.edit_own",
          "Üretim: events.create, offers.create, referral.create",
          "Platform: cadde.access, city.manage, whatsapp_landing.edit_assigned",
          "Sistem: admin.requires_approval",
        ],
      },
    ],
  },
  {
    heading: "7. Attribute Sistemi",
    tag: "Attributes",
    sections: [
      {
        title: "Katmanlar (yukarıdan aşağıya)",
        items: [
          "attribute_catalog — Ne tür attribute var? key, label, data_type, is_active alanları.",
          "role_attribute_rules — Hangi role hangi attribute uygulanır? is_enabled, is_required, is_public_default, user_can_edit, user_can_hide, requires_admin_approval_on_change, sort_order.",
          "user_profile_attributes — Kullanıcının gerçek değerleri: value_text, value_json, visibility (public/private), approval_status.",
        ],
      },
      {
        title: "Veri tipleri",
        items: [
          "text → value_text alanında saklanır. Örnek: ad, şehir.",
          "textarea → value_text alanında saklanır. Örnek: uzun biyografi.",
          "json → value_json alanında saklanır. Örnek: yapılandırılmış profil verisi.",
          "multi_select → value_json (array) olarak saklanır. Örnek: seçili yetenekler.",
          "boolean → value_json olarak saklanır. Örnek: evet/hayır flag'i.",
        ],
      },
      {
        title: "approval_status değerleri",
        items: [
          "draft — Kullanıcı henüz kaydetmedi.",
          "pending — Admin onayı bekleniyor; approval_requests tablosunda bir kayıt oluşur.",
          "approved — Onaylandı, public görünebilir.",
          "rejected — Reddedildi.",
        ],
      },
      {
        title: "Admin attribute güncelleme akışı",
        items: [
          "1. /admin/new-member/users-roles → 'Details' butonu.",
          "2. Attribute listesi yüklenir (attribute_catalog + user_profile_attributes join).",
          "3. Admin değeri Input/Textarea ile düzenler, visibility switch'i ile public/private seçer.",
          "4. 'Tüm Değişiklikleri Kaydet' → admin_update_user_profile_attribute RPC.",
          "5. Role kuralında requires_admin_approval_on_change = true ise approval_requests tablosuna 'pending' kayıt düşer.",
        ],
      },
    ],
  },
  {
    heading: "8. Taxonomy Sistemi",
    tag: "Taxonomy",
    sections: [
      {
        title: "Tablo yapısı",
        items: [
          "taxonomy_groups — Kategori grupları. Örnek: 'Uzmanlık Alanı', 'Sektör'.",
          "taxonomy_options — Grup içindeki seçenekler. Örnek: 'Fintech', 'Sağlık'.",
          "role_taxonomy_rules — Hangi grubun hangi rolde aktif olduğu ve seçim modu (single/multiple).",
          "user_taxonomy_selections — Kullanıcının seçtiği option'ların listesi.",
        ],
      },
      {
        title: "Önemli davranış",
        items: [
          "Taxonomy role göre dinamik değişir; danisman rolü expertise_area grubunu zorunlu görebilirken bireysel görmeyebilir.",
          "Rol değişiminden sonra kullanıcının taxonomy seçimleri korunur ama yeni role göre aktif gruplar farklılaşır.",
          "Admin /admin/new-member/taxonomy ekranından grupları ve option'ları yönetir.",
          "Bir option'ı devre dışı bırakmak için admin_set_taxonomy_option_active RPC kullanılır.",
        ],
      },
    ],
  },
  {
    heading: "9. Profile Section Sistemi",
    tag: "Sections",
    sections: [
      {
        title: "Tablo yapısı",
        items: [
          "profile_section_catalog — Mevcut section'lar: key, label, section_area, sort_order, is_active.",
          "role_profile_section_rules — Hangi section hangi rolde görünür? is_enabled, requires_approval, sort_order.",
        ],
      },
      {
        title: "Section tipleri",
        items: [
          "selfSectionKeys — Kullanıcının kendi profil düzenleme ekranında gördüğü bölümler. Tüm rollerde: summary, common_attributes, role_attributes, taxonomy, requests, dashboard.",
          "publicSectionKeys — Dışarıdan ziyaret eden biri profil sayfasında görür. Rolle göre değişir: hero, about, expertise/services/focus/platform/city, taxonomy, contact.",
        ],
      },
      {
        title: "Admin yönetimi",
        items: [
          "/admin/new-member/profile-sections ekranından section sıralaması ve aktiflik durumu yönetilir.",
          "admin_upsert_role_profile_section_rule RPC ile rol bazında section kuralları güncellenir.",
        ],
      },
    ],
  },
  {
    heading: "10. Rehber (Directory) ve Katalog Sahiplenme",
    tag: "Katalog",
    sections: [
      {
        title: "Nasıl çalışır?",
        items: [
          "Rehber (Directory) ekranı artık sadece kayıtlı kullanıcı profillerini değil, dışarıdan içe aktarılmış sahiplenilebilir 'Katalog (Catalog)' kayıtlarını da tek bir listede birleşik (unified) olarak gösterir.",
          "Yeni rollere ait (Örn: Doktor, Diş Hekimi vb.) toplu veri yüklemeleri, geliştirici ekibi tarafından generic CSV importer aracıyla auth user yaratmadan, public katalog kayıtları olarak içeri alınır.",
          "İçe aktarılan katalog kayıtlarının CSV'deki hangi sütunlarla (ad, iletişim, kategori vb.) eşleşeceği altyapıdaki 'catalog-role-import-map.json' kural dosyasından yönetilir.",
          "Kullanıcılar henüz kimseye ait olmayan katalog kayıtlarını '/directory/catalog/:slug' özel detay sayfasında görüntüler.",
          "Sisteme giriş yapmış üyeler, bu sayfadan 'Claim' (Sahiplen) butonunu kullanarak kaydın kendilerine ait olduğunu beyan edebilir (submit_catalog_claim_request).",
          "Gelen sahiplenme (claim) talepleri, mevcut talep onay mekanizması üzerinden yönetici tarafından değerlendirilir ve onaylandığında kayıt üyenin profiline dönüşür.",
        ],
      },
    ],
  },
  {
    heading: "11. Tam Süreç Akışları",
    tag: "Süreç Akışları",
    sections: [
      {
        title: "Yeni üye kayıt ve rol atama süreci",
        items: [
          "1. Kullanıcı /lansman veya /login üzerinden kayıt olur.",
          "2. Supabase Auth → user oluşur → user_profiles tablosuna kayıt düşer (profile_type = 'bireysel' default).",
          "3. Admin → /admin/new-member/users-roles → kullanıcıyı ara.",
          "4. 'Details' → doğru rolü seç → 'Tüm Değişiklikleri Kaydet'.",
          "5. admin_set_user_role RPC → user_role_assignments güncellenir.",
          "6. Kullanıcının sonraki oturumunda get_current_user_features() yeni role göre döner.",
        ],
      },
      {
        title: "Feature çözümleme (runtime, her sayfa yüklemesinde)",
        items: [
          "1. useFeatureFlags() hook'u supabase.rpc('get_current_user_features') çağırır.",
          "2. DB: önce user_feature_overrides tablosuna bakar → override varsa 'override' source ile döner.",
          "3. Override yoksa role_feature_flags tablosuna bakar → 'role_default' source ile döner.",
          "4. Hiçbiri yoksa 'fallback' → false döner.",
          "5. featureMap['cadde.access'] = { isEnabled: true, source: 'role_default' } şeklinde state'e yazılır.",
          "6. RequireFeature bileşeni isFeatureEnabled() sonucuna göre children veya fallback render eder.",
        ],
      },
      {
        title: "Feature açma/kapama süreci",
        items: [
          "Tüm role uygula: /admin/new-member/roles-features → Rol seç → Feature aç/kapat → admin_set_role_feature_flag RPC.",
          "Tek kullanıcıya override: /admin/new-member/overrides → Kullanıcı seç → Feature + değer + gerekçe → admin_set_user_feature_override_detailed RPC.",
          "Dünya genelinde kapat: /admin/new-member/roles-features → Global Durum → admin_set_feature_global_state RPC.",
        ],
      },
    ],
  },
  {
    heading: "12. Operasyon Kuralları ve Kritik Kısıtlamalar",
    tag: "Kritik",
    sections: [
      {
        title: "Operasyon kuralları",
        items: [
          "Override'ı ilk çözüm olarak kullanma; önce rol seviyesinde çözülüp çözülemeyeceğine bak.",
          "Aynı problem birden fazla kullanıcıda varsa genel kuralı Rol Yönetimi tarafında düzeltmek daha temizdir.",
          "Roller Önizleme ve AFS Önizleme ekranları düzenleme için değil, kontrol ve doğrulama içindir.",
          "Rol değişikliği yaptığında kullanıcının gerçek deneyimini mutlaka ilgili ekran veya profil akışında test et.",
          "Onboarding import değişiklikleri canlı akışı etkileyebileceği için mapping ve hedef alan kontrolünü ikinci kez doğrulamak güvenlidir.",
        ],
      },
      {
        title: "Dokunmadan önce bil",
        items: [
          "Dual auth sistemi: admin_users tablosu (eski) + user_profiles_v2 (yeni) eş zamanlı çalışıyor. Profil mantığını değiştirmeden önce sor.",
          "Supabase client çift kaynak: integrations/supabase/client.ts (tip tanımlı, tercih et) ve lib/supabase.ts (re-export). Yeni kod için integrations/ kullan.",
          "Supabase migration'ları asla sil veya yeniden sırala; sadece yeni migration ekle.",
          "SEO kilitli URL'ler: /lansman, /cadde, /19051919, /anket — bu path'leri değiştirme.",
          "TypeScript strict: false kasıtlı. Yeni kod strict:true gibi yaz ama mevcut koda dokunurken hata bekle.",
          "Feature çözümü debug: kullanıcı feature göremiyorsa sırayla kontrol et → override var mı? → role_default var mı? → global kapalı mı?",
        ],
      },
    ],
  },
];

const AdminNewMemberGuidePage = () => {
  return (
    <AdminPageLayout className="max-w-5xl gap-10">
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Kullanım Klavuzu
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Yeni üyeler menüsündeki ekranların ne işe yaradığını, hangi durumda
            hangisini kullanman gerektiğini, sistem mimarisini ve kritik
            kısıtlamaları bu sayfada madde madde bulabilirsin.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {blocks.map((block) =>
            block.tag ? (
              <Badge
                key={block.tag}
                variant="secondary"
                className="rounded-full text-xs"
              >
                {block.tag}
              </Badge>
            ) : null
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {ruleLegendItems.map((item) => (
            <span
              key={item}
              className="rounded-full border border-border bg-muted/40 px-3 py-1.5 font-medium tracking-[0.01em]"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <div className="space-y-12">
        {blocks.map((block) => (
          <div key={block.heading} className="space-y-6">
            <h2 className="border-b border-border/60 pb-3 text-lg font-semibold tracking-tight text-foreground">
              {block.heading}
            </h2>
            <div className="space-y-6">
              {block.sections.map((section) => (
                <div key={section.title} className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground/80">
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-sm leading-6 text-muted-foreground"
                      >
                        <span
                          className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminPageLayout>
  );
};

export default AdminNewMemberGuidePage;
