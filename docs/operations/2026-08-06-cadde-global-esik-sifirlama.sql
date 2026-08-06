-- Cadde akışı: global eşiklerin sıfırlanması (herkes her postu görsün)
-- Karar: kullanıcı, 2026-08-06. Hedef: canlı Supabase (injprdrsklkxgnaiixzh).
--
-- SORUN (canlı DB'de ölçüldü, 2026-08-06 — veri tarafında bozukluk YOK):
--   `cadde_posts` 20 satır, hepsi published/public/real, HEDEFSİZ POST YOK.
--   Buna rağmen ubterzioglu@gmail.com 20 postun 12'sini, burakakcakanat@gmail.com
--   7'sini görüyordu ve birbirlerinin bugünkü postlarını HİÇ görmüyorlardı.
--   Sebep: `list_cadde_feed_v1` varsayılan `scope=all` dalında bir post ancak
--   (a) izleyicinin ŞEHRİ hedefle eşleşirse, (b) ÜLKESİ eşleşirse, ya da
--   (c) GLOBAL EŞİĞİ aşarsa görünüyor. Bugünkü postların hedefleri:
--   ubterzioglu → Türkiye/Antalya, burakakcakanat → Katar/Doha. İki ayrı ülke.
--   (c) dalının eşiği 10 reaksiyon / 5 yorum / 10 paylaşımdı; aktif kullanıcı
--   sayısı ~6 iken bu eşik fiilen ulaşılamaz, yani akış ülke içine kilitliydi.
--
-- ÇÖZÜM: üç eşiği 0'a çek. Sayaçlar >= 0 olduğu için her post global katmandan
--   geçer, akış filtresi fiilen kalkar.
--
-- ⚠️ YERELLİK KAYBOLMUYOR — sadece FİLTRE kalkıyor, SIRALAMA aynen kalıyor.
--   `list_cadde_feed_v1` bantları değişmedi: bant 1-2 aynı şehir, 3 aynı ülke,
--   4-5 etkileşim, 6 diğerleri. Kullanıcı hâlâ önce kendi şehrini görür; farkı,
--   yerelinde içerik bittiğinde akışın boşa düşmemesi.
--
-- Bu değişiklik iki ölçülmüş varsayıma dayanıyor (ikisi de canlıda doğrulandı):
--   1. `cadde_setting_int` gövdesi `coalesce((select value ...), p_default)`.
--      `coalesce` satırın VARLIĞINA bakar, değerine değil — bu yüzden 0 yazmak
--      varsayılana DÜŞMEZ, 0 döner. (Farklı yazılsaydı bu dosya işe yaramazdı.)
--   2. `cadde_posts`ta reaction_count / comment_count / share_count kolonlarında
--      hiç NULL yok (0/0/0 — 20 satır). NULL olsaydı `>= 0` NULL dönerdi.
--
-- `cadde.global.enabled` = true KALIR. False yapılırsa (c) dalı hiç
-- değerlendirilmez ve bu değişiklik anlamsızlaşır — o satıra dokunma.
--
-- YAYILMA YARIÇAPI: `pg_proc` taraması bu üç ayarı okuyan tek fonksiyonun
-- `list_cadde_feed_v1` olduğunu gösterdi. Başka hiçbir yeri etkilemez.
--
-- ⚠️ `src/lib/cadde-ranking.ts` içindeki `CADDE_GLOBAL_THRESHOLD_SETTINGS`
--    (10/5/10) DEĞİŞTİRİLMEDİ ve DEĞİŞTİRİLMEMELİ. O sabit SEED VARSAYILANINI
--    tanımlar ve `cadde-global-threshold-migration.test.ts` onu değişmez seed
--    migration'ı `20260802160000_cadde_global_threshold.sql` metnine kilitler.
--    Buradaki değer bilinçli bir ÇALIŞMA-ANI EZMESİDİR; ikisinin ayrışması
--    beklenen durumdur.
--
-- Migration YAZILMADI: bu şema değişikliği değil, ürün ayarı kararı.
-- CLAUDE.md kuralı: `cadde_settings` ürün limitlerinin tek kaynağıdır ve
-- ürün kararları SQL güncellemesidir, kod değişikliği değil. Deploy gerekmez.
--
-- Çalıştırma:
--   psql "$CONN" -v ON_ERROR_STOP=1 -f docs/operations/2026-08-06-cadde-global-esik-sifirlama.sql
--
-- GERİ ALMA (eski değerler, ölçüldü 2026-08-06):
--   update public.cadde_settings set value = '10'::jsonb, updated_at = now() where key = 'cadde.global.min_reactions';
--   update public.cadde_settings set value = '5'::jsonb,  updated_at = now() where key = 'cadde.global.min_comments';
--   update public.cadde_settings set value = '10'::jsonb, updated_at = now() where key = 'cadde.global.min_shares';
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- `value` kolonu jsonb ve mevcut tip `number` — '0'::jsonb (JSON sayısı),
-- '"0"'::jsonb (JSON metni) DEĞİL. `(value #>> '{}')::integer` ikisinde de
-- çalışır ama tipi bozmak sonraki okumaları yanıltır.
update public.cadde_settings
   set value = '0'::jsonb,
       updated_at = now()
 where key in (
   'cadde.global.min_reactions',
   'cadde.global.min_comments',
   'cadde.global.min_shares'
 );

commit;

-- ── DOĞRULAMA 1: ayarlar ────────────────────────────────────────────────────
-- Beklenen: üç min_* satırı 0, enabled satırı true.
select key, value, jsonb_typeof(value) as tip, updated_at
  from public.cadde_settings
 where key like 'cadde.global%'
 order by key;

-- ── DOĞRULAMA 2: iki test hesabının gördüğü post sayısı ─────────────────────
-- Değişiklikten ÖNCE ölçüldü: ubterzioglu 12/20, burakakcakanat 7/20.
-- Beklenen: her ikisi de 20/20.
with v as (
  select u.email, r.out_country_id as vc, r.out_city_id as vci
    from auth.users u
    cross join lateral public.cadde_resolve_viewer_location(u.id) r
   where u.email in ('ubterzioglu@gmail.com', 'burakakcakanat@gmail.com')
)
select v.email,
       count(*) filter (where
            (v.vci is not null and (p.city_id = v.vci
              or exists (select 1 from public.cadde_post_targets t where t.post_id = p.id and t.city_id = v.vci)))
         or (v.vc is not null and (p.country_id = v.vc
              or exists (select 1 from public.cadde_post_targets t where t.post_id = p.id and t.country_id = v.vc)))
         or (p.reaction_count >= public.cadde_setting_int('cadde.global.min_reactions', 10)
          or p.comment_count  >= public.cadde_setting_int('cadde.global.min_comments', 5)
          or coalesce(p.share_count, 0) >= public.cadde_setting_int('cadde.global.min_shares', 10))
       ) as gorunen,
       count(*) as toplam
  from v
  cross join public.cadde_posts p
 where p.content_mode = 'real'
   and p.status = 'published'
   and p.visibility = 'public'
   and p.diaspora_key = 'tr'
 group by 1
 order by 1;
