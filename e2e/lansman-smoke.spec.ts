/**
 * 1 Ocak lansmanı — duman (smoke) testi, batch L3.4.
 *
 * Yeniden tasarım (L4–L8) sırasında "site hâlâ ayakta mı?" sorusunun tarayıcıdaki cevabı.
 * Beş akış da GİRİŞ GEREKTİRMEZ. Statik sözleşmeler (rota var mı, analitik etiketi var mı)
 * `src/lib/lansman-regression-contract.test.ts` içindedir; burada yalnız çizimin gerçekten
 * olduğu doğrulanır.
 *
 * ⚠️ SPA gerçek HTTP 404 döndürmez (bkz. `src/pages/NotFound.tsx`): `response.status()` her
 * zaman 200'dür ve hiçbir şey kanıtlamaz. Sayfa içeriği/başlığı tek güvenilir işarettir.
 *
 * ⚠️ `/directory?q=avukat` canlı Supabase'e anonim RPC atar. Sonuç sayısı canlı veriye bağlıdır;
 * test sayıyı DEĞİL, en az bir sonuç kartı çizildiğini doğrular (boş sonuç ve hata durumu BAŞARISIZLIKTIR).
 * Ağ hiç yoksa yükleme durumunda kalır ve test AÇIKÇA düşer — sahte yeşil üretmez.
 *
 * Çalıştırma (yapılandırma 8099 portunu kullanır):
 *   npx playwright test e2e/lansman-smoke.spec.ts --project=chromium
 */

import { expect, test } from "@playwright/test";

test.describe("Lansman smoke — girişsiz ziyaretçi", () => {
  test("ana sayfa: hero başlığı ve arama çubuğu çiziliyor", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("search").first()).toBeVisible();
    await expect(page.locator('input[type="search"]').first()).toBeVisible();
    await expect(page).not.toHaveTitle("Sayfa bulunamadı | CorteQS");
  });

  test("/directory?q=avukat: arama kutusu sorguyu taşıyor ve EN AZ BİR sonuç kartı çiziliyor", async ({ page }) => {
    await page.goto("/directory?q=avukat", { waitUntil: "domcontentloaded" });

    await expect(page.getByPlaceholder("İsim, bio veya role özel alan ara...")).toHaveValue("avukat");
    await expect(page).toHaveURL(/\/directory\?q=avukat/);

    // Hata durumu (RPC düştü) açıkça başarısızlıktır — "sonuç yok" gibi geçmez.
    await expect(page.getByText(/Dizin alınamadı/)).toHaveCount(0);

    // Sonuç kartı = kayıt/profil detay bağlantısı (DirectoryResultCard / DirectoryResultRow → row.href).
    // "avukat" canlıda gerçek kayıt getirir (CLAUDE.md: dizin araması anonime açık, "Berlin avukat" 11 sonuç);
    // boş sonuç da regresyondur: arama RPC'si bozulduğunda bu test KIRMIZI olmalı.
    const cards = page.locator('a[href^="/directory/catalog/"], a[href^="/directory/profile/"]');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    await expect(page.getByText(/Dizin alınamadı/)).toHaveCount(0);
  });
  test("/login: giriş formu (e-posta + parola) çiziliyor", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /giriş/i }).first()).toBeVisible();
  });

  test("/pricing: plan kartları çiziliyor", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1, name: "İhtiyacına uygun planı seç" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Freemium" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Premium Pro" }).first()).toBeVisible();
  });

  test("/cadde: ziyaretçi Cadde'yi görmez, giriş kapısına (next=/cadde) yönlenir", async ({ page }) => {
    await page.goto("/cadde", { waitUntil: "domcontentloaded" });

    // RequireAuth: oturum yoksa `/login?next=%2Fcadde` (src/components/auth/RequireAuth.tsx).
    await expect(page).toHaveURL(/\/login\?next=%2Fcadde/, { timeout: 30_000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    // Cadde içeriği (akış) çizilmemeli.
    await expect(page.getByText("Yükleniyor...")).toHaveCount(0);
  });
});
