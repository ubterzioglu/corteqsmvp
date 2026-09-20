# Plan: Admin Menü Yeniden Yapılandırması & Temizlik

**Tarih:** 2026-06-06  
**Durum:** ONAY BEKLİYOR

---

## Gereksinimler (Yeniden Yazım)

1. **Roller Listesi** — Veritabanındaki tüm aktif rolleri listeleyen bir admin sayfası oluştur ve "Veritabanı" (eski adı "Üyeler & Veritabanı") menüsüne ekle.
2. **Guide Güncelle** — `/admin/new-member/guide` içeriğini mevcut route yapısına göre güncelle.
3. **Menü Yeniden Adlandırma** — "Üyeler & Veritabanı" → "Veritabanı"; "Üye Takibi" menü itemini bağımsız üst-level header item olarak "Üye Takibi (eski)" adıyla çıkar.
4. **"Kataloglar" → "Veritabanı"** — Veritabanı menüsünün ilk itemi olan `/admin/data` linkinin etiketini "Veritabanı" olarak değiştir.
5. **Onboarding Imports Temizliği** — Onboarding import mekanizmasını (sayfa, API katmanı, şema dosyaları) tamamen kaldır.

---

## Mevcut Durum (Keşif Özeti)

### Admin Navigasyon (`src/components/admin/admin-navigation.ts`)

**`newMemberSystemNavItems`** (= "Üyeler & Veritabanı" dropdown içeriği):
| Route | Label | Notlar |
|---|---|---|
| `/admin/members` | Üye Takibi | → dışarı çıkacak |
| `/admin/new-member/profile-role-assignment` | Profil ve Rol Atama | kalacak |
| `/admin/new-member/role-matrix` | Tüm Roller AFS Matrisi | kalacak |
| `/admin/new-member/taxonomy` | Taxonomy Yönetimi | kalacak |
| `/admin/new-member/overrides` | Feature Override | kalacak |
| `/admin/new-member/onboarding-imports` | Onboarding Importları | → silinecek |
| `/admin/new-member/guide` | Kullanım Klavuzu | kalacak |
| `/admin/data` | Kataloglar | → "Veritabanı" olacak, ilk sıraya taşınacak |

### Mevcut Roller (Veritabanı)

**Legacy rolleri** (sort_order 10–60):
- `bireysel` — Bireysel Kullanıcı
- `danisman` — Danışman
- `isletme` — İşletme
- `kurulus-dernek` — Kuruluş / Dernek
- `blogger-vlogger-youtuber` — Blogger / Vlogger / YouTuber
- `sehir-elcisi` — Şehir Elçisi

**Yeni roller** (sort_order 1000+, 76 adet, 9 aile):
- **User** (5 rol): Standart Kullanıcı, Diaspora Üyesi, Destekçi, Şehir Elçisi, Blogger / Vlogger
- **Admin** (3 rol): İçerik Moderatörü, Platform Yöneticisi, Süper Admin
- **Consultant** (10 rol): Gayrimenkul, Vize & Göçmenlik, Şirket/İş, Hukuk/Vergi, vb.
- **Organization** (8 rol): Dernek/Vakıf, Oda/Konsey, Akademik Birim, vb.
- **Business** (20 rol): Restoran, Market, Fırın, Kuaför, vb.
- **Healthcare** (7 rol): Doktor, Diş Hekimi, Psikolog, Hastane, vb.
- **Event** (3 rol): Etkinlik Organizatörü, Mekânı, Sponsoru
- **Job** (4 rol): İşveren, Recruiter, İş Arayan, Ajans
- **Community** (5 rol): Topluluk/WhatsApp/Telegram/Discord/SosyalMedya Yöneticisi
- **Marketplace** (5 rol): Bireysel/Kurumsal Satıcı, Hizmet/Ders/Ev İlanı Sahibi

**Toplam: ~88 rol** (6 legacy + 82 yeni)

### Onboarding Import Mekanizması (Silinecekler)

- `src/pages/admin/AdminOnboardingImportsPage.tsx`
- `src/lib/profile-onboarding-api.ts`
- `src/lib/profile-onboarding-schemas.ts`
- `src/lib/profile-onboarding-normalize.ts` (kontrol edilecek)
- `App.tsx` route `/admin/new-member/onboarding-imports`
- `AdminLayout.tsx` mobileMainLinks içindeki entry

---

## Uygulama Fazları

### Faz 1 — Roller Listesi Sayfası

**Dosyalar:**
- Oluşturulacak: `src/pages/admin/AdminRolesListPage.tsx`
- Güncellenecek: `src/components/admin/admin-navigation.ts`
- Güncellenecek: `src/App.tsx` (route ekle)
- Güncellenecek: `src/components/admin/AdminLayout.tsx` (mobileMainLinks)

**Yapılacaklar:**
1. `AdminRolesListPage.tsx` oluştur: `public.roles` tablosunu `sort_order` sırasıyla çek, aile gruplarına göre gruplandırarak (key prefix: User_, Admin_, Consultant_, vb.) görüntüle. Her satırda: key, label, sort_order, is_active badge.
2. `admin-navigation.ts` içinde `newMemberSystemNavItems`'a yeni item ekle:  
   `{ to: "/admin/new-member/roles-list", label: "Tüm Roller", icon: Shield }`
3. `App.tsx`'e route ekle: `<Route path="new-member/roles-list" element={<AdminRolesListPage />} />`
4. `AdminLayout.tsx` mobileMainLinks'e entry ekle.

---

### Faz 2 — Guide Sayfasını Güncelle

**Dosya:** `src/pages/admin/AdminNewMemberGuidePage.tsx`

**Sorun:** Mevcut guide içeriği eski route adlarına referans veriyor (`/admin/new-member/users-roles`, `/admin/new-member/role-management`, vb.). Bunlar artık mevcut değil; yerlerini yeni rotalar aldı.

**Güncellenecek İçerik:**
- Bölüm 1 (Ekranlar): Route ve açıklamaları yeni yapıya (profile-role-assignment, role-matrix, taxonomy) göre güncelle
- Bölüm 3 (Rol kullanımı): `admin_set_user_role` write path güncel mi kontrol et
- Bölüm 7 (Operasyon sırası): Onboarding imports referanslarını kaldır
- Bölüm 8 (Kritik notlar): Güncel durum notlarını yeniley
- Menü referanslarını "Üyeler & Veritabanı" → "Veritabanı" olarak güncelle

---

### Faz 3 — Menü Yeniden Yapılandırması

**Dosyalar:**
- `src/components/admin/AdminLayout.tsx`
- `src/components/admin/admin-navigation.ts`

**Değişiklikler:**

#### 3A — "Üyeler & Veritabanı" → "Veritabanı"
- `AdminLayout.tsx` satır 401: button içeriğini `Veritabanı` yap.
- `newMemberMenuActive` hesaplamasından `/admin/members` çıkar.

#### 3B — "Üye Takibi" → Standalone "Üye Takibi (eski)" header item
- `newMemberSystemNavItems`'dan `{ to: "/admin/members", label: "Üye Takibi" }` kaldır.
- `AdminLayout.tsx` header nav'a CC'den hemen sonra yeni bir `NavLink` ekle:  
  `Üye Takibi (eski)` → `/admin/members`, variant: `"members"` (yeşil)
- `mobileMainLinks`'teki "Üye Takibi" label'ini "Üye Takibi (eski)" yap.

---

### Faz 4 — "Kataloglar" → "Veritabanı" + İlk Sıraya Al

**Dosya:** `src/components/admin/admin-navigation.ts`

**Değişiklik:** `newMemberSystemNavItems` içindeki  
`{ to: "/admin/data", label: "Kataloglar", icon: Database }` → `{ to: "/admin/data", label: "Veritabanı", icon: Database }`  
ve bu item'ı dizinin **ilk sırasına** taşı.

> Not: `dataNavItems` dizisinde de aynı item var (`{ to: "/admin/data", label: "Kataloglar" }`) — orayı da güncelle.

---

### Faz 5 — Onboarding Imports Temizliği

**Silinecek dosyalar:**
- `src/pages/admin/AdminOnboardingImportsPage.tsx`
- `src/lib/profile-onboarding-api.ts`
- `src/lib/profile-onboarding-schemas.ts`
- `src/lib/profile-onboarding-normalize.ts` (varsa)

**Güncellenecek dosyalar:**
1. `src/App.tsx` — `/admin/new-member/onboarding-imports` route'unu kaldır
2. `src/components/admin/admin-navigation.ts` — `newMemberSystemNavItems`'dan `onboarding-imports` kaldır
3. `src/components/admin/AdminLayout.tsx` — `mobileMainLinks`'ten kaldır
4. Import eden diğer dosyalar — `grep` ile tespit et ve temizle

**Dikkat:** `profile-onboarding-api.ts` içindeki `listProfileOnboardingImportsForAdmin` fonksiyonu başka sayfalarda kullanılıyor olabilir — silmeden önce tüm referanslar kontrol edilecek.

---

## Risk Değerlendirmesi

| Risk | Seviye | Önlem |
|---|---|---|
| Onboarding API'si başka yerde kullanılıyor olabilir | ORTA | Silmeden önce `grep` ile tüm referanslar kontrol edilecek |
| Guide güncellemesi eksik route kapsayabilir | DÜŞÜK | Mevcut `App.tsx` route listesiyle çapraz kontrol |
| `Kataloglar` label değişikliği başka yerde referans alınıyor olabilir | DÜŞÜK | `grep` ile kontrol |
| `newMemberMenuActive` hesaplamasından `/admin/members` çıkınca aktif state kaybolabilir | DÜŞÜK | Yeni standalone link kendi aktif state'ini yönetecek |

---

## Dosya Değişiklik Özeti

| Dosya | İşlem |
|---|---|
| `src/pages/admin/AdminRolesListPage.tsx` | OLUŞTUR |
| `src/pages/admin/AdminOnboardingImportsPage.tsx` | SİL |
| `src/lib/profile-onboarding-api.ts` | SİL |
| `src/lib/profile-onboarding-schemas.ts` | SİL |
| `src/lib/profile-onboarding-normalize.ts` | SİL (varsa) |
| `src/components/admin/admin-navigation.ts` | GÜNCELLE |
| `src/components/admin/AdminLayout.tsx` | GÜNCELLE |
| `src/pages/admin/AdminNewMemberGuidePage.tsx` | GÜNCELLE |
| `src/App.tsx` | GÜNCELLE (2 route değişikliği) |

---

## Onay Bekleniyor

Yukarıdaki plana göre devam etmemi onaylıyor musun?  
Değiştirmek istediğin bir şey varsa belirt, sonra uygulama başlar.
