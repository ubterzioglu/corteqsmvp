/**
 * Public rotalar smoke testi — `docs/plans/2026-09-20-public-rotalar-sitemap-plani.md`.
 *
 * NEDEN BU TEST VAR: 20 Eylül'de dört yeni public rota eklendi
 * (`/city-ambassadors`, `/consultants`, `/businesses`, `/isletme/:slug`) ve
 * `/businesses` DEMO olarak işaretlendi. Bu sınıfın kusuru SESSİZDİR — rota
 * `App.tsx`'e eklenmezse ya da `DEMO_ROUTES`'taki yol `App.tsx`'teki `path` ile
 * birebir tutmazsa ne lint ne birim testi patlar; ziyaretçi 404 görür ya da
 * demo içeriği gerçek sanır. Bu dosya ikisini de tarayıcıda kanıtlar.
 *
 * ⚠️ 404 KONTROLÜ BAŞLIKTAN YAPILIR: SPA gerçek HTTP 404 döndürmez (bkz.
 * `src/pages/NotFound.tsx`), olmayan yol 200 + NotFound kabuğu olarak gelir.
 * Yani `response.status()` her zaman 200'dür ve hiçbir şey kanıtlamaz. Sayfanın
 * kendi `useSeo` başlığı ile `<h1>`'i tek güvenilir işarettir.
 *
 * Çalıştırma: `npx playwright test e2e/public-rotalar-smoke.spec.ts`
 * (webServer yoksa `npm run dev` kendiliğinden ayağa kalkar).
 */

import { expect, test } from "@playwright/test";

const NOT_FOUND_TITLE = "Sayfa bulunamadı | CorteQS";

/** Demo işletme detayı için kullanılan slug — `src/data/mock.ts`'teki ilk kayıt. */
const DEMO_BUSINESS_SLUG = "turkish-hospital-qatar";

const ROUTE_EXPECTATIONS = [
  {
    path: "/city-ambassadors",
    title: "Şehir Elçileri | CorteQS",
    canonical: "https://corteqs.net/city-ambassadors",
    heading: "Şehir Elçileri",
  },
  {
    path: "/consultants",
    title: "Uzmanlar ve Danışmanlar | CorteQS",
    canonical: "https://corteqs.net/consultants",
    heading: "Uzmanlar",
  },
  {
    path: "/businesses",
    title: "İşletmeler | CorteQS",
    canonical: "https://corteqs.net/businesses",
    heading: "İşletmeler",
  },
];

test.describe("Public rotalar — Batch 0 smoke", () => {
  for (const route of ROUTE_EXPECTATIONS) {
    test(`${route.path} açılıyor ve 404 değil`, async ({ page }) => {
      await page.goto(route.path);

      await expect(page).toHaveTitle(route.title);
      expect(await page.title()).not.toBe(NOT_FOUND_TITLE);

      await expect(
        page.getByRole("heading", { level: 1, name: route.heading, exact: true }),
      ).toBeVisible();

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        route.canonical,
      );
    });
  }

  test(`/isletme/${DEMO_BUSINESS_SLUG} açılıyor ve 404 değil`, async ({ page }) => {
    await page.goto(`/isletme/${DEMO_BUSINESS_SLUG}`);

    expect(await page.title()).not.toBe(NOT_FOUND_TITLE);
    await expect(
      page.getByRole("heading", { level: 1, name: "Turkish Hospital Qatar" }),
    ).toBeVisible();

    // Uydurma içerik indekslenmemeli — sayfanın kendi kuralı.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, follow",
    );
  });
});

test.describe("Demo işaretleri — Batch 1", () => {
  test("/businesses kapatılamaz DEMO bandı taşır", async ({ page }) => {
    await page.goto("/businesses");

    // Bant `SiteHeader` tarafından `DEMO_ROUTES`'tan çizilir. Görünmüyorsa ya
    // satır listeden düşmüştür ya da yol `App.tsx` ile tutmuyordur.
    await expect(page.getByText("Demo sayfa: İşletmeler.")).toBeVisible();
  });

  test("/isletme/:slug detay bandı taşır", async ({ page }) => {
    await page.goto(`/isletme/${DEMO_BUSINESS_SLUG}`);

    // Dinamik yol `DEMO_ROUTES` ile eşleşemez; bu sayfa `DemoPageBanner` kullanır.
    await expect(page.getByText(/Bu profil örnek içeriktir/)).toBeVisible();
  });

  test("ana sayfadaki İşletmeler kartı DEMO rozeti taşır", async ({ page }) => {
    await page.goto("/");

    const card = page.getByRole("link").filter({ hasText: "İşletmeleri keşfet" }).first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute("href", "/businesses");
    await expect(card.getByText("DEMO", { exact: true })).toBeVisible();
  });

  test("demo OLMAYAN kartlar rozet taşımaz", async ({ page }) => {
    await page.goto("/");

    // Karşı kontrol: rozet her karta değil, yalnız `DEMO_ROUTES`'takilere çıkmalı.
    const card = page.getByRole("link").filter({ hasText: "Uzmanları bul" }).first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute("href", "/consultants");
    await expect(card.getByText("DEMO", { exact: true })).toHaveCount(0);
  });
});

test.describe("Kırık bağlantı — Batch 3", () => {
  test("/associations hiçbir kartta tanımsız /radio/ bağlantısı kalmadı", async ({ page }) => {
    await page.goto("/associations");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    // `/radio/:id/song-request` rotası `App.tsx`'te HİÇ tanımlı değildi; düğme
    // 404 kabuğuna düşüyordu. Bağlantı kaldırıldı, geri gelirse burası düşer.
    await expect(page.locator('a[href*="/radio/"]')).toHaveCount(0);
  });
});

test.describe("Hareketsiz düğme kontrolü — B11.5", () => {
  // B11.1–B11.4: AssociationDetail'deki demo butonlar üç kovaya ayrıldı:
  // - Bağla (Paylaş → MapShareButtons)
  // - Kaldır (E-Konsolosluk)
  // - Yakında (disabled + tooltip)
  // Bu test, disabled olmayan buton sayısının kabul edilen eşiği aşmadığını doğrular.
  // Yeni bir buton eklenirse ve unutulursa bu test düşer.
  test("/association/:id — hareketsiz buton sayısı kabul edilen eşikte", async ({ page }) => {
    await page.goto("/associations");
    // İlk kuruluş kartına tıkla
    const firstCard = page.getByRole("link").filter({ hasText: /Dernek/ }).first();
    await firstCard.click();
    await page.waitForURL(/\/association\//);

    // Tüm butonları say
    const allButtons = page.getByRole("button");
    const allCount = await allButtons.count();

    // Disabled butonları say
    const disabledButtons = page.getByRole("button").filter({ disabled: true });
    const disabledCount = await disabledButtons.count();

    // Aktif (disabled olmayan) butonlar: takip, harita, yol tarifi, web sitesi (hospital ise)
    const activeCount = allCount - disabledCount;

    // Kabul edilen eşik: 5 aktif buton (Takip Et/Dinle, Konum, Yol Tarifi, Paylaş, + hospital/diplomatic ise 1-2 daha)
    // Eğer yeni bir buton eklenirse ve disabled yapılmazsa bu test düşer.
    expect(activeCount).toBeLessThanOrEqual(7);

    // Disabled butonlar "Yakında" tooltip'i taşımalı
    // En az bir disabled buton olmalı (demo sayfa olduğu için)
    expect(disabledCount).toBeGreaterThanOrEqual(5);
  });
});
