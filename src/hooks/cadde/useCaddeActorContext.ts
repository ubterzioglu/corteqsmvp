// Cadde actor context'i tek RPC ile okur (get_cadde_actor_context).
// Component'ler attribute/rol sorgularını ASLA kendisi yapmaz; kapı kararı bu hook'tan gelir.

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getCaddeActorContext } from "@/lib/cadde-api";
import { reportCaddeApiError } from "@/lib/cadde-internal";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import type { CaddeActorContext } from "@/lib/cadde-rules";

async function fetchCaddeActorContext(): Promise<CaddeActorContext | null> {
  try {
    return await getCaddeActorContext();
  } catch (error: unknown) {
    // Fail-open: gerçek enforce DB'de (RPC + RLS). Context okunamazsa UI kapısı
    // kullanıcıyı kilitlemez, hata telemetriye düşer.
    reportCaddeApiError("getCaddeActorContext", error);
    return null;
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
