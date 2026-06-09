-- ============================================================
-- Purpose:                Set security_invoker=on for the 4 muhasebe reporting views so caller RLS on
--                         expenses/incomes is enforced (was definer-style => potential RLS bypass).
-- Module:                 MUHASEBE
-- Risk level:             low-medium (changes whose RLS applies when reading the views)
-- Preconditions:          Postgres 15+ (live = 17). Views: v_muhasebe_kpi, v_muhasebe_by_person,
--                         v_muhasebe_by_category, v_muhasebe_cashflow_monthly. Source tables: expenses, incomes.
-- Rollback:               ALTER VIEW ... SET (security_invoker = off);  (see bottom)
-- Data migration required: no
-- Estimated lock impact:  negligible (view option flag)
-- Manual verification:    confirm the muhasebe admin dashboards (/admin/muhasebe/*) still render KPIs for an
--                         admin session. If expenses/incomes RLS denies the caller, views will return fewer rows —
--                         verify the muhasebe pages run under an authorized (admin) role.
-- ============================================================

ALTER VIEW public.v_muhasebe_kpi              SET (security_invoker = on);
ALTER VIEW public.v_muhasebe_by_person        SET (security_invoker = on);
ALTER VIEW public.v_muhasebe_by_category      SET (security_invoker = on);
ALTER VIEW public.v_muhasebe_cashflow_monthly SET (security_invoker = on);

-- ------------------------------------------------------------
-- ROLLBACK (if muhasebe dashboards lose data under intended roles):
--   ALTER VIEW public.v_muhasebe_kpi              SET (security_invoker = off);
--   ALTER VIEW public.v_muhasebe_by_person        SET (security_invoker = off);
--   ALTER VIEW public.v_muhasebe_by_category      SET (security_invoker = off);
--   ALTER VIEW public.v_muhasebe_cashflow_monthly SET (security_invoker = off);
-- ------------------------------------------------------------
