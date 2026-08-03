import { ZGEN_DATA } from "@/lib/zgen/zgen-data";
import type { ZgenCompatEntry, ZgenGeneration, ZgenProfile } from "@/lib/zgen/zgen-types";

export const ZGEN_MIN_YEAR = 1928;
export const ZGEN_MAX_YEAR = 2100;

export function getZgenGenerationByYear(year: number): ZgenGeneration | null {
  return ZGEN_DATA.generations.find((g) => year >= g.range[0] && year <= g.range[1]) ?? null;
}

export function getZgenProfile(genId: string): ZgenProfile | null {
  return ZGEN_DATA.profiles[genId] ?? null;
}

export function getZgenOtherGenerations(youGenId: string): ZgenGeneration[] {
  return ZGEN_DATA.generations.filter((g) => g.id !== youGenId);
}

export function getZgenCompat(youId: string, otherId: string): ZgenCompatEntry | null {
  return ZGEN_DATA.compat[youId]?.[otherId] ?? null;
}
