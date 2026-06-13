import type { ServiceFinderJob, JobSourceRow } from "./schemas.js";

/**
 * Sınıflandırıcı promptu ve Gemini response şeması (scrapper_plan.md §Classifier).
 * Şema değişirse schemas.ts içindeki Zod şeması da güncellenmelidir (ayna sözleşme).
 */

export const CLASSIFIER_SYSTEM_PROMPT = `You are a high-precision directory normalizer for Turkish/Turkish-speaking service discovery.
Return JSON only. Do not include markdown, prose, or explanations.
If the page is not a real service provider profile, return:
{
  "is_match": false,
  "match_reason": "...",
  "confidence_score": 0,
  "canonical_name": null,
  "organization_name": null,
  "profession_label": null,
  "role_key": null,
  "item_type": null,
  "category_slug": null,
  "city": null,
  "country_code": null,
  "languages": [],
  "services": [],
  "contacts": [],
  "website_url": null,
  "appointment_url": null,
  "evidence_quotes": []
}`;

const MAX_EXTRACTED_CHARS = 16_000;

export function buildClassifierUserPrompt(job: ServiceFinderJob, source: JobSourceRow): string {
  const extracted = (source.extracted_text ?? "").slice(0, MAX_EXTRACTED_CHARS);
  return `Job context:
- role_key: ${job.role_key}
- item_type: ${job.item_type}
- category_slug: ${job.category_slug ?? ""}
- target location: ${job.location_label}
- include terms: ${JSON.stringify(job.must_include_terms)}
- exclude terms: ${JSON.stringify(job.must_exclude_terms)}

Page metadata:
- url: ${source.source_url}
- title: ${source.source_title ?? ""}
- snippet: ${source.source_snippet ?? ""}

Extracted content:
${extracted}

Rules:
- Prefer explicit evidence over inference.
- Do not invent phone, email, language, or address.
- If Turkish service is not explicit, but Turkish language support is strongly implied, set confidence below 70.
- For languages, use ISO-like short codes where possible: tr, de, en.
- Contacts must be typed objects.
- Evidence quotes must be short verbatim excerpts from the page.
- If multiple practitioners appear on one page, return the best matching single candidate only.`;
}

/** Gemini structured output şeması (responseMimeType: application/json ile). */
export const CLASSIFIER_RESPONSE_SCHEMA = {
  type: "object",
  required: [
    "is_match",
    "match_reason",
    "confidence_score",
    "canonical_name",
    "organization_name",
    "profession_label",
    "role_key",
    "item_type",
    "category_slug",
    "city",
    "country_code",
    "languages",
    "services",
    "contacts",
    "website_url",
    "appointment_url",
    "evidence_quotes",
  ],
  properties: {
    is_match: { type: "boolean" },
    match_reason: { type: "string" },
    confidence_score: { type: "number" },
    canonical_name: { type: "string", nullable: true },
    organization_name: { type: "string", nullable: true },
    profession_label: { type: "string", nullable: true },
    role_key: { type: "string", nullable: true },
    item_type: { type: "string", nullable: true },
    category_slug: { type: "string", nullable: true },
    city: { type: "string", nullable: true },
    country_code: { type: "string", nullable: true },
    languages: { type: "array", items: { type: "string" } },
    services: { type: "array", items: { type: "string" } },
    contacts: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "value"],
        properties: {
          type: { type: "string", enum: ["phone", "email", "website", "appointment_url"] },
          value: { type: "string" },
          label: { type: "string", nullable: true },
          is_primary: { type: "boolean", nullable: true },
        },
      },
    },
    website_url: { type: "string", nullable: true },
    appointment_url: { type: "string", nullable: true },
    evidence_quotes: { type: "array", items: { type: "string" } },
  },
} as const;
