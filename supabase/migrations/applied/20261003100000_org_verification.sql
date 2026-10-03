-- G06 — Kurumsal doğrulama: iz kolonları + belge kovası + talep RPC'si.
--
-- Karar K09(a) (kullanıcı, 03.10.2026): **MEVCUT KATALOG DOĞRULAMASI kullanılır.**
-- `verification_level` diye YENİ BİR KOLON AÇILMAZ. "Seviye 2" bu şemada
-- `catalog_items.verification_status = 'verified'` demektir.
--
-- NEDEN (02.10 ölçümü, 03.10'da tazelendi): tabloda ZATEN iki doğrulama kavramı
-- var — `verification_status` (CHECK'li) ve `is_verified` (bool). Üçüncüsünü
-- eklemek bu reponun defalarca belgelediği "ikinci kaynak" sınıfını açardı.
--
-- CANLI ÖLÇÜM (03.10):
--   catalog_items 651 · unverified 454 · claimed 190 · verified 7
--   Organization% 262 · bunlardan verified 6
--   catalog_item_claims: yalnız 2 satır (`editor_access`, pending)
--   `claim_type` üzerinde CHECK **YOK** → yeni tür serbest (ölçüldü, varsayılmadı)
--
-- 🔴 **EN ÖNEMLİ ÖLÇÜM — kapının nereye konacağını bu belirledi:**
--   262 kurumsal kaydın **249'unda HİÇBİR kişi bağı yok**
--   (created_by dolu 13 · linked_user_id dolu 3 · yönetici satırı olan 13).
--   Yani kayıtların %95'i sahipsiz içe aktarılmış kataloglardır.
--   Politika §6 doğrulamayı KİŞİYE bağlıyor ("Ekleyen Seviye 2 doğrulanmış
--   kuruluş değilse"), bu yüzden talep açabilmek için kişi↔kuruluş bağı ŞART.
--   Bağı olmayan kullanıcı ÖNCE mevcut sahiplenme akışından geçer
--   (`claim_type='editor_access'`, zaten canlıda) — iki adımlı akış BİLİNÇLİDİR:
--   sahipsiz bir kaydı doğrulatmak, o kurumu temsil etmekle aynı şey değildir.
--
-- ⚠️ Mevcut 7 `verified` kaydın izi (kim/ne zaman) YOKTUR ve UYDURULMAZ.
--    `verified_at`/`verified_by_user_id` onlarda NULL kalır; geriye dönük bir
--    zaman damgası yazmak sahte köken bilgisi üretirdi.

-- ── 1) İz kolonları ─────────────────────────────────────────────────────────
alter table public.catalog_items
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by_user_id uuid references auth.users(id) on delete set null;

comment on column public.catalog_items.verified_at is
  'Kurumsal doğrulamanın onaylandığı an. 03.10 öncesi 7 verified kayıtta NULL '
  '(iz yok, geriye dönük uydurulmadı).';
comment on column public.catalog_items.verified_by_user_id is
  'Onayı veren yönetici. G07 inceleme ekranı doldurur.';

-- ── 2) Belge kovası (PRIVATE) ───────────────────────────────────────────────
-- ⚠️ `application/octet-stream` BİLEREK YOK: her şeyi kabul eden bir değerdir.
-- ⚠️ İstemci sınırı bu sayıyı AŞAMAZ; sözleşme testi iki tarafı karşılaştırır
--    (kariyer kovasında yaşanan "istemci 50 MB, kova 25 MB" tuzağı).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-verification-docs',
  'org-verification-docs',
  false,
  15728640,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Depolama anahtarı: `<user_id>/<item_id>/<güvenli-ad>`.
-- İlk klasör KULLANICI kimliğidir; politika bunu denetler, böylece kimse
-- başkasının klasörüne yazamaz/okuyamaz (G13'teki `path_forbidden` deseni).
drop policy if exists org_verification_docs_insert_own on storage.objects;
create policy org_verification_docs_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'org-verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists org_verification_docs_read_own_or_admin on storage.objects;
create policy org_verification_docs_read_own_or_admin on storage.objects
  for select to authenticated
  using (
    bucket_id = 'org-verification-docs'
    -- ⚠️ `is_admin()` PARAMETRESİZ DEĞİLDİR: canlıda imza `is_admin(uid uuid)`
    -- ve sıfır argümanlı aşırı yükleme YOKTUR (ölçüldü 03.10). Parametresiz
    -- çağrı migration'ı "function does not exist" ile düşürür.
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin(auth.uid()))
  );

drop policy if exists org_verification_docs_delete_own on storage.objects;
create policy org_verification_docs_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'org-verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── 3) Türetilmiş seviye (tek kaynak: verification_status) ──────────────────
-- Grup ekleme kapısı (politika §6) bunu KİŞİ üzerinden sorar.
create or replace function public.is_level2_org_representative(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.catalog_items ci
    where ci.platform_role_key like 'Organization%'
      and ci.verification_status = 'verified'
      and ci.deleted_at is null
      and (
        ci.created_by = p_user_id
        or ci.linked_user_id = p_user_id
        or exists (
          select 1 from public.catalog_item_managers m
          where m.item_id = ci.id and m.user_id = p_user_id and m.status = 'active'
        )
      )
  );
$$;

comment on function public.is_level2_org_representative(uuid) is
  'Politika §6 kapısı: kullanıcı DOĞRULANMIŞ (Seviye 2) bir kuruluşu temsil '
  'ediyor mu? Seviye ayrı bir kolondan DEĞİL, catalog_items.verification_status '
  '= ''verified'' değerinden TÜRETİLİR (K09a). İkinci bir seviye kolonu açma.';

revoke all on function public.is_level2_org_representative(uuid) from public;
grant execute on function public.is_level2_org_representative(uuid) to authenticated, service_role;

-- ── 4) Doğrulama talebi (tek yazma yolu) ────────────────────────────────────
create or replace function public.request_org_verification_v1(
  p_item_id uuid,
  p_doc_paths text[],
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c_claim_type constant text := 'verification_level_2';
  c_max_documents constant int := 5;
  v_user uuid := auth.uid();
  v_item public.catalog_items%rowtype;
  v_linked boolean;
  v_path text;
  v_claim_id uuid;
begin
  if v_user is null then
    raise exception 'org_verification_auth_required';
  end if;

  select * into v_item from public.catalog_items where id = p_item_id and deleted_at is null;
  if not found then
    raise exception 'org_verification_item_not_found';
  end if;

  if v_item.platform_role_key not like 'Organization%' then
    raise exception 'org_verification_item_not_organization';
  end if;

  if v_item.verification_status = 'verified' then
    raise exception 'org_verification_already_verified';
  end if;

  -- Kişi↔kuruluş bağı ŞART. Bağı olmayan kullanıcı önce sahiplenme akışından
  -- geçer (`editor_access`). Ölçüm: 262 kurumsal kaydın 249'unda bağ YOK.
  v_linked := (
    v_item.created_by = v_user
    or v_item.linked_user_id = v_user
    or exists (
      select 1 from public.catalog_item_managers m
      where m.item_id = p_item_id and m.user_id = v_user and m.status = 'active'
    )
  );
  if not coalesce(v_linked, false) then
    raise exception 'org_verification_not_linked';
  end if;

  if p_doc_paths is null or array_length(p_doc_paths, 1) is null then
    raise exception 'org_verification_document_required';
  end if;
  if array_length(p_doc_paths, 1) > c_max_documents then
    raise exception 'org_verification_too_many_documents';
  end if;

  -- Her yol ÇAĞIRANIN klasöründe olmalı. Depolama politikası da aynı şeyi
  -- denetler; bu ikinci savunmadır (başkasının belgesini kendi talebine
  -- iliştirme yolu kapanır).
  foreach v_path in array p_doc_paths loop
    if v_path is null or v_path !~ ('^' || v_user::text || '/') then
      raise exception 'org_verification_path_forbidden';
    end if;
  end loop;

  if exists (
    select 1 from public.catalog_item_claims
    where item_id = p_item_id and claim_type = c_claim_type and status = 'pending'
  ) then
    raise exception 'org_verification_pending_exists';
  end if;

  -- ⚠️ `status` ve `claim_type` GÖVDEDE zorlanır; istemci parametre olarak
  -- gönderemez (M02/M03'teki "kural SQL'de olmalı" dersi).
  insert into public.catalog_item_claims (
    item_id, requested_by_user_id, claim_type, evidence, note, status
  )
  values (
    p_item_id,
    v_user,
    c_claim_type,
    jsonb_build_object('documents', to_jsonb(p_doc_paths), 'bucket', 'org-verification-docs'),
    nullif(btrim(coalesce(p_note, '')), ''),
    'pending'
  )
  returning id into v_claim_id;

  return v_claim_id;
end;
$$;

comment on function public.request_org_verification_v1(uuid, text[], text) is
  'Kurumsal doğrulama (Seviye 2) talebi açar. Tek yazma yolu: status ve '
  'claim_type gövdede zorlanır. Kişi↔kuruluş bağı şarttır; bağsız kullanıcı '
  'önce sahiplenme (editor_access) akışından geçer.';

revoke all on function public.request_org_verification_v1(uuid, text[], text) from public, anon;
grant execute on function public.request_org_verification_v1(uuid, text[], text) to authenticated;
