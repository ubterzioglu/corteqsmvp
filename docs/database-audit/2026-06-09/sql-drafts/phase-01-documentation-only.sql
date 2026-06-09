-- ============================================================
-- DRAFT ONLY - DO NOT EXECUTE AUTOMATICALLY
-- Human review, backup and staging verification are required.
-- ============================================================
--
-- PHASE 01 — DOCUMENTATION ONLY (COMMENT ON suggestions)
-- Project: injprdrsklkxgnaiixzh  | Schema: public
-- Risk: lowest. COMMENT ON writes only catalog metadata (pg_description),
--       it does NOT lock data, change behavior, or affect RLS.
-- Still: every statement below is COMMENTED OUT. Approve + author a real
--        migration before applying. Do NOT copy this file into supabase/migrations/.
--
-- HOW TO USE: read, confirm each comment text is accurate for the live schema,
--             then a DBA transcribes approved ones into a reviewed migration.
-- ============================================================


-- ------------------------------------------------------------
-- SECTION 1 — Identity / Roles / Permissions tables
-- ------------------------------------------------------------

-- user_role_assignments: canonical role membership (replaces dropped profiles/user_profiles/admin_users).
-- COMMENT ON TABLE  public.user_role_assignments IS 'Canonical user→role membership. Source of truth for is_admin()/is_moderator() RPCs. Legacy profiles/user_profiles/admin_users tables were dropped 2026-06-09.';
-- COMMENT ON COLUMN public.user_role_assignments.user_id IS 'FK → auth.users.id. RLS scoping column.';
-- COMMENT ON COLUMN public.user_role_assignments.role_id IS 'FK → roles.id.';

-- user_profile_attributes: per-user attribute key/values backing role/feature resolution.
-- COMMENT ON TABLE  public.user_profile_attributes IS 'Per-user profile attributes feeding role/feature resolution. Paired with user_role_assignments.';
-- COMMENT ON COLUMN public.user_profile_attributes.user_id IS 'FK → auth.users.id. RLS scoping column.';

-- roles: canonical role catalog.
-- COMMENT ON TABLE  public.roles IS 'Canonical role catalog referenced by user_role_assignments and role_feature_flags.';

-- role_feature_flags: maps roles → enabled feature flags (resolved by get_current_user_features()).
-- COMMENT ON TABLE  public.role_feature_flags IS 'Role→feature-flag mapping. Resolved at runtime by get_current_user_features() together with user_feature_overrides.';


-- ------------------------------------------------------------
-- SECTION 2 — Public submissions & catalog
-- ------------------------------------------------------------

-- submissions: public form submissions (RLS-sensitive insert history, see audit notes).
-- COMMENT ON TABLE  public.submissions IS 'Public form submissions. RLS insert policy has reset history — validate any RLS change in staging before production.';

-- catalog_items: marketplace/catalog entries shown on public site.
-- COMMENT ON TABLE  public.catalog_items IS 'Catalog/marketplace items surfaced on the public site.';
-- COMMENT ON COLUMN public.catalog_items.owner_id IS 'FK → owning user. RLS scoping column — index recommended (see phase-02).';

-- catalog_claim_requests: requests to claim ownership of a catalog item.
-- COMMENT ON TABLE  public.catalog_claim_requests IS 'Ownership-claim requests against catalog_items. Reviewed by admins.';
-- COMMENT ON COLUMN public.catalog_claim_requests.catalog_item_id IS 'FK → catalog_items.id.';
-- COMMENT ON COLUMN public.catalog_claim_requests.user_id IS 'FK → requesting user. RLS scoping column.';


-- ------------------------------------------------------------
-- SECTION 3 — Muhasebe (accounting) financial tables
-- ------------------------------------------------------------

-- expenses (giderler): financial expense records. RLS-protected; underlying for v_muhasebe_* views.
-- COMMENT ON TABLE  public.expenses IS 'Giderler (expenses). RLS-protected financial data. Underlies v_muhasebe_* views — those views must run security_invoker=on (see phase-04).';

-- incomes (gelirler): financial income records. RLS-protected; underlying for v_muhasebe_* views.
-- COMMENT ON TABLE  public.incomes IS 'Gelirler (incomes). RLS-protected financial data. Underlies v_muhasebe_* views — see phase-04 security_invoker note.';


-- ------------------------------------------------------------
-- SECTION 4 — Referral subsystem (RLS-enabled, 0 policies — see phase-04)
-- ------------------------------------------------------------

-- referral_codes: canonical referral codes.
-- COMMENT ON TABLE  public.referral_codes IS 'Canonical referral codes. RLS enabled but currently 0 policies (deny-all). Broad anon/authenticated grants are a latent risk — see phase-04 hardening.';


-- ------------------------------------------------------------
-- SECTION 5 — Additional important tables (document as needed)
-- ------------------------------------------------------------

-- role_feature_flags already covered above. Remaining suggested COMMENTs:

-- COMMENT ON TABLE  public.user_feature_overrides IS 'Per-user feature flag overrides layered on top of role_feature_flags by get_current_user_features().';
-- COMMENT ON TABLE  public.command_center_items IS 'Canonical command-center items. command_center_legacy_map is a retirement candidate — see phase-06.';
-- COMMENT ON TABLE  public.feature_catalog IS 'Canonical feature catalog. Possible duplicate feature_definitions (0 rows) — verify before retiring (phase-06).';


-- ------------------------------------------------------------
-- METADATA DOCUMENTATION NOTES (no SQL — reviewer reference)
-- ------------------------------------------------------------
-- * Turkish domain terms are intentional and must NOT be renamed:
--     muhasebe=accounting, gelirler=income, giderler=expenses, lansman=launch,
--     cadde=street/marketplace, referans=referral, ambasador=ambassador.
-- * COMMENT ON is idempotent (re-running overwrites the comment) and reversible:
--     ROLLBACK: COMMENT ON ... IS NULL;  -- removes the comment
-- * No locks of consequence: COMMENT ON takes a brief ACCESS SHARE-level catalog
--   touch only; safe on a live system, but still goes through migration review.
-- ============================================================
