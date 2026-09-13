-- İ1 (m163): Test içerikli cafe'yi canlı akıştan arşivle.
--
-- Ölçüldü (13 Eylül): cadde_cafes'te tam 1 satır bu kalıba uyuyor —
-- title='Test', summary='agwdhjsajkkjsddfgsegdsfsdg', status='published',
-- 27 Ağustos'ta oluşturulmuş, 2 üyeli (muhtemelen yönetici hesapları).
--
-- Kullanıcı onayıyla ARŞİVLENİYOR (silinmiyor) — geri alınması kolay olsun diye
-- fiziksel silme değil `archived_at` dolduruluyor. Yalnız bu tek satırı hedefler,
-- kimliği hem id hem summary ile birlikte kontrol edilir ki ileride başka bir
-- "Test" başlıklı gerçek kayıt yanlışlıkla yakalanmasın.

do $mig$
declare
  v_id uuid := '7d8fb505-a15f-4f43-adbb-1800ddf457e7';
  v_ok boolean;
begin
  select (title = 'Test' and summary = 'agwdhjsajkkjsddfgsegdsfsdg') into v_ok
  from public.cadde_cafes
  where id = v_id;

  if v_ok is null then
    raise notice 'Kayit zaten yok (id=%), atlaniyor', v_id;
    return;
  end if;

  if not v_ok then
    raise exception 'BEKLENMEYEN ICERIK: id=% artik test kaydiyla eslesmiyor, elle kontrol et', v_id;
  end if;

  update public.cadde_cafes
  set archived_at = now(), is_active = false, updated_at = now()
  where id = v_id and archived_at is null;
end
$mig$;
