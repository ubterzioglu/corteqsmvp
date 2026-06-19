// Relocation modülü — basit locale seçici (tr-TR / en-US).
// Mevcut repoda merkezî i18n framework yok; modül kendi sözlüğünü taşır.

import trTR from "@/content/relocation/locales/tr-TR.json";
import enUS from "@/content/relocation/locales/en-US.json";

export type RelocationLocale = "tr-TR" | "en-US";

const DICTS: Record<RelocationLocale, typeof trTR> = {
  "tr-TR": trTR,
  "en-US": enUS,
};

export function getRelocationDict(locale: string | undefined): typeof trTR {
  return DICTS[(locale as RelocationLocale) ?? "tr-TR"] ?? trTR;
}
