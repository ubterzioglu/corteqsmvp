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
  const patterns = templatePatterns.length > 0 ? templatePatterns : DEFAULT_PATTERNS;
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
