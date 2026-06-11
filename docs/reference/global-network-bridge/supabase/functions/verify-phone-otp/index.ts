import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return json({ error: "unauthorized" }, 401);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userRes } = await sb.auth.getUser();
    const user = userRes?.user;
    if (!user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const code = String(body?.code ?? "").trim();
    if (!/^\d{6}$/.test(code)) return json({ error: "invalid_code_format" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rows } = await admin
      .from("phone_verifications")
      .select("id, phone, code, expires_at, verified_at, attempts")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const row = rows?.[0];
    if (!row) return json({ error: "no_code" }, 400);
    if (row.verified_at) return json({ error: "already_verified" }, 400);
    if (new Date(row.expires_at).getTime() < Date.now()) return json({ error: "expired" }, 400);
    if (row.attempts >= 5) return json({ error: "too_many_attempts" }, 429);

    if (row.code !== code) {
      await admin.from("phone_verifications").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return json({ error: "wrong_code" }, 400);
    }

    await admin.from("phone_verifications").update({ verified_at: new Date().toISOString() }).eq("id", row.id);
    await admin.from("profiles").update({ phone: row.phone, phone_verified: true }).eq("id", user.id);

    return json({ ok: true, phone: row.phone });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
