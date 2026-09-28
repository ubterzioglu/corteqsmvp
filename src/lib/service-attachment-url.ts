// Hizmet talebi eki okuma adresi — B3/Y6 (bucket private'a geçti, 28.09).
//
// Private bucket'ta `getPublicUrl` adresleri ÖLÜDÜR (400). Bu yüzden:
// · YAZMA: ServiceRequestForm DB'ye public URL değil, storage PATH yazar
//   (`<user_id>/<zaman>-<ad>`).
// · OKUMA: görüntüleme yüzeyi tıklamada `createSignedUrl` ile KISA ÖMÜRLÜ
//   imzalı link üretir; RLS kapısı own-or-admin (kendi klasörün veya Admin_*).
// · ESKİ KAYITLAR: bugüne dek yazılmış public/imzalı URL biçimleri de burada
//   path'e normalize edilir (28.09 ölçümü: 0 kayıt — ama sözleşme dayanıklı).
//
// İmzalı linki DB'ye YAZMA: token'lı adres sızdığında ömrü boyunca geçerlidir
// ve RLS'i atlar. DB'de her zaman path durur, link anlık üretilir.
import { supabase } from "@/integrations/supabase/client";

export const SERVICE_ATTACHMENTS_BUCKET = "service-attachments";

/** 15 dk: dosyayı açıp incelemeye yeter; link sızarsa çabuk ölür. */
export const SERVICE_ATTACHMENT_SIGNED_TTL_SECONDS = 15 * 60;

const PUBLIC_MARKER = `/object/public/${SERVICE_ATTACHMENTS_BUCKET}/`;
const SIGNED_MARKER = `/object/sign/${SERVICE_ATTACHMENTS_BUCKET}/`;

/**
 * DB kaydını (eski public URL · eski imzalı URL · ham path) storage path'e çevirir.
 * Sorgu işaretini (token) atar, yüzde-kodlamayı çözer.
 */
export function toServiceAttachmentPath(stored: string): string {
  if (!stored) return "";

  for (const marker of [PUBLIC_MARKER, SIGNED_MARKER]) {
    const at = stored.indexOf(marker);
    if (at >= 0) {
      const tail = stored.slice(at + marker.length).split("?")[0];
      return decodeURIComponent(tail);
    }
  }

  return stored.replace(/^\/+/, "");
}

/**
 * Tıklama anında imzalı okuma adresi üretir.
 * Yetki yoksa / dosya yoksa null döner — çağıran taraf kullanıcıya gösterir
 * (sessiz ölüm yok; G01'de aynı ders öğrenildi).
 */
export async function createServiceAttachmentUrl(stored: string): Promise<string | null> {
  const path = toServiceAttachmentPath(stored);
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(SERVICE_ATTACHMENTS_BUCKET)
    .createSignedUrl(path, SERVICE_ATTACHMENT_SIGNED_TTL_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
