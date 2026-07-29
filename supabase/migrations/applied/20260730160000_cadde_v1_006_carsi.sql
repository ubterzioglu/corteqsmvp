-- Cadde V1 (6/6): Çarşı ilan akışının tamamlanması + monetizasyon altyapısı.
--
-- carsi_items.image_urls DB'de VARDI (text[], max 6, RPC valide ediyordu) ama hiçbir forma
-- bağlı değildi — kullanıcı ilanına görsel ekleyemiyordu. Bu migration eksik alanları
-- tamamlar ve ücretli moda geçişi kod değişikliği olmadan mümkün kılar.
--
-- ÖDEME: V1'de ilan vermek ÜCRETSİZ. `cadde.carsi.paid_mode` (mig 000'da false) true
-- yapıldığında yeni ilanlar 'draft' + payment_status='pending' olarak yaratılır ve
-- yayına GİRMEZ; frontend "Ödemenizi tamamlayarak ilanınızı yayınlayabilirsiniz." gösterir.
-- Gerçek Stripe entegrasyonu Faz 3'te; şu an yalnız kapı hazır.
--
-- KAPSAM: `cadde.carsi.scope` = "global" (mig 000). Ülke bazlı Çarşı açıldığında "country"
-- yapılır; liste sorgusu o zaman kullanıcının ülkesine daralır. V1'de global aktif.

begin;

-- ── 1. Eksik alanlar ─────────────────────────────────────────────────────────
alter table public.carsi_items
  add column if not exists video_url text,
  add column if not exists contact_value text,
  add column if not exists payment_status text not null default 'free',
  add column if not exists paid_until timestamptz;

do $$ begin
  alter table public.carsi_items
    add constraint carsi_items_payment_status_check
    check (payment_status in ('free', 'pending', 'paid', 'refunded'));
exception when duplicate_object then null; end $$;

comment on column public.carsi_items.contact_value is
  'contact_mode phone/email ise iletişim değeri. platform modunda NULL — mesajlaşma platform üzerinden.';
comment on column public.carsi_items.payment_status is
  'free = ücretsiz dönem (cadde.carsi.paid_mode=false). pending = ödeme bekliyor, ilan yayında değil.';

-- ── 2. create_carsi_item_v1: video + iletişim değeri + ücretli mod ───────────
drop function if exists public.create_carsi_item_v1(text, text, text, numeric, text, text, text, text[], text, text);

create or replace function public.create_carsi_item_v1(
  p_category_key text,
  p_title text,
  p_description text,
  p_price_amount numeric default null,
  p_price_currency text default null,
  p_country text default null,
  p_city text default null,
  p_image_urls text[] default '{}',
  p_contact_mode text default 'platform',
  p_diaspora_key text default 'tr',
  p_video_url text default null,
  p_contact_value text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_title text := trim(coalesce(p_title, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_currency text := upper(nullif(trim(coalesce(p_price_currency, '')), ''));
  v_images text[] := coalesce(p_image_urls, '{}');
  v_video text := nullif(trim(coalesce(p_video_url, '')), '');
  v_contact text := nullif(trim(coalesce(p_contact_value, '')), '');
  v_diaspora text := coalesce(nullif(trim(coalesce(p_diaspora_key, '')), ''), 'tr');
  v_country_id uuid;
  v_city_id uuid;
  v_active_count integer;
  v_item_id uuid;
  v_url text;
  v_paid_mode boolean := public.cadde_setting_bool('cadde.carsi.paid_mode', false);
  v_status text;
  v_payment text;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  if public.is_cadde_banned(v_uid) then
    raise exception 'cadde_banned';
  end if;

  if v_diaspora not in ('tr', 'in', 'cn', 'ph') then
    raise exception 'cadde_invalid_diaspora';
  end if;

  if not public.is_cadde_profile_complete(v_uid) then
    if public.cadde_phone_required() and not public.is_phone_verified(v_uid) then
      raise exception 'phone_verification_required';
    end if;
    raise exception 'cadde_profile_incomplete';
  end if;

  if not public.has_cadde_feature(v_uid, 'cadde.carsi.create') then
    raise exception 'cadde_carsi_permission_denied';
  end if;

  if not exists (select 1 from public.carsi_categories where key = p_category_key and is_active = true) then
    raise exception 'cadde_invalid_carsi_category';
  end if;

  if length(v_title) < 3 or length(v_title) > 100 then
    raise exception 'cadde_invalid_carsi_title';
  end if;

  if length(v_description) < 1 or length(v_description) > 2000 then
    raise exception 'cadde_invalid_carsi_description';
  end if;

  if p_price_amount is not null and p_price_amount < 0 then
    raise exception 'cadde_invalid_carsi_price';
  end if;

  if v_currency is not null and v_currency !~ '^[A-Z]{3}$' then
    raise exception 'cadde_invalid_carsi_currency';
  end if;

  if p_contact_mode not in ('platform', 'phone', 'email') then
    raise exception 'cadde_invalid_carsi_contact_mode';
  end if;

  -- phone/email seçildiyse iletişim değeri ZORUNLU; aksi halde ilan sahibine ulaşılamaz.
  if p_contact_mode = 'phone' then
    if v_contact is null or v_contact !~ '^\+?[0-9 ()-]{7,20}$' then
      raise exception 'cadde_invalid_carsi_contact';
    end if;
  elsif p_contact_mode = 'email' then
    if v_contact is null or v_contact !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$' then
      raise exception 'cadde_invalid_carsi_contact';
    end if;
  else
    v_contact := null;
  end if;

  if cardinality(v_images) > 6 then
    raise exception 'cadde_invalid_carsi_image';
  end if;
  foreach v_url in array v_images loop
    if v_url !~ '^https?://' then
      raise exception 'cadde_invalid_carsi_image';
    end if;
  end loop;

  if v_video is not null then
    if not public.cadde_setting_bool('cadde.media.video_enabled', true) then
      raise exception 'cadde_video_disabled';
    end if;
    if v_video !~ '^https://' then
      raise exception 'cadde_invalid_carsi_video';
    end if;
  end if;

  -- D-07: aktif ilan limiti (admin/mod muaf; premium kademesi ayrı karar).
  if not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    select count(*) into v_active_count
    from public.carsi_items
    where owner_user_id = v_uid
      and deleted_at is null
      and status in ('draft', 'published', 'paused')
      and (expires_at is null or expires_at > now());
    if v_active_count >= public.cadde_setting_int('cadde.carsi.active_item_limit', 5) then
      raise exception 'cadde_carsi_item_limit';
    end if;
  end if;

  select c.id into v_country_id
  from public.cadde_countries c
  where c.name = nullif(trim(coalesce(p_country, '')), '') and c.is_active = true
  limit 1;

  select ci.id into v_city_id
  from public.cadde_cities ci
  where ci.name = nullif(trim(coalesce(p_city, '')), '')
    and (v_country_id is null or ci.country_id = v_country_id)
    and ci.is_active = true
  limit 1;

  -- Ücretli mod açıkken ilan taslak kalır ve ödeme bekler; kapalıyken doğrudan yayında.
  if v_paid_mode and not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    v_status := 'draft';
    v_payment := 'pending';
  else
    v_status := 'published';
    v_payment := 'free';
  end if;

  insert into public.carsi_items (
    owner_user_id, diaspora_key, category_key, title, description,
    price_amount, price_currency, country_id, city_id,
    image_urls, video_url, contact_mode, contact_value,
    status, moderation_status, payment_status, expires_at
  )
  values (
    v_uid, v_diaspora, p_category_key, v_title, v_description,
    p_price_amount, v_currency, v_country_id, v_city_id,
    v_images, v_video, p_contact_mode, v_contact,
    v_status, 'approved', v_payment,
    now() + make_interval(days => public.cadde_setting_int('cadde.carsi.default_expiry_days', 30))
  )
  returning id into v_item_id;

  return v_item_id;
end;
$$;

revoke all on function public.create_carsi_item_v1(text, text, text, numeric, text, text, text, text[], text, text, text, text) from public, anon;
grant execute on function public.create_carsi_item_v1(text, text, text, numeric, text, text, text, text[], text, text, text, text) to authenticated;

commit;
