// POST /functions/v1/statement-parse
// Gövde: { import_id: string }            -> daha önce yüklenmiş dosyayı (yeniden) işler
//    ya: { file_path: string, file_name?: string }  -> storage'daki dosya için import oluşturur ve işler
// Dosya türleri: PDF (yapay zekâ ile okunur) · CSV (Drive "TEKNOLOJİ HARCAMALARI" dışa aktarımı) · JSON (Gemini çıktısı)
import { extractFromPdf, parseDriveSheetCsv, sanitize } from "../_shared/engine/index.ts";
import { cors, env, HttpError, json, processAndStore, requireAdmin, serviceClient } from "../_shared/context.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = serviceClient();
  let importId: string | null = null;
  try {
    const { userId } = await requireAdmin(req);
    const body = await req.json();

    // 1) import kaydı
    let imp: any;
    if (body.import_id) {
      const { data, error } = await db.from("statement_imports").select("*").eq("id", body.import_id).single();
      if (error || !data) throw new HttpError(404, "Import bulunamadı");
      imp = data;
    } else if (body.file_path) {
      const ext = String(body.file_path).split(".").pop()?.toLowerCase();
      const { data, error } = await db.from("statement_imports").insert({
        source: ext === "csv" ? "sheet_csv" : "pdf_statement",
        file_path: body.file_path, file_name: body.file_name ?? body.file_path.split("/").pop(), created_by: userId, status: "uploaded",
      }).select().single();
      if (error) throw new Error(error.message);
      imp = data;
    } else throw new HttpError(400, "import_id veya file_path gerekli");
    importId = imp.id;
    if (["committed"].includes(imp.status)) throw new HttpError(409, "Bu ekstre zaten muhasebeleştirildi. Önce geri alın.");

    await db.from("statement_imports").update({ status: "parsing", error: null }).eq("id", imp.id);

    // 2) dosyayı indir
    const { data: file, error: dlErr } = await db.storage.from("statements").download(imp.file_path);
    if (dlErr || !file) throw new Error("Dosya indirilemedi: " + dlErr?.message);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");

    // aynı dosya daha önce yüklendiyse uyar
    const { data: same } = await db.from("statement_imports").select("id, created_at, status").eq("file_sha256", hash).neq("id", imp.id).neq("status", "failed").maybeSingle();
    if (same) {
      await db.from("statement_imports").update({ status: "failed", error: `Bu dosya ${same.created_at.slice(0, 10)} tarihinde zaten yüklenmiş (import ${same.id}).` }).eq("id", imp.id);
      return json({ ok: false, duplicate_of: same.id, error: "Bu dosya daha önce yüklenmiş" }, 409);
    }

    // 3) ayrıştır (yeniden işlemede, ham satırlar varsa yapay zekâ tekrar çağrılmaz)
    const name = (imp.file_name ?? imp.file_path).toLowerCase();
    let raw, meta: any = {}, warnings: string[] = [], provider: string | null = null;
    if (imp.raw_lines && !body.re_extract) {
      raw = imp.raw_lines; meta = imp.meta ?? {}; warnings = imp.warnings ?? []; provider = imp.provider;
    } else if (name.endsWith(".csv")) {
      raw = parseDriveSheetCsv(new TextDecoder().decode(bytes), { corteqsPerson: null });
      provider = "csv";
    } else if (name.endsWith(".json")) {
      const r = sanitize(JSON.parse(new TextDecoder().decode(bytes)));
      raw = r.lines; meta = r.meta; warnings = r.warnings; provider = "json";
    } else {
      const r = await extractFromPdf(toBase64(bytes), env);
      raw = r.lines; meta = r.meta; warnings = r.warnings; provider = r.provider;
    }

    // 4) motor + kayıt
    const { lines, summary } = await processAndStore(db, imp.id, raw);

    await db.from("statement_imports").update({
      status: "ready", provider, meta, warnings, summary, file_sha256: hash, raw_lines: raw,
      bank: meta.bank ?? null, period_start: meta.period_start ?? null, period_end: meta.period_end ?? null,
      statement_date: meta.statement_date ?? null,
      card_last4s: [...new Set(lines.map((l) => l.card_last4).filter(Boolean))],
    }).eq("id", imp.id);

    return json({ ok: true, import_id: imp.id, summary, warnings });
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    if (importId && status >= 500) await db.from("statement_imports").update({ status: "failed", error: String(e?.message ?? e) }).eq("id", importId);
    return json({ ok: false, error: String(e?.message ?? e) }, status);
  }
});

function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
