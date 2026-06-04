# Katalog Items · Roller · Features İlişkisi — Admin Rehberi

Bu belge, **Katalog Items** (ürünler, etkinlikler, ilanlar), **Roller** (kullanıcı tipleri) ve **Features** (yetkiler) arasındaki ilişkiyi açıklar.

---

## Temel Model

```
┌─────────────────────────────────────────────────┐
│             SİSTEM ARKİTEKTÜRÜ                  │
└─────────────────────────────────────────────────┘

KATALOG İTEMLERİ
├─ Advisor (Danışman Profili)
├─ Business (İşletme Listesi)
├─ Event (Etkinlik)
├─ Marketplace Listing (Pazar İlanı)
├─ Job Posting (İş İlanı)
├─ Community Group (Topluluk Grubu)
└─ Person Profile (Kişi Profili)

         ⬇️ Her item_type'ının özellikleri var

İTEM TYPE FEATURESİ
├─ reviews (Yorum yapılabilir mi?)
├─ verification_badge (Doğrulama rozeti)
├─ online_booking (Online rezervasyon)
├─ event_registration (Etkinliğe kayıt)
└─ ... daha fazlası

         ⬇️ ROLLER bu feature'ları kontrol eder

ROLLER
├─ bireysel (Bireysel Kullanıcı)
├─ danisman (Danışman)
├─ isletme (İşletme)
├─ blogger-vlogger-youtuber (İçerik Üreticisi)
└─ ... (6 rol)

         ⬇️ Her role'ün feature'ları var

ROL FEATURE BAYRAKLARI
├─ bireysel: events.create = FALSE (etkinlik oluşturamazlar)
├─ danisman: events.create = TRUE (oluşturabilirler)
├─ isletme: events.create = TRUE
└─ ... (tüm feature kombinasyonları)

         ⬇️ SONUÇ: Ayrıntı kontrolü

ÖZETİ YETKILENDIRME
├─ Admin Item Type'ı seçer
├─ O Item Type'ın hangi feature'ları destekledğini görmüştür
├─ User'ın rolü bu feature'ları açık mı kontrol eder
├─ Eğer açık → User item oluşturabilir/görebilir
└─ Eğer kapalı → User item göremez/oluşturamaz
```

---

## 1. Katalog Items Nedir?

**Katalog Items**, platformda oluşturulan tüm somut varlıklardır. Örnekler:
- Bir danışmanın profili (Advisor)
- Bir şirketin iş ilanı (Business)
- Bir etkinlik duyurusu (Event)
- Bir pazarlamacının ürün listesi (Marketplace Listing)
- Bir iş ilanı (Job Posting)
- Bir topluluk grubu (Community Group)
- Bir kişinin profili (Person Profile)

### Catalog Items Tablosu

| Sütun | Anlamı |
|-------|--------|
| `id` | Unique item identifier (UUID) |
| `item_type` | Item tipi (advisor, business, event, vb.) |
| `slug` | URL-friendly identifier |
| `title` | Item başlığı |
| `status` | draft, pending_review, published, archived, rejected |
| `visibility` | public, private, unlisted |
| `verification_status` | unverified, pending, verified, official_source, claimed |
| `created_by_user_id` | Kim oluşturdu? |
| `attributes` | Dinamik metadata (JSON) |

### Örnek Catalog Items

```sql
-- Etkinlik
INSERT INTO catalog_items (item_type, title, status, visibility)
VALUES ('event', '2026 yazılım konferansı', 'published', 'public');

-- İşletme
INSERT INTO catalog_items (item_type, title, status, visibility)
VALUES ('business', 'ABC Restoran', 'published', 'public');

-- Danışman
INSERT INTO catalog_items (item_type, title, status, visibility)
VALUES ('advisor', 'Hukuk Danışmanı - Ahmet', 'published', 'public');
```

---

## 2. Item Types Nedir?

**Item Type**, Katalog Item'inin kategorisidir. 8 tane vardır:

| Item Type | Adı | Amaç | Örnek |
|-----------|-----|------|--------|
| `advisor` | Danışman | Profesyonel danışmanları kataloglamak | Muhasebe danışmanı, hukuk danışmanı |
| `organization` | Kuruluş | Kurumları ve dernekleri kataloglamak | NGO, ticaret odası |
| `business` | İşletme | Şirketleri ve mağazaları kataloglamak | Restoran, berber |
| `event` | Etkinlik | Topluluk etkinliklerini kataloglamak | Konferans, çalıştay |
| `marketplace_listing` | Pazar İlanı | İkinci el, kiralama, satış | Arsa satışı, oda kiraması |
| `job_posting` | İş İlanı | Açık pozisyonları kataloglamak | Software Engineer |
| `community_group` | Topluluk Grubu | İçerik toplulukları kataloglamak | WhatsApp grubu, Discord sunucusu |
| `person_profile` | Kişi Profili | Bireysel profilleri kataloglamak | Diaspora üyesi |

### Item Types Tablosu

```sql
CREATE TABLE public.catalog_item_types (
  key text PRIMARY KEY,           -- 'advisor', 'business', vb.
  label text NOT NULL,            -- 'Danışman', 'İşletme'
  description text,               -- Ne bu item type için?
  is_active boolean DEFAULT true
);
```

---

## 3. Item Type Features Nedir?

**Item Type Features**, belirli bir Item Type'ın destekledği yeteneklerdir.

Örneğin:
- **Event** item_type'ı şunları destekleyebilir:
  - `reviews` (katılımcılar yorum yapabilir)
  - `event_registration` (kayıt sistemi)
  - `online_booking` (online ödeme ve rezervasyon)
  - `verification_badge` (onaylanmış event)

- **Business** item_type'ı şunları destekleyebilir:
  - `reviews` (müşteri yorumları)
  - `online_booking` (masa rezervasyonu)
  - `opening_hours` (çalışma saatleri)
  - `map_location` (harita lokasyonu)

### Item Type Features Tablosu

```sql
CREATE TABLE public.item_type_features (
  item_type text NOT NULL,        -- 'event', 'business', vb.
  feature_key text NOT NULL,      -- 'reviews', 'online_booking', vb.
  is_enabled boolean DEFAULT true,
  configuration jsonb DEFAULT '{}'
);
```

### Örnek

```
Event item_type'ının feature'ları:
  ✅ reviews
  ✅ event_registration
  ✅ verification_badge
  ✅ media_gallery
  ❌ online_booking
  ❌ opening_hours

Business item_type'ının feature'ları:
  ✅ reviews
  ✅ online_booking
  ✅ opening_hours
  ✅ map_location
  ❌ event_registration
```

---

## 4. Roller ve Catalog Items Arasındaki Bağlantı

### Bağlantı Zinciri

```
USER
  ↓ (has a role)
ROLE
  ↓ (defines which features are available)
FEATURE_CATALOG (rolle ilişkili features)
  ↓ (features that item_types support)
ITEM_TYPE_FEATURES
  ↓ (links to specific item types)
ITEM_TYPE
  ↓ (which catalog items are of this type)
CATALOG_ITEM
  ↓ (actual items user can create/view/manage)
ITEM DATA
```

### Pratik Örnek

**Senaryo: Blogger'ın Event Oluşturması**

```
1. Blogger'ın Rolü: blogger-vlogger-youtuber
   ↓
2. Role'ün Feature'ları:
   - content.create = TRUE ✅
   - events.create = TRUE ✅
   - offers.create = FALSE ❌
   ↓
3. Event Item Type'ının Feature'ları:
   - reviews = TRUE
   - event_registration = TRUE
   - verification_badge = TRUE
   ↓
4. Sonuç:
   - Blogger events.create feature'ına sahip → Event oluşturabilir ✅
   - Event item_type'ı bu feature'ları destekliyor
   - Event başarıyla oluşturulur
```

---

## 5. RLS (Row Level Security) — Veri Görünürlüğü

**RLS Policies**, kim hangi katalog item'lerini görebilir/oluşturabilir/düzenleyebilir kontrol eder.

### Tipik RLS Koşulları

```sql
-- Policy 1: Public items herkese görünür
CREATE POLICY "public_items_readable" ON catalog_items
  FOR SELECT
  USING (visibility = 'public' OR created_by_user_id = auth.uid());

-- Policy 2: Private items yalnızca owner görebilir
CREATE POLICY "private_items_readable" ON catalog_items
  FOR SELECT
  USING (visibility = 'private' AND created_by_user_id = auth.uid());

-- Policy 3: Item oluşturma kontrol
CREATE POLICY "can_create_items" ON catalog_items
  FOR INSERT
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND user_can_create_item_type(auth.uid(), item_type)
  );

-- Policy 4: Item düzenleme kontrol
CREATE POLICY "can_edit_own_items" ON catalog_items
  FOR UPDATE
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());
```

### RLS Örneği: Event Oluşturma

```
STEP 1: User event oluşturmak istiyor
  ↓
STEP 2: Database kontrol ediyor:
  - User authenticated mi? → YES
  - User'ın role'ü var mı? → YES (blogger-vlogger-youtuber)
  - Role'ün events.create feature'ı var mı? → YES
  - Event item_type'ı açık mı? → YES
  ↓
STEP 3: Database INSERT izni veriyor
  ↓
STEP 4: Event başarıyla oluşturulur
```

---

## 6. Admin Nasıl Kontrol Edebilir?

### 6.1 Item Type Feature'larını Yönetme

**Admin Dashboard** (henüz build edildi mi kontrol et):

```
/admin/catalog-items (varsayılan)
/admin/item-types
/admin/item-type-features
```

**Hangi feature'ları görmek/kontrol etmek:**

```
1. /admin/item-types → Tüm item type'ları listele
2. Her item_type'ını seç
3. İlişkili feature'ları aç:
   - reviews (yorumlar)
   - verification_badge (doğrulama)
   - online_booking (rezervasyon)
   - opening_hours (çalışma saatleri)
   - map_location (harita)
   vb.
```

### 6.2 Feature'lar ile Role'leri Kontrol Etme

**Önceki rehberde açıklandığı gibi:**

```
/admin/new-member/roles-features
  → Tüm feature'lar (kategorize)
  → Tüm roller (sütun)
  → Hangi role'ün hangi feature'ya erişimi var kontrol
```

**Örnek Kombinasyonlar:**

| Item Type | Feature | bireysel | danisman | isletme | blogger |
|-----------|---------|----------|----------|---------|---------|
| **event** | create | ✅ | ❌ | ✅ | ✅ |
| **event** | reviews | ✅ | ✅ | ✅ | ✅ |
| **business** | create | ❌ | ❌ | ✅ | ❌ |
| **marketplace** | create | ✅ | ✅ | ✅ | ❌ |
| **advisor** | create | ❌ | ✅ | ❌ | ❌ |

### 6.3 Katalog Items'i Yönetme

**Admin Dashboard:**

```
/admin/catalog-items
  → Tüm item'leri listele
  → Status kontrol (draft, published, archived)
  → Visibility (public, private, unlisted)
  → Verification status (verified, pending, rejected)
  → Kimin oluşturduğunu görmek
```

### 6.4 Dinamik Attribute'lar

Katalog Items'te dinamik metadata (JSON) tutulabilir:

```json
// Event item'inin attributes
{
  "starts_at": "2026-06-15T10:00:00Z",
  "ends_at": "2026-06-15T18:00:00Z",
  "capacity": 100,
  "registration_link": "https://...",
  "location": { "lat": 41.0082, "lng": 28.9784 }
}

// Business item'inin attributes
{
  "phone": "+90 212 XXX XXXX",
  "website": "https://example.com",
  "rating": 4.5,
  "opening_hours": {
    "monday": "09:00-22:00",
    "tuesday": "09:00-22:00"
  }
}
```

---

## 7. İş Akışı Örneği: Blog Yazısı Yayınlama

### Senaryo

Blogger'ın bir blog yazısı yayınlamak istiyor.

### Adım Adım

```
1️⃣ BLOGGER GIRIŞ YAPAR
   └─ Database: user.role = 'blogger-vlogger-youtuber'

2️⃣ BLOGGER İçerik Oluştur butonuna tıklar
   └─ Frontend: content.create feature'ı kontrol eder
   └─ Feature açık mı? → YES (role'de var)

3️⃣ BLOGGER FORM DOLDURUR
   └─ Title, body, media, vb.

4️⃣ BLOGGER GÖNDERİ Düğmesine tıklar
   └─ Frontend: POST /api/create-content

5️⃣ DATABASE KONTROL EDER (RLS Policy)
   ├─ User authenticated? → YES
   ├─ User'ın role'ü content.create feature'a sahip? → YES
   ├─ Content item_type'ı (article) oluşturulabilir mi? → YES
   └─ INSERT izni ver

6️⃣ ITEM OLUŞTURULUR
   └─ catalog_items tablosuna eklenir:
   {
     item_type: 'article',
     title: '...',
     status: 'published',
     visibility: 'public',
     created_by_user_id: blogger_id,
     attributes: { ... }
   }

7️⃣ BLOG POST YAYINLANIR
   └─ /directory veya /content sayfasında görünür
```

---

## 8. İş Akışı Örneği: Admin Bir Feature Kapatıyor

### Senaryo

Admin şirkete ait ilanlar için "online_booking" özelliğini kapatmak istiyor.

### Adım Adım

```
1️⃣ ADMIN DASHBOARD'A GİDER
   └─ /admin/item-types → business → features

2️⃣ ONLINE_BOOKING FEATURE'INI BULUR
   └─ Şu anda: is_enabled = TRUE ✅

3️⃣ ADMIN KAPATIR
   └─ is_enabled = FALSE ❌
   └─ item_type_features tablosu güncellenir

4️⃣ SONUÇ
   ├─ Mevcut business items:
   │  ├─ Hazırlanmış (draft) olanlar → online_booking başlığı kaybolur
   │  └─ Yayınlanan (published) olanlar → online_booking görünmez
   │
   ├─ Yeni business items:
   │  └─ online_booking özelliği sunulmaz
   │
   └─ Blogger/isletme user'lar:
      └─ online_booking form field'ini görmezler
```

---

## 9. Kontrol Hiyerarşisi

### Yetkilendirme Katmanları

```
1. ROL SEVİYESİ (Geniş kontrol)
   ├─ blogger-vlogger-youtuber:
   │  ├─ content.create = TRUE
   │  ├─ events.create = TRUE
   │  ├─ offers.create = FALSE
   │  └─ ... (feature listesi)
   
2. İTEM TYPE SEVİYESİ (Orta kontrol)
   ├─ event item_type:
   │  ├─ reviews = TRUE
   │  ├─ event_registration = TRUE
   │  ├─ online_booking = FALSE
   │  └─ ...
   
3. ÖZELDELİK SEVİYESİ (Benzer kontrol)
   ├─ Catalog Item 123:
   │  ├─ created_by_user_id = blogger_id
   │  ├─ visibility = 'public'
   │  └─ status = 'published'

4. VERİ SEVİYESİ (İnce kontrol)
   └─ RLS Policies
      ├─ Kimin görebileceği
      ├─ Kimin düzenleyebileceği
      └─ Kimin silebileceği
```

---

## 10. Sorun Giderme

| Problem | Sebebi | Çözüm |
|---------|--------|-------|
| User item oluşturamıyor | Role'ün feature'ı yok | `/roles-features` → feature açılıp kapatılmalı |
| Item type feature'ı gözükmüyor | `item_type_features.is_enabled = FALSE` | `/admin/item-types` → feature aç |
| RLS hatası: "permission denied" | User'ın bu item'e erişim yetkisi yok | Item visibility'si veya ownership kontrol et |
| Feature açık ama başlık gösterilmiyor | Global feature toggle kapalı | `/roles-features` → global toggle kontrol et |

---

## 11. Teknik Referans

### Tablo İlişkileri

```sql
catalog_item_types
  ├─ key (PK) — 'advisor', 'business', 'event', vb.
  ├─ label
  ├─ is_active
  └─ (referenced by catalog_items.item_type)

item_type_features
  ├─ item_type (FK → catalog_item_types.key)
  ├─ feature_key
  ├─ is_enabled ← İtem type bu feature'ı destekliyor mu?
  └─ configuration (JSON)

catalog_items
  ├─ id (PK)
  ├─ item_type (FK → catalog_item_types.key)
  ├─ created_by_user_id (FK → profiles.id)
  ├─ status
  ├─ visibility
  ├─ attributes (JSON)
  └─ (RLS policies kontrol eder kimin görebileceğini)

roles
  ├─ id (PK)
  ├─ key — 'bireysel', 'danisman', vb.
  └─ (referenced by user_role_assignments)

role_feature_flags
  ├─ role_id (FK → roles.id)
  ├─ feature_key
  └─ is_enabled ← Role bu feature'a sahip mi?
```

---

## Özet

**Katalog Items ↔ Roller ↔ Features İlişkisi:**

1. **Admin** Item Type'ları tanımlar (8 adet mevcut)
2. **Admin** Her Item Type'ın destekledği feature'ları ayarlar
3. **Admin** Roller tanımlar ve her role'ün feature'larını kontrol eder
4. **User** Giriş yapar, rolüne göre feature'ları alır
5. **User** Oluşturmak istediği item type'ın feature'larına bakılır
6. **RLS Policies** Veri güvenliğini ve görünürlüğünü kontrol eder
7. **Sonuç** User yalnızca rolüne ve item type'ına uygun item'ler görebilir/oluşturabilir
