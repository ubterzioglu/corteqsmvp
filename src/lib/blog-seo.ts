// Blog yazısı SEO/GEO yardımcıları — saf fonksiyonlar (sayfadan ayrıldı, test edilebilir).
//
// GEO: AI cevap motorları (ChatGPT, Perplexity, Google AI Overviews) BlogPosting şemasından,
// kırıntı (BreadcrumbList) ise sitenin yapısını anlamak için yararlanır. İlgili yazı bağlantıları
// iç bağlantı ağını kurar: tek çıkış "Tüm yazılar" olduğunda yazılar birbirinden kopuk kalıyordu.

import { blogCategoryLabels, type BlogPostRow, type BlogPostSummary } from "@/lib/blog";
import { SEO_CANONICAL_ORIGIN, SEO_SITE_NAME } from "@/lib/seo";

export type { BlogPostSummary };

export const DEFAULT_RELATED_POST_LIMIT = 3;

export function buildBlogPostingJsonLd(post: BlogPostRow, ogImage: string): Record<string, unknown> {
  const canonicalUrl = `${SEO_CANONICAL_ORIGIN}/blog/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.title,
    inLanguage: "tr",
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    image: ogImage,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    // Yazar KİŞİ uydurulmaz: içerik kurumsal olarak yayımlanır.
    author: { "@type": "Organization", name: SEO_SITE_NAME, url: SEO_CANONICAL_ORIGIN },
    publisher: {
      "@type": "Organization",
      name: SEO_SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SEO_CANONICAL_ORIGIN}/logocorteqsbig.png` },
    },
    ...(post.country_label ? { about: { "@type": "Thing", name: post.country_label } } : {}),
    articleSection: blogCategoryLabels[post.category],
  };
}

/**
 * Ana Sayfa → Rehberler → yazı. Rehberler adımı doğrudan `/radar/rehberler`'dir:
 * `/blog` bir 301 yönlendirmesidir (src/lib/redirects.ts) ve kırıntı onu işaret ederse
 * botu yönlendirme zincirine sokar.
 */
export function buildBlogBreadcrumbJsonLd(post: Pick<BlogPostRow, "slug" | "title">): Record<string, unknown> {
  const crumbs = [
    { name: "Ana Sayfa", path: "/" },
    { name: "Rehberler", path: "/radar/rehberler" },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SEO_CANONICAL_ORIGIN}${crumb.path}`,
    })),
  };
}

type RelatedAnchor = Pick<BlogPostRow, "id" | "slug" | "country" | "category">;

/**
 * Aynı ülkeden ve/veya aynı kategoriden en fazla `limit` yazı.
 *
 * Puan: aynı ülke = 2, aynı kategori = 1; puanı 0 olan ELENİR (uydurma ilgi önermeyiz).
 * Boş ülke boş ülkeyle EŞLEŞMEZ — "ülkesiz" ortak bir ilgi değildir.
 * Eşitlikte sıra kararlıdır: sort_order artan, yayın tarihi azalan, slug.
 * Girdi dizisi DEĞİŞTİRİLMEZ.
 */
export function pickRelatedPosts(
  posts: readonly BlogPostSummary[],
  current: RelatedAnchor,
  limit: number = DEFAULT_RELATED_POST_LIMIT,
): BlogPostSummary[] {
  if (limit <= 0) return [];

  const scoreOf = (post: BlogPostSummary): number =>
    (current.country && post.country === current.country ? 2 : 0) +
    (post.category === current.category ? 1 : 0);

  return posts
    .filter((post) => post.slug !== current.slug && post.id !== current.id)
    .map((post) => ({ post, score: scoreOf(post) }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.post.sort_order - b.post.sort_order ||
        (b.post.published_at ?? "").localeCompare(a.post.published_at ?? "") ||
        a.post.slug.localeCompare(b.post.slug),
    )
    .slice(0, limit)
    .map(({ post }) => post);
}

/** "12 Haziran 2026" — boş/geçersiz değerde null (sayfa "Invalid Date" basmasın). */
export function formatBlogDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}
