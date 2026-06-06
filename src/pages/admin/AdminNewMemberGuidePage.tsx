import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Badge } from "@/components/ui/badge";

const ruleLegendItems = [
  "A: Aktif",
  "F: Feature",
  "Z: Zorunlu",
  "P: Public",
  "D: Duzenler",
  "G: Global / Gizler",
  "O: Onay",
  "R: Rol",
  "S: Sira",
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
    heading: "1. Hangi ekran ne ise yariyor?",
    tag: "Menu",
    sections: [
      {
        title: "Veritabani menusu - bugunku ana operasyon yuzeyi",
        items: [
          "Veritabani (/admin/data): Auth profilleri ile catalog item kayitlarini ayni operasyon yuzeyinde gorur; rol ata, claim yonet, editor ver, item-level override uygularsin.",
          "Profil ve Rol Atama (/admin/new-member/profile-role-assignment): Veritabani ekraninin ayni operasyon akisini yeni uyeler baglaminda acar.",
          "Tum Roller (/admin/new-member/roles-list): Sistemdeki tum rol kayitlarini aile, key ve sort order bazinda denetlersin.",
          "Tum Roller AFS Matrisi (/admin/new-member/role-matrix): Rol bazli attribute + feature + profile section kuralini tek tabloda yonettigimiz ana ekrandir.",
          "Feature Override (/admin/new-member/overrides): Tek bir auth kullanicisi icin rol varsayimini bozmadan ozel feature istisnasi yazarsin.",
          "Taxonomy Yonetimi (/admin/new-member/taxonomy): Alt kategori, alt tip ve secilebilir taxonomy seceneklerini yonetirsin.",
          "Kullanim Klavuzu (/admin/new-member/guide): Guncel route ve operasyon sirasini tek sayfada aciklar.",
        ],
      },
      {
        title: "Yardimci ama hala aktif ekranlar",
        items: [
          "Uyelikle ilgili eski operasyon ekrani artik ust menude ayri bir baglanti olarak durur: /admin/members -> Uye Takibi (eski).",
          "/admin/new-member/users-roles, /role-management, /roles-preview ve /entity-preview route'lari redirect amacli durabilir; menudeki ana hedefler yeni route'lardir.",
          "/admin/new-member/profile-sections route'u ayri ayri section toggle etmek icin hala kullanilabilir.",
          "/admin/new-member/attributes ve /admin/new-member/roles-features route'lari yardimci redirect'lerdir; gundelik operasyonun buyuk kismi profile-role-assignment, role-matrix ve data icinden yurur.",
        ],
      },
      {
        title: "Hangi sorunda nereye gitmelisin?",
        items: [
          "Kullanicinin rolu yanlissa: once /admin/new-member/profile-role-assignment veya /admin/data.",
          "Ayni rol altindaki herkes yanlis davraniyorsa: /admin/new-member/role-matrix.",
          "Sorun tek kisideyse: /admin/new-member/overrides.",
          "Sorun rol sozlugunde veya aile dagilimindaysa: /admin/new-member/roles-list.",
          "Sorun public profil kart parcasiysa: role-matrix icindeki section satiri veya gerekirse /admin/new-member/profile-sections.",
          "Sorun katalog kaydina ozelse: /admin/data > Rol & Kurallar.",
        ],
      },
    ],
  },
  {
    heading: "2. Auth kullanimi nasil calisiyor?",
    tag: "Auth",
    sections: [
      {
        title: "Iki farkli auth kapisi var",
        items: [
          "Tum uygulama AuthProvider ile sarili; burada Supabase session dinlenir, getSession() ile ilk oturum restore edilir, context'e session + user + isLoading verilir.",
          "Public tarafta RequireAuth sadece belli rotalarda kullanilir: /profile, /profile/:type, /cadde ve bazi editor akislarinda.",
          "Admin tarafi Route seviyesinde RequireAuth ile sarili degil; /admin altinda giris ve admin kontrolunu AdminLayout kendi icinde yapar.",
          "AdminLayout once Supabase session var mi diye bakar, sonra userIsAdmin() ile admin_users tablosunda kullaniciyi dogrular; admin degilse admin ekrani acilmaz.",
        ],
      },
      {
        title: "Feature guard nerede devreye giriyor?",
        items: [
          "RequireFeature component'i useFeatureFlags() hook'unu kullanir.",
          "useFeatureFlags() auth kullanicisi varsa get_current_user_features RPC'sini cagirir ve her feature icin isEnabled + source bilgisini toplar.",
          "Source degeri bugun override, role_default veya fallback olarak normalize edilir.",
          "Ornek: /cadde rotasi hem RequireAuth hem RequireFeature(cadde.access) ile korunur.",
        ],
      },
      {
        title: "Pratik auth notlari",
        items: [
          "Admin olmasi gereken ama /admin'e giremeyen hesapta once session'i degil admin_users kaydini kontrol et.",
          "Public directory profil rotasi su an /directory/profile/:userId olarak acik; guide veya operasyon karari yazarken bu rotayi auth zorunlu varsayma.",
          "AuthProvider ayri, admin yetkisi ayri kavramdir: login olmak admin olmak demek degildir.",
        ],
      },
    ],
  },
  {
    heading: "3. Rol kullanimi nasil calisiyor?",
    tag: "Rol",
    sections: [
      {
        title: "Bugunku write path",
        items: [
          "Loginli kullanicilar user_profiles tablosundan listelenir.",
          "Aktif rol atamasi admin_set_user_role RPC ile yazilir.",
          "Rol secimi runtime'da user_role_assignments ve ilgili role kurallariyla birlikte davranisa yansir.",
          "Profil ve rol atama akisinda listeye ek olarak approval_requests ve user_feature_overrides sayilari da cekilir; bu sayede rol degisikliginden sonra ek is gerekip gerekmedigi gorulur.",
        ],
      },
      {
        title: "Rol degisikligi neyi etkiler?",
        items: [
          "Kullanicinin gorecegi feature set'i degisir.",
          "Role bagli taxonomy gruplari degisebilir.",
          "Role bagli attribute kurallari degisebilir.",
          "Role bagli profile section kurallari degisebilir.",
          "Bu yuzden rol degisikligi yalnizca etiket degil, tum deneyimi etkileyen ana karar katmanidir.",
        ],
      },
      {
        title: "Ne zaman rol degistirilmeli?",
        items: [
          "Kullanicinin genel deneyimi yanlissa rol degistir.",
          "Sadece tek bir yetki farkli olsun istiyorsan rol degistirme; override kullan.",
          "Katalog item icin rol atayacaksan bunu /admin/data ekraninda item bazinda yap.",
        ],
      },
    ],
  },
  {
    heading: "4. Profil ve attribute kullanimi",
    tag: "Profil",
    sections: [
      {
        title: "Details penceresinde ne yonetiliyor?",
        items: [
          "Users-roles ekranindaki Details, kullanicinin gercek profil verisini acan operasyon penceresidir.",
          "Profil ve Rol Atama akisi, kullanicinin gercek profil verisini acan operasyon penceresidir.",
          "Burada rol secici vardir; ayni kayit ekranindan rol degisikligi de yapilabilir.",
          "Attribute listesi user_profile_attributes verisini attribute_catalog ile birlikte gosterir.",
          "Admin burada deger, visibility ve onay baglamini birlikte gorur; kayit admin_update_user_profile_attribute RPC'si ile yazilir.",
          "Ayni pencerede role gore taxonomy gruplari da cekilir; degisiklik admin_update_user_taxonomy_selection RPC'si ile kaydedilir.",
        ],
      },
      {
        title: "Attribute katmanlari",
        items: [
          "attribute_catalog: alan sozlugu.",
          "role_attribute_rules: o rolde alanin aktifligi, zorunlulugu, public varsayimi ve duzenlenebilirligi.",
          "user_profile_attributes: auth kullanicisinin gercek degeri, visibility ve approval_status bilgisi.",
          "Katalog item tarafinda ayri bir item-level attribute override katmani vardir; bu auth kullanici attribute kaydiyla ayni sey degildir.",
        ],
      },
      {
        title: "Operasyon karari",
        items: [
          "Sorun form alani kuraliysa role-matrix ekraninda duzelt.",
          "Sorun kullanicinin kendi girdigi veriyse profile-role-assignment veya /admin/data icindeki detail akisinda duzelt.",
          "Sorun sadece bir katalog item'a ozelse /admin/data icindeki item-level override'i kullan.",
        ],
      },
    ],
  },
  {
    heading: "5. Feature kullanimi",
    tag: "Feature",
    sections: [
      {
        title: "Bugunku feature cozumleme mantigi",
        items: [
          "Runtime okumasi get_current_user_features RPC ile yapilir.",
          "Admin yazma akisinda rol bazli feature degisikligi admin_set_role_feature_flag RPC ile kaydedilir.",
          "Tek kullanici override'i admin_set_user_feature_override_detailed RPC ile yazilir.",
          "Global feature toggle admin_set_feature_global_state RPC ile yonetilir.",
        ],
      },
      {
        title: "Nereden yonetilir?",
        items: [
          "Rolun genel feature karari icin once /admin/new-member/role-matrix dusunulmeli.",
          "Tek kisiye ozel istisna icin /admin/new-member/overrides kullanilir.",
          "Legacy matrix gorunumu ve global/rol switch tablosu icin /admin/new-member/roles-features hala mevcuttur.",
          "Katalog item'a ozel feature istisnasi gerekiyorsa /admin/data > Rol & Kurallar kullanilir.",
        ],
      },
      {
        title: "Override ne zaman kullanilir?",
        items: [
          "Ayni feature sorunu birden fazla kiside varsa override yazma; rol seviyesinde cozum ara.",
          "Override gecici veya istisnai operasyon icin uygundur.",
          "Override eklendikten sonra neden alanini bos birakmamak iyi pratiktir; daha sonra neden verildigi anlasilir.",
        ],
      },
    ],
  },
  {
    heading: "6. Section kullanimi",
    tag: "Section",
    sections: [
      {
        title: "Section nedir?",
        items: [
          "Section, public veya self profil ekraninda hangi kart parcasinin gorunecegini belirleyen katmandir.",
          "Feature bir capability'dir; section ise gorunum parcasi. Ikisi ayni sey degildir.",
        ],
      },
      {
        title: "Bugunku section write path",
        items: [
          "Rol bazli section kurali admin_upsert_role_profile_section_rule RPC ile yazilir.",
          "Ayri ekran olarak /admin/new-member/profile-sections role_profile_section_rules tablosunu yonetir.",
          "Tum Roller AFS Matrisi ekraninda da section satirlari ayni mantigin birlesik editoru olarak yer alir.",
        ],
      },
      {
        title: "Ne zaman section degistirilmeli?",
        items: [
          "Kullanici o modulu kullanabilsin ama kartta gorunmesin/gorunsun karari gerekiyorsa section tarafina bak.",
          "Kart icindeki alanin public/private davranisi section konusu degil, attribute konusudur.",
          "Bir bolum herkes icin degil sadece bir item icin farkli olsun istiyorsan /admin/data tarafindaki item-level section override kullanilir.",
        ],
      },
    ],
  },
  {
    heading: "7. En saglikli operasyon sirasi",
    tag: "Akis",
    sections: [
      {
        title: "Bir uyede sorun gordugunde",
        items: [
          "1. /admin/new-member/profile-role-assignment veya /admin/data ekraninda kullaniciyi bul.",
          "2. Rol dogru mu kontrol et.",
          "3. Details icinde attribute ve taxonomy verisini kontrol et.",
          "4. Sorun hala rolde genel bir kural gibi gorunuyorsa /admin/new-member/role-matrix ekranina gec.",
          "5. Sorun yalnizca bu kullanicidaysa /admin/new-member/overrides kullan.",
          "6. Public profil kart parcasi sorunuysa section kuralini kontrol et.",
        ],
      },
      {
        title: "Bir katalog kaydinda sorun gordugunde",
        items: [
          "1. /admin/data ekraninda kaydi ac.",
          "2. Rol & Kurallar tab'inda platform rolunu kontrol et.",
          "3. Gerekirse item-level attribute / feature / section override uygula.",
          "4. Claim veya editor yetkisi gerekiyorsa ayni kayit icinden yonet.",
        ],
      },
    ],
  },
  {
    heading: "8. Kritik notlar",
    tag: "Kritik",
    sections: [
      {
        title: "Bu guide yazilirken kodda gorunen gercek durum",
        items: [
          "Admin auth guard'i App.tsx route seviyesinde degil, AdminLayout icinde calisiyor.",
          "Veritabani menusu icin ana editorler artik profile-role-assignment, role-matrix ve data ekranlaridir.",
          "Uye Takibi (eski) ust menude ayri tutulur; Veritabani dropdown'inin parcasi degildir.",
          "Profil ve rol atama operasyonu user_profiles + user_role_assignments + approval_requests + user_feature_overrides okumasi yapiyor.",
          "Feature source anlatiminda bu guide mevcut hook davranisini baz alir: override -> role_default -> fallback.",
        ],
      },
      {
        title: "Temiz sistem kurali",
        items: [
          "Override ilk cozum degil son care olsun.",
          "Ayni kural birden cok kaydi etkiliyorsa rol seviyesinde duzelt.",
          "Rol degisikliginden sonra profil, feature ve section davranisini test etmeden islemi bitmis sayma.",
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
            Kullanim Klavuzu
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Bu rehber, bugunku kod akisina gore `rol`, `profil`, `feature`,
            `attribute`, `section` ve `auth` kullanimini tek yerde toplar.
            Ozellikle yeni uyeler menusu ile katalog ekranindaki guncel operasyon
            sirasi burada ozetlenir.
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
