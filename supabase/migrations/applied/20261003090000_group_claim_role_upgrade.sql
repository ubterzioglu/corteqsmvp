-- K10a — grup sahipliği doğrulanınca VARSAYILAN rol yükseltilir.
--
-- Karar: K10(a) "YÜKSELTME — tek rol kalır" (kullanıcı, 03.10.2026).
-- Çoklu rol (b) REDDEDİLDİ; erteleme (c) seçilmedi.
--
-- NEDEN GEREKTİ (G13'ün ölçümü): `user_role_assignments` PK'si (user_id), yani
-- kullanıcı başına TEK rol. G13 "mevcut rolü EZME" ilkesiyle yazıldığı için
-- `Community_*Admin` üretimde HİÇ KİMSEYE atanamıyordu: signup trigger'ı
-- (`handle_new_auth_user_role`) her yeni kullanıcıya `User_DiasporaMember`
-- atıyor, dolayısıyla herkesin zaten bir rolü var ve fonksiyon her seferinde
-- güvenli-atlama yoluna düşüp `role_skipped_reason` yazıyordu.
--
-- CANLI ÖLÇÜM (03.10, bu migration'dan önce):
--   175 kullanıcının tamamının tam 1 rolü var:
--     User_DiasporaMember 148 · User_CityAmbassador 9 · Consultant_PracticalLife 9
--     Organization_AssociationFoundation 3 · Admin_SuperAdmin 2
--     Consultant_TrademarkPatent 1 · Experimental_1/2/3 1+1+1
--   Yani yükseltmeye açılan kütle 148; kalan 27 kullanıcının rolü AYNEN korunur.
--
-- DEĞİŞEN TEK ŞEY: "kullanıcının rolü var" dalı ikiye ayrıldı.
--   · rol = varsayılan (`User_DiasporaMember`) → YÜKSELTİLİR (update)
--   · rol = başka herhangi bir şey        → eskisi gibi ATLANIR (ezilmez)
-- Admin_SuperAdmin, danışman ve kuruluş rolleri bu yüzden hâlâ korunur;
-- G13'ün "ezme-yok" kabulü daraltıldı, KALDIRILMADI.
--
-- ⚠️ `User_DiasporaMember` burada sabit yazılıdır. Bu YENİ bir ikinci kaynak
--    DEĞİLDİR: anahtar canlıda zaten 6 fonksiyonda sabit geçiyor
--    (`handle_new_auth_user_role` · `can_post_kopru` · `create_event_v1` ·
--     `sync_member_catalog_role_for_user` · `admin_bulk_import_catalog_items` ·
--     `_bulk_import_role_for_profession`). Varsayılan rol anahtarı değişirse
--    yedisi birden değişmelidir.
--
-- ⚠️ `user_role_assignments` üzerinde AFTER INSERT/UPDATE/DELETE trigger'ı var
--    (`trg_sync_member_catalog_role_from_user_role_assignments`). Yükseltme
--    artık INSERT değil UPDATE olduğu için trigger UPDATE yolundan tetiklenir;
--    üye katalog rolü buna göre senkronlanır. Kabul testinde ölçülür.
--
-- ⚠️ Tabloda `updated_at` DEFAULT now() taşır ama onu güncelleyen bir trigger
--    YOKTUR — update'te açıkça yazılmalıdır, yoksa satır değişir ama zaman
--    damgası ilk atama tarihinde donar.

create or replace function public.group_claim_apply_verified(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Signup trigger'ının (handle_new_auth_user_role) atadığı varsayılan rol.
  -- YALNIZ bu rol yükseltmeye açıktır.
  c_default_role_key constant text := 'User_DiasporaMember';
  v_claim public.group_claims%rowtype;
  v_platform text;
  v_role_key text;
  v_role_id uuid;
  v_existing_role_id uuid;
  v_existing_role_key text;
  v_has_role boolean;
begin
  select * into v_claim
  from public.group_claims
  where id = p_claim_id
  for update;
  if not found or v_claim.status <> 'pending' then
    raise exception 'group_claim_not_verifiable';
  end if;

  select platform into v_platform
  from public.whatsapp_landings
  where id = v_claim.landing_id;

  update public.group_claims
     set status = 'verified', reviewed_at = coalesce(reviewed_at, now())
   where id = p_claim_id;

  -- Sahiplik: G12/G13 guard bayrağıyla (ownership doğrudan yazıma kapalı)
  perform set_config('group_status.via_rpc', 'on', true);
  update public.whatsapp_landings
     set ownership = 'verified',
         owner_user_id = v_claim.user_id
   where id = v_claim.landing_id;
  perform set_config('group_status.via_rpc', '', true);

  -- Rol ataması: platforma göre Community_*Admin (tasarım §3.B.4).
  v_role_key := case v_platform
    when 'telegram' then 'Community_TelegramAdmin'
    when 'discord' then 'Community_DiscordAdmin'
    else 'Community_WhatsAppAdmin'
  end;

  select id into v_role_id
  from public.roles
  where key = v_role_key and deleted_at is null;

  select ura.role_id, r.key into v_existing_role_id, v_existing_role_key
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = v_claim.user_id;
  v_has_role := found;

  if v_role_id is null then
    -- Hedef rol yoksa hiçbir şey yapma; sebebi yaz. (Rol silinirse sessizce
    -- yanlış rol atanmasın diye EN BAŞTA denetlenir.)
    update public.group_claims
       set role_assigned = false,
           role_skipped_reason = 'Rol bulunamadı: ' || v_role_key
     where id = p_claim_id;

  elsif v_has_role and v_existing_role_id = v_role_id then
    -- Zaten doğru roldeyse işlem yok, ama başarı sayılır (G13 kabulü).
    update public.group_claims set role_assigned = true where id = p_claim_id;

  elsif v_has_role and v_existing_role_key = c_default_role_key then
    -- K10a: VARSAYILAN rol yükseltilir. Tek rol modeli korunur (PK user_id).
    update public.user_role_assignments
       set role_id = v_role_id,
           updated_at = now()
     where user_id = v_claim.user_id;
    update public.group_claims set role_assigned = true where id = p_claim_id;

  elsif v_has_role then
    -- Varsayılan DIŞINDAKİ her rol korunur: admin, danışman, kuruluş, deneysel.
    update public.group_claims
       set role_assigned = false,
           role_skipped_reason = 'Kullanıcının rolü var: ' || v_existing_role_key
             || ' (PK tek rol; ezilmedi)'
     where id = p_claim_id;

  else
    -- Hiç rolü olmayan kullanıcı (signup trigger'ı öncesi/dışı kayıt).
    insert into public.user_role_assignments (user_id, role_id)
    values (v_claim.user_id, v_role_id);
    update public.group_claims set role_assigned = true where id = p_claim_id;
  end if;
end;
$$;

comment on function public.group_claim_apply_verified(uuid) is
  'İÇ yardımcı: talebi verified yapar, ownership+owner_user_id yazar (guard '
  'bayrağıyla), platform rolünü atar. K10a: yalnız VARSAYILAN rol '
  '(User_DiasporaMember) yükseltilir; diğer roller EZİLMEZ. Doğrudan '
  'çağrılamaz: tüm rollerden revoke''li, yalnız security-definer sahiplerinden '
  'çalışır.';

-- Grant matrisi G13'teki gibi kalır: bu fonksiyon dışarıya KAPALI.
revoke all on function public.group_claim_apply_verified(uuid)
  from public, anon, authenticated, service_role;
