import { FALLBACK_PROFILE_NAME, db } from "./cadde-internal";
import { fetchInChunks } from "./supabase-chunked";

export async function fetchCaddeCountryNameMap(): Promise<Map<string, string>> {
  const { data } = await db.from("cadde_countries").select("id, name");
  return new Map<string, string>((data ?? []).map((row: { id: string; name: string }) => [row.id, row.name]));
}

export async function fetchCaddeCityNameMap(): Promise<Map<string, string>> {
  const { data } = await db.from("cadde_cities").select("id, name");
  return new Map<string, string>((data ?? []).map((row: { id: string; name: string }) => [row.id, row.name]));
}

export async function fetchCaddeUserNameMap(authorIds: string[], extraUserIds: string[] = []): Promise<Map<string, string>> {
  const allIds = Array.from(new Set([...authorIds, ...extraUserIds].filter(Boolean)));
  if (allIds.length === 0) return new Map<string, string>();
  // ⚠️ Parçalı (S07a): kullanıcı başına 1 satır, ama liste büyüdükçe PostgREST'in
  // 1000 satır tavanına dayanır ve sessizce keser — adı çözülemeyen üye "Bir üye"
  // olarak görünür, hata hiçbir yerde çıkmaz.
  const rows = await fetchInChunks<{ user_id: string; value_text: string | null }>(
    allIds,
    1,
    (chunk) =>
      db
        .from("user_profile_attributes")
        .select("user_id, value_text, afs_attributes!inner(key)")
        .in("user_id", chunk)
        .eq("afs_attributes.key", "full_name"),
  );
  return new Map<string, string>(rows.map((row) => [row.user_id, row.value_text ?? FALLBACK_PROFILE_NAME]));
}
