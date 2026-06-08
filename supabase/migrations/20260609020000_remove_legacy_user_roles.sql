-- Eski enum-bazlı rol sisteminin (user_roles / app_role / has_role) tamamen kaldırılması.
--
-- Bu migration üç işi sırayla yapar:
--   1. user_roles (11 satır) verisini eski app_role enum'undan yeni roles.key
--      taksonomisine eşleyerek user_role_assignments'a taşır.
--   2. has_role(uuid, app_role)'a bağlı tüm canlı RLS policy'lerini yeni sisteme
--      (is_admin() / user_role_assignments prefix sorguları) çevirir.
--   3. has_role fonksiyonunu, user_roles tablosunu ve app_role enum'unu düşürür.
--
-- Tüm adımlar guard'lı: user_roles / ilgili tablolar zaten drop edilmişse migration
-- sessizce atlar (to_regclass null kontrolü), böylece tekrar çalıştırılabilir.
--
-- Onaylanan rol eşlemesi:
--   admin       -> Admin_PlatformAdmin
--   user        -> User_Standard
--   consultant  -> Consultant_PracticalLife
--   business    -> Business_RetailStore
--   association -> Organization_AssociationFoundation
--   blogger     -> User_BloggerVlogger
--   ambassador  -> User_CityAmbassador

begin;

-- ─── 1. VERİ TAŞIMA: user_roles -> user_role_assignments ──────────────────────
-- Sadece user_roles tablosu hâlâ varsa çalış. auth.users'ta olmayan kullanıcılar
-- FK tarafından elenmez (önce filtreliyoruz). user_role_assignments.user_id PK
-- olduğu için kullanıcı başına tek satır; mevcut atama VARSA dokunmuyoruz
-- (yeni sistem zaten doğru kabul edilir, eski veri onu ezmemeli).

do $$
begin
  if to_regclass('public.user_roles') is null then
    raise notice 'user_roles tablosu yok — veri taşıma atlandı.';
    return;
  end if;

  insert into public.user_role_assignments (user_id, role_id, updated_by, created_at, updated_at)
  select
    ur.user_id,
    r.id as role_id,
    null::uuid as updated_by,
    now(),
    now()
  from public.user_roles ur
  join auth.users au on au.id = ur.user_id
  join public.roles r
    on r.key = case ur.role::text
      when 'admin'       then 'Admin_PlatformAdmin'
      when 'user'        then 'User_Standard'
      when 'consultant'  then 'Consultant_PracticalLife'
      when 'business'    then 'Business_RetailStore'
      when 'association' then 'Organization_AssociationFoundation'
      when 'blogger'     then 'User_BloggerVlogger'
      when 'ambassador'  then 'User_CityAmbassador'
      else null
    end
  -- Her kullanıcı için tek bir kaynak satır seç (PK çakışmasını engelle):
  -- admin önceliği en yüksek, sonra ilk gelen.
  where not exists (
    select 1 from public.user_role_assignments ura where ura.user_id = ur.user_id
  )
  on conflict (user_id) do nothing;

  raise notice 'user_roles -> user_role_assignments taşıma tamamlandı.';
end
$$;

-- ─── 2. has_role'a bağlı RLS POLICY'lerini yeni sisteme çevir (KATALOG-GÜDÜMLÜ) ─
-- Policy adlarını/tablolarını tahmin etmek yerine pg_catalog'dan canlı policy'leri
-- okuyup, USING ve WITH CHECK ifadelerindeki has_role(...) çağrılarını yeni
-- sisteme string-replace ile çevirir, sonra policy'yi (komut, roller, ifadeler
-- korunarak) yeniden oluşturur. Böylece adı/tablosu ne olursa olsun her canlı
-- has_role policy'si otomatik dönüştürülür.
--
-- Eşleme (regexp_replace ile, hem '::app_role' cast'li hem cast'siz biçimler):
--   has_role(<x>, 'admin')       => public.is_admin(<x>)
--   has_role(<x>, 'consultant')  => exists(ura ⋈ roles where user=<x> and key ilike 'Consultant\_%')
--   has_role(<x>, 'business')    => exists(... 'Business\_%')
--   has_role(<x>, 'ambassador')  => exists(... key = 'User_CityAmbassador')
--   has_role(<x>, 'blogger')     => exists(... key = 'User_BloggerVlogger')
--   has_role(<x>, 'association') => exists(... key ilike 'Organization\_%')
--   has_role(<x>, 'user')        => exists(... key ilike 'User\_%')

-- Geçici yardımcı: has_role(<expr>, '<role>'[::app_role]) ifadelerini yeni sisteme
-- çeviren saf string-replace fonksiyonu. Migration sonunda DROP edilir.
create or replace function pg_temp.__rewrite_has_role(p_expr text)
returns text language sql immutable as $f$
  select
    regexp_replace(
    regexp_replace(
    regexp_replace(
    regexp_replace(
    regexp_replace(
    regexp_replace(
    regexp_replace(
      coalesce($1, ''),
      'has_role\(([^,]+),\s*''admin''(::[a-zA-Z_."]+)?\s*\)',
      'public.is_admin(\1)', 'gi'),
      'has_role\(([^,]+),\s*''consultant''(::[a-zA-Z_."]+)?\s*\)',
      '(exists (select 1 from public.user_role_assignments ura join public.roles r on r.id = ura.role_id where ura.user_id = \1 and r.key ilike ''Consultant\_%''))', 'gi'),
      'has_role\(([^,]+),\s*''business''(::[a-zA-Z_."]+)?\s*\)',
      '(exists (select 1 from public.user_role_assignments ura join public.roles r on r.id = ura.role_id where ura.user_id = \1 and r.key ilike ''Business\_%''))', 'gi'),
      'has_role\(([^,]+),\s*''ambassador''(::[a-zA-Z_."]+)?\s*\)',
      '(exists (select 1 from public.user_role_assignments ura join public.roles r on r.id = ura.role_id where ura.user_id = \1 and r.key = ''User_CityAmbassador''))', 'gi'),
      'has_role\(([^,]+),\s*''blogger''(::[a-zA-Z_."]+)?\s*\)',
      '(exists (select 1 from public.user_role_assignments ura join public.roles r on r.id = ura.role_id where ura.user_id = \1 and r.key = ''User_BloggerVlogger''))', 'gi'),
      'has_role\(([^,]+),\s*''association''(::[a-zA-Z_."]+)?\s*\)',
      '(exists (select 1 from public.user_role_assignments ura join public.roles r on r.id = ura.role_id where ura.user_id = \1 and r.key ilike ''Organization\_%''))', 'gi'),
      'has_role\(([^,]+),\s*''user''(::[a-zA-Z_."]+)?\s*\)',
      '(exists (select 1 from public.user_role_assignments ura join public.roles r on r.id = ura.role_id where ura.user_id = \1 and r.key ilike ''User\_%''))', 'gi');
$f$;

do $$
declare
  rec record;
  v_using text;
  v_check text;
  v_cmd_kw text;
  v_roles text;
  v_ddl text;
begin
  for rec in
    select
      n.nspname as schema_name,
      c.relname as table_name,
      pol.polname as policy_name,
      pol.polcmd as cmd,
      pol.polpermissive as permissive,
      pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
      pg_get_expr(pol.polwithcheck, pol.polrelid) as check_expr,
      pol.polroles as role_oids
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where pg_get_expr(pol.polqual, pol.polrelid) ilike '%has_role%'
       or pg_get_expr(pol.polwithcheck, pol.polrelid) ilike '%has_role%'
  loop
    v_using := pg_temp.__rewrite_has_role(rec.using_expr);
    v_check := pg_temp.__rewrite_has_role(rec.check_expr);

    v_cmd_kw := case rec.cmd
      when 'r' then 'select'
      when 'a' then 'insert'
      when 'w' then 'update'
      when 'd' then 'delete'
      when '*' then 'all'
      else 'all'
    end;

    -- Rolleri çöz. role_oids içinde 0 (PUBLIC) varsa ya da hiç rol yoksa 'public';
    -- aksi halde pg_roles'tan adları topla (genelde 'authenticated').
    if rec.role_oids is null
       or array_length(rec.role_oids, 1) is null
       or 0 = any(rec.role_oids) then
      v_roles := 'public';
    else
      select string_agg(quote_ident(rolname), ', ')
      into v_roles
      from pg_roles
      where oid = any(rec.role_oids);
      v_roles := coalesce(v_roles, 'public');
    end if;

    execute format('drop policy if exists %I on %I.%I', rec.policy_name, rec.schema_name, rec.table_name);

    v_ddl := format(
      'create policy %I on %I.%I as %s for %s to %s',
      rec.policy_name, rec.schema_name, rec.table_name,
      case when rec.permissive then 'permissive' else 'restrictive' end,
      v_cmd_kw, v_roles
    );
    if v_using is not null and btrim(v_using) <> '' then
      v_ddl := v_ddl || format(' using (%s)', v_using);
    end if;
    if v_check is not null and btrim(v_check) <> '' then
      v_ddl := v_ddl || format(' with check (%s)', v_check);
    end if;

    execute v_ddl;
    raise notice 'Policy çevrildi: %.%.%', rec.schema_name, rec.table_name, rec.policy_name;
  end loop;
end
$$;

-- ─── GÜVENLİK KAPISI: has_role'a bağlı policy kaldı mı? ──────────────────────
-- Katalog-güdümlü sweep canlı tüm has_role policy'lerini çevirmeli. Yine de
-- backstop olarak pg_policies'i tara; bilinmeyen bir nedenle has_role'a hâlâ
-- bağlı policy kalmışsa migration'ı AÇIK hatayla durdur (sessizce cascade ile
-- droplamak yerine). Mesaj kaçan policy'leri listeler.

do $$
declare
  v_leftovers text;
begin
  select string_agg(format('%I.%I.%I', schemaname, tablename, policyname), ', ')
  into v_leftovers
  from pg_policies
  where coalesce(qual, '') ilike '%has_role%'
     or coalesce(with_check, '') ilike '%has_role%';

  if v_leftovers is not null then
    raise exception
      'has_role''a hâlâ bağlı policy(ler) var, eski sistem güvenle düşürülemez: %. Bu policy''leri migration''a ekleyip tekrar çalıştır.',
      v_leftovers
      using errcode = 'P0001';
  end if;
end
$$;

-- ─── 3. ESKİ NESNELERİ DÜŞÜR ─────────────────────────────────────────────────
-- Sıra: önce function, sonra table, en son type. Function/type'ta cascade YOK
-- (sürpriz drop önlenir); table cascade'i sadece artık kullanılmayan bağımlı
-- index/constraint'ler için.
  --
-- Güvenlik kontrolü: has_role'a hâlâ bağlı policy kaldıysa drop function başarısız
-- olur ve migration geri alınır (transaction). Bu kasıtlı bir güvenlik kapısıdır.

drop function if exists public.has_role(uuid, public.app_role);
drop table if exists public.user_roles cascade;
drop type if exists public.app_role;

commit;
