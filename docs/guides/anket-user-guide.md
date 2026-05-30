# CorteQS Anket Modülü Kullanım Kılavuzu

Bu doküman, mevcut `/anket` modülünün günlük kullanımını anlatır.

## 1) Genel Bakış

Anket modülü iki taraftan oluşur:

- Public taraf: Kullanıcıların anket görüp cevapladığı alan
- Admin taraf: Anket oluşturma, yayınlama, kapatma ve cevapları izleme alanı

## 2) Public Kullanım

### 2.1 Anket listesi

Route: `/anket`

Kullanıcı burada yalnızca aktif ve yayınlanmış anketleri görür.

Her kartta:

- Anket başlığı
- Açıklama
- `Ankete Katıl` butonu

### 2.2 Anket detay ve cevaplama

Route: `/anket/:slug`

Kullanıcı:

- Soruları görür
- Zorunlu alanları doldurur
- İsterse opsiyonel iletişim bilgilerini girer
- `Cevabımı Gönder` ile submit eder

Başarılı submit sonrası yönlendirme:

- `/anket/tesekkurler`

### 2.3 Teşekkür sayfası

Route: `/anket/tesekkurler`

Kullanıcıya başarılı gönderim mesajı gösterilir.

## 3) Admin Kullanım

## 3.1 Anket listesi

Route: `/admin/surveys`

Listede görünen temel alanlar:

- Başlık
- Slug
- Status
- Cevap sayısı
- Yayın tarihi
- Oluşturma tarihi

Aksiyonlar:

- Düzenle
- Cevapları Gör
- Yayınla
- Kapat
- Arşivle
- Sil

## 3.2 Yeni anket oluşturma

Route: `/admin/surveys/new`

Doldurulacak alanlar:

- Başlık
- Slug (boş bırakılırsa başlıktan üretilir)
- Açıklama
- Başlangıç/Bitiş tarihleri (opsiyonel)
- Anonymous cevap izni
- Multiple submission izni
- Featured

Soru builder ile:

- Soru eklenir
- Soru tipi seçilir (`free text` veya `çoktan seçmeli`)
- Required işaretlenir
- `çoktan seçmeli` için seçenekler girilir
- Sıralama yapılır

Kaydet sonrası anket taslak (`draft`) olarak tutulur.

## 3.3 Anket düzenleme

Route: `/admin/surveys/:id/edit`

Admin mevcut anket bilgilerini ve soruları günceller.

## 3.4 Cevapları görüntüleme

Route: `/admin/surveys/:id/responses`

Admin:

- Cevap listesini görür
- Bir cevabı seçip detayını inceler
- Durumu `reviewed` veya `archived` yapar

Not: Bu sürümde CSV export yoktur.

## 4) Status Mantığı

Anket statüleri:

- `draft`: Hazırlık aşaması, publicte görünmez
- `published`: Yayında, publicte görünür
- `closed`: Kapatılmış, yeni cevap alınmaz
- `archived`: Arşivlenmiş, publicte görünmez

## 5) Güvenlik ve Veri Davranışı

Cevap gönderimi doğrudan tabloya değil Edge Function üzerinden yapılır (`submit-survey-response`).

Sunucu tarafında:

- Honeypot kontrolü
- Minimum doldurma süresi kontrolü
- Yayın/tarih penceresi kontrolü
- Required ve tip doğrulaması
- Basit rate-limit
- IP hash kaydı (raw IP saklanmaz)

Public kullanıcılar cevapları okuyamaz; cevaplar yalnızca admin tarafında görünür.

## 6) Hızlı Operasyon Önerisi

Yeni bir anket açma adımları:

1. `/admin/surveys/new` üzerinden anket ve soruları oluştur
2. `/admin/surveys` listesinde `Yayınla` aksiyonunu çalıştır
3. Publicte `/anket` ve `/anket/:slug` ile kontrol et
4. Cevapları `/admin/surveys/:id/responses` üzerinden takip et
5. Dönem bitince `Kapat` veya `Arşivle`

## 7) Sorun Giderme

- Anket publicte görünmüyor:
  - Status `published` mi?
  - `starts_at` gelecekte mi?
  - `ends_at` geçmişte mi?
- Submit başarısız:
  - Zorunlu soru boş olabilir
  - Çok hızlı submit edilmiş olabilir
  - Honeypot dolu gelmiş olabilir
- Admin cevap görmüyor:
  - Doğru anket ID sayfasında mı?
  - RLS/admin yetkisi aktif mi?
