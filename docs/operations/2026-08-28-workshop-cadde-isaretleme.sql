-- Cadde workshop panosu — B0: panoyu gerçeğe çekme (2026-08-28)
--
-- Bu dosya HİÇBİR uygulama kodunu değiştirmez. Yalnızca panoda açık görünen ama
-- ya zaten bitmiş ya da konusu kalmamış 5 maddenin UBT onayını atar.
--
-- ⚠️ SADECE ubt_done set edilir. burak_done Burak'ın kendi onayıdır, buradan atılmaz —
--    bir madde "Tamamlandı" bölümüne ancak iki onay birlikte gelince düşer
--    (isWorkshopItemComplete: ubtDone && burakDone, src/lib/admin-shell/workshop-items.ts:131).
--
-- ⚠️ Türkçe içerikli SQL — PowerShell komut satırından GEÇİRME, `psql -f` ile çalıştır
--    (CLAUDE.md "Türkçe Metin Kuralları" §4: ı→i bozulması).
--
-- Uygulama:
--   psql "host=... sslmode=require" -v ON_ERROR_STOP=1 -f docs/operations/2026-08-28-workshop-cadde-isaretleme.sql
--
-- ── Kanıtlar (2026-08-28 ölçüldü, tahmin değil) ─────────────────────────────────
--
-- m133 (WS1) "şehir/ülke göstergesinin yanında dijital saat"
--   YAPILDI. src/components/cadde/CaddeLocalClock.tsx + CaddeLocalClock.test.tsx var;
--   CaddeFeedScopeBar.tsx:21 import ediyor, :89 clockTarget varsa çiziyor.
--
-- m90 (WS2, Park) "yeni yorumlar sayfa tamamen yenilenmeden görünsün"
--   ANA AKIŞTA YAPILDI. CaddePage.tsx:217 refetchInterval → caddeOpenCommentsPollInterval
--   (src/lib/cadde-feed-polling.ts). Kafe yüzeyinde (CaddePostComments.tsx) BİLİNÇLİ
--   olarak yok — dosyanın başındaki uyarı notu korunur, oraya refetchInterval EKLEME.
--
-- m74 (WS2) + m96 (WS2, Park) "etkileşim oranlarına göre global akışa taşıma"
--   KONUSUZ KALDI. 2026-08-10'da global eşikler canlıda sıfırlandı; bugün de öyle:
--     cadde.global.enabled=true, min_reactions=0, min_comments=0, min_shares=0
--   Yani her paylaşım zaten global katmanda; "etkileşimle taşıma" diye bir kapı kalmadı.
--   Geri alınırsa (10/5/10) bu iki madde yeniden açılmalıdır.
--
-- m136 (WS2) "26 Ağustos checkpoint toplantısı için Cadde durum raporu hazırla"
--   TARİHİ GEÇTİ. Toplantı yapıldı; 24 ve 27 Ağustos toplantıları komuta merkezine
--   T17/T18 olarak işlendi (migration 20260826140000 + 20260828120000).
--
-- ── AÇIK BIRAKILAN (bilerek) ────────────────────────────────────────────────────
-- m89 "yeni paylaşımlar geldiğinde feed alanının otomatik yenilenmesi" KAPATILMAZ.
--   Tasarım bilinçli olarak otomatik yenileme yerine "N yeni paylaşım" çipini seçti
--   (spec §17.3). Bu bitmiş bir iş değil, verilmiş bir karar — panoda kalması doğru.

do $$
declare
  v_hedef constant integer[] := array[74, 90, 96, 133, 136];
  v_bulunan integer;
  v_guncellenen integer;
begin
  select count(*) into v_bulunan
  from public.workshop_items
  where workshop_key = 'cadde' and deleted_at is null and item_no = any(v_hedef);

  if v_bulunan <> array_length(v_hedef, 1) then
    raise exception 'Beklenen % madde bulunamadi, bulunan: %. Pano degismis olabilir — once item_no listesini dogrula.',
      array_length(v_hedef, 1), v_bulunan;
  end if;

  update public.workshop_items
  set ubt_done = true,
      ubt_done_at = now()
  where workshop_key = 'cadde'
    and deleted_at is null
    and item_no = any(v_hedef)
    and ubt_done = false;

  get diagnostics v_guncellenen = row_count;
  raise notice 'B0: % madde UBT onayi ile isaretlendi (zaten isaretli olanlara dokunulmadi).', v_guncellenen;
end
$$;

-- Doğrulama — beklenen: WS1 54|51|3 · WS2 82|37|45
select session_key,
       count(*)                                as toplam,
       count(*) filter (where ubt_done)        as ubt,
       count(*) filter (where burak_done)      as burak,
       count(*) filter (where not ubt_done)    as acik
from public.workshop_items
where workshop_key = 'cadde' and deleted_at is null
group by 1
order by 1;
