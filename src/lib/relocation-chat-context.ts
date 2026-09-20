// Relocation AI asistanı — model bağlamı kurucusu (saf fonksiyon).
//
// NEDEN BU DOSYA VAR:
// 2026-09-20'de canlı ölçüldü — mevcut RAG (rag.corteqs.net) taşınma konusunda
// HİÇBİR ŞEY bilmiyor ("Almanya'ya taşınmak için hangi belgeler gerekli?" →
// "Sağlanan bağlamda bilgi bulunmamaktadır."). Asistanın işe yaraması, bilginin
// modele BİZİM tarafımızdan verilmesine bağlı. Bu modül, kullanıcının taşınma
// dosyası + DB'deki içerikten modele verilecek bağlam metnini üretir.
//
// GİZLİLİK: buraya yalnız kullanıcının KENDİ girdiği taşınma tercihleri girer.
// user_id, e-posta, telefon, ad-soyad ASLA gönderilmez (client-error-reports.ts
// ile aynı ilke). Bağlam metni dışarıdaki bir modele gider.

import {
  formatCostRange,
  pickRowForHousehold,
} from "@/lib/relocation-content-format";
import type {
  RelocationLivingCostRow,
  RelocationRequiredDocumentRow,
} from "@/lib/relocation-content-types";

/** Kalem anahtarı → Türkçe etiket. Bu bir GÖRÜNTÜ sözlüğüdür, DB anahtarı değildir. */
export const COST_ITEM_LABELS: Record<string, string> = {
  rent: "Kira",
  groceries: "Market/Gıda",
  transport: "Ulaşım",
  insurance: "Sağlık sigortası",
  utilities: "Faturalar",
  childcare: "Çocuk bakımı/okul",
};

export interface RelocationChatProfile {
  targetCountryCodes: string[];
  /** Görünen ülke adları (kod → ad çözümlemesi çağıran tarafta yapılır). */
  targetCountryNames: string[];
  adults: number;
  children: number;
  budgetMonthly: number | null;
  currency: string;
  moveWindowStart: string | null;
  moveWindowEnd: string | null;
  mustHaves: string[];
}

export interface RelocationChatContextInput {
  profile: RelocationChatProfile;
  livingCosts: RelocationLivingCostRow[];
  requiredDocuments: RelocationRequiredDocumentRow[];
}

/**
 * Bağlam metni üst sınırı (karakter).
 *
 * Model bağlamı sınırsız değil; belge listesi ülke sayısıyla büyür. Sınır aşılırsa
 * metin KESİLİR ve kesildiği açıkça yazılır — sessizce yarım bağlam göndermek,
 * modelin eksik bilgiyle kesin konuşmasına yol açar.
 */
export const MAX_CONTEXT_CHARS = 6000;

function formatHousehold(profile: RelocationChatProfile): string {
  const parts = [`${profile.adults} yetişkin`];
  if (profile.children > 0) parts.push(`${profile.children} çocuk`);
  return parts.join(", ");
}

function buildProfileBlock(profile: RelocationChatProfile): string {
  const lines: string[] = ["## Kullanıcının taşınma dosyası"];

  const countries = profile.targetCountryNames.length > 0
    ? profile.targetCountryNames.join(", ")
    : profile.targetCountryCodes.join(", ");
  lines.push(`- Hedef ülke(ler): ${countries || "Belirtilmedi"}`);
  lines.push(`- Hane: ${formatHousehold(profile)}`);

  if (profile.budgetMonthly !== null) {
    lines.push(`- Aylık konut bütçesi: ${profile.budgetMonthly} ${profile.currency}`);
  }
  if (profile.moveWindowStart || profile.moveWindowEnd) {
    lines.push(
      `- Taşınma penceresi: ${profile.moveWindowStart ?? "?"} – ${profile.moveWindowEnd ?? "?"}`,
    );
  }
  if (profile.mustHaves.length > 0) {
    lines.push(`- Olmazsa olmazlar: ${profile.mustHaves.join(", ")}`);
  }

  return lines.join("\n");
}

function buildCostBlock(
  rows: RelocationLivingCostRow[],
  householdSize: number,
): string | null {
  if (rows.length === 0) return null;

  const byCountryItem = new Map<string, RelocationLivingCostRow[]>();
  for (const row of rows) {
    const key = `${row.country_code}|${row.item_key}`;
    const list = byCountryItem.get(key);
    if (list) list.push(row);
    else byCountryItem.set(key, [row]);
  }

  const lines: string[] = ["## Yaşam masrafları (platform verisi)"];
  for (const [key, group] of byCountryItem) {
    const [countryCode, itemKey] = key.split("|");
    const picked = pickRowForHousehold(group, householdSize);
    if (!picked) continue;
    const label = COST_ITEM_LABELS[itemKey] ?? itemKey;
    const period = picked.period === "monthly" ? "/ay" : " (tek seferlik)";
    lines.push(`- ${countryCode} · ${label}: ${formatCostRange(picked)}${period}`);
  }

  return lines.length > 1 ? lines.join("\n") : null;
}

function buildDocumentBlock(rows: RelocationRequiredDocumentRow[]): string | null {
  if (rows.length === 0) return null;

  const lines: string[] = ["## Gerekli belgeler (platform verisi)"];
  for (const row of rows) {
    const note = row.note ? ` — ${row.note}` : "";
    lines.push(`- ${row.country_code} · [${row.category}] ${row.doc_name}${note}`);
  }
  return lines.join("\n");
}

/**
 * Modele verilecek bağlam metnini kurar.
 *
 * İçerik yoksa bloklar hiç yazılmaz ve metin bunu AÇIKÇA söyler; böylece model
 * "elimde veri var" varsayımıyla uydurmaya yönelmez.
 */
export function buildRelocationChatContext(input: RelocationChatContextInput): string {
  const { profile, livingCosts, requiredDocuments } = input;
  const householdSize = profile.adults + profile.children;

  const blocks: string[] = [buildProfileBlock(profile)];

  const costBlock = buildCostBlock(livingCosts, householdSize);
  const docBlock = buildDocumentBlock(requiredDocuments);

  if (costBlock) blocks.push(costBlock);
  if (docBlock) blocks.push(docBlock);

  if (!costBlock && !docBlock) {
    blocks.push(
      "## Platform verisi\nBu hedef ülke(ler) için platformda henüz maliyet veya belge " +
        "verisi YOK. Kesin rakam veya belge listesi verme; genel rehberlik yap ve " +
        "bilginin doğrulanması gerektiğini belirt.",
    );
  }

  const text = blocks.join("\n\n");
  if (text.length <= MAX_CONTEXT_CHARS) return text;

  return (
    text.slice(0, MAX_CONTEXT_CHARS) +
    "\n\n[Bağlam uzunluk sınırına ulaştı ve kesildi — liste eksik olabilir.]"
  );
}
