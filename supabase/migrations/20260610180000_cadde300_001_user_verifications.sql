-- Cadde 3.0 Faz 2 (1/4): Telefon doğrulama truth source + Cadde ayar tablosu.
-- D-03 kararı: OTP sağlayıcısı henüz seçilmedi → altyapı kurulur, telefon zorunluluğu
-- cadde_settings üzerinden KAPALI başlar (stub). Sağlayıcı seçilince yalnız Edge
-- Function eklenir ve flag true yapılır; şema değişikliği gerekmez.

begin;

-- Telefon doğrulamanın TEK truth source'u. Raw `phone` attribute'u asla doğrulama sayılmaz.
create table if not exists public.user_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone_e164 text,
  phone_verified_at timestamptz,
  phone_country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_verifications is
  'Cadde 3.0: telefon doğrulama truth source. Private tablo — client erişimi yok; okuma yalnız security-definer RPC''ler (is_phone_verified, get_cadde_actor_context) üzerinden boolean olarak.';

-- Private: RLS açık, policy YOK (deny-all) + client rolleri için grant kaldırılır.
alter table public.user_verifications enable row level security;
revoke all on table public.user_verifications from anon, authenticated;

-- Cadde modül ayarları (admin/migration tarafından yönetilir; client erişimi yok).
create table if not exists public.cadde_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

comment on table public.cadde_settings is
  'Cadde 3.0 modül ayarları. phone_verification_required: D-03 stub kararıyla false; OTP sağlayıcısı devreye alınınca true yapılır.';

alter table public.cadde_settings enable row level security;
revoke all on table public.cadde_settings from anon, authenticated;

insert into public.cadde_settings (key, value)
values ('cadde.phone_verification_required', 'false'::jsonb)
on conflict (key) do nothing;

commit;
