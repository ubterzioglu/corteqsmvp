// R5 (13 Eylül, B6 mixed-data-fetching): MessagesInbox.tsx doğrudan
// supabase.from("direct_messages"/"user_profile_attributes") ile 4 farklı
// yerde okuyup yazıyordu.
//
// ⚠️ Bilinçli tasarım kararı: her fonksiyon supabase-js'in KENDİ `{ data, error }`
// şeklini aynen döndürür — bileşenin mevcut, iki aşamalı hata dallanması
// (mesaj hatası vs profil hatası, kısmi başarı durumu) HİÇ değiştirilmedi.
// Amaç davranışı yeniden tasarlamak değil, ham supabase çağrısını isimli bir
// fonksiyonun arkasına almak.

import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type DirectMessage = Tables<"direct_messages">;
export type MessageCounterpart = { user_id: string; full_name: string | null; email: string | null };

const MESSAGE_COLUMNS = "id, sender_id, recipient_id, content, created_at, read_at";

/** Girişli kullanıcıya gelen mesajlar, en yeniden eskiye, en fazla 200. */
export function fetchReceivedMessages(userId: string) {
  return supabase
    .from("direct_messages")
    .select(MESSAGE_COLUMNS)
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
}

/** Girişli kullanıcının gönderdiği mesajlar, en yeniden eskiye, en fazla 200. */
export function fetchSentMessages(userId: string) {
  return supabase
    .from("direct_messages")
    .select(MESSAGE_COLUMNS)
    .eq("sender_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
}

/** Verilen kullanıcı kimliklerinin görünen adlarını (full_name) getirir. */
export async function fetchCounterpartNames(userIds: string[]) {
  return supabase
    .from("user_profile_attributes")
    .select("user_id, value_text, afs_attributes!inner(key)")
    .in("user_id", userIds)
    .eq("afs_attributes.key", "full_name");
}

/** Bir mesajı okundu olarak işaretler (yalnız alıcı kendi mesajını işaretleyebilir — RLS zaten korur, `.eq("recipient_id", ...)` ikinci bir güvenlik katmanı). */
export function markDirectMessageRead(messageId: string, recipientId: string, readAt: string) {
  return supabase
    .from("direct_messages")
    .update({ read_at: readAt })
    .eq("id", messageId)
    .eq("recipient_id", recipientId);
}

/** Yeni bir doğrudan mesaj gönderir (cevap dahil). */
export function sendDirectMessage(payload: TablesInsert<"direct_messages">) {
  return supabase.from("direct_messages").insert(payload);
}
