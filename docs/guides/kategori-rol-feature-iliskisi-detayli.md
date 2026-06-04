# Kategori · Rol · Feature İlişkisi — Detaylı Rehber

Bu belge, kategori / rol / feature yapısının **nasıl birlikte çalıştığını** ve **admin arayüzünde filtrelerin mantığını** açıklar.

---

## Temel Model

```
┌──────────────────────────────────────────────────────────────┐
│                      SISTEM AKIŞI                            │
└──────────────────────────────────────────────────────────────┘

1. KATEGORİ
   ├─ 📋 Profil Yönetimi (profile.*)
   ├─ 🗂️ Directory (directory.*)
   ├─ 💬 İletişim (contact.*)
   ├─ ✍️ İçerik (content.*)
   ├─ 🎯 Üretim (events.*, offers.*, referral.*)
   ├─ 🌐 Platform (cadde.*, city.*, whatsapp_landing.*)
   └─ ⚙️ Sistem (admin.*)

         ⬇️ HER KATEGORİDE BİRÇOK FEATURE VAR

2. FEATURE
   ├─ "profile.view_own" → Kendi Profilini Gör
   ├─ "profile.edit_own" → Kendi Profilini Düzenle
   ├─ "directory.visible" → Directory Görünürlüğü
   └─ ...ve daha fazlası

         ⬇️ FEATURE'LAR ROL'LERE ATANIR

3. ROL
   ├─ bireysel (Bireysel Kullanıcı)
   ├─ danisman (Danışman)
   ├─ isletme (İşletme)
   ├─ kurulus-dernek (Kuruluş / Dernek)
   ├─ blogger-vlogger-youtuber (İçerik Üreticisi)
   └─ sehir-elcisi (Şehir Elçisi)

         ⬇️ KULLANICI BİR ROLE SAHİP

4. KULLANICI
   └─ Rol → Features → Permissions
```

---

## Kategori Nedir?

**Kategori**, feature'ları **mantıksal gruplara** ayırmak için kullanılır. Kod içinde tanımlanır ve **admin arayüzünde organize görünüm** sağlar.

### 7 Kategori

| Kategori | Simge | Features | Amaç |
|----------|-------|----------|------|
| **Profil Yönetimi** | 📋 | `profile.*` | Kullanıcının kendi profilini görmesi ve düzenlemesi |
| **Directory** | 🗂️ | `directory.*` | Public directory'de görünürlük ve öne çıkarma |
| **İletişim** | 💬 | `contact.*` | Diğer kullanıcılardan iletişim talepleri alma |
| **İçerik** | ✍️ | `content.*` | Post, blog, makale yazma ve düzenleme |
| **Üretim** | 🎯 | `events.*`, `offers.*`, `referral.*` | Etkinlik, teklif, referral oluşturma |
| **Platform** | 🌐 | `cadde.*`, `city.*`, `whatsapp_landing.*` | Cadde, şehir yönetimi, topluluk landing'i |
| **Sistem** | ⚙️ | `admin.*` | Admin onayları ve sistem ayarları |

**Not:** Kategoriler sadece **UI organizasyonudur**. Veritabanında feature'ları yönetmez.

---

## Feature Nedir?

**Feature**, bir **somut yetki** veya **işlevsellik**. Veritabanında `feature_catalog` tablosunda tutulur.

Örneğin:
- `profile.view_own` → Kullanıcı kendi profilini görebilir
- `directory.visible` → Kullanıcı public directory'de listelenebilir
- `events.create` → Kullanıcı etkinlik oluşturabilir

### Feature'ın Özellikleri

| Özellik | Açıklama | Örnek |
|---------|----------|--------|
| **Key** | Unique identifier | `profile.edit_own` |
| **Label** | Türkçe görünen ad | "Kendi Profilini Düzenle" |
| **Description** | Detaylı açıklama | "Kullanıcı kendi profil verilerini güncelleyebilir" |
| **Global State** | Sistem genelinde açık mı? | true (açık) |
| **Scope Role** | Hangi role(ler) için geçerli? | `*` (tüm roller) veya specific role |

---

## Rol Nedir?

**Rol**, bir **kullanıcı tipi** veya **üyelik kategorisi**. Kullanıcı başına **bir rol** atanır. Rol, o kullanıcının alabileceği feature'ları belirler.

### 6 Rol

| Rol Key | Görünen Ad | Kullanıcı Tipi | Örnek Senaryolar |
|---------|-----------|----------------|-----------------|
| `bireysel` | Bireysel Kullanıcı | Standart üye | Kişiler, networking |
| `danisman` | Danışman | Profesyonel danışman | Hukuk, muhasebe, danışmanlık |
| `isletme` | İşletme | Şirket / işletme hesabı | Restoranlar, mağazalar |
| `kurulus-dernek` | Kuruluş / Dernek | Sivil toplum | NGO, dernekler, ticaret odaları |
| `blogger-vlogger-youtuber` | İçerik Üreticisi | Blog/vlog üreticileri | YouTube, blog, podcast |
| `sehir-elcisi` | Şehir Elçisi | Şehir temsilcisi | Bölgesel liderler |

---

## Feature ↔ Rol: Çapraz Tablo

Admin arayüzü (`/admin/new-member/roles-features`) bu tabloyu gösterir:

```
                    bireysel  danisman  isletme  ...
profile.view_own       ✅        ✅       ✅
profile.edit_own       ✅        ✅       ✅
directory.visible      ❌        ✅       ✅
events.create          ✅        ❌       ✅
individual.about       ✅        ❌       ❌
...
```

**Hücrelerin anlamı:**
- ✅ (açık) = Bu role ait kullanıcılar bu feature'ı kullanabilir
- ❌ (kapalı) = Bu role ait kullanıcılar bu feature'ı **kullanamaz**

---

## Feature Kullanılabilirlik Karar Ağacı

Bir kullanıcı feature X'i kullanabilir mi?

```
1️⃣ GLOBAL DURUMU KONTROL ET
   ├─ feature_catalog.is_active_globally = FALSE?
   │  └─ → ❌ KAYNAKTA KAPALI (kimse kullanamaz)
   └─ feature_catalog.is_active_globally = TRUE?
      └─ → Adım 2'ye git

2️⃣ KULLANICI OVERRIDE KONTROL ET
   ├─ user_feature_overrides.is_enabled = TRUE?
   │  └─ → ✅ İZIN VERİLİ (override açık)
   ├─ user_feature_overrides.is_enabled = FALSE?
   │  └─ → ❌ RETHEDİLDİ (override kapalı)
   └─ Override yok?
      └─ → Adım 3'e git

3️⃣ ROL FEATURE FLAG'I KONTROL ET
   ├─ role_feature_flags (role_id, feature_key) = TRUE?
   │  └─ → ✅ İZİN VERİLİ (rol açık)
   ├─ role_feature_flags (role_id, feature_key) = FALSE?
   │  └─ → ❌ RETHEDİLDİ (rol kapalı)
   └─ Flag yok?
      └─ → Adım 4'e git

4️⃣ ROL FEATURE DEFAULT'İ KONTROL ET (ESKİ SİSTEM)
   ├─ role_feature_defaults = TRUE?
   │  └─ → ✅ İZİN VERİLİ (legacy default açık)
   └─ role_feature_defaults = FALSE?
      └─ → ❌ RETHEDİLDİ (legacy default kapalı)

SONUÇ: Yukarıdaki kararlardan ilki uygulanır (en spesifik kazanır)
```

### Karar Ağacı Örnekleri

**Örnek 1: Şub Müdürü (rol=isletme) directory.visible istiyorum**

```
1. Global: is_active_globally = TRUE ✅
   → Devam et

2. Override: user_feature_overrides yok (Müdür için özel artısı yok)
   → Devam et

3. Rol Flag: role_feature_flags[isletme][directory.visible] = TRUE
   → ✅ SONUÇ: Müdür directory'de görünebilir
```

**Örnek 2: Bireysel Kullanıcı events.create istiyorum**

```
1. Global: is_active_globally = TRUE ✅
   → Devam et

2. Override: user_feature_overrides yok
   → Devam et

3. Rol Flag: role_feature_flags[bireysel][events.create] = FALSE
   → ❌ SONUÇ: Bireysel kullanıcı etkinlik oluşturamaz

(Ama eğer admin override vermişse:
2. Override: user_feature_overrides[kullanici_id][events.create] = TRUE
   → ✅ SONUÇ: O spesifik kullanıcı etkinlik oluşturabilir)
```

---

## Admin Arayüzlerinde Filtrelerin Mantığı

### `/admin/new-member/roles-features` — Çapraz Tablo

**Ne gösterilir?**
- Satırlar: Tüm features (kategori başlıklarıyla gruplandırılmış)
- Sütunlar: Tüm roller

**Ne yapılır?**
- Global toggle (her satırın solunda): Feature'ı sistem genelinde aç/kapat
- Hücre toggle: İlgili rolde o feature açık mı? → role_feature_flags'i güncelle

**Örnek:**
```
Global | bireysel | danisman | isletme
────────────────────────────────────
[Open]    [✅]      [❌]      [✅]    ← directory.visible
         Bireysel users         Danışmanlar
         directory'de           directory'de
         görünebilir            görünemez
```

### `/admin/new-member/users-roles` — Kullanıcı Roller

**Ne gösterilir?**
- Tüm logged-in kullanıcılar
- Her kullanıcının aktif rolü
- O rolün açtığı effective features özeti

**Ne yapılır?**
- Kullanıcının rolünü değiştir → user_role_assignments güncellenir
- Bağlantı kullanıcıya olan override sayısını göster

**Örnek:**
```
Kullanıcı       | Rol      | Effective Features | Overrides
─────────────────────────────────────────────────────────
Ahmet B.        | danisman | 18/32 features      | 2 açık
(Danışman Kullan)          (Danışman rolüne
                           göre 18 feature
                           açık, 2 override
                           var)
```

### `/admin/new-member/overrides` — Kullanıcı İstisnaları

**Ne gösterilir?**
- Belirli bir kullanıcı seçilir
- O kullanıcının override'ları listelenir
- Hangi feature'ı açılmış/kapalı tutulmuş?

**Ne yapılır?**
- Feature'ı açma/kapatma (user_feature_overrides ekle/sil)
- Override sebebini not et

**Örnek:**
```
Kullanıcı: Ahmet B. (danisman)
─────────────────────────────────
Feature                    | Override | Neden
────────────────────────────────────
events.create              | ✅ açık  | "Temmuz ayı pilot projesine dahil"
contact.show_whatsapp      | ❌ kapalı | "Mahremiyet isteği"
directory.visible          | ❌ kapalı | "Henüz hazır değil"
```

---

## Pratik Senaryolar

### Senaryo 1: Yeni İçerik Üreticisi Ekle

**Amaç:** BloggerX'i `blogger-vlogger-youtuber` rolüyle kaydet, içerik oluşturabilmeli.

**Adımlar:**

1. Kullanıcı kaydı ve rol ataması:
   - `/admin/new-member/users-roles` → BloggerX → Rol = `blogger-vlogger-youtuber`

2. Feature'ların açık olduğundan emin ol:
   - `/admin/new-member/roles-features` → Satır `content.create` → Sütun `blogger-vlogger-youtuber` = ✅

3. BloggerX'in profilinde `content.create` feature'ı açılır:
   - `get_current_user_features()` RPC çalıştığında `content.create` = true döner
   - Frontend `<RequireFeature feature="content.create">` gösterir

4. BloggerX içerik oluşturabilir ✅

---

### Senaryo 2: Belirli Danışman'ı Directory'de Gizle

**Amaç:** DoctorX (danisman) private kalmak istiyor, directory'de görünmesin.

**Adımlar:**

1. `/admin/new-member/overrides` → DoctorX seç

2. Feature override ekle:
   - Feature: `directory.visible`
   - Action: ❌ disable/kapalı
   - Neden: "Gizlilik isteği"

3. Sonuç:
   - `get_current_user_features()` çalıştığında `directory.visible` = false döner (override kazandı)
   - Directory sayfasında DoctorX listelenmez

---

### Senaryo 3: Tüm Kullanıcılara Etkinlik Oluşturma Kapalı Yap

**Amaç:** `events.create` feature'ını system genelinde (geçici olarak) kapat.

**Adımlar:**

1. `/admin/new-member/roles-features` → Feature satırı `events.create`

2. Global toggle → ❌ kapalı (sola tıkla)

3. Sonuç:
   - Tüm roller için `events.create` kapalı olur (tüm sütunlarda ❌)
   - Hiç kimse etkinlik oluşturamaz
   - Override bile bu global kapatmayı ek...emez

---

## Ortak Hatalar ve Çözümleri

| Hata | Sebebi | Çözüm |
|------|--------|-------|
| Feature açık ama kullanıcı görmüyor | Global toggle kapalı | `/roles-features` → Global toggle aç |
| Rol değiştirildi ama feature'lar değişmedi | Ön bellek / session | Kullanıcının çıkış yapıp yeniden girmesi |
| Override verip etki görmedi | Global toggle kapalı | Önce global toggle'ı aç |
| Feature bir rolde açık, diğerinde kapalı | Beklenen davranış | Role göre farklı yetkiler bu şekilde kontrol edilir |
| `individual.*` feature başka rolde çalışmıyor | `scope_role = 'bireysel'` | Bu feature'lar yalnızca bireysel role uygulanır |

---

## Teknik Detaylar

### Tablo İlişkileri

```sql
feature_catalog (key PK)
  ├─ key (string)
  ├─ label
  ├─ is_active_globally  ← GLOBAL KILIT
  └─ scope_role ('*' or specific role_key)

role_feature_flags (role_id, feature_key) PK
  ├─ role_id FK
  ├─ feature_key FK
  └─ is_enabled  ← ROL DAVET SÜTÜNÜ

user_feature_overrides (user_id, feature_key) PK
  ├─ user_id FK
  ├─ feature_key FK
  ├─ is_enabled  ← KULLANICI ÖZ YETKI
  └─ reason (audit için)

user_role_assignments (user_id PK)
  ├─ user_id FK (unique)
  ├─ role_id FK
  └─ sync: ← user_profiles.profile_type ile senkronize
```

### RPC: get_current_user_features()

Şu anki kullanıcı için feature'ları çözmek:

```sql
-- Psedokod
SELECT
  feature_key,
  is_enabled = (
    is_active_globally AND COALESCE(
      user_override.is_enabled,
      role_flag.is_enabled,
      role_default.is_enabled,
      false
    )
  ) AS resolved_enabled,
  source AS 'override' | 'role_flag' | 'role_default' | 'fallback'
FROM feature_catalog
WHERE scope_role = user_role OR scope_role = '*'
```

---

## Özet: Filtrelerin Akışı

```
Admin: "Bu feature'ı bu role açmak istiyorum"
  ↓
/admin/new-member/roles-features
  ↓
role_feature_flags[role_id][feature_key] = TRUE
  ↓
Veritabanında kaydedilir
  ↓
Kullanıcı oturum açtığında
  ↓
get_current_user_features() RPC çağrılır
  ↓
Karar ağacı (global → override → rol flag → rol default → fallback)
  ↓
Frontend: <RequireFeature feature="..."> karar alır
  ↓
UI gösterilir veya gizlenir ✅
```

---

## Referans: Feature Kategorileri

Kodda tüm feature'lar `src/lib/features.ts` içinde kategori başlıklarıyla tanımlanmıştır:

```typescript
export const GENERIC_FEATURES = [
  {
    key: "profile.view_own",
    label: "...",
    category: "generic",
    subcategory: "📋 Profil Yönetimi",  // ← KATEGORİ
  },
  // ...
]
```

Admin UI bu `subcategory` değerini kullanarak tablo başlıklarını gösterir.
