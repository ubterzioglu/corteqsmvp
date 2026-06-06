import { useEffect, useState } from "react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { fetchCatalogRows, type CatalogRow } from "@/lib/role-catalog";

type RoleRow = { key: string; label: string; sort_order: number; is_active: boolean };

type RoleFamily = { family: string; label: string; roles: RoleRow[] };

const FAMILY_LABELS: Record<string, string> = {
  legacy: "Legacy (Eski Sistem)",
  User_: "Kullanıcı",
  Admin_: "Admin",
  Consultant_: "Danışman",
  Organization_: "Kuruluş",
  Business_: "İşletme",
  Healthcare_: "Sağlık",
  Event_: "Etkinlik",
  Job_: "İş",
  Community_: "Topluluk",
  Marketplace_: "Marketplace",
};

function getFamilyKey(key: string): string {
  const prefix = Object.keys(FAMILY_LABELS).find(
    (p) => p !== "legacy" && key.startsWith(p),
  );
  return prefix ?? "legacy";
}

function groupRoles(roles: RoleRow[]): RoleFamily[] {
  const map = new Map<string, RoleRow[]>();
  for (const role of roles) {
    const family = getFamilyKey(role.key);
    if (!map.has(family)) map.set(family, []);
    map.get(family)!.push(role);
  }
  return Array.from(map.entries()).map(([family, groupedRoles]) => ({
    family,
    label: FAMILY_LABELS[family] ?? family,
    roles: groupedRoles,
  }));
}

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

const blocks: GuideBlock[] = [
  {
    heading: "1. Hangi ekran ne işe yarıyor?",
    tag: "Menu",
    sections: [
      {
        title: "Veritabanı menüsü — güncel operasyon yüzeyi",
        items: [
          "Veritabanı (/admin/data): Katalog kayıtlarını (catalog_items) listeler; her kayda platform rolü atarsın, linked_user_id ile auth kullanıcısı bağlarsın, item-level override uygularsın. Operasyonun çoğu buradan yürür.",
          "Profil ve Rol Atama (/admin/new-member/profile-role-assignment): Catalog kayıtlarını ve bağlı auth kullanıcılarını birlikte görürsün. Hızlı rol değişikliği, claim ve editor yönetimi için kullan.",
          "Tüm Roller AFS Matrisi (/admin/new-member/role-matrix): Seçili rol için attribute, feature ve section kurallarını tek tabloda yönet. URL filtresi: ?kind=attribute | ?kind=feature | ?kind=profile_section.",
          "Taxonomy Yönetimi (/admin/new-member/taxonomy): Role bağlı taxonomy gruplarını ve kullanıcı seçimlerini yönetirsin.",
          "Feature Override (/admin/new-member/overrides): Tek bir auth kullanıcısı için rol varsayımını bozmadan özel feature istisnası yazarsın.",
          "Kullanım Kılavuzu (/admin/new-member/guide): Bu sayfa — canlı referans katalogları aşağıdaki açılır kartlarda.",
        ],
      },
      {
        title: "Yönlendirmeler — eski rotalar artık redirect yapıyor",
        items: [
          "/admin/new-member/users-roles → /admin/new-member/profile-role-assignment",
          "/admin/new-member/role-management → /admin/new-member/role-matrix",
          "/admin/new-member/roles-features → /admin/new-member/role-matrix?kind=feature",
          "/admin/new-member/attributes → /admin/new-member/role-matrix?kind=attribute",
          "/admin/new-member/profile-sections → /admin/new-member/role-matrix?kind=profile_section",
          "/admin/new-member/roles-preview ve /admin/new-member/entity-preview → /admin/new-member/role-matrix",
        ],
      },
      {
        title: "Hangi sorunda nereye gitmelisin?",
        items: [
          "Kullanıcının rolü yanlışsa: önce /admin/new-member/profile-role-assignment.",
          "Aynı rol altındaki herkes yanlış davranıyorsa: /admin/new-member/role-matrix.",
          "Sorun tek kişideyse: /admin/new-member/overrides.",
          "Sorun public profil kart parçasıysa: role-matrix içindeki section satırı (?kind=profile_section).",
          "Sorun katalog kaydına özelse: /admin/data > Rol & Kurallar.",
        ],
      },
    ],
  },
  {
    heading: "2. Auth kullanımı nasıl çalışıyor?",
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
    heading: "3. Rol kullanımı nasıl çalışıyor?",
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
          "Role bağlı taxonomy grupları değişebilir.",
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
    heading: "4. Profil ve attribute kullanımı",
    tag: "Profil",
    sections: [
      {
        title: "Profil ve Rol Atama ekranında ne yönetiliyor?",
        items: [
          "/admin/new-member/profile-role-assignment, catalog_items + linked_user_id + user_role_assignments okuması yapıyor.",
          "Rol seçici vardır; aynı ekrandan rol değişikliği yapılabilir.",
          "Attribute listesi user_profile_attributes verisini attribute_catalog ile birlikte gösterir.",
          "Admin burada değer, visibility ve onay bağlamını birlikte görür; kayıt admin_update_user_profile_attribute RPC'si ile yazılır.",
          "Aynı ekranda role göre taxonomy grupları da çekilir; değişiklik admin_update_user_taxonomy_selection RPC'si ile kaydedilir.",
        ],
      },
      {
        title: "Attribute katmanları",
        items: [
          "attribute_catalog: alan sözlüğü (tüm tanımlar).",
          "role_attribute_rules: o rolde alanın aktifliği, zorunluluğu, public varsayımı ve düzenlenebilirliği.",
          "user_profile_attributes: auth kullanıcısının gerçek değeri, visibility ve approval_status bilgisi.",
          "catalog_item_attributes: katalog item'larına ait ayrı bir attribute katmanı; auth kullanıcı attribute kaydıyla aynı şey değildir.",
        ],
      },
      {
        title: "Operasyon kararı",
        items: [
          "Sorun form alanı kuralıysa role-matrix ekranında (?kind=attribute) düzelt.",
          "Sorun kullanıcının kendi girdiği veriyse profile-role-assignment içinde düzelt.",
          "Sorun sadece bir katalog item'a özelse /admin/data içindeki item-level override'ı kullan.",
        ],
      },
    ],
  },
  {
    heading: "5. Feature kullanımı",
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
          "Katalog item'a özel feature istisnası gerekiyorsa /admin/data > Rol & Kurallar kullanılır.",
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
    heading: "6. Section kullanımı",
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
          "Tek bir item için farklı section davranışı gerekiyorsa /admin/data içindeki item-level override kullanılır.",
        ],
      },
    ],
  },
  {
    heading: "7. En sağlıklı operasyon sırası",
    tag: "Akış",
    sections: [
      {
        title: "Bir üyede sorun gördüğünde",
        items: [
          "1. /admin/new-member/profile-role-assignment ekranında kullanıcıyı bul.",
          "2. Rolü doğru mu kontrol et.",
          "3. Detay panelinde attribute ve taxonomy verisini kontrol et.",
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
          "3. Gerekirse item-level attribute / feature / section override uygula.",
          "4. Claim veya editor yetkisi gerekiyorsa aynı kayıt içinden yönet.",
        ],
      },
    ],
  },
  {
    heading: "8. Kritik notlar",
    tag: "Kritik",
    sections: [
      {
        title: "Mevcut kod akışındaki gerçek durum",
        items: [
          "Admin auth guard'ı App.tsx route seviyesinde değil AdminLayout içinde çalışıyor.",
          "Ana editor artık role-matrix; eski /roles-features, /role-management, /roles-preview rotaları redirect yapıyor.",
          "Feature source sırası: override → role_default → fallback.",
          "Catalog item attribute katmanı (catalog_item_attributes) auth kullanıcı attribute'undan (user_profile_attributes) ayrıdır; karıştırma.",
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

const AdminNewMemberGuidePage = () => {
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

  const roleGroups = groupRoles(roles);
  const attributes = catalogRows.filter((r) => r.kind === "attribute");
  const features = catalogRows.filter((r) => r.kind === "feature");
  const sections = catalogRows.filter((r) => r.kind === "profile_section");

  return (
    <AdminPageLayout className="max-w-5xl gap-10">
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Kullanım Kılavuzu
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Güncel kod akışına göre rol, profil, feature, attribute, section ve auth kullanımını tek yerde toplar.
            Veritabanı menüsündeki güncel operasyon sırası burada özetlenir; canlı referans katalogları sayfanın sonundaki açılır kartlardadır.
          </p>
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
                  <h3 className="text-sm font-semibold text-foreground/80">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
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

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="border-b border-border/60 pb-3 text-lg font-semibold tracking-tight text-foreground">
            Referans Katalogları
          </h2>
          <p className="pt-2 text-sm text-muted-foreground">
            Veritabanından canlı çekilir. İhtiyaç duyduğunda aç, kapat.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Yükleniyor…</p>
        ) : (
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="roles">
              <AccordionTrigger className="text-sm font-semibold">
                Tüm Roller ({roles.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-2">
                  {roleGroups.map((group) => (
                    <div key={group.family} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label} — {group.roles.length} rol
                      </p>
                      <div className="grid gap-1 sm:grid-cols-2">
                        {group.roles.map((role) => (
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
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="attributes">
              <AccordionTrigger className="text-sm font-semibold">
                Attribute Kataloğu ({attributes.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-1 pt-2 sm:grid-cols-2">
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
                      {a.description && (
                        <p className="text-muted-foreground/70">{a.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="features">
              <AccordionTrigger className="text-sm font-semibold">
                Feature Kataloğu ({features.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-1 pt-2 sm:grid-cols-2">
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
                      {f.description && (
                        <p className="text-muted-foreground/70">{f.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sections">
              <AccordionTrigger className="text-sm font-semibold">
                Bölüm Kataloğu — Sections ({sections.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-1 pt-2 sm:grid-cols-2">
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
                      {s.description && (
                        <p className="text-muted-foreground/70">{s.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </section>
    </AdminPageLayout>
  );
};

export default AdminNewMemberGuidePage;
