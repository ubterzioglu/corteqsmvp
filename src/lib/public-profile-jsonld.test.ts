import { describe, expect, it } from "vitest";

import { buildPublicProfileJsonLd } from "@/lib/public-profile-jsonld";

const base = {
  title: "Örnek Ad",
  description: "Kısa tanım",
  avatarUrl: "https://cdn.example.com/a.png",
  roleLabel: "Danışman",
  locationLabel: "Berlin, Almanya",
  path: "/directory/catalog/ornek-ad",
};

describe("buildPublicProfileJsonLd — şema tipi profil türüne göre seçilir", () => {
  it("üye/danışman → Person (jobTitle taşır)", () => {
    const ld = buildPublicProfileJsonLd({ ...base, isOrganization: false });

    expect(ld["@type"]).toBe("Person");
    expect(ld.jobTitle).toBe("Danışman");
    expect(ld.image).toBe("https://cdn.example.com/a.png");
  });

  it("kurumsal kayıt (konsolosluk/dernek/işletme) → Organization, Person DEĞİL", () => {
    const ld = buildPublicProfileJsonLd({ ...base, roleLabel: "Konsolosluk", isOrganization: true });

    expect(ld["@type"]).toBe("Organization");
  });

  it("Organization'da jobTitle bulunmaz (Person'a özgü alan; şema doğrulayıcısı uyarır)", () => {
    const ld = buildPublicProfileJsonLd({ ...base, isOrganization: true });

    expect(ld).not.toHaveProperty("jobTitle");
  });

  it("Organization görseli `logo` olarak da verilir", () => {
    const ld = buildPublicProfileJsonLd({ ...base, isOrganization: true });

    expect(ld.logo).toBe("https://cdn.example.com/a.png");
  });

  it("ortak alanlar: ad, açıklama, mutlak url, adres", () => {
    for (const isOrganization of [true, false]) {
      const ld = buildPublicProfileJsonLd({ ...base, isOrganization });

      expect(ld["@context"]).toBe("https://schema.org");
      expect(ld.name).toBe("Örnek Ad");
      expect(ld.description).toBe("Kısa tanım");
      expect(ld.url).toBe("https://corteqs.net/directory/catalog/ornek-ad");
      expect(ld.address).toEqual({ "@type": "PostalAddress", addressLocality: "Berlin, Almanya" });
    }
  });

  it("konum/görsel/rol yoksa o alanlar HİÇ eklenmez (boş değer yayılmaz)", () => {
    const ld = buildPublicProfileJsonLd({
      title: "Ad",
      description: "d",
      avatarUrl: null,
      roleLabel: null,
      locationLabel: null,
      path: "/directory/catalog/x",
      isOrganization: false,
    });

    expect(ld).not.toHaveProperty("image");
    expect(ld).not.toHaveProperty("jobTitle");
    expect(ld).not.toHaveProperty("address");
  });
});
