# Phase 2 — Live structure notes (for authoring migrations)

> Working notes from live introspection 2026-06-09. Strategy: **physical RENAME (ALTER TABLE RENAME)**, not DROP+recreate — preserves FK graph, data, indexes, triggers. Then add missing columns, rename constraints/indexes for cleanliness, drop family residue, rewire code.

## Rename map (table-level)
| From | To |
|---|---|
| attribute_catalog | afs_attributes |
| feature_catalog | afs_features |
| profile_section_catalog | afs_sections |
| role_attribute_rules | role_attributes |
| role_feature_flags | role_features |
| role_profile_section_rules | role_sections |
| catalog_item_attributes | catalog_item_attribute_values |
| catalog_claim_requests | catalog_item_claims |
| catalog_item_memberships | catalog_item_managers |

## Column facts
- **roles**: id,key,label,description,sort_order,is_active,created_at,updated_at,**family_key(DROP),parent_role_id(DROP)**,is_assignable,is_directory_visible,default_item_type,is_system,metadata. Keep core 8 + decide on is_assignable/is_directory_visible (move to flags or keep). Drop family_key, parent_role_id.
- **attribute_catalog**: id,key,label,description,data_type,is_active,is_system,sort_order,created_at,updated_at. ADD: storage_strategy, storage_key, default_visibility, validation_schema.
- **feature_catalog**: key(PK, text — referenced by 5 FKs),label,description,scope_role,is_active_globally,created_at,updated_at,scope,feature_type,metadata,sort_order. ADD: default_visibility. Note: keyed by TEXT key, not id.
- **profile_section_catalog**: id,key,section_area,label,description,component_name,data_source,is_active,metadata,sort_order,created_at,updated_at. RENAME component_name->component_key OR keep+alias. ADD default_visibility.
- **role_feature_flags**: role_id, feature_key(TEXT FK->feature_catalog.key), is_enabled, updated_by, created_at, updated_at. (NO feature_id — design wants feature_id FK; keep feature_key to avoid breaking 5-FK web, OR add feature_id. DECISION: keep feature_key text ref — simplest, FK already enforces integrity.)
- **role_attribute_rules**: role_id, attribute_id(uuid FK), + rule cols.
- **role_profile_section_rules**: role_id, section_id(uuid FK), + cols.
- **catalog_items**: id,item_type,slug,title,headline,short_description,long_description,status,visibility,verification_status,created_by_user_id,published_at,attributes(jsonb),created_at,updated_at,platform_role_key,linked_user_id. ADD is_placeholder.

## FK graph (preserved automatically by RENAME)
- attribute_catalog.id  <- role_attribute_rules.attribute_id, item_type_attribute_rules.attribute_id(DROP w/ table), user_profile_attributes.attribute_id, catalog_item_attributes.attribute_id
- attribute_catalog.key <- catalog_item_attribute_overrides.attribute_key
- feature_catalog.key   <- role_feature_flags.feature_key, catalog_item_feature_overrides.feature_key, user_feature_overrides.feature_key, approval_requests.target_feature_key
- profile_section_catalog.id  <- role_profile_section_rules.section_id
- profile_section_catalog.key <- catalog_item_section_overrides.section_key
- roles.id <- role_attribute_rules.role_id, role_feature_flags.role_id, role_profile_section_rules.role_id
- catalog_items.id <- catalog_item_attributes.item_id, catalog_claim_requests.item_id, catalog_item_memberships.item_id, (+ all satellites)

## Drop targets (family residue only — satellites KEPT per Checkpoint 1)
- roles.family_key, roles.parent_role_id columns
- 6 legacy roles (sort 10-60)
- catalog_item_types, item_type_attribute_rules, item_type_feature_defaults, item_type_features
- role_taxonomy_rules
- their triggers + RLS

## Pre-existing migration replay bugs fixed (to make local `supabase start` work)
These were latent bugs in the existing history — clean from-scratch replay failed; prod applied incrementally so never hit them. Each fix is a no-op on prod.
1. `20260423140000_reduce_referral_validation_leakage.sql` — added `DROP FUNCTION IF EXISTS validate_and_bind_referral_code(text,timestamptz)` before CREATE OR REPLACE (42P13 return-type change).
2. `20260604103000_catalog_seed_item_types_taxonomy_features.sql` — `on conflict (slug)` → `on conflict (module, slug)` (catalog_categories real constraint is unique(module,slug)) (42P10).
3. `20260609031000_referral_wa_grant_hardening.sql` — guarded REVOKE loop with `to_regclass()` (wa_messages/wa_tasks/wa_users exist only in prod, not migration history) (42P01).
4. `20260609033000_add_missing_fk_indexes.sql` — stripped `CONCURRENTLY` from 45 CREATE INDEX (25001: can't run in supabase pipeline).

## Code rewire targets
- ~100 RPCs reference old table names (esp. attribute_catalog, feature_catalog, role_feature_flags) — must `create or replace` after rename.
- ~84 frontend refs across 23 files.
- src/integrations/supabase/types.ts regenerate.
- 62 triggers auto-follow rename; trigger FUNCTION bodies referencing old names need update.
