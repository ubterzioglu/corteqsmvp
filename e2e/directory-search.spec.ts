import { expect, test } from "@playwright/test";

test.describe("Public directory search", () => {
  test("anonymous visitor can search and clear the query from the public directory", async ({ page }) => {
    await page.goto("/directory");

    const search = page.getByPlaceholder("İsim, bio veya role özel alan ara...");
    await expect(search).toBeVisible();

    await search.fill("Dortmund");
    await expect(page).toHaveURL(/\/directory\?q=Dortmund$/);

    await page.getByRole("button", { name: "Aramayı temizle" }).click();
    await expect(page).toHaveURL(/\/directory$/);
  });
});
