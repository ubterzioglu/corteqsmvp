# Kategori · Rol · Feature Yapısı — Admin Kılavuzu

Bu belge, yetkilendirme sisteminin üç katmanını (kategori, rol, feature) ve bunların birbirleriyle ilişkisini açıklar. Günlük operasyon adımları için `rolesgo-mvp-kullanim-klavuzu.md` belgesine bakın.

---

## 1. Üç Katman Nedir?

```
Feature Kategorisi
    └── Feature'lar (somut yetkiler)
            └── Rol  (hangi kullanıcılar hangi feature'lara sahip)
                    └── Kullanıcı Override  (bireysel istisna)
```

| Katman | Nerede tutulur | Ne işe yarar |
|--------|---------------|--------------|
| **Kategori** | `src/lib/features.ts` (kod sabiti) | Feature'ları iki gruba ayırır: `legacy-individual` ve `generic` |
| **Feature** | `feature_catalog` tablosu | Somut bir yetki birimini tanımlar (örn. directory görünürlüğü) |
| **Rol** | `roles` tablosu | Kullanıcı tipini tanımlar; feature'ları role göre toplu açar/kapar |
| **Kullanıcı Override** | `user_feature_overrides` tablosu | Tek kullanıcıya rol dışı istisna yetki verir |

---

## 2. Feature Kategorileri

Sistemde **iki kategori** vardır. Kategoriler değiştirilemez — kod sabiti olarak `features.ts` içinde tanımlıdır.

### 2.1 `legacy-individual` — Bireysel Profil Özellikleri

Yalnızca `bireysel` rolündeki kullanıcılara uygulanır. Eski sistemden gelen bu feature'lar profil ekranındaki bölümleri açıp kapar.

| Feature Key | Ekran Adı | Ne Açar |
|-------------|-----------|---------|
| `individual.about` | Hakkında | Profil özeti alanı |
| `individual.service_requests` | Hizmet Talepleri | Hizmet talebi modülü |
| `individual.events` | Etkinlikler | Etkinlik listesi ve katılım |
| `individual.follows` | Takipler | Takip edilen kişiler ve içerikler |
| `individual.whatsapp` | WhatsApp | WhatsApp grup/iletişim modülü |
| `individual.messages` | Mesajlar | Platform içi mesajlaşma |
| `individual.activity` | Aktivite | Son aktiviteler akışı |
| `individual.cv_request` | CV Talebi | CV/özgeçmiş talep modülü |
| `individual.job_seeking_badge` | İş Arıyorum Badge'i | Profilde rozet görünürlüğü |
| `individual.moving_soon_badge` | Yakında Taşınacağım | Taşınma rozeti ve filtresi |
| `individual.volunteer_mentorship` | Gönüllü Mentörlük | Mentör kartı oluşturma akışı |

> **Önemli:** Bu feature'lar admin ekranı `/admin/new-member/roles-features` içinde yalnızca `bireysel` sütununda görünür. Diğer rollerde bu satırlar anlamsızdır.

### 2.2 `generic` — Tüm Rollere Uygulanabilen Yetkiler

Her rolde açılıp kapatılabilir. Alt gruplar aşağıdadır.

#### Profil Yönetimi

| Feature Key | Ekran Adı | Ne Açar |
|-------------|-----------|---------|
| `profile.view_own` | Kendi Profilini Gör | Kullanıcı kendi profilini görüntüleyebilir |
| `profile.edit_own` | Kendi Profilini Düzenle | Profil verilerini güncelleyebilir |
| `profile.edit_public` | Public Alanları Düzenle | Dışarıya açık alanları yönetebilir |
| `profile.linkedin_card` | LinkedIn Kartı | LinkedIn kartını profilinde yönetebilir |
| `profile.website_card` | Web Sitesi Kartı | Web sitesi kartını yönetebilir |
| `profile.cv_upload` | CV Yükleme | CV dosyası yükleyebilir |
| `profile.presentation_upload` | Sunum Yükleme | Sunum/tanıtım dosyası yükleyebilir |

#### Directory

| Feature Key | Ekran Adı | Ne Açar |
|-------------|-----------|---------|
| `directory.visible` | Directory Görünürlüğü | Public dizinde listelenebilir |
| `directory.featured` | Öne Çıkarılmış Profil | Dizinde öne çıkan kart olarak gösterilir |

#### İletişim

| Feature Key | Ekran Adı | Ne Açar |
|-------------|-----------|---------|
| `contact.receive` | İletişim Talebi Al | Diğer kullanıcılardan iletişim talebi alabilir |
| `contact.show_whatsapp` | WhatsApp Göster | WhatsApp numarasını public gösterebilir |

#### İçerik ve Üretim

| Feature Key | Ekran Adı | Ne Açar |
|-------------|-----------|---------|
| `content.create` | İçerik Oluştur | İçerik/post oluşturabilir |
| `content.edit_own` | İçeriğini Düzenle | Kendi içeriğini düzenleyebilir |
| `events.create` | Etkinlik Oluştur | Etkinlik açma akışına erişebilir |
| `offers.create` | Teklif Oluştur | Teklif/hizmet oluşturma akışına erişebilir |
| `referral.create` | Referral Oluştur | Referral talebi başlatabilir |

#### Platform Erişimi

| Feature Key | Ekran Adı | Ne Açar |
|-------------|-----------|---------|
| `cadde.access` | Cadde Erişimi | Cadde sayfasına girebilir |
| `city.manage` | Şehir Yönetimi | Şehir bazlı yönetim alanına erişebilir |
| `whatsapp_landing.edit_assigned` | Atanmış Topluluk Landing Düzenleme | Atanmış topluluk landing kayıtlarını düzenleyebilir |

#### Sistem

| Feature Key | Ekran Adı | Ne Açar |
|-------------|-----------|---------|
| `admin.requires_approval` | Admin Onayı Gerekir | İlgili akış admin onayı gerektirir |

---

## 3. Roller

Sistemde **6 aktif rol** vardır. Her kullanıcının bir rolü olur.

| Rol Key | Görünen Ad | Kullanıcı Tipi |
|---------|-----------|----------------|
| `bireysel` | Bireysel Kullanıcı | Standart bireysel üye |
| `danisman` | Danışman | Profesyonel danışman |
| `isletme` | İşletme | Şirket veya işletme hesabı |
| `kurulus-dernek` | Kuruluş / Dernek | Sivil toplum ve dernekler |
| `blogger-vlogger-youtuber` | İçerik Üreticisi | Blog, vlog, YouTube içerik üreticisi |
| `sehir-elcisi` | Şehir Elçisi | Şehir temsilcisi |

> **Not:** Kullanıcı başına yalnızca **bir aktif rol** atanır. Rol değiştirmek `user_role_assignments` tablosunu günceller ve `user_profiles.profile_type` alanıyla otomatik senkronize olur.

---

## 4. Öncelik Sırası (Kim Kazanır?)

Bir kullanıcının belirli bir feature'a erişimi olup olmadığı şu sırayla belirlenir:

```
1. Kullanıcı Override   →  user_feature_overrides tablosu  (EN YÜKSEK)
2. Rol Feature Bayrağı  →  role_feature_flags tablosu
3. Rol Feature Varsayılanı → role_feature_defaults tablosu (eski sistem, fallback)
4. Sistem Varsayılanı   →  false                            (EN DÜŞÜK)
```

Bunun **üstünde** global bir kilit daha vardır:

```
Sonuç = feature_catalog.is_active_globally  AND  (yukarıdaki sırayla bulunan değer)
```

Yani `is_active_globally = false` ise override bile olsa feature **hiç açılmaz**.

### Örnek Senaryolar

| Durum | Sonuç |
|-------|-------|
| Global kapalı, rol açık, override yok | ❌ Kapalı |
| Global açık, rol kapalı, override yok | ❌ Kapalı |
| Global açık, rol kapalı, override = açık | ✅ Açık |
| Global açık, rol açık, override = kapalı | ❌ Kapalı (override kazandı) |
| Global açık, rol açık, override yok | ✅ Açık |

---

## 5. Admin Ekranları ve Görevleri

### 5.1 `/admin/new-member/roles-features` — Rol-Feature Matrisi

**Ne yapar:** Feature'ları global ve rol bazında açar/kapar.

Ekran iki boyutlu bir tablo gösterir:
- **Satırlar:** Feature'lar (kategori bazında gruplu)
- **Sütunlar:** Roller
- **Global toggle:** Her satırın solunda — tüm rolleri geçersiz kılan global kilit
- **Hücre toggle:** İlgili rolde o feature açık mı?

**Ne zaman kullanılır:**
- Yeni bir rolü sisteme ekledikten sonra feature setini yapılandırmak
- Tüm kullanıcılarda bir feature'ı tamamen kapatmak (global toggle)
- Belirli bir role ait feature grubunu toplu değiştirmek

### 5.2 `/admin/new-member/users-roles` — Kullanıcı Rol Ataması

**Ne yapar:** Bireysel kullanıcılara rol atar, override sayısını ve bekleyen talepleri gösterir.

**Ne zaman kullanılır:**
- Yeni kayıt olan bir kullanıcının rolünü belirlemek
- Onaylanan rol değişikliği talebini uygulamak
- Kullanıcının kaç aktif override'ı olduğunu kontrol etmek

### 5.3 `/admin/new-member/overrides` — Kullanıcı Bazlı İstisnalar

**Ne yapar:** Tek bir kullanıcıya, rolünden bağımsız olarak belirli bir feature'ı açar veya kapatır.

**Ne zaman kullanılır:**
- Rolünde kapalı olan bir feature'ı tek kullanıcıya geçici vermek
- Belirli bir kullanıcıyı bir feature'dan çıkarmak
- Override verirken **neden alanını doldurun** — audit logda ve ileriki takipte kritiktir

### 5.4 `/admin/approvals` — Onay Kuyruğu

**Ne yapar:** Kullanıcıların gönderdiği rol değişikliği ve feature taleplerini onaylar veya reddeder.

Onaylanabilen talep türleri: `role_change`, `directory_visibility`, `featured_listing`, `event_create`, `offer_create`, `referral_create`, `attribute_change`, `city_manage`

---

## 6. Sık Yapılan Hatalar

| Hata | Neden olur | Nasıl düzeltilir |
|------|-----------|-----------------|
| Feature açık ama kullanıcı göremez | Global toggle kapalı | `/roles-features` → ilgili satırda global toggle kontrol et |
| Override verildi ama etki yok | Global toggle kapalı | Global toggle açılmadan override geçersizdir |
| `individual.*` feature başka rolde açık ama çalışmıyor | `scope_role` yalnızca `bireysel` | Bu feature'lar teknik olarak diğer rollerde uygulanmaz |
| Rol değiştirdim ama kullanıcı hâlâ eski feature'ları görüyor | Oturum cache'i | Kullanıcının çıkış yapıp tekrar giriş yapması gerekir |
| Override silindi ama değişiklik olmadı | Rol varsayılanı zaten aynı değerdeydi | Normal; override kaldırılınca rol varsayılanı devreye girer |

---

## 7. Hızlı Referans: Feature Key → Admin Ekranı

| Yapmak istediğim | Gideceğim ekran |
|-----------------|----------------|
| Tüm `bireysel` kullanıcıların `individual.about` bölümünü kapat | `/roles-features` → `individual.about` satırı → `bireysel` sütunu |
| `directory.visible` özelliğini sistem genelinde kapat | `/roles-features` → `directory.visible` satırı → Global toggle |
| Tek kullanıcıya `events.create` ver | `/overrides` → kullanıcıyı bul → `events.create` → enable |
| Kullanıcının rolünü `bireysel`'den `danisman`'a geçir | `/users-roles` → kullanıcıyı bul → rol değiştir |
| Kullanıcının rol değişikliği talebini onayla | `/approvals` → `role_change` tipindeki talebi onayla |
