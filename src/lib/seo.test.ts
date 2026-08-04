// src/lib/seo.ts testleri.
//
// Bu yardımcı sitedeki HER sayfanın title/canonical/robots/JSON-LD'sini yazıyor ama
// 2026-08-04'e kadar hiç testi yoktu. Buradaki asıl regresyon hedefleri:
//   1. canonical'a query/hash sızması (filtre kombinasyonları self-canonical oluyordu)
//   2. canonical host'un mevcut host'tan gelmesi (www./mvp./localhost)
//   3. cleanup'ın eksik geri yüklemesi → sayfalar arası meta sızıntısı
//   4. JSON-LD node'larının birikmesi

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SEO_CANONICAL_ORIGIN, applySeo } from "./seo";

function canonicalHref(): string | null {
  return document.head.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null;
}

function metaContent(selector: string): string | null {
  return document.head.querySelector(selector)?.getAttribute("content") ?? null;
}

function jsonLdNodes(): NodeListOf<Element> {
  return document.head.querySelectorAll("script[data-seo-jsonld]");
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.title = "";
  window.history.pushState({}, "", "/");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("canonical çözümleme", () => {
  it("canonicalPath verilmezse query string'i canonical'a SIZDIRMAZ", () => {
    window.history.pushState({}, "", "/directory?city=Berlin&page=2");

    applySeo({ title: "Dizin" });

    expect(canonicalHref()).toBe(`${SEO_CANONICAL_ORIGIN}/directory`);
  });

  it("hash'i canonical'a sızdırmaz", () => {
    window.history.pushState({}, "", "/founders#ekip");

    applySeo({ title: "Kurucular" });

    expect(canonicalHref()).toBe(`${SEO_CANONICAL_ORIGIN}/founders`);
  });

  it("canonical host'u her zaman sabit origin'dir (mevcut host değil)", () => {
    window.history.pushState({}, "", "/radar");

    applySeo({ title: "Radar" });

    // jsdom'da host localhost'tur; canonical yine de corteqs.net olmalı.
    expect(canonicalHref()).toBe("https://corteqs.net/radar");
    expect(canonicalHref()).not.toContain("localhost");
  });

  it("kök yolda tek bir slash bırakır", () => {
    window.history.pushState({}, "", "/");

    applySeo({ title: "Ana sayfa" });

    expect(canonicalHref()).toBe(`${SEO_CANONICAL_ORIGIN}/`);
  });

  it("sondaki slash'i normalize eder — /blog/ ve /blog aynı canonical", () => {
    applySeo({ canonicalPath: "/blog/" });
    const slashli = canonicalHref();

    applySeo({ canonicalPath: "/blog" });
    const slashsiz = canonicalHref();

    expect(slashli).toBe(slashsiz);
    expect(slashsiz).toBe(`${SEO_CANONICAL_ORIGIN}/blog`);
  });

  it("göreli canonicalPath'i sabit origin ile birleştirir", () => {
    applySeo({ canonicalPath: "blog/foo" });

    expect(canonicalHref()).toBe(`${SEO_CANONICAL_ORIGIN}/blog/foo`);
  });

  it("tam URL verilirse olduğu gibi kullanır", () => {
    applySeo({ canonicalPath: "https://ornek.test/özel" });

    expect(canonicalHref()).toBe("https://ornek.test/özel");
  });
});

describe("robots", () => {
  it("verilmezse mevcut robots meta'sına dokunmaz", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "index, follow");
    document.head.appendChild(meta);

    applySeo({ title: "Bir sayfa" });

    expect(metaContent('meta[name="robots"]')).toBe("index, follow");
  });

  it("verilirse global değeri override eder", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "index, follow");
    document.head.appendChild(meta);

    applySeo({ robots: "noindex, follow" });

    expect(metaContent('meta[name="robots"]')).toBe("noindex, follow");
  });

  it("cleanup önceki robots değerini geri yükler", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "index, follow");
    document.head.appendChild(meta);

    const cleanup = applySeo({ robots: "noindex, follow" });
    cleanup();

    expect(metaContent('meta[name="robots"]')).toBe("index, follow");
  });

  it("önceden robots yoksa cleanup eklenen meta'yı kaldırır", () => {
    const cleanup = applySeo({ robots: "noindex, follow" });
    expect(metaContent('meta[name="robots"]')).toBe("noindex, follow");

    cleanup();

    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });
});

describe("JSON-LD", () => {
  it("tek nesneyi ekler ve cleanup'ta kaldırır", () => {
    const cleanup = applySeo({ jsonLd: { "@type": "WebPage" } });
    expect(jsonLdNodes()).toHaveLength(1);

    cleanup();

    expect(jsonLdNodes()).toHaveLength(0);
  });

  it("dizi verilince her blok için ayrı node açar", () => {
    const cleanup = applySeo({ jsonLd: [{ "@type": "A" }, { "@type": "B" }] });

    expect(jsonLdNodes()).toHaveLength(2);
    cleanup();
  });

  it("ardışık çağrılarda JSON-LD node'ları BİRİKMEZ", () => {
    // Sayfa geçişlerinde cleanup çağrılmazsa head sonsuza kadar şişerdi.
    const first = applySeo({ jsonLd: { "@type": "A" } });
    first();
    const second = applySeo({ jsonLd: { "@type": "B" } });

    expect(jsonLdNodes()).toHaveLength(1);
    second();
  });
});

describe("meta birikmesi", () => {
  it("iki ardışık applySeo aynı meta etiketini yeniden kullanır, kopya açmaz", () => {
    applySeo({ title: "Bir", description: "ilk" });
    applySeo({ title: "İki", description: "ikinci" });

    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('meta[property="og:title"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(metaContent('meta[name="description"]')).toBe("ikinci");
    expect(document.title).toBe("İki");
  });

  it("cleanup başlığı ve açıklamayı geri yükler", () => {
    document.title = "Önceki";
    const meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", "önceki açıklama");
    document.head.appendChild(meta);

    const cleanup = applySeo({ title: "Yeni", description: "yeni açıklama" });
    cleanup();

    expect(document.title).toBe("Önceki");
    expect(metaContent('meta[name="description"]')).toBe("önceki açıklama");
  });
});

describe("prerender sinyali", () => {
  it("render-complete event'ini dispatch eder", () => {
    // Prerender servisi bu event'i bekler; kaybolursa bot boş kabuk yakalar.
    const listener = vi.fn();
    document.addEventListener("render-complete", listener);

    applySeo({ title: "Herhangi" });

    expect(listener).toHaveBeenCalledTimes(1);
    document.removeEventListener("render-complete", listener);
  });
});
