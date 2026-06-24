// Deklaratif drift kuralları. Her kural saf bir fonksiyondur:
//   (ctx) => Array<Finding>
// ctx şu yardımcıları sağlar:
//   ctx.read(relPath)      → dosya içeriği (yoksa "")
//   ctx.pkg                → ayrıştırılmış package.json nesnesi
//   ctx.catalog            → docs/agent/tools.json içeriği (varsa null)
// Finding: { rule, severity, message, evidence: [{path, line?}] }
//
// Sihir yok — her kural "X dosyasında A varsa Y dosyasında B olmalı" biçiminde.
// Yeni drift bulundukça buraya kural eklenir.

function majorMinor(semver) {
  const m = String(semver).replace(/^[^0-9]*/, "").match(/^(\d+)\.(\d+)/);
  return m ? { major: Number(m[1]), minor: Number(m[2]) } : null;
}

function lineOf(source, needle) {
  const idx = source.split("\n").findIndex((l) => l.includes(needle));
  return idx === -1 ? undefined : idx + 1;
}

// 1) react-router-dom: package.json pin'i ile doküman metni uyumlu mu.
function ruleRouterVersion(ctx) {
  const findings = [];
  const pinned = ctx.pkg?.dependencies?.["react-router-dom"];
  if (!pinned) return findings;
  const pinMm = majorMinor(pinned);
  const docs = ["AGENT_CONTEXT.md", "ARCHITECTURE.md"];
  for (const doc of docs) {
    const src = ctx.read(doc);
    const m = src.match(/react-router-dom[^\d]*(\d+)(?:\.(\d+))?/i);
    if (!m) continue;
    const docMajor = Number(m[1]);
    if (pinMm && docMajor !== pinMm.major) {
      findings.push({
        rule: "router-version-drift",
        severity: "high",
        message: `package.json react-router-dom ${pinned} (major ${pinMm.major}) ama ${doc} "${m[0]}" (major ${docMajor}) diyor.`,
        evidence: [
          { path: "package.json" },
          { path: doc, line: lineOf(src, m[0]) },
        ],
      });
    }
  }
  return findings;
}

// 2) @supabase/supabase-js: frontend pin'i ile edge/worker pin'leri arası major/minor farkı.
function ruleSupabaseJsDrift(ctx) {
  const findings = [];
  const frontend = ctx.pkg?.dependencies?.["@supabase/supabase-js"];
  const fMm = frontend ? majorMinor(frontend) : null;
  if (!fMm || !ctx.catalog) return findings;

  const pins = new Map(); // version → [tool_key]
  for (const tool of ctx.catalog.tools) {
    const v = tool.version_pins?.["@supabase/supabase-js"];
    if (!v) continue;
    const key = String(v).replace(/^[\^~]/, "");
    if (!pins.has(key)) pins.set(key, []);
    pins.get(key).push(tool.tool_key);
  }
  for (const [version, tools] of pins) {
    const mm = majorMinor(version);
    if (!mm) continue;
    // minor farkı > 30 ise (ör. 2.45 vs 2.101) uyumsuzluk riski yüksek.
    const minorGap = Math.abs((mm.major * 1000 + mm.minor) - (fMm.major * 1000 + fMm.minor));
    if (minorGap >= 30) {
      findings.push({
        rule: "supabase-js-version-drift",
        severity: "medium",
        message: `@supabase/supabase-js frontend ${frontend} iken ${tools.join(", ")} ${version} pinli (minor farkı ${minorGap}). SDK davranış/type drift riski.`,
        evidence: [{ path: "package.json" }, ...tools.map((t) => ({ path: t }))],
      });
    }
  }
  return findings;
}

// 3) README hâlâ DROP edilmiş public.admin_users tablosunu anlatıyor mu.
function ruleAdminUsersDropped(ctx) {
  const readme = ctx.read("README.md");
  if (!/public\.admin_users/.test(readme)) return [];
  // README admin_users'ı sadece "kaldırıldı/dropped/legacy" bağlamında anıyorsa
  // bu drift değil, doğru tarihsel referanstır.
  const mentionsDrop =
    /admin_users[^.\n]*\b(dropped|drop|removed|legacy|no longer|kaldır)/i.test(readme) ||
    /\b(dropped|removed|legacy|no longer|kaldır)\b[^.\n]*admin_users/i.test(readme);
  if (mentionsDrop) return [];
  const claude = ctx.read("CLAUDE.md");
  // CLAUDE.md admin_users'ın DROP edildiğini söylüyorsa README drift'tedir.
  if (/admin_users.*(DROP|drop|kaldır)/.test(claude) || /DROPPED/.test(claude)) {
    return [
      {
        rule: "admin-users-dropped",
        severity: "high",
        message:
          "README.md `public.admin_users` tablosunu anlatıyor ama CLAUDE.md bu tablonun DROP edildiğini (user_role_assignments + is_admin() RPC) söylüyor.",
        evidence: [
          { path: "README.md", line: lineOf(readme, "public.admin_users") },
          { path: "CLAUDE.md" },
        ],
      },
    ];
  }
  return [];
}

// 4) Deprecated edge function (410 dönen) hâlâ doküman/README'de "deploy/aktif" gibi anılıyor mu.
function ruleDeprecatedEdgeStillReferenced(ctx) {
  if (!ctx.catalog) return [];
  const findings = [];
  const deprecated = ctx.catalog.tools.filter(
    (t) => t.family === "edge_function" && t.status === "deprecated",
  );
  const readme = ctx.read("README.md");
  for (const tool of deprecated) {
    const name = tool.tool_name;
    if (new RegExp(`functions deploy ${name}\\b`).test(readme)) {
      findings.push({
        rule: "deprecated-edge-referenced",
        severity: "high",
        message: `Edge function "${name}" deprecated (410) ama README.md hâlâ "supabase functions deploy ${name}" diyor.`,
        evidence: [
          { path: "README.md", line: lineOf(readme, `deploy ${name}`) },
          { path: tool.entrypoint },
        ],
      });
    }
  }
  return findings;
}

export const driftRules = [
  ruleRouterVersion,
  ruleSupabaseJsDrift,
  ruleAdminUsersDropped,
  ruleDeprecatedEdgeStillReferenced,
];
