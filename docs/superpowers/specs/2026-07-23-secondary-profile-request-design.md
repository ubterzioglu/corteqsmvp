# İkinci Profil Talebi (Admin Onaylı Yeni Profil) — Tasarım

**Tarih:** 2026-07-23
**Durum:** Onaylandı, uygulama planına geçiliyor

## Amaç

Bir kullanıcı, mevcut (Bireysel) profiline dokunmadan, başka bir rol için (ör. Danışman/Doktor)
ikinci bir profil açmayı talep edebilsin. Talep admin onayından geçsin; onaylanırsa yeni bir
profil kaydı oluşur ve kullanıcı onun sahibi (owner) olur. Reddedilirse hiçbir kayıt oluşmaz.

## Kapsam dışı (bu iterasyonda YAGNI)

- Doğrulama rozeti / belge-diploma yükleme akışı
- E-posta / push bildirimi
- Aynı anda birden fazla bekleyen `new_profile` talebi
- Yeni profilin görsel sunum (presentation) paketinin ayrıca özelleştirilmesi — mevcut
  `profile-presentation.ts` role göre otomatik çözülüyor, ek iş gerekmiyor

## Neden mevcut onay sistemine ekleniyoruz

`approval_requests` tablosu ve `AdminApprovalsPage` zaten `request_type` alanına göre dallanan
generic bir yapı (`role_change`, `attribute_change`, `event_create`, vb.). Yeni bir tablo, yeni bir
admin ekranı, yeni bir liste bileşeni gerekmiyor — sadece yeni bir `request_type` değeri
(`new_profile`) ve `admin_review_approval_request` fonksiyonuna yeni bir `elsif` dalı ekleniyor.

## Akış

1. Kullanıcı "Yeni Profil Aç" formunu açar (ProfilePage / ProfileSwitcherMenu civarına eklenir):
   rol seçimi (`get_flat_roles` RPC — zaten var), yeni profil başlığı, kısa açıklama.
2. Form `request_new_catalog_item(role_key, title, note)` RPC'sini çağırır:
   - Kullanıcının zaten `pending` durumda bir `new_profile` talebi varsa hata döner
     ("Zaten bekleyen bir profil talebiniz var").
   - Aksi halde `approval_requests`'a `request_type = 'new_profile'`,
     `payload = {role_key, title, note}`, `status = 'pending'` olarak kaydeder.
3. Admin, `AdminApprovalsPage`'de (yeni filtre seçeneği: "Yeni profil talebi") talebi görür,
   payload'ı (rol, başlık, not) okur, Onayla/Reddet der.
4. `admin_review_approval_request` onaylandığında (`request_type = 'new_profile'`):
   - Yeni `catalog_items` satırı açılır (`title` payload'dan, slug otomatik üretilir,
     `status='published'`, `visibility='public'`, `verification_status='claimed'`,
     `created_by_user_id` = talep eden kullanıcı).
   - `catalog_item_roles`'a seçilen rol `is_primary = true` olarak eklenir.
   - `catalog_item_managers`'a talep eden kullanıcı `role = 'owner'`, `status = 'active'`
     olarak eklenir.
   - Reddedilirse sadece `approval_requests.status = 'rejected'` güncellenir, başka kayıt oluşmaz.
5. Kullanıcı sonucu bugünkü "Bekleyen Talepler" listesinde görür (mevcut mekanizma, değişiklik yok).
   Onaylanan profil `ProfileSwitcherMenu`'de otomatik belirir (`getMyEditableCatalogItems` zaten
   `catalog_item_managers` üzerinden okuyor).

## Veri modeli değişiklikleri

Yeni tablo yok. Tek değişiklik: `approval_requests.request_type` için yeni bir değer
(`'new_profile'`) — mevcut `text` alan, migration'da CHECK constraint varsa genişletilir
(kontrol edilecek, muhtemelen yok çünkü diğer türler de serbestçe ekleniyor).

## Hata/uç durumlar

- Aynı kullanıcının pending `new_profile` talebi varken ikinci talep → RPC hata döner, form
  kullanıcıya "zaten bekleyen bir talebiniz var" gösterir.
- Seçilen `role_key` geçersiz/pasif → RPC hata döner (mevcut `submit_role_change_request`
  desenindeki gibi `roles.is_active` kontrolü).
- Başlık boşsa → RPC hata döner (`title` zorunlu).
- Slug çakışması → otomatik suffix ile çözülür (mevcut `sync_member_catalog_role_for_user`
  desenindeki gibi).

## Test planı (özet)

- RPC seviyesinde: geçerli talep oluşturma, pending-iken-ikinci-talep reddi, geçersiz rol reddi.
- Onay sonrası: `catalog_items` + `catalog_item_roles` + `catalog_item_managers` satırlarının
  doğru oluştuğunu doğrulayan entegrasyon testi.
- Red sonrası: hiçbir yeni kayıt oluşmadığını doğrulayan test.
- Admin UI: yeni filtre seçeneğinin listede göründüğü, payload'ın okunabilir şekilde
  render edildiği (mevcut generic JSON gösterimi yeterli, ek iş gerekmiyor).
