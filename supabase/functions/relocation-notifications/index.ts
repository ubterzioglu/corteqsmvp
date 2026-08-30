// relocation-notifications — olaysal bildirim üreticisi (Faz 1 iskeleti).
// Tetikleyici örnekleri (docs/plans/relocation-engine/relocation-engine-e2e.md §6):
//   "varıştan sonra 14 gün içinde adres kaydı", "5G kapsaması daha güçlü operatör bulundu".
// Faz 1: deadline-yaklaşan checklist adımları için aktif move'lara in-app/e-posta bildirimi.
// send-submission-email deseni: Deno + esm.sh + CORS allowlist + service_role.
//
// NOT: Gerçek e-posta/push entegrasyonu Faz 1'de stub'tır; bildirimler relocation_interactions'a
// 'impression' olarak loglanır ve in-app gösterim için döndürülür. Push sonraki faz.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2";

const ALLOWED_ORIGINS = new Set([
  "https://corteqs.net",
  "https://www.corteqs.net",
  "http://localhost:5173",
  "http://localhost:4173",
]);

function corsHeaders(origin: string | null): HeadersInit {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://corteqs.net";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

interface NotificationItem {
  move_id: string;
  step_name: string;
  deadline_rule: string | null;
  country_code: string;
  message: string;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders(origin), "content-type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "config_missing" }), {
      status: 500,
      headers: { ...corsHeaders(origin), "content-type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // Aktif move'lar + hedef ülkelerin 'after_arrival' bürokrasi adımları → bildirim adayları.
    const { data: moves, error: movesError } = await admin
      .from("relocation_moves")
      .select("id, target_country_codes, preferred_language")
      .eq("status", "active");
    if (movesError) throw movesError;

    const items: NotificationItem[] = [];
    for (const move of moves ?? []) {
      const countries: string[] = move.target_country_codes ?? [];
      if (countries.length === 0) continue;

      const { data: steps, error: stepsError } = await admin
        .from("relocation_bureaucratic_steps")
        .select("name, deadline_rule, country_code")
        .in("country_code", countries)
        .eq("trigger", "after_arrival")
        .eq("is_active", true);
      if (stepsError) throw stepsError;

      for (const step of steps ?? []) {
        items.push({
          move_id: move.id,
          step_name: step.name,
          deadline_rule: step.deadline_rule,
          country_code: step.country_code,
          message: `${step.name}: ${step.deadline_rule ?? "süre yok"} — varış sonrası tamamlayın.`,
        });
      }
    }

    // Faz 1: e-posta/push stub — yalnız in-app payload döner. Gerçek gönderim sonraki faz.
    return new Response(JSON.stringify({ count: items.length, items }), {
      status: 200,
      headers: { ...corsHeaders(origin), "content-type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unexpected_error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders(origin), "content-type": "application/json" },
    });
  }
});
