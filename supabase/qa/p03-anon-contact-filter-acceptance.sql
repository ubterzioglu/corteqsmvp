-- P03 · Anon iletişim bilgisi filtresi — kabul testi (geri alınan işlem)
--
-- Karar 5: catalog_item_contacts tablosunda is_public=true olan kayıtlardan
-- website + appointment_url anonime AÇIK, whatsapp/email/phone YALNIZ girişli üyeye.
--
-- Test senaryosu:
-- 1. Test catalog_item oluştur
-- 2. 5 farklı contact_type ile is_public=true kayıt ekle (website, whatsapp, email, phone, appointment_url)
-- 3. Anon olarak fonksiyonu çağır → yalnız website + appointment_url dönmeli
-- 4. Authenticated olarak fonksiyonu çağır → tümü dönmeli
-- 5. Geri al (ROLLBACK)

BEGIN;

-- Test verisi: catalog_item
INSERT INTO catalog_items (id, slug, title, item_type, status, visibility)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'p03-test-item',
  'P03 Test Item',
  'organization',
  'published',
  'public'
);

-- Test verisi: 5 farklı contact_type
INSERT INTO catalog_item_contacts (item_id, contact_type, contact_value, label, is_public, is_primary, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'website', 'https://example.com', 'Website', true, true, 1),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'whatsapp', '+905551234567', 'WhatsApp', true, false, 2),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'email', 'test@example.com', 'Email', true, false, 3),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'phone', '+902121234567', 'Phone', true, false, 4),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'appointment_url', 'https://calendly.com/test', 'Appointment', true, false, 5);

-- Test 1: Anon olarak çağır (auth.role() = 'anon' veya boş)
SET ROLE anon;
-- JWT claim'i ayarla (Supabase PostgREST bunu JWT'den okur)
SET LOCAL request.jwt.claim.role TO 'anon';
DO $$
declare
  v_result jsonb;
  v_contacts jsonb;
  v_contact_count int;
  v_contact_types text[];
begin
  -- Fonksiyonu çağır
  select public.get_catalog_item_public_page_v2('p03-test-item') into v_result;
  
  -- Contacts dizisini çıkar
  v_contacts := v_result->'contacts';
  
  -- Kontakt sayısını kontrol et
  v_contact_count := jsonb_array_length(v_contacts);
  
  -- Beklenen: 2 (website + appointment_url)
  IF v_contact_count <> 2 THEN
    RAISE EXCEPTION 'P03 Test 1 BAŞARISIZ: Anon % contact görmeli, % gördü', 2, v_contact_count;
  END IF;
  
  -- Contact type'ları çıkar
  SELECT array_agg(elem->>'type')
  INTO v_contact_types
  FROM jsonb_array_elements(v_contacts) AS elem;
  
  -- Beklenen: website ve appointment_url
  IF NOT ('website' = ANY(v_contact_types) AND 'appointment_url' = ANY(v_contact_types)) THEN
    RAISE EXCEPTION 'P03 Test 1 BAŞARISIZ: Anon website + appointment_url görmeli, gördü: %', v_contact_types;
  END IF;
  
  -- Kişisel veri OLMAMALI
  IF 'whatsapp' = ANY(v_contact_types) OR 'email' = ANY(v_contact_types) OR 'phone' = ANY(v_contact_types) THEN
    RAISE EXCEPTION 'P03 Test 1 BAŞARISIZ: Anon kişisel veri görmemeli, gördü: %', v_contact_types;
  END IF;
  
  RAISE NOTICE 'P03 Test 1 BAŞARILI: Anon yalnız website + appointment_url gördü (2 contact)';
END $$;

-- Test 2: Authenticated olarak çağır (auth.role() = 'authenticated')
SET ROLE authenticated;
-- JWT claim'i ayarla (Supabase PostgREST bunu JWT'den okur)
SET LOCAL request.jwt.claim.role TO 'authenticated';
DO $$
declare
  v_result jsonb;
  v_contacts jsonb;
  v_contact_count int;
  v_contact_types text[];
begin
  -- Fonksiyonu çağır
  select public.get_catalog_item_public_page_v2('p03-test-item') into v_result;
  
  -- Contacts dizisini çıkar
  v_contacts := v_result->'contacts';
  
  -- Kontakt sayısını kontrol et
  v_contact_count := jsonb_array_length(v_contacts);
  
  -- Beklenen: 5 (tümü)
  IF v_contact_count <> 5 THEN
    RAISE EXCEPTION 'P03 Test 2 BAŞARISIZ: Authenticated % contact görmeli, % gördü', 5, v_contact_count;
  END IF;
  
  -- Contact type'ları çıkar
  SELECT array_agg(elem->>'type')
  INTO v_contact_types
  FROM jsonb_array_elements(v_contacts) AS elem;
  
  -- Beklenen: website, whatsapp, email, phone, appointment_url
  IF NOT (
    'website' = ANY(v_contact_types) AND
    'whatsapp' = ANY(v_contact_types) AND
    'email' = ANY(v_contact_types) AND
    'phone' = ANY(v_contact_types) AND
    'appointment_url' = ANY(v_contact_types)
  ) THEN
    RAISE EXCEPTION 'P03 Test 2 BAŞARISIZ: Authenticated tüm contact_types görmeli, gördü: %', v_contact_types;
  END IF;
  
  RAISE NOTICE 'P03 Test 2 BAŞARILI: Authenticated tüm contact_types gördü (5 contact)';
END $$;

-- Rolü sıfırla
RESET ROLE;

-- Test verisini temizle (ROLLBACK ile otomatik temizlenecek)
DELETE FROM catalog_item_contacts WHERE item_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM catalog_items WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

DO $$
BEGIN
  RAISE NOTICE 'P03 kabul testi TAMAMLANDI: 2/2 başarılı (geri alınan işlem)';
END $$;

ROLLBACK;
