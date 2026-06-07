# RolesGo MVP Kullanım Kılavuzu

Bu doküman, yeni üye sistemi MVP'sinin günlük kullanımını ve operasyon adımlarını özetler. Teknik detaylar için `docs/modules/rolesgo/rolesgo.md` ve `docs/guides/kategori-rol-feature-yapisi.md` belgelerine bakın.

---

## 1. Hangi Ekran Ne İşe Yarıyor?

| Ekran | Yol | Ne Yapar |
|-------|-----|----------|
| Kullanıcılar & Roller | `/admin/new-member/users-roles` | Kullanıcıya rol atar, override sayısını ve bekleyen talepleri gösterir |
| Roller & Feature'lar | `/admin/new-member/roles-features` | Role bazlı feature matrisini global ve rol düzeyinde açar/kapar |
| Attribute Yönetimi | `/admin/new-member/attributes` | Attribute kataloğunu ve role kurallarını yönetir |
| Kullanıcı Override | `/admin/new-member/overrides` | Tek kullanıcıya rolünden bağımsız istisna yetki verir |
| Onay Kuyruğu | `/admin/approvals` | Bekleyen tüm rol, feature ve attribute taleplerini onaylar/reddeder |
| Audit Log | `/admin/audit-logs` | Admin işlemlerinin geçmişini gösterir |
| Kullanıcı Profili | `/profile` | Kullanıcı kendi profilini düzenler, rol başvurusu açar |
| Public Dizin | `/directory` | Admin onaylı profilleri listeler |
| Profil Detay | `/directory/profile/:userId` | Tek bir kullanıcının public profilini gösterir |

---

## 2. Auth Kullanımı Nasıl Çalışıyor?

Sistem Google OAuth ile çalışır. Yeni kullanıcı giriş yaptığında otomatik olarak `bireysel` rolüyle başlar.

**Akış:**

1. Kullanıcı Google ile giriş yapar.
2. `user_profiles_v2` kaydı oluşturulur.
3. `user_role_assignments` tablosuna `bireysel` rolü atanır.
4. Kullanıcı `/profile` sayfasına yönlendirilir.

**Frontend guard bileşenleri:**

| Bileşen | Ne Kontrol Eder |
|---------|----------------|
| `RequireAuth` | Kullanıcı giriş yapmış mı |
| `RequireFeature` | Kullanıcının belirli bir feature'ı var mı |
| `RequireAdmin` | `is_admin(auth.uid())` kontrolü |

**Güvenlik katmanı:** Frontend guard tek başına yeterli değildir. Kritik işlemler RLS + RPC üzerinden korunur.

---

## 3. Rol Kullanımı Nasıl Çalışıyor?

MVP'de her kullanıcının **bir aktif rolü** vardır.

**Mevcut roller:**

| Rol Key | Görünen Ad |
|---------|-----------|
| `bireysel` | Bireysel Kullanıcı |
| `danisman` | Danışman |
| `isletme` | İşletme |
| `kurulus-dernek` | Kuruluş / Dernek |
| `blogger-vlogger-youtuber` | İçerik Üreticisi |
| `sehir-elcisi` | Şehir Elçisi |

**Rol başvurusu akışı:**

1. Kullanıcı `/profile` sayfasından hedef rolü seçer.
2. İsteğe bağlı not yazar ve başvuru gönderir.
3. `approval_requests` tablosuna `role_change` tipiyle kayıt düşer.
4. Admin `/admin/approvals` ekranından onaylar ya da reddeder.
5. Onaylanırsa `user_role_assignments` güncellenir, `user_profiles.profile_type` ile senkronize olur.

**Kural:** Aynı hedef role ikinci pending başvuru açılamaz.

---

## 4. Profil ve Attribute Kullanımı

### Ortak Alanlar (Tüm Rollerde)

| Alan | Açıklama |
|------|----------|
| `full_name` | Görünen isim (role göre label değişir) |
| `country` | Ülke |
| `city` | Şehir |
| `profile_photo_url` | Profil fotoğrafı |
| `bio_short` | Kısa açıklama |

### Role Özel Alanlar

| Rol | Attribute Key | Label |
|-----|--------------|-------|
| `bireysel` | `interests` | İlgi Alanları |
| `danisman` | `expertise_area` | Uzmanlık Alanı |
| `isletme` | `business_category` | İşletme Kategorisi |
| `kurulus-dernek` | `organization_type` | Kuruluş Türü |
| `blogger-vlogger-youtuber` | `main_platform` | Ana Platform |
| `sehir-elcisi` | `ambassador_city` | Sorumlu Şehir |

### Alan Güncelleme Davranışı

| Durum | Sonuç |
|-------|-------|
| Alan onay gerektirmiyorsa | Direkt kaydedilir |
| Alan onay gerektiriyorsa | `pending` statüsüne düşer, public'te eski onaylı değer görünür |

### Görünürlük Seçenekleri

| Değer | Açıklama |
|-------|----------|
| `public` | Public directory'de görünür |
| `private` | Yalnızca kullanıcı ve admin görebilir |

Kullanıcı yalnızca `user_can_hide = true` olan alanların görünürlüğünü değiştirebilir.

---

## 5. Feature Kullanımı

### Öncelik Sırası

```
1. user_feature_overrides   (EN YÜKSEK)
2. role_feature_flags
3. role_feature_defaults    (fallback)
4. false                    (EN DÜŞÜK)
```

Bunun **üstünde** global bir kilit vardır: `feature_catalog.is_active_globally = false` ise override bile olsa feature açılmaz.

### Başlıca Feature Key'ler

| Feature Key | Ne Açar |
|-------------|---------|
| `profile.view_own` | Kendi profilini görme |
| `profile.edit_own` | Kendi profilini düzenleme |
| `directory.visible` | Public dizinde listeleme |
| `directory.featured` | Öne çıkarılmış profil |
| `contact.show_whatsapp` | WhatsApp numarası gösterme |
| `events.create` | Etkinlik oluşturma |
| `offers.create` | Teklif/hizmet oluşturma |
| `referral.create` | Referral talebi başlatma |
| `city.manage` | Şehir bazlı yönetim (MVP sonrası) |

### Sık Yapılan Hatalar

| Belirti | Neden | Çözüm |
|---------|-------|-------|
| Feature açık ama kullanıcı göremez | Global toggle kapalı | `/roles-features` → ilgili satırda global toggle kontrol et |
| Override verildi ama etkisiz | Global toggle kapalı | Global toggle açılmadan override geçersiz |
| `individual.*` feature başka rolde çalışmıyor | `scope_role` yalnızca `bireysel` | Bu feature'lar teknik olarak diğer rollerde uygulanmaz |

---

## 6. Section Kullanımı

Public profil görünümü (`/directory/profile/:userId`) üç katmandan oluşur:

| Katman | Açıklama |
|--------|----------|
| Ön Kart | Konum, profil görseli, rol etiketi, rozetler |
| Detay Kart | Sekmeler ve genişletilmiş bilgiler |
| Attribute Alanları | Kullanıcının doldurduğu ve public yaptığı değerler |

Public sorgular hassas veri içermez. Şunlar **hiçbir zaman** public query'ye dahil edilmez: `email`, `phone`, `whatsapp`, onaysız attribute değerleri.

---

## 7. En Sağlıklı Operasyon Sırası

### Yeni Kullanıcıya Rol Vermek

1. `/admin/new-member/users-roles` → kullanıcıyı bul
2. Hedef rolü seç → kaydet
3. Gerekirse `/admin/new-member/roles-features` üzerinden feature matrisini kontrol et
4. Gerekirse `/admin/new-member/overrides` üzerinden istisna yetki ver

### Kullanıcıyı Directory'de Görünür Yapmak

1. Kullanıcının doğru role sahip olduğundan emin ol
2. `/admin/new-member/roles-features` → `directory.visible` satırının açık olduğunu doğrula
3. `/admin/approvals` → bekleyen `directory_visibility` talebini onayla
4. Kullanıcının profilde public alanların dolu ve onaylı olduğunu kontrol et

### Attribute'u Onay Gerektirir Hale Getirmek

1. `/admin/new-member/attributes` → ilgili attribute + role rule kaydını bul
2. `requires_admin_approval_on_change` alanını aç → kaydet

### Tek Kullanıcıya İstisna Yetki Vermek

1. `/admin/new-member/overrides` → kullanıcıyı seç
2. Feature anahtarını seç → enable/disable override ver
3. **Neden alanını doldurun** — audit logda kritik bilgidir

### Approval Queue Yönetimi

1. `/admin/approvals` sayfasını aç
2. Talep tipiyle filtrele (`role_change`, `directory_visibility`, `attribute_change`, vb.)
3. Onayla veya reddet
4. Onay sonuçları otomatik işlenir: rol değişirse `user_role_assignments` güncellenir, attribute değişirse ilgili kayıt `approved` olur

---

## 8. Kritik Notlar

**Migration kuralları:**

- Üretimde migration silinemez, sırası değiştirilemez — yalnızca yeni migration eklenir.
- `approval_requests` gibi önceden var olan tablolarda yeniden oluşturma değil, genişletme yaklaşımı kullanılır.
- `if not exists` ve uyumluluk mantığı her migration'da zorunludur.

**RPC kuralları:**

- Kritik yazma işlemleri doğrudan tablo update'i yapmaz; RPC üzerinden geçer.
- Audit log yazımı uygulama tarafında değil, DB/RPC tarafında tutulur.
- Public directory okuması doğrudan ham tablodan değil, güvenli RPC yüzeyinden yapılır.

**Feature key kuralı:**

- `feature_catalog.key` global tekil çalışır.
- Generic feature eklemelerinde aynı key'i role başına tekrar üretmeyin.

**Auth ve rol çakışması:**

- Eski `admin_users` tablosu ve `rolesgo_*` tabloları şu an birlikte çalışmaktadır.
- `is_admin()` fonksiyonu her iki sistemi de tanır.
- Profil mantığına dokunmadan önce mevcut durumu doğrulayın.

---

## Referans Komutları

```powershell
# Migration durumu
supabase migration list

# Remote'a push
supabase db push

# Yeni migration oluştur
supabase migration new migration_adi

# TypeScript tiplerini yenile (remote)
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# Release sonrası doğrulama
BASE_URL=https://corteqs.net npm run verify:release
```

## Release Kontrol Listesi

1. `supabase migration list` — local/remote eşit mi?
2. `/profile` açılıyor mu?
3. Rol başvurusu oluşturulabiliyor mu?
4. `/admin/approvals` — talep görünüyor mu?
5. Admin onayı sonrası rol veya feature etkinleşiyor mu?
6. `/directory` — yalnızca beklenen profiller listeleniyor mu?
7. `/admin/audit-logs` — işlem izi düşüyor mu?
