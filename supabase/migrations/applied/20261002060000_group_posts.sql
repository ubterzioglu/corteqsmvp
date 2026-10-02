-- G16 · Dijital Gruplar: grup sayfası gönderileri + moderasyon (`group_posts`)
--
-- ═══ ÖLÇÜLEN GERÇEK (02.10, canlı) ═══
-- Tasarım §4 "mevcut tablolar: whatsapp_landing_comments / _likes / _follows"
-- diyor ve "comments tablosuna post_status, escalate_at eklenir" varsayıyordu.
-- ⚠️ ÜÇÜ DE CANLIDA YOK (to_regclass ölçümü) — G09'daki site_settings çürümesi
-- gibi bu öncül de çürüdü. `group_posts` SIFIRDAN kurulur (plan G16 ⚠️ notu).
--
-- ═══ İLK DURUM TABLOSU (tasarım §3.D birebir) ═══
--   Grubun doğrulanmış admini (ownership=verified + owner)      → published
--   O grupta güvenilir üye (≥ `trusted_member_min_approved_posts`
--     onaylı gönderi — group_settings)                          → published (sonradan denetlenir)
--   Diğer herkes, sahiplenilmiş (verified) grupta               → pending_group_admin (+48 saat escalate_at)
--   Diğer herkes, sahiplenilmemiş grupta (unclaimed/claim_pending) → pending_platform
--   pending_group_admin 48 saat sonra pending_platform olur — cron G22'de;
--   `group_posts_escalate_due()` bu batch'te, zamanlama G22'nin işi (kabul #7).
--
-- ═══ KARARLAR (tasarımın boş bıraktığı yerler) ═══
--   • Güvenilir üyenin "onaylı şikayet yok" yarısı G14'e ertelendi: `group_reports`
--     tablosu CANLIDA YOK (ölçüldü); şema uydurulmaz. G14 helper'ı genişletecek
--     (sözleşme testi bugünü kilitler: helper `group_reports`'a BAKAMAZ).
--   • Sahip yalnız KENDİ grubunun `pending_group_admin` kuyruğunu onaylar/rededer
--     (§11 "onay bekleyen gönderiler"). `published` gönderi kaldırma (sonradan
--     denetim) ve `pending_platform` kuyruğu YALNIZ platform moderatörünüdür —
--     tasarında sahibe verilmiş yetki yok, uydurulmadı.
--   • Gönderi yalnız `published` gruba açılır (hidden/suspended/removed grup
--     sayfası ziyaretçiye kapalı; kuyruk üretmek anlamsız) → group_not_published.
--   • `groups.post_max_chars` PAKETTE YOK — AJAN İHTİYATI teknik tavan (10000);
--     ürün kararı değil, depolama koruması. Değiştirmek tek SQL update.
--   • Bildirimler ("onay bekleyen n gönderi var", §9) G23'te.
--
-- ═══ SALT EKLEME ═══
-- Hiçbir mevcut tablo/kolon/politika değişmez. group_posts'a istemci yazamaz
-- (INSERT/UPDATE/DELETE grant YOK; tek yol security-definer RPC'ler) — bu yüzden
-- whatsapp_landings'teki gibi guard trigger GEREKMEZ (RLS + grant zaten kapalı).

begin;

-- ── 1) Gönderiler ────────────────────────────────────────────────────────────

create table if not exists public.group_posts (
  id uuid primary key default gen_random_uuid(),
  landing_id uuid not null references public.whatsapp_landings(id) on delete cascade,
  author_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null,
  post_status text not null default 'pending_platform'
    check (post_status in ('published', 'pending_group_admin', 'pending_platform', 'rejected', 'removed')),
  -- Yalnız pending_group_admin'da dolu: 48 saat sonra platform kuyruğuna düşer
  -- (tasarım §3.D; cron G22, fonksiyon group_posts_escalate_due).
  escalate_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.group_posts is
  'Grup sayfası gönderileri (G16, tasarım §3.D). İlk durum yazan sınıfına göre: '
  'doğrulanmış admin/güvenilir üye → published · sahipli grupta diğerleri → '
  'pending_group_admin (48 saat sonra pending_platform) · sahipsizde → '
  'pending_platform. Yazma yolu yalnız RPC''ler (grant yok).';

-- Grup sayfası akışı: bir grubun gönderileri, duruma göre
create index if not exists group_posts_landing_feed_idx
  on public.group_posts (landing_id, post_status, created_at desc);

-- G22 queue-escalation cron'unun taraması
create index if not exists group_posts_escalate_idx
  on public.group_posts (escalate_at)
  where post_status = 'pending_group_admin';

-- Güvenilir üye sayımı (grup + yazan + published)
create index if not exists group_posts_author_idx
  on public.group_posts (landing_id, author_user_id)
  where post_status = 'published';

drop trigger if exists trg_group_posts_updated_at on public.group_posts;
create trigger trg_group_posts_updated_at
  before update on public.group_posts
  for each row execute function public.update_updated_at_column();

alter table public.group_posts enable row level security;
revoke all on table public.group_posts from anon, authenticated;
grant select on table public.group_posts to anon, authenticated;

-- Okuma: published grubun published gönderisi herkese · yazar kendi gönderisini
-- (her durumda) · admin her şeyi · doğrulanmış grup admini kendi grubunun
-- kuyruğunu görür (§11).
drop policy if exists group_posts_select_visible on public.group_posts;
create policy group_posts_select_visible on public.group_posts
  for select to anon, authenticated
  using (
    (post_status = 'published' and exists (
      select 1 from public.whatsapp_landings w
      where w.id = group_posts.landing_id and w.listing_status = 'published'))
    or author_user_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists (
      select 1 from public.whatsapp_landings w
      where w.id = group_posts.landing_id
        and w.ownership = 'verified' and w.owner_user_id = auth.uid())
  );

-- ── 2) Ayarlar (G09 doktrini: eşikler tabloda) ──────────────────────────────

insert into public.group_settings (key, value)
values
  -- Tasarım §3.D: "pending_group_admin durumundaki gönderi 48 saat sonra
  -- otomatik pending_platform olur."
  ('groups.post_escalation_hours', '48'::jsonb),
  -- ⚠️ PAKETTE SAYI YOK — ajan ihtiyatı (teknik tavan, ürün eşiği değil).
  ('groups.post_max_chars', '10000'::jsonb)
on conflict (key) do nothing;

-- ── 3) Güvenilir üye (tasarım §3.D: GRUP bazlı, platform geneli değil) ──────

create or replace function public.group_member_is_trusted(p_landing_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    select count(*)
    from public.group_posts
    where landing_id = p_landing_id
      and author_user_id = p_user_id
      and post_status = 'published'
  ) >= public.group_setting_int('groups.trusted_member_min_approved_posts', 5);
$$;

comment on function public.group_member_is_trusted(uuid, uuid) is
  'Güvenilir üye: O GRUPTA ≥ trusted_member_min_approved_posts yayında gönderi '
  '(tasarım §3.D). ⚠️ "onaylı şikayet yok" yarısı G14''te eklenecek — '
  'group_reports tablosu henüz YOK (ölçüldü 02.10), şema uydurulmadı. '
  'G14 bu fonksiyonu genişletirken src/lib/group-posts-schema.test.ts güncellenir.';

revoke all on function public.group_member_is_trusted(uuid, uuid) from public, anon;
grant execute on function public.group_member_is_trusted(uuid, uuid) to authenticated;

-- ── 4) Gönderi oluşturma — ilk durum 4 sınıfı ───────────────────────────────

create or replace function public.group_post_create(p_landing_id uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_listing text;
  v_ownership text;
  v_owner uuid;
  v_initial text;
  v_escalate timestamptz;
  v_trusted boolean := false;
  v_max_chars integer;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'group_post_auth_required';
  end if;
  if p_body is null or btrim(p_body) = '' then
    raise exception 'group_post_body_required';
  end if;
  v_max_chars := public.group_setting_int('groups.post_max_chars', 10000);
  if length(p_body) > v_max_chars then
    raise exception 'group_post_too_long';
  end if;

  select listing_status, ownership, owner_user_id
    into v_listing, v_ownership, v_owner
  from public.whatsapp_landings
  where id = p_landing_id;
  if not found then
    raise exception 'group_not_found';
  end if;
  if v_listing <> 'published' then
    raise exception 'group_not_published';
  end if;

  -- İlk durum tablosu (tasarım §3.D)
  if v_ownership = 'verified' and v_owner = v_uid then
    v_initial := 'published';                              -- doğrulanmış grup admini
  else
    v_trusted := public.group_member_is_trusted(p_landing_id, v_uid);
    if v_trusted then
      v_initial := 'published';                            -- güvenilir üye (sonradan denetlenir)
    elsif v_ownership = 'verified' then
      v_initial := 'pending_group_admin';                  -- sahipli grupta diğerleri
      v_escalate := now() + make_interval(
        hours => public.group_setting_int('groups.post_escalation_hours', 48));
    else
      v_initial := 'pending_platform';                     -- sahipsiz (unclaimed/claim_pending)
    end if;
  end if;

  insert into public.group_posts (landing_id, author_user_id, body, post_status, escalate_at)
  values (p_landing_id, v_uid, btrim(p_body), v_initial, v_escalate)
  returning id into v_id;

  return jsonb_build_object(
    'post_id', v_id,
    'post_status', v_initial,
    'escalate_at', v_escalate,
    'trusted', v_trusted);
end;
$$;

comment on function public.group_post_create(uuid, text) is
  'Grup sayfasına gönderi (G16). İlk durum tasarım §3.D: verified admin → '
  'published · güvenilir üye → published · sahipli grupta diğer → '
  'pending_group_admin (escalate_at +48 saat) · sahipsizde → pending_platform. '
  'Yalnız published gruba açılır.';

revoke all on function public.group_post_create(uuid, text) from public, anon;
grant execute on function public.group_post_create(uuid, text) to authenticated;

-- ── 5) Moderasyon (sahip kuyruğu + platform moderatörü) ─────────────────────

create or replace function public.group_post_review(
  p_post_id uuid,
  p_decision text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_post public.group_posts%rowtype;
  v_ownership text;
  v_owner uuid;
  v_is_admin boolean;
  v_is_owner boolean;
  v_new_status text;
begin
  if not public.is_admin(v_uid) then
    -- admin değilse en azından kimliği olmalı
    if v_uid is null then
      raise exception 'group_post_auth_required';
    end if;
  end if;
  if p_decision is null or p_decision not in ('approve', 'reject', 'remove') then
    raise exception 'group_post_invalid_decision';
  end if;

  select * into v_post from public.group_posts where id = p_post_id for update;
  if not found then
    raise exception 'group_post_not_found';
  end if;

  select ownership, owner_user_id into v_ownership, v_owner
  from public.whatsapp_landings where id = v_post.landing_id;

  v_is_admin := public.is_admin(v_uid);
  v_is_owner := (v_ownership = 'verified' and v_owner = v_uid);

  -- Geçiş + yetki matrisi:
  --   approve/reject: pending_group_admin → sahip VEYA admin · pending_platform → yalnız admin
  --   remove: published → yalnız admin (sonradan denetim; sahibe tasarım yetki vermiyor)
  if p_decision = 'remove' then
    if v_post.post_status <> 'published' then
      raise exception 'group_post_invalid_transition';
    end if;
    if not v_is_admin then
      raise exception 'group_post_forbidden';
    end if;
    v_new_status := 'removed';
  elsif v_post.post_status not in ('pending_group_admin', 'pending_platform') then
    raise exception 'group_post_invalid_transition';
  elsif v_post.post_status = 'pending_platform' and not v_is_admin then
    raise exception 'group_post_forbidden';
  elsif v_post.post_status = 'pending_group_admin' and not (v_is_admin or v_is_owner) then
    raise exception 'group_post_forbidden';
  else
    v_new_status := case when p_decision = 'approve' then 'published' else 'rejected' end;
  end if;

  update public.group_posts
     set post_status = v_new_status,
         escalate_at = null,
         reviewed_by = v_uid,
         reviewed_at = now(),
         review_note = coalesce(p_note, review_note)
   where id = p_post_id;

  return jsonb_build_object('post_id', p_post_id, 'post_status', v_new_status);
end;
$$;

comment on function public.group_post_review(uuid, text, text) is
  'Gönderi moderasyonu (G16): approve/reject kuyruklarda (pending_group_admin → '
  'sahip veya admin · pending_platform → yalnız admin), remove published''da '
  '(yalnız admin — sonradan denetim). Sahibin published kaldırma yetkisi '
  'tasarımda YOK, uydurulmadı.';

revoke all on function public.group_post_review(uuid, text, text) from public, anon;
grant execute on function public.group_post_review(uuid, text, text) to authenticated;

-- ── 6) 48 saat eskalasyonu (kabul #7 — cron G22'de bağlanır) ────────────────

create or replace function public.group_posts_escalate_due()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.group_posts
     set post_status = 'pending_platform',
         escalate_at = null
   where post_status = 'pending_group_admin'
     and escalate_at is not null
     and escalate_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.group_posts_escalate_due() is
  'Süresi dolan pending_group_admin gönderileri pending_platform''a taşır '
  '(tasarım §3.D: 48 saat). G22 queue-escalation cron''u bunu saatlik çağırır; '
  'yetki service_role (pg_cron/edge).';

revoke all on function public.group_posts_escalate_due() from public, anon, authenticated;
grant execute on function public.group_posts_escalate_due() to service_role;

commit;
