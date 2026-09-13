import { expect, test, type Page } from "@playwright/test";

/**
 * Cadde görsel QA yardımcısı (P4/P5, 13 Eylül). 10 Eylül'de yapılan görsel
 * değişikliklerin (T5-T8 pillar renkleri/rozetler/köşeler, header konsolidasyonu,
 * boş şehir → dolu alternatif) hiçbiri tarayıcıda görülmemişti; bu spec o boşluğu
 * kapatır. Aynı admin-visual-qa.spec.ts / cadde-mobile-audit.spec.ts deseni:
 * normal suite'te KOŞMAZ, açıkça çağrılır:
 *
 *   $env:VISUAL_QA="1"; npx playwright test e2e/cadde-visual-qa.spec.ts
 *
 * Çıktı: test-results/visual-qa-cadde/*.png — bir sonraki adım (P5) bu dosyaları
 * okuyup handover'daki 11 maddelik gözle-QA listesiyle karşılaştırır.
 */

const RUN = Boolean(process.env.VISUAL_QA);

const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

const ACCESS_TOKEN = `${b64url({ alg: "none", typ: "JWT" })}.${b64url({
  sub: "cadde-user-1",
  role: "authenticated",
  exp: 4102444800,
})}.fake-signature`;

const sessionPayload = () => ({
  access_token: ACCESS_TOKEN,
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "cadde-refresh-token",
  user: {
    id: "cadde-user-1",
    aud: "authenticated",
    role: "authenticated",
    email: "member@corteqs.net",
    app_metadata: { provider: "email" },
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  },
});

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

const actorContextPayload = {
  userId: "cadde-user-1",
  roleKey: "User_Standard",
  featureKeys: ["cadde.access", "cadde.post.create"],
  country: "Almanya",
  city: "Berlin",
  phoneE164: null,
  phoneVerifiedAt: null,
  isPhoneVerified: false,
  phoneRequired: false,
  isTRResident: false,
  isDiasporaResident: true,
  indivRelocating: false,
  digitalCommunityEnabled: false,
  profilePublic: true,
  missingGateFields: [],
  canEnterCadde: true,
  canPostCadde: true,
  canPostKopru: true,
};

const featureRows = [{ feature_key: "cadde.access", is_enabled: true, source: "role_default" }];

const nameRows = [
  { user_id: "cadde-user-1", value_text: "Cadde Üyesi", afs_attributes: { key: "full_name" } },
  { user_id: "author-1", value_text: "Ayşe", afs_attributes: { key: "full_name" } },
  { user_id: "author-2", value_text: "Mert Koca", afs_attributes: { key: "full_name" } },
  { user_id: "host-1", value_text: "Seda Yalçın", afs_attributes: { key: "full_name" } },
];

/** cadde_cafes CAFE_SELECT_COLUMNS ile birebir — bkz. src/lib/cadde-api.ts:328. */
const CAFE_ROW = {
  id: "cafe-1",
  host_user_id: "cadde-user-1",
  host_name_override: null,
  title: "Berlin'de yeni gelenler sohbeti",
  summary: "İlk 6 ayda karşılaşılan sorunları konuşalım — kira, sigorta, dil kursu.",
  country_id: "de",
  city_id: "berlin",
  content_mode: "real",
  status: "published",
  is_bridge: false,
  is_free: true,
  starts_at: "2026-09-13T09:00:00Z",
  ends_at: "2026-09-14T09:00:00Z",
  is_active: true,
  created_at: "2026-09-13T09:00:00Z",
  slug: "berlinde-yeni-gelenler-sohbeti",
  theme_key: null,
  entry_mode: "open",
  entry_question: null,
  capacity: 100,
  external_links: [],
  archived_at: null,
};

const CAFE_MEMBER_ROWS = [
  { id: "m-1", cafe_id: "cafe-1", user_id: "cadde-user-1", status: "approved", answer: null, joined_at: "2026-09-13T09:05:00Z" },
  { id: "m-2", cafe_id: "cafe-1", user_id: "author-1", status: "approved", answer: null, joined_at: "2026-09-13T09:10:00Z" },
];

const feedItem = (overrides: Record<string, unknown> = {}) => ({
  id: "post-1",
  author_user_id: "author-1",
  author_name_override: "Ayşe",
  author_role: "Üye",
  author_avatar_url: null,
  content_mode: "real",
  status: "published",
  post_type: "text",
  title: "Berlin'de ilk buluşma",
  body: "Bu akşam Cadde için ilk küçük buluşmayı yapalım mı? Hafta içi bir kahve buluşması ayarlayabiliriz.",
  country_id: null,
  city_id: null,
  country_name: "Almanya",
  city_name: "Berlin",
  is_bridge: false,
  pinned: false,
  created_at: "2026-06-23T10:00:00Z",
  need_category: null,
  interests: ["network"],
  band: 1,
  score: 10,
  rand: 1,
  published_at: "2026-06-23T10:00:00Z",
  engagement_score: 10,
  ...overrides,
});

const CADDE_COUNTRIES = [{ id: "de", code: "DE", name: "Almanya", sort_order: 1 }];
const CADDE_CITIES = [
  { id: "berlin", country_id: "de", name: "Berlin", timezone: "Europe/Berlin", sort_order: 1 },
  { id: "munih", country_id: "de", name: "Münih", timezone: "Europe/Berlin", sort_order: 2 },
];

/** cadde-mobile-audit.spec.ts ile aynı temel ağ mock'u — burada da tekrarlanır
 * (repodaki spec'ler arası desen: her dosya kendi mock'unu taşır, paylaşılmaz). */
const mockCaddeNetwork = async (page: Page, feedItems: ReturnType<typeof feedItem>[]) => {
  await page.route(/\/rest\/v1\//, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/rpc\//, (route) => route.fulfill(json(null)));

  await page.route(/\/auth\/v1\/token/, (route) => route.fulfill(json(sessionPayload())));
  await page.route(/\/auth\/v1\/logout/, (route) => route.fulfill({ status: 204, body: "" }));
  await page.route(/\/auth\/v1\/user/, (route) => route.fulfill(json(sessionPayload().user)));

  await page.route(/\/rest\/v1\/user_profile_attributes/, (route) => route.fulfill(json(nameRows)));
  await page.route(/\/rest\/v1\/user_role_assignments/, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/rpc\/get_current_user_features/, (route) => route.fulfill(json(featureRows)));
  await page.route(/\/rest\/v1\/rpc\/get_cadde_actor_context/, (route) => route.fulfill(json(actorContextPayload)));
  await page.route(/\/rest\/v1\/cadde_countries/, (route) => route.fulfill(json(CADDE_COUNTRIES)));
  await page.route(/\/rest\/v1\/cadde_cities/, (route) => route.fulfill(json(CADDE_CITIES)));
  await page.route(/\/rest\/v1\/cadde_cafes/, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/cadde_billboard_cards/, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/cadde_post_reactions/, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/cadde_posts/, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/cadde_post_comments/, (route) => route.fulfill(json([])));

  await page.route(/\/rest\/v1\/rpc\/list_cadde_feed_v1/, (route) =>
    route.fulfill(json({ items: feedItems, nextCursor: null })),
  );
};

/**
 * Şehir seçiliyken boş, ülke genelinde dolu bir akış kurar (B1/B2, m157-158).
 * `list_cadde_feed_v1` isteğinin gövdesine bakarak DARALTILMIŞ (şehir filtreli)
 * çağrıyı boş, GENİŞLETİLMİŞ (ülke filtreli) çağrıyı dolu döndürür — widenCaddeFilters
 * tam olarak bu iki isteği bu sırayla üretir (bkz. src/lib/cadde-feed-widen.ts).
 */
const mockCaddeNetworkColdCity = async (page: Page) => {
  await mockCaddeNetwork(page, []);
  await page.route(/\/rest\/v1\/rpc\/list_cadde_feed_v1/, (route) => {
    const body = route.request().postDataJSON() as { p_filters?: { cities?: string[] } };
    const isNarrowedToCity = (body.p_filters?.cities?.length ?? 0) > 0;
    if (isNarrowedToCity) {
      route.fulfill(json({ items: [], nextCursor: null }));
    } else {
      route.fulfill(
        json({
          items: [
            feedItem({
              id: "post-widen-1",
              author_user_id: "author-2",
              author_name_override: "Mert Koca",
              title: "Münih ortak çalışma buluşması",
              body: "Perşembe günü merkezde freelancer buluşması yapıyoruz.",
              city_name: "Münih",
            }),
          ],
          nextCursor: null,
        }),
      );
    }
  });
};

/** CaddeCafePage için ağ mock'u — getCaddeCafe .maybeSingle() bekler, yani cadde_cafes
 * burada DİZİ değil TEK NESNE döner (genel /cadde mock'unun aksine, bu yüzden ayrı test). */
const mockCaddeCafeRoom = async (page: Page) => {
  await mockCaddeNetwork(page, []);
  await page.route(/\/rest\/v1\/cadde_cafes/, (route) => route.fulfill(json(CAFE_ROW)));
  await page.route(/\/rest\/v1\/cadde_cafe_members/, (route) => route.fulfill(json(CAFE_MEMBER_ROWS)));
};

const loginToCadde = async (page: Page, next = "/cadde") => {
  await page.goto(`/login?mode=login&next=${encodeURIComponent(next)}`);
  await page.locator("#login-email").fill("member@corteqs.net");
  await page.locator("#login-password").fill("test-password");
  await page.getByRole("button", { name: /E-posta ve şifre ile giriş yap/i }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
};

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/visual-qa-cadde/${name}.png`, fullPage: false });

test.describe("Cadde visual QA (manuel/AI inceleme için screenshot üretir)", () => {
  test.skip(!RUN, "VISUAL_QA env değişkeni ile açıkça çalıştırılır");

  test("üst alan + ilk gönderi (fold üstü)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockCaddeNetwork(page, [feedItem()]);
    await loginToCadde(page);

    await expect(page.getByText("Berlin'de ilk buluşma")).toBeVisible();
    await page.waitForTimeout(300);
    await shot(page, "01-ust-alan-ilk-gonderi");
  });

  test("scroll sonrası header daralması", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockCaddeNetwork(page, [feedItem()]);
    await loginToCadde(page);

    await expect(page.getByText("Berlin'de ilk buluşma")).toBeVisible();
    // HEADER_COMPACT_ON_SCROLL_Y = 120px; iyice üstüne çık ki durum kesin değişsin.
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "auto" }));
    await page.waitForTimeout(300);
    await shot(page, "02-scroll-sonrasi-header-daralmasi");
  });

  test("boş şehir → dolu ülke alternatifi", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockCaddeNetworkColdCity(page);
    await loginToCadde(page, "/cadde?city=Berlin");

    // Widen butonu asıl akış boş döndükten VE genişletilmiş yoklama sonuçlanınca çizilir.
    await expect(page.getByText(/akışındaki .* paylaşım/)).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(300);
    await shot(page, "03-bos-sehir-dolu-ulke-alternatifi");
  });

  test("mobil genişlik — üst alan", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockCaddeNetwork(page, [feedItem()]);
    await loginToCadde(page);

    await expect(page.getByText("Berlin'de ilk buluşma")).toBeVisible();
    await page.waitForTimeout(300);
    await shot(page, "04-mobil-ust-alan");
  });

  test("aktif cafe odası (ev sahibi görünümü — payda, kebab menü)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockCaddeCafeRoom(page);
    await loginToCadde(page, "/cadde/cafe/cafe-1");

    await expect(page.getByText("Berlin'de yeni gelenler sohbeti")).toBeVisible();
    await page.waitForTimeout(300);
    await shot(page, "05-aktif-cafe-odasi");
  });
});
