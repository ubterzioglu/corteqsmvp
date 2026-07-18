import { supabase } from "@/integrations/supabase/client";

// admin_favorite_pages henüz generated types.ts içinde yok (regen bekleniyor,
// bkz. CLAUDE.md B1) — diğer untyped admin tabloları/RPC'leri gibi cast edilir.
const db = supabase as any;

export async function fetchAdminFavoritePageIds(userId: string): Promise<string[]> {
  const { data, error } = await db
    .from("admin_favorite_pages")
    .select("page_ids")
    .eq("admin_user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.page_ids as string[] | null) ?? [];
}

export async function saveAdminFavoritePageIds(userId: string, pageIds: string[]): Promise<void> {
  const { error } = await db
    .from("admin_favorite_pages")
    .upsert({ admin_user_id: userId, page_ids: pageIds }, { onConflict: "admin_user_id" });

  if (error) throw error;
}
