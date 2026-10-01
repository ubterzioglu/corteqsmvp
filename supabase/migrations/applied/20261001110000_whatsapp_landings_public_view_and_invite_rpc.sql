-- G03a · Dijital Gruplar: PII'siz public view + davet linki RPC'si
--
-- BU MIGRATION SALT EKLEMEDİR. Hiçbir politika, grant veya kolon kaldırılmaz;
-- bugünkü okuma yolları aynen çalışmaya devam eder. Amacı, G03b'nin (istemci
-- göçü) ve G03c'nin (anon grant'ının daraltılması) güvenle yapılabileceği
-- hedefi kurmaktır. Tek başına uygulanması canlı davranışı DEĞİŞTİRMEZ.
--
-- ═══ NEDEN (canlı ölçüm 2026-10-01) ═══
-- `Anyone can view approved landings` politikası anon'a `status='approved'`
-- satırının TÜM kolonlarını döndürüyor. Ölçülen sızıntı planda yazılandan
-- GENİŞ:
--   • `whatsapp_link` — 10/10 satırda anon'a açık (politika §8 ve tasarımın
--     kabul testi #5 bunu yasaklıyor; K1 olarak biliniyordu).
--   • `admin_contact` — 10/10 satırda DOLU ve biçimi `Ad Soyad e-posta@...
--     +90xxxxxxxxxx`: grup adminlerinin **adı + e-posta adresi + uluslararası
--     telefon numarası**. Anon bunu da okuyabiliyor. **Bu K1'de yazılı DEĞİLDİ.**
--     Kişisel veri + e-posta/telefon doğrulama (enumeration) yüzeyi.
--
-- ⚠️ RLS SATIR düzeyinde çalışır, KOLON düzeyinde değil. "Satırı göster ama bir
-- kolonu gizle" diye bir politika yazılamaz. Kolon grant'ını çekmek de çözüm
-- değildir: istemcinin iki anon yolu da (`getLanding`, `listLandings`)
-- `select("*")` kullanıyor; kolon grant'ı çekilirse ikisi de `42501` ile düşer
-- ve kullanıcıya "izin yok" diye değil, **"dizin boş"** diye görünür.
-- Doğru hedef: PII'siz bir VIEW + linki veren ayrı bir RPC.
--
-- ═══ VIEW'IN GÜVENLİK MODELİ ═══
-- `security_invoker = false` (PG17 varsayılanı; burada AÇIKÇA yazıldı):
-- view, sahibi `postgres` rolünün yetkisiyle çalışır ve taban tablonun RLS'ini
-- BYPASS eder (`relforcerowsecurity = false` ölçüldü). Bu BİLİNÇLİ bir seçimdir
-- — G03c'de anon'un taban tablo SELECT yetkisi alınınca view'ın çalışmaya devam
-- etmesi buna bağlıdır.
-- ⚠️ Bu yüzden `status = 'approved'` filtresi VIEW'IN İÇİNDE olmak ZORUNDADIR;
-- artık onu uygulayan bir RLS politikası yok. Filtreyi kaldıran, `pending` ve
-- `rejected` grupları anonime açar.
-- `security_barrier = true`: planlayıcının kullanıcı tanımlı (ucuz ama sızdıran)
-- bir predicate'i filtreden ÖNCE çalıştırmasını engeller.
--
-- ⚠️ KOLON SIRASI VE ADLARI TABANLA AYNI TUTULDU (gizlenenler `null::<tip>`
-- olarak duruyor). Böylece `rowToLanding` (src/lib/whatsapp-landings.ts)
-- DEĞİŞMEDEN çalışır ve G03b yalnızca tablo adını değiştirir. Kolonu listeden
-- çıkarma — çıkarırsan istemci tarafında sessiz `undefined` üretirsin.

begin;

create or replace view public.whatsapp_landings_public
with (security_invoker = false, security_barrier = true)
as
select
  l.id,
  null::uuid   as user_id,         -- G03: gönderenin kimliği anonime dönmez
  l.slug,
  l.group_name,
  l.category,
  l.country,
  l.city,
  l.mode,
  l.hero_image,
  l.tagline,
  l.call_to_action_text,
  l.conditions,
  null::text   as whatsapp_link,   -- G03: DAVET LİNKİ — yalnız RPC ile, girişli kullanıcıya
  l.admin_name,
  null::text   as admin_contact,   -- G03: ad + e-posta + telefon taşıyor, asla public değil
  l.description,
  l.status,
  null::text   as rejection_reason, -- yalnız sahibini/yöneticiyi ilgilendirir
  l.created_at,
  l.updated_at,
  l.member_approved,
  l.admin_approved,
  l.member_count,
  l.member_count_updated_at,
  l.group_score,
  l.language,
  l.origin
from public.whatsapp_landings l
where l.status = 'approved';

comment on view public.whatsapp_landings_public is
  'G03a · Dijital Gruplar dizininin PII''siz okuma yüzeyi. whatsapp_link, admin_contact, '
  'user_id ve rejection_reason bilerek NULL döner. status=''approved'' filtresi view''ın '
  'İÇİNDEDİR (security_invoker=false olduğu için RLS uygulanmaz) — kaldırma.';

grant select on public.whatsapp_landings_public to anon, authenticated;

-- ═══ DAVET LİNKİ: tek kapı ═══
-- Politika §8: link yalnız GİRİŞLİ kullanıcıya verilir.
-- ⚠️ Günlük kullanıcı başına sınır BU BATCH'TE YOK: sınır `group_settings`
-- tablosundan okunacak, o tablo G09'da açılıyor ve eşik koda sabit yazılmaz
-- (`cadde_settings` deseni). Sınır G09'dan sonraki batch'te buraya eklenecek.
create or replace function public.get_whatsapp_landing_invite(p_slug text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_link text;
begin
  if auth.uid() is null then
    raise exception 'authentication required'
      using errcode = '42501', hint = 'Davet linkini görmek için giriş yapın.';
  end if;

  -- ⚠️ `nullif(trim(...), '')` ŞART. Canlıda ölçüldü (01.10): yayındaki 10 grubun
  -- **2'sinin linki BOŞ string** (K4'teki bilinen veri kusuru, `hcd-bilinc-...` ve
  -- `shaman-kocluk-...`). Ham kolon döndürülürse RPC bu iki grup için `''` verir;
  -- istemci bunu geçerli link sanıp tıklanamayan bir "Katıl" düğmesi çizer ve
  -- hata HİÇBİR YERDE görünmez. Boş link = link yok.
  select nullif(trim(l.whatsapp_link), '')
    into v_link
  from public.whatsapp_landings l
  where l.slug = p_slug
    and l.status = 'approved';

  if v_link is null then
    raise exception 'group not found'
      using errcode = 'P0002', hint = 'Grup bulunamadı veya davet linki yok.';
  end if;

  return v_link;
end;
$$;

comment on function public.get_whatsapp_landing_invite(text) is
  'G03a · Yayındaki bir grubun davet linkini YALNIZ girişli kullanıcıya döner. '
  'Giriş yoksa 42501. Kullanıcı başına günlük sınır G09 sonrası eklenecek.';

revoke all on function public.get_whatsapp_landing_invite(text) from public, anon;
grant execute on function public.get_whatsapp_landing_invite(text) to authenticated;

-- Doğrulama: view PII sızdırmamalı, RPC anon'a açık olmamalı.
do $$
declare
  v_leaky int;
  v_anon_exec int;
begin
  select count(*) into v_leaky
  from public.whatsapp_landings_public
  where whatsapp_link is not null
     or admin_contact is not null
     or user_id is not null;

  if v_leaky <> 0 then
    raise exception 'G03a: view hala PII donduruyor (% satir)', v_leaky;
  end if;

  select count(*) into v_anon_exec
  from information_schema.role_routine_grants
  where routine_name = 'get_whatsapp_landing_invite'
    and grantee in ('anon', 'PUBLIC');

  if v_anon_exec <> 0 then
    raise exception 'G03a: davet RPC si anona acik kalmis (% grant)', v_anon_exec;
  end if;
end $$;

commit;
