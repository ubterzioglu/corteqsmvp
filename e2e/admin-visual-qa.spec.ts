import { expect, test, type Page } from "@playwright/test";

/**
 * Admin Panel V2 görsel QA yardımcısı (masterplan §19.3 matrisi).
 * Normal suite'te KOŞMAZ — açıkça çağrılır:
 *
 *   $env:VISUAL_QA="1"; npx playwright test e2e/admin-visual-qa.spec.ts
 *
 * Çıktı: test-results/visual-qa/*.png — ekran görüntüleri insan/AI gözüyle
 * incelenir; assert'ler kasıtlı olarak minimaldir (sayfa açıldı + screenshot).
 * Mock altyapısı admin-smoke.spec.ts ile aynıdır.
 */

const RUN = Boolean(process.env.VISUAL_QA);

const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

const ACCESS_TOKEN = `${b64url({ alg: "none", typ: "JWT" })}.${b64url({
  sub: "admin-user-1",
  role: "authenticated",
  exp: 4102444800,
})}.fake-signature`;

const sessionPayload = () => ({
  access_token: ACCESS_TOKEN,
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "fake-refresh-token",
  user: {
    id: "admin-user-1",
    aud: "authenticated",
    role: "authenticated",
    email: "admin@corteqs.net",
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

const APPROVAL_ROWS = [
  {
    id: "req-1",
    request_type: "role_change",
    user_id: "user-77",
    target_role_key: "Member",
    target_feature_key: null,
    target_entity_type: null,
    payload: { requested_role: "Member", not: "Uzun Türkçe açıklama — ğüşıöç ĞÜŞİÖÇ deneme metni" },
    status: "pending",
    admin_note: null,
    created_at: "2026-06-01T10:00:00Z",
  },
  {
    id: "req-2",
    request_type: "directory_visibility",
    user_id: "user-78",
    target_role_key: null,
    target_feature_key: "directory.visible",
    target_entity_type: null,
    payload: {},
    status: "approved",
    admin_note: "Onaylandı — kriterleri karşılıyor",
    created_at: "2026-05-28T09:30:00Z",
  },
];

const mockSupabase = async (
  page: Page,
  { approvalsStatus = 200 }: { approvalsStatus?: number } = {},
) => {
  await page.route(/\/rest\/v1\//, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/rpc\//, (route) => route.fulfill(json(null)));
  await page.route(/\/rest\/v1\/rpc\/is_admin/, (route) => route.fulfill(json(true)));
  await page.route(/\/rest\/v1\/rpc\/admin_list_member_catalog_profiles/, (route) =>
    route.fulfill(json([])),
  );
  await page.route(/\/rest\/v1\/approval_requests/, (route) =>
    approvalsStatus === 200
      ? route.fulfill(json(APPROVAL_ROWS))
      : route.fulfill(json({ message: "internal error" }, approvalsStatus)),
  );
  await page.route(/\/auth\/v1\/token/, (route) => route.fulfill(json(sessionPayload())));
  await page.route(/\/auth\/v1\/logout/, (route) => route.fulfill({ status: 204, body: "" }));
};

const loginAsAdmin = async (page: Page) => {
  await page.goto("/admin");
  await page.getByPlaceholder("E-posta").fill("admin@corteqs.net");
  await page.getByPlaceholder("Şifre").fill("test-password");
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page.getByRole("button", { name: "Kullanıcı menüsü" })).toBeVisible();
};

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/visual-qa/${name}.png`, fullPage: false });

const VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "ipad-768x1024", width: 768, height: 1024 },
  { name: "iphone-390x844", width: 390, height: 844 },
  { name: "android-360x800", width: 360, height: 800 },
] as const;

test.describe("Admin V2 visual QA (manuel inceleme için screenshot üretir)", () => {
  test.skip(!RUN, "VISUAL_QA env değişkeni ile açıkça çalıştırılır");

  test("dashboard — tüm viewport'lar (light)", async ({ page }) => {
    await mockSupabase(page);
    await loginAsAdmin(page);
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(250);
      await shot(page, `dashboard-light-${vp.name}`);
    }
  });

  test("dashboard — dark mode (desktop + mobil)", async ({ page }) => {
    await mockSupabase(page);
    await loginAsAdmin(page);
    await page.getByRole("button", { name: "Koyu temaya geç" }).click();
    await page.waitForTimeout(250);
    await shot(page, "dashboard-dark-1440x900");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    await shot(page, "dashboard-dark-iphone-390x844");
  });

  test("sidebar daraltılmış (light + dark)", async ({ page }) => {
    await mockSupabase(page);
    await loginAsAdmin(page);
    await page.getByRole("button", { name: "Menüyü daralt" }).click();
    await page.waitForTimeout(250);
    await shot(page, "dashboard-collapsed-light-1440x900");
    await page.getByRole("button", { name: "Koyu temaya geç" }).click();
    await page.waitForTimeout(250);
    await shot(page, "dashboard-collapsed-dark-1440x900");
  });

  test("approvals — veri dolu (light + dark) ve mobil", async ({ page }) => {
    await mockSupabase(page);
    await loginAsAdmin(page);
    await page.goto("/admin/approvals");
    await expect(page.getByText("role_change")).toBeVisible();
    await shot(page, "approvals-data-light-1440x900");
    await page.getByRole("button", { name: "Koyu temaya geç" }).click();
    await page.waitForTimeout(250);
    await shot(page, "approvals-data-dark-1440x900");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    await shot(page, "approvals-data-light-iphone-390x844");
  });

  test("boş veri durumu (overrides)", async ({ page }) => {
    await mockSupabase(page);
    await loginAsAdmin(page);
    await page.goto("/admin/new-member/overrides");
    await expect(page.getByText("Override kaydı yok")).toBeVisible();
    await shot(page, "overrides-empty-light-1440x900");
  });

  test("API hata durumu (approvals 500)", async ({ page }) => {
    await mockSupabase(page, { approvalsStatus: 500 });
    await loginAsAdmin(page);
    await page.goto("/admin/approvals");
    await expect(page.getByText("Approval queue alınamadı")).toBeVisible();
    await shot(page, "approvals-error-light-1440x900");
  });

  test("mobil drawer açık", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockSupabase(page);
    await loginAsAdmin(page);
    await page.getByRole("button", { name: "Admin menüsünü aç" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // Sheet slide-in animasyonu ~500ms; erken screenshot panel yarı kaymış görünür.
    await page.waitForTimeout(800);
    await shot(page, "mobile-drawer-light-390x844");
  });

  test("role matrix — geniş ekran power-user görünümü", async ({ page }) => {
    await mockSupabase(page);
    await loginAsAdmin(page);
    await page.goto("/admin/new-member/role-matrix");
    await page.waitForTimeout(500);
    await shot(page, "role-matrix-light-1440x900");
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(250);
    await shot(page, "role-matrix-light-1024x768");
  });
});
