-- G11 kapanışı — K11 cevaplarının uygulanması + G11c (boş linkli 2 grubun gizlenmesi).
--
-- Kullanıcı kararları (04.10, KALANLAR §2.0):
--   · AI Legion      -> meslek-kariyer          (karar 3)
--   · TED InnoVenture -> Türkiye, ülke geneli    (karar 4): country_code='TR', şehir YOK, is_global=false
--   · G11c: davet linki BOŞ olan HCD-Bilinç + SHAMAN gizlenecek (G11b'de bilerek ertelenmişti)
--
-- ── GİZLEME DOĞRU KAPIDAN GEÇER ─────────────────────────────────────────────
-- Doğrudan `update … listing_status='hidden'` YAPILMAZ: G12'nin durum makinesini ve
-- `group_moderation_log` kaydını atlar. Kapı `set_group_status_v1`; o da çağıranın
-- `auth.role()='service_role'` ya da `is_admin(auth.uid())` olmasını ister.
-- psql oturumunda ikisi de BOŞ → G22'de aynı çağrı `group_forbidden` vermişti.
-- Çözüm (G22 deseni): işlem-yerel service_role claim'i ver, çağır; claim `is_local=true`
-- olduğu için COMMIT'te kendiliğinden düşer. actor_kind='system' yazılır.
--
-- ── 🔴 GERÇEK KİŞİYE OTOMATİK MAİL GİTMEZ ───────────────────────────────────
-- `group_notify_moderation_log` trigger'ı `hidden` + `link_dead` için gönderene
-- `group_link_dead` maili kuyruğa atar. İki grubun da `submitted_by`'ı DOLU (ölçüldü)
-- yani mail GERÇEKTEN gidecekti. Bu gruplar hiç link almamış — "linkiniz ölü" yanlış
-- tarif olur — ve gerçek kişilere otomatik mail atmak karar turunda KONUŞULMADI.
-- `corteqs.skip_group_notify='on'` (G11/G10c toplu işlemleri için konmuş bayrak)
-- işlem-yerel açılır. Sahiplerden link istemek ayrı, insan eliyle yapılacak bir iştir.
--
-- ── NEDEN `hidden_reason='link_dead'` ───────────────────────────────────────
-- Kapı yalnız {link_dead, reports, owner_request} kabul eder; eksik link için en yakını
-- link_dead. Gerçek sebep `note` alanına yazılır (log'da kalıcı).
--
-- SALT VERİ: şema değişmez. Kabul: supabase/qa/group-g11-close-acceptance.sql (K1–K10).

begin;

-- ── A · K11 ────────────────────────────────────────────────────────────────
update public.whatsapp_landings
   set category = 'meslek-kariyer'
 where group_name = 'AI Legion' and category = 'diger';

update public.whatsapp_landings
   set country_code = 'TR', is_global = false, city_id = null
 where group_name = 'TED InnoVenture';

-- ── B · G11c: iki grubu kapıdan geçirerek gizle ─────────────────────────────
-- Bildirim bayrağı + service claim: İKİSİ DE işlem-yerel (is_local = true).
select set_config('corteqs.skip_group_notify', 'on', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select set_config('request.jwt.claim.role', 'service_role', true);

do $$
declare
  r record;
  v_done int := 0;
begin
  for r in
    select id, group_name from public.whatsapp_landings
     where (group_name like 'HCD-%' or group_name like 'SHAMAN%')
       and listing_status = 'published'
       and (whatsapp_link is null or btrim(whatsapp_link) = '')
  loop
    perform public.set_group_status_v1(
      r.id, 'hidden', 'link_dead',
      'G11c (04.10 kullanıcı kararı): davet linki hiç girilmemiş; sahibinden link istenecek, gelince yayına alınır. Otomatik mail BİLEREK gönderilmedi.');
    v_done := v_done + 1;
  end loop;

  -- Beklenen küme = TAM 2. Daha az/çok ise işlem geri alınır (sessiz kayma yok).
  if v_done <> 2 then
    raise exception 'G11c: gizlenen grup sayisi % (2 olmali) - islem geri aliniyor', v_done;
  end if;
end
$$;

commit;

\echo ''
\echo '=== SONUC ==='
select left(group_name,26) as grup, category, country_code, is_global, listing_status, hidden_reason
from public.whatsapp_landings order by listing_status, group_name;
