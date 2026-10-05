# G14 Deadlock İki Oturumlu Deneme — Adım Adım Kılavuz

> **Amaç:** `review_group_report_v1` fonksiyonunun iki eşzamanlı moderatör onayında
> deadlock oluşturup oluşturmadığını test etmek.
> **Tarih:** 5 Ekim 2026
> **Ön koşul:** G14 migration'ları uygulanmış (`20261005200000` + `20261005300000`)

---

## 1 · Fixture Oluşturma

İlk psql oturumunda çalıştır:

```sql
begin;

-- Test grubu (published)
insert into public.whatsapp_landings (
  id, slug, group_name, listing_status, ownership, published_at,
  short_description, category, city_id, rules, link_fail_count
) values (
  'd0000000-0000-0000-0000-000000000001',
  'deadlock-test-group',
  'Deadlock Test Grubu',
  'published',
  'verified',
  now() - interval '30 days',
  'Test açıklaması',
  'sehir_yasam',
  null,
  'Test kuralları',
  0
) on conflict (id) do nothing;

-- İki test kullanıcısı (şikayetçiler, telefon doğrulanmış)
insert into auth.users (id, email, phone, phone_confirmed_at, created_at)
values
  ('e0000000-0000-0000-0000-000000000001', 'deadlock-tester1@example.com', '+491701234567', now(), now() - interval '100 days'),
  ('e0000000-0000-0000-0000-000000000002', 'deadlock-tester2@example.com', '+491701234568', now(), now() - interval '100 days')
on conflict (id) do nothing;

-- İki admin (moderatörler)
insert into auth.users (id, email, phone, phone_confirmed_at, created_at)
values
  ('f0000000-0000-0000-0000-000000000001', 'deadlock-admin1@example.com', '+491701234569', now(), now() - interval '200 days'),
  ('f0000000-0000-0000-0000-000000000002', 'deadlock-admin2@example.com', '+491701234570', now(), now() - interval '200 days')
on conflict (id) do nothing;

-- Admin rolleri
insert into public.user_roles (user_id, role_key)
values
  ('f0000000-0000-0000-0000-000000000001', 'Admin_SuperAdmin'),
  ('f0000000-0000-0000-0000-000000000002', 'Admin_SuperAdmin')
on conflict do nothing;

-- İki şikayet (farklı kullanıcılar, aynı grup)
insert into public.group_reports (id, landing_id, reporter_id, reason, note, status)
values
  ('g0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'link_broken', 'Link çalışmıyor', 'open'),
  ('g0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'visa_slot_sale', 'Vize satışı', 'open')
on conflict (id) do nothing;

commit;
```

**Beklenen:** 4 satır eklendi (1 grup, 2 kullanıcı, 2 admin, 2 şikayet).

---

## 2 · İki Oturumlu Eşzamanlı Onay

### Oturum 1 (psql terminal 1):

```sql
-- Admin 1 olarak giriş yap
set local role authenticated;
set request.jwt.claim.sub to 'f0000000-0000-0000-0000-000000000001';
set request.jwt.claim.role to 'authenticated';

-- İlk şikayeti onayla (AMA commit YAPMA)
begin;
select public.review_group_report_v1(
  'g0000000-0000-0000-0000-000000000001',
  'upheld',
  'Admin 1 onayı'
);
-- Bekle, commit yapma!
```

### Oturum 2 (psql terminal 2, ilk oturum BEKLERKEN):

```sql
-- Admin 2 olarak giriş yap
set local role authenticated;
set request.jwt.claim.sub to 'f0000000-0000-0000-0000-000000000002';
set request.jwt.claim.role to 'authenticated';

-- İkinci şikayeti onayla (bu bloklanmalı)
begin;
select public.review_group_report_v1(
  'g0000000-0000-0000-0000-000000000002',
  'upheld',
  'Admin 2 onayı'
);
-- Bu sorgu BLOKLANMALI (ilk oturum commit yapana kadar)
```

**Beklenen:**
- Oturum 2'nin sorgusu **bloklanır** (whatsapp_landings satırı kilitli)
- Oturum 1 `commit;` yapınca oturum 2 devam eder
- **DEADLOCK YOK** — her iki sorgu da başarılı tamamlanır

---

## 3 · Doğrulama

Oturum 1'de:

```sql
commit;

-- Her iki şikayet de upheld olmalı
select id, status, reviewed_by, review_note
from public.group_reports
where landing_id = 'd0000000-0000-0000-0000-000000000001';
```

**Beklenen:**
```
                  id                  | status |           reviewed_by            |  review_note  
--------------------------------------+--------+----------------------------------+---------------
 g0000000-0000-0000-0000-000000000001 | upheld | f0000000-0000-0000-0000-000000000001 | Admin 1 onayı
 g0000000-0000-0000-0000-000000000002 | upheld | f0000000-0000-0000-0000-000000000002 | Admin 2 onayı
```

---

## 4 · Temizlik

```sql
delete from public.group_reports where landing_id = 'd0000000-0000-0000-0000-000000000001';
delete from public.whatsapp_landings where id = 'd0000000-0000-0000-0000-000000000001';
delete from auth.users where id in (
  'e0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  'f0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000002'
);
```

---

## 5 · Olası Sonuçlar

| Sonuç | Anlamı |
|---|---|
| Her iki sorgu da başarılı, deadlock yok | ✅ Düzeltme çalışıyor (20261005300000) |
| Deadlock hatası | ❌ Düzeltme çalışmıyor, migration'ı kontrol et |
| Oturum 2 timeout | ⚠️ Kilit bekleniyor ama deadlock yok — normal |

---

**Not:** Bu test canlıda yapılmalı. Yerel Supabase'te `is_admin()` fonksiyonu farklı çalışabilir.
