import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function parseEnvFile(envFilePath) {
  const envText = fs.readFileSync(envFilePath, "utf-8");
  const env = {};

  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex < 0) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

function parseCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  const headerLine = lines[0] ?? "";
  const headers = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < headerLine.length; i += 1) {
    const char = headerLine[i];
    const next = headerLine[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      headers.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  headers.push(current);

  return lines.slice(1).map((line) => {
    const values = [];
    let chunk = "";
    let quoted = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];

      if (char === "\"") {
        if (quoted && next === "\"") {
          chunk += "\"";
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === "," && !quoted) {
        values.push(chunk);
        chunk = "";
      } else {
        chunk += char;
      }
    }
    values.push(chunk);

    const row = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    return row;
  });
}

function toBoolean(value) {
  const normalized = (value ?? "").toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

function nullIfEmpty(value) {
  const normalized = (value ?? "").trim();
  return normalized === "" ? null : normalized;
}

function toNumberOrNull(value) {
  const normalized = nullIfEmpty(value);
  if (normalized === null) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const csvPath = path.join(process.cwd(), "filesnew.csv");

  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local dosyası bulunamadı.");
  }

  if (!fs.existsSync(csvPath)) {
    throw new Error("filesnew.csv dosyası bulunamadı.");
  }

  const env = parseEnvFile(envPath);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL veya service role key eksik.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(csvContent).filter((row) => row.order_no);
  const batchId = new Date().toISOString().replace(/[:.]/g, "-");

  const payload = rows.map((row) => {
    const section = nullIfEmpty(row.bolum) ?? "Genel";
    const subsection = nullIfEmpty(row.alt_bolum) ?? "Genel";
    return {
      order_no: toNumberOrNull(row.order_no),
      slug: nullIfEmpty(row.slug),
      section,
      subsection,
      department: section,
      record_kind: nullIfEmpty(row.kayit_turu) ?? "Link",
      added_by: nullIfEmpty(row.ekleyen) ?? "UBT",
      title: nullIfEmpty(row.baslik) ?? "Başlık yok",
      description: nullIfEmpty(row.aciklama),
      url: nullIfEmpty(row.url),
      file_id: nullIfEmpty(row.file_id),
      file_type: nullIfEmpty(row.dosya_tipi),
      mime_type: nullIfEmpty(row.mime_type),
      privacy_level: nullIfEmpty(row.gizlilik),
      is_public_import: toBoolean(row.public_import),
      import_suggestion: nullIfEmpty(row.import_onerisi),
      tags: nullIfEmpty(row.etiketler),
      source_path: nullIfEmpty(row.source_path),
      status: nullIfEmpty(row.status),
      source_folder: nullIfEmpty(row.source_path),
      source_subfolder: subsection,
      source_snapshot_date: null,
    };
  });

  const { count: beforeCount, error: beforeError } = await supabase
    .from("resource_entries")
    .select("*", { count: "exact", head: true });

  if (beforeError) throw beforeError;

  console.log(`Öncesi kayıt sayısı: ${beforeCount ?? 0}`);

  const { data, error } = await supabase.rpc("admin_replace_resource_entries_from_csv", {
    payload,
    expected_count: payload.length,
    batch_id: batchId,
  });

  if (error) throw error;

  const insertedCount = Array.isArray(data) && data.length > 0 ? data[0]?.inserted_count ?? 0 : 0;
  console.log(`RPC inserted_count: ${insertedCount}`);

  const { count: afterCount, error: afterError } = await supabase
    .from("resource_entries")
    .select("*", { count: "exact", head: true });

  if (afterError) throw afterError;

  console.log(`Sonrası kayıt sayısı: ${afterCount}`);

  const sectionSummary = new Map();
  for (const item of payload) {
    const key = `${item.section} | ${item.subsection}`;
    sectionSummary.set(key, (sectionSummary.get(key) ?? 0) + 1);
  }

  console.log(`Batch ID: ${batchId}`);
  console.log("İlk 20 bölüm/alt bölüm dağılımı:");
  Array.from(sectionSummary.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([key, count]) => {
      console.log(`- ${key}: ${count}`);
    });
}

main().catch((error) => {
  console.error("Import başarısız:", error.message);
  process.exit(1);
});
