// ChatBot mesaj yardımcıları.
//
// AYRI DOSYADA OLMASI ZORUNLU: bunlar `ChatBot.tsx` içinde dururken eslint
// `react-refresh/only-export-components` uyarısı veriyordu — bir bileşen dosyası
// yalnız bileşen dışa açmalı, yoksa hızlı yenileme (fast refresh) bozulur.

import type { ChatMessage } from "@/lib/chatConfig";
import type { SiteAssistantMessage, SiteAssistantSource } from "@/lib/site-assistant-api";

/**
 * Sohbet geçmişini asistanın beklediği biçime çevirir.
 *
 * `excluded` listesindeki metinler ATILIR: açılış selamlaması, ziyaretçi uyarısı ve
 * "bulamadım" metni birer bot mesajı olarak listede duruyor ama modele geri
 * beslenmemeli — hiçbir bilgi katmazlar, tur bütçesinden yer yerler ve modelin
 * kendi uyarısını tekrarlamasına yol açarlar.
 */
export function toAssistantHistory(
  messages: ChatMessage[],
  excluded: readonly string[],
): SiteAssistantMessage[] {
  return messages
    .filter((message) => !excluded.includes(message.content))
    .map((message) => ({
      role: message.role === "user" ? ("user" as const) : ("assistant" as const),
      content: message.content,
    }));
}

/** Yanıtın altına gösterilecek kaynak sayısı — daha fazlası yanıtı bastırır. */
const MAX_VISIBLE_SOURCES = 4;

/** Kaynak listesini yanıtın altına ekler — botun asıl işi doğru sayfaya yöneltmek. */
export function appendSources(
  answer: string,
  sources: Pick<SiteAssistantSource, "title" | "url">[],
): string {
  const linked = sources.filter((source) => source.url);
  if (linked.length === 0) return answer;

  const lines = linked
    .slice(0, MAX_VISIBLE_SOURCES)
    .map((source) => `- [${source.title}](${source.url})`);

  return `${answer}\n\n**Kaynaklar**\n${lines.join("\n")}`;
}
