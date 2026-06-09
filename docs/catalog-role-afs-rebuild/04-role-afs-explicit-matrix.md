# 04 — Role ↔ AFS Explicit Matrix

> **Date:** 2026-06-09 · Source: live `role_attribute_rules` (1977), `role_feature_flags` (2487), `role_profile_section_rules` (574), excluding 6 legacy roles.

## ⚠️ KEY FINDING — the live matrix is 100% UNIFORM

Signature uniformity check across all 76 non-legacy roles:
| Relation | distinct signatures | roles | Per-role differentiation? |
|---|---|---|---|
| attributes | **1** | 76 | **NONE** — every role has the identical 24 attributes |
| features | **1** | 76 | **NONE** — every role has the identical 30 features |
| sections | **1** | 76 | **NONE** — every role has the identical 7 sections |

**Every one of the 76 roles carries exactly: 24 attributes, 30 features, 7 sections — the same set.** There is currently no meaningful per-role AFS configuration in the live database; it was bulk-applied uniformly (likely the `20260609001000_backfill_to_rolesgo.sql` backfill).

### Decision needed at Checkpoint 1
The plan (§3.3, §13) implies roles have *distinct* AFS profiles ("Seçilen rolün role_attributes kayıtlarını getir" → dynamic per-role form). But the live data is uniform. Two options for seed migration `013`:
- **(A) Faithful reproduce** — seed all 76 roles with the identical 24/30/7 set (matches live exactly; every role's form looks the same). Literal, zero-risk, but the "dynamic per-role form" is cosmetic.
- **(B) Differentiate** — design a real per-role matrix (e.g. Business_* gets business_*/founded_year/physical_address; Healthcare_* gets appointment fields; Consultant_* gets expertise_area/cv). More faithful to product intent; requires product input on which attrs/features per role group.

**Recommended: (A) for v1** (faithful, unblocks rebuild), with (B) tracked as a fast-follow once placeholders exist and product can review per-group. Marked PROPOSED.

## The uniform set (source for seed 013)

### 24 attributes (per role)
`bio_short, business_or_organization, city, country, cv_doc, expertise_area, facebook_url, full_name, instagram_url, interest_focus, interests, job_seeking_opt_in, linkedin_url, moving_soon_opt_in, presentation_doc, profile_photo_url, reddit_url, referral_code, referral_source, tiktok_url, volunteer_mentorship_opt_in, website_url, x_url, youtube_url`

### 30 features (per role)
All 42 catalog features minus 12 (the 30 enabled in the uniform backfill — exact list to be dumped verbatim into seed 013 from `role_feature_flags` where `is_enabled=true`).

### 7 sections (per role)
All 7 sections (the full `profile_section_catalog`).

## Structural note for Phase 2
- `role_feature_flags` keys by **`feature_key` (text)**, not `feature_id`. Target `role_features` (design §3) uses `feature_id` FK + `unique(role_id, feature_id)`. → migration 005 must resolve feature_key→feature_id during rename, not a pure rename.
- `role_attribute_rules` / `role_profile_section_rules` use `attribute_id` / `section_id` (uuid FKs) — clean rename.

## Seed strategy (013)
Dump the exact live rows (the uniform set) as explicit INSERTs per role × 24 attrs / 30 feats / 7 secs = 76×(24+30+7) = **4,636 explicit rows**. No runtime inheritance. Helper function may generate but final rows are explicit per design §1.1 / plan §1.1.
