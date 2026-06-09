# 03 — AFS Catalog Inventory

> **Date:** 2026-06-09 · Source: live `attribute_catalog` (53), `feature_catalog` (42), `profile_section_catalog` (7).

## Schema gap notice (drives Phase 2 add-columns)
Target schema (design §3) wants fields the live catalogs LACK. These are **ADD COLUMN** tasks in migration 004:
| Target table | Has live | MISSING (add) |
|---|---|---|
| `afs_attributes` ← attribute_catalog | id,key,label,description,data_type,is_active,is_system,sort_order,created/updated | **storage_strategy, storage_key, default_visibility, validation_schema** |
| `afs_features` ← feature_catalog | key,label,description,scope_role,is_active_globally(→is_globally_enabled),scope,feature_type,metadata,sort_order | **default_visibility** (rename is_active_globally→is_globally_enabled, or keep+alias) |
| `afs_sections` ← profile_section_catalog | id,key,section_area,label,description,component_name(→component_key),data_source,is_active,metadata,sort_order | **default_visibility** (rename component_name→component_key) |

## Attributes (53) — storage_strategy assignment (PROPOSED, for migration 012)
**core_column** (promote to catalog_items column): `full_name`(→display_name), `country`(→country_code), `city`, `bio_short`(→short_description), `avatar_url`/`profile_photo_url`, `is_verified`(→is_verified).
**private_storage** (never public): `cv_doc`, `cv_path`, `cv_name`, `presentation_doc`, `presentation_path`, `presentation_name`, `phone`, `phone_verified`, `referral_code`, `referral_source`.
**dynamic_value** (catalog_item_attribute_values): all remaining (linkedin_url, instagram_url, facebook_url, youtube_url, tiktok_url, x_url, reddit_url, website_url, business_name, business_sector, business_website, business_description, business_category, business_or_organization, profession, school, address, physical_address, map_link, show_on_map, expertise_area, interests, interest_focus, hiring_mode, organization_type, main_platform, ambassador_city, mentor_topics, mentor_weekly_hours, is_volunteer_mentor, service_regions, founded_year, real_estate_media_urls, job_seeking_opt_in, moving_soon_opt_in, volunteer_mentorship_opt_in).

### Normalization-duplicate pairs (DO NOT auto-delete — decision per pair)
| Pair | Decision (PROPOSED) |
|---|---|
| `avatar_url` vs `profile_photo_url` | Keep both initially; canonical = `avatar_url`. Flag for owner review. |
| `address` vs `physical_address` | Keep both; `physical_address` = business/office, `address` = personal. Distinct semantics. |
| `cv_path`+`cv_name` vs `cv_doc` | `cv_doc` (json) is canonical; `cv_path`/`cv_name` legacy → mark deprecated, keep for back-compat data only. |
| `presentation_path`+`presentation_name` vs `presentation_doc` | Same as CV: `presentation_doc` canonical. |
| `business_website` vs `website_url` | Keep both; `business_website` = business profiles, `website_url` = generic. |
| `is_volunteer_mentor` vs `volunteer_mentorship_opt_in` | `volunteer_mentorship_opt_in` (opt-in flag) canonical; `is_volunteer_mentor` = derived/legacy. |

> No attribute is deleted in v1. Normalization is recorded; consolidation deferred to a later pass (avoids data-shape churn during rebuild).

## Features (42) — global state
41 are `is_globally_enabled = true`; **1 is false**: `dashboard.admin_onizleme_modu` (matches plan §9 "Pasif"). Global state ≠ per-role enabled (explicit in `role_features`).

## Sections (7)
| key | area | component (live `component_name`) |
|---|---|---|
| preview.isim_kurulus_adi | preview_card | title |
| preview.konum | preview_card | location |
| preview.profil_logo_gorseli | preview_card | image |
| preview.kategori_sektor_etiketi | preview_card | badges |
| detail.hakkinda_bio | detail_card | rich_text |
| detail.taxonomy_etiketleri | detail_card | badges |
| detail.iletisim_linkleri | detail_card | links |

All match plan §10. ✓
