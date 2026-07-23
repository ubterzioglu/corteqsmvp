-- Demo Member — fully populated public profile placeholder
--
-- Creates ONE member catalog item ("Ayşe Yılmaz", slug demo-uye-ayse-yilmaz)
-- with EVERY public attribute of the member role (User_Standard) filled, plus
-- contacts, links, location, languages, services, categories and media — so
-- /directory/catalog/demo-uye-ayse-yilmaz renders a complete profile page and
-- serves as the visual reference for the public profile composer.
--
-- Security note: private_storage attributes (cv_doc, phone, referral_* ...)
-- are intentionally NOT seeded — their absence doubles as a negative test for
-- the public RPC whitelist.
--
-- Idempotent: guarded on slug / unique constraints; re-running adds nothing.

begin;

do $$
declare
  v_role_id uuid;
  v_item_id uuid;
  v_category_id uuid;
begin
  select id into v_role_id
  from public.roles
  where key = 'User_Standard' and is_active = true and deleted_at is null;
  if v_role_id is null then
    raise exception 'Role User_Standard not found or inactive — demo member seed aborted';
  end if;

  -- 1. Catalog item -----------------------------------------------------------
  insert into public.catalog_items
    (item_type, slug, title, headline, short_description, long_description,
     status, visibility, is_placeholder, is_verified, verification_status,
     city, country_code, platform_role_key)
  select
    'member',
    'demo-uye-ayse-yilmaz',
    'Ayşe Yılmaz',
    'Yazılım Mühendisi · Topluluk Gönüllüsü',
    'Dortmund''da yaşayan yazılım mühendisi; CorteQS topluluğunda mentörlük ve oryantasyon gönüllüsü.',
    'Merhaba! 2016''dan beri Almanya''da yaşıyorum ve Dortmund''da yazılım mühendisi olarak çalışıyorum. ' ||
    'Yeni gelen diaspora üyelerine oryantasyon, CV incelemesi ve kariyer mentörlüğü konularında gönüllü destek veriyorum.' || E'\n\n' ||
    'Teknoloji etkinlikleri düzenlemeyi, topluluk buluşmalarında yer almayı ve fotoğraf çekmeyi seviyorum. ' ||
    'Bir sorunuz varsa profilimdeki kanallardan bana ulaşabilirsiniz.',
    'published', 'public', true, true, 'verified',
    'Dortmund', 'DE', 'User_Standard'
  where not exists (select 1 from public.catalog_items where slug = 'demo-uye-ayse-yilmaz');

  select id into v_item_id from public.catalog_items where slug = 'demo-uye-ayse-yilmaz';

  -- 2. Primary role link ------------------------------------------------------
  insert into public.catalog_item_roles (catalog_item_id, role_id, is_primary)
  values (v_item_id, v_role_id, true)
  on conflict (catalog_item_id, role_id) do nothing;

  -- 3. Attribute values — every public, non-private attribute of the role -----
  insert into public.catalog_item_attribute_values
    (item_id, attribute_id, value_text, value_json, visibility, approval_status)
  select
    v_item_id,
    a.id,
    case
      when a.data_type = 'boolean' then null
      when a.key = 'full_name'          then 'Ayşe Yılmaz'
      when a.key = 'country'            then 'Almanya'
      when a.key = 'city'               then 'Dortmund'
      when a.key = 'bio_short'          then 'Dortmund''da yazılım mühendisi; yeni gelenlere mentörlük ve oryantasyon desteği veren topluluk gönüllüsü.'
      when a.key = 'profile_photo_url'  then 'https://i.pravatar.cc/300?img=47'
      when a.key = 'avatar_url'         then 'https://i.pravatar.cc/300?img=47'
      when a.key = 'interests'          then 'Teknoloji, gönüllülük, fotoğrafçılık, doğa yürüyüşü'
      when a.key = 'expertise_area'     then 'Yazılım Geliştirme ve Kariyer Mentörlüğü'
      when a.key = 'linkedin_url'       then 'https://www.linkedin.com/in/ayse-yilmaz-demo'
      when a.key = 'website_url'        then 'https://ayseyilmaz-demo.corteqs.net'
      when a.key = 'instagram_url'      then 'https://www.instagram.com/ayseyilmaz.demo'
      when a.key = 'facebook_url'       then 'https://www.facebook.com/ayseyilmaz.demo'
      when a.key = 'youtube_url'        then 'https://www.youtube.com/@ayseyilmazdemo'
      when a.key = 'tiktok_url'         then 'https://www.tiktok.com/@ayseyilmazdemo'
      when a.key = 'x_url'              then 'https://x.com/ayseyilmazdemo'
      when a.key = 'reddit_url'         then 'https://www.reddit.com/user/ayseyilmazdemo'
      when a.key = 'service_regions'    then 'Dortmund, Essen, Bochum — NRW geneli'
      when a.key = 'physical_address'   then 'Hansastraße 12, 44137 Dortmund'
      when a.key = 'map_link'           then 'https://www.google.com/maps/search/?api=1&query=Hansastra%C3%9Fe%2012%20Dortmund'
      when a.key = 'founded_year'       then '2018'
      when a.data_type = 'url'          then 'https://ayseyilmaz-demo.corteqs.net/' || replace(a.key, '_', '-')
      when a.data_type in ('text', 'textarea') then 'Örnek: ' || a.label
      else null
    end,
    case when a.data_type = 'boolean' then 'true'::jsonb else null end,
    'public',
    'approved'
  from public.role_attributes ra
  join public.afs_attributes a on a.id = ra.attribute_id
  where ra.role_id = v_role_id
    and ra.is_public = true
    and a.is_active = true
    and a.storage_strategy <> 'private_storage'
    and a.data_type in ('boolean', 'url', 'text', 'textarea')
  on conflict (item_id, attribute_id) do nothing;

  -- 4. Contacts ---------------------------------------------------------------
  if not exists (select 1 from public.catalog_item_contacts where item_id = v_item_id) then
    insert into public.catalog_item_contacts (item_id, contact_type, contact_value, label, is_public, is_primary, sort_order) values
      (v_item_id, 'phone',    '+49 231 555 01 23',                    'Telefon',    true, true,  10),
      (v_item_id, 'email',    'ayse.yilmaz.demo@corteqs.net',         'E-posta',    true, false, 20),
      (v_item_id, 'website',  'https://ayseyilmaz-demo.corteqs.net',  'Web Sitesi', true, false, 30),
      (v_item_id, 'whatsapp', 'https://wa.me/4915123456789',          'WhatsApp',   true, false, 40);
  end if;

  -- 5. Links ------------------------------------------------------------------
  if not exists (select 1 from public.catalog_item_links where item_id = v_item_id) then
    insert into public.catalog_item_links (item_id, link_type, url, label, is_public, sort_order) values
      (v_item_id, 'linkedin',        'https://www.linkedin.com/in/ayse-yilmaz-demo',  'LinkedIn',  true, 10),
      (v_item_id, 'instagram',       'https://www.instagram.com/ayseyilmaz.demo',     'Instagram', true, 20),
      (v_item_id, 'website',         'https://ayseyilmaz-demo.corteqs.net',           'Website',   true, 30),
      (v_item_id, 'appointment_url', 'https://cal.com/ayseyilmaz-demo',               'Randevu',   true, 40);
  end if;

  -- 6. Location ---------------------------------------------------------------
  if not exists (select 1 from public.catalog_item_locations where item_id = v_item_id) then
    insert into public.catalog_item_locations (item_id, country_code, region, city, postal_code, address_line, is_primary)
    values (v_item_id, 'DE', 'Nordrhein-Westfalen', 'Dortmund', '44137', 'Hansastraße 12', true);
  end if;

  -- 7. Languages ---------------------------------------------------------------
  insert into public.catalog_item_languages (item_id, language_code, proficiency, is_primary) values
    (v_item_id, 'tr', 'native_or_fluent', true),
    (v_item_id, 'de', 'fluent',           false),
    (v_item_id, 'en', 'intermediate',     false)
  on conflict (item_id, language_code) do nothing;

  -- 8. Services ----------------------------------------------------------------
  insert into public.catalog_item_services (item_id, service_slug, service_name, description, is_public, sort_order) values
    (v_item_id, 'mentorluk',        'Kariyer Mentörlüğü',        'Yazılım sektöründe iş arayanlara birebir mentörlük.',          true, 10),
    (v_item_id, 'cv-incelemesi',    'CV İncelemesi',             'Almanya iş piyasasına uygun CV ve başvuru desteği.',           true, 20),
    (v_item_id, 'oryantasyon',      'Yeni Gelen Oryantasyonu',   'Dortmund''a yeni taşınanlar için resmi işlem rehberliği.',    true, 30)
  on conflict (item_id, service_slug) do nothing;

  -- 9. Category (link an existing one; create 'topluluk' if absent) ------------
  select id into v_category_id from public.catalog_categories where slug = 'topluluk' limit 1;
  if v_category_id is null then
    insert into public.catalog_categories (module, slug, name, description, is_active, sort_order)
    select coalesce((select module from public.catalog_categories limit 1), 'member'),
           'topluluk', 'Topluluk', 'Topluluk gönüllüleri ve üyeler', true, 50
    returning id into v_category_id;
  end if;
  insert into public.catalog_item_categories (item_id, category_id, is_primary)
  values (v_item_id, v_category_id, true)
  on conflict (item_id, category_id) do nothing;

  -- 10. Media (avatar + cover) --------------------------------------------------
  if not exists (select 1 from public.catalog_item_media where item_id = v_item_id) then
    insert into public.catalog_item_media (item_id, media_type, url, alt_text, is_public, is_primary, sort_order) values
      (v_item_id, 'image', 'https://i.pravatar.cc/300?img=47', 'Ayşe Yılmaz', true, true, 10),
      (v_item_id, 'cover', 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=1600&q=80', 'Dortmund silüeti', true, false, 20);
  end if;
end $$;

commit;
