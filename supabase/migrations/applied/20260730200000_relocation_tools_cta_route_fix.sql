-- ============================================================
-- Purpose:                Araçlar modülündeki kırık CTA rotalarını onar:
--                         /relocation/tools/<slug> → /tools/<slug> (+ slug regresyonu).
-- Module:                 RELOCATION TOOLS (revizyon panosu B17 —
--                         docs/plans/2026-07-30-revizyon-istekleri-pano-mutabakati.md §2A)
-- Risk level:             low-medium (9 skorlama fonksiyonu CREATE OR REPLACE ile yenilenir;
--                         değişiklik YALNIZ href literal'leri — gövdeler canlıdan okunur)
--
-- Background / kök neden:
--   Sonuç ekranı CTA'ları tabloda değil, relocation_score_*_v1 fonksiyonlarının İÇİNDE
--   üretiliyor (20260701120000_relocation_tools_20q_normalize.sql). O migration iki hata
--   taşıyordu:
--     1. Rota öneki: /relocation/tools/* rotası App.tsx'te HİÇ yok — doğrusu /tools/*.
--        Panodaki "CTA linklerinden ikisi çalışmıyor" maddesinin kök nedeni.
--     2. Slug regresyonu: 'yurtdisi-is-bulma-olasiligi' daha önce 20260626240000 ile
--        'is-bulma-olasiligi'ne düzeltilmişti; 20q_normalize eski slug'ı geri getirdi.
--   Canlı ölçüm (2026-07-30): 9 fonksiyonun prosrc'unda kirli href + 7 kalıcı sonuç
--   kaydında (relocation_tool_results.ctas) kirli href.
--
-- Yöntem: fonksiyon gövdeleri ELLE KOPYALANMAZ — canlı pg_get_functiondef okunur,
--   yalnız href literal'leri replace edilir, sonuç EXECUTE edilir (drift sıfır).
--   Kalıcı sonuç kayıtları da (B22 "sonuca geri dönüş" bu kayıtlara dayanır) düzeltilir.
--
-- Rollback:               ters replace ile aynı DO bloğu (pratikte gereksiz — eski rota ölü).
-- Estimated lock impact:  negligible.
-- Manual verification:    aşağıdaki son kontrol assert'leri + deploy sonrası testte 4 CTA
--                         tıklanabilir ve doğru rotaya gidiyor (B21 ile birlikte).
-- ============================================================

BEGIN;

DO $$
declare
  r record;
  src text;
  fixed int := 0;
  bad_slug record;
begin
  -- 1) Kirli fonksiyonları yerinde onar.
  for r in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosrc like '%/relocation/tools/%'
  loop
    src := pg_get_functiondef(r.oid);
    -- Önce slug regresyonu (prefix düzeltmesinden ÖNCE — tam eşleşme garantisi):
    src := replace(src, '/relocation/tools/yurtdisi-is-bulma-olasiligi', '/tools/is-bulma-olasiligi');
    -- Sonra kalan tüm rota önekleri:
    src := replace(src, '/relocation/tools/', '/tools/');
    execute src;
    fixed := fixed + 1;
  end loop;
  raise notice 'Onarilan fonksiyon: %', fixed;

  -- 2) Kalıcı sonuç kayıtlarındaki CTA'lar (geri dönüş linkleri de düzelsin).
  update public.relocation_tool_results
  set ctas = replace(
        replace(ctas::text, '/relocation/tools/yurtdisi-is-bulma-olasiligi', '/tools/is-bulma-olasiligi'),
        '/relocation/tools/', '/tools/'
      )::jsonb
  where ctas::text like '%/relocation/tools/%';
  get diagnostics fixed = row_count;
  raise notice 'Onarilan sonuc kaydi: %', fixed;

  -- 3) Son kontrol A: kirli href kalmadı.
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosrc like '%/relocation/tools/%'
  ) then
    raise exception 'SON KONTROL BASARISIZ: prosrc icinde /relocation/tools/ kaldi';
  end if;
  if exists (select 1 from public.relocation_tool_results where ctas::text like '%/relocation/tools/%') then
    raise exception 'SON KONTROL BASARISIZ: relocation_tool_results icinde kirli href kaldi';
  end if;

  -- 4) Son kontrol B: fonksiyonlardaki /tools/<slug> hedeflerinin TAMAMI gerçek slug.
  for bad_slug in
    with hrefs as (
      select distinct m[1] as slug
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace,
      lateral regexp_matches(p.prosrc, '/tools/([a-z0-9-]+)', 'g') as m
      where n.nspname = 'public' and p.prosrc like '%/tools/%'
    )
    select h.slug from hrefs h
    where not exists (select 1 from public.relocation_tools t where t.slug = h.slug)
  loop
    raise exception 'SON KONTROL BASARISIZ: /tools/% hedefi gercek bir arac slug''i degil', bad_slug.slug;
  end loop;
  raise notice 'Son kontrol OK: tum /tools/<slug> hedefleri canli slug listesiyle eslesiyor';
end $$;

COMMIT;
