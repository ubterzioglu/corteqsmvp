-- Komuta Merkezi kod batch'leri tamamlandıktan ve canlıda doğrulandıktan sonra çalıştırılır.
-- Her blok hedef kimlikleri önce guard ile doğrular; arşivli/silinmiş kayıtları tamamlamaz.

-- Batch 2 — hoş geldin e-postası canlı anahtarı ve yeni üye E2E doğrulaması tamamlandıktan sonra.
do $$
declare
  v_ids constant uuid[] := array[
    '38f7f8ac-16eb-440d-ad0d-c2ebf0c1e19a'::uuid
  ];
  v_found integer;
  v_updated integer;
begin
  select count(*) into v_found
  from public.command_center_items
  where id = any(v_ids) and deleted_at is null and archived_at is null;
  if v_found <> array_length(v_ids, 1) then
    raise exception 'Batch 2 hedefleri degismis; beklenen %, bulunan %.', array_length(v_ids, 1), v_found;
  end if;

  update public.command_center_items
  set status = 'Tamamlandi'
  where id = any(v_ids) and deleted_at is null and archived_at is null and status <> 'Tamamlandi';
  get diagnostics v_updated = row_count;
  raise notice 'Batch 2: % kayit tamamlandi.', v_updated;
end
$$;

-- Batch 3 — Üye Takibi ekranı, RLS ve 27 ekin canlı sayımı doğrulandıktan sonra.
do $$
declare
  v_ids constant uuid[] := array[
    '7c6401c3-ce62-47df-a121-67ee2676f381'::uuid,
    '6ef6797a-5a82-4639-9053-3a8589ce05e6'::uuid
  ];
  v_found integer;
  v_updated integer;
begin
  select count(*) into v_found
  from public.command_center_items
  where id = any(v_ids) and deleted_at is null and archived_at is null;
  if v_found <> array_length(v_ids, 1) then
    raise exception 'Batch 3 hedefleri degismis; beklenen %, bulunan %.', array_length(v_ids, 1), v_found;
  end if;

  update public.command_center_items
  set status = 'Tamamlandi'
  where id = any(v_ids) and deleted_at is null and archived_at is null and status <> 'Tamamlandi';
  get diagnostics v_updated = row_count;
  raise notice 'Batch 3: % kayit tamamlandi.', v_updated;
end
$$;

-- Batch 4 — B+B desteği canlıda doğrulandı; mevcut kategori Sosyal Medya ihtiyacını kapsıyor.
do $$
declare
  v_ids constant uuid[] := array[
    'e7debd72-d5c0-42fd-9d40-c4fc89552008'::uuid,
    'bb0c2b6b-49e5-4c90-8bac-c1c1857979cf'::uuid
  ];
  v_found integer;
  v_updated integer;
begin
  select count(*) into v_found
  from public.command_center_items
  where id = any(v_ids) and deleted_at is null and archived_at is null;
  if v_found <> array_length(v_ids, 1) then
    raise exception 'Batch 4 hedefleri degismis; beklenen %, bulunan %.', array_length(v_ids, 1), v_found;
  end if;

  update public.command_center_items
  set status = 'Tamamlandi'
  where id = any(v_ids) and deleted_at is null and archived_at is null and status <> 'Tamamlandi';
  get diagnostics v_updated = row_count;
  raise notice 'Batch 4: % kayit tamamlandi.', v_updated;
end
$$;

-- Batch 4 pano hijyeni — test/çöp kaydı soft-delete edilir.
do $$
declare
  v_id constant uuid := 'b923edf8-6c32-4851-9110-4860452fda60'::uuid;
  v_found integer;
  v_updated integer;
begin
  select count(*) into v_found from public.command_center_items where id = v_id;
  if v_found <> 1 then
    raise exception 'Batch 4 cop kaydi bulunamadi.';
  end if;

  update public.command_center_items set deleted_at = now() where id = v_id and deleted_at is null;
  get diagnostics v_updated = row_count;
  raise notice 'Batch 4: % cop kayit soft-delete edildi.', v_updated;
end
$$;

-- Batch 5 — referral QR SVG/PNG indirmeleri canlı panelde doğrulandıktan sonra.
do $$
declare
  v_ids constant uuid[] := array[
    'c0dc7a45-87a8-4b32-b829-ebb23ae1741b'::uuid
  ];
  v_found integer;
  v_updated integer;
begin
  select count(*) into v_found
  from public.command_center_items
  where id = any(v_ids) and deleted_at is null and archived_at is null;
  if v_found <> array_length(v_ids, 1) then
    raise exception 'Batch 5 hedefleri degismis; beklenen %, bulunan %.', array_length(v_ids, 1), v_found;
  end if;

  update public.command_center_items
  set status = 'Tamamlandi'
  where id = any(v_ids) and deleted_at is null and archived_at is null and status <> 'Tamamlandi';
  get diagnostics v_updated = row_count;
  raise notice 'Batch 5: % kayit tamamlandi.', v_updated;
end
$$;

select id, status, title, deleted_at
from public.command_center_items
where id = any(array[
  '38f7f8ac-16eb-440d-ad0d-c2ebf0c1e19a'::uuid,
  '7c6401c3-ce62-47df-a121-67ee2676f381'::uuid,
  '6ef6797a-5a82-4639-9053-3a8589ce05e6'::uuid,
  'e7debd72-d5c0-42fd-9d40-c4fc89552008'::uuid,
  'bb0c2b6b-49e5-4c90-8bac-c1c1857979cf'::uuid,
  'b923edf8-6c32-4851-9110-4860452fda60'::uuid,
  'c0dc7a45-87a8-4b32-b829-ebb23ae1741b'::uuid
])
order by id;
