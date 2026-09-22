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

  // Anahtar ülke DEĞİL kapsamdır (ülke + şehir). Yalnız ülkeye göre gruplansaydı
  // "Berlin kirası" ile "Almanya geneli kira" aynı gruba düşer, `pickRowForHousehold`
  // birini dizi sırasına göre seçer ve bot tek rakamı doğruymuş gibi anlatırdı.
  // Panel ile aynı sözleşme — biri değişirse öbürü de değişmelidir (B29).
  const byScopeItem = new Map<string, RelocationLivingCostRow[]>();
  for (const row of rows) {
    const key = `${row.country_code}\u0000${row.city_code ?? ""}\u0000${row.item_key}`;
    const list = byScopeItem.get(key);
    if (list) list.push(row);
    else byScopeItem.set(key, [row]);
  }

  // Rakamların niteliği bağlamda da yazılır (B28, seçenek D) — panelde uyarı görüp
  // bottan "Berlin'de kira 1.400 €" cevabı almak, uyarıyı etkisiz kılar. Modelin
  // bunları ölçülmüş fiyat gibi sunmaması için kaynak niteliği baştan söylenir.
  const header = [
    "## Yaşam masrafları (platform verisi)",
    "(Büyük şehirler için tipik aylık aralıklar; genel piyasa bilgisine dayanır, resmî fiyat endeksi değildir.)",
  ];
  // ⚠️ Uydurma freni: veri satırı AYRI dizide toplanır. Başlığı `lines`e koyup
  // `lines.length > 1` ile ölçmek, iki satırlık başlık yüzünden hiç veri yokken de
  // blok üretirdi — model "elimde rakam var" sanardı.
  const lines: string[] = [];
  for (const group of byScopeItem.values()) {
    const picked = pickRowForHousehold(group, householdSize);
    if (!picked) continue;
    const label = COST_ITEM_LABELS[picked.item_key] ?? picked.item_key;
    const period = picked.period === "monthly" ? "/ay" : " (tek seferlik)";
    const scope = picked.city_code
      ? `${picked.country_code}/${picked.city_code}`
      : `${picked.country_code} (ülke geneli)`;
    lines.push(`- ${scope} · ${label}: ${formatCostRange(picked)}${period}`);
  }

  return lines.length > 0 ? [...header, ...lines].join("\n") : null;
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
