// Cadde'nin diaspora anahtarı — Faz 8 (spec §16).
// DiasporaContext App.tsx'te tüm ağacı sarar; yine de provider'sız render'larda
// (unit testler, izole story'ler) 'tr' fallback'i ile fail-open çalışır.
// İçerik ayrımı DB'de enforce edilir (RPC diaspora filtreleri); bu hook yalnız taşıyıcıdır.

import { useDiaspora, type DiasporaKey } from "@/contexts/DiasporaContext";

export function useCaddeDiasporaKey(): DiasporaKey {
  try {
    return useDiaspora().diaspora;
  } catch {
    return "tr";
  }
}
