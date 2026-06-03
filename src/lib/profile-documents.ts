import { supabase } from "@/integrations/supabase/client";

export type ProfileDocumentRecord = {
  name: string;
  bucket: string;
  path: string;
  contentType: string | null;
  sizeBytes: number | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

export const parseProfileDocumentRecord = (value: unknown): ProfileDocumentRecord | null => {
  if (!isRecord(value)) return null;

  const name = typeof value.name === "string" ? value.name.trim() : "";
  const bucket = typeof value.bucket === "string" ? value.bucket.trim() : "";
  const path = typeof value.path === "string" ? value.path.trim() : "";
  const contentType = typeof value.contentType === "string" ? value.contentType : null;
  const sizeBytes =
    typeof value.sizeBytes === "number" && Number.isFinite(value.sizeBytes) ? value.sizeBytes : null;

  if (!name || !bucket || !path) return null;

  return {
    name,
    bucket,
    path,
    contentType,
    sizeBytes,
  };
};

const buildProfileDocumentStoragePath = (userId: string, file: File) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
};

export async function uploadProfileDocument(
  bucket: string,
  userId: string,
  file: File,
): Promise<ProfileDocumentRecord> {
  const path = buildProfileDocumentStoragePath(userId, file);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (error) throw error;

  return {
    name: file.name,
    bucket,
    path,
    contentType: file.type || null,
    sizeBytes: file.size,
  };
}

export async function removeProfileDocument(document: ProfileDocumentRecord | null) {
  if (!document?.bucket || !document.path) return;
  const { error } = await supabase.storage.from(document.bucket).remove([document.path]);
  if (error) throw error;
}

export async function getProfileDocumentAccessUrl(document: ProfileDocumentRecord): Promise<string> {
  const { data, error } = await supabase.storage
    .from(document.bucket)
    .createSignedUrl(document.path, 300);

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Dosya için signed URL üretilemedi.");
  }

  return data.signedUrl;
}
