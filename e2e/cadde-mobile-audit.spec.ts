import { expect, test, type Page } from "@playwright/test";

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

const feedRpcPayload = {
  items: [
    {
      id: "post-1",
      author_user_id: "author-1",
      author_name_override: "Ayşe",
      author_role: "Üye",
      author_avatar_url: null,
      content_mode: "real",
      status: "published",
      post_type: "text",
      title: "Berlin'de ilk buluşma",
      body: "Bu akşam Kadde için ilk küçük buluşmayı yapalım mı?",
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
    },
  ],
  nextCursor: null,
};

const commentRows = [
  { id: "comment-1", post_id: "post-1", user_id: "commenter-1", body: "Ben gelirim.", created_at: "2026-06-23T10:01:00Z" },
  { id: "comment-2", post_id: "post-1", user_id: "commenter-2", body: "Saat kaçta?", created_at: "2026-06-23T10:02:00Z" },
  { id: "comment-3", post_id: "post-1", user_id: "commenter-3", body: "Ben de katılırım.", created_at: "2026-06-23T10:03:00Z" },
];

const nameRows = [
  { user_id: "cadde-user-1", value_text: "Cadde Üyesi", afs_attributes: { key: "full_name" } },
  { user_id: "author-1", value_text: "Ayşe", afs_attributes: { key: "full_name" } },
  { user_id: "commenter-1", value_text: "Ece", afs_attributes: { key: "full_name" } },
  { user_id: "commenter-2", value_text: "Mert", afs_attributes: { key: "full_name" } },
  { user_id: "commenter-3", value_text: "Deniz", afs_attributes: { key: "full_name" } },
];

const mockCaddeNetwork = async (page: Page, mode: "feed" | "empty") => {
  await page.route(/\/rest\/v1\//, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/rpc\//, (route) => route.fulfill(json(null)));

  await page.route(/\/auth\/v1\/token/, (route) => route.fulfill(json(sessionPayload())));
  await page.route(/\/auth\/v1\/logout/, (route) => route.fulfill({ status: 204, body: "" }));
  await page.route(/\/auth\/v1\/user/, (route) => route.fulfill(json(sessionPayload().user)));

  await page.route(/\/rest\/v1\/user_profile_attributes/, (route) => route.fulfill(json(nameRows)));
  await page.route(/\/rest\/v1\/user_role_assignments/, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/rpc\/get_current_user_features/, (route) => route.fulfill(json(featureRows)));
  await page.route(/\/rest\/v1\/rpc\/get_cadde_actor_context/, (route) => route.fulfill(json(actorContextPayload)));
  await page.route(/\/rest\/v1\/cadde_countries/, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/cadde_cities/, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/cadde_cafes/, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/cadde_billboard_cards/, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/cadde_post_reactions/, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/cadde_posts/, (route) => route.fulfill(json([])));

  if (mode === "feed") {
    await page.route(/\/rest\/v1\/rpc\/list_cadde_feed_v1/, (route) => route.fulfill(json(feedRpcPayload)));
    await page.route(/\/rest\/v1\/cadde_post_comments/, (route) => route.fulfill(json(commentRows)));
  } else {
    await page.route(/\/rest\/v1\/rpc\/list_cadde_feed_v1/, (route) =>
      route.fulfill(json({ items: [], nextCursor: null })),
    );
    await page.route(/\/rest\/v1\/cadde_post_comments/, (route) => route.fulfill(json([])));
  }
};

const loginToCadde = async (page: Page) => {
  await page.goto("/login?mode=login&next=%2Fcadde");
  await page.locator("#login-email").fill("member@corteqs.net");
  await page.locator("#login-password").fill("test-password");
  await page.getByRole("button", { name: /E-posta ve şifre ile giriş yap/i }).click();
  await expect(page).toHaveURL(/\/cadde$/);
};

test("cadde mobile keeps comment input collapsed until a post is selected", async ({ page }) => {
  await mockCaddeNetwork(page, "feed");
  await loginToCadde(page);

  await expect(page.getByText("Berlin'de ilk buluşma")).toBeVisible();
  await expect(page.getByTestId("cadde-feed-card")).toHaveCount(1);
  await expect(page.locator("body")).not.toContainText("Görünür OI");
  await expect(page.locator("body")).not.toContainText("Kayıt OI");
  await expect(page.getByTestId("cadde-comment-panel").getByPlaceholder("Yorum yaz")).toHaveCount(0);

  await page.getByTestId("cadde-comment-toggle").click();

  await expect(page.locator("body")).toContainText("Ben de katılırım.");
  await expect(page.getByPlaceholder("Yorum yaz")).toBeVisible();
});

test("cadde mobile shows invitation empty states and a compact scroll-top button", async ({ page }) => {
  await mockCaddeNetwork(page, "empty");
  await loginToCadde(page);

  await expect(page.getByTestId("cadde-feed-empty-state")).toBeVisible();

  // 05.08.2026 yerleşim değişikliğinden sonra bu üç boş durum ÜÇ FARKLI davranışa tabi.
  // Assert'ler silinmedi, koda uyduruldu — kapsam korunuyor.

  // (1) Kafe akordeonu soğuk başlangıçta KAPALI açılır: CaddePage.tsx:528
  //     `cafesOpen = cafesOpenOverride ?? (caddeDataResolved && !isColdStart)`.
  //     Radix CollapsibleContent kapalıyken içeriği DOM'dan söker, yani testid "gizli"
  //     değil HİÇ YOKTUR. Boş durum metnini görmek için önce açmak gerekir.
  await page.getByTestId("cadde-cafes-toggle").click();
  await expect(page.getByTestId("cadde-cafes-empty-state")).toBeVisible();

  // (2) Tanıtım rayı soğuk başlangıçta bilinçli olarak HİÇ ÇİZİLMEZ: CaddePage.tsx:1283
  //     `hideWhenEmpty={isColdStart}` → PromotionRail.tsx:39 `return null`. Yokluğu doğru
  //     davranıştır; "görünür olmalı" demek bu ürün kararını tersine çevirirdi.
  await expect(page.getByTestId("cadde-promotions-empty-state")).toHaveCount(0);

  // (3) Pano kartı soğuk başlangıçta TAMAMEN çizilmez: CaddePage.tsx:1288 `{hasAnyBillboard ? (`
  //     (`hasAnyBillboard = billboardCards.length > 0`). Hiç kayıt yokken kart da, içindeki
  //     boş durum da DOM'a girmez — 1287'deki yorum bunu açıkça söylüyor. Boş durum yalnız
  //     kayıt VARKEN ama listelenecek kart kalmadığında görünür, yani bu senaryo değil.
  await expect(page.getByTestId("cadde-billboards-empty-state")).toHaveCount(0);

  // Sağ kolonun mobilde katlanması 05.08.2026'da gelen YENİ davranış
  // (CaddePage.tsx:1201-1220). Katlamanın kendisi kapsam dışı kalmasın: aç-kapa çalışıyor mu.
  const rightRailToggle = page.getByTestId("cadde-right-rail-toggle");
  await expect(rightRailToggle).toHaveAttribute("aria-expanded", "false");
  await rightRailToggle.click();
  await expect(rightRailToggle).toHaveAttribute("aria-expanded", "true");

  // Playwright `.click()` önce elemanı görünür alana KAYDIRIR. Yukarıdaki iki toggle
  // sayfanın altındaki sağ kolonda olduğu için sayfa kaymış durumda; aşağıdaki test ise
  // "kaydırmadan ÖNCE buton gizli" varsayımına dayanıyor. Açıkça başa dön.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));

  const scrollTopButton = page.getByTestId("scroll-top-button");
  await expect(scrollTopButton).toHaveCSS("opacity", "0");

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" }));
  await expect(scrollTopButton).toHaveCSS("opacity", "1");
  await expect(scrollTopButton.locator("text=UP")).toBeHidden();

  const box = await scrollTopButton.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.width ?? 0) <= 56).toBe(true);
});
