import { expect, test } from "@playwright/test";

const PAGE_EXPECTATIONS = [
  {
    path: "/",
    title: "CorteQS | Dünyadaki Türkleri Bir Araya Getiren Platform",
    description: "CorteQS, dünyadaki Türkleri şehir bazlı bağlantılar, topluluklar ve fırsatlar etrafında buluşturan diaspora platformudur.",
    canonical: "https://corteqs.net/",
    heading: /Dünyanın\s*Her Yerindeki\s*Türkler İçin\s*Tek Ağ/i,
  },
  {
    path: "/founders",
    title: "Kurucular | CorteQS",
    description: "CorteQS kurucu ekibini, diaspora vizyonunu ve platformun güven temelli büyüme yaklaşımını keşfedin.",
    canonical: "https://corteqs.net/founders",
    heading: /Burak Akçakanat|Umut Barış Terzioğlu/i,
  },
  {
    path: "/pricing",
    title: "Fiyatlandırma | CorteQS",
    description: "CorteQS danışman, kuruluş ve işletme paketlerini karşılaştırın; size uygun üyelik planını seçin.",
    canonical: "https://corteqs.net/pricing",
    heading: /İhtiyacına uygun planı seç/i,
  },
  {
    path: "/founding-1000",
    title: "Founding 1000 | CorteQS",
    description: "CorteQS Founding 1000 programına katılın; erken dönem topluluk ve görünürlük avantajlarını keşfedin.",
    canonical: "https://corteqs.net/founding-1000",
    heading: /Founding 1000/i,
  },
  {
    path: "/iletisim",
    title: "İletişim | CorteQS",
    description: "CorteQS ile iletişime geçin. Destek, iş birliği ve topluluk soruları için resmi kanallarımızı kullanın.",
    canonical: "https://corteqs.net/iletisim",
    heading: /İletişim/i,
  },
  {
    path: "/kariyer",
    title: "Kariyer | CorteQS",
    description: "CorteQS kariyer sayfasında açık rollerimizi ve global diaspora ekosistemini birlikte büyütme fırsatlarını inceleyin.",
    canonical: "https://corteqs.net/kariyer",
    heading: /CorteQS Global Ekibine Katıl/i,
  },
  {
    path: "/radar/rehberler",
    title: "CorteQS Radar | Ülke Rehberleri",
    description: "CorteQS Radar rehberlerinde ülkeler, şehirler ve diaspora yaşamına dair başlangıç bilgilerini tek sayfada bulun.",
    canonical: "https://corteqs.net/radar/rehberler",
    heading: /Haberler, Duyurular ve Ülke Rehberleri/i,
  },
  {
    path: "/legal/privacy",
    title: "Gizlilik Politikası | CorteQS",
    description: "CorteQS Gizlilik Politikası; kişisel verilerin nasıl toplandığını, işlendiğini, korunduğunu ve hangi haklara sahip olduğunuzu açıklar.",
    canonical: "https://corteqs.net/legal/privacy",
    heading: /Gizlilik Politikası/i,
  },
  {
    path: "/legal/kvkk",
    title: "KVKK ve Aydınlatma Metni | CorteQS",
    description: "CorteQS KVKK, GDPR ve ilgili veri koruma çerçevelerine ilişkin aydınlatma metnini inceleyin.",
    canonical: "https://corteqs.net/legal/kvkk",
    heading: /KVKK/i,
  },
  {
    path: "/legal/terms",
    title: "Kullanım Şartları | CorteQS",
    description: "CorteQS kullanım şartlarını, platform sorumluluklarını ve üyelik kurallarını Türkçe olarak inceleyin.",
    canonical: "https://corteqs.net/legal/terms",
    heading: /Kullanım Şartları/i,
  },
  {
    path: "/legal/cookies",
    title: "Çerez Politikası | CorteQS",
    description: "CorteQS çerez politikası; zorunlu, işlevsel ve analitik çerezlerin kullanımını ve tercih yönetimini açıklar.",
    canonical: "https://corteqs.net/legal/cookies",
    heading: /Çerez Politikası/i,
  },
] as const;

test("public mobile routes keep route-specific Turkish SEO metadata", async ({ page }) => {
  for (const route of PAGE_EXPECTATIONS) {
    await page.goto(route.path);

    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", route.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", route.canonical);
    await expect(page.locator("body")).toContainText(route.heading);
  }
});

test("contact and CTA surfaces use the official WhatsApp community link", async ({ page }) => {
  await page.goto("/iletisim");

  const hrefs = await page.locator("a").evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("href") ?? ""),
  );

  expect(hrefs).not.toContain("https://wa.me/message/corteqs");
  expect(hrefs).toContain("https://chat.whatsapp.com/IOpBgZK29CQEhhdOd5hUAD");
});

test("public pages preserve Turkish characters on mobile", async ({ page }) => {
  await page.goto("/legal/privacy");
  await expect(page.locator("body")).toContainText("Gizlilik Politikası");
  await expect(page.locator("body")).toContainText("kişisel verilerinizi");

  await page.goto("/iletisim");
  await expect(page.locator("body")).toContainText("İletişim");
  await expect(page.locator("body")).toContainText("Dünyanın dört bir yanından Türk diasporasına hizmet veriyoruz");
});

test("mobile scroll-top button stays compact and appears only after scroll", async ({ page }) => {
  await page.goto("/founders");

  const button = page.getByTestId("scroll-top-button");
  await expect(button).toHaveCSS("opacity", "0");

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" }));
  await expect(button).toHaveCSS("opacity", "1");

  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.width ?? 0) <= 56).toBe(true);
  await expect(button.locator("text=UP")).toBeHidden();
});
