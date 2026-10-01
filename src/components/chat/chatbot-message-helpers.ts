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

/**
 * N06 — bot yanıtındaki mini-markdown'ın güvenli ayrıştırması.
 *
 * Bugün canlıdaki kusur: `appendSources` `- [Başlık](/yol)` satırları üretiyor ama
 * `ChatMessage` yalnız `**kalın**` işliyordu; kullanıcıya ham markdown görünüyor ve
 * hiçbir link tıklanamıyordu.
 *
 * ⚠️ MODEL ÇIKTISI GÜVENİLMEYEN GİRDİDİR. Link hedefi BEYAZ LİSTE ile kabul edilir:
 * - `/…` (ama `//…` veya `/\…` DEĞİL — protocol-relative hedef dış siteye gider) → iç link
 * - `https://…` → dış link (yeni sekme, `rel="noopener noreferrer"`)
 * - diğer her şey (`javascript:`, `data:`, `http://`, …) → link ÜRETİLMEZ, etiket düz metin kalır
 */
export type RichTextSegment =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "link"; text: string; href: string; external: boolean };

// Hedef deseni bir düzey dengeli parantez kabul eder: hem gerçek URL'ler
// (`…/wiki/A_(b)`) hem de saldırı denemeleri (`javascript:alert(1)`) AYNI yoldan
// geçip beyaz listede sınıflandırılmak zorunda — eşleşmeyen hedef "link değil"
// sayılıp ham markdown'ı metne sızdırırdı.
const RICH_TEXT_PATTERN =
  /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^()\s]*(?:\([^()\s]*\)[^()\s]*)*)\)/g;

export function classifyLinkTarget(target: string): "internal" | "external" | null {
  if (/^\/(?![/\\])/.test(target)) return "internal";
  if (/^https:\/\//i.test(target)) return "external";
  return null;
}

export function parseRichText(content: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(RICH_TEXT_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ kind: "text", text: content.slice(lastIndex, index) });
    }

    if (match[1] !== undefined) {
      segments.push({ kind: "bold", text: match[1] });
    } else {
      const text = match[2];
      const target = match[3];
      const classification = classifyLinkTarget(target);
      if (classification === null) {
        // Güvenli olmayan hedef: ham markdown gösterilmez, yalnız etiket metni kalır.
        segments.push({ kind: "text", text });
      } else {
        segments.push({
          kind: "link",
          text,
          href: target,
          external: classification === "external",
        });
      }
    }
    lastIndex = index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ kind: "text", text: content.slice(lastIndex) });
  }
  return segments;
}
