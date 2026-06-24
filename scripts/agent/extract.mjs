// Tool-yüzeyi çıkarıcıları — kaynak dosya metninden makinece-okunabilir
// tool metadata türetir. Hafif regex/satır tarama; ağır TS AST kurulmaz.
// Her çıkarıcı, tek bir "tool" nesnesi (veya nesne dizisi) döndürür.

const SUPABASE_IMPORT_RE =
  /@supabase\/supabase-js@([0-9]+\.[0-9]+\.[0-9]+)/;
const ZOD_PIN_RE = /zod@([0-9]+\.[0-9]+\.[0-9]+)/;

/**
 * `.from("table")` ve `.rpc("name")` çağrılarını çıkarır.
 * @param {string} source
 * @returns {{ tables: string[], rpcs: string[] }}
 */
export function extractDataAccess(source) {
  const tables = new Set();
  const rpcs = new Set();
  for (const m of source.matchAll(/\.from\(\s*["'`]([a-zA-Z0-9_.]+)["'`]/g)) {
    tables.add(m[1]);
  }
  for (const m of source.matchAll(/\.rpc\(\s*["'`]([a-zA-Z0-9_]+)["'`]/g)) {
    rpcs.add(m[1]);
  }
  return { tables: [...tables].sort(), rpcs: [...rpcs].sort() };
}

/**
 * `RATE_LIMIT_*` / `MAX_BODY_BYTES` gibi sayısal sabitleri çıkarır.
 * @param {string} source
 * @returns {Record<string, number>}
 */
export function extractLimits(source) {
  const out = {};
  const re =
    /(?:const\s+)?(RATE_LIMIT_[A-Z_]+|MAX_BODY_BYTES|MIN_SUBMIT_SECONDS)\s*=\s*([0-9_]+)/g;
  for (const m of source.matchAll(re)) {
    out[m[1]] = Number(m[2].replace(/_/g, ""));
  }
  return out;
}

/**
 * En üstteki `z.object({ ... })` bloğunu kaba biçimde yakalar (request şeması ipucu).
 * Tam parse değil — alanların var olup olmadığını ve adlarını verir.
 * @param {string} source
 * @returns {{ present: boolean, fields: string[] }}
 */
export function extractZodRequest(source) {
  const idx = source.search(/RequestSchema\s*=\s*z\.object\(/);
  if (idx === -1) {
    const hasAnyZod = /z\.object\(/.test(source);
    return { present: hasAnyZod, fields: [] };
  }
  // RequestSchema bloğunun gövdesini dengeli paranteze kadar al.
  const start = source.indexOf("z.object(", idx);
  let depth = 0;
  let body = "";
  for (let i = source.indexOf("{", start); i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) break;
    }
    if (depth >= 1) body += ch;
  }
  const fields = [...body.matchAll(/^\s*([a-zA-Z0-9_]+)\s*:/gm)].map((m) => m[1]);
  return { present: true, fields: [...new Set(fields)] };
}

/**
 * Edge function dosyasında dönen HTTP status kodlarını çıkarır.
 * jsonResponse(..., NNN, ...) / json(..., NNN) / status: NNN / , NNN, kalıpları.
 * @param {string} source
 * @returns {number[]} Artan sıralı benzersiz status kodları.
 */
export function extractHttpStatuses(source) {
  const codes = new Set();
  // jsonResponse({...}, 200, ...) veya json({...}, 429)
  for (const m of source.matchAll(/(?:jsonResponse|json)\s*\([^)]*?,\s*(\d{3})\b/g)) {
    codes.add(Number(m[1]));
  }
  // status: 410 / { status: 201 }
  for (const m of source.matchAll(/\bstatus:\s*(\d{3})\b/g)) {
    codes.add(Number(m[1]));
  }
  return [...codes].filter((c) => c >= 200 && c < 600).sort((a, b) => a - b);
}

/**
 * Bir edge function dosyasından tool nesnesi çıkarır.
 * @param {string} relPath supabase/functions/<name>/index.ts
 * @param {string} source
 * @returns {object}
 */
export function extractEdgeTool(relPath, source) {
  const name = relPath.split("/")[2]; // supabase/functions/<name>/index.ts
  const supaPin = source.match(SUPABASE_IMPORT_RE)?.[1] ?? null;
  const zodPin = source.match(ZOD_PIN_RE)?.[1] ?? null;
  const deprecated =
    /\b410\b/.test(source) && /Deprecated/i.test(source);
  const usesZod = /from\s+["']https:\/\/esm\.sh\/zod/.test(source) || /z\.object\(/.test(source);
  const { tables, rpcs } = extractDataAccess(source);
  const request = extractZodRequest(source);
  const dependencies = [];
  if (supaPin) dependencies.push(`@supabase/supabase-js@${supaPin}`);
  if (zodPin) dependencies.push(`zod@${zodPin}`);
  if (/esm\.sh\/resend/i.test(source) || /\bResend\b/.test(source)) dependencies.push("resend");
  if (/gemini/i.test(source)) dependencies.push("gemini");

  return {
    tool_key: `edge.${name.replace(/-/g, "_")}`,
    tool_name: name,
    family: "edge_function",
    status: deprecated ? "deprecated" : "active",
    entrypoint: relPath,
    interface_kind: "http",
    input_schema: {
      validation: usesZod ? "zod" : "manual",
      fields: request.fields,
    },
    tables_read_write: tables,
    rpcs,
    limits: extractLimits(source),
    http_statuses: extractHttpStatuses(source),
    http_method: /OPTIONS/.test(source) ? "POST" : "POST",
    dependencies,
    version_pins: { "@supabase/supabase-js": supaPin, zod: zodPin },
    evidence_path: relPath,
  };
}

/**
 * Bir worker package.json'undan tool nesnesi çıkarır.
 * @param {string} relPath workers/<name>/package.json
 * @param {string} pkgJsonText
 * @param {string} entrySource workers/<name>/src/index.ts içeriği (varsa "")
 * @returns {object}
 */
export function extractWorkerTool(relPath, pkgJsonText, entrySource) {
  const name = relPath.split("/")[1];
  let pkg = {};
  try {
    pkg = JSON.parse(pkgJsonText);
  } catch {
    pkg = {};
  }
  const { tables, rpcs } = extractDataAccess(entrySource ?? "");
  return {
    tool_key: `worker.${name.replace(/-/g, "_")}`,
    tool_name: pkg.name ?? name,
    family: "worker",
    status: "active",
    entrypoint: `workers/${name}/`,
    interface_kind: "cli",
    description: pkg.description ?? null,
    node_engine: pkg.engines?.node ?? null,
    tables_read_write: tables,
    rpcs,
    dependencies: Object.entries(pkg.dependencies ?? {}).map(
      ([k, v]) => `${k}@${v}`,
    ),
    version_pins: {
      "@supabase/supabase-js": pkg.dependencies?.["@supabase/supabase-js"] ?? null,
      zod: pkg.dependencies?.zod ?? null,
    },
    evidence_path: relPath,
  };
}

/**
 * Bir src/lib/*-api.ts modülünden tool nesnesi çıkarır.
 * @param {string} relPath
 * @param {string} source
 * @returns {object}
 */
export function extractLibTool(relPath, source) {
  const base = relPath.split("/").pop().replace(/\.ts$/, "");
  const exports = [
    ...source.matchAll(/export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)/g),
  ].map((m) => m[1]);
  const constExports = [
    ...source.matchAll(/export\s+const\s+([a-zA-Z0-9_]+)\s*=/g),
  ].map((m) => m[1]);
  const { tables, rpcs } = extractDataAccess(source);
  return {
    tool_key: `module.${base.replace(/-/g, "_")}`,
    tool_name: base,
    family: "ui_module",
    status: "active",
    entrypoint: relPath,
    interface_kind: "internal_api",
    exports: [...new Set([...exports, ...constExports])].sort(),
    tables_read_write: tables,
    rpcs,
    evidence_path: relPath,
  };
}

/**
 * package.json script yüzeyinden CLI tool nesnesi çıkarır.
 * @param {Record<string, string>} scripts
 * @returns {object}
 */
export function extractScriptTool(scripts) {
  return {
    tool_key: "cli.npm_scripts",
    tool_name: "npm scripts",
    family: "script",
    status: "active",
    entrypoint: "package.json",
    interface_kind: "cli",
    commands: Object.keys(scripts ?? {}).sort(),
    evidence_path: "package.json",
  };
}
