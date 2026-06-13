// src/lib/blog.ts
// Blog modülü veri katmanı: tipler + Supabase CRUD + yardımcılar.
// İçerik markdown olarak saklanır; public sayfa react-markdown ile render eder.
// NOT: supabase/types.ts blog_posts'u henüz içermiyor (B1 regen bekliyor),
//      bu yüzden satır tipleri burada elle tanımlandı.

import { supabase } from "@/integrations/supabase/client";

export type BlogCategory = "giris-ulasim" | "gundelik-butce" | "kultur-sosyal" | "genel";

export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_markdown: string;
  country: string;
  country_label: string;
  category: BlogCategory;
  category_label: string;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type BlogPostInsert = {
  slug: string;
  title: string;
  excerpt?: string;
  content_markdown?: string;
  country?: string;
  country_label?: string;
  category?: BlogCategory;
  category_label?: string;
  cover_image?: string | null;
  published?: boolean;
  published_at?: string | null;
  sort_order?: number;
};

export type BlogPostUpdate = Partial<BlogPostInsert>;

const TABLE = "blog_posts";

export const blogCategoryLabels: Record<BlogCategory, string> = {
  "giris-ulasim": "Giriş ve Ulaşım",
  "gundelik-butce": "Gündelik Hayat ve Bütçe",
  "kultur-sosyal": "Kültür ve Sosyal Akış",
  genel: "Genel",
};

export const blogCategoryOrder: BlogCategory[] = [
  "giris-ulasim",
  "gundelik-butce",
  "kultur-sosyal",
  "genel",
];

// ── Public reads ────────────────────────────────────────────────────────
export async function listPublishedBlogPosts(): Promise<BlogPostRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BlogPostRow[];
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPostRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return (data as BlogPostRow | null) ?? null;
}

// ── Admin reads + writes ────────────────────────────────────────────────
export async function listAllBlogPosts(): Promise<BlogPostRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BlogPostRow[];
}

export async function getBlogPostById(id: string): Promise<BlogPostRow | null> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as BlogPostRow | null) ?? null;
}

export async function createBlogPost(payload: BlogPostInsert): Promise<BlogPostRow> {
  const { data, error } = await supabase.from(TABLE).insert(payload).select("*").single();
  if (error) throw error;
  return data as BlogPostRow;
}

export async function updateBlogPost(id: string, payload: BlogPostUpdate): Promise<BlogPostRow> {
  const { data, error } = await supabase.from(TABLE).update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data as BlogPostRow;
}

export async function deleteBlogPost(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

// ── Helpers ─────────────────────────────────────────────────────────────
export function slugifyBlogTitle(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/İ/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export interface BlogCountryGroup {
  country: string;
  country_label: string;
  posts: BlogPostRow[];
}

// Yazıları ülkeye göre grupla; ülke sırası ilk görülen sort_order'a göre korunur.
export function groupBlogPostsByCountry(posts: BlogPostRow[]): BlogCountryGroup[] {
  const groups = new Map<string, BlogCountryGroup>();
  for (const post of posts) {
    const key = post.country || "diger";
    const existing = groups.get(key);
    if (existing) {
      existing.posts.push(post);
    } else {
      groups.set(key, {
        country: key,
        country_label: post.country_label || "Diğer",
        posts: [post],
      });
    }
  }
  return Array.from(groups.values());
}
