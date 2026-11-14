// 1 Ocak lansmanı — REGRESYON SÖZLEŞMESİ (batch L3).
//
// Burak'ın planındaki 12 "bozulmasın" maddesinin STATİK kısmını kilitler. Her madde için
// mevcut testlerin neyi koruduğu ve neyin yalnız canlıda bakılabildiği:
// `docs/operations/2026-11-08-lansman-regresyon-listesi.md`.
//
// NEDEN BU TEST VAR: yeniden tasarım (L4–L8) menüyü, ana sayfayı ve rota tablosunu
// elden geçirecek. Bu sınıfın kusuru SESSİZDİR — bir rota, bir profil sekmesi ya da
// bir analitik etiketi kalktığında ne lint ne derleme patlar; ziyaretçi 404 görür,
// üye sekmesini kaybeder, Clarity/GA o günden sonra veri toplamaz. Burada kilitlenen
// her liste BUGÜNKÜ (8 Kasım 2026) durumun anlık görüntüsüdür:
//   • listeye öğe EKLEMEK serbesttir (test yalnız "içerir" diye bakar),
//   • listeden öğe ÇIKARMAK bu dosyada bilinçli, gerekçeli bir değişiklik ister.
//
// Kaynak metni okur; çalışan SPA'yı değil. Çıpa kaybolursa test AÇIKÇA düşer.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildProfileSidebarMenu, type ProfileSidebarSections } from "@/components/profile/profile-sidebar-menu";
import { adminNavGroups } from "@/lib/admin-shell/admin-navigation-registry";
import { flattenAdminNav } from "@/lib/admin-shell/admin-navigation-utils";
import { GENERIC_FEATURE_KEYS } from "@/lib/features";
import { LEGACY_REDIRECTS } from "@/lib/redirects";
import { toolHeroImage } from "@/lib/relocation/relocation-tools-images";
import { STANDALONE_TOOLS } from "@/lib/standalone-tools";
import { sliceBetween } from "@/test/source-slice";

import { STATIC_ROUTES } from "../../scripts/generate/generate-sitemap.mjs";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");

const APP = read("src/App.tsx");

/** `App.tsx` içindeki her `path="..."` değeri (public + admin ağacına giden `/admin` dahil). */
const APP_ROUTE_PATHS: string[] = [...APP.matchAll(/\bpath="([^"]+)"/g)].map((m) => m[1]);

/**
 * Rota kontrolü TAM EŞLEŞMEDİR: `App.tsx`'te bu yol deseni birebir bildirilmiş olmalı.
 * (Desen eşleme bilerek YOK: `/events/create` yolunu `/events/:id` deseni de karşılar, yani
 * `/events/create` rotası yeniden adlandırılsa test yeşil kalırdı.) Parametreli rotalar
 * desen olarak yazılır: `/tools/:toolSlug`, `/events/:id` …
 */
const hasRoute = (routePattern: string) => APP_ROUTE_PATHS.includes(routePattern);

/**
 * `src/` altındaki izlenen ÜRETİM kaynakları (test ve üretilmiş dosyalar hariç): test
 * dosyasında geçen ad üretim kodunun varlığını kanıtlamaz. Dizin gezmek yerine
 * `git ls-files`: gitignore'lu `referanslovable/` klonu sonucu bozar.
 */
const PRODUCTION_SRC_FILES: string[] = execFileSync("git", ["ls-files", "src"], { cwd: ROOT, encoding: "utf8" })
  .split(/\r?\n/)
  .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.|\.generated\.|integrations\/supabase\/types\.ts/.test(f));

/** Blok ve satır başı yorumlarını atar: yorumda geçen ad çağrı kanıtı değildir. */
const stripComments = (source: string): string => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const PRODUCTION_SRC_CODE: string[] = PRODUCTION_SRC_FILES.map((f) => stripComments(read(f)));

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * RPC ÇAĞRI NOKTASI var mı: `.rpc("ad"` (ya da satır sonundan sonra `"ad"`). Adın yorumda ya da
 * başka bir dizgede geçmesi sayılmaz: `list_cadde_feed_v1` → `_v9` yapılırsa bu fonksiyon
 * false döner, düz `includes` ise yorumlardaki 5 geçişten dolayı yeşil kalırdı.
 */
const hasRpcCall = (name: string): boolean => {
  const call = new RegExp(`\\.rpc\\(\\s*["']${escapeRegex(name)}["']`);
  return PRODUCTION_SRC_CODE.some((code) => call.test(code));
};

/**
 * `create_cadde_post_v2` doğrudan `.rpc("…")` ile değil, `rpcName = cafe ? "…_v1" : "…_v2"`
 * atamasıyla seçilip `.rpc(rpcName` ile çağrılır (`cadde-api.ts`). Atamadaki dize VE çağrı birlikte aranır.
 */
const hasSelectedRpcCall = (name: string): boolean => {
  const assignment = new RegExp(`rpcName\\s*=[^;]*["']${escapeRegex(name)}["']`);
  return PRODUCTION_SRC_CODE.some((code) => assignment.test(code) && /\.rpc\(\s*rpcName\b/.test(code));
};

describe("L3 regresyon sözleşmesi — rota tablosu yardımcıları", () => {
  it("App.tsx'ten rota çıkarılabiliyor (çıpa kaybolursa diğer testler boş geçmesin)", () => {
    expect(APP_ROUTE_PATHS.length).toBeGreaterThan(60);
    expect(hasRoute("/tools/:toolSlug")).toBe(true);
    // Desen eşleme YOK: statik yol, parametreli kardeş desenle karşılanmaz.
    expect(hasRoute("/tools/ulke-secimi")).toBe(false);
    expect(hasRoute("/bu-rota-hic-yok-xyz")).toBe(false);
  });
});

// ── (1) Üye hesapları / oturum ───────────────────────────────────────────────

describe("(1) üye hesapları ve oturum", () => {
  it("/login rotası durur ve eski giriş adresleri ona yönlenir", () => {
    expect(hasRoute("/login")).toBe(true);
    const targets = LEGACY_REDIRECTS.filter((r) => r.to === "/login").map((r) => r.from);
    expect(targets).toEqual(expect.arrayContaining(["/aiform", "/form"]));
  });

  it("auth bağlamı sözleşme yüzeyini korur (session · user · isLoading · profile · accountType · onboardingCompleted · signOut · refreshProfile)", () => {
    const ctx = read("src/components/auth/auth-context.ts");
    for (const field of [
      "session",
      "user",
      "isLoading",
      "profile",
      "accountType",
      "onboardingCompleted",
      "signOut",
      "refreshProfile",
    ]) {
      expect(ctx, `AuthContextValue.${field} kayıp`).toMatch(new RegExp(`\\b${field}\\s*:`));
    }
    // `loading` diye bir alan YOKTUR (CLAUDE.md) — geri gelirse iki yüzey ayrışır.
    expect(ctx).not.toMatch(/\bloading\s*:/);
  });

  it("Supabase istemcisi oturumu kalıcı tutar ve yeniler (mevcut üye aynı e-postayla girişte oturum düşmez)", () => {
    const client = read("src/integrations/supabase/client.ts");
    expect(client).toMatch(/persistSession:\s*true/);
    expect(client).toMatch(/autoRefreshToken:\s*true/);
  });
});

// ── (2) Roller, AFS yetkileri, admin kullanıcı bazlı yetki ekranı ────────────

describe("(2) roller ve yetkiler", () => {
  const adminItems = flattenAdminNav(adminNavGroups).map((e) => e.item);

  it("admin'in kullanıcı bazlı yetki (feature override) ekranı menüde durur", () => {
    const item = adminItems.find((i) => i.id === "feature-overrides");
    expect(item?.to).toBe("/admin/new-member/overrides");
  });

  it("rol matrisi ve rol genel bakışı admin menüsünde durur", () => {
    const targets = adminItems.map((i) => i.to).filter(Boolean);
    expect(targets).toEqual(
      expect.arrayContaining(["/admin/new-member/role-matrix", "/admin/new-member/roles-overview"]),
    );
  });

  it("kullanıcı-rol, rol-özellik, öznitelik ve profil bölümü yönetim rotaları admin ağacında durur", () => {
    const adminRoutes = read("src/pages/admin/routes.tsx");
    for (const path of [
      "new-member/users-roles",
      "new-member/roles-features",
      "new-member/attributes",
      "new-member/profile-sections",
      "new-member/profile-role-assignment",
    ]) {
      expect(adminRoutes, `admin rotası kayıp: ${path}`).toContain(`path="${path}"`);
    }
  });

  it("Cadde erişim anahtarı (cadde.access) tanımlı kalır", () => {
    expect(GENERIC_FEATURE_KEYS.caddeAccess).toBe("cadde.access");
  });
});

// ── (3) Katalog + uzmanlar + konsolosluk dizinleri ───────────────────────────

describe("(3) katalog ve dizin rotaları", () => {
  it.each([
    "/directory",
    "/directory/catalog/:slug",
    "/directory/profile/:userId",
    "/consultants",
    "/associations",
    "/city-ambassadors",
    "/businesses",
  ])("%s rotası durur", (path) => {
    expect(hasRoute(path)).toBe(true);
  });

  it("konsolosluk/büyükelçilik yönetim sayfası admin ağacında durur", () => {
    const adminRoutes = read("src/pages/admin/routes.tsx");
    expect(adminRoutes).toMatch(/path="consulates"\s+element=\{<AdminConsulateProfilesPage/);
  });

  it("dizin, katalog ve uzman rotaları sitemap'te kalır", () => {
    const paths = STATIC_ROUTES.map((r: { path: string }) => r.path);
    expect(paths).toEqual(expect.arrayContaining(["/directory", "/consultants", "/associations", "/city-ambassadors"]));
  });
});

// ── (4) Profil paneli bugünkü sekmeleri ──────────────────────────────────────

describe("(4) profil paneli (legacy profile-sidebar-menu) sekmeleri silinmez", () => {
  /** Bugünkü (8 Kasım 2026) sekme kimliği → etiket. Etiket üyeye görünen metindir. */
  const TODAY_TABS: Record<string, string> = {
    overview: "Profil Özeti",
    fields: "Profil Bilgileri",
    badges: "Rozetler",
    cadde: "Cadde",
    events: "Etkinliklerim",
    social: "Sosyal Medya",
    links: "Bağlantılar",
    documents: "Belgeler",
    role: "Rol Detayları",
    access: "Rol Talepleri",
    contributor: "Contributor Kaynakları",
    help: "Yardım",
  };

  // Koşullu sekmeler (rozet, contributor) ancak kart doluysa çıkar → hepsini dolu ver.
  const filled = (): ProfileSidebarSections => {
    const node = "x";
    return {
      quickActionsCard: node,
      gettingStartedCard: node,
      legacyHeroCard: node,
      legacySummaryCard: node,
      personalInfoSection: node,
      badgesCard: node,
      caddeCards: node,
      socialMediaCard: node,
      linkCardsGrid: node,
      documentsGrid: node,
      roleSpecificCard: node,
      accessCard: node,
      contributorResourcesCard: node,
      dangerZoneCard: node,
      helpCard: node,
    };
  };

  it("bugünkü 12 sekme kimliği ve etiketi menüde durur", () => {
    const menu = buildProfileSidebarMenu(filled());
    const byId = new Map(menu.map((item) => [item.id, item.label]));
    for (const [id, label] of Object.entries(TODAY_TABS)) {
      expect(byId.get(id), `profil sekmesi kayıp ya da yeniden adlandı: ${id}`).toBe(label);
    }
    expect(menu.length).toBeGreaterThanOrEqual(Object.keys(TODAY_TABS).length);
  });

  it("'Profil Özeti' ilk, 'Yardım' son sekmedir (yeni sekmeler Yardım'dan ÖNCE eklenir)", () => {
    const ids = buildProfileSidebarMenu(filled()).map((item) => item.id);
    expect(ids[0]).toBe("overview");
    expect(ids[ids.length - 1]).toBe("help");
  });

  it("ProfilePage hâlâ bu menüyü kuruyor (menü yazılıp bağlantısı koparılmasın)", () => {
    expect(read("src/pages/ProfilePage.tsx")).toMatch(/buildProfileSidebarMenu\(\{/);
  });
});

// ── (5) 18 araç ve kayıtlı sonuç/oturum sayfaları ────────────────────────────

describe("(5) 18 araç (/tools)", () => {
  /** Hub'ın bugün gösterdiği 18 araç. Yeni araç eklenebilir; çıkarılması kararlıdır. */
  const TOOL_SLUGS = [
    "ulke-secimi",
    "meslek-maas-karsilastirma",
    "tasinma-hazirlik-skoru",
    "sehir-eslestirme",
    "diaspora-ag-eslestirme",
    "yurtdisi-kariyer-yolu",
    "expat-yasam-tarzi-persona",
    "ilk-90-gun-planlayici",
    "oncelikli-tasinma-sorunu",
    "is-bulma-olasiligi",
    "banka-secim-almanya",
    "sigorta-secim-almanya",
    "maas-hesaplama-almanya",
    "vize-secim-almanya",
    "vatandaslik-testi-almanya",
    "para-transferi-almanya",
    "stepstone-karsilastirma-almanya",
    "zgen-nesil-bulucu",
  ];

  it("18 araç slug'ı tanımlıdır", () => {
    expect(new Set(TOOL_SLUGS).size).toBe(18);
  });

  it.each(TOOL_SLUGS)("%s aracının hero görseli kayıtlı ve dosyası var", (slug) => {
    const image = toolHeroImage(slug);
    expect(image, `${slug} için hero görseli kaydı kayıp`).toBeTruthy();
    expect(existsSync(resolve(ROOT, "public" + image)), `${image} dosyası yok`).toBe(true);
  });

  it("bağımsız (standalone) araçlar kayıtta durur: 5 Almanya aracı + ZGEN", () => {
    const slugs = STANDALONE_TOOLS.map((t) => t.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        "maas-hesaplama-almanya",
        "vize-secim-almanya",
        "vatandaslik-testi-almanya",
        "para-transferi-almanya",
        "stepstone-karsilastirma-almanya",
        "zgen-nesil-bulucu",
      ]),
    );
  });

  it("hub, araç, kayıtlı oturum ve kayıtlı sonuç rotaları durur", () => {
    expect(hasRoute("/tools")).toBe(true);
    expect(hasRoute("/tools/:toolSlug")).toBe(true);
    expect(hasRoute("/tools/:toolSlug/session/:sessionId")).toBe(true);
    expect(hasRoute("/tools/:toolSlug/result/:resultId")).toBe(true);
  });

  it("araç hub'ı sitemap'te kalır", () => {
    expect(STATIC_ROUTES.map((r: { path: string }) => r.path)).toContain("/tools");
  });
});

// ── (6) Cadde içeriği ────────────────────────────────────────────────────────

describe("(6) Cadde içeriği", () => {
  it.each(["/cadde", "/cadde/cafe/:cafeId", "/cadde/carsi", "/cadde/carsi/:itemId"])("%s rotası durur", (path) => {
    expect(hasRoute(path)).toBe(true);
  });

  it.each([
    ["/cadde", 'path="/cadde/cafe'],
    ["/cadde/cafe/:cafeId", 'path="/cadde/carsi"'],
    ["/cadde/carsi", 'path="/cadde/carsi/:itemId"'],
    ["/cadde/carsi/:itemId", 'path="/directory/profile/:userId"'],
  ])("%s giriş + cadde.access kapısı arkasında kalır", (route, nextAnchor) => {
    // Pencere SONRAKİ rotanın çıpasında biter: sabit uzunluklu dilim komşu rotanın kapısını da
    // içine alır ve kapı bu rotadan kalksa bile yeşil kalırdı. Çıpa yoksa `sliceBetween` düşer.
    const block = sliceBetween(APP, `path="${route}"`, nextAnchor, `App.tsx ${route}`);
    expect(block).toContain("<RequireAuth>");
    expect(block).toContain("GENERIC_FEATURE_KEYS.caddeAccess");
  });

  it("gönderi, yorum, reaksiyon, akış ve cafe RPC'leri istemci kodunda ÇAĞRILMAYA devam eder", () => {
    // Yeniden tasarım Cadde ekranını söküp RPC çağrısını da götürürse kullanıcı içerik
    // yazamaz ama hiçbir test patlamaz. Adın yorumda geçmesi kanıt SAYILMAZ: `.rpc("ad"` çağrı
    // noktası aranır (mutasyonla sınandı: `list_cadde_feed_v1` → `_v9` testi düşürür).
    const missing = [
      "update_cadde_post_v1",
      "delete_cadde_post_v1",
      "create_cadde_comment_v1",
      "toggle_cadde_reaction_v1",
      "list_cadde_feed_v1",
      "create_cadde_cafe_v1",
      "join_cadde_cafe_v1",
    ].filter((rpc) => !hasRpcCall(rpc));
    expect(missing, `RPC çağrı noktası kaybolmuş: ${missing.join(", ")}`).toEqual([]);
  });

  it("gönderi oluşturma RPC'si (cafe'siz v2, cafe'li v1) seçilip çağrılır", () => {
    expect(hasSelectedRpcCall("create_cadde_post_v2")).toBe(true);
    expect(hasSelectedRpcCall("create_cadde_post_v1")).toBe(true);
  });

  it("tavsiye (recommendation) akışı RPC'leri istemci kodunda çağrılır", () => {
    const missing = ["create_recommendation_request_v1", "answer_recommendation_v1"].filter((rpc) => !hasRpcCall(rpc));
    expect(missing, `tavsiye RPC çağrısı kayıp: ${missing.join(", ")}`).toEqual([]);
  });
});

// ── (7) Etkinlik, dijital grup, kampanyalar, liderlik, 19 Mayıs ──────────────

describe("(7) etkinlikler, dijital gruplar, kampanyalar, liderlik, 19 Mayıs", () => {
  it.each([
    "/events",
    "/events/create",
    "/events/:id",
    "/addcom",
    "/addcom/edit/:slug",
    "/founding-1000",
    "/campaign",
    "/campaign/vlogger",
    "/campaign/blogger",
    "/liderlik",
    "/19051919",
    "/19051919/harita",
    "/190519idea",
    "/190519memory",
    "/lansman",
    "/anket",
    "/ilanlar",
    "/relocation",
    "/kariyer",
  ])("%s rotası durur", (path) => {
    expect(hasRoute(path)).toBe(true);
  });

  it("Kurucu 1000 eski adresi kalıcı yönlendirmeyle yeni adrese gider", () => {
    expect(LEGACY_REDIRECTS).toContainEqual({ from: "/campaign/founding-1000", to: "/founding-1000" });
  });

  it("eski dijital grup adresleri /addcom'a yönlenir", () => {
    for (const from of ["/addwa", "/whatsapp-groups"]) {
      expect(LEGACY_REDIRECTS).toContainEqual({ from, to: "/addcom" });
    }
  });
});

// ── (8) Referans kodları ve elçi indirimleri ─────────────────────────────────

describe("(8) referans kodları ve elçi indirimleri", () => {
  it("referans kodu üretim/doğrulama yüzeyi durur", async () => {
    const mod = await import("@/lib/referral/referral-codes");
    expect(typeof mod.generateReferralCodeFromParts).toBe("function");
    expect(typeof mod.createReferralCodeWithRetry).toBe("function");
    expect(typeof mod.validateReferralCodeToken).toBe("function");
  });

  it("admin referans ekranı menüde ve rota ağacında durur", () => {
    const item = flattenAdminNav(adminNavGroups).find((e) => e.item.id === "referral")?.item;
    expect(item?.to).toBe("/admin/referral");
    const adminRoutes = read("src/pages/admin/referral/routes.tsx");
    expect(adminRoutes).toMatch(/path="referral"\s+element=\{<AdminReferralPage/);
  });

  it("davet bağlantısıyla gelen kod kaydı (InviteRedemption) uygulama ağacında durur", () => {
    expect(APP).toContain("<InviteRedemption />");
  });

  it("elçi başvuru formu ve karşılama paketi sipariş API'si durur", () => {
    expect(existsSync(resolve(ROOT, "src/components/ambassadors/AmbassadorApplicationForm.tsx"))).toBe(true);
    expect(read("src/lib/welcome-pack-orders-api.ts")).toMatch(/export async function submitWelcomePackOrder/);
  });
});

// ── (9) Admin + Revizyon İstekleri ───────────────────────────────────────────

describe("(9) admin ve Revizyon İstekleri modülü", () => {
  it("Revizyon İstekleri admin menüsünde durur", () => {
    const item = flattenAdminNav(adminNavGroups).find((e) => e.item.id === "revision-requests")?.item;
    expect(item?.to).toBe("/admin/revision-requests");
  });

  it("Revizyon İstekleri rotası admin ağacında tanımlıdır", () => {
    const workshopOrAdmin = read("src/pages/admin/routes.tsx");
    expect(workshopOrAdmin).toMatch(/path="revision-requests"/);
  });

  it("revizyon API'si revision_requests tablosunu kullanmaya devam eder", () => {
    expect(read("src/lib/admin-shell/revision-requests.ts")).toContain("revision_requests");
  });

  it("admin yerleşimi /admin altında RequireAuth ile kapılıdır", () => {
    expect(read("src/pages/admin/routes.tsx")).toMatch(/path="\/admin"\s+element=\{<AdminLayout/);
  });
});

// ── (10) SEO: indeksli adresler aynı kalır ya da 301 ile gider ───────────────

describe("(10) SEO: indeksli adres sözleşmesi", () => {
  /** 8 Kasım 2026'da sitemap'in statik listesindeki adresler. Listeden çıkarmak = adresi yitirmek. */
  const INDEXED_TODAY = [
    "/",
    "/founders",
    "/radar",
    "/radar/rehberler",
    "/commercial",
    "/lansman",
    "/founding-1000",
    "/campaign",
    "/campaign/vlogger",
    "/campaign/blogger",
    "/19051919",
    "/19051919/harita",
    "/190519memory",
    "/anket",
    "/events",
    "/directory",
    "/associations",
    "/city-ambassadors",
    "/consultants",
    "/tools",
    "/iletisim",
    "/pricing",
    "/kariyer",
    "/legal/privacy",
    "/legal/terms",
    "/legal/business-information",
    "/legal/refund-cancellation",
    "/legal/service-delivery",
    "/legal/kvkk",
    "/legal/cookies",
  ];

  const sitemapPaths = STATIC_ROUTES.map((r: { path: string }) => r.path);
  const redirectSources = LEGACY_REDIRECTS.map((r) => r.from);

  it("bugünkü her indeksli adres sitemap'te durur", () => {
    const lost = INDEXED_TODAY.filter((p) => !sitemapPaths.includes(p));
    expect(lost, `sitemap'ten düşen adresler: ${lost.join(", ")}`).toEqual([]);
  });

  it("sitemap'teki her statik adres ya bir rotadır ya da 301 kaynağıdır — ölü adres yok", () => {
    const dead = sitemapPaths.filter((p: string) => !hasRoute(p) && !redirectSources.includes(p));
    expect(dead, `rotası olmayan sitemap adresleri: ${dead.join(", ")}`).toEqual([]);
  });

  it("sitemap'teki hiçbir adres yönlendirme kaynağı değildir (301'e giden adres indekslenmez)", () => {
    const redirected = sitemapPaths.filter((p: string) => redirectSources.includes(p));
    expect(redirected).toEqual([]);
  });

  it("bilinen eski adresler hâlâ 301 tablosunda (GSC bunları taramaya devam eder)", () => {
    expect(LEGACY_REDIRECTS).toEqual(
      expect.arrayContaining([
        { from: "/hakkimizda", to: "/founders" },
        { from: "/blog", to: "/radar/rehberler" },
        { from: "/dunya-kupasi", to: "/campaign" },
        { from: "/ambassador", to: "/commercial/ambassador" },
        { from: "/privacy-policy", to: "/legal/privacy" },
      ]),
    );
  });

  it("taslak ana sayfa (/landingtrial) noindex kalır — prototip dizine girmez", () => {
    expect(hasRoute("/landingtrial")).toBe(true);
    const page = read("src/pages/Index.tsx");
    expect(page).toMatch(/noindex/);
    expect(sitemapPaths).not.toContain("/landingtrial");
  });
});

// ── (11) Analitik etiketleri ─────────────────────────────────────────────────

describe("(11) analitik etiketleri (Clarity, GA, Ahrefs)", () => {
  const html = read("index.html");
  const analytics = read("public/analytics.js");
  const nginx = read("nginx.conf.template");

  it("index.html /analytics.js'i defer ile yükler (her sayfa bu kabuğu kullanır)", () => {
    expect(html).toMatch(/<script\s+src="\/analytics\.js"\s+defer>/);
  });

  it("index.html Google gtag/js ve Ahrefs betiklerini yükler", () => {
    expect(html).toMatch(/googletagmanager\.com\/gtag\/js\?id=G-XMZYTW34LQ/);
    expect(html).toMatch(/analytics\.ahrefs\.com\/analytics\.js"\s+data-key="[A-Za-z0-9_-]+"/);
  });

  it("analytics.js gtag yapılandırmasını ve Clarity yükleyicisini taşır", () => {
    expect(analytics).toMatch(/gtag\(\s*"config"\s*,\s*"G-XMZYTW34LQ"\s*\)/);
    expect(analytics).toContain("https://www.clarity.ms/tag/");
    expect(analytics).toContain('"clarity", "script", "wdkgdje6rb"');
  });

  it("GA kimliği index.html ile analytics.js arasında aynıdır (biri değişirse veri ikiye bölünür)", () => {
    const ids = new Set([...(html + analytics).matchAll(/G-[A-Z0-9]{8,12}/g)].map((m) => m[0]));
    expect([...ids]).toEqual(["G-XMZYTW34LQ"]);
  });

  it("CSP üç analitik ana makinesine izin verir (yoksa tarayıcı etiketleri sessizce keser)", () => {
    for (const host of ["https://www.googletagmanager.com", "https://analytics.ahrefs.com", "https://www.clarity.ms"]) {
      expect(nginx, `CSP script-src ${host} kayıp`).toContain(host);
    }
  });

  it("index.html'e satır içi (inline) analitik betiği geri sokulmaz", () => {
    expect(html).not.toMatch(/<script>[^<]*(gtag|clarity)\(/);
  });
});

// ── (12) Rehber Motoru ve Radar ──────────────────────────────────────────────

describe("(12) Rehber Motoru ve Radar adresleri", () => {
  it.each(["/radar", "/radar/rehberler", "/blog/:slug", "/diaspora/:slug"])("%s rotası durur", (path) => {
    expect(hasRoute(path)).toBe(true);
  });

  it("/radar ve /radar/rehberler aynı Radar sayfasını açar", () => {
    expect(APP).toMatch(/path="\/radar"\s+element=\{<RadarHubPage \/>\}/);
    expect(APP).toMatch(/path="\/radar\/rehberler"\s+element=\{<RadarHubPage \/>\}/);
  });

  it("eski /blog listesi /radar/rehberler'e 301 verir", () => {
    expect(LEGACY_REDIRECTS).toContainEqual({ from: "/blog", to: "/radar/rehberler" });
  });

  it("rehber bölümü ve rehber verisi modülü yerinde", () => {
    expect(existsSync(resolve(ROOT, "src/components/radar/RadarRehberlerSection.tsx"))).toBe(true);
    expect(existsSync(resolve(ROOT, "src/lib/radar/radar-guides.ts"))).toBe(true);
  });
});
