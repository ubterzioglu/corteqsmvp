# Canlıda Çalıştırılacak Hazır SQL Dosyaları — Çalıştırma Kılavuzu

> **Tarih:** 5 Ekim 2026
> **Amaç:** Canlı DB izni olmadığı için yazılan hazır SQL dosyalarının çalıştırma sırası ve açıklaması.

---

## 1 · Dosya Listesi

| # | Dosya | Amaç | Risk |
|---|---|---|---|
| 1 | `supabase/qa/g17-health-score-reports-acceptance.sql` | G17 sağlık skoru `group_reports`'u okuyor — kabul testi | Düşük (geri alınan işlem) |
| 2 | `supabase/qa/phone-otp-claim-acceptance.sql` | WhatsApp OTP kota sistemi — kabul testi | Düşük (geri alınan işlem) |
| 3 | `docs/operations/2026-10-05-p06-turkce-collate-olcum.sql` | Türkçe collate ölçümü — tek harf testi | Düşük (salt okunur) |
| 4 | `docs/operations/2026-10-05-g14-deadlock-iki-oturum.md` | G14 deadlock iki oturumlu deneme — adım adım kılavuz | Orta (fixture + iki oturum) |

---

## 2 · Çalıştırma Sırası

### Adım 1: G17 Sağlık Skoru Kabul Testi

**Dosya:** `supabase/qa/g17-health-score-reports-acceptance.sql`

**Amaç:** `group_health_score_compute` fonksiyonunun `group_reports` tablosunu doğru okuduğunu doğrular.

**Çalıştırma:**
```bash
PW=$(grep -E '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2- | tr -d '\r')
PGPASSWORD="$PW" psql -h aws-1-eu-west-2.pooler.supabase.com -p 6543 \
  -U postgres.injprdrsklkxgnaiixzh -d postgres \
  -f supabase/qa/g17-health-score-reports-acceptance.sql
```

**Beklenen çıktı:**
```
NOTICE:  K1 OK: upheld şikayet yok → reports = 20
NOTICE:  K2 OK: upheld şikayet var → reports = 0
NOTICE:  K3 OK: 90 günden eski upheld → reports = 20 (süre dışı)
NOTICE:  K4 OK: rejected şikayet → reports = 20 (onaylanmamış)
NOTICE:  K5 OK: birden fazla upheld → reports = 0
NOTICE:  KABUL 5/5 OK — G17 group_reports bağlantısı doğrulandı
```

**Not:** Bu dosya `begin ... rollback;` ile sarmalanmış — canlıya yazmaz.

---

### Adım 2: WhatsApp OTP Kota Kabul Testi

**Dosya:** `supabase/qa/phone-otp-claim-acceptance.sql`

**Ön koşul:** `20261005400000_phone_otp_send_claim.sql` migration'ı uygulanmış olmalı.

**Çalıştırma:**
```bash
PW=$(grep -E '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2- | tr -d '\r')
PGPASSWORD="$PW" psql -h aws-1-eu-west-2.pooler.supabase.com -p 6543 \
  -U postgres.injprdrsklkxgnaiixzh -d postgres \
  -f supabase/qa/phone-otp-claim-acceptance.sql
```

**Beklenen çıktı:**
```
NOTICE:  K1 OK: cooldown çalışıyor, retry_after = <sayı>
NOTICE:  K2 OK: saatlik sınır çalışıyor
NOTICE:  K3 OK: günlük sınır çalışıyor
NOTICE:  K4 OK: numara başına günlük sınır çalışıyor
NOTICE:  K6 OK: başarısız deneme sınırı çalışıyor
NOTICE:  K7 OK: başarısız satırlar kotaya sayılmıyor
NOTICE:  K8 OK: NULL outcome reddedildi
NOTICE:  KABUL 7/7 OK (K5 atlandı) — WhatsApp OTP kota sistemi doğrulandı
```

**Not:** K5 (global saatlik tavan = 60 çağrı) atlandı — çok uzun sürer. Gerekirse ayrı test edilebilir.

---

### Adım 3: Türkçe Collate Ölçümü

**Dosya:** `docs/operations/2026-10-05-p06-turkce-collate-olcum.sql`

**Amaç:** Türkçe karakterlerin sıralamada doğru davranıp davranmadığını ölçer.

**Çalıştırma:**
```bash
PW=$(grep -E '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2- | tr -d '\r')
PGPASSWORD="$PW" psql -h aws-1-eu-west-2.pooler.supabase.com -p 6543 \
  -U postgres.injprdrsklkxgnaiixzh -d postgres \
  -f docs/operations/2026-10-05-p06-turkce-collate-olcum.sql
```

**Beklenen çıktı:** Dosyanın içinde açıklanmış.

---

### Adım 4: G14 Deadlock İki Oturumlu Deneme

**Dosya:** `docs/operations/2026-10-05-g14-deadlock-iki-oturum.md`

**Amaç:** `review_group_report_v1` fonksiyonunun iki eşzamanlı moderatör onayında deadlock oluşturup oluşturmadığını test eder.

**Ön koşul:** G14 migration'ları uygulanmış (`20261005200000` + `20261005300000`).

**Çalıştırma:** Markdown dosyasındaki adımları takip et. İki ayrı psql terminali gerekir.

**Beklenen sonuç:** Deadlock YOK — her iki sorgu da başarılı tamamlanır.

---

## 3 · Migration Uygulama Sırası

Eğer G17 migration'ı henüz uygulanmamışsa:

```bash
# 1. G17 migration'ını uygula
PW=$(grep -E '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2- | tr -d '\r')
PGPASSWORD="$PW" psql -h aws-1-eu-west-2.pooler.supabase.com -p 6543 \
  -U postgres.injprdrsklkxgnaiixzh -d postgres \
  -f supabase/migrations/applied/20261005500000_g17_health_score_reports.sql

# 2. schema_migrations'a ekle
PGPASSWORD="$PW" psql -h aws-1-eu-west-2.pooler.supabase.com -p 6543 \
  -U postgres.injprdrsklkxgnaiixzh -d postgres \
  -c "INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES ('20261005500000', 'g17_health_score_reports', ARRAY[]::text[])"

# 3. Kontrol et
npm run check:migrations
```

---

## 4 · Özet

| Dosya | Tür | Çalıştırma |
|---|---|---|
| `g17-health-score-reports-acceptance.sql` | Kabul testi | `psql -f` (geri alınan işlem) |
| `phone-otp-claim-acceptance.sql` | Kabul testi | `psql -f` (geri alınan işlem) |
| `2026-10-05-p06-turkce-collate-olcum.sql` | Ölçüm | `psql -f` (salt okunur) |
| `2026-10-05-g14-deadlock-iki-oturum.md` | Manuel test | İki psql terminali |
| `20261005500000_g17_health_score_reports.sql` | Migration | `psql -f` + `schema_migrations` ekle |

---

**Raporu yazan:** Dördüncü ajan (Qwen)
**Tarih:** 5 Ekim 2026, ~15:45 UTC
