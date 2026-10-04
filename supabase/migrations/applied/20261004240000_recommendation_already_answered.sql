-- F11 (inceleme borcu) · answer_recommendation_v1: ikinci yanıt ÖN KONTROLLE
-- tek koda bağlanır — `recommendation_already_answered`.
--
-- ÖNCESİ: ikinci yanıt `recommendation_answers_unique_per_user` ihlaline düşüp
-- HAM 23505 üretiyordu; 23505'te recommendation_* kodu olmadığından çözümücü
-- "İşlem tamamlanamadı. Lütfen tekrar dene." genel mesajına düşüyordu —
-- kullanıcıyı YENİDEN denemeye davet eden yanlış yönlendirme.
--
-- SONRASI: ön kontrol tek kod fırlatır (TS harita + ayna aynı batch'te);
-- unique constraint İKİNCİ SAVUNMA hattı olarak KALIR (silinmez — yarış
-- durumunda son söz constraint'in). Sıra: auth → ban → not_found → self →
-- closed → ALREADY_ANSWERED → body (fixture erken kontrole takılmaz: K6
-- açık talepte, sahibi OLMAYAN, daha önce YANITLAMIŞ kullanıcıyla koşar).
--
-- 20261004220000'in kalan davranışı (self_answer guard, is_professional dizin
-- görünürlük kümesi, ban, open→answered) AYNEN korunur — M17 kabulü (K6
-- güncel) yeniden koşulur.

begin;

create or replace function public.answer_recommendation_v1(
  p_request_id uuid,
  p_body text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_body text := trim(coalesce(p_body, ''));
  v_req public.recommendation_requests%rowtype;
  v_is_professional boolean;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'recommendation_auth_required';
  end if;

  -- 🔴 BAN KILL-SWITCH (tek nokta): banlı kullanıcı otomatik reddedilir.
  if public.is_cadde_banned(v_uid) then
    raise exception 'recommendation_banned';
  end if;

  select * into v_req from public.recommendation_requests where id = p_request_id for update;
  if v_req.id is null then
    raise exception 'recommendation_request_not_found';
  end if;

  -- Sahip kendi talebini yanıtlayamaz (inceleme W3, 20261004220000).
  if v_uid = v_req.user_id then
    raise exception 'recommendation_self_answer';
  end if;

  if v_req.status = 'closed' then
    raise exception 'recommendation_request_closed';
  end if;

  -- [F11] İkinci yanıt ÖN KONTROLDE tek kodla reddedilir (ham 23505 genel
  -- mesaja düşüp "tekrar dene" diyordu). Unique constraint ikinci savunma.
  if exists (
    select 1 from public.recommendation_answers
     where request_id = p_request_id and user_id = v_uid
  ) then
    raise exception 'recommendation_already_answered';
  end if;

  if length(v_body) < 1 or length(v_body) > 4000 then
    raise exception 'recommendation_invalid_body';
  end if;

  -- is_professional İSTEMCİDEN ALINMAZ — katalogdan TÜRETİLİR ve M18/M22 aday
  -- kümesiyle AYNI dizin-görünürlük kuralını uygular (inceleme W6).
  select exists (
    select 1
    from public.catalog_item_managers m
    join public.catalog_items ci on ci.id = m.item_id
    join public.roles rl on rl.key = ci.platform_role_key and rl.is_directory_visible = true
    where m.user_id = v_uid and m.status = 'active'
      and ci.item_type = 'member' and ci.status = 'published'
      and ci.visibility = 'public'
      and coalesce(ci.is_placeholder, false) = false
  ) into v_is_professional;

  insert into public.recommendation_answers
    (request_id, user_id, body, is_professional)
  values
    (p_request_id, v_uid, v_body, v_is_professional)
  returning id into v_id;

  -- İlk yanıtla talep 'open' → 'answered' (self-answer yukarıda reddedildiği
  -- için bu geçiş ARTIK yalnız gerçek başkasının yanıtıyla olur).
  if v_req.status = 'open' then
    update public.recommendation_requests
       set status = 'answered', updated_at = now()
     where id = p_request_id;
  end if;

  return v_id;
end;
$$;

comment on function public.answer_recommendation_v1(uuid,text) is
  'M17: tavsiye talebine yanıt (tek yazma yolu) — F11: ikinci yanıt TEK kodla '
  'reddedilir (recommendation_already_answered; unique constraint ikinci '
  'savunma). Sahip kendi talebini yanıtlayamaz (self_answer) · is_professional '
  'M18/M22 dizin-görünürlük kümesiyle TÜRETİLİR · ban kill-switch · ilk GERCEK '
  'yanıtta open→answered.';

commit;
