import type { ProfessionTemplate, ServiceFinderJob } from "./schemas.js";

/**
 * İş + şablondan arama sorguları üretir (scrapper_plan.md §Worker pseudocode).
 * Sıra: job.seed_queries > şablon query_templates ({{city}} vb. doldurulur)
 * > yerleşik varsayılan kalıplar. max_queries ile sınırlanır, tekilleştirilir.
 */

const DEFAULT_PATTERNS = [
  "{{language_term}} {{profession}} {{location}}",
  "{{profession}} {{location}} {{language_term}}",
];

/**
 * Şablonlar birden fazla dilde kalıp içerebilir (ör. healthcare-doctor Almanya
 * bağlamı için yazıldığından Almanca kalıplar taşır — "türkischer Arzt Dortmund"
 * job.country_code=DE iken doğrudur, çünkü hedef Almanya'daki Türkçe konuşanlardır).
 * job.country_code Almanya DEĞİLSE (ör. Doha/QA) bu Almanca kalıplar anlamsızdır
 * ve sorgu bütçesini israf eder — bu durumda eleriz.
 */
const GERMAN_MARKERS = /[äöüß]|\btürkische\b|\bärzte\b|\bpraxis\b|\bstellenangebot\b/i;

function isGermanPattern(pattern: string): boolean {
  return GERMAN_MARKERS.test(pattern);
}

function filterPatternsByCountry(patterns: string[], job: ServiceFinderJob): string[] {
  const countryCode = job.country_code?.toUpperCase();
  if (!countryCode || countryCode === "DE") return patterns;
  const filtered = patterns.filter((pattern) => !isGermanPattern(pattern));
  // Filtre hiçbir kalıp bırakmazsa (şablon yalnızca Almanca kalıplardan oluşuyorsa)
  // tüm kalıplara geri dön — sessizce sıfır sorgu üretmek yerine.
  return filtered.length > 0 ? filtered : patterns;
}

function fillTemplate(template: string, job: ServiceFinderJob, professionLabel: string, languageTerm: string): string {
  return template
    .replace(/\{\{\s*city\s*\}\}/g, job.city ?? job.location_label)
    .replace(/\{\{\s*region\s*\}\}/g, job.region ?? "")
    .replace(/\{\{\s*country\s*\}\}/g, job.country_code ?? "")
    .replace(/\{\{\s*location(_label)?\s*\}\}/g, job.location_label)
    .replace(/\{\{\s*location\s*\}\}/g, job.location_label)
    .replace(/\{\{\s*profession\s*\}\}/g, professionLabel)
    .replace(/\{\{\s*language_term\s*\}\}/g, languageTerm)
    .replace(/\{\{\s*topic\s*\}\}/g, job.freeform_topic ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

export function buildQueries(job: ServiceFinderJob, template: ProfessionTemplate | null): string[] {
  const professionLabel = template?.label ?? job.freeform_topic ?? job.role_key;
  const languageTerms = template?.language_terms?.length
    ? template.language_terms
    : ["Türkçe", "Türk", "Turkish speaking"];

  const queries: string[] = [];

  for (const seed of asStringArray(job.seed_queries)) {
    queries.push(fillTemplate(seed, job, professionLabel, languageTerms[0] ?? "Türkçe"));
  }

  const templatePatterns = asStringArray(template?.query_templates);
  const rawPatterns = templatePatterns.length > 0 ? templatePatterns : DEFAULT_PATTERNS;
  const patterns = filterPatternsByCountry(rawPatterns, job);
  for (const pattern of patterns) {
    for (const languageTerm of languageTerms) {
      queries.push(fillTemplate(pattern, job, professionLabel, languageTerm));
      if (queries.length >= job.max_queries * 2) break;
    }
    if (queries.length >= job.max_queries * 2) break;
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const query of queries) {
    const key = query.toLowerCase();
    if (!query || seen.has(key)) continue;
    seen.add(key);
    unique.push(query);
    if (unique.length >= job.max_queries) break;
  }
  return unique;
}
