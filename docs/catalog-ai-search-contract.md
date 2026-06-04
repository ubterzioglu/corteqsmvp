# Catalog AI Search Contract

`search_catalog(...)` is the only public database search surface that the AI assistant may use directly.

## Request Contract

```json
{
  "query": "Frankfurt yakınlarında Türkçe konuşan göçmenlik danışmanı",
  "item_types": ["advisor"],
  "category_slugs": ["visa-immigration"],
  "city": "Frankfurt",
  "country": null,
  "languages": ["tr"],
  "verified_only": false,
  "sort": "relevance",
  "limit": 20,
  "offset": 0
}
```

## Mapping Rules

- `query` stays as the original natural-language string for explainability.
- `item_types` must map only to known `catalog_item_types.key` values.
- `category_slugs` must map only to known `catalog_categories.slug` values.
- `city` and `country` must be exact filters, not fuzzy narrative hints.
- `languages` must be ISO-style language codes where possible.
- `verified_only` narrows the RPC to `verified` and `official_source` records.
- The AI layer may suggest filters, but it must not read private tables or bypass RLS.

## Example Supabase RPC Call

```ts
const { data, error } = await supabase.rpc("search_catalog", {
  search_query: "Frankfurt yakınlarında Türkçe konuşan göçmenlik danışmanı",
  item_types: ["advisor"],
  category_slugs: ["visa-immigration"],
  city_filter: "Frankfurt",
  country_filter: null,
  language_filters: ["tr"],
  verified_only: false,
  limit_count: 20,
  offset_count: 0,
});
```

## Response Contract

```json
{
  "item_id": "uuid",
  "item_type": "advisor",
  "slug": "example-slug",
  "title": "Başlık",
  "headline": "Kısa başlık",
  "short_description": "Kısa açıklama",
  "city": "Frankfurt",
  "country_code": "DE",
  "verification_status": "verified",
  "category_slugs": ["visa-immigration"],
  "language_codes": ["tr"],
  "thumbnail_url": "https://...",
  "score": 12.54,
  "filter_data": {
    "status": "published",
    "visibility": "public",
    "published_at": "2026-06-04T09:00:00Z",
    "expires_at": null
  }
}
```

## Safety Rules

- Never return private phone, email, moderation, audit, claim, or source-ingestion fields from AI search flows.
- Person profiles must appear only when `directory_opt_in = true`.
- The assistant may summarize results, but ranking and row eligibility come from the RPC, not from the model.
