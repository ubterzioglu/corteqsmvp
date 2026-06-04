# Catalog Supabase JS Queries

## Unified Public Search

```ts
const { data, error } = await supabase.rpc("search_catalog", {
  search_query: "Berlin restoran",
  item_types: ["business"],
  category_slugs: ["restaurant"],
  city_filter: "Berlin",
  country_filter: "DE",
  language_filters: null,
  verified_only: false,
  limit_count: 20,
  offset_count: 0,
});
```

## Cross-Type Discovery

```ts
const { data, error } = await supabase.rpc("search_catalog", {
  search_query: "networking etkinliği ve topluluk grupları",
  item_types: ["event", "community_group", "business", "advisor"],
  category_slugs: null,
  city_filter: null,
  country_filter: null,
  language_filters: ["tr"],
  verified_only: false,
  limit_count: 30,
  offset_count: 0,
});
```

## Claim Request Submission

```ts
const { data, error } = await supabase.rpc("submit_catalog_claim_request", {
  target_item_id: itemId,
  claim_type: "ownership",
  evidence: {
    website: "https://example.com",
    email: "owner@example.com",
    screenshot_url: "https://..."
  },
  note: "Bu kaydın işletme sahibiyim."
});
```

## Claim Review by Moderator/Admin

```ts
const { data, error } = await supabase.rpc("review_catalog_claim_request", {
  target_claim_request_id: claimRequestId,
  decision: "approved",
  review_note: "Alan adı ve iletişim delilleri doğrulandı."
});
```

## Safe Editor Update

```ts
const { data, error } = await supabase.rpc("update_catalog_item_editor_content", {
  target_item_id: itemId,
  next_headline: "Yeni başlık",
  next_short_description: "Güncel kısa açıklama",
  next_long_description: "Detaylı açıklama",
  attributes_patch: { spotlight: true }
});
```
