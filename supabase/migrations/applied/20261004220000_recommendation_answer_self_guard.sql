-- İnceleme düzeltmesi (M17-M22 turu code review) — answer_recommendation_v1 yeniden.
--
-- İKİ bulgu kapatılır:
--   [W3] SELF-ANSWER: talep SAHİBİ kendi talebini "yanıtlayamamalı" — kendi
--        yanıtı open→answered çevirip talebi varsayılan listeden düşürüyordu
--        (kimse gerçekten yanıtlamadan). Yeni TEK kod: recommendation_self_answer.
--        Sıra: auth → ban → not_found → SELF → closed → body (fixture erken
--        kontrole takılmaz: self testi AÇIK ve SAHİBİNİN olduğu taleple koşar).
--   [W6] is_professional SAPMASI: türetme, M18/M22 aday kümesinden eksikti —
--        `visibility='public'` + directory-visible rol join'i EKLENDİ (admin/test/
--        private hesaplar herkese açık "Profesyonel" rozeti ALAMAZ). Yanıt
--        içeriğiyle değil DİZİN görünürlüğüyle tutarlı rozet.
--
-- M17'nin kalan davranışı (ban, closed, body limiti, unique, open→answered)
-- AYNEN korunur — M17 kabulü (güncellenmiş K5 + yeni K12) yeniden koşulur.
-- Not: 23505 (ikinci yanıt) ön-kontrolü BİLEREK eklenmedi (öneri bulgusu,
-- borç satırında); unique constraint veri bütünlüğünü zaten koruyor.

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

  -- [W3] Sahip kendi talebini yanıtlayamaz (kendi yanıtı open→answered çevirip
  -- talebi varsayılan 'open' listesinden düşürüyordu — durum makinesi bozulması).
  if v_uid = v_req.user_id then
    raise exception 'recommendation_self_answer';
  end if;

  if v_req.status = 'closed' then
    raise exception 'recommendation_request_closed';
  end if;

  if length(v_body) < 1 or length(v_body) > 4000 then
    raise exception 'recommendation_invalid_body';
  end if;

  -- [W6] is_professional İSTEMCİDEN ALINMAZ — katalogdan TÜRETİLİR ve M18/M22
  -- aday kümesiyle AYNI dizin-görünürlük kuralını uygular: member + published +
  -- PUBLIC + non-placeholder + directory-visible rol (admin/test rozet alamaz).
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
  'M17: tavsiye talebine yanıt (tek yazma yolu) — inceleme düzeltmesi: SAHİP '
  'kendi talebini yanıtlayamaz (recommendation_self_answer) · is_professional '
  'M18/M22 ile AYNI dizin-görünürlük kuralıyla türetilir (public + directory-'
  'visible rol) · ban kill-switch · ilk GERCEK yanıtta open→answered.';

commit;
