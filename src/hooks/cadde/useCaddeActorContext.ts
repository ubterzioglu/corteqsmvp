// Cadde actor context'i tek RPC ile okur (get_cadde_actor_context).
// Component'ler attribute/rol sorgularını ASLA kendisi yapmaz; kapı kararı bu hook'tan gelir.

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { reportCaddeApiError } from "@/lib/cadde-internal";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";
import { mapActorContext, type CaddeActorContext } from "@/lib/cadde-rules";

async function fetchCaddeActorContext(): Promise<CaddeActorContext | null> {
  try {
    const { data, error } = await supabase.rpc("get_cadde_actor_context" as never);
    if (error) throw error;
    return mapActorContext(data);
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
