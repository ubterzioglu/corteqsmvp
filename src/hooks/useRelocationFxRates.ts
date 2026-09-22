import { useQuery } from "@tanstack/react-query";

import { getFxRates } from "@/lib/relocation-content-api";
import { relocationKeys } from "@/lib/relocation-query-keys";

/**
 * Saklanan döviz kurları (B30).
 *
 * Kur sağlayıcısı günde bir yayımlıyor (`refresh_sla_hours = 24`), bu yüzden istemci
 * tarafında uzun `staleTime` doğrudur — her sekme açılışında yeniden sorgulamak
 * anlamsız yük olur. Sorgu düşerse hook boş dizi verir ve panel karşılık göstermez.
 */
export function useRelocationFxRates() {
  return useQuery({
    queryKey: relocationKeys.fxRates(),
    queryFn: getFxRates,
    staleTime: 60 * 60 * 1000,
  });
}
