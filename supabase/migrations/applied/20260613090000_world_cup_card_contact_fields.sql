-- Dünya Kupası işletme kartı: telefon + harita + görsel alanları.
--
-- Kart tasarımı (2026-06-12): görsel kartın hero banner'ı olur, telefon tel:
-- butonu, harita adresten otomatik Google Maps linki (toMapHref). Bu yüzden:
--   * world_cup_registrations'a phone (zorunlu) ve image_path (opsiyonel) eklenir,
--   * adres artık başvuruda zorunludur (eski kayıtlar null kalabilir, UI tolere eder),
--   * görseller yeni public 'world-cup-images' bucket'ına kullanıcı klasörüne yüklenir.
--
-- Telefon BİLİNÇLİ olarak user_profile_attributes'a yazılmaz: afs_attributes'ta
-- 'phone' private_storage/owner görünürlüklüdür (mig 20260609101100). Kart telefonu
-- doğrudan bu tablodan okur — kullanıcı telefonu kamuya açık kart için verir.
--
-- Kurallar değişmez: mutasyon RPC-only, hata kodları 'worldcup_*'
-- (yeni kodlar src/lib/dunya-kupasi-schemas.ts Türkçe mesaj haritasına eklendi).

begin;

-- ─── 1. Kolonlar ─────────────────────────────────────────────────────────────

alter table public.world_cup_registrations
  add column if not exists phone text,
  add column if not exists image_path text;

-- ─── 2. Görsel bucket'ı (public; 5MB; yalnız görsel mime) ────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'world-cup-images',
  'world-cup-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Yükleme: giriş yapmış kullanıcı yalnız kendi <uid>/ klasörüne yazabilir.
drop policy if exists "World cup images user upload" on storage.objects;
create policy "World cup images user upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'world-cup-images'
    and name like auth.uid()::text || '/%'
  );

-- Temizlik: admin silebilir (public bucket — select policy gerekmez, publicUrl servis eder).
drop policy if exists "World cup images admin delete" on storage.objects;
create policy "World cup images admin delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'world-cup-images'
    and public.is_admin(auth.uid())
  );

-- ─── 3. Başvuru RPC'si: telefon zorunlu, adres zorunlu, görsel opsiyonel ─────
-- İmza değiştiği için eski fonksiyon DROP edilir (PostgREST overload çakışması olmasın).

drop function if exists public.create_world_cup_registration_v1(text, text, text, text, text, boolean, text);

create or replace function public.create_world_cup_registration_v1(
  p_business_name text,
  p_category_role_key text,
  p_country text,
  p_city text,
  p_phone text,
  p_address text default null,
  p_broadcast_confirmed boolean default false,
  p_note text default null,
  p_image_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_business_name text := btrim(coalesce(p_business_name, ''));
  v_country text := btrim(coalesce(p_country, ''));
  v_city text := btrim(coalesce(p_city, ''));
  v_phone text := btrim(coalesce(p_phone, ''));
  v_address text := btrim(coalesce(p_address, ''));
  v_image_path text := nullif(btrim(coalesce(p_image_path, '')), '');
  v_registration_id uuid;
begin
  if v_uid is null then
    raise exception 'worldcup_auth_required';
  end if;

  if not public.world_cup_campaign_is_active() then
    raise exception 'worldcup_campaign_inactive';
  end if;

  if not exists (
    select 1 from public.roles r
    where r.key = p_category_role_key
      and r.key like 'Business\_%'
      and r.is_active = true
      and r.deleted_at is null
  ) then
    raise exception 'worldcup_invalid_category';
  end if;

  if char_length(v_business_name) < 3 or char_length(v_business_name) > 120 then
    raise exception 'worldcup_invalid_business_name';
  end if;

  if v_country = '' or v_city = '' then
    raise exception 'worldcup_invalid_location';
  end if;

  -- Telefon kart üzerindeki "Ara" butonunu besler: en az 7 anlamlı karakter.
  if char_length(regexp_replace(v_phone, '[^0-9+]', '', 'g')) < 7
     or char_length(v_phone) > 30 then
    raise exception 'worldcup_phone_required';
  end if;

  -- Adres harita linkini besler: artık zorunlu.
  if char_length(v_address) < 5 or char_length(v_address) > 300 then
    raise exception 'worldcup_address_required';
  end if;

  -- Görsel verilmişse kullanıcının kendi klasöründen olmalı (storage policy aynası).
  if v_image_path is not null
     and v_image_path not like (v_uid::text || '/%') then
    raise exception 'worldcup_invalid_image';
  end if;

  if not coalesce(p_broadcast_confirmed, false) then
    raise exception 'worldcup_broadcast_confirmation_required';
  end if;

  if exists (
    select 1 from public.world_cup_registrations w
    where w.user_id = v_uid and w.status in ('pending', 'approved')
  ) then
    raise exception 'worldcup_already_registered';
  end if;

  insert into public.world_cup_registrations (
    user_id, business_name, category_role_key, country, city,
    phone, address, image_path, broadcast_confirmed, applicant_note
  )
  values (
    v_uid, v_business_name, p_category_role_key, v_country, v_city,
    v_phone, v_address, v_image_path, true,
    nullif(btrim(coalesce(p_note, '')), '')
  )
  returning id into v_registration_id;

  return v_registration_id;
exception
  when unique_violation then
    raise exception 'worldcup_already_registered';
end;
$$;

-- ─── 4. Public liste: kart alanları (telefon/adres/görsel) eklenir ───────────

create or replace function public.list_world_cup_businesses_v1(
  p_limit integer default 200
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 200), 1), 500);
  v_result jsonb;
begin
  if not public.world_cup_campaign_is_active() then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(row_data order by rn), '[]'::jsonb)
  into v_result
  from (
    select
      row_number() over (order by w.reviewed_at desc nulls last, w.created_at desc) as rn,
      jsonb_build_object(
        'registrationId', w.id,
        'businessName', w.business_name,
        'categoryKey', w.category_role_key,
        'categoryLabel', r.label,
        'country', w.country,
        'city', w.city,
        'phone', w.phone,
        'address', w.address,
        'imagePath', w.image_path,
        'userId', w.user_id
      ) as row_data
    from public.world_cup_registrations w
    join public.roles r on r.key = w.category_role_key
    where w.status = 'approved'
    order by w.reviewed_at desc nulls last, w.created_at desc
    limit v_limit
  ) sub;

  return v_result;
end;
$$;

-- ─── 5. Admin liste: telefon + görsel alanları eklenir ───────────────────────

create or replace function public.list_world_cup_registrations_admin_v1(
  p_status text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null or not public.is_admin(v_uid) then
    raise exception 'worldcup_admin_required';
  end if;

  if p_status is not null and p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'worldcup_invalid_status_filter';
  end if;

  select coalesce(jsonb_agg(row_data order by rn), '[]'::jsonb)
  into v_result
  from (
    select
      row_number() over (order by w.created_at desc) as rn,
      jsonb_build_object(
        'id', w.id,
        'userId', w.user_id,
        'email', au.email,
        'businessName', w.business_name,
        'categoryKey', w.category_role_key,
        'categoryLabel', r.label,
        'country', w.country,
        'city', w.city,
        'phone', w.phone,
        'address', w.address,
        'imagePath', w.image_path,
        'broadcastConfirmed', w.broadcast_confirmed,
        'applicantNote', w.applicant_note,
        'status', w.status,
        'reviewedAt', w.reviewed_at,
        'reviewNote', w.review_note,
        'previousRoleKey', w.previous_role_key,
        'roleAssigned', w.role_assigned,
        'createdAt', w.created_at
      ) as row_data
    from public.world_cup_registrations w
    join public.roles r on r.key = w.category_role_key
    left join auth.users au on au.id = w.user_id
    where p_status is null or w.status = p_status
    order by w.created_at desc
  ) sub;

  return v_result;
end;
$$;

-- ─── 6. Grants ───────────────────────────────────────────────────────────────

revoke all on function public.create_world_cup_registration_v1(text, text, text, text, text, text, boolean, text, text) from public, anon;
grant execute on function public.create_world_cup_registration_v1(text, text, text, text, text, text, boolean, text, text) to authenticated;

revoke all on function public.list_world_cup_businesses_v1(integer) from public;
grant execute on function public.list_world_cup_businesses_v1(integer) to anon, authenticated;

revoke all on function public.list_world_cup_registrations_admin_v1(text) from public, anon;
grant execute on function public.list_world_cup_registrations_admin_v1(text) to authenticated;

comment on table public.world_cup_registrations is
  'Dünya Kupası kampanyası işletme başvuruları. Mutasyonlar yalnız worldcup_* RPC''leri üzerinden; onayda Business_* rolü atanır. Kart alanları: phone (zorunlu, tel: butonu), address (zorunlu, harita linki), image_path (opsiyonel, world-cup-images bucket''ı, kart hero görseli).';

commit;
