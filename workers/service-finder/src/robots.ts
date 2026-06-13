/**
 * robots.txt değerlendirmesi — ekstraksiyondan ÖNCE zorunlu (scrapper_plan.md
 * §Security). Engelleme opsiyonel değildir; karar service_finder_job_sources'a
 * crawl_allowed / blocked_robots olarak yazılır.
 *
 * Basit, korumacı bir parser: "User-agent: *" grubundaki Disallow/Allow prefix
 * kuralları uygulanır; en uzun eşleşen prefix kazanır (Google semantiği).
 * robots.txt alınamazsa (ağ hatası) korumacı davranıp izin VERİLİR yalnızca
 * 404/410 durumunda; 401/403 veya diğer hatalarda engellenmiş sayılır.
 */

interface RobotsRules {
  allows: string[];
  disallows: string[];
}

const cache = new Map<string, RobotsRules | "unavailable_blocked" | "unavailable_open">();

const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT = "CorteQS-ServiceFinder/1.0 (+https://corteqs.net)";

function parseRobots(content: string): RobotsRules {
  const rules: RobotsRules = { allows: [], disallows: [] };
  let inStarGroup = false;
  let groupHasDirectives = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      if (inStarGroup && groupHasDirectives) {
        // Yeni grup başlıyor; * grubumuz bitti.
        inStarGroup = value === "*" ? true : false;
        groupHasDirectives = false;
      } else {
        if (value === "*") inStarGroup = true;
        else if (groupHasDirectives === false && inStarGroup === false) inStarGroup = false;
      }
      continue;
    }

    if (!inStarGroup) continue;
    if (field === "disallow") {
      groupHasDirectives = true;
      if (value) rules.disallows.push(value);
    } else if (field === "allow") {
      groupHasDirectives = true;
      if (value) rules.allows.push(value);
    }
  }
  return rules;
}

function pathMatches(path: string, rulePrefix: string): boolean {
  // '*' joker ve '$' satır sonu desteği (yaygın kullanım için yeterli).
  if (!rulePrefix.includes("*") && !rulePrefix.endsWith("$")) {
    return path.startsWith(rulePrefix);
  }
  const escaped = rulePrefix
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\\\$$/, "$");
  try {
    return new RegExp(`^${escaped}`).test(path);
  } catch {
    return path.startsWith(rulePrefix.replace(/[*$]/g, ""));
  }
}

function evaluateRules(rules: RobotsRules, path: string): boolean {
  let bestAllow = -1;
  let bestDisallow = -1;
  for (const rule of rules.allows) {
    if (pathMatches(path, rule)) bestAllow = Math.max(bestAllow, rule.length);
  }
  for (const rule of rules.disallows) {
    if (pathMatches(path, rule)) bestDisallow = Math.max(bestDisallow, rule.length);
  }
  if (bestDisallow === -1) return true;
  return bestAllow >= bestDisallow;
}

export async function isRobotsAllowed(targetUrl: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return false;
  }
  const origin = parsed.origin;

  let entry = cache.get(origin);
  if (entry === undefined) {
    entry = await fetchRobots(origin);
    cache.set(origin, entry);
  }

  if (entry === "unavailable_open") return true;
  if (entry === "unavailable_blocked") return false;
  return evaluateRules(entry, parsed.pathname + parsed.search);
}

async function fetchRobots(
  origin: string,
): Promise<RobotsRules | "unavailable_blocked" | "unavailable_open"> {
  try {
    const response = await fetch(`${origin}/robots.txt`, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (response.status === 404 || response.status === 410) return "unavailable_open";
    if (!response.ok) return "unavailable_blocked";
    const text = await response.text();
    return parseRobots(text);
  } catch {
    return "unavailable_blocked";
  }
}

/** Test izolasyonu için. */
export function clearRobotsCache(): void {
  cache.clear();
}
