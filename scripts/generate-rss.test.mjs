// scripts/generate-rss.mjs testleri.
//
// ASIL DEĞER: beslemenin geçerli XML olması (kaçış, Türkçe karakter), tarih biçimi
// (RFC-822) ve kanal linkinin bir 301 kaynağına işaret etmemesi.

import { describe, expect, it } from "vitest";

import { LEGACY_REDIRECTS } from "../src/lib/redirects.ts";
import { buildRss, CHANNEL, toRfc822 } from "./generate-rss.mjs";

const posts = [
  {
    slug: "eski-yazi",
    title: "Eski yazı",
    excerpt: "Özet",
    category_label: "Yaşam",
    published_at: "2026-06-01T10:00:00Z",
  },
  {
    slug: "berlin-rehberi",
    title: "Berlin'de iş & <ev> arama",
    excerpt: "Şehir, çalışma izni ve kira: ilk 90 gün",
    category_label: "Kariyer",
    published_at: "2026-09-15T08:30:00Z",
  },
];

describe("buildRss", () => {
  it("RSS 2.0 iskeleti ve self atom:link taşır", () => {
    const xml = buildRss(posts);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('rel="self" type="application/rss+xml"');
    expect(xml.match(/<item>/g)).toHaveLength(2);
  });

  it("özel karakterleri kaçışlar, Türkçe harfleri korur", () => {
    const xml = buildRss(posts);
    expect(xml).toContain("Berlin&apos;de iş &amp; &lt;ev&gt; arama");
    expect(xml).not.toContain("<ev>");
    expect(xml).toContain("Şehir, çalışma izni ve kira: ilk 90 gün");
  });

  it("yazıları en yeniden eskiye sıralar ve lastBuildDate en yeni yazıdır", () => {
    const xml = buildRss(posts);
    expect(xml.indexOf("berlin-rehberi")).toBeLessThan(xml.indexOf("eski-yazi"));
    expect(xml).toContain("<lastBuildDate>Tue, 15 Sep 2026 08:30:00 GMT</lastBuildDate>");
  });

  it("slug'sız kaydı atlar, boş listede geçerli kanal üretir", () => {
    expect(buildRss([{ title: "slugsuz" }]).match(/<item>/g)).toBeNull();
    const empty = buildRss([]);
    expect(empty).toContain("<channel>");
    expect(empty).not.toContain("<lastBuildDate>");
  });

  it("kanal linki bir legacy 301 kaynağına işaret etmez", () => {
    const linkPath = new URL(CHANNEL.link).pathname;
    expect(LEGACY_REDIRECTS.map((r) => r.from)).not.toContain(linkPath);
  });
});

describe("toRfc822", () => {
  it("ISO tarihi RFC-822'ye çevirir, geçersizde null döner", () => {
    expect(toRfc822("2026-06-01T10:00:00Z")).toBe("Mon, 01 Jun 2026 10:00:00 GMT");
    expect(toRfc822("bozuk")).toBeNull();
    expect(toRfc822(null)).toBeNull();
  });
});
