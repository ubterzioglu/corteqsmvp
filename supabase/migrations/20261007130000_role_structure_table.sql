-- B4 · Rol yapısı tablosu (Excel'den seed, mevcut roles ile eşleme)
--
-- ═══ KAYNAK ═══
--   CorteQS_Rol_Tablosu_v2.xlsx → "Yeni Rol Yapısı" sayfası
--   259 satır: 7 ana rol, 49 alt rol, 252 uzmanlık etiketi, 19 ÖNERİ
--
-- ═══ TASARIM ═══
--   Mevcut `roles` tablosu DEĞİŞMEZ (flat yapı korunur).
--   Yeni `role_structure` tablosu Excel'deki hiyerarşiyi saklar:
--     - ana_rol: "Danışman", "İşletme" vb.
--     - alt_rol: "Gayrimenkul", "Vize & Göçmenlik" vb.
--     - uzmanlik: "Ev kiralama", "Öğrenci vizesi" vb. (etiket, 3. seviye)
--     - yeni_kod: Excel'deki "Yeni Admin Rol Kodu" (örn. consultant.gayrimenkul.ev_kiralama)
--     - eski_kod: Eski dropdown kodu (varsa)
--     - durum: 'onaylandi' veya 'oneri'
--
-- ═══ İLİŞKİ ═══
--   role_structure → roles: yeni_kod → roles.key eşlemesi
--   Başvurularda: approval_requests.payload'a {new_code, specialties} yazılır
--   Onayda: mevcut admin_set_user_role çalışır (roles.key değişmez)
--
-- ═══ SALT EKLEME ═══
--   Tablo/kolon düşürmez. Yalnızca yeni tablo + seed.

begin;

-- ── 1) role_structure tablosu ─────────────────────────────────────────────────

create table if not exists public.role_structure (
  id uuid primary key default gen_random_uuid(),
  ana_rol text not null,
  alt_rol text not null,
  uzmanlik text not null default '',
  yeni_kod text not null unique,
  eski_roles_key text,
  durum text not null default 'onaylandi' check (durum in ('onaylandi', 'oneri')),
  created_at timestamptz not null default now()
);

comment on table public.role_structure is
  'B4: Excel rol yapısı (CorteQS_Rol_Tablosu_v2.xlsx). Hiyerarşik bilgi saklar: '
  'ana_rol → alt_rol → uzmanlık. Mevcut roles tablosu değişmez; başvurularda bu '
  'tablodaki bilgiler kullanılır. yeni_kod → roles.key eşlemesi ile ilişkilendirilir.';

create index if not exists role_structure_ana_rol_idx on public.role_structure (ana_rol);
create index if not exists role_structure_alt_rol_idx on public.role_structure (alt_rol);
create index if not exists role_structure_durum_idx on public.role_structure (durum);

alter table public.role_structure enable row level security;
revoke all on table public.role_structure from public, anon;
grant select on table public.role_structure to authenticated;

drop policy if exists role_structure_select_authenticated on public.role_structure;
create policy role_structure_select_authenticated on public.role_structure
  for select to authenticated
  using (true);

-- ── 2) Seed: Excel'den 259 satır ──────────────────────────────────────────────
-- NOT: Bu migration manuel seed içermez. Seed betiği ayrı:
--   scripts/seed-role-structure-from-excel.py
-- Betik Excel'i okur, INSERT INTO role_structure çalıştırır.
-- Migration sonrası betiği çalıştır: python scripts/seed-role-structure-from-excel.py

-- ── 3) Yardımcı fonksiyonlar ──────────────────────────────────────────────────

create or replace function public.get_role_structure()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'ana_rol', ana_rol,
        'alt_rol', alt_rol,
        'uzmanlik', uzmanlik,
        'yeni_kod', yeni_kod,
        'eski_roles_key', eski_roles_key,
        'durum', durum
      )
      order by ana_rol, alt_rol, uzmanlik
    ),
    '[]'::jsonb
  )
  from public.role_structure;
$$;

comment on function public.get_role_structure() is
  'B4: Rol yapısı hiyerarşisini döner (ana_rol → alt_rol → uzmanlık). '
  'Yalnız onaylanmış roller (durum=onaylandi) UI''da gösterilir.';

revoke all on function public.get_role_structure() from public, anon;
grant execute on function public.get_role_structure() to authenticated;

create or replace function public.get_role_structure_by_ana_rol(p_ana_rol text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'alt_rol', alt_rol,
        'uzmanlik', uzmanlik,
        'yeni_kod', yeni_kod,
        'eski_roles_key', eski_roles_key,
        'durum', durum
      )
      order by alt_rol, uzmanlik
    ),
    '[]'::jsonb
  )
  from public.role_structure
  where ana_rol = p_ana_rol and durum = 'onaylandi';
$$;

comment on function public.get_role_structure_by_ana_rol(text) is
  'B4: Belirli ana rolün alt rol ve uzmanlıklarını döner. '
  'Yalnız onaylanmış roller (durum=onaylandi).';

revoke all on function public.get_role_structure_by_ana_rol(text) from public, anon;
grant execute on function public.get_role_structure_by_ana_rol(text) to authenticated;

create or replace function public.get_ana_roller()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select array_agg(distinct ana_rol order by ana_rol)
  from public.role_structure
  where durum = 'onaylandi';
$$;

comment on function public.get_ana_roller() is
  'B4: Benzersiz ana rol listesi (sıralı). Yalnız onaylanmış roller.';

revoke all on function public.get_ana_roller() from public, anon;
grant execute on function public.get_ana_roller() to authenticated;

commit;
