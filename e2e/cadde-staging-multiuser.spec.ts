import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const STAGING_MARKER = process.env.CADDE_E2E_ENV;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL;
const USER_A_EMAIL = process.env.CADDE_E2E_USER_A_EMAIL;
const USER_A_PASSWORD = process.env.CADDE_E2E_USER_A_PASSWORD;
const USER_B_EMAIL = process.env.CADDE_E2E_USER_B_EMAIL;
const USER_B_PASSWORD = process.env.CADDE_E2E_USER_B_PASSWORD;

const isConfigured = Boolean(
  STAGING_MARKER === "staging"
  && BASE_URL
  && USER_A_EMAIL
  && USER_A_PASSWORD
  && USER_B_EMAIL
  && USER_B_PASSWORD,
);

const assertStagingTarget = () => {
  if (!BASE_URL) throw new Error("PLAYWRIGHT_BASE_URL staging adresi zorunlu.");
  const hostname = new URL(BASE_URL).hostname.toLowerCase();
  if (hostname === "corteqs.net" || hostname === "www.corteqs.net") {
    throw new Error("Cadde yazma E2E testi production ortamında çalıştırılamaz.");
  }
};

const login = async (page: Page, email: string, password: string) => {
  await page.goto("/login?mode=login&next=%2Fcadde");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: /E-posta ve şifre ile giriş yap/i }).click();
  await expect(page).toHaveURL(/\/cadde(?:\?|$)/);
  await expect(page.getByLabel("Paylaşım metni")).toBeVisible();
};

const openAuthenticatedPage = async (context: BrowserContext, email: string, password: string) => {
  const page = await context.newPage();
  await login(page, email, password);
  return page;
};

const createApprovalCafe = async (page: Page, marker: string) => {
  await page.goto("/cadde");
  await page.getByRole("button", { name: /Cafe Aç/i }).first().click();

  const dialog = page.getByRole("dialog", { name: "Yeni Cafe" });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder(/Berlin Yazılım Sohbeti/i).fill(`${marker} Onaylı Cafe`);
  await dialog.getByPlaceholder(/Bu odada ne konuşulacak/i).fill("Staging katılım kabul testi");

  await dialog.getByText("Tema *", { exact: true }).locator("..").getByRole("combobox").click();
  await page.getByRole("option").first().click();

  await dialog.getByText("Giriş tipi", { exact: true }).locator("..").getByRole("combobox").click();
  await page.getByRole("option", { name: /Onaylı/i }).click();
  await dialog.getByPlaceholder("Katılımcıya sorulacak soru").fill("Bu cafe'ye neden katılmak istiyorsun?");
  await dialog.getByRole("button", { name: "Cafe'yi Aç" }).click();

  await expect(page).toHaveURL(/\/cadde\/cafe\/[0-9a-f-]+$/i, { timeout: 30_000 });
  return page.url();
};

const submitJoinRequest = async (page: Page, cafeUrl: string, marker: string) => {
  await page.goto(cafeUrl);
  await page.getByPlaceholder("Yanıtın").fill(`${marker} katılım yanıtı`);
  await page.getByRole("button", { name: "Katılım Talebi Gönder" }).click();
  await expect(page.getByText(/cafe sahibinin onayını bekliyor/i)).toBeVisible({ timeout: 30_000 });
};

const archiveCafe = async (page: Page, cafeUrl: string) => {
  await page.goto(cafeUrl);
  const archiveButton = page.getByRole("button", { name: "Cafe'yi Arşivle" });
  if (await archiveButton.isVisible()) {
    await archiveButton.click();
    await expect(page.getByText(/Arşiv \(read-only\)/i)).toBeVisible({ timeout: 30_000 });
  }
};

test.describe("Cadde staging multi-user acceptance (m76/m92/m134)", () => {
  test.skip(!isConfigured, "İki staging QA hesabı ve CADDE_E2E_ENV=staging sağlanmadı.");

  test.beforeAll(() => {
    assertStagingTarget();
  });

  test("user A posts an image, user B comments, and user A sees the comment", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const marker = `CADDE-E2E-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const comment = `${marker} ikinci kullanıcı yorumu`;

    try {
      const pageA = await openAuthenticatedPage(contextA, USER_A_EMAIL!, USER_A_PASSWORD!);
      const pageB = await openAuthenticatedPage(contextB, USER_B_EMAIL!, USER_B_PASSWORD!);

      await pageA.getByLabel("Paylaşım metni").fill(`${marker} görsel kalite kontrolü`);
      const imageInput = pageA.locator('input[type="file"][accept*="image/jpeg"]').first();
      await imageInput.setInputFiles({
        name: `${marker}.png`,
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAADZSiLoAAAAFElEQVR42mP8z8DAwMDAxMDAwAAAHgAB6LbpKQAAAABJRU5ErkJggg==",
          "base64",
        ),
      });
      await expect(pageA.getByTestId("cadde-composer-uploading")).toBeHidden({ timeout: 30_000 });
      await pageA.getByRole("button", { name: /^Paylaş$/ }).click();

      const cardA = pageA.getByTestId("cadde-feed-card").filter({ hasText: marker }).first();
      await expect(cardA).toBeVisible({ timeout: 30_000 });
      const embeddedImage = cardA.locator("img").first();
      await expect(embeddedImage).toHaveClass(/object-contain/);
      await expect.poll(() => embeddedImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
      await expect.poll(() => embeddedImage.evaluate((image: HTMLImageElement) => image.naturalHeight)).toBeGreaterThan(0);
      await cardA.getByRole("button", { name: /büyüt/i }).click();
      await expect(pageA.getByRole("dialog")).toBeVisible();
      await pageA.keyboard.press("Escape");

      await pageB.reload();
      const cardB = pageB.getByTestId("cadde-feed-card").filter({ hasText: marker }).first();
      await expect(cardB).toBeVisible({ timeout: 30_000 });
      await cardB.getByTestId("cadde-comment-toggle").click();
      const panelB = cardB.getByTestId("cadde-comment-panel");
      await panelB.getByPlaceholder("Yorum yaz").fill(comment);
      await panelB.getByRole("button", { name: "Gönder" }).click();
      await expect(panelB.getByPlaceholder("Yorum yaz")).toHaveValue("");

      await cardA.getByTestId("cadde-comment-toggle").click();
      await expect(cardA.getByText(comment)).toBeVisible({ timeout: 30_000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test("requester profile is visible to the cafe owner and approval/rejection both work", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const marker = `CADDE-CAFE-E2E-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdCafeUrls: string[] = [];

    try {
      const pageA = await openAuthenticatedPage(contextA, USER_A_EMAIL!, USER_A_PASSWORD!);
      const pageB = await openAuthenticatedPage(contextB, USER_B_EMAIL!, USER_B_PASSWORD!);

      const approvedCafeUrl = await createApprovalCafe(pageA, `${marker}-APPROVE`);
      createdCafeUrls.push(approvedCafeUrl);
      await submitJoinRequest(pageB, approvedCafeUrl, marker);

      await pageA.goto(approvedCafeUrl);
      await expect(pageA.getByRole("heading", { name: "Üye Onay Paneli" })).toBeVisible({ timeout: 30_000 });
      const requesterProfile = pageA.getByRole("link", { name: "Açık profili görüntüle" });
      await expect(requesterProfile).toBeVisible();
      await requesterProfile.click();
      await expect(pageA).toHaveURL(/\/directory\//, { timeout: 30_000 });
      await pageA.goto(approvedCafeUrl);
      await pageA.getByRole("button", { name: "Onayla" }).click();

      await pageB.goto(approvedCafeUrl);
      await expect(pageB.getByLabel("Paylaşım metni")).toBeVisible({ timeout: 30_000 });

      const rejectedCafeUrl = await createApprovalCafe(pageA, `${marker}-REJECT`);
      createdCafeUrls.push(rejectedCafeUrl);
      await submitJoinRequest(pageB, rejectedCafeUrl, marker);

      await pageA.goto(rejectedCafeUrl);
      await pageA.getByRole("button", { name: "Reddet" }).click();
      await pageB.goto(rejectedCafeUrl);
      await expect(pageB.getByRole("button", { name: "Katılım Talebi Gönder" })).toBeVisible({ timeout: 30_000 });
    } finally {
      const cleanupPage = contextA.pages()[0];
      if (cleanupPage) {
        for (const cafeUrl of createdCafeUrls) {
          await archiveCafe(cleanupPage, cafeUrl).catch(() => undefined);
        }
      }
      await contextA.close();
      await contextB.close();
    }
  });
});
