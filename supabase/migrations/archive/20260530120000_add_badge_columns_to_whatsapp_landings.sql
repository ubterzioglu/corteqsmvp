-- Add proper boolean columns (IF NOT EXISTS for idempotency)
ALTER TABLE public.whatsapp_landings
  ADD COLUMN IF NOT EXISTS member_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_approved  BOOLEAN NOT NULL DEFAULT false;

-- Backfill from existing [Badge member: true/false] tags in description
-- member takes priority: if both tags are true, member_approved wins, admin_approved stays false
-- Skip rows where description IS NULL (regex against NULL returns NULL, not false)
UPDATE public.whatsapp_landings
SET
  member_approved = (description ~* '\[Badge member:\s*true\]'),
  admin_approved  = (description ~* '\[Badge admin:\s*true\]')
              AND NOT (description ~* '\[Badge member:\s*true\]')
WHERE description IS NOT NULL;

-- Add constraint as NOT VALID (no full table scan, no AccessExclusiveLock)
ALTER TABLE public.whatsapp_landings
  ADD CONSTRAINT chk_single_badge
    CHECK (NOT (member_approved AND admin_approved)) NOT VALID;

-- Validate constraint separately (uses ShareUpdateExclusiveLock, does not block reads/writes)
ALTER TABLE public.whatsapp_landings VALIDATE CONSTRAINT chk_single_badge;
