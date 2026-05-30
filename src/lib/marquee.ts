import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type MarqueeItemType = "news" | "stat" | "announcement";
export type MarqueeItemRow = Tables<"marquee_items">;
export type MarqueeItemInsert = TablesInsert<"marquee_items">;
export type MarqueeItemUpdate = TablesUpdate<"marquee_items">;
export type NewsPostRow = Tables<"news_posts">;

export const newsImageBucket = "newsimage";
export const allowedNewsImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const allowedNewsImageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const;
export const maxNewsImageBytes = 5 * 1024 * 1024;

export const marqueeTypeLabels: Record<MarqueeItemType, string> = {
  news: "Haber",
  stat: "İstatistik",
  announcement: "Duyuru",
};

export const fallbackMarqueeItems: MarqueeItemRow[] = [
  {
    id: "fallback-164-country",
    type: "stat",
    slug: "turk-diasporasi-164-ulke",
    title: "Türk diasporası 164 ülkede görünür",
    summary: "CorteQS, şehir bazlı bağlantılarla küresel Türk topluluğunu tek ekosistemde toplamayı hedefliyor.",
    detail_content: null,
    image_url: "/og-image.png",
    image_alt: "CorteQS küresel diaspora ağı",
    metric_value: "164 ülke",
    news_post_id: null,
    link_enabled: true,
    sort_order: 10,
    is_active: true,
    published_at: new Date(0).toISOString(),
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "fallback-8-8-million",
    type: "stat",
    slug: null,
    title: "8.8 milyon kişilik küresel topluluk",
    summary: "Yurt dışında yaşayan Türkler için şehir, meslek ve ihtiyaç bazlı bağlantı alanı kuruluyor.",
    detail_content: null,
    image_url: "/logocorteqsbig.png",
    image_alt: "CorteQS diaspora bağlantı görseli",
    metric_value: "8.8 milyon",
    news_post_id: null,
    link_enabled: false,
    sort_order: 20,
    is_active: true,
    published_at: new Date(0).toISOString(),
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
  {
    id: "fallback-announcement",
    type: "announcement",
    slug: "erken-kayit-duyurusu",
    title: "Erken kayıt ve şehir elçisi başvuruları açık",
    summary: "Platform açılışı öncesi danışman, işletme, içerik üreticisi ve şehir elçisi adayları kayıt bırakabiliyor.",
    detail_content: null,
    image_url: "/og-image.png",
    image_alt: "CorteQS erken kayıt duyurusu",
    metric_value: null,
    news_post_id: null,
    link_enabled: true,
    sort_order: 30,
    is_active: true,
    published_at: new Date(0).toISOString(),
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
];

export function slugifyMarqueeTitle(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function validateNewsImageFile(file: File) {
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";

  if (!allowedNewsImageTypes.includes(file.type as (typeof allowedNewsImageTypes)[number])) {
    return {
      ok: false as const,
      message: `"${file.name}" desteklenmeyen format. Sadece JPG, PNG, WEBP veya GIF yükleyin.`,
    };
  }

  if (!allowedNewsImageExtensions.includes(extension as (typeof allowedNewsImageExtensions)[number])) {
    return {
      ok: false as const,
      message: `"${file.name}" uzantısı desteklenmiyor. Sadece JPG, PNG, WEBP veya GIF yükleyin.`,
    };
  }

  if (file.size > maxNewsImageBytes) {
    return {
      ok: false as const,
      message: `"${file.name}" çok büyük. Maksimum görsel boyutu 5 MB.`,
    };
  }

  return { ok: true as const };
}

export async function uploadNewsImage(file: File): Promise<string> {
  const validation = validateNewsImageFile(file);
  if (!validation.ok) throw new Error(validation.message);

  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? ".jpg";
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
  const path = `marquee/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBaseName}${extension}`;

  const { error } = await supabase.storage.from(newsImageBucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(newsImageBucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function listPublicMarqueeItems(): Promise<MarqueeItemRow[]> {
  const { data, error } = await supabase
    .from("marquee_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPublicMarqueeItemBySlug(slug: string): Promise<MarqueeItemRow | null> {
  const { data, error } = await supabase
    .from("marquee_items")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("link_enabled", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listAdminMarqueeItems(): Promise<MarqueeItemRow[]> {
  const { data, error } = await supabase
    .from("marquee_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listImportableNewsPosts(): Promise<NewsPostRow[]> {
  const { data, error } = await supabase
    .from("news_posts")
    .select("*")
    .eq("status", "active")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

const joinNewsParts = (parts: Array<string | null | undefined>) => parts.map((part) => part?.trim()).filter(Boolean).join(" • ");

export function buildNewsPostSummary(post: NewsPostRow): string {
  const summary = post.summary?.trim();
  if (summary) return summary;

  const location = [post.city?.trim(), post.country?.trim()].filter(Boolean).join(", ");
  const fallback = joinNewsParts([post.source_name, post.category, location]);

  return fallback || "Harici haber akışından CorteQS radarına aktarıldı.";
}

export async function importNewsPostToMarquee(newsPostId: number): Promise<MarqueeItemRow> {
  const { data: existing, error: existingError } = await supabase
    .from("marquee_items")
    .select("*")
    .eq("news_post_id", newsPostId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data: post, error: postError } = await supabase
    .from("news_posts")
    .select("*")
    .eq("id", newsPostId)
    .eq("status", "active")
    .maybeSingle();

  if (postError) throw postError;
  if (!post) throw new Error("Aktarılacak haber bulunamadı veya aktif değil.");

  const payload: MarqueeItemInsert = {
    type: "news",
    title: post.title,
    summary: buildNewsPostSummary(post),
    detail_content: null,
    image_url: post.image_url,
    image_alt: post.title,
    metric_value: null,
    news_post_id: post.id,
    link_enabled: false,
    slug: null,
    sort_order: 0,
    is_active: true,
    published_at: post.published_at ?? post.created_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase.from("marquee_items").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function createMarqueeItem(payload: MarqueeItemInsert): Promise<MarqueeItemRow> {
  const { data, error } = await supabase.from("marquee_items").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateMarqueeItem(id: string, payload: MarqueeItemUpdate): Promise<MarqueeItemRow> {
  const { data, error } = await supabase.from("marquee_items").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteMarqueeItem(id: string): Promise<void> {
  const { error } = await supabase.from("marquee_items").delete().eq("id", id);
  if (error) throw error;
}
