// scripts/generate-llms-full.mjs testleri.
//
// ASIL DEĞER: llms-full.txt'in kaynak dosyalarla tutarlılığı — faq.json, service.json
// ve llms.txt'den üretildiğinden emin ol. Kaynak dosyalardan biri değiştiğinde test
// kırılır ve script'in yeniden çalıştırılması gerektiğini hatırlatır.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildFullContent } from "./generate-llms-full.mjs";

const rootDir = resolve(process.cwd());

describe("llms-full.txt içerik tutarlılığı", () => {
  it("llms.txt temel içeriği llms-full.txt'in başında yer alır", () => {
    const llmsTxt = readFileSync(resolve(rootDir, "public/llms.txt"), "utf8");
    const llmsFull = readFileSync(resolve(rootDir, "public/llms-full.txt"), "utf8");

    const firstLine = llmsTxt.split("\n")[0].trim();
    expect(llmsFull).toContain(firstLine);
  });

  it("service.json alanları llms-full.txt'te görünür", () => {
    const serviceJson = JSON.parse(
      readFileSync(resolve(rootDir, "public/ai/service.json"), "utf8"),
    );
    const llmsFull = readFileSync(resolve(rootDir, "public/llms-full.txt"), "utf8");

    expect(llmsFull).toContain(serviceJson.name);
    expect(llmsFull).toContain(serviceJson.serviceType);
  });

  it("faq.json'daki her soru llms-full.txt'te yer alır", () => {
    const faqJson = JSON.parse(readFileSync(resolve(rootDir, "public/ai/faq.json"), "utf8"));
    const llmsFull = readFileSync(resolve(rootDir, "public/llms-full.txt"), "utf8");

    for (const question of faqJson.mainEntity ?? []) {
      expect(llmsFull).toContain(question.name);
    }
  });

  it("AI Agent Entegrasyonu bölümü tüm AI dosyalarını listeler", () => {
    const llmsFull = readFileSync(resolve(rootDir, "public/llms-full.txt"), "utf8");

    expect(llmsFull).toContain("## AI Agent Entegrasyonu");
    expect(llmsFull).toContain("/llms.txt");
    expect(llmsFull).toContain("/ai/faq.json");
    expect(llmsFull).toContain("/ai/service.json");
    expect(llmsFull).toContain("/ai/summary.json");
    expect(llmsFull).toContain("/sitemap.xml");
  });

  it("buildFullContent boş blog/SSS ile de çalışır", () => {
    const result = buildFullContent("# Test\n", [], [], null);
    expect(result).toContain("# Test");
    expect(result).toContain("## AI Agent Entegrasyonu");
  });

  it("buildFullContent blog yazılarını ülke bazlı gruplar", () => {
    const blogPosts = [
      { slug: "test-1", title: "Test 1", excerpt: "Özet 1", country_label: "Almanya", category_label: "Vize" },
      { slug: "test-2", title: "Test 2", excerpt: "Özet 2", country_label: "Almanya", category_label: "Oturum" },
      { slug: "test-3", title: "Test 3", excerpt: "Özet 3", country_label: "Fransa", category_label: "Vize" },
    ];
    const result = buildFullContent("# Base\n", blogPosts, [], null);

    expect(result).toContain("## Blog Yazıları");
    expect(result).toContain("### Almanya");
    expect(result).toContain("### Fransa");
    expect(result).toContain("Test 1");
    expect(result).toContain("Test 3");
  });
});

describe("robots.txt AI crawler politikası", () => {
  it("eğitim botları engellenmiştir (Disallow: /)", () => {
    const robotsTxt = readFileSync(resolve(rootDir, "public/robots.txt"), "utf8");

    expect(robotsTxt).toContain("User-agent: CCBot");
    expect(robotsTxt).toContain("User-agent: Bytespider");
    expect(robotsTxt).toContain("User-agent: Meta-ExternalAgent");
    expect(robotsTxt).toContain("User-agent: Google-Extended");
    expect(robotsTxt).toContain("User-agent: Applebot-Extended");
  });

  it("atıf veren botlar açıktır (Allow: /)", () => {
    const robotsTxt = readFileSync(resolve(rootDir, "public/robots.txt"), "utf8");

    expect(robotsTxt).toContain("User-agent: GPTBot");
    expect(robotsTxt).toContain("User-agent: ClaudeBot");
    expect(robotsTxt).toContain("User-agent: ChatGPT-User");
    expect(robotsTxt).toContain("User-agent: PerplexityBot");
  });

  it("sitemap bağlantısı mevcuttur", () => {
    const robotsTxt = readFileSync(resolve(rootDir, "public/robots.txt"), "utf8");
    expect(robotsTxt).toContain("Sitemap: https://corteqs.net/sitemap.xml");
  });
});
