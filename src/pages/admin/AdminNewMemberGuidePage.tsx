import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchCatalogRows, type CatalogRow } from "@/lib/role-catalog";

type RoleRow = { key: string; label: string; sort_order: number; is_active: boolean };

const ruleLegendItems = [
  "A: Aktif",
  "F: Feature",
  "Z: Zorunlu",
  "P: Public",
  "D: Düzenler",
  "G: Global / Gizler",
  "O: Onay",
  "R: Rol",
  "S: Sıra",
] as const;

type GuideSection = { title: string; items: readonly string[] };
type GuideBlock = { heading: string; tag?: string; sections: GuideSection[] };
type GuideNavSection = { title: string; id: string };
type GuideNavItem = { heading: string; id: string; sections: GuideNavSection[] };

const blocks: GuideBlock[] = [
  {
    heading: "0. Hızlı Başlangıç — Yeni Sisteme Genel Bakış",
    tag: "Başlangıç",
    sections: [
      {
        title: "RolesGo sistemi ne yapar?",
        items: [
          "Sistemdeki her üye veya katalog kaydına bir 'platform rolü' atanır. Bu rol, o kişinin hangi özelliklere erişeceğini, profilinde hangi alanların görüneceğini ve hangi kart bölümlerinin gösterileceğini belirler.",
          "3 katman vardır: Rol (kim?), Attribute (hangi profil alanları?), Feature (hangi özellikler?). Bunları birbirinden bağımsız yönetebilirsin.",
          "Sistemin tamamını tek bir ekranda görmek için: RolesGo Genel Bakış (/admin/new-member/roles-overview). Soldaki listeden bir item, ortadaki listeden bir rol seçerek o kombinasyonun tam detayını altta görebilirsin.",
        ],
      },
      {
        title: "Hangi ekran ne zaman açılır?",
        items: [
          "Sisteme ilk defa bakıyorum veya genel durumu anlamak istiyorum → RolesGo Genel Bakış (/admin/new-member/roles-overview)",
          "Bir üyenin rolünü değiştirmek veya attribute verisine bakmak istiyorum → Profil ve Rol Atama (/admin/new-member/profile-role-assignment)",
          "Bir rolün tüm kurallarını (attribute, feature, section) düzenlemek istiyorum → Tüm Roller AFS Matrisi (/admin/new-member/role-matrix)",
          "Tek bir kişiye özel istisna feature vermek istiyorum → Feature Override (/admin/new-member/overrides)",
          "Katalog kaydının (şirket, kuruluş vb.) platform rolünü veya attribute değerlerini değiştirmek istiyorum → Veritabanı (/admin/data)",
        ],
      },
    ],
  },
  {
    heading: "1. Adım Adım: Yeni Üye Geldiğinde Ne Yapılır?",
    tag: "Üye Yönetimi",
    sections: [
      {
        title: "Adım 1 — Üyeyi bul",
        items: [
          "/admin/new-member/profile-role-assignment sayfasını aç.",
          "Arama kutusuna üyenin adını veya e-posta adresini yaz.",
          "Listeden ilgili kaydı tıkla — sağ tarafta detay paneli açılır.",
        ],
      },
      {
        title: "Adım 2 — Rolü kontrol et ve gerekirse değiştir",
        items: [
          "Detay panelinde 'Platform Rolü' alanını gör.",
          "Yanlış rol atanmışsa 'Rol Değiştir' butonuna tıkla, listeden doğru rolü seç.",
          "Kaydet. Bu işlem user_role_assignments tablosuna yazar; kullanıcı bir sonraki oturumunda yeni rolü alır.",
          "Dikkat: rol değişikliği feature, attribute ve section davranışını birlikte etkiler — sadece etiket değildir.",
        ],
      },
      {
        title: "Adım 3 — Attribute verisini kontrol et",
        items: [
          "Detay panelinde attribute listesini gör. Her satırda değer, visibility ve approval_status bulunur.",
          "Bir değer yanlışsa satır üzerinde düzenleme yapabilirsin; kayıt admin_update_user_profile_attribute RPC'si ile yazılır.",
          "Kullanıcı bir alanı doldurmuş ama 'onay bekliyor' durumundaysa approval_status'u buradan güncelle.",
        ],
      },
      {
        title: "Adım 4 — Tüm adımlar sonunda kontrol",
        items: [
          "RolesGo Genel Bakış'a (/admin/new-member/roles-overview) geçip üyenin kaydını sol listede bul.",
          "Atadığın rolü orta listeden seç — alt panelde attribute, feature ve section kuralları görünür.",
          "Beklenen yapıyla uyuşuyor mu kontrol et. Uyuşmuyorsa role-matrix'e geçip o rolün kurallarını düzelt.",
        ],
      },
    ],
  },
  {
    heading: "2. Adım Adım: Rol Kurallarını Düzenlemek (AFS Matrisi)",
    tag: "Rol Kuralları",
    sections: [
      {
        title: "Bir rolün attribute kuralını değiştirmek",
        items: [
          "/admin/new-member/role-matrix?kind=attribute adresine git.",
          "Üst filtreden düzenlemek istediğin rolü seç.",
          "Tabloda ilgili attribute satırını bul. A (aktif), Z (zorunlu), P (public) sütunlarını toggle ile değiştir.",
          "Değişiklik anında kaydedilir — sayfa yenilemeye gerek yok.",
          "Kontrol için RolesGo Genel Bakış'ta o rolü seçerek alt panelden sonucu gör.",
        ],
      },
      {
        title: "Bir rolün feature flag'ini değiştirmek",
        items: [
          "/admin/new-member/role-matrix?kind=feature adresine git.",
          "Rolü seçtikten sonra feature satırlarını gör.",
          "Toggle ile feature'ı aç veya kapat; admin_set_role_feature_flag RPC çağrılır.",
          "Bu değişiklik o role sahip tüm kullanıcıları etkiler. Yalnızca tek kişiyi etkilemek istiyorsan override kullan (bakınız Bölüm 5).",
        ],
      },
      {
        title: "Bir rolün profil section'ını değiştirmek",
        items: [
          "/admin/new-member/role-matrix?kind=profile_section adresine git.",
          "Rolü seçip section satırını toggle ile aç/kapat; admin_upsert_role_profile_section_rule RPC çağrılır.",
          "Section = public/self profil kartında görünen blok. Feature ile karıştırma: feature 'yapabilmek', section 'görünmek' demektir.",
        ],
      },
    ],
  },
  {
    heading: "3. Adım Adım: Katalog Kaydı Yönetimi",
    tag: "Katalog",
    sections: [
      {
        title: "Bir şirket / kuruluş kaydında sorun gördüğünde",
        items: [
          "/admin/data adresine git.",
          "Arama veya filtre ile kaydı bul ve tıkla.",
          "Platform rolünü kontrol et — yanlışsa değiştir.",
          "Attribute değerlerini kontrol et (catalog_item_attribute_values). Bu, auth kullanıcı attribute'undan (user_profile_attributes) farklı bir tablodur; karıştırma.",
          "Sahip/editör ilişkisi (claim ve editor yetkisi) varsa aynı ekran içinden yönet.",
        ],
      },
      {
        title: "Claim isteği onaylarken",
        items: [
          "/admin/approvals adresine git.",
          "Onay bekleyen kaydı listede bul.",
          "Claim detayını incele: hangi katalog kaydı için, kim istemiş.",
          "Onayla veya reddet. Onaylama, catalog_item_claims tablosuna yazar ve ilgili kullanıcıya editör yetkisi verir.",
        ],
      },
    ],
  },
  {
    heading: "4. Hangi Ekran Ne İşe Yarıyor?",
    tag: "Ekranlar",
    sections: [
      {
        title: "Veritabanı menüsü — güncel operasyon yüzeyi",
        items: [
          "RolesGo Genel Bakış (/admin/new-member/roles-overview): Tüm item'lar, roller ve entity'ler tek sayfada. Seçim yaparak örnek case detayını gör. Sisteme yeni başlarken buradan başla.",
          "Veritabanı (/admin/data): Katalog kayıtlarını (catalog_items) listeler; attribute değerlerini, görünürlük bilgisini, linked_user_id ilişkisini ve operasyon özetini buradan yönetirsin.",
          "Profil ve Rol Atama (/admin/new-member/profile-role-assignment): Catalog kayıtlarını ve bağlı auth kullanıcılarını birlikte görürsün. Hızlı rol değişikliği, claim ve editor yönetimi için kullan.",
          "Tüm Roller AFS Matrisi (/admin/new-member/role-matrix): Seçili rol için attribute, feature ve section kurallarını tek tabloda yönet. URL filtresi: ?kind=attribute | ?kind=feature | ?kind=profile_section.",
          "Feature Override (/admin/new-member/overrides): Tek bir auth kullanıcısı için rol varsayımını bozmadan özel feature istisnası yazarsın.",
          "Kullanım Kılavuzu (/admin/new-member/guide): Bu sayfa — rehber ve referans kataloglarını tek akışta toplar.",
        ],
      },
      {
        title: "Hangi sorunda nereye gitmelisin?",
        items: [
          "Sistemi genel olarak anlamak istiyorum → RolesGo Genel Bakış (/admin/new-member/roles-overview)",
          "Kullanıcının rolü yanlışsa → /admin/new-member/profile-role-assignment",
          "Aynı rol altındaki herkes yanlış davranıyorsa → /admin/new-member/role-matrix",
          "Sorun tek kişideyse → /admin/new-member/overrides",
          "Sorun public profil kart parçasıysa → role-matrix içindeki section satırı (?kind=profile_section)",
          "Sorun katalog kaydına özelse → /admin/data içinde attribute değerlerini ve metadata özetini kontrol et",
        ],
      },
    ],
  },
  {
    heading: "5. Auth kullanımı nasıl çalışıyor?",
    tag: "Auth",
    sections: [
      {
        title: "İki farklı auth kapısı var",
        items: [
          "Tüm uygulama AuthProvider ile sarılı; Supabase session dinlenir, getSession() ile ilk oturum restore edilir, context'e session + user + isLoading verilir.",
          "Public tarafta RequireAuth sadece belli rotalarda kullanılır: /profile, /profile/:type, /cadde ve bazı editor akışlarında.",
          "Admin tarafı Route seviyesinde RequireAuth ile sarılı değil; /admin altında giriş ve admin kontrolünü AdminLayout kendi içinde yapar.",
          "AdminLayout önce Supabase session var mı diye bakar, sonra userIsAdmin() ile admin_users tablosunda kullanıcıyı doğrular; admin değilse ekran açılmaz.",
        ],
      },
      {
        title: "Feature guard nerede devreye giriyor?",
        items: [
          "RequireFeature component'i useFeatureFlags() hook'unu kullanır.",
          "useFeatureFlags() auth kullanıcısı varsa get_current_user_features RPC'sini çağırır; her feature için isEnabled + source bilgisini toplar.",
          "Source: override → role_default → fallback sırasıyla normalize edilir.",
          "Örnek: /cadde rotası hem RequireAuth hem RequireFeature(cadde.access) ile korunur.",
        ],
      },
      {
        title: "Pratik auth notları",
        items: [
          "Admin olması gereken ama /admin'e giremeyen hesapta önce session'ı değil admin_users kaydını kontrol et.",
          "Public directory profil rotası /directory/profile/:userId olarak açık; auth zorunlu varsayma.",
          "AuthProvider ayrı, admin yetkisi ayrı kavramdır: login olmak admin olmak demek değildir.",
        ],
      },
    ],
  },
  {
    heading: "6. Rol kullanımı nasıl çalışıyor?",
    tag: "Rol",
    sections: [
      {
        title: "Bugünkü write path",
        items: [
          "Catalog kayıtları /admin/new-member/profile-role-assignment veya /admin/data üzerinden listelenir.",
          "Aktif rol ataması admin_set_user_role RPC ile yazılır.",
          "Rol seçimi runtime'da user_role_assignments ve ilgili rol kurallarıyla birlikte davranışa yansır.",
          "Profil ve Rol Atama ekranında linked_user_id üzerinden auth bağlantısı da yönetilir.",
        ],
      },
      {
        title: "Rol değişikliği neyi etkiler?",
        items: [
          "Kullanıcının göreceği feature set'i değişir.",
          "Role bağlı attribute kuralları değişebilir.",
          "Role bağlı profile section kuralları değişebilir.",
          "Bu yüzden rol değişikliği yalnızca etiket değil, tüm deneyimi etkileyen ana karar katmanıdır.",
        ],
      },
      {
        title: "Ne zaman rol değiştirilmeli?",
        items: [
          "Kullanıcının genel deneyimi yanlışsa rol değiştir.",
          "Sadece tek bir yetki farklı olsun istiyorsan rol değiştirme; override kullan.",
          "Katalog item için platform rolü atayacaksan bunu /admin/data ekranında item bazında yap.",
        ],
      },
    ],
  },
  {
    heading: "7. Profil ve attribute kullanımı",
    tag: "Profil",
    sections: [
      {
        title: "Profil ve Rol Atama ekranında ne yönetiliyor?",
        items: [
          "/admin/new-member/profile-role-assignment, catalog_items + linked_user_id + user_role_assignments okuması yapıyor.",
          "Rol seçici vardır; aynı ekrandan rol değişikliği yapılabilir.",
          "Attribute listesi user_profile_attributes verisini afs_attributes ile birlikte gösterir.",
          "Admin burada değer, visibility ve onay bağlamını birlikte görür; kayıt admin_update_user_profile_attribute RPC'si ile yazılır.",
          "Aynı ekranda kullanıcıya bağlı temel profil verisi ve rol davranışı birlikte takip edilir.",
        ],
      },
      {
        title: "Attribute katmanları",
        items: [
          "afs_attributes: alan sözlüğü (tüm tanımlar).",
          "role_attributes: o rolde alanın aktifliği, zorunluluğu, public varsayımı ve düzenlenebilirliği.",
          "user_profile_attributes: auth kullanıcısının gerçek değeri, visibility ve approval_status bilgisi.",
          "catalog_item_attribute_values: katalog item'larına ait ayrı bir attribute katmanı; auth kullanıcı attribute kaydıyla aynı şey değildir.",
        ],
      },
      {
        title: "Operasyon kararı",
        items: [
          "Sorun form alanı kuralıysa role-matrix ekranında (?kind=attribute) düzelt.",
          "Sorun kullanıcının kendi girdiği veriyse profile-role-assignment içinde düzelt.",
          "Sorun sadece bir katalog item'a özelse /admin/data içinden attribute değerini veya metadata kaydını düzelt.",
        ],
      },
    ],
  },
  {
    heading: "8. Feature kullanımı",
    tag: "Feature",
    sections: [
      {
        title: "Bugünkü feature çözümleme mantığı",
        items: [
          "Runtime okuması get_current_user_features RPC ile yapılır.",
          "Rol bazlı feature değişikliği admin_set_role_feature_flag RPC ile kaydedilir.",
          "Tek kullanıcı override'ı admin_set_user_feature_override_detailed RPC ile yazılır.",
          "Global feature toggle admin_set_feature_global_state RPC ile yönetilir.",
        ],
      },
      {
        title: "Nereden yönetilir?",
        items: [
          "Rolün genel feature kararı için /admin/new-member/role-matrix?kind=feature kullan.",
          "Tek kişiye özel istisna için /admin/new-member/overrides kullanılır.",
          "Katalog item ekranı feature istisnası vermez; feature davranışı rol veya kullanıcı override seviyesinde çözülür.",
        ],
      },
      {
        title: "Override ne zaman kullanılır?",
        items: [
          "Aynı feature sorunu birden fazla kişide varsa override yazma; rol seviyesinde çözüm ara.",
          "Override geçici veya istisnai operasyon içindir.",
          "Override eklendikten sonra neden alanını boş bırakmamak iyi pratiktir.",
        ],
      },
    ],
  },
  {
    heading: "9. Section kullanımı",
    tag: "Section",
    sections: [
      {
        title: "Section nedir?",
        items: [
          "Section, public veya self profil ekranında hangi kart parçasının görüneceğini belirleyen katmandır.",
          "Feature bir capability'dir; section görünüm parçasıdır. İkisi aynı şey değildir.",
        ],
      },
      {
        title: "Bugünkü section write path",
        items: [
          "Rol bazlı section kuralı admin_upsert_role_profile_section_rule RPC ile yazılır.",
          "Rol Matrisi ekranı (/admin/new-member/role-matrix?kind=profile_section) section satırlarının birleşik editörüdür.",
        ],
      },
      {
        title: "Ne zaman section değiştirilmeli?",
        items: [
          "Kullanıcı modülü kullanabilsin ama kartta görünmesin/görünsün kararı gerekiyorsa section tarafına bak.",
          "Kart içindeki alanın public/private davranışı section konusu değil, attribute konusudur.",
          "Section davranışı standart akışta rol seviyesinden yönetilir; item-level section override kullanılmaz.",
        ],
      },
    ],
  },
  {
    heading: "10. En sağlıklı operasyon sırası",
    tag: "Akış",
    sections: [
      {
        title: "Bir üyede sorun gördüğünde",
        items: [
          "1. /admin/new-member/profile-role-assignment ekranında kullanıcıyı bul.",
          "2. Rolü doğru mu kontrol et.",
          "3. Detay panelinde attribute verisini kontrol et.",
          "4. Sorun genel bir kural gibi görünüyorsa /admin/new-member/role-matrix ekranına geç.",
          "5. Sorun yalnızca bu kullanıcıdaysa /admin/new-member/overrides kullan.",
          "6. Public profil kart parçası sorunuysa section kuralını kontrol et (?kind=profile_section).",
        ],
      },
      {
        title: "Bir katalog kaydında sorun gördüğünde",
        items: [
          "1. /admin/data ekranında kaydı aç.",
          "2. Platform rolünü kontrol et.",
          "3. Gerekirse attribute değerini, sahip/editör ilişkisini veya claim durumunu güncelle.",
          "4. Claim veya editor yetkisi gerekiyorsa aynı kayıt içinden yönet.",
        ],
      },
    ],
  },
  {
    heading: "11. Kritik notlar",
    tag: "Kritik",
    sections: [
      {
        title: "Mevcut kod akışındaki gerçek durum",
        items: [
          "Admin auth guard'ı App.tsx route seviyesinde değil AdminLayout içinde çalışıyor.",
          "Ana editor artık role-matrix; eski /roles-features, /role-management, /roles-preview rotaları redirect yapıyor.",
          "Feature source sırası: override → role_default → fallback.",
          "Catalog item attribute katmanı (catalog_item_attribute_values) auth kullanıcı attribute'undan (user_profile_attributes) ayrıdır; karıştırma.",
        ],
      },
      {
        title: "Temiz sistem kuralı",
        items: [
          "Override ilk çözüm değil son çare olsun.",
          "Aynı kural birden çok kaydı etkiliyorsa rol seviyesinde düzelt.",
          "Rol değişikliğinden sonra profil, feature ve section davranışını test etmeden işlemi bitmiş sayma.",
        ],
      },
    ],
  },
];

const REFERENCE_SECTION_ID = "guide-reference-kataloglari";
const ROLE_LIST_SECTION_ID = "rol-listesi";
const ATTRIBUTE_SECTION_ID = "guide-reference-attribute-katalogu";
const FEATURE_SECTION_ID = "guide-reference-feature-katalogu";
const PROFILE_SECTION_ID = "guide-reference-bolum-katalogu-sections";

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getBlockId(heading: string) {
  return `guide-block-${slugify(heading)}`;
}

function getSectionId(heading: string, title: string) {
  return `guide-section-${slugify(heading)}-${slugify(title)}`;
}

const AdminNewMemberGuidePage = () => {
  const location = useLocation();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const [rolesResult, catalogResult] = await Promise.allSettled([
        supabase
          .from("roles")
          .select("key, label, sort_order, is_active")
          .order("sort_order"),
        fetchCatalogRows(),
      ]);
      if (!isMounted) return;
      if (rolesResult.status === "fulfilled" && !rolesResult.value.error) {
        setRoles((rolesResult.value.data ?? []) as RoleRow[]);
      }
      if (catalogResult.status === "fulfilled") {
        setCatalogRows(catalogResult.value);
      }
      setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const sortedRoles = useMemo(
    () =>
      [...roles].sort((a, b) => {
        const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return a.label.localeCompare(b.label, "tr-TR");
      }),
    [roles],
  );
  const attributes = catalogRows.filter((r) => r.kind === "attribute");
  const features = catalogRows.filter((r) => r.kind === "feature");
  const sections = catalogRows.filter((r) => r.kind === "profile_section");
  const roleCount = sortedRoles.length || 76;
  const attributeCount = attributes.length || 53;
  const featureCount = features.length || 42;
  const sectionCount = sections.length || 7;
  const targetSectionId = useMemo(
    () => location.hash.replace(/^#/, "") || new URLSearchParams(location.search).get("section") || "",
    [location.hash, location.search],
  );
  const navItems = useMemo<GuideNavItem[]>(
    () => [
      ...blocks.map((block) => ({
        heading: block.heading,
        id: getBlockId(block.heading),
        sections: block.sections.map((section) => ({
          title: section.title,
          id: getSectionId(block.heading, section.title),
        })),
      })),
      {
        heading: "Referans Katalogları",
        id: REFERENCE_SECTION_ID,
        sections: [
          { title: "Tüm Roller", id: ROLE_LIST_SECTION_ID },
          { title: "Attribute Kataloğu", id: ATTRIBUTE_SECTION_ID },
          { title: "Feature Kataloğu", id: FEATURE_SECTION_ID },
          { title: "Bölüm Kataloğu — Sections", id: PROFILE_SECTION_ID },
        ],
      },
    ],
    [],
  );

  useEffect(() => {
    if (!targetSectionId) return;

    const timeout = window.setTimeout(() => {
      document.getElementById(targetSectionId)?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [targetSectionId]);

  return (
    <AdminPageLayout className="max-w-7xl gap-10">
      <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-10">
        <aside className="sticky top-28 self-start">
          <nav className="rounded-3xl border border-border/60 bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              İçindekiler
            </p>
            <div className="space-y-0.5">
              {navItems.map((item, idx) => {
                const isHeadingActive = targetSectionId === item.id;
                const shortLabel = item.heading === "Referans Katalogları"
                  ? "Referans Katalogları"
                  : blocks[idx]?.tag
                    ? `${idx}. ${blocks[idx].tag}`
                    : item.heading;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block truncate rounded-lg px-2 py-1 text-xs font-medium leading-5 transition-colors ${
                      isHeadingActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/75 hover:bg-muted/60 hover:text-foreground"
                    }`}
                    title={item.heading}
                  >
                    {shortLabel}
                  </a>
                );
              })}
            </div>
          </nav>
        </aside>

        <div className="min-w-0 space-y-12">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Kullanım Kılavuzu
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Güncel kod akışına göre rol, profil, feature, attribute, section ve auth kullanımını tek yerde toplar.
                  Veritabanı menüsündeki güncel operasyon sırası burada özetlenir; canlı referans katalogları artık aynı sayfa akışında doğrudan görünür.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="self-start">
                <Link to="/admin/new-member/guide#rol-listesi">Rol Listesi</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {blocks.map((block) =>
                block.tag ? (
                  <Badge key={block.tag} variant="secondary" className="rounded-full text-xs">
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Rol", value: roleCount },
                { label: "Attribute", value: attributeCount },
                { label: "Feature", value: featureCount },
                { label: "Section", value: sectionCount },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3"
                >
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/70">
              Sayılar veritabanından canlı çekilir; veri yüklenene kadar referans
              değerler gösterilir (76 rol / 53 attribute / 42 feature / 7 section).
            </p>
          </section>

          <div className="space-y-12">
            {blocks.map((block) => (
              <section
                key={block.heading}
                id={getBlockId(block.heading)}
                className="scroll-mt-28 space-y-6"
              >
                <h2 className="border-b border-border/60 pb-3 text-lg font-semibold tracking-tight text-foreground">
                  {block.heading}
                </h2>
                <div className="space-y-6">
                  {block.sections.map((section) => (
                    <section
                      key={section.title}
                      id={getSectionId(block.heading, section.title)}
                      className="scroll-mt-28 space-y-3"
                    >
                      <h3 className="text-sm font-semibold text-foreground/80">{section.title}</h3>
                      <ul className="space-y-2">
                        {section.items.map((item) => (
                          <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section id={REFERENCE_SECTION_ID} className="scroll-mt-28 space-y-6">
            <h2 className="border-b border-border/60 pb-3 text-lg font-semibold tracking-tight text-foreground">
              Referans Katalogları
            </h2>
            <p className="text-sm text-muted-foreground">
              Veritabanından canlı çekilir. Sol menüden ilgili katalog bölümüne doğrudan atlayabilirsin.
            </p>

            {loading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor…</p>
            ) : (
              <div className="space-y-8">
                <section id={ROLE_LIST_SECTION_ID} className="scroll-mt-28 space-y-4">
                  <h3 className="text-base font-semibold text-foreground">Tüm Roller ({sortedRoles.length})</h3>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {sortedRoles.map((role) => (
                      <div
                        key={role.key}
                        className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-1.5 text-xs"
                      >
                        <span className="font-medium text-foreground">{role.label}</span>
                        <code className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                          {role.key}
                        </code>
                      </div>
                    ))}
                  </div>
                </section>

                <section id={ATTRIBUTE_SECTION_ID} className="scroll-mt-28 space-y-4">
                  <h3 className="text-base font-semibold text-foreground">
                    Attribute Kataloğu ({attributes.length})
                  </h3>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {attributes.map((a) => (
                      <div
                        key={a.key}
                        className="space-y-0.5 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground">{a.label}</span>
                          {a.dataType && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {a.dataType}
                            </Badge>
                          )}
                        </div>
                        <code className="text-muted-foreground">{a.key}</code>
                        {a.description && <p className="text-muted-foreground/70">{a.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>

                <section id={FEATURE_SECTION_ID} className="scroll-mt-28 space-y-4">
                  <h3 className="text-base font-semibold text-foreground">
                    Feature Kataloğu ({features.length})
                  </h3>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {features.map((f) => (
                      <div
                        key={f.key}
                        className="space-y-0.5 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground">{f.label}</span>
                          <Badge
                            variant={f.isActiveGlobally ? "default" : "secondary"}
                            className="shrink-0 text-[10px]"
                          >
                            {f.isActiveGlobally ? "Global Aktif" : "Pasif"}
                          </Badge>
                        </div>
                        <code className="text-muted-foreground">{f.key}</code>
                        {f.description && <p className="text-muted-foreground/70">{f.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>

                <section id={PROFILE_SECTION_ID} className="scroll-mt-28 space-y-4">
                  <h3 className="text-base font-semibold text-foreground">
                    Bölüm Kataloğu — Sections ({sections.length})
                  </h3>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {sections.map((s) => (
                      <div
                        key={s.key}
                        className="space-y-0.5 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground">{s.label}</span>
                          {s.sectionArea && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {s.sectionArea}
                            </Badge>
                          )}
                        </div>
                        <code className="text-muted-foreground">{s.key}</code>
                        {s.description && <p className="text-muted-foreground/70">{s.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AdminNewMemberGuidePage;
