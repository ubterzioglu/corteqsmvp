# Tek Bireysel Profil — Tasarım (Spec)

**Tarih:** 2026-06-26
**Durum:** Onaylandı

## Problem

Profil seçim ekranında (`/profile`) bazı hesaplar **birden fazla "Bireysel" profil** görüyor.
Görseldeki örnek: aynı oturumda `Umut Barış Terzioğlu` ve `Umut Baris Terzioglu`
iki ayrı Bireysel kart olarak çıkıyor (+ bir `almanya101` Kuruluş kartı).

Kural: **bir e-posta (auth hesabı) tek bir bireysel profile sahip olmalı.**

## Kök Neden (canlı DB ile doğrulandı — 2026-06-26)

Profil seçim ekranı [`ProfileResolverPage.tsx`](../../../src/pages/ProfileResolverPage.tsx)
→ `get_my_editable_catalog_items` RPC'sini çağırır. RPC, kullanıcının
`catalog_item_managers`'da `owner/manager/editor` olduğu **tüm** item'ları döndürür.

AFS rebuild'inden (member tipi, 2026-06-07) **önce**, eski catalog taxonomy'siyle
(2026-06-04) her kullanıcı için bir `person_profile` item'ı oluşturulmuştu. Yeni sistem
`member` tipine geçti ama 14 eski `person_profile` satırı canlıda kaldı.

Profil seçim ekranı item_type'a göre etiket vermediği için, hem yeni `member` hem ölü
`person_profile` aynı role (`User_DiasporaMember`/`Admin_SuperAdmin`) map olup **ikisi de
"Bireysel"** görünüyor.

### Doğrulanan canlı durum

- `linked_user_id` başına **member satırı tekil** — `member` tipinde dublikat YOK.
- **14 `person_profile`** satırı var; en son 2026-06-04'te oluşmuş, o tarihten beri 0 yeni.
  `member` tipi 2026-06-23'e kadar aktif → `person_profile` **ölü tip**.
- 14 `person_profile`'ın **içi boş**: 0 attribute value, 0 contact, 0 claim.
  Sadece otomatik üretilen 14 `catalog_item_roles` + 14 `catalog_item_managers` bağlantısı var.
- **14 kullanıcının tamamı** hem bir `member` hem bir `person_profile` owner'ı → herkes 1 fazla
  "Bireysel" görüyor.

Silmek **hiç gerçek kullanıcı verisi kaybetmez.**

## Çözüm — tek migration

`supabase/migrations/<timestamp>_dedupe_individual_profiles.sql` (idempotent):

### 1. Ölü `person_profile` item'larını soft-delete et

- `catalog_items.deleted_at = now()`, `visibility = 'private'`,
  `attributes` içine provenance: `cleanup_source = 'dedupe-individual-profiles-20260626'`.
- Bağlı `catalog_item_managers` ve `catalog_item_roles` satırlarını **sil** (item ölü;
  seçim ekranına/RPC'ye düşmemeli). Bu satırlar otomatik üretilmişti, gerçek veri değil.
- İdempotent filtre: `where item_type = 'person_profile' and deleted_at is null`.

### 2. Gelecek önlemi — member tekilliği için partial unique index

```sql
create unique index if not exists uq_catalog_items_one_member_per_user
  on public.catalog_items (linked_user_id)
  where item_type = 'member' and deleted_at is null and linked_user_id is not null;
```

Bir kullanıcıya ikinci aktif `member` satırı oluşmasını DB seviyesinde imkânsız kılar.
Mevcut veride `member` zaten tekil olduğu için kısıt güvenle eklenir.

### Kapsam dışı (YAGNI)

- `person_profile` tipini taksonomiden silmek — ölü tip zararsız, gereksiz risk.
- Frontend değişikliği — gerekmez. RPC `deleted_at IS NULL` filtreler; ekran otomatik temizlenir.
- `person_profile` üreten kod yok (tip 2026-06-04'ten beri ölü); ek kod değişikliği gerekmez.

## Test / Doğrulama

1. Migration'ı canlıda **rolled-back transaction** içinde çalıştır (yan etki bırakmadan doğrula).
2. Gerçek uygula.
3. Uygulama sonrası:
   - `get_my_editable_catalog_items` 14 kullanıcı için artık `person_profile` döndürmemeli.
   - `ubterzioglu@gmail.com` hesabı: tek "Bireysel" (member) + "Kuruluş" (almanya101) görmeli.
   - `uq_catalog_items_one_member_per_user` index'i var olmalı.

## Notlar

- Canlı DB erişimi: Management API curl POST `/database/query` (python urllib Cloudflare verir).
- Migration commit ≠ canlı DB; ayrıca uygulanmalı.
- Frontend için Coolify deploy gerekmez (yalnızca DB değişikliği), ama görsel QA önerilir.
