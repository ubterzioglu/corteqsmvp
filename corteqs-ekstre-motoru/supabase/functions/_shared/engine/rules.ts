// Tüccar kuralları ve kart tanımları.
// DEFAULT_RULES, Drive'daki "TEKNOLOJİ HARCAMALARI" tablosu ve admin'deki mevcut kayıtlardan çıkarıldı.
// Canlıda kurallar `merchant_rules` tablosundan okunur; bu liste seed + test içindir.

import type { MerchantRule, PaymentCard } from "./types.ts";
import { normalizeDescription } from "./normalize.ts";

export const DEFAULT_RULES: MerchantRule[] = [
  // — Yapay zekâ / geliştirme araçları
  { pattern: "ANTHROPIC|CLAUDE", merchant: "Anthropic Claude", category: "yazilim_araclar", is_tech: true, priority: 10, auto_commit: true },
  { pattern: "CODEX", merchant: "OpenAI Codex", category: "yazilim_araclar", is_tech: true, priority: 9 },
  { pattern: "OPENAI|CHATGPT|GPT BUSINESS", merchant: "OpenAI ChatGPT", category: "yazilim_araclar", is_tech: true, priority: 10, auto_commit: true },
  { pattern: "LOVABLE", merchant: "Lovable", category: "yazilim_araclar", is_tech: true, priority: 10, auto_commit: true },
  { pattern: "SUPABASE", merchant: "Supabase", category: "yazilim_araclar", is_tech: true, priority: 10, auto_commit: true },
  { pattern: "NEO4J|NEO 4 ?J", merchant: "Neo4j", category: "yazilim_araclar", is_tech: true, priority: 10, auto_commit: true },
  { pattern: "HIGGSFIELD|HIGSFIELD|HIGSSFIELD", merchant: "Higgsfield", category: "yazilim_araclar", is_tech: true, priority: 10 },
  { pattern: "KLING", merchant: "Kling AI", category: "yazilim_araclar", is_tech: true, priority: 10 },
  { pattern: "EMERGENT", merchant: "Emergent", category: "yazilim_araclar", is_tech: true, priority: 10 },
  { pattern: "Z\\.?AI\\b|ZHIPU|BIGMODEL", merchant: "Z.AI", category: "yazilim_araclar", is_tech: true, priority: 10 },
  { pattern: "GEMINI", merchant: "Google Gemini", category: "yazilim_araclar", is_tech: true, priority: 11 },
  { pattern: "GOOGLE ?CLOUD|GCP|CLOUD\\.GOOGLE", merchant: "Google Cloud", category: "yazilim_araclar", is_tech: true, priority: 11 },
  { pattern: "GOOGLE ?ONE|GOOGLE STORAGE", merchant: "Google One", category: "yazilim_araclar", is_tech: true, priority: 12 },
  { pattern: "GOOGLE ?PLAY", merchant: "Google Play", category: "yazilim_araclar", is_tech: true, priority: 13 },
  { pattern: "GOOGLE ?(WORKSPACE|GSUITE)", merchant: "Google Workspace", category: "yazilim_araclar", is_tech: true, priority: 11 },
  { pattern: "CANVA", merchant: "Canva Pro", category: "yazilim_araclar", is_tech: true, priority: 10 },
  { pattern: "ZOOM", merchant: "Zoom", category: "yazilim_araclar", is_tech: true, priority: 10, auto_commit: true },
  { pattern: "GITHUB", merchant: "GitHub", category: "yazilim_araclar", is_tech: true, priority: 10, auto_commit: true },
  { pattern: "CURSOR", merchant: "Cursor", category: "yazilim_araclar", is_tech: true, priority: 10 },
  { pattern: "VERCEL", merchant: "Vercel", category: "hosting_sunucu", is_tech: true, priority: 10 },
  { pattern: "WHATSAPP|META ?(PLATFORMS|BUSINESS)", merchant: "WhatsApp Business / Meta", category: "yazilim_araclar", is_tech: true, priority: 12 },
  { pattern: "DORUK BILISIM", merchant: "Doruk Bilişim", category: "yazilim_araclar", is_tech: true, priority: 10 },
  { pattern: "APPLE\\.COM|APPLE", merchant: "Apple", category: "yazilim_araclar", is_tech: true, priority: 20 },
  { pattern: "LINKEDIN", merchant: "LinkedIn Premium", category: "pazarlama_reklam", is_tech: true, priority: 10 },

  // — Hosting / e-posta
  { pattern: "STRATO", merchant: "Strato", category: "hosting_sunucu", is_tech: true, priority: 10, auto_commit: true },
  { pattern: "ZOHO", merchant: "Zoho Workplace", category: "hosting_sunucu", is_tech: true, priority: 10, auto_commit: true },
  { pattern: "HOSTINGER|DIGITALOCEAN|HETZNER|\\bAWS\\b|AMAZON WEB SERVICES|CLOUDFLARE", merchant: "Hosting", category: "hosting_sunucu", is_tech: true, priority: 9 },

  // — Alan adı
  { pattern: "NAMECHEAP", merchant: "Namecheap", category: "alan_adi_ssl", is_tech: true, priority: 10 },
  { pattern: "GODADDY", merchant: "GoDaddy", category: "alan_adi_ssl", is_tech: true, priority: 10 },
  { pattern: "MYDOMAIN", merchant: "MyDomain", category: "alan_adi_ssl", is_tech: true, priority: 10 },
  { pattern: "METUNIC", merchant: "MetUnic", category: "alan_adi_ssl", is_tech: true, priority: 10 },

  // — Teknoloji dışı / dikkat
  { pattern: "SUPERCELL|STEAM|PLAYSTATION|NETFLIX|SPOTIFY|DISNEY", merchant: "Kişisel eğlence", category: "diger", is_tech: false, priority: 5 },
  { pattern: "AMAZON(?! WEB)", merchant: "Amazon", category: "diger", is_tech: true, priority: 30 },

  // — Banka kalemleri (kart ekstresinde çıkan; teknoloji dışı, istenirse aktarılır)
  { pattern: "BSMV|KKDF|KART UCRETI|YILLIK UCRET|GECIKME|FAIZ|KOMISYON", merchant: "Banka kesintisi", category: "banka_komisyon", is_tech: false, priority: 1 },
];

/** Bilinen kartlar. Canlıda `payment_cards` tablosundan okunur. */
export const DEFAULT_CARDS: PaymentCard[] = [
  { last4: "6108", label: "QNB Sanal (…6108)", bank: "QNB Finansbank", payment_method: "sanal_kart_burak", owner: "burak", is_virtual: true, default_person: "ortak" },
  { last4: "3286", label: "QNB Asıl (…3286)", bank: "QNB Finansbank", payment_method: "kisisel_kart_burak", owner: "burak", is_virtual: false, default_person: "ortak" },
  // İş Bankası Maximiles — son 4 hane ekstreden gelince güncellenecek. Etiketle de eşleşir.
  { last4: "MAXI", label: "Maximiles (İş Bankası)", bank: "İş Bankası", payment_method: "kisisel_kart_burak", owner: "burak", is_virtual: false, default_person: "ortak" },
];

export interface RuleMatch { rule: MerchantRule | null; confidence: number; }

export function compileRules(rules: MerchantRule[]) {
  return [...rules]
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
    .map((r) => ({ rule: r, re: new RegExp(r.pattern, "i") }));
}

export function matchRule(description: string, compiled: ReturnType<typeof compileRules>): RuleMatch {
  const norm = normalizeDescription(description);
  for (const { rule, re } of compiled) {
    if (re.test(norm)) {
      // Kısa/tek kelimelik genel desenlere (APPLE, AMAZON) daha düşük güven
      const conf = (rule.priority ?? 100) >= 20 ? 0.7 : 0.95;
      return { rule, confidence: conf };
    }
  }
  return { rule: null, confidence: 0 };
}

export function findCard(cards: PaymentCard[], last4?: string | null, label?: string | null): PaymentCard | null {
  if (last4) {
    const c = cards.find((c) => c.last4 === last4);
    if (c) return c;
  }
  if (label) {
    const l = label.toUpperCase();
    const byDigits = l.match(/(\d{4})\)?\s*$/);
    if (byDigits) {
      const c = cards.find((c) => c.last4 === byDigits[1]);
      if (c) return c;
    }
    if (l.includes("MAXIMILES")) return cards.find((c) => c.last4 === "MAXI") ?? null;
    if (l.includes("MERCURY")) return cards.find((c) => c.bank === "Mercury") ?? null;
  }
  return null;
}
