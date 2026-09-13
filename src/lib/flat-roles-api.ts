// S6 (13 Eylül, B6): `get_flat_roles` RPC'si RequestNewProfileDialog.tsx VE
// ProfilePage.tsx'te birebir aynı kodla iki kez tekrarlanıyordu.
//
// ⚠️ Bilinçli tasarım kararı: `fetchFlatRoles` supabase-js'in KENDİ
// `{ data, error }` şeklini aynen döndürür, throw ETMEZ. RPC hataları
// supabase-js'te DÜZ NESNEDİR, `Error` örneği değildir (bkz. CLAUDE.md
// "Cadde 3.0 Rules" — `resolveCaddeRpcErrorMessage` notu, aynı tuzak burada
// da geçerli) — throw edip `error instanceof Error` ile mesaj okumaya
// çalışmak sessizce "Beklenmeyen hata"ya düşürür. Ham şekli korumak iki
// çağıranın da mevcut `if (error) { ...error.message... }` dallanmasını
// değiştirmeden taşımayı sağlar.
import { supabase } from "@/integrations/supabase/client";

export type FlatRoleOption = {
  key: string;
  label: string;
  description: string | null;
};

export function fetchFlatRoles() {
  return supabase.rpc("get_flat_roles");
}

/** Ham RPC yanıtını (`data`) FlatRoleOption[]'a eşler — geçersiz/eksik alanlı satırlar elenir. */
export function mapFlatRoleOptions(data: unknown): FlatRoleOption[] {
  const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
  return rows
    .map((item) => ({
      key: typeof item?.key === "string" ? item.key : "",
      label: typeof item?.label === "string" ? item.label : "",
      description: typeof item?.description === "string" ? item.description : null,
    }))
    .filter((item) => item.key && item.label);
}
