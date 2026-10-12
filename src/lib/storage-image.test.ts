import { describe, expect, it } from "vitest";

import { storageImageUrl } from "./storage-image";

const PUBLIC_URL =
  "https://injprdrsklkxgnaiixzh.supabase.co/storage/v1/object/public/newsimage/marquee/1777014944588-mrbugw-12212233.png";

describe("storageImageUrl", () => {
  it("Supabase public nesne adresini render/image adresine çevirir", () => {
    expect(storageImageUrl(PUBLIC_URL, { width: 640, quality: 70 })).toBe(
      "https://injprdrsklkxgnaiixzh.supabase.co/storage/v1/render/image/public/newsimage/marquee/1777014944588-mrbugw-12212233.png?width=640&quality=70",
    );
  });

  it("varsayılan kalite 70'tir", () => {
    expect(storageImageUrl(PUBLIC_URL, { width: 320 })).toMatch(/\?width=320&quality=70$/);
  });

  it("mevcut sorgu parametrelerini korur", () => {
    const result = storageImageUrl(`${PUBLIC_URL}?v=2`, { width: 640 });
    const url = new URL(result);
    expect(url.pathname).toContain("/storage/v1/render/image/public/");
    expect(url.searchParams.get("v")).toBe("2");
    expect(url.searchParams.get("width")).toBe("640");
  });

  it.each([
    ["yerel public/ dosyası", "/logocorteqsbig.png"],
    ["başka alan adı", "https://example.com/storage/v1/object/public/a.png"],
    ["SVG (dönüştürülmez)", "https://x.supabase.co/storage/v1/object/public/b/logo.svg"],
    ["imzalı (private) nesne", "https://x.supabase.co/storage/v1/object/sign/b/a.png?token=t"],
    ["bozuk adres", "http://[bozuk"],
  ])("%s olduğu gibi döner", (_label, input) => {
    expect(storageImageUrl(input, { width: 640 })).toBe(input);
  });

  it("boş/null girdiyi olduğu gibi döner", () => {
    expect(storageImageUrl("", { width: 640 })).toBe("");
    expect(storageImageUrl(null, { width: 640 })).toBeNull();
  });
});
