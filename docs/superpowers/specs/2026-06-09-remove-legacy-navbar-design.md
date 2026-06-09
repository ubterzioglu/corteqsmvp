# Remove Legacy Navbar — Design

**Date:** 2026-06-09
**Branch:** rebuild/catalog-flat-role-afs

## Problem

`src/components/Navbar.tsx` is the legacy site header. It is still imported and
rendered (`<Navbar />`) in 34 page components under `src/pages/`. Every public
route in the app is wrapped in a single `<Route element={<PublicLayout />}>`
block (`src/App.tsx:131-216`), and `PublicLayout` already renders the canonical
`SiteHeader`. The 34 pages that additionally render their own `<Navbar />`
therefore display **two stacked headers** — the canonical `SiteHeader` on top
and the legacy `Navbar` bleeding through below (observed on `mvp.corteqs.net/legal/terms`).

The legacy `Navbar` must be removed everywhere; `SiteHeader` (via `PublicLayout`)
remains the sole header.

## Approach: Remove + Delete

1. **Per-page edits (34 files in `src/pages/`):** remove the
   `import Navbar from "@/components/Navbar";` line and the `<Navbar />` JSX node.
   Collapse any wrapper fragment/element that becomes empty or redundant. Preserve
   existing top-padding (e.g. `pt-24`) — `SiteHeader` is also `fixed`, so the
   spacing remains correct.
2. **Delete** `src/components/Navbar.tsx`.
3. **Doc cleanup:** remove the stale `<li>src/components/Navbar.tsx</li>` entry in
   `src/lib/dashboard/workspace-doc-pages.tsx:430`.
4. **Leave `ref/global-network-bridge/**` untouched** — reference copy, not built.
5. **Verify:** `npm run lint` + `npm run build` to confirm no dangling imports/JSX.

## Affected pages (34)

Onboarding, CityAmbassadors, PostGenerator, Feed, ContactPage, Consultants,
JobBoard, WhatsAppGroups, WhatsAppGroupLanding, MapSearch, Events, Associations,
IndependentProfilePage, DiasporaPeople, VolunteerMentorDetail, RelocationEngine,
RegisterDiaspora, RadioSongRequest, RadarDetail, Pricing, LegalLayout,
HospitalAppointment, EventDetail, Dashboards, ConsultantDetail, CityNews, Career,
Businesses, BusinessDetail, Bloggers, BloggerDetail, AssociationDetail,
AmbassadorDetail, AITwin.

## Edge Cases

- Pages where `<Navbar />` is the first child of a fragment with siblings: remove
  only the Navbar node, keep the fragment and siblings.
- Pages that import `Navbar` but (after a prior edit) no longer render it: still
  remove the unused import.
- No `Navbar.test.tsx` exists — nothing to delete there.

## Out of Scope

- No changes to `SiteHeader`, `PublicLayout`, or routing.
- No `ref/global-network-bridge/**` changes.
