-- G07 · Kurumsal doğrulama — ADMIN inceleme ekranı veri katmanı.
-- G06a talep toplar (request_org_verification_v1); bu migration yönetici tarafını
-- açar: kuyruk listeleme + onayla/reddet (sebep) + belge önizleme için depolama
-- SELECT politikasına moderatör eklenir.
--
-- ═══ KURALLAR ═══
--   • Onayda: catalog_items.verification_status='verified' + verified_at +
--     verified_by_user_id (kolonlar G06a'da açıldı) + claim.status/reviewed_*.
--   • claim_type/status İSTEMCİDEN ALINMAZ — gövdede 'verification_level_2' ve
--     'approved'/'rejected' zorlanır (M02/M03 dersi).
--   • is_admin(auth.uid()) PARAMETRELİ (parametresiz aşırı yükleme YOK). İnceleme
--     admin-only: G06a depolama SELECT politikası `read_own_or_admin` (is_admin)
--     olduğundan admin belge ÖNİZLEYEBİLİR; review RPC'leri de AYNI is_admin guard'ı
--     kullanır (is_moderator DEĞİL — moderatör önizleyemez, tutarsızlık olurdu).
--   • 🔴 Rozet/filtre yayılımı BU BATCH'TE YOK — dizin/arama belgesine DOKUNULMAZ
--     (verification_status yalnız catalog_items'ta set edilir; üye rozeti G07 kapsamı
--     dışı, ayrı iş).
--   • Depolama SELECT politikası DEĞİŞMEZ — G06a `read_own_or_admin` zaten is_admin
--     içerir (createSignedUrl admin için çalışır); bu migration politika DEĞİLDİR.
--
-- Hata kodları (TS çift yönlü harita: src/lib/admin/org-verification-review-api.ts):
--   org_verification_review_auth_required · _claim_not_found · _not_verification ·
--   _already_reviewed · _reason_required

begin;

-- ── Kuyruk: verification_level_2 talepleri (belge yolları + künye) ───────────
create or replace function public.admin_list_org_verifications(
  p_status text default 'pending'
)
returns table (
  claim_id uuid,
  item_id uuid,
  item_title text,
  item_slug text,
  requested_by_user_id uuid,
  requester_name text,
  note text,
  doc_paths text[],
  status text,
  review_reason text,
  created_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  reviewed_by_user_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'org_verification_review_auth_required' using errcode = '42501';
  end if;

  return query
  select
    c.id,
    c.item_id,
    ci.title,
    ci.slug,
    c.requested_by_user_id,
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
         join public.afs_attributes ac on ac.id = upa.attribute_id
        where upa.user_id = c.requested_by_user_id and ac.key = 'full_name' limit 1),
      split_part(coalesce(au.email, 'corteqs-uye'), '@', 1)
    ) as requester_name,
    c.note,
    coalesce((select array_agg(x) from jsonb_array_elements_text(c.evidence->'documents') x), '{}'::text[]) as doc_paths,
    c.status,
    c.evidence->>'review_reason' as review_reason,
    c.created_at,
    c.reviewed_at,
    c.reviewed_by_user_id
  from public.catalog_item_claims c
  join public.catalog_items ci on ci.id = c.item_id
  left join auth.users au on au.id = c.requested_by_user_id
  where c.claim_type = 'verification_level_2'
    and (p_status is null or btrim(p_status) = '' or c.status = p_status)
  order by case when c.status = 'pending' then 0 else 1 end, c.created_at desc;
end;
$$;

comment on function public.admin_list_org_verifications(text) is
  'G07: kurumsal doğrulama (verification_level_2) inceleme kuyruğu — belge yolları + '
  'künye. is_admin guard. p_status (default pending). Rozet/filtre yayılımı YOK.';

-- ── İnceleme: onayla (verification_status=verified) / reddet (sebep) ─────────
create or replace function public.review_org_verification_v1(
  p_claim_id uuid,
  p_approve boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_claim public.catalog_item_claims%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'org_verification_review_auth_required' using errcode = '42501';
  end if;

  select * into v_claim from public.catalog_item_claims where id = p_claim_id for update;
  if v_claim.id is null then
    raise exception 'org_verification_review_claim_not_found' using errcode = 'P0002';
  end if;
  if v_claim.claim_type <> 'verification_level_2' then
    raise exception 'org_verification_review_not_verification' using errcode = '22023';
  end if;
  if v_claim.status <> 'pending' then
    raise exception 'org_verification_review_already_reviewed' using errcode = '22023';
  end if;
  -- Reddin sebebi ZORUNLU (talep sahibi nedenini bilsin); onayda sebep isteğe bağlı.
  if not p_approve and v_reason is null then
    raise exception 'org_verification_review_reason_required' using errcode = '22023';
  end if;

  if p_approve then
    update public.catalog_item_claims
       set status = 'approved',
           reviewed_by_user_id = v_actor,
           reviewed_at = now(),
           updated_at = now(),
           evidence = case when v_reason is null then coalesce(v_claim.evidence, '{}'::jsonb)
                           else jsonb_set(coalesce(v_claim.evidence, '{}'::jsonb), '{review_reason}', to_jsonb(v_reason)) end
     where id = p_claim_id;

    update public.catalog_items
       set verification_status = 'verified',
           verified_at = now(),
           verified_by_user_id = v_actor,
           updated_at = now()
     where id = v_claim.item_id;

    return jsonb_build_object('claim_id', p_claim_id, 'decision', 'approved', 'item_id', v_claim.item_id);
  else
    update public.catalog_item_claims
       set status = 'rejected',
           reviewed_by_user_id = v_actor,
           reviewed_at = now(),
           updated_at = now(),
           evidence = jsonb_set(coalesce(v_claim.evidence, '{}'::jsonb), '{review_reason}', to_jsonb(v_reason))
     where id = p_claim_id;

    return jsonb_build_object('claim_id', p_claim_id, 'decision', 'rejected');
  end if;
end;
$$;

comment on function public.review_org_verification_v1(uuid, boolean, text) is
  'G07: kurumsal doğrulama talebini incele. Onay -> catalog_items.verification_status='
  'verified + verified_at + verified_by_user_id + claim approved/reviewed_*. Ret -> '
  'claim rejected + review_reason (evidence). is_admin guard · claim_type/status '
  'GÖVDEDE zorlanır · reddin sebebi ZORUNLU. Rozet/filtre yayılımı YOK (G07 kapsamı).';

-- ── Depolama SELECT politikası DEĞİŞMEZ ──────────────────────────────────────
-- G06a `org_verification_docs_read_own_or_admin` politikası ZATEN is_admin(auth.uid())
-- içerir → admin createSignedUrl ile belge önizleyebilir. Bu migration politika
-- DEĞİŞTİRMEZ (yanlış adla drop edip ikinci select politikası yaratmak sızıntı/
-- karışıklık olurdu). İnceleme admin-only olduğu için is_admin hem önizleme hem
-- review'da tutarlı tek guard.

-- ── Grant'lar ────────────────────────────────────────────────────────────────
revoke all on function public.admin_list_org_verifications(text) from public, anon;
revoke all on function public.review_org_verification_v1(uuid, boolean, text) from public, anon;
grant execute on function public.admin_list_org_verifications(text) to authenticated;
grant execute on function public.review_org_verification_v1(uuid, boolean, text) to authenticated;

commit;
