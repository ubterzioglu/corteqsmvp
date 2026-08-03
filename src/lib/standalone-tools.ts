// Almanya dışı standalone araçlar — germany-standalone-tools.ts deseniyle aynı, ama konu
// Almanya'ya özel değil. RelocationToolPage her iki registry'yi de kontrol eder.
import { GERMANY_STANDALONE_TOOLS, type StandaloneTool } from "@/lib/germany-standalone-tools";

const OTHER_STANDALONE_TOOLS: Record<string, StandaloneTool> = {
  "zgen-nesil-bulucu": {
    slug: "zgen-nesil-bulucu",
    title: "ZGEN – Nesil Bulucu",
    summary: "Doğum yılını gir; hangi kuşaktan olduğunu ve diğer kuşaklarla nasıl geçineceğini öğren.",
    load: () => import("@/pages/relocation/tools/ZgenToolPage"),
  },
};

export type { StandaloneTool };

/** Bir slug herhangi bir standalone araç registry'sinde mi? */
export function getStandaloneTool(slug: string): StandaloneTool | null {
  return GERMANY_STANDALONE_TOOLS[slug] ?? OTHER_STANDALONE_TOOLS[slug] ?? null;
}
