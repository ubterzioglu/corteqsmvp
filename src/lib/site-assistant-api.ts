// Site geneli AI asistanı — istemci çağrı katmanı.
// Edge function: supabase/functions/site-assistant/index.ts
// Plan: docs/plans/2026-09-20-site-geneli-ai-bot-plani.md (Adım 5)
//
// Eski `src/lib/ragApi.ts` (`/api/chat` → rag.corteqs.net) YERİNE geçer; o dosya
// 21.09'da silindi (kalanlar yol haritası C02). O servis bu
// repoda yoktur, tek soruluktur ve bağlam bulamadığında da `hasContext: true`
// döndürür — bu yüzden ChatBot'taki yedek metin hiç devreye girmiyordu.

import { supabase } from "@/integrations/supabase/client";

export interface SiteAssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SiteAssistantSource {
  title: string;
  url: string | null;
  sourceKey: string;
}

export interface SiteAssistantAnswer {
  answer: string;
  /** Bilgi tabanında eşleşme bulunup bulunmadığı — sunucuda GERÇEKTEN hesaplanır. */
  hasContext: boolean;
  sources: SiteAssistantSource[];
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
export function trimChatHistory(messages: SiteAssistantMessage[]): SiteAssistantMessage[] {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .slice(-MAX_CHAT_TURNS)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_MESSAGE_CHARS),
    }));
}

/**
 * Asistana sorar. Hata durumunda Türkçe mesajla `Error` fırlatır —
 * çağıran taraf kullanıcıya gösterir.
 */
export async function askSiteAssistant(
  messages: SiteAssistantMessage[],
): Promise<SiteAssistantAnswer> {
  const { data, error } = await supabase.functions.invoke("site-assistant", {
    body: { messages: trimChatHistory(messages) },
  });

  if (error) {
    // supabase-js fonksiyon hataları DÜZ NESNE olabilir — `instanceof Error`'a
    // daraltmak mesajı kaybettirir (cadde-rules.ts'te aynı tuzak aylarca yaşandı).
    const message = (error as { message?: string })?.message ?? "Asistana ulaşılamadı.";
    throw new Error(message);
  }

  const payload = data as
    | { answer?: string; hasContext?: boolean; sources?: SiteAssistantSource[]; error?: string }
    | null;

  if (payload?.error) throw new Error(payload.error);
  if (!payload?.answer) throw new Error("Asistan yanıt döndürmedi.");

  return {
    answer: payload.answer,
    hasContext: payload.hasContext === true,
    sources: payload.sources ?? [],
  };
}
