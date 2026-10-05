# Deploy Kontrol Listesi — 6 Ekim 2026

> Bu liste kullanıcı için hazırlanmıştır. Ajan çalıştırmaz.

## 1 · Frontend Deploy

```bash
npm run build
# dist/ klasörünü deploy et (Coolify/Vercel/Netlify)
```

**Kontrol:**
```bash
curl -I https://corteqs.net
# 200 OK + güvenlik başlıkları (CSP, X-Frame-Options, vb.)
```

## 2 · Edge Function Deploy

```bash
supabase functions deploy member-cv-link
supabase functions deploy send-phone-otp-hook
supabase functions deploy whatsapp-autoreply
supabase functions deploy find-matches
supabase functions deploy delete-account
supabase functions deploy send-notification-emails
supabase functions deploy group-claim-verify
supabase functions deploy group-link-health
```

**Kontrol:**
```bash
supabase functions list
# Tüm fonksiyonlar listede mi?
```

## 3 · Migration Uygulama

**⚠️ ÖNCE CANLI ŞEMAYI ÖLÇ:**
```sql
-- psql ile bağlan
\d public.afs_attributes
\d public.role_attributes
\d public.catalog_items
```

**Sırayla uygula:**
```bash
psql -f supabase/migrations/applied/20261006000000_sg2_revoke_internal_rpc.sql
psql -f supabase/migrations/applied/20261006010000_sg3_catalog_items_column_guard.sql
psql -f supabase/migrations/applied/20261006020000_sg4_whatsapp_landings_guard.sql
psql -f supabase/migrations/applied/20261006030000_sg6_close_open_rls_policies.sql
psql -f supabase/migrations/applied/20261006040000_sg9_atomic_rate_limit.sql
psql -f supabase/migrations/applied/20261006050000_a5_cv_share_with_premium.sql
psql -f supabase/migrations/applied/20261006060000_b7_cadde_search.sql
psql -f supabase/migrations/applied/20261006070000_b6_group_report_notification.sql
psql -f supabase/migrations/applied/20261006080000_b8_events_manual_approval.sql
psql -f supabase/migrations/applied/20261006090000_b8_weekly_city_digest_toggle.sql
```

**Her migration'dan sonra:**
```sql
insert into supabase_migrations.schema_migrations (version)
values ('20261006000000')
on conflict do nothing;
-- ... her migration için
```

## 4 · Deploy Sonrası Kontrol

### SEO/GEO
```bash
curl -I https://corteqs.net/ai/summary.json
# 200 OK + Content-Type: application/json

curl -I https://corteqs.net/.well-known/ai.txt
# 200 OK

curl -I https://corteqs.net/blog
# 301 → /radar/rehberler
```

### Güvenlik
```bash
curl -I https://corteqs.net
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Content-Security-Policy: ...
```

### Konsol Testi
Tarayıcı konsolunu aç, CSP ihlali var mı kontrol et.

## 5 · Manuel Test Listesi

| Test | Beklenen Sonuç | Migration |
|---|---|---|
| Admin paneli → Bildirim ayarları | Haftalık şehir özeti toggle görünüyor | B8 (090000) |
| Cadde → "Kimler beğendi?" | Popover açılıyor, banlı kullanıcı yok | B11 (150000) |
| /ilanlar → Free kullanıcı 6. ilan | Hata: "Kota doldu" | A7 (700000) |
| Profil → CV paylaşım | "CV'mi Premium üyeler görebilsin" switch var | A5 (050000) |
| Profil → Ruhsat yükleme | Kart görünüyor, PDF/JPG/PNG yüklenebiliyor | A12 (800000) |
| Etkinlik oluştur | İlk etkinlik "onay bekliyor", sonrakiler otomatik yayında | B8 (080000) |
| Grup şikayet → Onay | Grup sahibine bildirim gidiyor | B6 (070000) |

## 6 · Geri Alma Planı

Her migration için geri alma SQL'i `supabase/migrations/_removed/` klasöründe saklanır.

**Acil geri alma:**
```sql
-- En son uygulanan migration'ı geri al
begin;
-- ... migration'ın tersi işlemler
commit;
```

---

**Son güncelleme:** 6 Ekim 2026, 00:30
