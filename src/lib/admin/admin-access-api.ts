import { supabase } from "@/integrations/supabase/client";

export async function userIsAdmin(userId: string) {
  // Route through the canonical server-side is_admin() RPC (security definer)
  // instead of a hand-rolled embedded-filter query. The old query used
  // `roles!inner(key)` + an embedded `.ilike("roles.key", ...)` + `.maybeSingle()`,
  // a shape that can both throw on multiple Admin_% assignments and, under
  // PostgREST embedded-filter semantics, return a parent row with an empty embed
  // (failing open). Using is_admin() guarantees the frontend gate shares the
  // exact source of truth as the admin RPCs (is_admin/is_moderator over
  // user_role_assignments), so a `bireysel` user can never slip into the admin
  // shell and trigger 400s from admin-only RPCs.
  // `is_admin` is a server-defined function not present in the generated client
  // types, so cast like the other untyped admin RPCs in this module.
  const { data, error } = await (supabase as any).rpc("is_admin", { uid: userId });

  if (error) throw error;
  return Boolean(data);
}
