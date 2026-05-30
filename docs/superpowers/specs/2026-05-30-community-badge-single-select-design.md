# Community Badge Single-Select Design

**Date:** 2026-05-30  
**Route:** `/addcom`  
**Status:** Approved

## Problem

Community cards on `/addcom` display two approval badges: "Üye onaylı!" (member-approved) and "Admin onaylı!" (admin-approved). These should be mutually exclusive — a community can have at most one. Currently:

- Badges are stored as text tags embedded in the `description` column: `[Badge member: true]` / `[Badge admin: true]`
- The admin edit UI uses a RadioGroup (single-select), which enforces mutual exclusivity in the UI
- But there is no database-level constraint, leaving the data vulnerable to inconsistency
- Storage in `description` is fragile, not queryable, and not type-safe

## Solution

Add proper boolean columns to the database and enforce mutual exclusivity at all three layers: database, data layer, and admin UI.

---

## Layer 1: Database Migration

**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_badge_columns_to_whatsapp_landings.sql`

```sql
-- Add proper columns
ALTER TABLE whatsapp_landings
  ADD COLUMN member_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN admin_approved  BOOLEAN NOT NULL DEFAULT false;

-- Backfill from existing description tags
UPDATE whatsapp_landings
SET
  member_approved = (description ~* '\[Badge member:\s*true\]'),
  admin_approved  = (description ~* '\[Badge admin:\s*true\]');

-- Enforce mutual exclusivity at DB level
ALTER TABLE whatsapp_landings
  ADD CONSTRAINT chk_single_badge
    CHECK (NOT (member_approved AND admin_approved));
```

---

## Layer 2: Data Layer (`src/lib/whatsapp-landings.ts`)

### Reading
Replace `parseBooleanTag` calls with direct column reads:

```typescript
memberApproved: row.member_approved ?? false,
adminApproved:  row.admin_approved  ?? false,
```

### Writing
- Add `memberApproved` and `adminApproved` to `UpdateLandingInput` type
- In `updateLanding`, enforce mutual exclusivity before the Supabase call:

```typescript
if (input.memberApproved && input.adminApproved) {
  throw new Error("Bir topluluk hem üye hem admin onaylı olamaz");
}
```

- Pass the fields directly to the Supabase update payload: `member_approved`, `admin_approved`
- Strip `[Badge member: ...]` and `[Badge admin: ...]` tags from `description` on save to keep the field clean

---

## Layer 3: Admin Edit UI (`src/components/admin/WhatsAppLandingsModeration.tsx`)

### ApprovalSelection type
Extend to include `"none"`:

```typescript
type ApprovalSelection = "member" | "admin" | "none";
```

### getApprovalSelection
```typescript
function getApprovalSelection(memberApproved: boolean, adminApproved: boolean): ApprovalSelection {
  if (adminApproved) return "admin";
  if (memberApproved) return "member";
  return "none";
}
```

### setApprovalSelection
```typescript
const setApprovalSelection = (value: ApprovalSelection) => {
  setEditState((current) => {
    if (!current) return current;
    return {
      ...current,
      memberApproved: value === "member",
      adminApproved: value === "admin",
    };
  });
};
```

### RadioGroup — add third option
Add a "Yok (badge yok)" option alongside the existing two radio items.

### handleEditSave
Pass `memberApproved` and `adminApproved` as proper fields to `updateLanding`. Remove the `[Badge member/admin: ...]` tag injection from the `description` assembly block.

---

## Layer 4: Public Card UI (`src/pages/AddWhatsAppPage.tsx`)

No changes required. The card already reads `memberApproved` / `adminApproved` from the mapped `WhatsAppLanding` object. Once the data layer reads from the new columns, cards automatically display correctly.

---

## Change Summary

| Layer | File | Change |
|---|---|---|
| DB | new migration | Add `member_approved`, `admin_approved` columns + mutual exclusivity constraint + backfill |
| Lib | `src/lib/whatsapp-landings.ts` | Read from columns, write to columns, validate, strip old tags from description |
| Admin UI | `src/components/admin/WhatsAppLandingsModeration.tsx` | Add "none" option to RadioGroup, pass new fields to lib |
| Public UI | `src/pages/AddWhatsAppPage.tsx` | No change needed |

## Out of Scope

- Changing the visual design of the badges
- Adding new badge types
- Modifying RLS policies (existing policies cover the new columns via table-level rules)
