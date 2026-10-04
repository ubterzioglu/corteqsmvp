-- `catalog_items.is_verified` artık TÜRETİLMİŞ bir alandır (tek kaynak:
-- `verification_status`). Bu migration, bugün canlıda AÇIK olan sessiz bir
-- boşluğu kapatır.
--
-- ── BULUNAN KUSUR (ölçüldü 04.10) ───────────────────────────────────────────
-- Tabloda iki doğrulama kavramı yan yana duruyordu ve OKUYAN YÜZEYLER AYRIŞMIŞTI:
--   · Herkese açık dizin `is_verified` okuyor
--     (DirectoryResultCard · DirectoryResultRow · ListingCard ·
--      PublicProfileProvenanceCard · public-catalog-api sıralaması +
--      4 RPC: search_directory_catalog · list_public_directory_profiles ·
--      get_public_catalog_item_profile · get_catalog_item_public_page_v2)
--   · Yönetici ekranları ve G06/G07 akışı `verification_status` okuyup yazıyor
--
-- 🔴 SONUÇ 1 — G06/G07'nin görünür çıktısı kullanıcıya HİÇ ULAŞMIYORDU.
--    `review_org_verification_v1` onayda yalnız `verification_status='verified'`
--    (+ verified_at/verified_by_user_id) yazıyor, `is_verified`'a DOKUNMUYOR.
--    Yani yönetici kurumsal doğrulamayı onaylıyor, herkese açık dizinde
--    hiçbir şey değişmiyordu. Hata da vermiyordu.
--
-- 🔴 SONUÇ 2 — İKİ KAYIT HALKA YANLIŞ ROZET GÖSTERİYORDU.
--    `is_verified=true` ama `verification_status='unverified'`:
--      hcd-bilinc-cozumleme-butunsel-gelisim-genel
--      shaman-kocluk-ve-stratejik-danismanlik-toplulugu-genel
--    (ikisi de `community_group`; U07'de "davet linki boş" diye işaretlenen
--     aynı iki grup). Kimse bunları doğrulamamıştı — değer içe aktarmadan kalmıştı.
--
-- ── NEDEN SÜRÜKLENMİŞ (kök neden) ───────────────────────────────────────────
-- `is_verified` **YAZANI OLMAYAN** bir kolondu: ölçüldü, canlıda onu yazan
--   · 0 fonksiyon · 0 trigger · 0 TS kodu (TS yalnız okuyor/sıralıyor).
-- Yani içe aktarma döneminden donmuş bir değerdi ve herkese açık dizin ona
-- güveniyordu. Yazanı olmayan bir kolon, zamanla gerçekten ayrışır.
--
-- ── ÇÖZÜM ──────────────────────────────────────────────────────────────────
-- Kolon DÜŞÜRÜLMEZ, trigger ile her yazımda `verification_status`'tan türetilir.
-- ⚠️ GENERATED COLUMN tercih EDİLMEDİ (daha güçlü olurdu ama): Postgres'te var
--    olan bir kolonu generated'a çevirmenin yolu DROP + ADD'dir; bu kolonu okuyan
--    4 RPC var ve canlı örnek 1 GB RAM'in altında — gereksiz cascade riski.
--    Trigger aynı garantiyi verir, geri alınabilir, hiçbir şeyi düşürmez.
-- ⚠️ Çakışma riski YOK: kolonu yazan kimse olmadığı için trigger kimsenin
--    yazdığını ezmez.

-- ── 1) Geriye dönük düzeltme (2 kayıt) ──────────────────────────────────────
update public.catalog_items
   set is_verified = (verification_status = 'verified')
 where is_verified is distinct from (verification_status = 'verified');

-- ── 2) Bundan sonra sürüklenemez ────────────────────────────────────────────
create or replace function public.catalog_items_sync_is_verified()
returns trigger
language plpgsql
as $$
begin
  -- Tek kaynak `verification_status`. Gönderilen `is_verified` değeri YOK SAYILIR.
  new.is_verified := (new.verification_status = 'verified');
  return new;
end;
$$;

comment on function public.catalog_items_sync_is_verified() is
  'catalog_items.is_verified alanını verification_status''tan türetir. '
  'is_verified ELLE YAZILMAZ — herkese açık dizin rozetini o kolon çiziyor ve '
  'ayrışırsa kullanıcıya yanlış "doğrulanmış" bilgisi gider.';

drop trigger if exists trg_catalog_items_sync_is_verified on public.catalog_items;
create trigger trg_catalog_items_sync_is_verified
  before insert or update of verification_status, is_verified
  on public.catalog_items
  for each row
  execute function public.catalog_items_sync_is_verified();

comment on column public.catalog_items.is_verified is
  'TÜRETİLMİŞ: (verification_status = ''verified''). '
  'trg_catalog_items_sync_is_verified tarafından her yazımda zorlanır. '
  'Doğrudan yazmaya çalışma — değerin yok sayılır. Doğrulamayı değiştirmek '
  'için verification_status''ü güncelle (G07: review_org_verification_v1).';
