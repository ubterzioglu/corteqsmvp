/**
 * Kariyer başvurularının yönetici tarafı (KR08).
 *
 * ⚠️ Yetki kapısı **sunucudadır**: `career_applications` üzerindeki RLS yalnız
 * `is_admin(auth.uid())` için SELECT/UPDATE açar ve tabloda anon yetkisi yoktur.
 * Buradaki fonksiyonlar ek bir kapı kurmaz — istemcide "admin mi" diye bakıp
 * sorguyu atlamak güvenlik DEĞİLDİR, yalnız arayüz kolaylığıdır.
 *
 * ⚠️ Dosyalar **imzalı bağlantıyla** açılır. Kova private kalır; dosyayı public
 * yapmak başvuranın CV'sini herkese açmak demektir.
 */
import { supabase } from "@/integrations/supabase/client";

import type { CareerApplicationRow, CareerApplicationStatus } from "./careers-schemas";

/** PostgREST 1000 satırda sessizce keser; başvuru hacmi küçük ama tavan açık yazılır. */
const LIST_LIMIT = 500;

export async function listCareerApplications(): Promise<CareerApplicationRow[]> {
  const { data, error } = await supabase
    .from("career_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) throw error;
  return (data ?? []) as CareerApplicationRow[];
}

export async function updateCareerApplicationStatus(
  id: string,
  status: CareerApplicationStatus,
): Promise<void> {
  const { error } = await supabase.from("career_applications").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateCareerApplicationNotes(id: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from("career_applications")
    .update({ notes: notes.trim() === "" ? null : notes })
    .eq("id", id);
  if (error) throw error;
}

/** Geçici (varsayılan 5 dk) imzalı bağlantı. Kova private kalır. */
export const CAREER_SIGNED_URL_TTL_SECONDS = 300;

export async function createCareerFileUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("career-applications")
    .createSignedUrl(path, CAREER_SIGNED_URL_TTL_SECONDS);

  if (error) throw error;
  if (!data?.signedUrl) throw new Error("İmzalı bağlantı üretilemedi.");
  return data.signedUrl;
}
