-- ============================================================
-- DRAFT ONLY - DO NOT EXECUTE AUTOMATICALLY
-- Human review, backup and staging verification are required.
-- ============================================================
--
-- PHASE 03 — SAFE CONSTRAINTS (proposals only)
-- Project: injprdrsklkxgnaiixzh  | Schema: public
--
-- Covers: (1) missing NOT NULL on key columns,
--         (2) UNIQUE constraints preventing duplicate role/feature rows,
--         (3) FK on-delete behavior review.
--
-- PATTERN PER PROPOSAL:
--   * A PRECONDITION / DUPLICATE-CHECK SELECT — READ-ONLY, MAY BE UNCOMMENTED & RUN.
--     >>> Run these first. If they return rows, the constraint would FAIL — clean
--         the data (separately, reviewed) before considering the ALTER.
--   * The proposed ALTER TABLE — COMMENTED OUT (never auto-run).
--
-- LOCK NOTE: ALTER TABLE ... ADD CONSTRAINT takes ACCESS EXCLUSIVE.
--   - ADD UNIQUE builds an index → long lock on big tables. Prefer:
--       CREATE UNIQUE INDEX CONCURRENTLY ...;  then  ALTER TABLE ... ADD CONSTRAINT ... UNIQUE USING INDEX ...;
--   - SET NOT NULL scans the table to validate (cheaper but still ACCESS EXCLUSIVE).
--   - ADD FOREIGN KEY can use NOT VALID then VALIDATE CONSTRAINT (lighter lock) — see proposal 5.
-- ============================================================


-- ------------------------------------------------------------
-- PROPOSAL 1 — NOT NULL: user_role_assignments.user_id
-- ------------------------------------------------------------
-- Rationale: a role assignment with NULL user_id is meaningless and breaks
--            is_admin()/is_moderator() lookups silently.
--
-- PRECONDITION (READ-ONLY — may run): expect 0 rows.
SELECT count(*) AS null_user_id_rows
FROM   public.user_role_assignments
WHERE  user_id IS NULL;
--
-- PROPOSED (COMMENTED OUT):
-- ALTER TABLE public.user_role_assignments ALTER COLUMN user_id SET NOT NULL;
--
-- Risk:     ACCESS EXCLUSIVE during validating scan. Lock window ∝ table size.
-- Rollback: ALTER TABLE public.user_role_assignments ALTER COLUMN user_id DROP NOT NULL;


-- ------------------------------------------------------------
-- PROPOSAL 2 — NOT NULL: user_role_assignments.role_id
-- ------------------------------------------------------------
-- PRECONDITION (READ-ONLY — may run): expect 0 rows.
SELECT count(*) AS null_role_id_rows
FROM   public.user_role_assignments
WHERE  role_id IS NULL;
--
-- PROPOSED (COMMENTED OUT):
-- ALTER TABLE public.user_role_assignments ALTER COLUMN role_id SET NOT NULL;
--
-- Risk:     ACCESS EXCLUSIVE validating scan.
-- Rollback: ALTER TABLE public.user_role_assignments ALTER COLUMN role_id DROP NOT NULL;


-- ------------------------------------------------------------
-- PROPOSAL 3 — UNIQUE: prevent duplicate (user_id, role_id) role rows
-- ------------------------------------------------------------
-- Rationale: a user should hold a given role at most once. Duplicates inflate
--            permission checks and can mask bugs.
--
-- PRECONDITION / DUPLICATE-CHECK (READ-ONLY — may run): expect 0 rows.
SELECT user_id, role_id, count(*) AS dup_count
FROM   public.user_role_assignments
GROUP  BY user_id, role_id
HAVING count(*) > 1;
--
-- PROPOSED (COMMENTED OUT — lock-safe two-step):
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_user_role_assignments_user_role
--   ON public.user_role_assignments (user_id, role_id);
-- ALTER TABLE public.user_role_assignments
--   ADD CONSTRAINT uq_user_role_assignments_user_role UNIQUE USING INDEX uq_user_role_assignments_user_role;
--
-- Risk:     duplicate-check MUST return 0 rows first or the constraint creation fails.
--           CONCURRENTLY avoids long write lock during index build.
-- Rollback: ALTER TABLE public.user_role_assignments DROP CONSTRAINT IF EXISTS uq_user_role_assignments_user_role;


-- ------------------------------------------------------------
-- PROPOSAL 4 — UNIQUE: prevent duplicate (role_id, feature_*) flag rows
-- ------------------------------------------------------------
-- Table: public.role_feature_flags  (verify exact feature column name: feature_key / feature_id)
-- Rationale: a role should map to a given feature flag once; duplicates cause
--            ambiguous resolution in get_current_user_features().
--
-- PRECONDITION / DUPLICATE-CHECK (READ-ONLY — may run): expect 0 rows.
--   (Adjust the second grouping column to the real feature column name.)
SELECT role_id, feature_key, count(*) AS dup_count
FROM   public.role_feature_flags
GROUP  BY role_id, feature_key
HAVING count(*) > 1;
--
-- PROPOSED (COMMENTED OUT):
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_role_feature_flags_role_feature
--   ON public.role_feature_flags (role_id, feature_key);
-- ALTER TABLE public.role_feature_flags
--   ADD CONSTRAINT uq_role_feature_flags_role_feature UNIQUE USING INDEX uq_role_feature_flags_role_feature;
--
-- Risk:     verify column name; duplicate-check must be empty first.
-- Rollback: ALTER TABLE public.role_feature_flags DROP CONSTRAINT IF EXISTS uq_role_feature_flags_role_feature;


-- ------------------------------------------------------------
-- PROPOSAL 5 — FK ON DELETE review: catalog_claim_requests → catalog_items
-- ------------------------------------------------------------
-- Rationale: when a catalog_item is deleted, what should happen to its claim
--            requests? Today the behavior is whatever the FK declares — review it.
--            Likely intent: ON DELETE CASCADE (claims are meaningless without the item)
--            OR ON DELETE RESTRICT (block deletion while claims pending).
--
-- INSPECT CURRENT FK BEHAVIOR (READ-ONLY — may run):
SELECT conname,
       confdeltype  -- a=no action, r=restrict, c=cascade, n=set null, d=set default
FROM   pg_constraint
WHERE  conrelid = 'public.catalog_claim_requests'::regclass
  AND  contype  = 'f';
--
-- PROPOSED change (COMMENTED OUT — only if review decides current ≠ intended):
-- Step 1: drop existing FK (name from the query above):
-- ALTER TABLE public.catalog_claim_requests DROP CONSTRAINT <existing_fk_name>;
-- Step 2: re-add with intended behavior, lock-light via NOT VALID + VALIDATE:
-- ALTER TABLE public.catalog_claim_requests
--   ADD CONSTRAINT fk_catalog_claim_requests_item
--   FOREIGN KEY (catalog_item_id) REFERENCES public.catalog_items (id)
--   ON DELETE CASCADE NOT VALID;
-- ALTER TABLE public.catalog_claim_requests
--   VALIDATE CONSTRAINT fk_catalog_claim_requests_item;  -- SHARE UPDATE EXCLUSIVE, not ACCESS EXCLUSIVE
--
-- Risk:     changing ON DELETE semantics changes data-loss behavior — confirm with
--           product owner. NOT VALID + VALIDATE keeps the lock light but the drop/add
--           of the constraint itself still needs care; do in a low-traffic window.
-- Rollback: drop the new FK and re-create the original with its prior confdeltype.


-- ============================================================
-- GENERAL GUARDRAILS
-- * Always run the READ-ONLY precondition SELECTs first; a non-empty result means
--   the proposed constraint would FAIL — data must be remediated separately.
-- * Never apply ADD CONSTRAINT directly on large tables without the CONCURRENTLY /
--   NOT VALID + VALIDATE patterns shown above.
-- * Author approved changes as a NEW reviewed migration — do not copy this file.
-- ============================================================
