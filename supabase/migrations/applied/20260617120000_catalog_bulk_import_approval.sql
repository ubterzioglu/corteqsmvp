-- Toplu profil içe aktarma + admin onay mekanizması.
--
-- Amaç (2026-06-17): Deep Research çıktısı profesyonel listeleri (ör. Melbourne'deki
-- Türk doktor/avukat/emlakçı) platforma "beklemede" olarak girer, admin /admin/data
-- üzerinden tek tek onaylar (yayına alır) veya reddeder. Bugüne dek böyle bir
-- staging→onayla→yayınla kapısı yoktu; scripts/catalog-role-importer.mjs doğrudan
-- service-role ile status='published' yazıyordu (onay kapısı YOK).
--
-- Bu migration iki security-definer RPC ekler (moderator-gated):
--   1. admin_bulk_import_catalog_items — kayıtları status='pending_review',
--      visibility='private' olarak EKLER; source_records ile dedup; provenance tag.
--   2. admin_review_catalog_import — beklemedeki import item'ını onaylar (published+
--      public) veya reddeder (rejected+private). Sadece import kaynaklı item'larda çalışır.
--
-- Tasarım kararları:
--   * Ayrı staging tablosu YOK — beklemeler doğrudan catalog_items içinde
--     status='pending_review' + visibility='private'. Mevcut /admin/data listeleme
--     (admin_list_unified_records moderatöre TÜM statüleri döndürür) ve detay paneli
--     olduğu gibi çalışır; onay yalnızca durum/görünürlük flip'idir.
--   * Sahipsiz herkese açık liste: linked_user_id=null, created_by=null
--     (kişi sonradan claim akışıyla sahiplenebilir). Auth hesabı OLUŞTURULMAZ.
--   * platform_role_key tek başına rol bağlamak için yeterli (get_catalog_item_profile
--     platform_role_key -> role_attributes fallback'i kullanır). catalog_item_roles
--     satırı da is_primary=true ile eklenir (mevcut import deseniyle tutarlı).
--   * Canlı kolon adı created_by (2026-06-09 rebuild created_by_user_id -> created_by
--     rename etti); created_by_user_id ARTIK YOK.
--
-- Geri alma (provenance tag ile):
--   delete from catalog_item_contacts where item_id in (select id from catalog_items
--     where attributes->>'import_source' = '<source_type>');
--   ... (locations / attribute_values / roles / source_records / catalog_items aynı filtre)
--
-- Idempotent: create or replace; insert'ler on conflict do nothing/dedup.

begin;

-- ─── 1. Toplu içe aktarma ────────────────────────────────────────────────────

create or replace function public.admin_bulk_import_catalog_items(
  p_records jsonb,
  p_source_type text,
  p_default_role text default 'User_DiasporaMember'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_actor    uuid := auth.uid();
  v_rec      jsonb;
  v_name     text;
  v_company  text;
  v_city     text;
  v_country  text;
  v_profession text;
  v_phone    text;
  v_email    text;
  v_web      text;
  v_address  text;
  v_ext_id   text;
  v_src_url  text;
  v_role_key text;
  v_item_type text;
  v_slug     text;
  v_attr_id  uuid;
  v_item_id  uuid;
  v_created  int := 0;
  v_skipped  int := 0;
  v_item_ids uuid[] := '{}';
  v_batch_id text;
begin
  -- Yetki: yalnız moderator/admin.
  if v_actor is null or not public.is_moderator(v_actor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_source_type is null or btrim(p_source_type) = '' then
    raise exception 'source_type zorunlu' using errcode = '22023';
  end if;

  if jsonb_typeof(p_records) <> 'array' then
    raise exception 'p_records bir JSON dizi olmalı' using errcode = '22023';
  end if;

  -- Varsayılan rol geçerli olmalı (FK platform_role_key -> roles.key).
  if not exists (select 1 from public.roles where key = p_default_role and is_active = true) then
    raise exception 'geçersiz default rol: %', p_default_role using errcode = '22023';
  end if;

  -- Batch kimliği: aynı içe aktarma partisini gruplamak için (random yok — actor+source+now hash'i).
  v_batch_id := substr(md5(coalesce(v_actor::text, '') || p_source_type || now()::text), 1, 16);

  for v_rec in select * from jsonb_array_elements(p_records)
  loop
    v_name       := nullif(btrim(coalesce(v_rec ->> 'name', '')), '');
    if v_name is null then
      v_skipped := v_skipped + 1;  -- isimsiz kayıt atlanır
      continue;
    end if;

    v_company    := nullif(btrim(coalesce(v_rec ->> 'company', '')), '');
    v_city       := nullif(btrim(coalesce(v_rec ->> 'city', '')), '');
    v_country    := nullif(btrim(coalesce(v_rec ->> 'country', '')), '');
    v_profession := nullif(btrim(coalesce(v_rec ->> 'profession', '')), '');
    v_phone      := nullif(btrim(coalesce(v_rec ->> 'phone', '')), '');
    v_email      := nullif(btrim(coalesce(v_rec ->> 'email', '')), '');
    v_web        := nullif(btrim(coalesce(v_rec ->> 'web', '')), '');
    v_address    := nullif(btrim(coalesce(v_rec ->> 'address', '')), '');
    v_src_url    := nullif(btrim(coalesce(v_rec ->> 'source_url', '')), '');

    -- Dedup anahtarı: verilmişse external_id, yoksa name|company|city slug'ı.
    v_ext_id := nullif(btrim(coalesce(v_rec ->> 'external_id', '')), '');
    if v_ext_id is null then
      v_ext_id := public.catalog_slugify(
        concat_ws('|', v_name, coalesce(v_company, ''), coalesce(v_city, ''))
      );
    end if;

    -- Idempotency: bu source_type + external_id zaten içe aktarılmışsa atla.
    if exists (
      select 1 from public.source_records sr
      where sr.source_type = p_source_type and sr.external_id = v_ext_id
    ) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    -- Rol eşlemesi: profession metnine göre kaba eşleme, belirsizse p_default_role.
    -- (Admin onayda detay panelinden değiştirebilir.)
    v_role_key := public._bulk_import_role_for_profession(v_profession, p_default_role);
    v_item_type := case
      when v_role_key like 'Consultant\_%' or v_role_key like 'Healthcare\_%' then 'advisor'
      when v_role_key like 'Business\_%' then 'business'
      when v_role_key like 'Organization\_%' then 'organization'
      else 'member'
    end;

    -- Benzersiz slug (external_id + kısa rastgelelik yerine batch parçası).
    v_slug := left(
      'import-' || public.catalog_slugify(concat_ws('-', v_city, v_name)) || '-' || substr(md5(v_ext_id), 1, 8),
      96
    );

    -- 1. catalog_items (beklemede + gizli + sahipsiz).
    insert into public.catalog_items (
      item_type, slug, title, headline, short_description,
      status, visibility, verification_status,
      linked_user_id, created_by, platform_role_key, country_code, city,
      attributes, published_at
    )
    values (
      v_item_type,
      v_slug,
      v_name,
      coalesce(v_profession, v_company),
      concat_ws(' · ', v_profession, v_company, v_city),
      'pending_review',
      'private',
      'unverified',
      null,
      null,
      v_role_key,
      v_country,
      v_city,
      jsonb_strip_nulls(jsonb_build_object(
        'import_source',  p_source_type,
        'import_batch',   v_batch_id,
        'source_type',    p_source_type,
        'external_id',    v_ext_id,
        'platform_role_key', v_role_key,
        'raw_company',    v_company,
        'raw_profession', v_profession
      )),
      null
    )
    on conflict (slug) do nothing
    returning id into v_item_id;

    -- Slug çakışması (nadir) → atla.
    if v_item_id is null then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    -- 2. source_records (dedup kaydı + ham anlık görüntü).
    insert into public.source_records (item_id, source_type, external_id, source_url, raw_snapshot, imported_at, last_seen_at)
    values (v_item_id, p_source_type, v_ext_id, v_src_url, v_rec, now(), now())
    on conflict (source_type, external_id) do nothing;

    -- 3. catalog_item_roles (birincil rol).
    insert into public.catalog_item_roles (catalog_item_id, role_id, is_primary)
    select v_item_id, r.id, true
    from public.roles r
    where r.key = v_role_key
    on conflict (catalog_item_id, role_id) do nothing;

    -- 4. Attribute değerleri (beklemede onay durumuyla; onayda 'approved' olur).
    insert into public.catalog_item_attribute_values
      (item_id, attribute_id, value_text, visibility, approval_status, updated_at)
    select v_item_id, a.id, v.value_text, 'public', 'pending', now()
    from (values
      ('full_name',      v_name),
      ('business_name',  v_company),
      ('expertise_area', v_profession),
      ('city',           v_city),
      ('country',        v_country)
    ) v(attr_key, value_text)
    join public.afs_attributes a on a.key = v.attr_key and a.is_active = true
    where v.value_text is not null
    on conflict (item_id, attribute_id) do nothing;

    -- 5. İletişim (telefon/e-posta gizli; web herkese açık).
    insert into public.catalog_item_contacts (item_id, contact_type, contact_value, label, is_public, is_primary, sort_order)
    select v_item_id, c.contact_type, c.contact_value, c.label, c.is_public, c.is_primary, c.sort_order
    from (values
      ('phone',   v_phone, 'Telefon',    false, (v_phone is not null),                       0),
      ('email',   v_email, 'E-posta',    false, (v_phone is null and v_email is not null),  10),
      ('website', v_web,   'Web Sitesi', true,  false,                                       20)
    ) c(contact_type, contact_value, label, is_public, is_primary, sort_order)
    where c.contact_value is not null;

    -- 6. Lokasyon (şehir/ülke/adres).
    if v_city is not null or v_country is not null or v_address is not null then
      insert into public.catalog_item_locations (item_id, country_code, city, address_line, is_primary)
      values (v_item_id, v_country, v_city, v_address, true);
    end if;

    v_created := v_created + 1;
    v_item_ids := array_append(v_item_ids, v_item_id);
  end loop;

  -- Audit log (batch özeti).
  insert into public.catalog_audit_logs (item_id, actor_user_id, action, details)
  values (
    null, v_actor, 'bulk_import',
    jsonb_build_object(
      'source_type', p_source_type,
      'batch_id',    v_batch_id,
      'created',     v_created,
      'skipped',     v_skipped,
      'default_role', p_default_role
    )
  );

  return jsonb_build_object(
    'created',  v_created,
    'skipped',  v_skipped,
    'batch_id', v_batch_id,
    'item_ids', to_jsonb(v_item_ids)
  );
end;
$$;

comment on function public.admin_bulk_import_catalog_items(jsonb, text, text) is
  'Moderator-gated toplu profil içe aktarma. Kayıtlar status=pending_review + '
  'visibility=private olarak girer; source_records ile dedup; admin onayı bekler.';

-- ─── 2. Profession -> flat rol kaba eşlemesi ─────────────────────────────────
-- Türkçe + İngilizce anahtar kelimeler. ASCII-fold yok; locale-li lower yerine
-- basit ilike kullanılır (anahtar kelimeler ASCII). Belirsizse p_fallback döner.

create or replace function public._bulk_import_role_for_profession(
  p_profession text,
  p_fallback text default 'User_DiasporaMember'
)
returns text
language plpgsql
immutable
set search_path to 'public'
as $$
declare
  v_p text := lower(coalesce(p_profession, ''));
  v_key text;
begin
  if v_p = '' then
    return p_fallback;
  end if;

  v_key := case
    when v_p ~ '(lawyer|avukat|hukuk|legal|attorney|solicitor)'          then 'Consultant_LawTax'
    when v_p ~ '(tax|vergi|accountant|muhasebe|cpa|bookkeep|finance|financ)' then 'Consultant_LawTax'
    when v_p ~ '(real estate|emlak|realtor|property)'                    then 'Consultant_RealEstate'
    when v_p ~ '(immigration|visa|vize|göçmen|gocmen|migration)'         then 'Consultant_VisaImmigration'
    when v_p ~ '(business setup|company (registration|formation)|şirket kur|sirket kur)' then 'Consultant_BusinessSetupWork'
    when v_p ~ '(doctor|doktor|physician|cardiolog|gp|practitioner|dietit)' then 'Healthcare_Doctor'
    when v_p ~ '(dentist|diş hek|dis hek|dental)'                        then 'Healthcare_Dentist'
    when v_p ~ '(psycholog|psikolog|therapist|coach|koç|koc)'            then 'Consultant_PsychologistCoach'
    when v_p ~ '(physiother|fizyoterap|carer|bakıcı|bakici|nurse)'       then 'Consultant_PracticalLife'
    when v_p ~ '(education|eğitim|egitim|teacher|öğretmen|ogretmen|tutor)' then 'Consultant_Education'
    when v_p ~ '(consultant|danışman|danisman|advisor)'                  then 'Consultant_PracticalLife'
    else null
  end;

  -- Eşleşen rol canlı + aktif değilse fallback'e düş.
  if v_key is null or not exists (select 1 from public.roles where key = v_key and is_active = true) then
    return p_fallback;
  end if;

  return v_key;
end;
$$;

-- ─── 3. İçe aktarma onayı / reddi ────────────────────────────────────────────

create or replace function public.admin_review_catalog_import(
  p_item_id uuid,
  p_decision text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_actor   uuid := auth.uid();
  v_item    public.catalog_items%rowtype;
  v_before  jsonb;
begin
  if v_actor is null or not public.is_moderator(v_actor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'geçersiz karar: % (approved|rejected)', p_decision using errcode = '22023';
  end if;

  select * into v_item from public.catalog_items where id = p_item_id limit 1;
  if v_item.id is null then
    raise exception 'item bulunamadı: %', p_item_id using errcode = 'P0002';
  end if;

  -- Güvenlik: yalnız import kaynaklı (provenance tag taşıyan) item'lar review edilir.
  if coalesce(v_item.attributes ->> 'import_source', '') = '' then
    raise exception 'bu item bir içe aktarma kaydı değil' using errcode = '22023';
  end if;

  v_before := jsonb_build_object('status', v_item.status, 'visibility', v_item.visibility);

  if p_decision = 'approved' then
    update public.catalog_items
    set status = 'published', visibility = 'public', published_at = coalesce(published_at, now()), updated_at = now()
    where id = p_item_id;

    update public.catalog_item_attribute_values
    set approval_status = 'approved', approved_at = now(), updated_at = now()
    where item_id = p_item_id and approval_status = 'pending';
  else
    update public.catalog_items
    set status = 'rejected', visibility = 'private', updated_at = now()
    where id = p_item_id;
  end if;

  insert into public.catalog_audit_logs (item_id, actor_user_id, action, details, before_data, after_data)
  values (
    p_item_id, v_actor, 'import_review',
    jsonb_build_object('decision', p_decision, 'note', p_note),
    v_before,
    jsonb_build_object(
      'status',     case when p_decision = 'approved' then 'published' else 'rejected' end,
      'visibility', case when p_decision = 'approved' then 'public' else 'private' end
    )
  );

  return jsonb_build_object('item_id', p_item_id, 'decision', p_decision);
end;
$$;

comment on function public.admin_review_catalog_import(uuid, text, text) is
  'Moderator-gated içe aktarma onayı: approved -> published+public (+attribute approved); '
  'rejected -> rejected+private. Sadece import_source provenance taşıyan item''larda çalışır.';

-- ─── 4. Grant'lar (diğer admin RPC deseni: public revoke, authenticated grant) ─

revoke all on function public.admin_bulk_import_catalog_items(jsonb, text, text) from public;
grant execute on function public.admin_bulk_import_catalog_items(jsonb, text, text) to authenticated;

revoke all on function public.admin_review_catalog_import(uuid, text, text) from public;
grant execute on function public.admin_review_catalog_import(uuid, text, text) to authenticated;

revoke all on function public._bulk_import_role_for_profession(text, text) from public;
grant execute on function public._bulk_import_role_for_profession(text, text) to authenticated;

commit;
