// /admin/social-share-vault sayfası genelinde (4 sekmenin tamamında — Araç
// Tanıtımları/Diaspora/Test Araçları/Burak) her kalem için medya API'si.
// Görsel Supabase Storage'a (private burak-share bucket), link/not/video URL
// social_share_assets tablosuna yazılır (slot_key unique). Tüm adminler ortak
// görür; RLS = is_admin(auth.uid()). Metin içerik DB'de değil, her sekmenin
// kendi statik dosyasında (social-share-vault.ts, social-diaspora-posts.ts, vb.).
//
// Bucket/tablo adları tarihsel nedenle "burak" içeriyor (özellik ilk bu sekmede
// çıktı) ama artık tüm sekmeleri kapsıyor — isim değişmedi, kapsam genişledi.
// slotKey artık `${tab}/${itemId}/variant-${variantIndex}` formatında; eski
// Burak kayıtları `burak/...` prefix'iyle üretildiği için aynı kalır (geriye
// dönük uyumlu, veri taşıma gerekmez).

import { supabase } from "@/integrations/supabase/client";
import type { ShareTab } from "@/lib/admin-shell/social-share-log";

// Video Drive klasörü — "Videoyu Drive'a Yükle" butonu bunu yeni sekmede açar.
export const BURAK_DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1CPPtv-dOFdx9nO4eBzF7yv3QEyNe2_Od?usp=drive_link";

const BUCKET = "burak-share";

export type BurakShareAsset = {
  slotKey: string;
  imageBucket: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  note: string | null;
};

export type BurakAssetPatch = Partial<
  Pick<BurakShareAsset, "imageBucket" | "imagePath" | "imageUrl" | "videoUrl" | "note">
>;

// social_share_assets henüz supabase/types.ts'te yok; mevcut admin/*.ts deseniyle
// (supabase as SupabaseUntyped) köprüsüyle erişilir.
type SupabaseUntyped = {
  from: (table: string) => ReturnType<typeof supabase.from>;
  auth: typeof supabase.auth;
  storage: typeof supabase.storage;
};
const db = supabase as unknown as SupabaseUntyped;

export function burakSlotKey(tab: ShareTab, itemId: string, variantIndex: number): string {
  return `${tab}/${itemId}/variant-${variantIndex}`;
}

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function listBurakShareAssets(): Promise<Record<string, BurakShareAsset>> {
  const { data, error } = await db
    .from("social_share_assets")
    .select("slot_key, image_bucket, image_path, image_url, video_url, note");

  if (error) throw new Error(messageOf(error, "Medya kayıtları yüklenemedi"));

  const map: Record<string, BurakShareAsset> = {};
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const slotKey = String(row.slot_key ?? "");
    if (!slotKey) continue;
    map[slotKey] = {
      slotKey,
      imageBucket: (row.image_bucket as string | null) ?? null,
      imagePath: (row.image_path as string | null) ?? null,
      imageUrl: (row.image_url as string | null) ?? null,
      videoUrl: (row.video_url as string | null) ?? null,
      note: (row.note as string | null) ?? null,
    };
  }
  return map;
}

export async function upsertBurakShareAsset(
  slotKey: string,
  patch: BurakAssetPatch,
): Promise<void> {
  const { data: userData } = await db.auth.getUser();
  const userId = userData?.user?.id ?? null;

  const values: Record<string, unknown> = {
    slot_key: slotKey,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };
  if ("imageBucket" in patch) values.image_bucket = patch.imageBucket ?? null;
  if ("imagePath" in patch) values.image_path = patch.imagePath ?? null;
  if ("imageUrl" in patch) values.image_url = patch.imageUrl ?? null;
  if ("videoUrl" in patch) values.video_url = patch.videoUrl ?? null;
  if ("note" in patch) values.note = patch.note ?? null;

  const { error } = await db
    .from("social_share_assets")
    .upsert(values, { onConflict: "slot_key" });

  if (error) throw new Error(messageOf(error, "Medya kaydı kaydedilemedi"));
}

function buildImagePath(tab: ShareTab, itemId: string, variantIndex: number, file: File): string {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${tab}/${itemId}/variant-${variantIndex}/${Date.now()}-${rand}-${safeName}`;
}

export async function uploadBurakShareImage(
  tab: ShareTab,
  itemId: string,
  variantIndex: number,
  file: File,
): Promise<{ bucket: string; path: string }> {
  const path = buildImagePath(tab, itemId, variantIndex, file);
  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw new Error(messageOf(error, "Görsel yüklenemedi"));
  return { bucket: BUCKET, path };
}

export async function removeBurakShareImage(bucket: string, path: string): Promise<void> {
  if (!bucket || !path) return;
  const { error } = await db.storage.from(bucket).remove([path]);
  if (error) throw new Error(messageOf(error, "Görsel silinemedi"));
}

export async function getBurakShareImageUrl(bucket: string, path: string): Promise<string> {
  const { data, error } = await db.storage.from(bucket).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) {
    throw new Error(messageOf(error, "Görsel için erişim linki üretilemedi"));
  }
  return data.signedUrl;
}

// ── Ek görseller (kapak görseli dışında, slot başına birden fazla) ─────────

/** Her slot için ek görsel sayısı — sayfa açılışında akordeon rozetleri için tek toplu sorgu. */
export async function countBurakShareExtraImagesBySlot(): Promise<Record<string, number>> {
  const { data, error } = await db.from("social_share_asset_images").select("slot_key");

  if (error) throw new Error(messageOf(error, "Görsel sayıları yüklenemedi"));

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const slotKey = String(row.slot_key ?? "");
    if (!slotKey) continue;
    counts[slotKey] = (counts[slotKey] ?? 0) + 1;
  }
  return counts;
}

export type BurakShareExtraImage = {
  id: string;
  slotKey: string;
  imageBucket: string;
  imagePath: string;
  sortOrder: number;
};

export async function listBurakShareExtraImages(
  slotKey: string,
): Promise<BurakShareExtraImage[]> {
  const { data, error } = await db
    .from("social_share_asset_images")
    .select("id, slot_key, image_bucket, image_path, sort_order")
    .eq("slot_key", slotKey)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(messageOf(error, "Ek görseller yüklenemedi"));

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    slotKey: String(row.slot_key),
    imageBucket: String(row.image_bucket),
    imagePath: String(row.image_path),
    sortOrder: Number(row.sort_order ?? 0),
  }));
}

export async function addBurakShareExtraImage(
  tab: ShareTab,
  itemId: string,
  variantIndex: number,
  slotKey: string,
  file: File,
  sortOrder: number,
): Promise<BurakShareExtraImage> {
  const path = buildImagePath(tab, itemId, variantIndex, file);
  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) throw new Error(messageOf(uploadError, "Görsel yüklenemedi"));

  const { data: userData } = await db.auth.getUser();
  const userId = userData?.user?.id ?? null;

  const { data, error } = await db
    .from("social_share_asset_images")
    .insert({
      slot_key: slotKey,
      image_bucket: BUCKET,
      image_path: path,
      sort_order: sortOrder,
      created_by: userId,
    })
    .select("id, slot_key, image_bucket, image_path, sort_order")
    .single();

  if (error || !data) {
    await db.storage.from(BUCKET).remove([path]);
    throw new Error(messageOf(error, "Görsel kaydedilemedi"));
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    slotKey: String(row.slot_key),
    imageBucket: String(row.image_bucket),
    imagePath: String(row.image_path),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function removeBurakShareExtraImage(image: BurakShareExtraImage): Promise<void> {
  const { error } = await db.from("social_share_asset_images").delete().eq("id", image.id);
  if (error) throw new Error(messageOf(error, "Görsel silinemedi"));
  await db.storage.from(image.imageBucket).remove([image.imagePath]);
}
