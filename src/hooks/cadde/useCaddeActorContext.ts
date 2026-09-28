// Cadde actor context'i tek RPC ile okur (get_cadde_actor_context).
// Component'ler attribute/rol sorgularını ASLA kendisi yapmaz; kapı kararı bu hook'tan gelir.

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getCaddeActorContext } from "@/lib/cadde-api";
import { caddeReadError } from "@/lib/cadde-internal";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type { CaddeActorContext } from "@/lib/cadde-rules";

/**
 * ⚠️ FAIL-OPEN KAPATILDI (S06c). Eskiden okuma hatası `null` dönüyordu ve
 * `CaddeProfileGate` `!context` durumunda kullanıcıyı İÇERİ ALIYORDU.
 *
 * Bu bir yetki AÇIĞI değildi — gerçek enforce DB'de (RPC + RLS) ve orası değişmedi.
 * Asıl sorun görünürlük: `null` iki farklı şeyi aynı değere katlıyordu —
 *   (a) "bu kullanıcının bağlamı yok" (meşru),
 *   (b) "bağlam OKUNAMADI" (arıza).
 * RPC herkes için bozulsa kapı sessizce açık kalır, kimse fark etmezdi; üstelik
 * kullanıcı içeri girip paylaşım denediğinde sunucudan anlamsız bir hata alırdı.
 *
 * Artık fırlatır: `isError` ayrı bir durumdur ve yüzey onu ayrı gösterir.
 * ⚠️ `null` HÂLÂ meşru bir dönüş değeridir (bağlamı olmayan kullanıcı) — onu
 * hata durumuna çevirme.
 */
async function fetchCaddeActorContext(): Promise<CaddeActorContext | null> {
  try {
    return await getCaddeActorContext();
  } catch (error: unknown) {
    throw caddeReadError("getCaddeActorContext", error);
  }
}

export function useCaddeActorContext(enabled = true): UseQueryResult<CaddeActorContext | null> {
  return useQuery({
    queryKey: caddeQueryKeys.actorContext,
    queryFn: fetchCaddeActorContext,
    enabled,
    staleTime: 60_000,
  });
}
