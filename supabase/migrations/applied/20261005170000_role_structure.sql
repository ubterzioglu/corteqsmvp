-- B4 · Rol yapısı katmanı (Excel ↔ mevcut roles eşlemesi).
--
-- Kaynak: docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md §2.3
--
-- Yeni tablo: role_structure
-- - roles.key AYNEN kalır (mevcut yapıya dokunulmaz)
-- - Üstüne yeni katman: Excel kodu ↔ eski rol eşlemesi
-- - Yeni kod başvuruda ayrıca kaydedilir
-- - Onayda mevcut admin_set_user_role çalışır
--
-- B7a: 19 sarı satırın hepsi onaylı → yayına girer (durum='onaylandi')

begin;

-- Yeni tablo oluştur
create table if not exists public.role_structure (
  id uuid primary key default gen_random_uuid(),
  ana_rol text not null,
  alt_rol text not null,
  uzmanlik text,
  yeni_kod text not null unique,
  eski_roles_key text references roles(key) on delete set null,
  durum text not null default 'oneri' check (durum in ('onaylandi', 'oneri')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- İndeksler
create index if not exists idx_role_structure_yeni_kod on public.role_structure(yeni_kod);
create index if not exists idx_role_structure_eski_roles_key on public.role_structure(eski_roles_key);
create index if not exists idx_role_structure_durum on public.role_structure(durum);

-- Yorumlar
comment on table public.role_structure is
  'B4: Excel rol yapısı ile mevcut roles tablosu arasında eşleme katmanı. '
  'yeni_kod: Excel''den gelen benzersiz kod. eski_roles_key: Mevcut roles.key ile eşleşme (nullable). '
  'durum: onaylandi (yayında) veya oneri (henüz yayında değil).';

-- B7a: 19 sarı satır placeholder (Excel'den gelecek, şimdilik boş)
-- Gerçek veri Excel dosyasından import edilecek.
-- Örnek yapı:
-- insert into public.role_structure (ana_rol, alt_rol, uzmanlik, yeni_kod, eski_roles_key, durum)
-- values
--   ('Sağlık', 'Doktor', 'Kardiyoloji', 'SAG-DOK-KAR', 'User_HealthcareDoctor', 'onaylandi'),
--   ('Sağlık', 'Diş Hekimi', 'Ortodonti', 'SAG-DIS-ORT', 'User_Dentist', 'onaylandi'),
--   ... (19 satır toplam)
-- ;

-- Şimdilik boş bırakıyoruz, Excel import'u ayrı bir işlem.
-- Eğer 19 satır zaten approval_requests'te onaylanmışsa, oradan çekilebilir.

-- A3.1: RLS enable + yetkiler
alter table public.role_structure enable row level security;

-- SELECT: authenticated kullanıcılar okuyabilir
drop policy if exists "role_structure_select_authenticated" on public.role_structure;
create policy "role_structure_select_authenticated"
  on public.role_structure
  for select
  to authenticated
  using (true);

-- INSERT/UPDATE/DELETE: yalnız service_role (admin panel)
revoke all on public.role_structure from public, anon, authenticated;
grant select on public.role_structure to authenticated;
grant all on public.role_structure to service_role;

commit;
