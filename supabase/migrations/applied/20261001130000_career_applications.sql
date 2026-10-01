-- KR02 · Kariyer başvuruları: tablo + private kova + `submit_career_application` RPC
--
-- BU MIGRATION SALT EKLEMEDİR. Mevcut `interest_registrations` yolu aynen
-- çalışmaya devam eder; geçiş KR07'de yapılır.
--
-- ═══ GELEN SQL'İN ÜÇ HATASI (plan §"Gelen dosyalardaki üç hata") ═══
-- Ekipten gelen `kariyer_supabase_setup.sql` olduğu gibi çalıştırılamazdı:
--
-- 1. `public.has_role(auth.uid(),'admin')` çağırıyor — **bu projede has_role YOK.**
--    Yalnız baseline öncesi `archive/` dosyalarında geçiyor; canlı şema dökümünde
--    hiç yok. Doğrusu `public.is_admin(uid uuid)` — ve fonksiyon ARGÜMAN ALIR.
--    Olduğu gibi çalıştırılsaydı `function has_role does not exist` ile düşerdi.
-- 2. Anon'a doğrudan tablo INSERT yetkisi veriyordu (`for insert to anon`).
--    Hız sınırı yok, alan doğrulaması yalnız CHECK. Burada **anon'a tabloya INSERT
--    verilmez**; tek yazma yolu security-definer RPC'dir.
-- 3. Storage policy'si kovaya yüklenen dosya ADINI hiç denetlemiyordu. Burada
--    anahtar deseni zorunlu: `<uuid>/<cv|cover-letter|presentation>-<ad>`.
--
-- ═══ HIZ SINIRI DEĞERLERİ ═══
-- Başvuran ANONİMDİR; `report_client_error` desenindeki `auth.uid()` anahtarı
-- burada yok. Bu yüzden fren iki katmanlı: aynı e-posta günde 5, tüm sistem
-- saatte 100. ⚠️ Bu iki sayı pakette YOKTUR, ajan ihtiyatıdır
-- (`report_client_error` saatte 30/kullanıcı ile aynı mantık). Ürün kararıyla
-- değişebilir; değiştirmek bu fonksiyonun tek satırıdır.
--
-- ═══ HATA KODLARI ═══
-- RPC İngilizce cümle değil, `career_` önekli snake_case KOD fırlatır
-- (`sf_*` / `cadde_*` deseni). Gerekçe: kullanıcıya gösterilen Türkçe metin
-- `careers-api` tarafındaki haritadan gelir; cümle fırlatılsaydı metni
-- değiştiren ilk düzenleme eşlemeyi sessizce düşürür ve kullanıcı ham İngilizce
-- görürdü. Yeni kod eklenince TS haritasına da eklenmelidir — çift yönlü
-- sözleşme testi bunu denetler.
--
-- ⚠️ `position` değeri ilan listesine karşı DOĞRULANMAZ ve bu bilinçlidir:
-- ilanlar `src/lib/careers/careers-data.ts` içinde yaşar ve sık değişir. Listeyi
-- SQL'e kopyalamak ikinci bir kaynak yaratır ve ilan eklendiği gün başvuru
-- sessizce reddedilir. Burada yalnız biçim doğrulanır; eşleme sunum katmanının işi.

begin;

-- ── 1) Tablo ────────────────────────────────────────────────────────────────

create table if not exists public.career_applications (
  id                uuid primary key,
  created_at        timestamptz not null default now(),
  full_name         text not null check (char_length(full_name) between 2 and 200),
  email             text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone             text,
  linkedin          text,
  country           text not null,
  city              text,
  position          text not null check (char_length(position) between 1 and 100),
  model             text not null check (model in ('kurucu-ekip', 'yatirimci-ortak', 'staj', 'gorusmede')),
  cover_letter_text text check (char_length(cover_letter_text) <= 10000),
  cv_path           text not null,
  cover_letter_path text,
  presentation_path text,
  consent           boolean not null check (consent = true),
  source            text,
  status            text not null default 'yeni'
                    check (status in ('yeni', 'inceleniyor', 'gorusme', 'teklif', 'olumsuz', 'arsiv')),
  notes             text
);

comment on table public.career_applications is
  'Kariyer başvuruları (KR02). Tek yazma yolu public.submit_career_application RPC''sidir; '
  'anon''un tabloya INSERT yetkisi YOKTUR. Dosyalar career-applications private kovasında.';

create index if not exists career_applications_position_idx
  on public.career_applications (position, created_at desc);
create index if not exists career_applications_email_idx
  on public.career_applications (lower(email), created_at desc);

alter table public.career_applications enable row level security;

-- Anon ve girişli kullanıcı tabloya DOKUNAMAZ; yalnız RPC üzerinden yazar.
revoke all on table public.career_applications from anon, authenticated;

-- Okuma/güncelleme yalnız yöneticiye. ⚠️ is_admin ARGÜMAN ALIR.
drop policy if exists "career applications admin read" on public.career_applications;
create policy "career applications admin read"
  on public.career_applications for select to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "career applications admin update" on public.career_applications;
create policy "career applications admin update"
  on public.career_applications for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

grant select, update on table public.career_applications to authenticated;

-- ── 2) Private kova ─────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'career-applications',
  'career-applications',
  false,
  26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/x-iwork-keynote-sffkey',
    'application/vnd.apple.keynote'
  ]
where not exists (select 1 from storage.buckets where id = 'career-applications');

-- Yükleme: anon da yükleyebilir (başvuru girişsizdir) ama anahtar deseni zorunlu.
-- `application/octet-stream` bilerek LİSTEDE YOK: her şeyi kabul eden bir MIME
-- değeridir, kovanın tür sınırını fiilen kaldırırdı.
drop policy if exists "career files upload" on storage.objects;
create policy "career files upload"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'career-applications'
    and name ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/(cv|cover-letter|presentation)-[A-Za-z0-9._-]{1,120}$'
  );

-- Okuma yalnız yöneticiye (imzalı URL üretimi için).
drop policy if exists "career files admin read" on storage.objects;
create policy "career files admin read"
  on storage.objects for select to authenticated
  using (bucket_id = 'career-applications' and public.is_admin(auth.uid()));

drop policy if exists "career files admin delete" on storage.objects;
create policy "career files admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'career-applications' and public.is_admin(auth.uid()));

-- ── 3) Tek yazma yolu: security-definer RPC ─────────────────────────────────

create or replace function public.submit_career_application(
  p_application_id uuid,
  p_full_name text,
  p_email text,
  p_country text,
  p_position text,
  p_model text,
  p_cv_path text,
  p_consent boolean,
  p_phone text default null,
  p_linkedin text default null,
  p_city text default null,
  p_cover_letter_text text default null,
  p_cover_letter_path text default null,
  p_presentation_path text default null,
  p_source text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_prefix text := p_application_id::text || '/';
  v_recent integer;
begin
  if p_application_id is null then
    raise exception 'career_application_id_required' using errcode = '22023';
  end if;

  if p_consent is distinct from true then
    raise exception 'career_consent_required' using errcode = '22023';
  end if;

  if char_length(btrim(coalesce(p_full_name, ''))) not between 2 and 200 then
    raise exception 'career_invalid_name' using errcode = '22023';
  end if;

  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'career_invalid_email' using errcode = '22023';
  end if;

  if coalesce(btrim(p_country), '') = '' then
    raise exception 'career_country_required' using errcode = '22023';
  end if;

  if char_length(btrim(coalesce(p_position, ''))) not between 1 and 100 then
    raise exception 'career_invalid_position' using errcode = '22023';
  end if;

  if p_model not in ('kurucu-ekip', 'yatirimci-ortak', 'staj', 'gorusmede') then
    raise exception 'career_invalid_model' using errcode = '22023';
  end if;

  -- Dosya anahtarları bu başvurunun klasörüne ait olmalı: istemci başka bir
  -- başvurunun dosyasını kendi kaydına bağlayamaz.
  if p_cv_path is null or left(p_cv_path, char_length(v_prefix)) <> v_prefix then
    raise exception 'career_invalid_cv_path' using errcode = '22023';
  end if;
  if p_cover_letter_path is not null and left(p_cover_letter_path, char_length(v_prefix)) <> v_prefix then
    raise exception 'career_invalid_cover_letter_path' using errcode = '22023';
  end if;
  if p_presentation_path is not null and left(p_presentation_path, char_length(v_prefix)) <> v_prefix then
    raise exception 'career_invalid_presentation_path' using errcode = '22023';
  end if;

  -- Fren 1: aynı e-posta günde 5 başvuru.
  select count(*) into v_recent
  from public.career_applications
  where lower(email) = v_email and created_at > now() - interval '1 day';
  if v_recent >= 5 then
    raise exception 'career_email_daily_limit' using errcode = '53400';
  end if;

  -- Fren 2: tüm sistemde saatte 100 başvuru (sel koruması).
  select count(*) into v_recent
  from public.career_applications
  where created_at > now() - interval '1 hour';
  if v_recent >= 100 then
    raise exception 'career_intake_rate_limited' using errcode = '53400';
  end if;

  -- `status` ve `notes` gövdede ZORLANIR; istemci iddiası kabul edilmez.
  insert into public.career_applications (
    id, full_name, email, phone, linkedin, country, city, position, model,
    cover_letter_text, cv_path, cover_letter_path, presentation_path,
    consent, source, status, notes
  ) values (
    p_application_id,
    left(btrim(p_full_name), 200),
    v_email,
    nullif(left(btrim(coalesce(p_phone, '')), 40), ''),
    nullif(left(btrim(coalesce(p_linkedin, '')), 300), ''),
    left(btrim(p_country), 100),
    nullif(left(btrim(coalesce(p_city, '')), 100), ''),
    left(btrim(p_position), 100),
    p_model,
    nullif(left(coalesce(p_cover_letter_text, ''), 10000), ''),
    p_cv_path,
    p_cover_letter_path,
    p_presentation_path,
    true,
    nullif(left(btrim(coalesce(p_source, '')), 200), ''),
    'yeni',
    null
  );

  return p_application_id;
end;
$$;

revoke all on function public.submit_career_application(
  uuid, text, text, text, text, text, text, boolean, text, text, text, text, text, text, text
) from public;
grant execute on function public.submit_career_application(
  uuid, text, text, text, text, text, text, boolean, text, text, text, text, text, text, text
) to anon, authenticated;

commit;
