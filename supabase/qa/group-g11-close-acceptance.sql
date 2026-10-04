-- G11 kapanış kabulü — K11 cevapları + G11c (boş linkli 2 grubun gizlenmesi).
--
-- SALT OKUNUR ve yeniden koşulabilir. Geri alınan işlem YOK: durumu olduğu gibi ölçer.
-- Uygulamadan ÖNCE koşulursa KIRMIZI çıkmalıdır (testin boş olmadığının kanıtı),
-- uygulamadan SONRA yeşil.
--
-- Beklenen sayıyı yazmadan önce kümeyi say (G11b dersi: "1 olmalı" dendi, 5 geldi).
--   10 grup = 8 yayında + 2 gizli · 4 global (country_code BOŞ KALMALI) ·
--   6 grubun legacy Global/Genel metni DOKUNULMAMIŞ.

\set ON_ERROR_STOP on
\pset pager off

do $$
declare
  v_fail int := 0;
  v_n int;
  v_txt text;
begin
  -- K1 · "diger" kategorisi kalmadı (politika §5: "Diğer kategorisi yoktur")
  select count(*) into v_n from public.whatsapp_landings where category = 'diger';
  if v_n <> 0 then v_fail := v_fail + 1; raise notice 'K1 DUSTU: diger kategorisinde % grup var (0 olmali)', v_n; end if;

  -- K2 · AI Legion -> meslek-kariyer (kullanici karari 04.10)
  select category into v_txt from public.whatsapp_landings where group_name = 'AI Legion';
  if v_txt is distinct from 'meslek-kariyer' then v_fail := v_fail + 1; raise notice 'K2 DUSTU: AI Legion kategorisi % (meslek-kariyer olmali)', v_txt; end if;

  -- K3 · TED InnoVenture -> Turkiye ulke geneli: TR, sehir YOK, global DEGIL
  select count(*) into v_n from public.whatsapp_landings
   where group_name = 'TED InnoVenture' and country_code = 'TR' and city_id is null and is_global = false;
  if v_n <> 1 then v_fail := v_fail + 1; raise notice 'K3 DUSTU: TED InnoVenture TR/sehirsiz/global-degil degil'; end if;

  -- K4 · HCD + SHAMAN gizli, sebep link_dead
  select count(*) into v_n from public.whatsapp_landings
   where (group_name like 'HCD-%' or group_name like 'SHAMAN%')
     and listing_status = 'hidden' and hidden_reason = 'link_dead';
  if v_n <> 2 then v_fail := v_fail + 1; raise notice 'K4 DUSTU: gizli+link_dead grup sayisi % (2 olmali)', v_n; end if;

  -- K5 · gizleme set_group_status_v1 kapisindan gecti: grup basina TAM 1 log satiri + not dolu
  select count(*) into v_n from public.group_moderation_log l
    join public.whatsapp_landings w on w.id = l.landing_id
   where (w.group_name like 'HCD-%' or w.group_name like 'SHAMAN%')
     and l.from_status = 'published' and l.to_status = 'hidden'
     and l.reason = 'link_dead' and nullif(btrim(coalesce(l.note, '')), '') is not null;
  if v_n <> 2 then v_fail := v_fail + 1; raise notice 'K5 DUSTU: gizleme log satiri % (2 olmali, notlu) - kapi atlanmis olabilir', v_n; end if;

  -- K6 · GERCEK KISIYE MAIL GITMEDI: group_link_dead kuyruk satiri 0
  select count(*) into v_n from public.notification_email_outbox where event_type = 'group_link_dead';
  if v_n <> 0 then v_fail := v_fail + 1; raise notice 'K6 DUSTU: outbox''ta % group_link_dead satiri var (0 olmali) - gonderene mail gidebilir', v_n; end if;

  -- K7 · 8 grup yayinda
  select count(*) into v_n from public.whatsapp_landings where listing_status = 'published';
  if v_n <> 8 then v_fail := v_fail + 1; raise notice 'K7 DUSTU: yayinda % grup (8 olmali)', v_n; end if;

  -- K8 · dizin gorunumu gizlenenleri DISLIYOR (G19: cift filtre) ve kalan 8'i tutuyor
  select count(*) into v_n from public.whatsapp_landings_public;
  if v_n <> 8 then v_fail := v_fail + 1; raise notice 'K8 DUSTU: dizin gorunumunde % satir (8 olmali)', v_n; end if;
  select count(*) into v_n from public.whatsapp_landings_public
   where group_name like 'HCD-%' or group_name like 'SHAMAN%';
  if v_n <> 0 then v_fail := v_fail + 1; raise notice 'K8b DUSTU: gizli gruplar dizinde gorunuyor (% adet)', v_n; end if;

  -- K9 · country_code bos kalanlar = TAM olarak 4 global grup (TED artik dolu)
  select count(*) into v_n from public.whatsapp_landings
   where (country_code is null or country_code = '') and is_global = true;
  if v_n <> 4 then v_fail := v_fail + 1; raise notice 'K9 DUSTU: kodsuz+global grup % (4 olmali)', v_n; end if;
  select count(*) into v_n from public.whatsapp_landings
   where (country_code is null or country_code = '') and is_global = false;
  if v_n <> 0 then v_fail := v_fail + 1; raise notice 'K9b DUSTU: kodsuz ama global-olmayan grup % (0 olmali)', v_n; end if;

  -- K10 · legacy country/city metnine DOKUNULMADI (G10 salt-ekleme deseni)
  select count(*) into v_n from public.whatsapp_landings where country = 'Global' and city = 'Genel';
  if v_n <> 6 then v_fail := v_fail + 1; raise notice 'K10 DUSTU: legacy Global/Genel metni % grupta (6 olmali)', v_n; end if;

  if v_fail > 0 then
    raise exception 'G11 KAPANIS KABULU: % madde DUSTU', v_fail;
  end if;
  raise notice 'TUMU GECTI (K1-K10)';
end
$$;
