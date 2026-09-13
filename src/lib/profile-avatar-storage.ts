import { supabase } from "@/integrations/supabase/client";

export const AVATARS_BUCKET = "avatars";
export const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const buildAvatarStoragePath = (userId: string, file: File): string => {
  const safeExtension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `${userId}/profile-${Date.now()}.${safeExtension}`;
};

export const getPublicAvatarUrl = (path: string): string =>
  supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path).data.publicUrl;

export const getAvatarStoragePathFromUrl = (url: string | null): string | null => {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${AVATARS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
};
