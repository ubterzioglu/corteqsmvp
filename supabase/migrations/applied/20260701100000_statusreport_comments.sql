-- /statusreport3006 sayfası — bölüm bazlı, herkese açık (anonim) yorum sistemi.
--
-- Rapor maddeleri statik (DB'de satır yok); yorumlar serbest `section_key text`
-- ile bağlanır (FK yok) — social_share_item_note (mig 20260627100000) deseni.
--
-- Sayfa PUBLIC (giriş yok). Anonim kullanıcılar isim girerek yorum yazar.
-- Güvenlik: içerik tablosuna doğrudan anon INSERT YOK; tek giriş noktası
-- security-definer RPC (add_statusreport_comment_v1) — isim/gövde sanitize +
-- uzunluk limiti + IP'siz basit rate-limit (aynı section_key'e 10 sn'de 1).
-- Okuma herkese açık (yorumlar görünür). Silme yalnız admin (moderasyon).

-- 1) Yorum tablosu -----------------------------------------------------------
create table if not exists public.statusreport_comments (
  id           uuid primary key default gen_random_uuid(),
  section_key  text not null,                 -- ör. 'a1-backend-b1', 'kararlar-k1'
  author_name  text not null default 'Anonim',
  body         text not null,
  deleted_at   timestamptz,                   -- soft-delete (admin moderasyon)
  created_at   timestamptz not null default now()
);

create index if not exists statusreport_comments_section_idx
  on public.statusreport_comments (section_key, created_at);

comment on table public.statusreport_comments is
  '/statusreport3006 bölüm-bazlı public yorumlar: serbest section_key (FK yok), anonim isimli, RPC-only yazım.';

-- 2) RLS ---------------------------------------------------------------------
alter table public.statusreport_comments enable row level security;

-- Okuma: herkes (anon + authenticated) silinmemiş yorumları görür.
drop policy if exists statusreport_comments_public_read on public.statusreport_comments;
create policy statusreport_comments_public_read on public.statusreport_comments
  for select using (deleted_at is null);

-- Doğrudan INSERT yok (yalnız RPC). UPDATE/DELETE yalnız admin (soft-delete).
drop policy if exists statusreport_comments_admin_update on public.statusreport_comments;
create policy statusreport_comments_admin_update on public.statusreport_comments
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- 3) Yorum ekleme RPC (security definer; anonim erişime açık) -----------------
create or replace function public.add_statusreport_comment_v1(
  p_section_key text,
  p_author_name text,
  p_body text
)
returns public.statusreport_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_section text := nullif(btrim(coalesce(p_section_key, '')), '');
  v_name    text := btrim(coalesce(p_author_name, ''));
  v_body    text := btrim(coalesce(p_body, ''));
  v_row     public.statusreport_comments;
begin
  if v_section is null then
    raise exception 'Bölüm anahtarı boş olamaz.' using errcode = 'P0001';
  end if;
  if length(v_section) > 120 then
    raise exception 'Geçersiz bölüm anahtarı.' using errcode = 'P0001';
  end if;
  if v_body = '' then
    raise exception 'Yorum boş bırakılamaz.' using errcode = 'P0001';
  end if;
  if length(v_body) > 4000 then
    raise exception 'Yorum çok uzun (en fazla 4000 karakter).' using errcode = 'P0001';
  end if;

  -- İsim: boşsa 'Anonim', aşırı uzunsa kırp; satır sonlarını sadeleştir.
  v_name := regexp_replace(v_name, '\s+', ' ', 'g');
  if v_name = '' then
    v_name := 'Anonim';
  end if;
  v_name := left(v_name, 80);

  -- Basit kötüye-kullanım freni: aynı bölüme son 10 saniyede yorum varsa reddet.
  if exists (
    select 1 from public.statusreport_comments
    where section_key = v_section
      and created_at > now() - interval '10 seconds'
  ) then
    raise exception 'Çok hızlı gönderim. Lütfen birkaç saniye sonra tekrar deneyin.'
      using errcode = 'P0001';
  end if;

  insert into public.statusreport_comments (section_key, author_name, body)
  values (v_section, v_name, v_body)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.add_statusreport_comment_v1(text, text, text) from public;
grant execute on function public.add_statusreport_comment_v1(text, text, text)
  to anon, authenticated;
