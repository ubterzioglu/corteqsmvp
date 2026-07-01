# Relocation Tools: Eksik Görseller + Admin Soru Sayısı Paneli — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix missing hero images for 7 newly-added Germany relocation tools on `/relocation/tools`, and add a new admin panel page at `/admin/relocation-tools/soru-sayilari` showing a live, DB-backed table of question/field counts per tool (quick vs. detailed mode).

**Architecture:** Part 1 is a pure data-fix (add 7 image files + 7 map entries, zero logic change). Part 2 adds one new API module (`relocation-tools-admin-api.ts`) that queries `relocation_tool_questions` (grouped by `tool_key`+`mode`) and `germany_citizenship_questions` (grouped by `eyalet`), merges those with hardcoded counts for the 4 tools that have no queryable "question" concept (Vize Seçimi = decision-tree node count from a TS constant; Maaş Hesaplama / Para Transferi / StepStone = fixed form-field counts), and renders it all in one new admin page following the existing `AdminPageShell` + React Query pattern.

**Tech Stack:** React + TypeScript + Vite, Supabase (`@supabase/supabase-js`), TanStack React Query, Vitest + Testing Library, Tailwind + shadcn/ui, Higgsfield MCP (`generate_image`) for asset generation.

## Global Constraints

- Do not rename or restructure any existing exported function/type in files you modify — only add.
- All new user-facing strings are in Turkish, matching existing copy style (see `TOOLS_UI_COPY`, other Admin pages).
- Route paths already live (per `CLAUDE.md`) must never change; this plan only *adds* a new route, never modifies existing ones.
- `supabase/types.ts` does not yet include `relocation_tool_*` or `germany_citizenship_questions` tables — follow the established `const db = supabase as any;` escape hatch used in `relocation-tools-api.ts` and `germany-citizenship-api.ts`. Do not attempt a types regen as part of this plan.
- New DB reads must go through `.select(...)` with RLS already permitting `authenticated` read on `relocation_tools`, `relocation_tool_questions` (active rows) and `anon+authenticated` read on `germany_citizenship_questions` — no new RLS policies or migrations needed for this plan.
- Turkish text rules from `CLAUDE.md`: use plain string literals (no `.toUpperCase()/.toLowerCase()` on Turkish text); this plan doesn't need case transforms so this is a non-issue, but don't introduce any.

---

## Part 1 — Missing Hero Images

### Task 1: Generate 7 hero images with Higgsfield and add them to the image map

**Files:**
- Create: `public/relocation-tools/banka-secim-almanya.jpg`
- Create: `public/relocation-tools/sigorta-secim-almanya.jpg`
- Create: `public/relocation-tools/maas-hesaplama-almanya.jpg`
- Create: `public/relocation-tools/vize-secim-almanya.jpg`
- Create: `public/relocation-tools/vatandaslik-testi-almanya.jpg`
- Create: `public/relocation-tools/para-transferi-almanya.jpg`
- Create: `public/relocation-tools/stepstone-karsilastirma-almanya.jpg`
- Modify: `src/lib/relocation-tools-images.ts`

**Interfaces:**
- Consumes: nothing new — `toolHeroImage(slug)` signature is unchanged.
- Produces: `TOOL_HERO_BY_SLUG` now resolves all 17 tool slugs instead of 10. `ToolLandingCard.tsx` (unmodified) will automatically pick these up since it already calls `toolHeroImage(tool.slug)`.

- [ ] **Step 1: Generate the 7 images via the Higgsfield MCP `generate_image` tool**

For each of the 7 slugs below, call `generate_image` with a prompt describing a flat-vector illustration consistent with the existing 10 hero images (cream/beige background ~#F5EFE3, teal ~#2F6F6B primary character color, orange/amber ~#E8823C accent icons, 16:9 aspect ratio, single character + icon composition, no text in the image). Use these per-tool prompts:

  - `banka-secim-almanya`: "Flat vector illustration, a person holding a bank card, surrounded by small icons representing different bank types (building, phone, coin), cream beige background, teal and orange accent colors, minimalist flat design, 16:9 aspect ratio, no text"
  - `sigorta-secim-almanya`: "Flat vector illustration, a person holding an umbrella/shield icon over themselves, small icons of a house and a heart nearby representing insurance types, cream beige background, teal and orange accent colors, minimalist flat design, 16:9 aspect ratio, no text"
  - `maas-hesaplama-almanya`: "Flat vector illustration, a person holding a calculator with a euro banknote nearby, small chart icon in the background, cream beige background, teal and orange accent colors, minimalist flat design, 16:9 aspect ratio, no text"
  - `vize-secim-almanya`: "Flat vector illustration, a person holding a passport, standing at a crossroads/fork-in-the-road signpost, cream beige background, teal and orange accent colors, minimalist flat design, 16:9 aspect ratio, no text"
  - `vatandaslik-testi-almanya`: "Flat vector illustration, a person holding an open book/exam paper, small German flag motif nearby, cream beige background, teal and orange accent colors, minimalist flat design, 16:9 aspect ratio, no text"
  - `para-transferi-almanya`: "Flat vector illustration, a person holding a smartphone, an arrow icon between a euro symbol and a lira symbol, cream beige background, teal and orange accent colors, minimalist flat design, 16:9 aspect ratio, no text"
  - `stepstone-karsilastirma-almanya`: "Flat vector illustration, a person standing next to a bar chart panel, small trending-up icon nearby, cream beige background, teal and orange accent colors, minimalist flat design, 16:9 aspect ratio, no text"

  After each generation, use `reveal_generation` / `job_status` as needed to fetch the resulting image, then save each to `public/relocation-tools/<slug>.jpg` (matching the exact slug filenames above — these must byte-match the `TOOL_HERO_BY_SLUG` keys added in Step 2).

- [ ] **Step 2: Add the 7 new entries to `TOOL_HERO_BY_SLUG`**

In `src/lib/relocation-tools-images.ts`, change:

```ts
const TOOL_HERO_BY_SLUG: Record<string, string> = {
  "ulke-secimi": "/relocation-tools/ulke-secimi.jpg",
  "meslek-maas-karsilastirma": "/relocation-tools/meslek-maas-karsilastirma.jpg",
  "tasinma-hazirlik-skoru": "/relocation-tools/tasinma-hazirlik-skoru.jpg",
  "sehir-eslestirme": "/relocation-tools/sehir-eslestirme.jpg",
  "diaspora-ag-eslestirme": "/relocation-tools/diaspora-ag-eslestirme.jpg",
  "yurtdisi-kariyer-yolu": "/relocation-tools/yurtdisi-kariyer-yolu.jpg",
  "expat-yasam-tarzi-persona": "/relocation-tools/expat-yasam-tarzi-persona.jpg",
  "ilk-90-gun-planlayici": "/relocation-tools/ilk-90-gun-planlayici.jpg",
  "oncelikli-tasinma-sorunu": "/relocation-tools/oncelikli-tasinma-sorunu.jpg",
  "is-bulma-olasiligi": "/relocation-tools/is-bulma-olasiligi.jpg",
};
```

to:

```ts
const TOOL_HERO_BY_SLUG: Record<string, string> = {
  "ulke-secimi": "/relocation-tools/ulke-secimi.jpg",
  "meslek-maas-karsilastirma": "/relocation-tools/meslek-maas-karsilastirma.jpg",
  "tasinma-hazirlik-skoru": "/relocation-tools/tasinma-hazirlik-skoru.jpg",
  "sehir-eslestirme": "/relocation-tools/sehir-eslestirme.jpg",
  "diaspora-ag-eslestirme": "/relocation-tools/diaspora-ag-eslestirme.jpg",
  "yurtdisi-kariyer-yolu": "/relocation-tools/yurtdisi-kariyer-yolu.jpg",
  "expat-yasam-tarzi-persona": "/relocation-tools/expat-yasam-tarzi-persona.jpg",
  "ilk-90-gun-planlayici": "/relocation-tools/ilk-90-gun-planlayici.jpg",
  "oncelikli-tasinma-sorunu": "/relocation-tools/oncelikli-tasinma-sorunu.jpg",
  "is-bulma-olasiligi": "/relocation-tools/is-bulma-olasiligi.jpg",
  "banka-secim-almanya": "/relocation-tools/banka-secim-almanya.jpg",
  "sigorta-secim-almanya": "/relocation-tools/sigorta-secim-almanya.jpg",
  "maas-hesaplama-almanya": "/relocation-tools/maas-hesaplama-almanya.jpg",
  "vize-secim-almanya": "/relocation-tools/vize-secim-almanya.jpg",
  "vatandaslik-testi-almanya": "/relocation-tools/vatandaslik-testi-almanya.jpg",
  "para-transferi-almanya": "/relocation-tools/para-transferi-almanya.jpg",
  "stepstone-karsilastirma-almanya": "/relocation-tools/stepstone-karsilastirma-almanya.jpg",
};
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev`
Navigate to `http://localhost:8080/relocation/tools` (log in first if the route requires auth — check `requires_auth` per tool; the hub itself lists all active tools regardless).
Expected: all 17 cards now show a hero image, none blank.

- [ ] **Step 4: Run the existing test suite to confirm nothing broke**

Run: `npm run test -- src/components/relocation/tools`
Expected: PASS (no existing test asserts on the old 10-entry map length, so this is a safety check, not a new test).

- [ ] **Step 5: Commit**

```bash
git add public/relocation-tools/banka-secim-almanya.jpg public/relocation-tools/sigorta-secim-almanya.jpg public/relocation-tools/maas-hesaplama-almanya.jpg public/relocation-tools/vize-secim-almanya.jpg public/relocation-tools/vatandaslik-testi-almanya.jpg public/relocation-tools/para-transferi-almanya.jpg public/relocation-tools/stepstone-karsilastirma-almanya.jpg src/lib/relocation-tools-images.ts
git commit -m "fix(relocation-tools): add missing hero images for 7 Germany tools"
```

---

## Part 2 — Admin "Araç Soru Sayıları" Panel

### Task 2: Add the admin API module with live count queries

**Files:**
- Create: `src/lib/relocation-tools-admin-api.ts`
- Create: `src/lib/relocation-tools-admin-api.test.ts`

**Interfaces:**
- Consumes: `supabase` client from `@/integrations/supabase/client`; `RelocationToolRow` type from `@/lib/relocation-tools-types`.
- Produces:
  - `export type ToolCountKind = "question_bank" | "decision_tree" | "calculator";`
  - `export interface ToolQuestionCountRow { key: string; slug: string; title_tr: string; category: string; kind: ToolCountKind; quick_count: number; detailed_count: number; total_count: number; is_active: boolean; }`
  - `export async function listToolQuestionCounts(): Promise<ToolQuestionCountRow[]>` — this is what Task 3's page consumes.

- [ ] **Step 1: Write the failing test for the merge/shape logic**

Create `src/lib/relocation-tools-admin-api.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import { listToolQuestionCounts } from "@/lib/relocation-tools-admin-api";

function buildQueryResult(data: unknown) {
  return {
    eq: () => buildQueryResult(data),
    order: () => Promise.resolve({ data, error: null }),
    select: () => buildQueryResult(data),
  };
}

describe("listToolQuestionCounts", () => {
  it("motor tabanlı araçları relocation_tool_questions'tan mode bazlı sayar", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "relocation_tools") {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    key: "ulke_secimi",
                    slug: "ulke-secimi",
                    title_tr: "Ülke Seçimi",
                    category: "core",
                    is_active: true,
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === "relocation_tool_questions") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  { tool_key: "ulke_secimi", mode: "quick" },
                  { tool_key: "ulke_secimi", mode: "quick" },
                  { tool_key: "ulke_secimi", mode: "detailed" },
                  { tool_key: "ulke_secimi", mode: "both" },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === "germany_citizenship_questions") {
        return { select: () => ({ error: null, data: [] }) };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const rows = await listToolQuestionCounts();
    const ulke = rows.find((r) => r.key === "ulke_secimi");

    expect(ulke).toBeDefined();
    expect(ulke?.kind).toBe("question_bank");
    // quick = 2 "quick" + 1 "both" = 3; detailed = 1 "detailed" + 1 "both" = 2
    expect(ulke?.quick_count).toBe(3);
    expect(ulke?.detailed_count).toBe(2);
    expect(ulke?.total_count).toBe(4);
  });

  it("standalone hesaplayıcı araçlar için sabit alan sayısı döner", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "relocation_tools") {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    key: "maas_hesaplama_almanya",
                    slug: "maas-hesaplama-almanya",
                    title_tr: "Maaş Hesaplama (Almanya)",
                    category: "germany_tools",
                    is_active: true,
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === "relocation_tool_questions") {
        return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
      }
      if (table === "germany_citizenship_questions") {
        return { select: () => ({ error: null, data: [] }) };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const rows = await listToolQuestionCounts();
    const maas = rows.find((r) => r.key === "maas_hesaplama_almanya");

    expect(maas?.kind).toBe("calculator");
    expect(maas?.quick_count).toBe(9);
    expect(maas?.detailed_count).toBe(9);
    expect(maas?.total_count).toBe(9);
  });

  it("vatandaşlık testi için germany_citizenship_questions satır sayısını döner", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "relocation_tools") {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    key: "vatandaslik_testi_almanya",
                    slug: "vatandaslik-testi-almanya",
                    title_tr: "Vatandaşlık Testi (Almanya)",
                    category: "germany_tools",
                    is_active: true,
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === "relocation_tool_questions") {
        return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
      }
      if (table === "germany_citizenship_questions") {
        return {
          select: () =>
            Promise.resolve({
              data: Array.from({ length: 469 }, (_, i) => ({ id: i })),
              error: null,
            }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const rows = await listToolQuestionCounts();
    const vatandaslik = rows.find((r) => r.key === "vatandaslik_testi_almanya");

    expect(vatandaslik?.kind).toBe("question_bank");
    expect(vatandaslik?.quick_count).toBe(469);
    expect(vatandaslik?.detailed_count).toBe(469);
    expect(vatandaslik?.total_count).toBe(469);
  });

  it("vize seçimi için karar ağacı düğüm sayısını döner", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "relocation_tools") {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    key: "vize_secim_almanya",
                    slug: "vize-secim-almanya",
                    title_tr: "Vize Seçimi (Almanya)",
                    category: "germany_tools",
                    is_active: true,
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === "relocation_tool_questions") {
        return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
      }
      if (table === "germany_citizenship_questions") {
        return { select: () => ({ error: null, data: [] }) };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const rows = await listToolQuestionCounts();
    const vize = rows.find((r) => r.key === "vize_secim_almanya");

    expect(vize?.kind).toBe("decision_tree");
    expect(vize?.total_count).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/lib/relocation-tools-admin-api.test.ts`
Expected: FAIL with "Cannot find module '@/lib/relocation-tools-admin-api'" (module doesn't exist yet).

- [ ] **Step 3: Read the exact `VIZE_QUESTIONS` export to get the real node count**

Run (read-only, to confirm the array length at implementation time — do not hardcode a guessed number):
`node -e "const fs=require('fs'); const t=fs.readFileSync('src/lib/germany-vize-data.ts','utf8'); console.log((t.match(/id: \"Q\d+\"/g)||[]).length)"`

Use the printed number as `VIZE_DECISION_TREE_NODE_COUNT` in Step 4 (do not import the `.ts` file at build-config time — this is just to determine the constant value once; the runtime code imports `VIZE_QUESTIONS` directly, see below).

- [ ] **Step 4: Implement `src/lib/relocation-tools-admin-api.ts`**

```ts
// src/lib/relocation-tools-admin-api.ts
// Admin — "Araç Soru Sayıları" paneli için canlı sayım sorguları.
// relocation_tool_questions (motor tabanlı 12 araç) + germany_citizenship_questions
// (Vatandaşlık Testi) canlı sayılır; Vize Seçimi kod-kaynaklı düğüm sayısı (VIZE_QUESTIONS.length);
// Maaş Hesaplama/Para Transferi/StepStone sabit form-alanı sayısıdır (bunların "soru" kavramı yok).

import { supabase } from "@/integrations/supabase/client";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";
import { VIZE_QUESTIONS } from "@/lib/germany-vize-data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type ToolCountKind = "question_bank" | "decision_tree" | "calculator";

export interface ToolQuestionCountRow {
  key: string;
  slug: string;
  title_tr: string;
  category: string;
  kind: ToolCountKind;
  quick_count: number;
  detailed_count: number;
  total_count: number;
  is_active: boolean;
}

/** Motor kullanmayan standalone araçların sabit sayım kaynağı (form alanı / kod-kaynaklı). */
const STANDALONE_STATIC_COUNTS: Record<string, { kind: ToolCountKind; count: number }> = {
  maas_hesaplama_almanya: { kind: "calculator", count: 9 },
  para_transferi_almanya: { kind: "calculator", count: 1 },
  stepstone_karsilastirma_almanya: { kind: "calculator", count: 5 },
};

const VIZE_TOOL_KEY = "vize_secim_almanya";
const VATANDASLIK_TOOL_KEY = "vatandaslik_testi_almanya";

interface EngineQuestionRow {
  tool_key: string;
  mode: "quick" | "detailed" | "both";
}

function countEngineQuestions(
  rows: EngineQuestionRow[],
): Record<string, { quick: number; detailed: number }> {
  const byTool: Record<string, { quick: number; detailed: number }> = {};
  for (const row of rows) {
    if (!byTool[row.tool_key]) byTool[row.tool_key] = { quick: 0, detailed: 0 };
    if (row.mode === "quick" || row.mode === "both") byTool[row.tool_key].quick += 1;
    if (row.mode === "detailed" || row.mode === "both") byTool[row.tool_key].detailed += 1;
  }
  return byTool;
}

export async function listToolQuestionCounts(): Promise<ToolQuestionCountRow[]> {
  const { data: tools, error: toolsError } = await db
    .from("relocation_tools")
    .select("key, slug, title_tr, category, is_active")
    .order("sort_order", { ascending: true });
  if (toolsError) throw toolsError;

  const { data: engineQuestions, error: engineError } = await db
    .from("relocation_tool_questions")
    .select("tool_key, mode")
    .eq("is_active", true);
  if (engineError) throw engineError;

  const { data: citizenshipRows, error: citizenshipError } = await db
    .from("germany_citizenship_questions")
    .select("id");
  if (citizenshipError) throw citizenshipError;

  const engineCounts = countEngineQuestions((engineQuestions ?? []) as EngineQuestionRow[]);
  const citizenshipCount = (citizenshipRows ?? []).length;
  const vizeNodeCount = VIZE_QUESTIONS.length;

  return ((tools ?? []) as RelocationToolRow[]).map((tool): ToolQuestionCountRow => {
    if (tool.key === VATANDASLIK_TOOL_KEY) {
      return {
        key: tool.key,
        slug: tool.slug,
        title_tr: tool.title_tr,
        category: tool.category,
        kind: "question_bank",
        quick_count: citizenshipCount,
        detailed_count: citizenshipCount,
        total_count: citizenshipCount,
        is_active: tool.is_active,
      };
    }

    if (tool.key === VIZE_TOOL_KEY) {
      return {
        key: tool.key,
        slug: tool.slug,
        title_tr: tool.title_tr,
        category: tool.category,
        kind: "decision_tree",
        quick_count: vizeNodeCount,
        detailed_count: vizeNodeCount,
        total_count: vizeNodeCount,
        is_active: tool.is_active,
      };
    }

    const staticEntry = STANDALONE_STATIC_COUNTS[tool.key];
    if (staticEntry) {
      return {
        key: tool.key,
        slug: tool.slug,
        title_tr: tool.title_tr,
        category: tool.category,
        kind: staticEntry.kind,
        quick_count: staticEntry.count,
        detailed_count: staticEntry.count,
        total_count: staticEntry.count,
        is_active: tool.is_active,
      };
    }

    const engine = engineCounts[tool.key] ?? { quick: 0, detailed: 0 };
    return {
      key: tool.key,
      slug: tool.slug,
      title_tr: tool.title_tr,
      category: tool.category,
      kind: "question_bank",
      quick_count: engine.quick,
      detailed_count: engine.detailed,
      total_count: Math.max(engine.quick, engine.detailed),
      is_active: tool.is_active,
    };
  });
}
```

Note: the test mocks in Step 1 call `.select().order()` for `relocation_tools`, `.select().eq()` for `relocation_tool_questions`, and `.select()` (resolving directly) for `germany_citizenship_questions` — this matches the chain shape above exactly.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- src/lib/relocation-tools-admin-api.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/relocation-tools-admin-api.ts src/lib/relocation-tools-admin-api.test.ts
git commit -m "feat(admin): add live question-count query for relocation tools"
```

### Task 3: Build the admin page UI

**Files:**
- Create: `src/pages/admin/relocation/RelocationToolsQuestionCountsPage.tsx`
- Create: `src/pages/admin/relocation/RelocationToolsQuestionCountsPage.test.tsx`

**Interfaces:**
- Consumes: `listToolQuestionCounts` + `ToolQuestionCountRow` + `ToolCountKind` from `@/lib/relocation-tools-admin-api` (Task 2); `AdminPageShell` from `@/components/admin/page`; `Badge` from `@/components/ui/badge`; standard shadcn `Table*` components from `@/components/ui/table` (already used elsewhere in admin — verify import path matches an existing usage before finalizing, e.g. `AdminAuditLogsPage.tsx`).
- Produces: default export `RelocationToolsQuestionCountsPage` — a React component with no props, consumed by Task 4's route registration.

- [ ] **Step 1: Write the failing render test**

Create `src/pages/admin/relocation/RelocationToolsQuestionCountsPage.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const listSpy = vi.fn();

vi.mock("@/lib/relocation-tools-admin-api", () => ({
  listToolQuestionCounts: (...args: unknown[]) => listSpy(...args),
}));

import RelocationToolsQuestionCountsPage from "@/pages/admin/relocation/RelocationToolsQuestionCountsPage";

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RelocationToolsQuestionCountsPage />
    </QueryClientProvider>,
  );
}

describe("RelocationToolsQuestionCountsPage", () => {
  it("motor tabanlı ve standalone araçları doğru tip rozetiyle listeler", async () => {
    listSpy.mockResolvedValue([
      {
        key: "ulke_secimi",
        slug: "ulke-secimi",
        title_tr: "Ülke Seçimi",
        category: "core",
        kind: "question_bank",
        quick_count: 12,
        detailed_count: 20,
        total_count: 20,
        is_active: true,
      },
      {
        key: "vatandaslik_testi_almanya",
        slug: "vatandaslik-testi-almanya",
        title_tr: "Vatandaşlık Testi (Almanya)",
        category: "germany_tools",
        kind: "question_bank",
        quick_count: 469,
        detailed_count: 469,
        total_count: 469,
        is_active: true,
      },
      {
        key: "vize_secim_almanya",
        slug: "vize-secim-almanya",
        title_tr: "Vize Seçimi (Almanya)",
        category: "germany_tools",
        kind: "decision_tree",
        quick_count: 15,
        detailed_count: 15,
        total_count: 15,
        is_active: true,
      },
      {
        key: "maas_hesaplama_almanya",
        slug: "maas-hesaplama-almanya",
        title_tr: "Maaş Hesaplama (Almanya)",
        category: "germany_tools",
        kind: "calculator",
        quick_count: 9,
        detailed_count: 9,
        total_count: 9,
        is_active: true,
      },
    ]);

    renderPage();

    expect(await screen.findByText("Ülke Seçimi")).toBeInTheDocument();
    expect(screen.getByText("Vatandaşlık Testi (Almanya)")).toBeInTheDocument();
    expect(screen.getByText("Vize Seçimi (Almanya)")).toBeInTheDocument();
    expect(screen.getByText("Maaş Hesaplama (Almanya)")).toBeInTheDocument();

    // Tip rozetleri
    expect(screen.getAllByText("Soru Bankası").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Karar Ağacı")).toBeInTheDocument();
    expect(screen.getByText("Hesaplayıcı")).toBeInTheDocument();

    // Sayılar
    expect(screen.getByText("469")).toBeInTheDocument();
  });

  it("arama kutusu araç adına göre filtreler", async () => {
    listSpy.mockResolvedValue([
      {
        key: "ulke_secimi",
        slug: "ulke-secimi",
        title_tr: "Ülke Seçimi",
        category: "core",
        kind: "question_bank",
        quick_count: 12,
        detailed_count: 20,
        total_count: 20,
        is_active: true,
      },
      {
        key: "banka_secim_almanya",
        slug: "banka-secim-almanya",
        title_tr: "Banka Seçimi (Almanya)",
        category: "germany_tools",
        kind: "question_bank",
        quick_count: 20,
        detailed_count: 20,
        total_count: 20,
        is_active: true,
      },
    ]);

    renderPage();
    await screen.findByText("Ülke Seçimi");

    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/ara/i), "banka");

    expect(screen.queryByText("Ülke Seçimi")).not.toBeInTheDocument();
    expect(screen.getByText("Banka Seçimi (Almanya)")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test -- src/pages/admin/relocation/RelocationToolsQuestionCountsPage.test.tsx`
Expected: FAIL with "Cannot find module '@/pages/admin/relocation/RelocationToolsQuestionCountsPage'".

- [ ] **Step 4: Implement the page**

Create `src/pages/admin/relocation/RelocationToolsQuestionCountsPage.tsx`. Replace `Table, TableBody, TableCell, TableHead, TableHeader, TableRow` names in the import if Step 1's grep revealed different names.

```tsx
// src/pages/admin/relocation/RelocationToolsQuestionCountsPage.tsx
// Admin — hangi relocation aracında kaç soru/düğüm/alan var, hızlı/normal mod kırılımıyla.
// Veri canlı DB'den (relocation_tool_questions + germany_citizenship_questions) + kod-kaynaklı
// standalone sayılardan gelir — bkz. src/lib/relocation-tools-admin-api.ts.

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListChecks, Search } from "lucide-react";

import { AdminPageShell } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trIncludes } from "@/lib/text-normalization";
import {
  listToolQuestionCounts,
  type ToolCountKind,
} from "@/lib/relocation-tools-admin-api";

const KIND_LABEL: Record<ToolCountKind, string> = {
  question_bank: "Soru Bankası",
  decision_tree: "Karar Ağacı",
  calculator: "Hesaplayıcı",
};

const KIND_BADGE_VARIANT: Record<ToolCountKind, "default" | "secondary" | "outline"> = {
  question_bank: "default",
  decision_tree: "secondary",
  calculator: "outline",
};

const RelocationToolsQuestionCountsPage = () => {
  const [query, setQuery] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "relocation-tools", "question-counts"],
    queryFn: listToolQuestionCounts,
    staleTime: 0,
  });

  const rows = data ?? [];

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    return rows.filter(
      (row) => trIncludes(row.title_tr, query) || trIncludes(row.category, query),
    );
  }, [rows, query]);

  return (
    <AdminPageShell
      title="Araç Soru Sayıları"
      description="Her relocation aracında hızlı/normal modda kaç soru, karar ağacı düğümü veya form alanı olduğunu canlı DB'den gösterir."
      icon={ListChecks}
      accent="sky"
    >
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Araç adı veya kategori ara…"
          className="pl-9"
        />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      )}
      {isError && (
        <p className="text-sm text-destructive">Araç listesi yüklenemedi.</p>
      )}

      {!isLoading && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Araç Adı</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead className="text-right">Hızlı</TableHead>
              <TableHead className="text-right">Normal</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium">{row.title_tr}</TableCell>
                <TableCell className="text-muted-foreground">{row.category}</TableCell>
                <TableCell>
                  <Badge variant={KIND_BADGE_VARIANT[row.kind]}>{KIND_LABEL[row.kind]}</Badge>
                </TableCell>
                <TableCell className="text-right">{row.quick_count}</TableCell>
                <TableCell className="text-right">{row.detailed_count}</TableCell>
                <TableCell className="text-right font-semibold">{row.total_count}</TableCell>
                <TableCell>
                  <Badge variant={row.is_active ? "default" : "secondary"}>
                    {row.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">"{query}" için araç bulunamadı.</p>
      )}
    </AdminPageShell>
  );
};

export default RelocationToolsQuestionCountsPage;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- src/pages/admin/relocation/RelocationToolsQuestionCountsPage.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/relocation/RelocationToolsQuestionCountsPage.tsx src/pages/admin/relocation/RelocationToolsQuestionCountsPage.test.tsx
git commit -m "feat(admin): add relocation tools question-counts page"
```

### Task 4: Register the new route, nav entry, and route-meta pattern

**Files:**
- Modify: `src/pages/admin/relocation/routes.tsx`
- Modify: `src/lib/admin-shell/admin-route-meta.ts`
- Modify: `src/lib/admin-shell/admin-navigation-registry.ts`

**Interfaces:**
- Consumes: `RelocationToolsQuestionCountsPage` default export from Task 3.
- Produces: route `/admin/relocation-tools/soru-sayilari` reachable, registered in `ADMIN_ROUTE_PATTERNS` and `adminNavGroups`, so existing navigation-registry tests (`admin-navigation-registry.test.ts`) keep passing.

- [ ] **Step 1: Add the lazy import and route in `src/pages/admin/relocation/routes.tsx`**

Change:

```tsx
import { Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const RelocationJobsPage = lazy(() => import("./RelocationJobsPage"));
const RelocationCandidatesPage = lazy(() => import("./RelocationCandidatesPage"));

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
      Yükleniyor...
    </div>
  );
}

export const relocationAdminRoutes = (
  <Route path="relocation-ingestion">
    <Route
      index
      element={
        <Suspense fallback={<PageFallback />}>
          <RelocationJobsPage />
        </Suspense>
      }
    />
    <Route
      path="candidates"
      element={
        <Suspense fallback={<PageFallback />}>
          <RelocationCandidatesPage />
        </Suspense>
      }
    />
  </Route>
);
```

to:

```tsx
import { Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const RelocationJobsPage = lazy(() => import("./RelocationJobsPage"));
const RelocationCandidatesPage = lazy(() => import("./RelocationCandidatesPage"));
const RelocationToolsQuestionCountsPage = lazy(
  () => import("./RelocationToolsQuestionCountsPage"),
);

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
      Yükleniyor...
    </div>
  );
}

export const relocationAdminRoutes = (
  <>
    <Route path="relocation-ingestion">
      <Route
        index
        element={
          <Suspense fallback={<PageFallback />}>
            <RelocationJobsPage />
          </Suspense>
        }
      />
      <Route
        path="candidates"
        element={
          <Suspense fallback={<PageFallback />}>
            <RelocationCandidatesPage />
          </Suspense>
        }
      />
    </Route>
    <Route path="relocation-tools">
      <Route
        path="soru-sayilari"
        element={
          <Suspense fallback={<PageFallback />}>
            <RelocationToolsQuestionCountsPage />
          </Suspense>
        }
      />
    </Route>
  </>
);
```

- [ ] **Step 2: Add the new path to `ADMIN_ROUTE_PATTERNS` in `src/lib/admin-shell/admin-route-meta.ts`**

Find this block:

```ts
  "/admin/relocation-ingestion",
  "/admin/relocation-ingestion/candidates",
```

Change to:

```ts
  "/admin/relocation-ingestion",
  "/admin/relocation-ingestion/candidates",
  "/admin/relocation-tools/soru-sayilari",
```

- [ ] **Step 3: Add a nav entry in `src/lib/admin-shell/admin-navigation-registry.ts`**

Add `Table2` icon usage (already imported at the top of the file per existing import list — no new import line needed since `Table2` is already in the `lucide-react` import block). Find the `relocation-ingestion` group:

```ts
  {
    id: "relocation-ingestion",
    label: "Taşınma Veri Toplama",
    accent: "sky",
    items: [
      {
        id: "relocation-ingestion-jobs",
        label: "Toplama İşleri",
        shortLabel: "İşler",
        description: "Taşınma kaynak toplama işleri ve worker durumu.",
        to: "/admin/relocation-ingestion",
        icon: ListChecks,
        accent: "sky",
        aliases: ["relocation", "taşınma toplama", "ingestion", "relokasyon iş"],
      },
      {
        id: "relocation-ingestion-candidates",
        label: "Aday İnceleme",
        description: "Toplanan servis/bürokrasi/acil adaylarını onayla ve yayınla.",
        to: "/admin/relocation-ingestion/candidates",
        icon: ClipboardList,
        accent: "sky",
        aliases: ["taşınma aday", "relocation candidate", "aday onay"],
        activePaths: ["/admin/relocation-ingestion/candidates"],
      },
    ],
  },
```

Add a new item to this same group's `items` array (after `relocation-ingestion-candidates`):

```ts
  {
    id: "relocation-ingestion",
    label: "Taşınma Veri Toplama",
    accent: "sky",
    items: [
      {
        id: "relocation-ingestion-jobs",
        label: "Toplama İşleri",
        shortLabel: "İşler",
        description: "Taşınma kaynak toplama işleri ve worker durumu.",
        to: "/admin/relocation-ingestion",
        icon: ListChecks,
        accent: "sky",
        aliases: ["relocation", "taşınma toplama", "ingestion", "relokasyon iş"],
      },
      {
        id: "relocation-ingestion-candidates",
        label: "Aday İnceleme",
        description: "Toplanan servis/bürokrasi/acil adaylarını onayla ve yayınla.",
        to: "/admin/relocation-ingestion/candidates",
        icon: ClipboardList,
        accent: "sky",
        aliases: ["taşınma aday", "relocation candidate", "aday onay"],
        activePaths: ["/admin/relocation-ingestion/candidates"],
      },
      {
        id: "relocation-tools-question-counts",
        label: "Araç Soru Sayıları",
        shortLabel: "Soru Sayıları",
        description: "Her relocation aracında hızlı/normal modda kaç soru/alan var, canlı DB'den.",
        to: "/admin/relocation-tools/soru-sayilari",
        icon: Table2,
        accent: "sky",
        aliases: ["soru sayısı", "relocation tool questions", "araç soru", "quiz sayısı"],
      },
    ],
  },
```

- [ ] **Step 4: Run the navigation registry test suite to verify the new route is consistent**

Run: `npm run test -- src/lib/admin-shell/admin-navigation-registry.test.ts`
Expected: PASS — specifically the test "registry'deki tüm internal URL'ler App route ağacında geçerlidir" must pass now that `/admin/relocation-tools/soru-sayilari` exists in both `ADMIN_ROUTE_PATTERNS` and the nav registry.

- [ ] **Step 5: Run the full relocation admin test file set**

Run: `npm run test -- src/pages/admin/relocation src/lib/admin-shell`
Expected: PASS, no regressions.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/relocation/routes.tsx src/lib/admin-shell/admin-route-meta.ts src/lib/admin-shell/admin-navigation-registry.ts
git commit -m "feat(admin): register relocation tools question-counts route and nav entry"
```

### Task 5: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full lint check**

Run: `npm run lint`
Expected: no new errors introduced by this plan's files.

- [ ] **Step 2: Run the full test suite**

Run: `npm run test`
Expected: all tests PASS, including the new ones from Tasks 2–4.

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors in the new/modified files.

- [ ] **Step 4: Manual visual QA**

Run: `npm run dev`
- Visit `/relocation/tools` — confirm all 17 cards show hero images.
- Visit `/admin/relocation-tools/soru-sayilari` (log in as admin first) — confirm the table renders with correct Tip badges (Soru Bankası / Karar Ağacı / Hesaplayıcı) and non-zero counts for every row, and that the search box filters by name/category.
- Confirm the new nav entry "Araç Soru Sayıları" appears under "Taşınma Veri Toplama" in the admin sidebar.

- [ ] **Step 5: Final commit if any lint/build fixes were needed**

```bash
git add -A
git commit -m "chore: fix lint/build issues from relocation tools work"
```

(Skip this commit if Steps 1–3 passed clean with no changes needed.)
