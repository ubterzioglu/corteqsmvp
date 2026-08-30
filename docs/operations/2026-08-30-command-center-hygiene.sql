-- Komuta Merkezi pano hijyeni.
-- Yedi duplicate çiftte daha açıklayıcı kayıt canonical tutulur; eski kaydın başlığı,
-- sorumlusu ve kimliği canonical detail alanına taşınır. Duplicate satır recoverable
-- soft-delete edilir. Görev olmayan iki karar/not satırı arşivlenir.

begin;

do $$
declare
  v_expected constant integer := 14;
  v_found integer;
begin
  select count(*) into v_found
  from public.command_center_items
  where id = any(array[
    '37ee0367-2916-428c-ac11-a3c051363f7f'::uuid,
    'bf5485fd-d1e3-41c2-aa99-472a33b985ac'::uuid,
    '75454af7-b450-4e03-ad91-31eecea85b2d'::uuid,
    'fa50ccc7-6d7f-4e2a-b951-845b25cbba16'::uuid,
    '622f5cc5-89b3-4e51-9325-682fead84c27'::uuid,
    'ed00d945-1bae-4028-889d-8533928855ae'::uuid,
    'f7a1ee76-2883-478f-937b-412f0dbc63b9'::uuid,
    '9fa1b3e3-e70a-4d94-b527-ad8ff90a0e64'::uuid,
    '78120e82-a933-46b2-a6d5-7017635396cb'::uuid,
    '2a87081d-621e-499e-b2e4-6a74bad21ac3'::uuid,
    'b25cde7e-00ce-437d-a95e-93e7c44496cb'::uuid,
    '3211bf9a-5724-4e0f-9104-eed1f941c211'::uuid,
    'a3fd7819-93cb-4a3a-b9e8-e6f2ab8dfcdb'::uuid,
    '12c929da-fe51-4c02-836d-a9ffae00af55'::uuid
  ])
    and item_type = 'todo'
    and deleted_at is null
    and archived_at is null;

  if v_found <> v_expected then
    raise exception 'Duplicate pano seti değişmiş; beklenen %, bulunan %.', v_expected, v_found;
  end if;
end
$$;

with pairs(canonical_id, duplicate_id) as (
  values
    ('37ee0367-2916-428c-ac11-a3c051363f7f'::uuid, 'bf5485fd-d1e3-41c2-aa99-472a33b985ac'::uuid),
    ('75454af7-b450-4e03-ad91-31eecea85b2d'::uuid, 'fa50ccc7-6d7f-4e2a-b951-845b25cbba16'::uuid),
    ('622f5cc5-89b3-4e51-9325-682fead84c27'::uuid, 'ed00d945-1bae-4028-889d-8533928855ae'::uuid),
    ('f7a1ee76-2883-478f-937b-412f0dbc63b9'::uuid, '9fa1b3e3-e70a-4d94-b527-ad8ff90a0e64'::uuid),
    ('78120e82-a933-46b2-a6d5-7017635396cb'::uuid, '2a87081d-621e-499e-b2e4-6a74bad21ac3'::uuid),
    ('b25cde7e-00ce-437d-a95e-93e7c44496cb'::uuid, '3211bf9a-5724-4e0f-9104-eed1f941c211'::uuid),
    ('a3fd7819-93cb-4a3a-b9e8-e6f2ab8dfcdb'::uuid, '12c929da-fe51-4c02-836d-a9ffae00af55'::uuid)
)
update public.command_center_items canonical
set detail = concat_ws(
  E'\n\n',
  nullif(canonical.detail, ''),
  format(
    '[Pano hijyeni 2026-08-30] Duplicate kayıt birleştirildi. Eski kayıt: %s · başlık: %s · sorumlu: %s.',
    duplicate.id,
    duplicate.title,
    coalesce(duplicate.assignee, '—')
  )
)
from pairs
join public.command_center_items duplicate on duplicate.id = pairs.duplicate_id
where canonical.id = pairs.canonical_id
  and canonical.detail not like '%[Pano hijyeni 2026-08-30]%';

update public.command_center_items
set deleted_at = now()
where id = any(array[
  'bf5485fd-d1e3-41c2-aa99-472a33b985ac'::uuid,
  'fa50ccc7-6d7f-4e2a-b951-845b25cbba16'::uuid,
  'ed00d945-1bae-4028-889d-8533928855ae'::uuid,
  '9fa1b3e3-e70a-4d94-b527-ad8ff90a0e64'::uuid,
  '2a87081d-621e-499e-b2e4-6a74bad21ac3'::uuid,
  '3211bf9a-5724-4e0f-9104-eed1f941c211'::uuid,
  '12c929da-fe51-4c02-836d-a9ffae00af55'::uuid
])
  and deleted_at is null;

do $$
declare
  v_found integer;
begin
  select count(*) into v_found
  from public.command_center_items
  where id = any(array[
    '451805ef-a7e9-4292-a441-d24408dc11d4'::uuid,
    '0a569d3f-ea56-49b3-aa03-e4d021354a00'::uuid
  ]) and deleted_at is null and archived_at is null;

  if v_found <> 2 then
    raise exception 'Görev olmayan pano seti değişmiş; beklenen 2, bulunan %.', v_found;
  end if;

  update public.command_center_items
  set archived_at = now(),
      detail = concat_ws(E'\n\n', nullif(detail, ''), '[Pano hijyeni 2026-08-30] Bu kayıt eylem değil, karar/bağlam notudur; görev kuyruğundan arşivlendi.')
  where id = any(array[
    '451805ef-a7e9-4292-a441-d24408dc11d4'::uuid,
    '0a569d3f-ea56-49b3-aa03-e4d021354a00'::uuid
  ]) and deleted_at is null and archived_at is null;
end
$$;

-- Eski, çok konulu MVP V2 epic'i yalnız kalan gerçek sonuca daralt.
update public.command_center_items
set title = 'MVP V2 merge: WhatsApp grup gönderi akışını ürünleştir',
    status = 'Beklemede',
    detail = concat_ws(
      E'\n\n',
      nullif(detail, ''),
      '[Epic ayrıştırma 2026-08-30] Auth ve public demo işleri tamamlanmış ayrı kartlarla doğrulandı. Sosyal Medya kategorisi mevcut kategoriyle karşılandı. Bu parent yalnız kullanıcıların WhatsApp gruplarını listeleyip paylaşabilmesi için kalan ürün/politika akışını temsil eder; politika kartı 2ce74249, sosyal metin kartı 635d1ce7.'
    )
where id = 'fc13bebf-e342-48e5-946b-5cd1a62e1020'::uuid
  and deleted_at is null
  and archived_at is null
  and title <> 'MVP V2 merge: WhatsApp grup gönderi akışını ürünleştir';

-- Mimari karar artık belirsiz değil; dependent bot kartları uygulama olarak açık kalır.
update public.command_center_items
set title = 'WhatsApp bot mimarisi: resmî Meta Cloud API foundation',
    detail = concat_ws(
      E'\n\n',
      nullif(detail, ''),
      '[Mimari karar 2026-08-30] Resmî Meta Cloud API seçildi. İlk teslim: imza doğrulamalı webhook, idempotent event ingestion ve admin müşteri talepleri kuyruğu. Admin/Kanal/Mastermind/Role-based/çok dilli bot kartları bu foundation sonrasında bağımsız capability olarak kalır.'
    )
where id = '387ae286-303c-4ec9-9a99-c2fef63a60b5'::uuid
  and deleted_at is null
  and archived_at is null
  and title <> 'WhatsApp bot mimarisi: resmî Meta Cloud API foundation';

commit;

select id, title, status, archived_at, deleted_at
from public.command_center_items
where id = any(array[
  '37ee0367-2916-428c-ac11-a3c051363f7f'::uuid,
  'bf5485fd-d1e3-41c2-aa99-472a33b985ac'::uuid,
  '451805ef-a7e9-4292-a441-d24408dc11d4'::uuid,
  'fc13bebf-e342-48e5-946b-5cd1a62e1020'::uuid,
  '387ae286-303c-4ec9-9a99-c2fef63a60b5'::uuid
])
order by id;

