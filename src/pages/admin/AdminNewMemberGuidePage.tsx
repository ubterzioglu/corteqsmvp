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
    heading: "1. Sistemin Genel Mantığı",
    tag: "Genel Bakış",
    sections: [
      {
        title: "Temel çalışma prensibi",
        items: [
          "Platformdaki tüm kayıtlar — ister giriş yapmış kullanıcı profili, ister dışarıdan içe aktarılmış katalog kaydı olsun — artık tek bir unified veri modelinde toplanır.",
          "Her kayda bir platform rolü atanır (örn: bireysel, danisman, doktor). Rol atanınca o role ait attribute, feature ve section kuralları otomatik olarak o kayda uygulanır.",
          "Genel kural önce rol seviyesinde çözülür. Tekil istisna gerekiyorsa override kullanılır. Override ilk çözüm değil, son çaredir.",
          "Aynı sorun birden fazla kayıtta varsa genel kuralı Rol Yönetimi ekranında düzelt; tüm o roldeki kayıtlar etkilenir.",
          "Claim mekanizması: sahipsiz katalog kayıtları için kullanıcılar sahiplenme talebinde bulunabilir; admin onaylayınca o kullanıcı kaydı düzenleme yetkisi kazanır.",
        ],
      },
      {
        title: "Önerilen operasyon sırası",
        items: [
          "1. Kaydı bul — Loginli Üyeler & Roller veya Katalog ekranında kullanıcı ya da katalog item'ı ara.",
          "2. Rolü kontrol et — Kaydın platform rolü doğru mu? Yanlışsa hemen düzelt.",
          "3. Rol kurallarını kontrol et — Rol atanınca attribute, feature ve section'lar otomatik gelir. Eksik veya yanlış görünüyorsa Rol Yönetimi ekranına git.",
          "4. Tekil istisna gerekiyorsa override ekle — Feature Override (kullanıcı için) veya Katalog item'ı üzerinde item-level override uygula.",
          "5. Claim varsa incele ve onayla — Katalog ekranındaki Talepler tab'ından bekleyen claim'leri onayla; onaylanan kullanıcı editör yetkisi kazanır.",
          "6. Toplu veri girişi gerekiyorsa Onboarding Importları ekranına geç.",
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
          "Üye Takibi: Tüm üye havuzunu ve operasyon akışını buradan yönetirsin.",
          "Loginli Üyeler & Roller (/admin/new-member/users-roles): Giriş yapmış kullanıcıların aktif rolünü görür, ana rol atamasını burada değiştirirsin. Kullanıcı detay dialogundan attribute ve taxonomy düzenlemesi de yapabilirsin.",
          "Rol Yönetimi (/admin/new-member/role-management): Rol bazında attribute, feature ve profile section kurallarını tek tabloda görür ve düzenlersin. Bir rolde yaptığın değişiklik o roldeki TÜM kayıtlara yansır.",
          "Feature Override (/admin/new-member/overrides): Sadece tek bir kullanıcı için rol varsayımını bozmadan özel feature istisnası tanımlarsın.",
          "Roller Önizleme (/admin/new-member/roles-preview): Sistemde tanımlı aktif rolleri sadece okunur şekilde kontrol edersin.",
          "AFS Önizleme (/admin/new-member/entity-preview): Attribute, Feature ve Section kataloglarını sadece okunur şekilde toplu olarak görürsün.",
          "Onboarding Importları (/admin/new-member/onboarding-imports): Onboarding kaynaklı veri setlerini, mapping mantığını ve import akışlarını yönetirsin.",
          "Kullanım Klavuzu (/admin/new-member/guide): Bu ekransın.",
        ],
      },
      {
        title: "Katalog Yönetimi ekranı (/admin/data)",
        items: [
          "Hem auth'lu kullanıcı profillerini (kind: profile) hem dışarıdan içe aktarılmış katalog kayıtlarını (kind: catalog_item) tek bir unified tabloda listeler.",
          "Tür filtresiyle yalnızca katalog kayıtları veya yalnızca kullanıcı profilleri görüntülenebilir.",
          "Satıra tıklayınca detay Sheet açılır: Genel Bilgiler, Rol & Kurallar, Düzenleyiciler, Talepler, Kaynaklar tab'ları vardır.",
          "Rol & Kurallar tab'ından item'a platform rolü atayabilir; o rolün attribute/feature/section kurallarını görebilir ve item bazında override ekleyip kaldırabilirsin.",
          "Talepler tab'ından o item için bekleyen claim'leri görür, approve veya reject edebilirsin.",
          "Düzenleyiciler tab'ından item'ı düzenleme yetkisi olan kullanıcıları görebilir, arama ile yeni editör ekleyebilir veya mevcut yetkiyi iptal edebilirsin.",
        ],
      },
      {
        title: "Hangi durumda hangi ekrana gitmelisin?",
        items: [
          "Kullanıcıya yanlış deneyim açılıyorsa → Loginli Üyeler & Roller ekranında rolü kontrol et.",
          "Aynı sorun o roldeki herkesi etkiliyorsa → Rol Yönetimi ekranında genel kuralı düzelt.",
          "Sorun sadece bir kullanıcıda varsa → Feature Override ile tekil istisna ver.",
          "Katalog kaydına rol atamak veya attribute/feature/section override eklemek istiyorsan → Katalog ekranı → Rol & Kurallar tab'ı.",
          "Claim taleplerini onaylamak istiyorsan → Katalog ekranı → Talepler tab'ı.",
          "Rol adlarını veya açıklamalarını toplu kontrol etmek istiyorsan → Roller Önizleme.",
          "Bir kaydın attribute mu feature mi section mı olduğunu anlamak istiyorsan → AFS Önizleme.",
          "Onboarding kaynaklı veri eksiği veya toplu import gerekiyorsa → Onboarding Importları.",
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
          "A rozetleri attribute satırlarını temsil eder — form alanı davranışını yönetir.",
          "F rozetleri feature satırlarını temsil eder — modül veya capability açık/kapalı durumunu yönetir.",
          "S rozetleri profile section satırlarını temsil eder — profil kartında hangi bölümün nasıl göründüğünü yönetir.",
          "Rol seçmeden katalog görünür; rol seçince aynı satırlar o role ait kurallarla edit moduna döner.",
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
          "Katalog kayıtları ise catalog_items.platform_role_key kolonu üzerinden rol alır; bu alan roles tablosundaki key'e referans verir.",
          "Profil kodu düzenlenirken her iki sistemin de kontrol edilmesi gerekir; tek sistem kanonikal hale gelene kadar ikisi paralel yürür.",
        ],
      },
      {
        title: "Platform rolleri ve amaçları",
        items: [
          "bireysel (individual) — Hizmet almak, etkinliklere katılmak ve diaspora ağını keşfetmek için. Birincil attribute: interests.",
          "danisman (consultant) — Uzmanlık sergilemek, hizmet sunmak, müşteri portföyü büyütmek için. Birincil attribute: expertise_area.",
          "isletme (business) — İşletme tanıtımı, teklif yayını, diaspora müşterilerine ulaşmak için. Birincil attribute: business_category.",
          "kurulus-dernek (organization) — Topluluk, dernek veya resmi yapı yönetimi için. Birincil attribute: organization_type.",
          "blogger-vlogger-youtuber (influencer) — İçerik üretimi, kampanya katılımı, kitle büyütme için. Birincil attribute: main_platform.",
          "sehir-elcisi (ambassador) — Şehirde CorteQS ağını temsil etmek, topluluğu büyütmek için. Birincil attribute: ambassador_city.",
          "Yeni roller (örn: doktor, dis-hekimi) katalog-specific roller olarak tanımlanabilir ve catalog_items.platform_role_key alanıyla atanır.",
        ],
      },
      {
        title: "Kullanıcıya rol atama süreci adım adım",
        items: [
          "1. /admin/new-member/users-roles ekranına git.",
          "2. Kullanıcıyı ada veya e-postaya göre ara.",
          "3. İlgili satırda 'Details' butonuna tıkla.",
          "4. Açılan dialog'da mevcut rol badge olarak görünür.",
          "5. RoleSearchSelect ile yeni rolü seç.",
          "6. 'Tüm Değişiklikleri Kaydet' → admin_set_user_role RPC → user_role_assignments güncellenir.",
          "7. Kullanıcının sonraki oturumunda get_current_user_features() yeni role göre döner.",
        ],
      },
      {
        title: "Katalog item'a rol atama süreci adım adım",
        items: [
          "1. /admin/data ekranına git.",
          "2. İlgili katalog item'ını bul ve satıra tıkla.",
          "3. Açılan Sheet'te 'Rol & Kurallar' tab'ına geç.",
          "4. Rol seçiciden uygun rolü seç (örn: healthcare_advisor).",
          "5. 'Rolü Kaydet' → admin_set_catalog_item_role RPC → catalog_items.platform_role_key güncellenir.",
          "6. Rol kaydedilince o rolün attribute, feature ve section kuralları aynı tab'da otomatik olarak listelenir.",
        ],
      },
      {
        title: "Rol seçimi karar rehberi",
        items: [
          "Kullanıcının veya kaydın TÜM deneyimi değişecekse → rolü değiştir.",
          "Sadece tek bir izin veya alan farklı olsun istiyorsan → role dokunma, override kullan.",
          "Rol değişimi sonrası profil formu sorunu var mı? → Attribute ekranını kontrol et.",
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
          "1. override — Bu kullanıcıya veya item'a özel admin müdahalesi. Her zaman kazanır.",
          "2. role_default — Kullanıcının veya item'ın rolünün varsayılan kuralı.",
          "3. fallback — Ne override ne rol tanımı var; varsayılan değer false (kapalı).",
          "Kaynak nereden geldiğini öğrenmek için getFeatureSource('feature.key') kullanılır.",
          "Feature çözümü debug: kullanıcı feature göremiyorsa sırayla kontrol et → override var mı? → role_default var mı? → global kapalı mı?",
        ],
      },
      {
        title: "Admin feature yönetimi — hangi işlem nerede?",
        items: [
          "Rol için feature aç/kapat → /admin/new-member/roles-features → admin_set_role_feature_flag RPC → O roldeki TÜM kayıtlar etkilenir.",
          "Tek kullanıcıya override ver → /admin/new-member/overrides → admin_set_user_feature_override_detailed RPC → Sadece o kullanıcı etkilenir.",
          "Katalog item'a feature override ver → /admin/data → Rol & Kurallar tab'ı → Feature listesinde toggle → admin_upsert_catalog_item_feature_override RPC.",
          "Override temizle → aynı ekranlarda → admin_clear_user_feature_override veya admin_delete_catalog_item_feature_override RPC.",
          "Feature'ı dünya genelinde kapat → /admin/new-member/roles-features → admin_set_feature_global_state RPC.",
        ],
      },
      {
        title: "Feature kategorileri (referans)",
        items: [
          "Profil: profile.view_own, profile.edit_own, profile.edit_public, profile.linkedin_card, profile.website_card, profile.cv_upload, profile.presentation_upload",
          "Directory: directory.visible, directory.featured",
          "İletişim: contact.receive, contact.show_whatsapp",
          "İçerik: content.create, content.edit_own",
          "Üretim: events.create, offers.create, referral.create",
          "Platform: cadde.access, city.manage, whatsapp_landing.edit_assigned",
          "Sistem: admin.requires_approval",
          "Legacy (individual): individual.about, individual.service_requests, individual.events, individual.follows, individual.whatsapp, individual.messages, individual.activity, individual.cv_request, individual.job_seeking_badge, individual.moving_soon_badge, individual.volunteer_mentorship",
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
          "attribute_catalog — Ne tür attribute var? key, label, data_type, is_active alanları. Tüm sistemin temel sözlüğü.",
          "role_attribute_rules — Hangi role hangi attribute uygulanır? is_enabled, is_required, is_public_default, user_can_edit, user_can_hide, requires_admin_approval_on_change, sort_order.",
          "user_profile_attributes — Auth kullanıcısının gerçek değerleri: value_text, value_json, visibility (public/private), approval_status.",
          "catalog_item_attribute_overrides — Katalog item'ın rol kuralının üstüne yazan item-level override: attribute_key, is_enabled, display_order, override_label. Rol kuralından gelmeyen attribute'ları da item'a ekleyebilir.",
        ],
      },
      {
        title: "Override mantığı (katalog item'lar için)",
        items: [
          "Inherited: Rol atanmış bir katalog item'ı, o rolün role_attribute_rules tablosundaki tüm aktif attribute'ları miras alır.",
          "Override ekle: Admin Katalog ekranı → Rol & Kurallar → Attribute listesinde bir satırı toggle eder veya label/sıra düzenler → admin_upsert_catalog_item_attribute_override RPC çağrılır.",
          "Override kaldır (varsayılana dön): Aynı listede override rozeti olan bir satırda 'Varsayılana dön' → admin_delete_catalog_item_attribute_override RPC.",
          "isOverride rozeti: Listede bir satır role'den mi geliyor (inherited) yoksa item'a özel mi (override) olduğunu gösterir.",
          "Override olmayan ama rol tarafından gelen kural değiştirilemez — ancak override eklenerek üstüne yazılabilir.",
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
        title: "approval_status değerleri (auth kullanıcı attribute'ları için)",
        items: [
          "draft — Kullanıcı henüz kaydetmedi.",
          "pending — Admin onayı bekleniyor; approval_requests tablosunda bir kayıt oluşur.",
          "approved — Onaylandı, public görünebilir.",
          "rejected — Reddedildi.",
        ],
      },
      {
        title: "Admin attribute güncelleme akışı (auth kullanıcısı için)",
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
          "user_taxonomy_selections — Auth kullanıcısının seçtiği option'ların listesi.",
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
          "catalog_item_section_overrides — Katalog item bazında section görünürlük override'ı: section_key, is_visible, display_order.",
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
          "/admin/new-member/profile-sections ekranından auth kullanıcı section sıralaması ve aktiflik durumu yönetilir.",
          "admin_upsert_role_profile_section_rule RPC ile rol bazında section kuralları güncellenir.",
          "Katalog item'lar için: /admin/data → Rol & Kurallar tab'ı → Section listesinde toggle → admin_upsert_catalog_item_section_override RPC.",
          "Katalog item section override'ını kaldırmak için aynı listede 'Varsayılana dön' → admin_delete_catalog_item_section_override RPC.",
        ],
      },
    ],
  },
  {
    heading: "10. Katalog Kayıtları ve Unified View",
    tag: "Katalog",
    sections: [
      {
        title: "Unified view nedir?",
        items: [
          "Admin Katalog ekranı (/admin/data) hem auth kullanıcı profillerini (kind: profile) hem dışarıdan içe aktarılmış sahipsiz kayıtları (kind: catalog_item) tek bir tabloda gösterir.",
          "Arka planda admin_list_unified_records RPC çalışır; catalog_items ve profiles tablolarını union all ile birleştirir.",
          "Tür filtresiyle sadece katalog kayıtları (catalog_item) veya sadece kullanıcı profilleri (profile) gösterilebilir.",
          "Server-side sayfalama desteklenir; sayfa başına maksimum 100 kayıt döner.",
        ],
      },
      {
        title: "Katalog kaydı nedir ve nasıl oluşur?",
        items: [
          "Katalog kaydı: sisteme auth kullanıcısı yaratılmadan, ham veri olarak içe aktarılan bir profildir. Örnek: CSV'den yüklenen doktor, diş hekimi listeleri.",
          "İçe aktarma sırasında catalog-role-import-map.json kural dosyası hangi CSV sütununun hangi alana eşleşeceğini belirler.",
          "Katalog kayıtları public olarak /directory/catalog/:slug adresinde görünür ve henüz bir kullanıcıya bağlı değildir.",
          "Katalog kaydına platform rolü atandığında o rolün tüm attribute, feature ve section kuralları otomatik uygulanır.",
        ],
      },
      {
        title: "Claim (Sahiplenme) mekanizması",
        items: [
          "Giriş yapmış bir kullanıcı, kendine ait olduğunu düşündüğü bir katalog kaydının detay sayfasında 'Sahiplen' (Claim) butonuna basar.",
          "Bu işlem submit_catalog_claim_request RPC'yi çağırır ve catalog_claim_requests tablosuna 'pending' statüsünde kayıt oluşturur.",
          "Admin, /admin/data ekranında ilgili item'ı açar → Talepler tab'ına geçer → bekleyen claim'i görür.",
          "Claim listesinde: talepte bulunanın adı, e-postası, claim tipi, notu, talep tarihi ve statüsü görünür.",
          "Onayla → admin_approve_catalog_claim RPC → kullanıcıya 'editor' membership yetkisi verilir; katalog kaydı artık o kullanıcı tarafından düzenlenebilir hale gelir.",
          "Reddet → admin_reject_catalog_claim RPC → talep reddedilir, kayıt değişmez.",
        ],
      },
      {
        title: "Editör yetki yönetimi",
        items: [
          "Katalog item'ın Düzenleyiciler tab'ında o kayda düzenleme yetkisi olan tüm kullanıcılar listelenir.",
          "Membership rolleri: owner (tam yetki), manager, editor, contributor, viewer.",
          "Admin kullanıcı adı veya e-posta arama ile yeni editör ekleyebilir (admin_grant_catalog_editor RPC).",
          "Mevcut bir editörün yetkisini iptal etmek için aynı listede revoke işlemi yapılır (admin_revoke_catalog_editor RPC).",
          "Claim onaylandığında editör yetkisi otomatik verilir; bu tab'dan takip edilebilir.",
        ],
      },
    ],
  },
  {
    heading: "11. Tam Süreç Akışları",
    tag: "Süreç Akışları",
    sections: [
      {
        title: "Yeni auth kullanıcısı kayıt ve rol atama",
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
        title: "Katalog item oluşturma, rol atama ve kural yönetimi",
        items: [
          "1. Geliştirici ekibi CSV importer ile katalog kaydını catalog_items tablosuna yükler (platform_role_key boş veya CSV'den gelir).",
          "2. Admin → /admin/data → ilgili katalog item'ını bul.",
          "3. Satıra tıkla → Rol & Kurallar tab'ına geç → uygun rolü seç → 'Rolü Kaydet'.",
          "4. Rol kaydedilince o rolün attribute, feature ve section'ları listelenir.",
          "5. Gerekirse inherited kuralların üstüne item-level override ekle (toggle, label düzenleme).",
          "6. Override kaldırmak için ilgili satırda 'Varsayılana dön' butonunu kullan.",
        ],
      },
      {
        title: "Claim onaylama ve editör yetkisi verme",
        items: [
          "1. Kullanıcı /directory/catalog/:slug sayfasında 'Sahiplen' butonuna basar.",
          "2. Admin → /admin/data → ilgili item'ı aç → Talepler tab'ı.",
          "3. Bekleyen talebi gör: talep eden kişi, tarih, not.",
          "4. 'Onayla' butonuna bas → admin_approve_catalog_claim RPC → kullanıcıya editor membership verilir.",
          "5. Düzenleyiciler tab'ından onaylanan kullanıcının editor olarak eklendiğini doğrula.",
          "6. Gerekirse kullanıcının yetki seviyesini (editor → manager vb.) elle ayarla.",
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
          "Aynı problem birden fazla kayıtta varsa genel kuralı Rol Yönetimi tarafında düzeltmek daha temizdir — her item'a tek tek override eklemek bakımı zorlaştırır.",
          "Katalog item'a rol atamadan önce o rolün attribute/feature/section kural setini AFS Önizleme'den kontrol et.",
          "Rol değişikliği yaptığında kaydın gerçek deneyimini profil akışında veya katalog detay sayfasında test et.",
          "Claim onaylarken talep eden kullanıcının gerçekten o kayıtla ilgili biri olduğunu doğrula; gerekirse notu oku.",
          "Onboarding import değişiklikleri canlı akışı etkileyebilir; mapping ve hedef alan kontrolünü ikinci kez doğrulamak güvenlidir.",
        ],
      },
      {
        title: "Dokunmadan önce bil",
        items: [
          "Dual auth sistemi: admin_users tablosu (eski) + user_profiles_v2 (yeni) eş zamanlı çalışıyor. Profil mantığını değiştirmeden önce sor.",
          "Supabase client çift kaynak: integrations/supabase/client.ts (tip tanımlı, tercih et) ve lib/supabase.ts (re-export). Yeni kod için integrations/ kullan.",
          "Supabase migration'ları asla sil veya yeniden sırala; sadece yeni migration ekle.",
          "SEO kilitli URL'ler: /lansman, /cadde, /19051919, /anket — bu path'leri değiştirme.",
          "TypeScript strict: false kasıtlı. Yeni kod strict:true gibi yaz ama mevcut koda dokunurken tip hatası bekle.",
          "catalog_items.platform_role_key değiştirildiğinde o item'a bağlı tüm override'lar korunur ama artık yeni rolle uyumsuz olabilir — rol değişimi sonrası override listesini gözden geçir.",
          "Feature çözümü debug: kullanıcı veya katalog item feature göremiyorsa sırayla kontrol et → override var mı? → role_default var mı? → global kapalı mı?",
        ],
      },
    ],
  },
  {
    heading: "13. Sistem Mimarisi — 10 Maddelik Genel Özet",
    tag: "Mimari",
    sections: [
      {
        title: "1. Genel Model: Her Şey Bir Kayıt",
        items: [
          "Platformdaki tüm varlıklar — ister gerçek kullanıcı, ister CSV'den içe aktarılmış doktor listesi olsun — catalog_items veya profiles tablosundan birinde bir kayıt olarak yaşar.",
          "Admin ekranında (/admin/data) her iki tablo admin_list_unified_records RPC aracılığıyla kind: 'catalog_item' | 'profile' ayrımıyla tek bir unified listede gösterilir.",
          "Bir katalog kaydı gerçek bir kullanıcıya bağlandığında (person_profile_details.linked_profile_id) iki kayıt aynı kişiyi temsil eder ama birleştirilmez — bağlantı takip edilir.",
        ],
      },
      {
        title: "2. Rol Sistemi: 82 Rol, İki Katman",
        items: [
          "Platformda toplamda 82 aktif rol tanımlıdır (roles tablosu). Bunlar iki farklı katmanda kullanılır.",
          "Auth kullanıcıları için (RolesGo sistemi): user_role_assignments tablosu. Legacy: user_profiles.profile_type alanı (bireysel, danisman, isletme, kurulus-dernek, blogger-vlogger-youtuber, sehir-elcisi). İki sistem şu an paralel yürür.",
          "Katalog item'lar için: catalog_items.platform_role_key kolonu — doğrudan roles.key'e referans verir. Admin /admin/data → Rol & Kurallar tab'ından admin_set_catalog_item_role RPC ile atanır.",
          "Rol aileleri: User (5), Admin (3), Consultant (11), Organization (8), Business (26), Healthcare (7), Event (3), Job (4), Community (5), Marketplace (5) + orijinal 6 legacy rol.",
        ],
      },
      {
        title: "3. Attribute Sistemi: Üç Katmanlı Form Alanı Modeli",
        items: [
          "attribute_catalog → Tüm sistemdeki attribute sözlüğü (key, label, data_type, is_active).",
          "role_attribute_rules → Hangi attribute hangi rolde aktif? (is_enabled, is_required, is_public_default, user_can_edit, user_can_hide, requires_admin_approval_on_change, sort_order).",
          "user_profile_attributes → Auth kullanıcısının gerçek değeri (value_text, value_json, visibility: public/private, approval_status).",
          "catalog_item_attribute_overrides → Katalog item'ın rol kuralının üstüne yazan item-level istisna (is_enabled, display_order, override_label). isOverride rozeti inherited/override ayrımını gösterir.",
          "Veri tipleri: text, textarea, json, multi_select (value_json array), boolean (value_json). approval_status akışı: draft → pending → approved | rejected.",
        ],
      },
      {
        title: "4. Feature Flag Sistemi: Üç Katmanlı Çözümleme",
        items: [
          "feature_catalog → Tüm feature sözlüğü (key, label, is_active_globally).",
          "role_feature_flags → Hangi feature hangi rolde açık?",
          "user_feature_overrides / catalog_item_feature_overrides → Kullanıcı veya item bazlı admin istisnası (her zaman kazanır).",
          "Çözümleme önceliği (yüksekten düşüğe): 1. override, 2. role_default, 3. fallback (false).",
          "Runtime'da get_current_user_features RPC çağrılır; her feature için { isEnabled, source } döner. RequireFeature bileşeni buna göre render eder.",
        ],
      },
      {
        title: "5. Profile Section Sistemi: Profil Bölümü Görünürlüğü",
        items: [
          "profile_section_catalog → Mevcut section'lar (key, label, section_area, sort_order, is_active).",
          "role_profile_section_rules → Hangi section hangi rolde görünür? (is_enabled, sort_order).",
          "catalog_item_section_overrides → Katalog item bazında görünürlük istisnası (is_visible, display_order).",
          "selfSectionKeys — kullanıcının kendi düzenleme ekranındaki bölümler: summary, common_attributes, role_attributes, taxonomy, requests, dashboard.",
          "publicSectionKeys — ziyaretçinin profil sayfasında gördükleri: hero, about, expertise/services/focus/platform/city, taxonomy, contact.",
        ],
      },
      {
        title: "6. Taxonomy Sistemi: Dinamik Kategori Seçimi",
        items: [
          "taxonomy_groups → Kategori grupları (örn: 'Uzmanlık Alanı', 'Sektör').",
          "taxonomy_options → Grup içindeki seçenekler (örn: 'Fintech', 'Sağlık').",
          "role_taxonomy_rules → Hangi grup hangi rolde aktif? Seçim modu (single/multiple).",
          "user_taxonomy_selections → Kullanıcının seçtiği option'lar.",
          "Rol değişiminde mevcut seçimler korunur ama yeni rolün aktif grupları farklılaşabilir. danisman rolü expertise_area grubunu zorunlu görebilirken bireysel görmez.",
        ],
      },
      {
        title: "7. Katalog Item Altyapısı: Unified Veri Modeli",
        items: [
          "8 item tipi: advisor, organization, business, event, marketplace_listing, job_posting, community_group, person_profile.",
          "Her item tipine ait detay tablosu: advisor_details, business_details, event_details, job_posting_details, community_group_details, person_profile_details vb.",
          "Yan tablolar: catalog_item_locations, catalog_item_contacts, catalog_item_media, catalog_item_links, catalog_item_categories, catalog_item_tags, catalog_item_services, source_records (hangi CSV/API'den geldi), catalog_audit_logs.",
          "platform_role_key: Her item bir roles tablosu key'iyle eşleştirilir. Bu atama yapılınca o rolün attribute/feature/section kural seti item'a otomatik uygulanır.",
        ],
      },
      {
        title: "8. Claim (Sahiplenme) Mekanizması",
        items: [
          "Kullanıcı /directory/catalog/:slug sayfasında 'Sahiplen' butonuna basar → submit_catalog_claim_request RPC → catalog_claim_requests tablosuna 'pending' kayıt.",
          "Admin /admin/data → item'ı aç → Talepler tab'ı → bekleyen talebi görür (talep eden kişi, tarih, not, statü).",
          "Onayla → admin_approve_catalog_claim RPC → catalog_item_memberships'e 'editor' yetkisi verilir.",
          "Reddet → admin_reject_catalog_claim RPC → kayıt değişmez.",
          "Membership rolleri: owner, manager, editor, contributor, viewer. Admin ayrıca admin_grant_catalog_editor ile manuel editör ekleyebilir.",
        ],
      },
      {
        title: "9. Auth Kullanıcısı Akışı",
        items: [
          "Kayıt (/lansman veya /login) → Supabase Auth → profiles tablosuna kayıt (profile_type = 'bireysel' default).",
          "Admin → /admin/new-member/users-roles → kullanıcıyı bul → Details → rol ata → admin_set_user_role RPC → user_role_assignments güncellenir.",
          "Kullanıcının sonraki oturumunda get_current_user_features() yeni role göre döner → RequireFeature bileşeni feature durumuna göre UI render eder.",
          "Auth katmanı: AuthProvider (session), RequireAuth (route guard), RequireFeature (feature guard), useFeatureFlags() (runtime RPC).",
          "Dual sistem uyarısı: admin_users (eski) + user_profiles_v2 (yeni) eş zamanlı çalışıyor. Profil mantığına dokunmadan önce her ikisini kontrol et.",
        ],
      },
      {
        title: "10. Admin Operasyon Yüzeyi ve Kritik Kurallar",
        items: [
          "Loginli Üyeler & Roller (/admin/new-member/users-roles): Auth kullanıcısına rol atar, attribute düzenler.",
          "Rol Yönetimi (/admin/new-member/role-management): Rol bazında attribute/feature/section kuralı tanımlar. Değişiklik o roldeki TÜM kayıtlara yansır.",
          "Feature Override (/admin/new-member/overrides): Tek kullanıcıya özel feature istisnası.",
          "Katalog Unified (/admin/data): Tüm catalog_item + profile kayıtları; rol ata, override ekle, claim yönet, editör ata.",
          "Override ilk çözüm değil son çaredir. Aynı sorun birden fazla kayıtta varsa Rol Yönetimi'nde genel kuralı düzelt.",
          "Katalog item'a rol atandıktan sonra o rolün kural tabloları doluysa attribute/feature/section listesi otomatik gelir; boşsa liste boş görünür — önce Rol Yönetimi'nde kuralları tanımla.",
          "Supabase migration'ları asla silinmez veya yeniden sıralanmaz. SEO kilitli URL'ler (/lansman, /cadde, /19051919, /anket) değiştirilemez.",
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
            Yeni üyeler menüsündeki ve katalog ekranlarındaki tüm operasyon
            yüzeylerinin ne işe yaradığını, unified kayıt modelini, rol/attribute/feature/section
            hiyerarşisini, claim mekanizmasını ve kritik kısıtlamaları bu sayfada
            madde madde bulabilirsin.
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
