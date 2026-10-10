-- Seed ek-2: 25 Eylül 2026 (T21) — 10 Ekim'de gelen ikinci resmi özetle karşılaştırma.
--
-- T21 canlıda 34 satır (20260925195000 + 20260927180000). Yeni özetteki kararların
-- ve iş maddelerinin neredeyse tamamı zaten kayıtlı; yalnız şu üçü eksikti:
--   (1) Burak'ın Supabase panelini inceleme işi (UBT tarafı "erişim ver" vardı),
--   (2) UBT'nin arka plan modülleri (AI search, WhatsApp hibrit ayrımı, Jukebox),
--   (3) Cadde logosunun HD son hâlinin Drive'a yüklenmesi → mevcut madde güncellenir.
-- T21 toplamı: 34 + 2 = 36 satır.

do $$
declare
  v_eklenen int;
begin
  if exists (
    select 1 from public.command_center_items
    where item_type = 'meeting_note'
      and legacy_source_code = 'T21'
      and legacy_source_title = 'Supabase panelinde harcama, kapasite ve fiyatlamayı incele'
  ) then
    raise notice 'T21 ek-2 seed already present, skipping.';
    return;
  end if;

  update public.command_center_items
  set detail = detail || ' Resmi özet (10.10): logonun son ve yüksek çözünürlüklü (HD) hâli Drive klasörüne yüklenecek.'
  where item_type = 'meeting_note'
    and legacy_source_code = 'T21'
    and legacy_source_title = 'Cadde logosunu UBT''ye gönder'
    and detail not like '%Drive klasörüne%';

  insert into public.command_center_items
    (item_type, title, detail, category_label, assignee, status, priority, due_date, urgent,
     legacy_source_type, legacy_source_code, legacy_source_date_label, legacy_source_category, legacy_source_title, sort_order)
  values
    ('meeting_note', 'Supabase panelinde harcama, kapasite ve fiyatlamayı incele', 'Barış''ın verdiği giriş bilgileriyle Supabase paneline girilip veritabanı harcamaları, kapasite ve fiyatlama modelleri incelenecek.', '25 Eylül 2026', 'Burak', 'Baslanmadi', 5, null, false, 'meeting_notes', 'T21', '25 Eylül 2026', 'veritabani-tasarimi', 'Supabase panelinde harcama, kapasite ve fiyatlamayı incele', 350),
    ('meeting_note', 'Arka plan modüllerini paralel geliştir: AI search, WhatsApp hibrit ayrımı, Jukebox', 'AI search, WhatsApp hibrit ayrımı ve Jukebox gibi altyapı işleri paralel olarak geliştirilmeye devam edecek.', '25 Eylül 2026', 'UBT', 'Devam ediyor', 5, null, false, 'meeting_notes', 'T21', '25 Eylül 2026', 'mvp-hedefleri', 'Arka plan modüllerini paralel geliştir: AI search, WhatsApp hibrit ayrımı, Jukebox', 360);

  get diagnostics v_eklenen = row_count;
  if v_eklenen <> 2 then
    raise exception 'T21 ek-2 seed 2 satır eklemeliydi, % eklendi.', v_eklenen;
  end if;
end
$$;
