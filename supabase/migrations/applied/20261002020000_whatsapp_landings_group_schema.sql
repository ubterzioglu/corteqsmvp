-- G10 · `whatsapp_landings` şema genişletme (Dijital Gruplar motoru)
--
-- ═══ BU MIGRATION SALT EKLEMEDİR — VE BU BİLİNÇLİ BİR SAPMADIR ═══
--
-- Batch spec'i `member_approved` / `admin_approved` kolonlarının **kaldırılmasını**
-- ve `status`'ün `listing_status`'e devredilmesini söylüyor. Ölçüldü (02.10):
--
--   • `member_approved` / `admin_approved` repoda **9 dosyada** kullanılıyor:
--     `WhatsAppLandingsModeration.tsx` (yönetici onay seçimi), `LandingApprovalBadges.tsx`,
--     `WhatsAppLandingEditorPage.tsx`, `AddWhatsAppPage.tsx`, `whatsapp-landings.ts`,
--     `whatsapp-landing-presentation.ts` ve testleri.
--   • Canlı frontend paketi **hâlâ eski koddur** (G03b deploy edilmedi; ölçüldü:
--     yayındaki chunk `whatsapp_landings` taban tablosunu `select("*")` ile okuyor).
--   • `catalog_sync_whatsapp_landing` da `v_landing.admin_approved` okuyor.
--
-- Kolonları şimdi düşürmek canlı siteyi kırardı. Bu yüzden G03a/b/c deseni
-- uygulanıyor: **önce hedefi kur (bu migration), göç et, sonra eskisini kaldır.**
-- Düşürme ayrı bir batch'e bırakıldı (KALANLAR → G10c).
--
-- ═══ DEĞERLERİN KAYNAĞI ═══
-- Durum adları ve geçişleri `docs/dijital-gruplar/02_motor-tasarimi.md` §2'den
-- (`pending_review · published · rejected · hidden · suspended · removed`),
-- sahiplik §3.B'den (`unclaimed · claim_pending · verified`), gizleme sebepleri
-- §2 geçiş tablosundan (`link_dead · reports · owner_request`). Uydurulan değer YOK.
--
-- ⚠️ Şehir/ülke `geo_*` tablolarından gelir, `cadde_*`'tan DEĞİL (CLAUDE.md kuralı 3).
-- ⚠️ `short_description` BU MIGRATION'DA DOLDURULMAZ: açıklamaların 160 karaktere
-- indirilmesi ekip kararıdır (G11 · U07).

begin;

-- ── 1) Platform ve davet kodu ───────────────────────────────────────────────

alter table public.whatsapp_landings
  add column if not exists platform text not null default 'whatsapp',
  add column if not exists invite_code text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.whatsapp_landings'::regclass and conname = 'whatsapp_landings_platform_chk'
  ) then
    alter table public.whatsapp_landings
      add constraint whatsapp_landings_platform_chk
      check (platform in ('whatsapp', 'telegram', 'discord'));
  end if;
end $$;

-- ── 2) Listeleme durumu ve sahiplik ─────────────────────────────────────────

alter table public.whatsapp_landings
  add column if not exists listing_status text not null default 'pending_review',
  add column if not exists hidden_reason text,
  add column if not exists ownership text not null default 'unclaimed',
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists submitted_by uuid references auth.users(id) on delete set null,
  add column if not exists submitted_as_admin boolean not null default false,
  add column if not exists review_flags text[] not null default '{}'::text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.whatsapp_landings'::regclass and conname = 'whatsapp_landings_listing_status_chk'
  ) then
    alter table public.whatsapp_landings
      add constraint whatsapp_landings_listing_status_chk
      check (listing_status in ('pending_review', 'published', 'rejected', 'hidden', 'suspended', 'removed'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.whatsapp_landings'::regclass and conname = 'whatsapp_landings_ownership_chk'
  ) then
    alter table public.whatsapp_landings
      add constraint whatsapp_landings_ownership_chk
      check (ownership in ('unclaimed', 'claim_pending', 'verified'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.whatsapp_landings'::regclass and conname = 'whatsapp_landings_hidden_reason_chk'
  ) then
    alter table public.whatsapp_landings
      add constraint whatsapp_landings_hidden_reason_chk
      check (hidden_reason is null or hidden_reason in ('link_dead', 'reports', 'owner_request'));
  end if;
end $$;

-- ── 3) Konum, içerik, yaşam döngüsü ─────────────────────────────────────────

alter table public.whatsapp_landings
  add column if not exists is_global boolean not null default false,
  add column if not exists country_code text,
  add column if not exists city_id uuid references public.geo_cities(id) on delete set null,
  add column if not exists short_description text,
  add column if not exists rules text,
  add column if not exists strike_count integer not null default 0,
  add column if not exists published_at timestamptz,
  add column if not exists suspended_until timestamptz,
  add column if not exists owner_renewal_due timestamptz,
  add column if not exists link_fail_count integer not null default 0,
  add column if not exists link_checked_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.whatsapp_landings'::regclass and conname = 'whatsapp_landings_short_description_chk'
  ) then
    alter table public.whatsapp_landings
      add constraint whatsapp_landings_short_description_chk
      check (short_description is null or char_length(short_description) <= 160);
  end if;
end $$;

-- ── 4) Davet kodu normalizasyonu ────────────────────────────────────────────
--
-- Tekilleştirme anahtarı davet KODUDUR, link değil: aynı grup farklı yazımlarla
-- (http/https, sondaki eğik çizgi, sorgu dizesi) iki kez eklenebilirdi.
-- Desteklenen biçimler tasarım §3.A'dan: chat.whatsapp.com · t.me/telegram.me ·
-- discord.gg/discord.com/invite.

create or replace function public.group_invite_code(p_url text)
returns text
language sql
immutable
as $$
  select nullif(
    (regexp_match(
      coalesce(p_url, ''),
      '(?:chat\.whatsapp\.com|t\.me|telegram\.me|discord\.gg|discord\.com/invite)/\+?([A-Za-z0-9_-]+)',
      'i'
    ))[1],
    ''
  );
$$;

comment on function public.group_invite_code(text) is
  'Davet linkinden tekilleştirme anahtarını çıkarır (G10). Desteklenen alan adları '
  'tasarım §3.A ile aynıdır; başka alan adı null döner.';

-- ── 5) Mevcut 10 kaydın mekanik geri doldurması ─────────────────────────────
--
-- ⚠️ Yalnız MEKANİK alanlar dolduruluyor. Kategori düzeltmesi, `Global`/`Genel`
-- konumların gerçek ülkeye eşlenmesi, boş linkli 2 grubun akıbeti ve
-- açıklamaların 160'a indirilmesi **ekip kararıdır** (G11 · U07) — burada
-- tahmin yapılmaz.

update public.whatsapp_landings
set
  invite_code = coalesce(invite_code, public.group_invite_code(whatsapp_link)),
  platform = case
    when whatsapp_link ilike '%chat.whatsapp.com%' then 'whatsapp'
    when whatsapp_link ilike '%t.me%' or whatsapp_link ilike '%telegram.me%' then 'telegram'
    when whatsapp_link ilike '%discord.gg%' or whatsapp_link ilike '%discord.com/invite%' then 'discord'
    else platform
  end,
  listing_status = case status
    when 'approved' then 'published'
    when 'rejected' then 'rejected'
    else 'pending_review'
  end,
  published_at = case when status = 'approved' then coalesce(published_at, created_at) else published_at end,
  submitted_by = coalesce(submitted_by, user_id)
where true;

-- Tekilleştirme: aynı davet kodu iki kez listelenemez. Kısmi indeks — kodu
-- çıkarılamayan (boş linkli) kayıtlar kapsam dışıdır.
create unique index if not exists whatsapp_landings_invite_code_uniq
  on public.whatsapp_landings (invite_code)
  where invite_code is not null;

create index if not exists whatsapp_landings_listing_status_idx
  on public.whatsapp_landings (listing_status, published_at desc);

commit;
