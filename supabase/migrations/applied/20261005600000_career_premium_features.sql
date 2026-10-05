-- A4 · CV görüntüleme + iş ilanı görüntüleme yetkileri (Premium kilidi hazırlığı)
--
-- İki yeni yetki: career.cv.view, career.listing.view_unlimited
-- scope_role='*' (tüm rollerde varsayılan kapalı, admin override ile açılabilir)
-- Davranış değişmez: herkes Free kalır, yalnız admin override ile açabilir.
--
-- Kaynak: docs/plans/2026-10-05-birlesik-plan-cv-ilan-rol-talepleri.md A4

begin;

-- ── 1. afs_features: iki yeni yetki ──────────────────────────────────────────
insert into public.afs_features (key, label, description, scope_role, scope, feature_type, is_active_globally, sort_order)
values
  ('career.cv.view', 'CV Görüntüleme', 'Başka üyelerin CV dosyalarını görüntüleme yetkisi (Premium)', '*', 'career', 'capability', true, 200),
  ('career.listing.view_unlimited', 'Sınırsız İş İlanı Görüntüleme', 'İş ilanı detaylarını sınırsız görüntüleme (Free: 5 ilan)', '*', 'career', 'capability', true, 201)
on conflict (key) do update set
  label = excluded.label,
  description = excluded.description,
  scope_role = excluded.scope_role,
  scope = excluded.scope,
  feature_type = excluded.feature_type,
  is_active_globally = excluded.is_active_globally,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ── 2. role_features: her aktif rol için is_enabled=false ────────────────────
-- Desen: archive/20260610181000_cadde300_002_feature_seed.sql:46-58
-- scope_role='*' olan yetkiler tüm rollere is_enabled=false ile eklenir.
-- Davranış: herkes Free kalır, admin override ile açabilir.
insert into public.role_features (role_id, feature_key, is_enabled)
select r.id, f.key, false
from public.roles r
cross join (values ('career.cv.view'), ('career.listing.view_unlimited')) as f(key)
where r.is_active = true
on conflict (role_id, feature_key) do update
set is_enabled = excluded.is_enabled, updated_at = now();

-- ── 3. Yorumlar ──────────────────────────────────────────────────────────────
comment on column public.afs_features.scope_role is
  'Yetkinin hangi rol tipine ait olduğu. "*" = tüm roller (admin override ile açılabilir).';

commit;
