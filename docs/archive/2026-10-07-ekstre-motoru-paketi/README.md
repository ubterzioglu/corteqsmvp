# CorteQS Ekstre Motoru  ·  v2

> **Barış: önce `BARIS_ICIN_NOTLAR.md`'yi oku** — netleşen kurallar, denenmeyen kısımlar, kontrol listesi.

Kart ekstresi (PDF) → gözden geçirme → CorteQS muhasebesi (`admin/muhasebe/giderler`), **her kayıt USD**.
Mercury sanal kart gelince aynı motor Mercury API'den de besleniyor.

**Akış:** Burak ekstre PDF'ini admin'e yükler. **Claude** satırları okur, motor teknoloji giderlerini ayıklar,
USD'ye çevirir, gider ortağı katkısını düşer, mükerrerleri eler ve **girişe hazır** hâle getirir.
Burak ekranda gözden geçirir, düzeltir, onaylar → kayıtlar CorteQS muhasebesine **otomatik** girer.
Onaysız hiçbir ekstre satırı muhasebeye girmez.

---

## Muhasebe kuralları

| Konu | Kural |
|---|---|
| Para birimi | `expenses.amount` **her zaman USD**, `currency = 'USD'`. Ekstredeki asıl tutar `amount_original` / `currency_original`, TL karşılığı `amount_try` kolonunda saklanır. |
| TL → USD | TCMB USD/TRY döviz satış kuru |
| EUR → USD | TCMB **EUR/USD çapraz kuru** (XML'deki `CrossRateOther`; yoksa EUR/TRY ÷ USD/TRY). GBP aynı şekilde, QAR sabit 3,64. |
| Kur tarihi | Varsayılan **işlem günü** kuru. Admin'deki seçiciyle **"bugünkü güncel kur"** yapılabilir (`accounting_settings.fx_rate_date = 'upload'`). |
| Gider ortağı | Satırda "Gider ortağı katkısı" kolonu var: ortak adı + katkı $. **CorteQS'e giren gider = brüt $ − katkı $.** Brüt tutar `amount_usd`, katkı `partner_share_usd`, ortak `partner_name` kolonunda saklanır, notta da yazar. |
| Gider ortağını kapatma | Admin'de **"Gider ortağı kolonu"** anahtarı. Kapatınca kolon gizlenir, katkı düşülmez, gider brüt $ olarak girer. Veriler silinmez; tekrar açılabilir. |
| Okuyucu | **Claude** (`claude-sonnet-5`). Zor/taranmış ekstrelerde `ANTHROPIC_MODEL=claude-opus-5-5`. Gemini isteğe bağlı yedek olarak duruyor. |
| Mercury | Varsayılan: Mercury işlemleri de **önce incelemeye** düşer. İleride `mercury_auto_commit = true` yapılırsa bilinen abonelikler incelemesiz girer. |

---

## Nasıl çalışıyor

```
 PDF / CSV / JSON ──► statement-parse (edge fn) ──┐
                       Claude PDF'i okur          │
 Mercury API ────────► mercury-sync (edge fn) ────┤
                                                  ▼
                 ┌────────────── MOTOR (_shared/engine) ──────────────┐
                 │ 1 normalize    "PADDLE.NET* HIGGSFIELD LONDON GB" → HIGGSFIELD │
                 │ 2 kural        merchant_rules → tüccar, kategori, kim, teknoloji mi │
                 │ 3 kart         payment_cards → ödeme yöntemi, sanal kart mı │
                 │ 4 USD          TL: USD/TRY · EUR: çapraz kur · (işlem günü / güncel) │
                 │ 5 gider ortağı brüt $ − katkı $ = CorteQS gideri │
                 │ 6 tekilleştir  parmak izi + admin'de elle girilenlerle ±3 gün │
                 │ 7 öneri        hazır / incele / atla │
                 └────────────────────────┬───────────────────────────┘
                                          ▼
                  statement_lines  ─►  "Ekstre Aktar" ekranında GÖZDEN GEÇİRME
                                          │  "Gözden geçirdim, CorteQS muhasebesine gir"
                                          ▼
                  commit_statement_lines()  ──►  expenses (USD)
```

Öneri kuralları (ekranda hepsi değiştirilebilir):

| Durum | Öneri |
|---|---|
| Kural eşleşti, teknoloji, mükerrer değil | **Hazır** (seçili gelir) |
| İade / olası mükerrer / kur yok / düşük güven (Apple, Amazon) | **İncele** |
| Kural yok ama Claude ya da anahtar kelime "teknoloji olabilir" diyor | **İncele** + "Kural yap" |
| Kural yok, teknoloji değil (market, restoran) · kart borcu ödemesi | **Atla** |
| Aynı satır daha önce girilmiş | **Atla** (mükerrer) |

---

## Doğrulama (bu paketle çalıştırıldı)

```bash
npm test                                   # 13/13 geçti
npm run demo                               # out/demo_rapor.md
deno check --node-modules-dir=none supabase/functions/*/index.ts   # tip kontrolü temiz
```

- **Drive tablosunun 102 satırı:** motorun net $ toplamı **$2.709,07**; Drive satırlarının toplamı **$2.709,05** (tablodaki toplam hücresi $2.709,06). Satır başına fark en fazla 2 cent (EUR satırları artık bankanın TL'si yerine çapraz kurla hesaplanıyor). Admin'e elle girilmiş 9 kayıt "olası mükerrer" olarak yakalandı.
- **Örnek QNB ekstresi (16 satır):** kart ödemesi ve market atlandı, daha önce girilmiş 7 satır mükerrer sayıldı, bilinmeyen "XYZ DIGITAL" incelemeye düştü. Aynı ekstre ikinci kez yüklenince **0 yeni kayıt**.
- **Veritabanı (Postgres 16):** migration iki kez üst üste çalıştı. Onaylanan 5 satır USD olarak girdi. OpenAI $200 satırına "Baran $100" yazılınca muhasebeye **$100** girdi, not: *"Gider ortağı Baran: $100.00 (brüt $200.00)"*. Gider ortağı kapatılınca aynı satır **$200** girdi. Admin olmayan çağrı reddedildi, geri alma çalıştı.
- **Henüz denenmedi:** gerçek bir PDF'in Claude API ile okunması (sandbox'ta anahtar yok) ve canlı TCMB çağrısı. Kurulumdan sonra ilk gerçek ekstreyle kontrol edilmeli (5. adım).

---

## Kurulum (Barış)

### 1. Dosyaları projeye kopyala

```
supabase/migrations/20260927120000_statement_import_engine.sql
supabase/seed/merchant_rules_seed.sql
supabase/functions/_shared/engine/*        ← saf TS motor (Deno + Node)
supabase/functions/_shared/context.ts
supabase/functions/statement-parse/index.ts
supabase/functions/mercury-sync/index.ts
src/pages/admin/muhasebe/EkstreAktar.tsx
```

### 2. Veritabanı

```bash
supabase db push
psql "$DB_URL" -f supabase/seed/merchant_rules_seed.sql
```

Kontrol et:
- `public.is_admin()` parametresiz mi? Değilse migration'daki RLS politikalarını ve iki fonksiyonu `expenses` tablosundaki mevcut politika ifadesine göre değiştir.
- `expenses.amount` üzerinde `>= 0` kısıtı varsa iadeler (negatif) için gevşet.
- `expenses.category / person / payment_method / currency` enum ise insert'teki değerleri cast et.
- Mevcut `expenses` kayıtlarına dokunulmuyor; eski TL/EUR/QAR kayıtlar olduğu gibi kalır. Toplamları USD'de birleştirmek istersen eski kayıtlar için `amount_usd` ayrıca doldurulabilir (bu pakette yok).

### 3. Edge function sırları

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...     # PDF okuyucu (varsayılan)
# isteğe bağlı: ANTHROPIC_MODEL=claude-opus-5-5  |  yedek: EXTRACT_PROVIDER=gemini GEMINI_API_KEY=...
supabase secrets set CRON_SECRET=$(openssl rand -hex 24)
# Mercury gelince:
supabase secrets set MERCURY_API_TOKEN=...            # Mercury > Settings > API tokens (read-only)
```

`supabase/config.toml`:

```toml
[functions.mercury-sync]
verify_jwt = false      # cron x-cron-secret ile gelir; fonksiyon içinde admin/secret kontrolü var
```

```bash
supabase functions deploy statement-parse mercury-sync
```

### 4. Admin menüsü

- Route: `/admin/muhasebe/ekstre` → `EkstreAktar`; Muhasebe sekmelerine **"Ekstre Aktar"** ekle.
- Giderler sayfasındaki `CATEGORY_LABELS` / `PERSON_LABELS` sabitlerini ortak kullan.
- Uygulama kökünde `TooltipProvider` olmalı (shadcn varsayılanı).
- Giderler listesinde USD tutarın yanında küçük gri `amount_original currency_original` ve gider ortağı varsa "Baran −$100" rozeti göstermek faydalı olur.

### 5. İlk gerçek test

1. Son QNB sanal kart ekstresini yükle → satır sayısı ve toplamı PDF'le karşılaştır (tutmazsa sayfada uyarı çıkar).
2. "İncele" sekmesini düzelt, gerekirse "Kural yap"; gider ortağı olan satırlara ortak adı + $ yaz.
3. "Gözden geçirdim, CorteQS muhasebesine gir" → Giderler'de USD tutarları kontrol et. Yanlışsa **Geri al**.
4. İş Bankası Maximiles ekstresinde görünen son 4 haneyi `payment_cards` tablosuna ekle (şimdilik `MAXI` etiketiyle eşleşiyor).

### 6. Geçmişi aktarma (isteğe bağlı)

Drive "TEKNOLOJİ HARCAMALARI" → Dosya → İndir → CSV → aynı ekrana yükle. Drive'daki "İştirak" kolonu gider ortağı katkısı olarak okunur (notta "Baran" geçiyorsa ortak adı da dolar). Admin'de zaten olan kayıtlar "olası mükerrer" çıkar; onları seçme.

### 7. Mercury (kart gelince)

1. `MERCURY_API_TOKEN` ekle → **Mercury'yi senkronla** (son 60 gün). İşlemler incelemeye düşer.
2. Mercury kartının son 4 hanesini `payment_cards`'a ekle, ör.
   `insert into payment_cards values ('4421','Mercury Sanal (…4421)','Mercury','sanal_kart_burak','burak',true,'ortak');`
3. `supabase/optional/mercury_cron.sql` ile saatlik senkronu aç.
4. Güven oluşunca `update accounting_settings set mercury_auto_commit = true;` → bilinen abonelikler incelemesiz girer.
5. Clemta kendi Mercury bağlantısıyla ön muhasebeye devam eder; bizim defterimiz ayrı tutulur, `external_id` ile karşılaştırılabilir.

---

## Sık kullanılan işler

| İş | Nasıl |
|---|---|
| Yeni tüccar tanıt | İnceleme ekranında "Kural yap" |
| Gider ortağı katkısı | Satırda ortak adı + $; sabit oranlı ortaklık için kurala `share_pct` (ör. 50) |
| Gider ortağı uygulamasını bitir | Admin'de "Gider ortağı kolonu" anahtarını kapat |
| Kur tarihini değiştir | Admin'de "Kur: işlem günü / bugünkü güncel kur" |
| Yanlış yüklenen ekstre | **Geri al** |
| Kuralları/ayarları sonradan değiştirdim | **Kuralları yeniden uygula** (PDF tekrar okunmaz, elle düzenlenen satırlar korunur) |
| PDF'i yeniden okut | `statement-parse` gövdesine `{ import_id, re_extract: true }` |
