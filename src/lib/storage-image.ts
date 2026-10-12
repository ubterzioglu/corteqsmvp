// Supabase Storage görsellerini gösterim boyutunda ister (Image Transformations).
//
// Lighthouse 2026-10-12: ana sayfa marquee kartları 150px yüksekliğinde çizilirken
// orijinal yüklemeleri indiriyordu (2,3 MB PNG + 800 KB JPG). `render/image` uç
// noktası aynı dosyayı yeniden boyutlandırıp tarayıcı destekliyorsa WebP döner —
// ölçüm: 2,3 MB → 49 KB. Dönüşüm canlı projede açıktır (Pro plan).
//
// Yalnız `…/storage/v1/object/public/…` adreslerine dokunulur. Yerel public/
// dosyaları, başka alan adları, imzalı (private) nesneler ve SVG olduğu gibi döner.

const PUBLIC_OBJECT_SEGMENT = "/storage/v1/object/public/";
const RENDER_IMAGE_SEGMENT = "/storage/v1/render/image/public/";
const DEFAULT_QUALITY = 70;

export interface StorageImageOptions {
  width: number;
  quality?: number;
}

export function storageImageUrl<T extends string | null | undefined>(
  url: T,
  { width, quality = DEFAULT_QUALITY }: StorageImageOptions,
): T {
  if (!url) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const isSupabaseHost = parsed.hostname.endsWith(".supabase.co");
  const isPublicObject = parsed.pathname.startsWith(PUBLIC_OBJECT_SEGMENT);
  const isSvg = parsed.pathname.toLowerCase().endsWith(".svg");
  if (!isSupabaseHost || !isPublicObject || isSvg) return url;

  parsed.pathname = parsed.pathname.replace(PUBLIC_OBJECT_SEGMENT, RENDER_IMAGE_SEGMENT);
  parsed.searchParams.set("width", String(width));
  parsed.searchParams.set("quality", String(quality));
  return parsed.toString() as T;
}
