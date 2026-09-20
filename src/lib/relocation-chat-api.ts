// Relocation AI asistanı — istemci çağrı katmanı.
// Edge function: supabase/functions/relocation-assistant/index.ts
//
// Bu asistan MEVCUT /api/chat (rag.corteqs.net) üzerinden gitmez: o servis tek
// soruluk ve taşınma bilgisi yok (2026-09-20 canlı ölçümü). Ayrıntı:
// docs/plans/2026-09-20-relocation-motor-plani.md §1.4

import { supabase } from "@/integrations/supabase/client";

export interface RelocationChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Tek istekte gönderilen tur sayısı — edge function da 20 ile sınırlar. */
export const MAX_CHAT_TURNS = 20;

/** Tek mesaj uzunluğu — edge function'daki zod sınırıyla aynı. */
export const MAX_MESSAGE_CHARS = 2000;

/**
 * Gönderilecek mesaj listesini sınırlara göre kırpar.
 *
 * En YENİ turlar korunur; eski turlar düşer. Sohbet uzadıkça baştaki mesajları
 * kesmek, sondakileri kesmekten iyidir — kullanıcı son konuşulanı hatırlar.
 */
export function trimChatHistory(messages: RelocationChatMessage[]): RelocationChatMessage[] {
  return messages
    .filter((m) => m.content.trim().length > 0)
    .slice(-MAX_CHAT_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
}

export interface AskRelocationAssistantInput {
  moveId?: string;
  /** src/lib/relocation-chat-context.ts ile kurulur. */
  context: string;
  messages: RelocationChatMessage[];
}

/**
 * Asistana sorar. Hata durumunda Türkçe mesajla `Error` fırlatır —
 * çağıran taraf toast gösterir.
 */
export async function askRelocationAssistant(
  input: AskRelocationAssistantInput,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("relocation-assistant", {
    body: {
      moveId: input.moveId,
      context: input.context,
      messages: trimChatHistory(input.messages),
    },
  });

  if (error) {
    // supabase-js fonksiyon hataları düz nesne olabilir — `instanceof Error`'a
    // daraltmak mesajı kaybettirir (cadde-rules.ts'te aynı tuzak yaşandı).
    const message =
      (error as { message?: string })?.message ?? "Asistana ulaşılamadı.";
    throw new Error(message);
  }

  const answer = (data as { answer?: string; error?: string } | null)?.answer;
  const serverError = (data as { error?: string } | null)?.error;

  if (serverError) throw new Error(serverError);
  if (!answer) throw new Error("Asistan yanıt döndürmedi.");

  return answer;
}
