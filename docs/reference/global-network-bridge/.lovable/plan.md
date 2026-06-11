## Revizyon Planı — Profil Ayarları (Owner Notları K & L)

Notlar 22 satırı kapsıyor; aşağıda her birini hangi dosyada nasıl uygulayacağımı listeliyorum. Onayınla hepsini sırayla işleyeceğim.

### 1) Tüm rollere Tag Line (25 karakter)
- `IdentityFields` benzeri ortak input bloğunu 6 profilde de göster (mevcutta sadece Individual'da var).
- Etkilenen: `ProfileIndividual`, `ProfileConsultant`, `ProfileBusiness`, `ProfileAssociation`, `ProfileBlogger`, `ProfileAmbassador` ayar sekmeleri ve ilgili `*SettingsForm` dosyaları. Karakter sınırı 25.

### 2) Ad Soyad — tüm kategorilerde zorunlu
- Settings formlarına `required` + validasyon. İşletme/Kuruluş için "yetkili adı" olarak ek alan.

### 3) İşletme/Kuruluş Adı — Business & Association zorunlu (zaten kısmen var; required işaretle)

### 4) Profil Fotoğrafı — tüm rollere isteğe bağlı upload
- Ortak `AvatarUpload` bileşeni oluştur, 6 settings formuna yerleştir. (Storage bucket: `avatars`, RLS user-scope.)

### 5) Ünvan/Uzmanlık + "Tema"
- Consultant ve Blogger formlarına `theme` alanı ekle.
- Business kayıt formunda "İşletme Tipi" seçimi: `1 - Start-up`, `2 - Online İşletme` (mevcut sektör/altkategori ile birlikte).

### 6) Bio / Hakkında — Individual'a da ekle (kısa, 500 char)

### 7) Doğum Tarihi — Consultant'a da ekle

### 8) Kuruluş Yılı — Consultant, Business, Association

### 9) Sektör — Individual ve Blogger hariç tümünde

### 10) Kuruluş Ana Kategori — `Dernek, Vakıf, Medya, Akademi, Eğitim`
- `data/organizationCategories.ts` içine eksik olanları ekle (Akademi, Eğitim, Medya).

### 11) E-posta + Telefon — tüm rollerde zorunlu
- `ProfileLocationPhoneSettings` ve ilgili formlarda `required` + submit-time guard.

### 12) Web Sitesi — Individual dahil tümü; çoklu link
- `WebsiteLinksField` (dinamik liste, 1–5 link). Tüm settings formlarına ekle.

### 13) Haritada Yer Al — Association için aç (zaten Consultant/Business'ta var)

### 14) WhatsApp CTA — Business, Consultant, Association (Ambassador zaten var)
- Doğrulanmış telefondan otomatik; toggle 4 rolde göster.

### 15) Sunum / Tanıtım Yükleme — Business & Consultant
- Storage `presentations` bucket; PDF/PPT/PPTX/KEY upload.

### 16) CorteQS Pasaportu — tüm rollerde göster (status rozeti)

### 17) "Onaylı Hesap" Mavi Tik — tüm kategoriler
- "Onaylı İşletme Rozeti" → genel `verified_account` rozeti. Profil kart başlıklarında mavi tik.
- `profiles.verified` kolonu ve admin onay akışı (admin paneli mevcut moderation kuyruğuna entry).

### 18) Ambassador Referans Kodu akışı
- Şehir elçisi kaydı tamamlandığında `ambassador_applications` kuyruğuna düşer (admin onay).
- Admin onaylayınca trigger `referral_code` üretip `ambassadors` satırına yazar.
- `AmbassadorReferralCard` durumu: `pending | approved (kod gösterir)`.

### 19) Profil Özellik Toggle'ları — Ambassador'a da ver
- `ConsultantFeatureToggles` deseninden `AmbassadorFeatureToggles` türet.

### 20) Takvim Yönetimi — Ambassador'a da ver
- `AppointmentManagePanel` Ambassador profilinde de mount edilsin.

---

### Teknik notlar
- Şema değişiklikleri (migration):
  - `profiles`: `tag_line text(25)`, `bio text`, `birth_date date`, `founded_year int`, `sector text`, `theme text`, `verified boolean default false`, `websites jsonb default '[]'`, `whatsapp_cta_enabled boolean`, `show_on_map boolean`.
  - `businesses`: `business_subtype text` (`startup` | `online`).
  - `ambassador_applications` tablosu (status: `pending|approved|rejected`, RLS: kullanıcı kendi başvurusu, admin tümü).
  - Storage bucket: `presentations` (RLS: owner CRUD).
- Validasyon: `zod` şemalarını her settings formunda güncelle.

### Sıralama
1. Migrationlar (şema + bucket).  
2. Ortak bileşenler: `AvatarUpload`, `WebsiteLinksField`, `TagLineInput`, `VerifiedBadge`.  
3. Org kategori listesi güncellemesi.  
4. 6 profilin settings formuna alan ilaveleri + zorunluluklar.  
5. Ambassador referral admin onay akışı.  
6. Ambassador'a Toggle'lar + Takvim panelinin eklenmesi.  
7. Profil kartlarına mavi tik gösterimi.

Onaylarsan migrationla başlayıp listeyi sırasıyla uygulayacağım.