# Community Badge Single-Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fragile description-tag badge storage with proper `member_approved` / `admin_approved` boolean columns, enforce mutual exclusivity at DB + lib + UI layers, and add a "no badge" option to the admin edit form.

**Architecture:** A new Supabase migration adds columns, backfills from existing tags, and adds a CHECK constraint. The data lib reads/writes the new columns directly. The admin moderation UI gains a "none" radio option and stops embedding badge tags in the description field.

**Tech Stack:** PostgreSQL (Supabase), TypeScript, React, shadcn/ui RadioGroup

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Create | `supabase/migrations/20260530120000_add_badge_columns_to_whatsapp_landings.sql` | Adds columns, backfills, adds CHECK constraint |
| Modify | `src/lib/whatsapp-landings.ts` | `UpdateLandingInput` type, `rowToLanding`, `updateLanding` |
| Modify | `src/components/admin/WhatsAppLandingsModeration.tsx` | `ApprovalSelection` type, `getApprovalSelection`, RadioGroup third option, `handleEditSave` |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260530120000_add_badge_columns_to_whatsapp_landings.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Add proper boolean columns
ALTER TABLE whatsapp_landings
  ADD COLUMN member_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN admin_approved  BOOLEAN NOT NULL DEFAULT false;

-- Backfill from existing [Badge member: true/false] tags in description
UPDATE whatsapp_landings
SET
  member_approved = (description ~* '\[Badge member:\s*true\]'),
  admin_approved  = (description ~* '\[Badge admin:\s*true\]');

-- Enforce mutual exclusivity at DB level
ALTER TABLE whatsapp_landings
  ADD CONSTRAINT chk_single_badge
    CHECK (NOT (member_approved AND admin_approved));
```

- [ ] **Step 2: Apply migration locally**

```bash
supabase db push
```

Expected: migration applies without error. If any existing row has both badges set to true (violating the constraint), that row needs a manual fix first — run `SELECT id, description FROM whatsapp_landings WHERE description ~* '\[Badge member:\s*true\]' AND description ~* '\[Badge admin:\s*true\]';` to check.

- [ ] **Step 3: Verify columns exist**

```bash
supabase db diff
```

Expected: no outstanding diff (migration is applied).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260530120000_add_badge_columns_to_whatsapp_landings.sql
git commit -m "feat: add member_approved and admin_approved columns to whatsapp_landings"
```

---

## Task 2: Update data layer — types and reading

**Files:**
- Modify: `src/lib/whatsapp-landings.ts`

- [ ] **Step 1: Add `memberApproved` and `adminApproved` to `UpdateLandingInput`**

In `src/lib/whatsapp-landings.ts`, find the `UpdateLandingInput` interface (lines 70-84) and replace it with:

```typescript
export interface UpdateLandingInput {
  groupName: string;
  category: LandingCategory;
  country: string;
  city: string;
  mode: LandingMode;
  heroImage?: string;
  tagline?: string;
  callToActionText?: string;
  conditions?: string;
  whatsappLink: string;
  adminName?: string;
  adminContact?: string;
  description?: string;
  memberApproved: boolean;
  adminApproved: boolean;
}
```

- [ ] **Step 2: Update `rowToLanding` to read from new columns**

Find these two lines in `rowToLanding` (around line 187-188):

```typescript
    memberApproved: parseBooleanTag(row.description, "Badge member", true),
    adminApproved: parseBooleanTag(row.description, "Badge admin", row.status === "approved"),
```

Replace with:

```typescript
    memberApproved: row.member_approved ?? false,
    adminApproved: row.admin_approved ?? false,
```

- [ ] **Step 3: Run the TypeScript compiler to check for type errors**

```bash
npx tsc --noEmit
```

Expected: errors only about `updateLanding` not yet receiving the new fields (will be fixed in Task 3). No other errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/whatsapp-landings.ts
git commit -m "feat: read badge flags from member_approved/admin_approved columns"
```

---

## Task 3: Update data layer — writing

**Files:**
- Modify: `src/lib/whatsapp-landings.ts`

- [ ] **Step 1: Add mutual exclusivity guard and write new columns in `updateLanding`**

Find the `updateLanding` function (lines 348-373). Replace the entire function body with:

```typescript
export async function updateLanding(dbId: string, input: UpdateLandingInput) {
  if (input.memberApproved && input.adminApproved) {
    throw new Error("Bir topluluk hem üye hem admin onaylı olamaz");
  }

  const adminName = normalizeCommunityOptionalText(input.adminName) ?? null;
  const adminContact = normalizeOptionalText(input.adminContact) ?? null;

  // Strip legacy badge tags from description so the field stays clean
  const cleanDescription = normalizeCommunityText(
    input.description
      ?.replace(/\[Badge member:\s*(true|false)\]\s*/gi, "")
      .replace(/\[Badge admin:\s*(true|false)\]\s*/gi, "")
      .trim(),
  ) || null;

  const { error } = await supabase
    .from("whatsapp_landings")
    .update({
      group_name: normalizeCommunityText(input.groupName),
      category: input.category,
      country: normalizeCommunityText(input.country),
      city: normalizeCommunityText(input.city),
      mode: input.mode,
      hero_image: input.heroImage?.trim() || null,
      tagline: normalizeCommunityText(input.tagline) || null,
      call_to_action_text: normalizeCommunityText(input.callToActionText) || null,
      conditions: normalizeCommunityText(input.conditions) || null,
      whatsapp_link: input.whatsappLink.trim(),
      admin_name: adminName,
      admin_contact: adminContact,
      description: cleanDescription,
      member_approved: input.memberApproved,
      admin_approved: input.adminApproved,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dbId);

  if (error) throw error;
}
```

- [ ] **Step 2: Run the TypeScript compiler — should now be clean**

```bash
npx tsc --noEmit
```

Expected: 0 errors (the `updateLanding` callers will be fixed in Task 4, but the lib itself is now correct).

- [ ] **Step 3: Commit**

```bash
git add src/lib/whatsapp-landings.ts
git commit -m "feat: write badge flags to member_approved/admin_approved columns"
```

---

## Task 4: Update admin edit UI

**Files:**
- Modify: `src/components/admin/WhatsAppLandingsModeration.tsx`

- [ ] **Step 1: Extend `ApprovalSelection` type to include "none"**

Find line 73:

```typescript
type ApprovalSelection = "member" | "admin";
```

Replace with:

```typescript
type ApprovalSelection = "member" | "admin" | "none";
```

- [ ] **Step 2: Update `getApprovalSelection` to return "none"**

Find lines 75-78:

```typescript
function getApprovalSelection(memberApproved: boolean, adminApproved: boolean): ApprovalSelection {
  if (adminApproved) return "admin";
  return "member";
}
```

Replace with:

```typescript
function getApprovalSelection(memberApproved: boolean, adminApproved: boolean): ApprovalSelection {
  if (adminApproved) return "admin";
  if (memberApproved) return "member";
  return "none";
}
```

- [ ] **Step 3: Add "none" RadioGroup option to the edit dialog**

Find the closing `</RadioGroup>` tag in the edit dialog (after the "Admin onaylı!" label, around line 556). Insert a third radio option before `</RadioGroup>`:

```tsx
                  <label
                    htmlFor="approval-none"
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                      !editState.memberApproved && !editState.adminApproved
                        ? "border-muted-foreground bg-muted text-foreground"
                        : "border-border bg-background text-foreground"
                    }`}
                  >
                    <RadioGroupItem
                      id="approval-none"
                      value="none"
                      className="border-muted-foreground text-muted-foreground"
                    />
                    <span className="font-medium">Yok (badge yok)</span>
                  </label>
```

- [ ] **Step 4: Update `handleEditSave` to pass badge fields and stop embedding tags in description**

Find the `description` assembly block inside `handleEditSave` (around lines 227-238):

```typescript
        description: [
          editState.description
            .replace(/\[Platform:\s*[^\]]+\]\s*/gi, "")
            .replace(/\[Badge member:\s*(true|false)\]\s*/gi, "")
            .replace(/\[Badge admin:\s*(true|false)\]\s*/gi, "")
            .trim(),
          `[Platform: ${editState.platform}]`,
          `[Badge member: ${approvalSelection === "member" ? "true" : "false"}]`,
          `[Badge admin: ${approvalSelection === "admin" ? "true" : "false"}]`,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),
```

Replace with (only Platform tag remains, badge tags are gone):

```typescript
        description: [
          editState.description
            .replace(/\[Platform:\s*[^\]]+\]\s*/gi, "")
            .replace(/\[Badge member:\s*(true|false)\]\s*/gi, "")
            .replace(/\[Badge admin:\s*(true|false)\]\s*/gi, "")
            .trim(),
          `[Platform: ${editState.platform}]`,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),
        memberApproved: editState.memberApproved,
        adminApproved: editState.adminApproved,
```

Also remove the `approvalSelection` variable at the top of `handleEditSave` — it is no longer used:

```typescript
// DELETE this line:
const approvalSelection = getApprovalSelection(editState.memberApproved, editState.adminApproved);
```

- [ ] **Step 5: Run TypeScript compiler**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Run lint**

```bash
npm run lint
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/WhatsAppLandingsModeration.tsx
git commit -m "feat: add 'no badge' option to admin edit form, pass badge flags to updateLanding"
```

---

## Task 5: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test admin edit — set "Yok (badge yok)"**

1. Navigate to the admin page (requires admin login)
2. Open the edit dialog for an approved community
3. Select "Yok (badge yok)" radio option
4. Save
5. Navigate to `/addcom` — verify no badge appears on that community's card

- [ ] **Step 3: Test admin edit — set "Üye onaylı!"**

1. Open the same community's edit dialog again
2. Select "Üye onaylı!" radio option
3. Save
4. Navigate to `/addcom` — verify the blue "Üye onaylı!" badge appears

- [ ] **Step 4: Test admin edit — set "Admin onaylı!"**

1. Open the same community's edit dialog again
2. Select "Admin onaylı!" radio option
3. Save
4. Navigate to `/addcom` — verify the orange "Admin onaylı!" badge appears (and no blue badge)

- [ ] **Step 5: Verify DB constraint via Supabase dashboard**

Run in Supabase SQL editor:
```sql
SELECT id, member_approved, admin_approved FROM whatsapp_landings LIMIT 10;
```
Expected: no row has both `member_approved = true` AND `admin_approved = true`.

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: address smoke test issues in badge single-select"
```
