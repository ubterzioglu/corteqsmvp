// src/lib/seo.ts
// Merkezî per-route SEO/GEO yardımcısı: title, description, canonical, Open Graph,
// Twitter card ve opsiyonel JSON-LD'yi tek yerden yönetir. Dağınık useEffect +
// document.title kodunun yerini alır. Prerender katmanı (server.mjs) render-complete
// event'ini bekler; applySeo bu event'i dispatch eder.
//
// Kullanım (React):
//   useSeo({ title: "...", description: "...", canonicalPath: "/blog", jsonLd: {...} });
//
// Kullanım (React dışı): applySeo(opts) çağır, dönen cleanup fonksiyonunu sakla.

import { useEffect } from "react";

export const SEO_SITE_NAME = "CorteQS";
export const SEO_CANONICAL_ORIGIN = "https://corteqs.net";
export const SEO_DEFAULT_OG_IMAGE = `${SEO_CANONICAL_ORIGIN}/og-image-new.jpg`;

export interface SeoOptions {
  /** Tam <title>. Verilmezse mevcut başlık korunur. */
  title?: string;
  /** meta[name=description] içeriği. */
  description?: string;
  /**
   * Canonical yol veya tam URL. "/blog/foo" gibi göreli verilirse
   * SEO_CANONICAL_ORIGIN ile birleştirilir. Verilmezse mevcut konum kullanılır.
   */
  canonicalPath?: string;
  /** Open Graph / Twitter görseli (tam URL). Varsayılan: site OG görseli. */
  ogImage?: string;
  /** og:type (örn. "website", "article"). Varsayılan: "website". */
  ogType?: string;
  /** Sayfa-özel JSON-LD. Tek nesne veya nesne dizisi. Unmount'ta temizlenir. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SEO_JSONLD_ATTR = "data-seo-jsonld";

function resolveCanonical(canonicalPath?: string): string {
  if (!canonicalPath) {
    return typeof window !== "undefined" ? window.location.href : SEO_CANONICAL_ORIGIN;
  }
  if (/^https?:\/\//i.test(canonicalPath)) return canonicalPath;
  const path = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
  return `${SEO_CANONICAL_ORIGIN}${path}`;
}

function upsertMeta(selector: string, attr: "name" | "property", key: string): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  return el;
}

function upsertCanonicalLink(): HTMLLinkElement {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  return el;
}

/**
 * SEO meta'yı uygular ve önceki değerleri geri yükleyen bir cleanup döndürür.
 * SSR/non-DOM ortamlarında no-op'tur.
 */
export function applySeo(opts: SeoOptions): () => void {
  if (typeof document === "undefined") return () => undefined;

  const canonical = resolveCanonical(opts.canonicalPath);
  const ogImage = opts.ogImage ?? SEO_DEFAULT_OG_IMAGE;
  const ogType = opts.ogType ?? "website";

  // ── Önceki değerleri sakla (geri yükleme için) ──
  const prev = {
    title: document.title,
    description: document.head
      .querySelector('meta[name="description"]')
      ?.getAttribute("content"),
    canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ogTitle: document.head.querySelector('meta[property="og:title"]')?.getAttribute("content"),
    ogDescription: document.head
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content"),
    ogUrl: document.head.querySelector('meta[property="og:url"]')?.getAttribute("content"),
    ogImage: document.head.querySelector('meta[property="og:image"]')?.getAttribute("content"),
    ogType: document.head.querySelector('meta[property="og:type"]')?.getAttribute("content"),
    twTitle: document.head.querySelector('meta[name="twitter:title"]')?.getAttribute("content"),
    twDescription: document.head
      .querySelector('meta[name="twitter:description"]')
      ?.getAttribute("content"),
    twImage: document.head.querySelector('meta[name="twitter:image"]')?.getAttribute("content"),
  };

  // ── Uygula ──
  if (opts.title) document.title = opts.title;

  if (opts.description !== undefined) {
    upsertMeta('meta[name="description"]', "name", "description").setAttribute(
      "content",
      opts.description,
    );
  }

  upsertCanonicalLink().setAttribute("href", canonical);

  if (opts.title) {
    upsertMeta('meta[property="og:title"]', "property", "og:title").setAttribute(
      "content",
      opts.title,
    );
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title").setAttribute(
      "content",
      opts.title,
    );
  }
  if (opts.description !== undefined) {
    upsertMeta('meta[property="og:description"]', "property", "og:description").setAttribute(
      "content",
      opts.description,
    );
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description").setAttribute(
      "content",
      opts.description,
    );
  }
  upsertMeta('meta[property="og:url"]', "property", "og:url").setAttribute("content", canonical);
  upsertMeta('meta[property="og:type"]', "property", "og:type").setAttribute("content", ogType);
  upsertMeta('meta[property="og:image"]', "property", "og:image").setAttribute("content", ogImage);
  upsertMeta('meta[name="twitter:image"]', "name", "twitter:image").setAttribute(
    "content",
    ogImage,
  );

  // ── Sayfa-özel JSON-LD ──
  const jsonLdNodes: HTMLScriptElement[] = [];
  if (opts.jsonLd) {
    const blocks = Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd];
    for (const block of blocks) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute(SEO_JSONLD_ATTR, "1");
      script.textContent = JSON.stringify(block);
      document.head.appendChild(script);
      jsonLdNodes.push(script);
    }
  }

  // Prerender servisine "render tamam" sinyali.
  document.dispatchEvent(new Event("render-complete"));

  // ── Cleanup: önceki değerleri geri yükle ──
  return () => {
    document.title = prev.title;
    const restore = (selector: string, value: string | null | undefined) => {
      const el = document.head.querySelector(selector);
      if (el && value != null) el.setAttribute(/^link/.test(selector) ? "href" : "content", value);
    };
    restore('meta[name="description"]', prev.description);
    restore('link[rel="canonical"]', prev.canonical);
    restore('meta[property="og:title"]', prev.ogTitle);
    restore('meta[property="og:description"]', prev.ogDescription);
    restore('meta[property="og:url"]', prev.ogUrl);
    restore('meta[property="og:image"]', prev.ogImage);
    restore('meta[property="og:type"]', prev.ogType);
    restore('meta[name="twitter:title"]', prev.twTitle);
    restore('meta[name="twitter:description"]', prev.twDescription);
    restore('meta[name="twitter:image"]', prev.twImage);
    for (const node of jsonLdNodes) node.remove();
  };
}

/**
 * React hook: opts değiştiğinde SEO meta'yı uygular, unmount'ta geri yükler.
 * jsonLd'nin referansı her renderda değişmesin diye stabilize edilmesi önerilir
 * (useMemo) ya da bağımlılıklar deps ile kontrol edilir.
 */
export function useSeo(opts: SeoOptions, deps: readonly unknown[] = []): void {
  useEffect(() => {
    const cleanup = applySeo(opts);
    return cleanup;
    // opts referansı yerine açık deps kullan; çağıran kontrol eder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
