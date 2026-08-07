// Relocation Tools — kategori kataloğu. relocation_tools.category ham anahtarını
// hub filtresindeki Türkçe etikete + ikona çevirir.
//
// TASARIM SÖZLEŞMESİ: filtre sekmeleri buradaki listeden DEĞİL, gelen araç verisinden
// üretilir (buildCategoryFilters). Katalog yalnızca "bu anahtarın güzel adı ne" sorusunu
// yanıtlar. DB'ye yeni bir kategori eklenip buraya satır eklenmezse araçlar kaybolmaz,
// yalnızca sekme ham anahtarla görünür — sessiz veri kaybı yerine gözle görülür bir iz.
import { Compass, Landmark, Users, Wrench, type LucideIcon } from "lucide-react";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";

export interface ToolCategoryMeta {
  label: string;
  Icon: LucideIcon;
}

/** "Tümü" sekmesinin anahtarı — hiçbir gerçek kategori bu değeri kullanamaz. */
export const ALL_TOOL_CATEGORIES = "__all__";

const CATEGORY_META: Record<string, ToolCategoryMeta> = {
  relocation_assessment: { label: "Taşınma", Icon: Compass },
  germany_tools: { label: "Almanya", Icon: Landmark },
  nesil_analizi: { label: "Nesil", Icon: Users },
};

/** Kategori anahtarı → etiket + ikon. Bilinmeyen anahtar → anahtarın kendisi + genel ikon. */
export function toolCategoryMeta(categoryKey: string): ToolCategoryMeta {
  return CATEGORY_META[categoryKey] ?? { label: categoryKey, Icon: Wrench };
}

export interface ToolCategoryFilter extends ToolCategoryMeta {
  key: string;
  count: number;
}

/**
 * Araç listesinden filtre sekmelerini üretir: "Tümü" + veride gerçekten var olan
 * kategoriler, ilk görülme sırasıyla (listTools zaten sort_order'a göre sıralı gelir).
 * Boş liste → boş dizi (tek başına duran "Tümü" sekmesi gösterilmez).
 */
export function buildCategoryFilters(tools: RelocationToolRow[]): ToolCategoryFilter[] {
  if (tools.length === 0) return [];

  const counts = new Map<string, number>();
  for (const tool of tools) {
    counts.set(tool.category, (counts.get(tool.category) ?? 0) + 1);
  }

  const categories = [...counts.entries()].map(([key, count]) => ({
    key,
    count,
    ...toolCategoryMeta(key),
  }));

  return [
    { key: ALL_TOOL_CATEGORIES, count: tools.length, label: "Tümü", Icon: Wrench },
    ...categories,
  ];
}
