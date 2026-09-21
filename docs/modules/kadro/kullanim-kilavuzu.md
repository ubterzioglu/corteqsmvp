# Kadro Konsolu Kullanım Kılavuzu

## Giriş

Kadro Konsolu, CorteQS'in 52 pozisyonluk kadro planını yönetmek için geliştirilmiş bir admin aracıdır. Bu konsol ile rol durumlarını takip edebilir, adayları yönetebilir, rutinleri görüntüleyebilir ve ilan metinlerini kopyalayabilirsiniz.

**Erişim:** Admin panelde sol menüden "Kadro" bölümüne gidin.

## Sayfalar

### 1. Ana Kadro Listesi (`/admin/kadro`)

52 pozisyonun tamamını görüntüleyebileceğiniz ana sayfa.

#### Üst Kısım - Özet Kartları

Sayfanın en üstünde 4 özet kartı bulunur:

- **Toplam:** Tüm pozisyon sayısı (52)
- **Açık:** Şu anda açık olan pozisyon sayısı
- **Dolu:** Dolu veya destek veren pozisyon sayısı
- **Kritik & Açık:** Kritik öncelikli ve açık pozisyon sayısı

#### Filtreler

Pozisyonları daraltmak için şu filtreleri kullanabilirsiniz:

**Arama Kutusu:**
- Pozisyon adı, sahip, KPI veya notlarda arama yapar
- Türkçe karakter desteği vardır (örn: "pazarlama" yazarak tüm pazarlama rollerini bulabilirsiniz)

**Dropdown Filtreler:**
- **Departman:** 6 departman (Kuruluş & Liderlik, Pazarlama & Büyüme, Ürün & Teknoloji, Operasyon & Güven, Gelir & Ortaklıklar, Finans & Hukuk)
- **Dalga:** 3 dalga (Dalga 1: 0-3 ay, Dalga 2: 3-6 ay, Dalga 3: 6-12 ay)
- **Tip:** 6 çalışma tipi (Çekirdek, Proje bazlı, Gönüllü/Topluluk, Danışman, Dış kaynak, Part-time)
- **Durum:** 7 durum (Dolu, Destek veriyor, Görüşmede, Aday var, Teklif aşaması, Açık, Beklemede)

**Sadece Açık Pozisyonlar:**
- Bu checkbox'ı işaretlerseniz sadece açık pozisyonlar listelenir

**CSV İndir:**
- Filtrelenmiş listeyi CSV olarak indirir
- Excel'de açılabilir (UTF-8 BOM ile Türkçe karakter desteği)

#### Rol Listesi

Pozisyonlar departman ve eksen bazında gruplandırılmıştır:

**Departman Başlıkları:**
- Her departman ayrı bir kart içinde gösterilir
- Departman adı ve açıklaması başlıkta yer alır

**Eksen Alt Grupları:**
- Pazarlama departmanı 3 eksene ayrılır: Ürün hattı, İşlev hattı, Coğrafya hattı
- Diğer departmanlar tek eksen altında toplanır

**Rol Kartları:**
Her rol kartında şu bilgiler yer alır:
- Pozisyon adı
- Dalga numarası
- Durum rozeti (renkli)
- Öncelik rozeti (renkli)
- Çalışma tipi
- "Düzenlendi" rozeti (eğer DB'de değişiklik yapılmışsa)

#### Rol Detay Çekmecesi

Bir rol kartına tıkladığınızda sağdan bir çekmece açılır.

**Üst Kısım - Rol Bilgileri:**
- Departman
- Eksen
- Dalga
- Çalışma Tipi
- Durum
- Öncelik

**Görev Tanımı:**
- Rolün detaylı açıklaması

**KPI'lar:**
- Rolün performans göstergeleri

**Detaylar:**
- Rapor Yöneticisi
- Çalışma Saati
- Ücret
- ESOP
- Çalışma Düzeni
- Araçlar
- Tetikleyici
- Çıkış Planı

**Tab Bölümleri:**

1. **Durum Düzenle:**
   - Durum dropdown'ı
   - Öncelik dropdown'ı
   - Sorumlu Kişi input'u
   - Not textarea'sı
   - "Değişiklikleri Kaydet" butonu
   - Değişiklik yapılmazsa buton devre dışı kalır

2. **Adaylar:**
   - Mevcut adaylar listelenir
   - "Aday Ekle" butonu ile yeni aday eklenebilir
   - Her aday için:
     - Ad Soyad
     - LinkedIn/GitHub linkleri
     - Aşama (Aday, Görüşmede, Teklif verildi, Kapandı)
     - Notlar
     - Düzenle ve Sil butonları

3. **Geçmiş:**
   - Tüm değişiklikler kronolojik sırada listelenir
   - Her değişiklik için:
     - Alan adı (Durum, Öncelik, Sorumlu Kişi, Not)
     - Tarih ve saat
     - Eski değer → Yeni değer
     - Değiştiren kullanıcı

### 2. Pazarlama Matrisi (`/admin/kadro/matris`)

Pazarlama departmanının 27 rolünü 3 eksen bazında görselleştirir.

**3 Sütunlu Yapı:**

1. **Ürün Hattı (7 rol):**
   - F1000 Küratörü
   - Radar Story Curator
   - Defter Editörü
   - Şehir Lansman Koordinatörü
   - Motor (Performans Reklam)
   - Çarşı Editörü
   - Etkinlik Koordinatörü

2. **İşlev Hattı (11 rol):**
   - Instagram Kanal Yöneticisi
   - LinkedIn Yöneticisi
   - YouTube Editörü
   - Short-form Video Üreticisi
   - Creator İlişkileri Yöneticisi
   - Görsel Tasarımcı
   - SEO Uzmanı
   - Performans Analisti
   - CRM Uzmanı
   - İçerik Analisti
   - Topluluk Yöneticisi

3. **Coğrafya Hattı (9 rol):**
   - DACH Bölge Küratörü
   - İngiltere Küratörü
   - Benelux Küratörü
   - Körfez Küratörü
   - Kuzey Amerika Küratörü
   - Türkiye Şehir Koordinatörü
   - Elçi Programı Yöneticisi
   - Katkıcı Ağı Yöneticisi
   - Bölgesel Program Yöneticisi

**Her Rol Kartında:**
- Pozisyon adı
- Dalga numarası
- Durum rozeti
- Öncelik rozeti

### 3. Rutinler (`/admin/kadro/rutinler`)

Pazarlama ekibinin 17 rutinini sıklık bazında gruplandırır.

**4 Grup:**

1. **Günlük Rutinler (5):**
   - Radar story dizilimi
   - Instagram story yayını
   - Short-form video üretimi
   - Topluluk moderasyonu
   - Platform sağlık kontrolü

2. **Haftalık Rutinler (7):**
   - Pazarlama standup'ı
   - F1000 abone raporu
   - Defter yayın planı
   - Creator check-in
   - Büyüme metrikleri review
   - Sprint review
   - Güvenlik taraması

3. **Aylık Rutinler (4):**
   - Şehir lansman review
   - İçerik performansı analizi
   - Partner performansı
   - B2B pipeline review

4. **Yıllık Rutinler (1):**
   - Yıllık strateji review

**Her Rutin İçin:**
- Rutin adı
- Detaylı açıklama
- Sorumlu kişi (rol adı)

### 4. İlan Metinleri (`/admin/kadro/ilanlar`)

50 pozisyon için hazır ilan metinlerini görüntüler ve kopyalar.

**Üst Kısım - Filtreler:**
- Arama kutusu (pozisyon adı, özet, görevler)
- Departman dropdown'ı

**İlan Kartları:**

Her pozisyon için bir kart gösterilir:
- Pozisyon adı
- Departman ve dalga bilgisi
- "Kopyala" butonu
- "Göster/Gizle" butonu

**Kopyala Butonu:**
- Tek tıkla tüm ilan metnini panoya kopyalar
- 2 saniye boyunca "Kopyalandı ✓" gösterir

**Göster Butonu:**
- İlana tıkladığınızda metin açılır
- İlan metni şu bölümleri içerir:
  1. Pozisyon başlığı
  2. Özet paragraf
  3. Ne yapacaksın? (görevler)
  4. Kimi arıyoruz? (profil)
  5. Nasıl bir yerde çalışacaksın? (startup bilgisi)
  6. Çalışma ve kazanç modeli
  7. Başvuru bilgileri
  8. Görev testi

**Not:** 2 kurucu rolünde (CEO, CTO) ilan metni yoktur.

## Veri Modeli

### Rolleri

52 rol 8 dosyada tanımlanmıştır:

1. **liderlik.ts** (5 rol): CEO, CTO, CMO, Partner, Advisor
2. **kurumsal.ts** (3 rol): CFO, Legal, Finans
3. **pazarlama-urun.ts** (7 rol): Ürün hattı rolleri
4. **pazarlama-islev.ts** (11 rol): İşlev hattı rolleri
5. **pazarlama-cografya.ts** (9 rol): Coğrafya hattı rolleri
6. **urun-teknoloji.ts** (9 rol): Fullstack, Design, Frontend, Backend, Mobile, QA, AI, Data, DevOps
7. **operasyon.ts** (5 rol): Partner, Platform, Trust, Moderasyon, Success
8. **gelir.ts** (3 rol): B2B, Sponsor, Account

### Veritabanı Tabloları

**kadro_role_states:**
- Her rol için en fazla 1 satır
- Durum, öncelik, sahip, not bilgileri
- updated_at ve updated_by otomatik güncellenir

**kadro_role_events:**
- Append-only (silinemez)
- Her değişiklik için otomatik kayıt
- field, old_value, new_value, changed_by, changed_at

**kadro_candidates:**
- Her rol için birden fazla aday
- full_name, links, stage, note
- created_by, created_at, updated_at

### Güvenlik

- Tüm tablolarda RLS (Row Level Security) aktif
- Yalnız admin kullanıcılar erişebilir
- Event tablosu append-only (trigger ile yazılır, silinemez)

## Teknik Detaylar

### Dosya Yapısı

```
src/lib/kadro/
├── roles/                    # 52 rol tanımı
│   ├── liderlik.ts
│   ├── kurumsal.ts
│   ├── pazarlama-urun.ts
│   ├── pazarlama-islev.ts
│   ├── pazarlama-cografya.ts
│   ├── urun-teknoloji.ts
│   ├── operasyon.ts
│   ├── gelir.ts
│   └── index.ts
├── kadro-types.ts           # TypeScript tipleri
├── kadro-taxonomy.ts        # Sabit listeler
├── kadro-routines.ts        # 17 rutin
├── kadro-api.ts             # Supabase CRUD
├── kadro-view.ts            # Filtreleme, gruplama
├── kadro-ad-text.ts         # İlan metni üretimi
└── kadro-csv.ts             # CSV export

src/components/admin/kadro/
├── KadroSummary.tsx         # Özet kartları
├── KadroFilters.tsx         # Filtre paneli
├── KadroRoleTable.tsx       # Rol listesi
├── KadroRoleDrawer.tsx      # Detay çekmecesi
├── KadroStateForm.tsx       # Durum düzenleme
├── KadroEventLog.tsx        # Değişiklik geçmişi
└── KadroCandidateList.tsx   # Aday listesi

src/pages/admin/kadro/
├── routes.tsx               # Route tanımları
├── AdminKadroPage.tsx       # Ana sayfa
├── AdminKadroMatrisPage.tsx # Matris sayfası
├── AdminKadroRutinlerPage.tsx # Rutinler sayfası
└── AdminKadroIlanlarPage.tsx # İlanlar sayfası

src/hooks/kadro/
├── useKadroBoard.ts         # Ana veri hook'u
└── useKadroRoleDetail.ts    # Detay hook'u

supabase/migrations/applied/
└── 20260920100000_kadro_konsolu.sql
```

### Testler

90 test 8 dosyada:

- `kadro-taxonomy.test.ts` - Taksonomi doğrulaması
- `roles/index.test.ts` - 52 rol doğrulaması
- `kadro-routines.test.ts` - 17 rutin doğrulaması
- `kadro-migration.test.ts` - Migration sözleşmesi
- `kadro-api.test.ts` - API doğrulama
- `kadro-view.test.ts` - View mantığı
- `kadro-ad-text.test.ts` - İlan metni üretimi
- `kadro-csv.test.ts` - CSV export

### API Fonksiyonları

**fetchKadroRoleStates():** Tüm rol durumlarını getirir

**saveKadroRoleState(roleKey, state, userId):** Rol durumunu kaydeder

**fetchKadroRoleEvents(roleKey):** Rolün değişiklik geçmişini getirir

**fetchKadroCandidates(roleKey):** Rolün adaylarını getirir

**createKadroCandidate(roleKey, draft, userId):** Yeni aday ekler

**updateKadroCandidate(candidateId, draft):** Adayı günceller

**deleteKadroCandidate(candidateId):** Adayı siler

**validateKadroCandidateDraft(draft):** Aday verisini doğrular

**buildKadroAdText(role):** İlan metni üretir

**buildKadroCsv(roles):** CSV metni üretir

**downloadKadroCsv(roles):** CSV dosyasını indirir

## Sık Sorulan Sorular

### Bir rolün durumunu nasıl değiştiririm?

1. Ana sayfada rol kartına tıklayın
2. Sağdan açılan çekmecede "Durum Düzenle" sekmesine gidin
3. Durum, öncelik, sorumlu kişi veya not alanlarını değiştirin
4. "Değişiklikleri Kaydet" butonuna tıklayın
5. Değişiklik otomatik olarak geçmişe kaydedilir

### Yeni bir aday nasıl eklerim?

1. Rol detay çekmecesini açın
2. "Adaylar" sekmesine gidin
3. "Aday Ekle" butonuna tıklayın
4. Ad soyad, linkler, aşama ve not alanlarını doldurun
5. "Ekle" butonuna tıklayın

### İlan metnini nasıl kopyalarım?

1. İlan Metinleri sayfasına gidin
2. İstediğiniz pozisyonun kartında "Kopyala" butonuna tıklayın
3. Metin panoya kopyalanır (2 saniye "Kopyalandı ✓" gösterilir)
4. Herhangi bir yere yapıştırabilirsiniz

### CSV'yi nasıl indiririm?

1. Ana sayfada istediğiniz filtreleri uygulayın
2. Sağ üstteki "CSV İndir" butonuna tıklayın
3. Dosya otomatik olarak indirilir
4. Excel'de açabilirsiniz (Türkçe karakterler korunur)

### Yetim DB satırı uyarısı ne anlama gelir?

Eğer özet kartlarının altında kırmızı bir uyarı görürseniz:
- Kodda tanımlı olmayan bir rol için DB'de veri var demektir
- Bu genellikle rol ID'si değiştiğinde olur
- Bu satırlar ekranda gösterilmez
- Geliştirici ile iletişime geçin

### Değişiklik geçmişi neden önemli?

- Kimin ne zaman neyi değiştirdiğini gösterir
- İki kurucu aynı panoyu kullanıyor
- Otomatik olarak trigger ile kaydedilir
- Silinemez (append-only)
- Denetim izi sağlar

## Geliştirici Notları

### Yeni Rol Ekleme

1. İlgili departman dosyasına yeni rol ekleyin (örn: `pazarlama-urun.ts`)
2. Tüm zorunlu alanları doldurun
3. Testleri çalıştırın: `npm run test -- src/lib/kadro/roles/index.test.ts`
4. Commit ve push yapın
5. DB'de otomatik olarak görünür olur

### Yeni Rutin Ekleme

1. `kadro-routines.ts` dosyasına yeni rutin ekleyin
2. `owner` alanını gerçek bir `role_key` ile eşleştirin
3. Testleri çalıştırın: `npm run test -- src/lib/kadro/kadro-routines.test.ts`
4. Commit ve push yapın

### Migration Uygulama

Migration dosyası: `supabase/migrations/applied/20260920100000_kadro_konsolu.sql`

Supabase Dashboard'dan veya CLI ile uygulanabilir:

```bash
supabase db push
```

veya

Supabase Dashboard → SQL Editor → Migration içeriğini yapıştır → Run

### Test Çalıştırma

Tüm kadro testlerini çalıştırmak için:

```bash
npm run test -- src/lib/kadro/
```

Belirli bir test dosyası için:

```bash
npm run test -- src/lib/kadro/roles/index.test.ts
```

## Sorun Giderme

### Sayfa açılmıyor

- Admin hesabıyla giriş yaptığınızdan emin olun
- Tarayıcı konsolunu kontrol edin (F12)
- Network sekmesinde API çağrılarını kontrol edin

### Veriler görünmüyor

- Migration'ın uygulandığını kontrol edin
- Supabase Dashboard'da tabloların oluştuğunu kontrol edin
- RLS politikalarının doğru olduğunu kontrol edin

### CSV açılmıyor

- Excel kullanıyorsanız UTF-8 BOM desteği olmalı
- Google Sheets veya LibreOffice Calc deneyin
- Dosyayı text editor ile açıp encoding'i kontrol edin

### Değişiklikler kaydedilmiyor

- Network bağlantısını kontrol edin
- Tarayıcı konsolunda hata var mı kontrol edin
- Supabase Dashboard'da RLS politikalarını kontrol edin

## İletişim

Sorularınız için:
- GitHub Issues: https://github.com/ubterzioglu/corteqsmvp/issues
- Dokümantasyon: `docs/superpowers/specs/2026-09-20-kadro-konsolu-design.md`
- Plan: `docs/superpowers/plans/2026-09-20-kadro-konsolu.md`
