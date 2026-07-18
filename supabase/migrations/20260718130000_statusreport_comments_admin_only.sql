-- Admin "Brainstorming" — statusreport_comments'ı admin-only'e daraltma.
-- Eski /statusreport3006 public sayfası kaldırılıyor; yorum tablosu artık
-- /admin/brainstorming'in yorum thread'i olarak yaşamaya devam ediyor (şema aynı,
-- section_key brainstorming_sections.section_key ile eşleşiyor — FK yok, serbest kalem
-- bağlı kalınıyor). İsim serbest alanı kalkıyor; yazan admin auth.uid()'den e-postaya
-- çözülüyor (fetchUserEmails / admin_get_user_email deseni — revision-requests.ts).

-- 1) Eski public read policy'yi kaldır, admin-only select ekle ------------------
drop policy if exists statusreport_comments_public_read on public.statusreport_comments;

drop policy if exists brainstorming_comments_admin_select on public.statusreport_comments;
create policy brainstorming_comments_admin_select on public.statusreport_comments
  for select using (public.is_admin(auth.uid()));

-- update policy zaten admin-only'di (statusreport_comments_admin_update) — korunuyor.

-- 2) Eski anonim RPC'yi kaldır ---------------------------------------------------
drop function if exists public.add_statusreport_comment_v1(text, text, text);

-- 3) author_name kolonu artık serbest metin değil; created_by ile takip ---------
alter table public.statusreport_comments
  add column if not exists created_by uuid references auth.users (id) on delete set null;

comment on table public.statusreport_comments is
  'Admin Brainstorming bölüm yorumları (eski statusreport3006): admin-only, section_key brainstorming_sections ile eşleşir (FK yok, serbest kalem).';

-- 4) Yeni yorum ekleme RPC — isim parametresi yok, admin kontrolü içeride ---------
create or replace function public.add_brainstorming_comment_v1(
  p_section_key text,
  p_body text
)
returns public.statusreport_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_section text := nullif(btrim(coalesce(p_section_key, '')), '');
  v_body    text := btrim(coalesce(p_body, ''));
  v_uid     uuid := auth.uid();
  v_row     public.statusreport_comments;
begin
  if v_uid is null or not public.is_admin(v_uid) then
    raise exception 'Bu işlem için admin yetkisi gerekiyor.' using errcode = '42501';
  end if;

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

  -- Basit kötüye-kullanım freni: aynı bölüme son 10 saniyede yorum varsa reddet.
  if exists (
    select 1 from public.statusreport_comments
    where section_key = v_section
      and created_at > now() - interval '10 seconds'
  ) then
    raise exception 'Çok hızlı gönderim. Lütfen birkaç saniye sonra tekrar deneyin.'
      using errcode = 'P0001';
  end if;

  insert into public.statusreport_comments (section_key, author_name, body, created_by)
  values (v_section, 'Admin', v_body, v_uid)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.add_brainstorming_comment_v1(text, text) from public;
grant execute on function public.add_brainstorming_comment_v1(text, text) to authenticated;
