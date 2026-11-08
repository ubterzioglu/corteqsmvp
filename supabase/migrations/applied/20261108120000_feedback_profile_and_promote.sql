-- ============================================================
-- L10a — "Geri Bildirim" profil sekmesi + admin "REV'e taşı"
--
-- 1) list_my_feedback_v1(): üyenin KENDİ geri bildirimleri (tarih + durum).
--    member_feedback'e üye SELECT policy'si EKLENMEZ — okuma yalnız bu RPC'den
--    geçer (security definer, auth.uid() süzgeci, deleted_at is null, en çok 50).
--    Not: submitFeedback insert'e .select() zincirlemez; bu RPC o kuralı bozmaz.
-- 2) member_feedback.promoted_revision_id: bir geri bildirimin hangi revizyon
--    isteğine taşındığını tutar (nullable). Çifte terfiyi engelleyen kayıt budur.
-- 3) admin_promote_feedback_to_revision_v1(uuid): admin geri bildirimi
--    revision_requests'e taşır. Numara (#REV-N) BEFORE INSERT tetikleyicisinden
--    gelir (20260927190000) — burada elle yazılmaz.
--
-- Hata kodları (src/lib/feedback.ts FEEDBACK_ERROR_MESSAGES ile çift yönlü kilitli):
--   feedback_admin_required · feedback_id_required ·
--   feedback_not_found · feedback_already_promoted
--
-- Risk:     Düşük. Yeni nullable kolon + iki yeni fonksiyon; mevcut politika/şema değişmez.
-- Rollback: drop trigger if exists member_feedback_reset_admin_fields on public.member_feedback;
--           drop function public.member_feedback_reset_admin_fields();
--           drop function public.admin_promote_feedback_to_revision_v1(uuid);
--           drop function public.list_my_feedback_v1();
--           alter table public.member_feedback drop column if exists promoted_revision_id;
--           (Terfi ile oluşan revision_requests satırları silinmez — soft-delete ile kaldırılır.)
-- ============================================================

begin;

-- 1) Terfi kaydı --------------------------------------------------------------
alter table public.member_feedback
  add column if not exists promoted_revision_id uuid references public.revision_requests (id) on delete set null;

comment on column public.member_feedback.promoted_revision_id is
  'Bu geri bildirimin taşındığı revision_requests.id. Dolu ise ikinci terfi reddedilir (feedback_already_promoted).';

-- 1b) Üye INSERT'inde durum/terfi alanları sıfırlanır --------------------------
-- Politika yalnız created_by'ı denetler; tablo GRANT'i geniş olduğundan üye
-- status='arsiv' ya da promoted_revision_id doldurarak satırı ekleyebilirdi
-- (admin kuyruğunu gizler / terfi düğmesini kapatır). Admin ve servis (auth.uid() null) etkilenmez.
create or replace function public.member_feedback_reset_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin(auth.uid()) then
    new.status := 'yeni';
    new.promoted_revision_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists member_feedback_reset_admin_fields on public.member_feedback;
create trigger member_feedback_reset_admin_fields
before insert on public.member_feedback
for each row
execute function public.member_feedback_reset_admin_fields();

-- 2) Üyenin kendi geri bildirimleri ------------------------------------------
create or replace function public.list_my_feedback_v1()
returns table (
  id          uuid,
  body        text,
  page_path   text,
  status      text,
  created_at  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select f.id, f.body, f.page_path, f.status, f.created_at
  from public.member_feedback f
  where f.created_by = auth.uid()
    and f.deleted_at is null
  order by f.created_at desc
  limit 50;
$$;

revoke all on function public.list_my_feedback_v1() from public;
revoke all on function public.list_my_feedback_v1() from anon;
grant execute on function public.list_my_feedback_v1() to authenticated;

-- 3) Admin: geri bildirimi REV'e taşı ----------------------------------------
create or replace function public.admin_promote_feedback_to_revision_v1(p_feedback_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_fb        public.member_feedback;
  v_title     text;
  v_detail    text;
  v_rev_id    uuid;
  v_rev_num   integer;
begin
  if v_uid is null or not public.is_admin(v_uid) then
    raise exception 'feedback_admin_required' using errcode = '42501';
  end if;

  if p_feedback_id is null then
    raise exception 'feedback_id_required' using errcode = 'P0001';
  end if;

  -- Satırı kilitle: iki admin aynı anda tıklarsa ikincisi birincinin bitmesini bekler
  -- ve aşağıdaki promoted_revision_id denetimine takılır.
  select * into v_fb
  from public.member_feedback
  where id = p_feedback_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'feedback_not_found' using errcode = 'P0001';
  end if;

  if v_fb.promoted_revision_id is not null then
    raise exception 'feedback_already_promoted' using errcode = 'P0001';
  end if;

  -- ⚠️ Üye e-postası detail'e YAZILMAZ: revision_requests INSERT tetikleyicisi detail'i
  -- notification_email_outbox.payload'a kopyalar; oradan her moderatöre ve abone adminlere
  -- gider — member_feedback'in (yalnız admin) görünürlüğünden geniştir.
  v_title := coalesce(
    nullif(left(btrim(regexp_replace(v_fb.body, '\s+', ' ', 'g')), 80), ''),
    'Geri bildirim'
  );
  v_detail := v_fb.body
    || E'\n\n— Sayfa: ' || coalesce(nullif(v_fb.page_path, ''), 'belirtilmemiş')
    || E'\n— Kaynak: Geri bildirim #' || v_fb.id::text;

  insert into public.revision_requests (title, detail, area_label, status, created_by)
  values (v_title, v_detail, 'Geri Bildirim', 'acik', v_uid)
  returning id, revision_number into v_rev_id, v_rev_num;

  update public.member_feedback
  set promoted_revision_id = v_rev_id,
      status = case when status = 'yeni' then 'okundu' else status end
  where id = v_fb.id;

  return jsonb_build_object('revision_id', v_rev_id, 'revision_number', v_rev_num);
end;
$$;

revoke all on function public.admin_promote_feedback_to_revision_v1(uuid) from public;
revoke all on function public.admin_promote_feedback_to_revision_v1(uuid) from anon;
grant execute on function public.admin_promote_feedback_to_revision_v1(uuid) to authenticated;

commit;
