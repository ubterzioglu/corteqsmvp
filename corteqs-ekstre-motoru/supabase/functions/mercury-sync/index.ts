// POST /functions/v1/mercury-sync        (pg_cron ile saatlik ya da admin'den "Şimdi senkronla")
// Gövde (opsiyonel): { since?: "YYYY-MM-DD", dry_run?: boolean }
//
// Akış: Mercury API -> ham işlemler -> motor (otomatik mod) -> statement_lines
//       -> varsayılan: tüm satırlar admin'de "İnceleme bekliyor" olarak görünür, onaydan sonra CorteQS muhasebesine girer.
//       -> accounting_settings.mercury_auto_commit = true yapılırsa: kural eşleşen + auto_commit açık +
//          mükerrer olmayan satırlar commit_statement_lines ile doğrudan expenses'a girer.
// Clemta ayrıca kendi Mercury bağlantısıyla muhasebeleştirir; bu fonksiyon bizim kendi defterimizi tutar.
//
// Gerekli sırlar: MERCURY_API_TOKEN  (Mercury > Settings > API Tokens, "Read only" yeterli)
// Opsiyonel:     MERCURY_ACCOUNT_IDS (virgülle; yoksa tüm hesaplar), CRON_SECRET
import { mercuryToRaw, type MercuryTx } from "../_shared/engine/index.ts";
import { cors, env, HttpError, json, processAndStore, requireAdmin, serviceClient } from "../_shared/context.ts";

const API = "https://api.mercury.com/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    await requireAdmin(req);
    const token = env("MERCURY_API_TOKEN");
    if (!token) throw new HttpError(400, "MERCURY_API_TOKEN tanımlı değil");
    const body = await req.json().catch(() => ({}));
    const db = serviceClient();
    const h = { authorization: `Bearer ${token}`, accept: "application/json" };

    // hesaplar
    let accounts: { id: string; name?: string }[];
    const ids = env("MERCURY_ACCOUNT_IDS")?.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids?.length) accounts = ids.map((id) => ({ id }));
    else {
      const r = await fetch(`${API}/accounts`, { headers: h });
      if (!r.ok) throw new Error(`Mercury hesapları alınamadı: ${r.status} ${await r.text()}`);
      accounts = (await r.json()).accounts ?? [];
    }

    const results: any[] = [];
    for (const acc of accounts) {
      const { data: state } = await db.from("mercury_sync_state").select("*").eq("account_id", acc.id).maybeSingle();
      // Bekleyen işlemler sonradan kesinleştiği için 7 gün geriden başla; mükerrerler parmak iziyle elenir.
      const since = body.since ?? (state?.last_txn_date ? shift(state.last_txn_date, -7) : shift(today(), -60));

      const txs: MercuryTx[] = [];
      for (let offset = 0; ; offset += 500) {
        const u = new URL(`${API}/account/${acc.id}/transactions`);
        u.searchParams.set("start", since); u.searchParams.set("limit", "500"); u.searchParams.set("offset", String(offset)); u.searchParams.set("order", "asc");
        const r = await fetch(u, { headers: h });
        if (!r.ok) throw new Error(`Mercury işlemleri alınamadı (${acc.id}): ${r.status} ${await r.text()}`);
        const page = (await r.json()).transactions ?? [];
        txs.push(...page);
        if (page.length < 500) break;
      }

      const raw = mercuryToRaw(txs);
      if (!raw.length) { results.push({ account: acc.id, fetched: txs.length, lines: 0 }); continue; }

      const { data: imp, error } = await db.from("statement_imports").insert({
        source: "mercury", bank: "Mercury", file_name: `Mercury ${acc.name ?? acc.id} · ${since} →`, status: "parsing", provider: "mercury_api",
      }).select().single();
      if (error) throw new Error(error.message);

      const { lines, summary, settings } = await processAndStore(db, imp.id, raw, { autoCommitMode: true, fallbackPaymentMethod: "sanal_kart_burak", keepDuplicates: false });
      const fresh = lines.filter((l) => !l.flags.includes("mukerrer"));
      if (!fresh.length) {
        await db.from("statement_imports").delete().eq("id", imp.id); // yeni bir şey yoksa boş import bırakma
      } else {
        await db.from("statement_imports").update({ status: "ready", summary, period_start: since, period_end: today() }).eq("id", imp.id);
        let commit = null;
        if (settings.mercury_auto_commit && !body.dry_run && fresh.some((l) => l.decision === "import")) {
          const { data: ids } = await db.from("statement_lines").select("id").eq("import_id", imp.id).eq("decision", "import").eq("status", "pending");
          const { data, error: cErr } = await db.rpc("commit_statement_lines", { p_import_id: imp.id, p_line_ids: (ids ?? []).map((x) => x.id) });
          if (cErr) throw new Error("Otomatik aktarım hatası: " + cErr.message);
          commit = data;
        }
        results.push({ account: acc.id, import_id: imp.id, fetched: txs.length, new_lines: fresh.length, auto_committed: commit, review: fresh.filter((l) => l.decision === "review").length });
      }

      const lastDate = txs.map((t) => (t.postedAt ?? t.createdAt).slice(0, 10)).sort().at(-1) ?? state?.last_txn_date ?? null;
      await db.from("mercury_sync_state").upsert({ account_id: acc.id, account_name: acc.name ?? null, last_synced_at: new Date().toISOString(), last_txn_date: lastDate, last_result: results.at(-1) ?? null });
    }
    return json({ ok: true, results });
  } catch (e: any) {
    return json({ ok: false, error: String(e?.message ?? e) }, e instanceof HttpError ? e.status : 500);
  }
});

const today = () => new Date().toISOString().slice(0, 10);
function shift(d: string, days: number) { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + days); return x.toISOString().slice(0, 10); }
