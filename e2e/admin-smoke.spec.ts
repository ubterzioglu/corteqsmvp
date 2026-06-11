import { expect, test, type Page } from "@playwright/test";

/**
 * Admin Panel V2 smoke (masterplan §19.2 — E2E-ADMIN-001…014).
 * Supabase auth + REST çağrıları network katmanında mock'lanır; canlı fixture
 * gerekmez (public-profile.spec.ts ile aynı desen). Davranış assert'leri sığ
 * tutulur: URL + kritik metin/etiket.
 */

const b64url = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

// İmza doğrulaması client'ta yapılmaz; decode edilebilir sahte JWT yeterli.
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
    payload: { requested_role: "Member" },
    status: "pending",
    admin_note: null,
    created_at: "2026-06-01T10:00:00Z",
  },
];

const AUDIT_ROWS = [
  {
    id: "log-1",
    actor_user_id: "admin-user-1",
    action: "role_assigned",
    target_user_id: "user-77",
    target_entity_type: "user",
    target_entity_id: "user-77",
    before_value: { role: null },
    after_value: { role: "Member" },
    created_at: "2026-06-01T11:00:00Z",
  },
];

const ROLE_ROWS = [
  { key: "User_Standard", label: "Standart Kullanıcı" },
  { key: "Consultant_RealEstate", label: "Gayrimenkul Danışmanı" },
];

const ROLE_BUNDLE = {
  role: { id: "role-1", key: "User_Standard", label: "Standart Kullanıcı" },
  attributes: [],
  features: [],
  sections: [],
};

/**
 * Supabase mock katmanı. Playwright'ta en son register edilen route önce
 * eşleşir; bu yüzden catch-all en başta, spesifik mock'lar sonra kayıtlıdır.
 */
const mockSupabase = async (page: Page, { isAdmin = true } = {}) => {
  await page.route(/\/rest\/v1\//, (route) => route.fulfill(json([])));
  await page.route(/\/rest\/v1\/rpc\//, (route) => route.fulfill(json(null)));
  await page.route(/\/rest\/v1\/rpc\/is_admin/, (route) => route.fulfill(json(isAdmin)));
  await page.route(/\/rest\/v1\/rpc\/get_role_management_bundle/, (route) =>
    route.fulfill(json(ROLE_BUNDLE)),
  );
  await page.route(/\/rest\/v1\/rpc\/admin_list_member_catalog_profiles/, (route) =>
    route.fulfill(json([])),
  );
  await page.route(/\/rest\/v1\/approval_requests/, (route) => route.fulfill(json(APPROVAL_ROWS)));
  await page.route(/\/rest\/v1\/admin_audit_logs/, (route) => route.fulfill(json(AUDIT_ROWS)));
  await page.route(/\/rest\/v1\/roles\?/, (route) => route.fulfill(json(ROLE_ROWS)));
  await page.route(/\/auth\/v1\/token/, (route) => route.fulfill(json(sessionPayload())));
  await page.route(/\/auth\/v1\/logout/, (route) => route.fulfill({ status: 204, body: "" }));
  await page.route(/\/auth\/v1\/user/, (route) => route.fulfill(json(sessionPayload().user)));
};

const loginAsAdmin = async (page: Page) => {
  await page.goto("/admin");
  await page.getByPlaceholder("E-posta").fill("admin@corteqs.net");
  await page.getByPlaceholder("Şifre").fill("test-password");
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page.getByRole("button", { name: "Kullanıcı menüsü" })).toBeVisible();
};

// Dashboard'daki modül kartları/quick action'lar sidebar ile aynı isimde link
// üretir; strict mode çakışmaması için sidebar'a scope'lanır.
const sidebarNav = (page: Page) => page.getByLabel("Admin navigasyonu");

test("E2E-ADMIN-001 admin login ile shell açılır", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await expect(sidebarNav(page).getByRole("link", { name: "Kayıt Veritabanı" })).toBeVisible();
  await expect(page).toHaveURL(/\/admin$/);
});

test("E2E-ADMIN-002 admin olmayan kullanıcı erişim reddi görür", async ({ page }) => {
  await mockSupabase(page, { isAdmin: false });
  await page.goto("/admin");
  await page.getByPlaceholder("E-posta").fill("user@corteqs.net");
  await page.getByPlaceholder("Şifre").fill("test-password");
  await page.getByRole("button", { name: "Giriş Yap" }).click();

  await expect(page.getByText("Bu hesabın yönetici yetkisi bulunmuyor")).toBeVisible();
  // Drop edilmiş admin_users tablosuna referans verilmez (masterplan §11.2 / DoD).
  await expect(page.locator("body")).not.toContainText("admin_users");
});

test("E2E-ADMIN-003 sidebar ile katalog ekranına geçiş", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await sidebarNav(page).getByRole("link", { name: "Kayıt Veritabanı" }).click();
  await expect(page).toHaveURL(/\/admin\/data$/);
  await expect(page.getByRole("heading", { level: 1, name: "Kayıt Veritabanı" })).toBeVisible();
});

test("E2E-ADMIN-004 sidebar collapse refresh sonrası korunur", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await page.getByRole("button", { name: "Menüyü daralt" }).click();
  await expect(page.getByRole("button", { name: "Menüyü genişlet" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Menüyü genişlet" })).toBeVisible();
});

test("E2E-ADMIN-005 mobile drawer açılır ve navigasyon çalışır", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSupabase(page);
  await loginAsAdmin(page);

  await page.getByRole("button", { name: "Admin menüsünü aç" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("link", { name: "Approval Queue" }).click();
  await expect(page).toHaveURL(/\/admin\/approvals$/);
});

test("E2E-ADMIN-006 Ctrl+K palette ile Feature Override açılır", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder(/Ekran ara/).fill("override");
  await dialog.getByText("Feature Override", { exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/new-member\/overrides$/);
});

test("E2E-ADMIN-007 breadcrumb aktif sayfayı gösterir", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await page.goto("/admin/data");
  const breadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
  await expect(breadcrumb).toContainText("Kayıt Veritabanı");
});

test("E2E-ADMIN-008 dashboard quick action approvals'a götürür", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await page.getByRole("link", { name: "Approval Queue aç" }).click();
  await expect(page).toHaveURL(/\/admin\/approvals$/);
});

test("E2E-ADMIN-009 Approval Queue kayıtları yüklenir", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await page.goto("/admin/approvals");
  await expect(page.getByText("role_change")).toBeVisible();
  await expect(page.getByRole("button", { name: "Onayla" })).toBeEnabled();
});

test("E2E-ADMIN-010 Audit Logs kayıtları yüklenir", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await page.goto("/admin/audit-logs");
  await expect(page.getByText("role_assigned")).toBeVisible();
});

test("E2E-ADMIN-011 AFS matrisinde role query param korunur", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await page.goto("/admin/new-member/role-matrix");
  await page.getByRole("combobox").first().click();
  await page.getByText("Standart Kullanıcı", { exact: true }).click();
  await expect(page).toHaveURL(/role=User_Standard/);

  await page.reload();
  await expect(page).toHaveURL(/role=User_Standard/);
});

test("E2E-ADMIN-012 muhasebe nested route geçişleri", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await sidebarNav(page).getByRole("button", { name: "Muhasebe" }).click();
  await sidebarNav(page).getByRole("link", { name: "Muhasebe Dashboard" }).click();
  await expect(page).toHaveURL(/\/admin\/muhasebe$/);

  await page.goto("/admin/muhasebe/gelirler");
  await expect(page).toHaveURL(/\/admin\/muhasebe\/gelirler$/);
  const breadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
  await expect(breadcrumb).toContainText("Muhasebe");
});

test("E2E-ADMIN-013 workspace nested route geçişleri", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await sidebarNav(page).getByRole("button", { name: "Operasyon Workspace" }).click();
  await sidebarNav(page).getByRole("link", { name: "Command Center" }).click();
  await expect(page).toHaveURL(/\/admin\/workspace\/command-center$/);
});

test("QA-RESPONSIVE mobil görünümde yatay taşma yok", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSupabase(page);
  await loginAsAdmin(page);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("QA-DARK tema toggle dark class uygular ve refresh sonrası korunur", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await page.getByRole("button", { name: "Koyu temaya geç" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.getByRole("button", { name: "Kullanıcı menüsü" })).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("E2E-ADMIN-015 güncellemeler rozeti okununca söner ve guide açılır", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  // Okunmamış güncelleme rozeti görünür (statik liste >9 ise "9+").
  const bell = page.getByRole("button", { name: "Güncellemeler" });
  await expect(bell).toBeVisible();
  await expect(bell.locator("span").first()).toHaveText(/^([1-9]\d*|9\+)$/);

  // Menü açılınca tümü okundu sayılır; rozet kaybolur ve refresh sonrası geri gelmez.
  await bell.click();
  await expect(page.getByRole("menuitem", { name: "Tümünü gör" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(bell.locator("span", { hasText: /^([1-9]\d*|9\+)$/ })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("button", { name: "Kullanıcı menüsü" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Güncellemeler" }).locator("span", { hasText: /^([1-9]\d*|9\+)$/ }),
  ).toHaveCount(0);

  // Topbar'daki kılavuz butonu /admin/guide'ı açar (exact: sidebar "Yardım — kullanım
  // kılavuzu" ve registry "Admin Kullanım Kılavuzu" linkleriyle substring çakışır).
  await page.getByRole("link", { name: "Kullanım kılavuzu", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/guide$/);
  await expect(page.getByRole("heading", { level: 1, name: "Admin Kullanım Kılavuzu" })).toBeVisible();
});

test("E2E-ADMIN-014 logout login ekranına döndürür", async ({ page }) => {
  await mockSupabase(page);
  await loginAsAdmin(page);

  await page.getByRole("button", { name: "Kullanıcı menüsü" }).click();
  await page.getByRole("menuitem", { name: "Çıkış" }).click();
  await expect(page.getByText("Admin Giriş")).toBeVisible();
});
