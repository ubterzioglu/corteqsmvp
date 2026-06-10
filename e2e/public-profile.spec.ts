import { expect, test, type Page } from "@playwright/test";

/**
 * Public catalog profile E2E.
 * Supabase REST calls are mocked at the network layer so the suite runs
 * against any dev/preview server without live fixtures.
 */

const RPC_GLOB = "**/rest/v1/rpc/get_catalog_item_public_page_v2*";

const makePayload = (
  overrides: { item?: Record<string, unknown>; sections?: unknown[]; attributes?: unknown[] } = {},
) => ({
  item: {
    id: "item-1",
    slug: "member-arkin-kara",
    title: "Arkin Kara",
    itemType: "member",
    roleKey: "Member",
    roleLabel: "Üye",
    headline: "Genel Tıp",
    shortDescription: null,
    longDescription: null,
    avatarUrl: null,
    coverImageUrl: null,
    verificationStatus: "unverified",
    isVerified: false,
    isClaimable: true,
    city: "Dortmund",
    countryCode: "DE",
    countryLabel: "Almanya",
    addressLine: null,
    categories: [{ slug: "doctor", name: "Doktor", isPrimary: true }],
    ...(overrides.item ?? {}),
  },
  sections: overrides.sections ?? [
    {
      sectionKey: "detail.hakkinda_bio",
      label: "Hakkında",
      description: null,
      sectionArea: "detail_card",
      componentKey: "rich_text",
      sortOrder: 110,
      content: { text: "Dortmund'da Türkçe hizmet veren doktor." },
    },
  ],
  attributes: overrides.attributes ?? [],
  contacts: [
    { type: "phone", value: "+49 231 818 687", label: null, isPrimary: true },
    { type: "website", value: "https://example.com", label: null, isPrimary: false },
  ],
  links: [],
  services: [{ name: "Genel Tıp", description: null }],
  languages: [{ code: "tr", proficiency: "native_or_fluent" }],
  media: [],
  claim: { canClaim: true, verificationStatus: "unverified" },
});

const mockProfileRpc = async (page: Page, payload: unknown) => {
  await page.route(RPC_GLOB, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(hasHorizontalOverflow).toBe(false);
};

test("anonymous visitor can open a published public member profile", async ({ page }) => {
  await mockProfileRpc(page, makePayload());

  await page.goto("/directory/catalog/member-arkin-kara");

  await expect(page.getByRole("heading", { name: "Arkin Kara", level: 1 })).toBeVisible();
  await expect(page.getByText("Üye")).toBeVisible();
  await expect(page.getByText("Dortmund • Almanya")).toBeVisible();
  await expect(page.getByText("Hakkında")).toBeVisible();
  await expect(page.getByText("Dortmund'da Türkçe hizmet veren doktor.")).toBeVisible();
});

test("catalog profile renders avatar or initials fallback", async ({ page }) => {
  await mockProfileRpc(page, makePayload());

  await page.goto("/directory/catalog/member-arkin-kara");

  await expect(page.getByLabel("Arkin Kara")).toHaveText("AK");
});

test("public website quick action opens safely in a new tab", async ({ page }) => {
  await mockProfileRpc(page, makePayload());

  await page.goto("/directory/catalog/member-arkin-kara");

  const websiteLink = page.getByRole("link", { name: "Web Sitesi" });
  await expect(websiteLink).toHaveAttribute("target", "_blank");
  await expect(websiteLink).toHaveAttribute("rel", "noreferrer");
  await expect(websiteLink).toHaveAttribute("href", "https://example.com/");
});

test("catalog profile is responsive without horizontal overflow", async ({ page }) => {
  await mockProfileRpc(page, makePayload());

  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/directory/catalog/member-arkin-kara");
  await expect(page.getByRole("heading", { name: "Arkin Kara", level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 375, height: 720 });
  await expectNoHorizontalOverflow(page);
});

test("legacy directory profile slug route redirects to canonical catalog slug", async ({ page }) => {
  await mockProfileRpc(page, makePayload());

  await page.goto("/directory/profile/member-arkin-kara");

  await expect(page).toHaveURL(/\/directory\/catalog\/member-arkin-kara$/);
  await expect(page.getByRole("heading", { name: "Arkin Kara", level: 1 })).toBeVisible();
});

test("legacy directory profile uuid route redirects to canonical catalog slug", async ({ page }) => {
  await mockProfileRpc(page, makePayload());
  await page.route("**/rest/v1/catalog_items*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ slug: "member-arkin-kara" }),
    });
  });

  await page.goto("/directory/profile/2b6e8d0a-50db-4f3a-bd34-111111111111");

  await expect(page).toHaveURL(/\/directory\/catalog\/member-arkin-kara$/);
});

test("anonymous claim action redirects to signup with next url", async ({ page }) => {
  await mockProfileRpc(page, makePayload());

  await page.goto("/directory/catalog/member-arkin-kara");

  const claimCta = page.getByRole("link", { name: "Düzenleme Yetkisi Talep Et" });
  await expect(claimCta).toHaveAttribute(
    "href",
    "/login?mode=signup&next=%2Fdirectory%2Fcatalog%2Fmember-arkin-kara",
  );
});

test("private or unpublished profile does not leak details", async ({ page }) => {
  await mockProfileRpc(page, null);

  await page.goto("/directory/catalog/gizli-profil");

  await expect(page.getByText("Bu profil şu anda görüntülenemiyor")).toBeVisible();
  // Breadcrumb ve CTA aynı metni taşır — ikisi de /directory'ye gider.
  await expect(page.getByRole("link", { name: "Dizine Dön" }).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("gizli-profil-basligi");
});

test("unknown component key renders generic public section", async ({ page }) => {
  await mockProfileRpc(
    page,
    makePayload({
      sections: [
        {
          sectionKey: "detail.yeni",
          label: "Yepyeni Bölüm",
          description: null,
          sectionArea: "detail_card",
          componentKey: "brand_new_widget",
          sortOrder: 120,
          content: { headline: "Yeni içerik" },
        },
      ],
    }),
  );

  await page.goto("/directory/catalog/member-arkin-kara");

  await expect(page.getByText("Yepyeni Bölüm")).toBeVisible();
  await expect(page.getByText("Yeni içerik")).toBeVisible();
});

test("fully populated member renders hero badges, tagline and link pills", async ({ page }) => {
  await mockProfileRpc(
    page,
    makePayload({
      attributes: [
        { key: "job_seeking_opt_in", label: "İş Arıyorum", dataType: "boolean", sortOrder: 1, valueText: null, valueJson: true },
        { key: "volunteer_mentorship_opt_in", label: "Gönüllü Mentörlük", dataType: "boolean", sortOrder: 2, valueText: null, valueJson: true },
        { key: "moving_soon_opt_in", label: "Yakında Taşınacağım", dataType: "boolean", sortOrder: 3, valueText: null, valueJson: true },
        { key: "linkedin_url", label: "LinkedIn", dataType: "url", sortOrder: 4, valueText: "https://www.linkedin.com/in/arkin-kara", valueJson: null },
        { key: "instagram_url", label: "Instagram", dataType: "url", sortOrder: 5, valueText: "https://www.instagram.com/arkinkara", valueJson: null },
        { key: "expertise_area", label: "Uzmanlık Alanı", dataType: "text", sortOrder: 6, valueText: "Genel Tıp", valueJson: null },
      ],
    }),
  );

  await page.goto("/directory/catalog/member-arkin-kara");

  await expect(page.getByText("İş Arıyorum")).toBeVisible();
  await expect(page.getByText("Gönüllü Mentör")).toBeVisible();
  await expect(page.getByText("Yakında Taşınacak")).toBeVisible();
  await expect(page.getByRole("link", { name: "LinkedIn", exact: true })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/arkin-kara",
  );
  await expect(page.getByRole("link", { name: "Instagram", exact: true })).toBeVisible();
  // Sosyal attribute grid'de tekrarlanmaz; uzmanlık alanı grid'de kalır.
  await expect(page.getByText("Uzmanlık Alanı")).toBeVisible();
});

test("member business and organization records use same profile shell", async ({ page }) => {
  const variants = [
    { slug: "member-arkin-kara", title: "Arkin Kara", itemType: "member", roleLabel: "Üye" },
    { slug: "isletme-kara-gida", title: "Kara Gıda", itemType: "business", roleLabel: "İşletme" },
    { slug: "kurulus-dortmund-dernek", title: "Dortmund Derneği", itemType: "organization", roleLabel: "Kuruluş" },
  ];

  for (const variant of variants) {
    await page.unroute(RPC_GLOB);
    await mockProfileRpc(
      page,
      makePayload({
        item: {
          slug: variant.slug,
          title: variant.title,
          itemType: variant.itemType,
          roleKey: variant.itemType,
          roleLabel: variant.roleLabel,
        },
      }),
    );

    await page.goto(`/directory/catalog/${variant.slug}`);

    await expect(page.getByRole("heading", { name: variant.title, level: 1 })).toBeVisible();
    await expect(page.getByText(variant.roleLabel)).toBeVisible();
    // Aynı composer: tüm varyantlarda aynı section iskeleti
    await expect(page.getByText("Hakkında")).toBeVisible();
  }
});
