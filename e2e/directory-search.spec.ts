import { expect, test } from "@playwright/test";

test.describe("Public directory search", () => {
  test("anonymous visitor can search and clear the query from the public directory", async ({ page }) => {
    // Directory'nin arka plan sorguları ağda bekleyebilir; arama kontrolü DOM
    // hazır olduğunda kullanılabilir. Tüm görsel kaynakların `load` olayını
    // beklemek bu kritik kullanıcı akışını gereksizce zaman aşımına uğratır.
    await page.goto("/directory", { waitUntil: "domcontentloaded" });

    const search = page.getByPlaceholder("İsim, bio veya role özel alan ara...");
    await expect(search).toBeVisible();

    await search.fill("Dortmund");
    await expect(page).toHaveURL(/\/directory\?q=Dortmund$/);

    await page.getByRole("button", { name: "Aramayı temizle" }).click();
    await expect(page).toHaveURL(/\/directory$/);
  });
});
