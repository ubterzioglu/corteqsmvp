-- P8 (13 Eylül): "MVP V2 merge: WhatsApp grup gönderi akışını ürünleştir" todo'sunun
-- detayına, kalan kapsamın artık TOP 10 HOT FIX'e taşındığını belirten bir not eklenir.
--
-- Ölçüldü: bu todo'nun kendi detayında zaten "[Epic ayrıştırma 2026-08-30]" notu var —
-- Auth ve public demo işleri ayrı kartlarla kapatılmış, kalan kapsam "politika kartı
-- 2ce74249, sosyal metin kartı 635d1ce7" diye işaretlenmiş. Bu iki kart tam olarak
-- 10 Eylül'de acil listesine taşınan GRUP EKLEME POLİTİKASI ve GRUP EKLEME ÇAĞRISI
-- maddeleri. Todo'nun durumu 'Tamamlandi'ya ÇEKİLMİYOR (gerçekte iş bitmedi) — yalnız
-- ileride biri "yapılmamış" sanıp tekrar açmasın diye takip notu ekleniyor.
--
-- Idempotent: not zaten eklenmişse tekrar eklenmez.

do $mig$
declare
  v_id uuid := 'fc13bebf-e342-48e5-946b-5cd1a62e1020';
  v_note text := '[13 Eylül] Kalan kapsam TOP 10 HOT FIX''e taşındı — bkz. GRUP EKLEME POLİTİKASI / GRUP EKLEME ÇAĞRISI.';
  v_detail text;
begin
  select detail into v_detail from public.command_center_items where id = v_id;

  if v_detail is null then
    raise exception 'MVP V2 merge todo''su bulunamadı (id=%)', v_id;
  end if;

  if v_detail like '%' || v_note || '%' then
    raise notice 'Not zaten ekli, atlaniyor';
    return;
  end if;

  update public.command_center_items
  set detail = v_detail || E'\n\n' || v_note,
      updated_at = now()
  where id = v_id;
end
$mig$;
