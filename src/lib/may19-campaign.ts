import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type May19SubmissionKind = "idea" | "moment";
export type May19SubmissionStatus = "pending" | "approved" | "rejected";
export type May19SubmissionRow = Tables<"may19_campaign_submissions">;

export type SubmitMay19CampaignInput = {
  kind: May19SubmissionKind;
  fullName: string;
  email: string;
  country: string;
  city: string;
  socialHandle?: string;
  title: string;
  description: string;
  message?: string;
  link?: string;
  consent: boolean;
  storageBucket?: string;
  storagePath?: string;
  fileName?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toUserFacingMay19Error(error: unknown) {
  if (!(error instanceof Error)) {
    return new Error("Gönderim sırasında beklenmeyen bir sorun oluştu.");
  }

  const message = error.message.toLowerCase();

  if (message.includes("violates row-level security") || message.includes("new row violates row-level security")) {
    return new Error("Yetki/policy hatası oluştu. Lütfen sayfayı yenileyip tekrar deneyin.");
  }

  if (message.includes("payload too large") || message.includes("file size")) {
    return new Error("Dosya boyutu limiti aşıldı. Daha küçük bir dosya yükleyin.");
  }

  if (message.includes("mime") || message.includes("content type")) {
    return new Error("Dosya türü desteklenmiyor. Lütfen izin verilen bir format seçin.");
  }

  return error;
}

function normalizeOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function submitMay19CampaignEntry(input: SubmitMay19CampaignInput) {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const country = input.country.trim();
  const city = input.city.trim();
  const title = input.title.trim();
  const description = input.description.trim();
  const message = normalizeOptional(input.message);
  const socialHandle = normalizeOptional(input.socialHandle);
  const link = normalizeOptional(input.link);
  const storageBucket = normalizeOptional(input.storageBucket);
  const storagePath = normalizeOptional(input.storagePath);
  const fileName = normalizeOptional(input.fileName);

  if (!fullName || !email || !country || !city || !title || !description) {
    throw new Error("Lütfen zorunlu alanları doldurun.");
  }

  if (!emailPattern.test(email)) {
    throw new Error("Geçerli bir e-posta adresi girin.");
  }

  if (!input.consent) {
    throw new Error("Gönderim için izin kutusunu işaretleyin.");
  }

  if (link) {
    try {
      new URL(link);
    } catch {
      throw new Error("Paylaşım linki geçerli bir URL olmalı.");
    }
  }

  const payload: TablesInsert<"may19_campaign_submissions"> = {
    kind: input.kind,
    full_name: fullName,
    email,
    country,
    city,
    social_handle: socialHandle,
    title,
    description,
    message,
    link,
    storage_bucket: storageBucket,
    storage_path: storagePath,
    file_name: fileName,
    consent: input.consent,
  };

  const { error } = await supabase.from("may19_campaign_submissions").insert(payload);

  if (error) {
    throw toUserFacingMay19Error(error);
  }
}

const may19BucketByKind: Record<May19SubmissionKind, string> = {
  idea: "19051919_fikir",
  moment: "19051919_memory",
};

export async function uploadMay19CampaignFile(kind: May19SubmissionKind, file: File) {
  const bucket = may19BucketByKind[kind];
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const safeExt = ext ? `.${ext.toLowerCase()}` : "";
  const path = `${kind}/${crypto.randomUUID()}${safeExt}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    throw toUserFacingMay19Error(error);
  }

  return {
    storageBucket: bucket,
    storagePath: path,
    fileName: file.name,
  };
}

export async function createMay19CampaignFileSignedUrl(
  storageBucket: string,
  storagePath: string,
  expiresInSeconds = 300,
) {
  const { data, error } = await supabase.storage
    .from(storageBucket)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function listMay19CampaignEntries(
  kind: May19SubmissionKind,
  status: May19SubmissionStatus,
) {
  const { data, error } = await supabase
    .from("may19_campaign_submissions")
    .select("*")
    .eq("kind", kind)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as May19SubmissionRow[];
}

export async function updateMay19CampaignEntry(
  id: string,
  updates: Pick<TablesUpdate<"may19_campaign_submissions">, "status" | "review_notes">,
) {
  const { error } = await supabase
    .from("may19_campaign_submissions")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function deleteMay19CampaignEntry(id: string) {
  const { error } = await supabase
    .from("may19_campaign_submissions")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}
