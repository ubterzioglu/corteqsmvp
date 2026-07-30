# Profilde Referral Kodu Doğrulama + Admin Kullanım Görünürlüğü

> **Durum: PLAN — henüz uygulanmadı (2026-07-29).** Kod yok, migration yok, commit yok.
> Karar alınmış tasarım aşağıda; uygulama sonraki oturuma bırakıldı.
> Ajan planı: `~/.claude/plans/o-zaman-yle-bir-abstract-hummingbird.md`

## Context

Platformda referral kodu bugün **yalnızca ön kayıt formlarında** gerçekten çalışıyor
(`RegisterInterestForm`, `BackerForm`): TS tarafında
[validateReferralCodeBeforeSubmit](../../src/lib/submissions.ts) → `validate_and_bind_referral_code` RPC,
DB tarafında `submissions` trigger'ları `referral_code_id` bağlıyor, `usage_count` artırıyor ve
`referral_code_usages`'a satır yazıyor.

Profil tarafında alan var ama işlevsiz — canlı DB'den doğrulanmış iki regresyon:

1. **Profil alanı doğrulanmıyor, dahası kaydedilemiyor.** AFS rebuild'i
   (`20260609100900_rebuild_010c_backend_rewire.sql`) `update_profile_attribute` fonksiyonunu yeniden
   yazarken `20260604190000_add_profile_onboarding_foundation.sql` içindeki referral mantığını kaybetti:
   `upper()` yok, "referral alanları her zaman private" istisnası yok,
   `validate_profile_onboarding_referral_source` çağrısı yok — canlı fonksiyon kaynağında `referral_code`
   hiç geçmiyor. Sonuç: `referral_code` için `user_can_hide = false` + gönderilen görünürlük `private`
   olduğu için fonksiyon `attribute visibility cannot be changed` (42501) fırlatıyor. Üye
   "Rolüne Özel Alanları Kaydet" dediğinde döngü ilk hatada kopuyor, sıradaki alanlar da kaydedilmiyor
   (`src/pages/ProfilePage.tsx` — `handleSaveRoleSpecificAttributes`).
2. **Admin panelinde "Kullanımlar" listesi boş.** `referral_code_usages` üzerinde RLS açık ama
   **0 politika** var ve `authenticated` rolüne **hiç grant yok** (eski politika düşürülmüş
   `public.admin_users` tablosuna bakıyordu; `20260615120000_referral_admin_rls_policies.sql` diğer 4
   referral tablosunu onardı, bu tabloyu atladı). PostgREST 403 dönüyor,
   `src/pages/admin/AdminReferralPage.tsx` hatayı sessizce yutuyor.

Canlı durum (2026-07-29): 36 profilde referral kodu değeri var (35'i gerçek bir koda karşılık geliyor,
1'i serbest metin), `referral_code_usages`'ta 41 kayıt / 11 farklı kod — tamamı ön kayıt trigger'ından,
profilden gelen tek kayıt yok. `referral_codes` toplam `usage_count` = 41, yani sayaç ile satır sayısı tutarlı.

**Hedef:** profilde girilen kod ön kayıttakiyle aynı sıkılıkta doğrulansın, kullanım kaydı tutulsun ve
admin `/admin/referral` ekranında "kim hangi kodu kullandı" listesi (ön kayıt + profil, tek listede)
yeniden görünür olsun.

**Onaylanan kararlar:** mevcut `referral_code_usages` tablosu genişletilecek · geçersiz kod kaydı
reddedilecek · eşleşen 35 geçmiş kayıt backfill edilecek · kod bir kez doğrulandıktan sonra kullanıcı
için kilitlenecek.

---

## 1. Migration — `referral_code_usages` şema + RLS/grant onarımı

**Yeni dosya:** `supabase/migrations/20260729120000_referral_usage_profile_support.sql`

Şema (mevcut 41 satır bozulmadan geçer):

```
submission_id          → DROP NOT NULL
user_id      uuid NULL → REFERENCES auth.users(id) ON DELETE CASCADE   (YENİ)
source       text      → NOT NULL DEFAULT 'submission' CHECK (source IN ('submission','profile'))
```

- `referral_code_usages_submission_id_key` UNIQUE constraint'i kaldır, yerine
  `UNIQUE INDEX ... (submission_id) WHERE submission_id IS NOT NULL` koy (mevcut trigger'ın
  `ON CONFLICT (submission_id)` davranışı korunur —
  `supabase/migrations/applied/20260422170000_referral_groups_and_validation.sql`).
- `UNIQUE INDEX ... (user_id) WHERE user_id IS NOT NULL` → "bir kullanıcı = tek referral kodu"
  (kilit kararının DB garantisi).
- CHECK: `(submission_id IS NOT NULL AND user_id IS NULL AND source='submission')
  OR (submission_id IS NULL AND user_id IS NOT NULL AND source='profile')`.

RLS/grant onarımı — `20260615120000_referral_admin_rls_policies.sql` desenini birebir izle
(`public.is_admin(auth.uid())`):

- `GRANT SELECT ON public.referral_code_usages TO authenticated;`
- Ölü politikayı düşür: `DROP POLICY IF EXISTS "Admin users can read referral code usages"`.
- `referral_code_usages_admin_select` → `USING (public.is_admin(auth.uid()))`.
- `referral_code_usages_self_select` → `USING (user_id = auth.uid())` (profilin kilit durumunu okuması için).
- INSERT/UPDATE politikası **yok** — yazma yalnızca SECURITY DEFINER fonksiyonlardan (mevcut desen).

Dosya başına `20260615120000`'daki gibi Purpose / Risk / Rollback yorum bloğu yaz.

## 2. Migration — `update_profile_attribute` içine doğrulama + kullanım kaydı

**Yeni dosya:** `supabase/migrations/20260729121000_update_profile_attribute_referral_validation.sql`

Canlı fonksiyonu (`CREATE OR REPLACE`, imza aynı: `attribute_key text, attribute_value jsonb,
visibility text`) kaybedilen mantığı geri getirerek + yeni kullanım kaydıyla yeniden tanımla.
Gövdeyi canlı `pg_get_functiondef` dökümünden al (elle kopyalama drift üretir), şu blokları ekle:

1. **Görünürlük istisnası (42501 blocker'ının çözümü):** `IF v_attribute.key IN
   ('referral_code','referral_source') THEN v_visibility := 'private';` ve `user_can_hide` kontrolünü
   bu iki key için atla — `20260604190000` satır 341-351'deki davranışın aynısı.
2. **`referral_source`:** mevcut `public.validate_profile_onboarding_referral_source(v_value_text)`
   fonksiyonunu çağır (canlıda var, kullanılmıyor — yeniden bağlanacak).
3. **`referral_code`:** `upper(btrim(...))`, boş → `NULL`; sonra:
   - `referral_code_usages`'ta `user_id = v_user_id` satırı **varsa**: gelen değer o kodun aynısıysa
     no-op (çift sayım yok), farklıysa `P0001` + `DETAIL='locked'` ile reddet.
   - Satır **yoksa** ve değer doluysa: `public.validate_and_bind_referral_code(v_value_text, now())`
     çağır; `status <> 'valid'` ise `P0001` + `DETAIL = status` ile reddet (kayıt yapılmaz).
   - Geçerliyse `normalized_code`'u yaz, ardından `referral_code_usages`'a
     `(referral_code_id, user_id, source='profile', used_at=now(), full_name, email)` INSERT et ve
     `referral_codes`'ta `usage_count = usage_count + 1, is_used = true, used_at = GREATEST(...)`
     güncelle — `submissions_log_referral_usage` ile aynı sayaç semantiği.
   - `full_name`: `user_profile_attributes` + `afs_attributes(key='full_name')`; `email`: `auth.users`
     (fonksiyon SECURITY DEFINER olduğu için erişebilir).

Hata `DETAIL` alanı statüyü taşısın (`not_found` / `inactive` / `expired` / `out_of_window` / `locked`)
— TS tarafındaki Türkçe mesaj eşlemesi buna dayanacak.

## 3. Migration — geçmiş verinin backfill'i

**Yeni dosya:** `supabase/migrations/20260729122000_referral_usage_backfill_from_profiles.sql`

- `user_profile_attributes` (`referral_code`) × `referral_codes` (UPPER eşleşme) join'inden 35 satırı
  `source='profile'` olarak INSERT et (`ON CONFLICT DO NOTHING`), `used_at = coalesce(upa.updated_at, now())`.
- `usage_count` / `is_used` / `used_at` alanlarını `referral_code_usages`'tan **yeniden hesapla**
  (çift sayım riskini ortadan kaldırır). Ön koşul migration içinde assert edilsin: recompute öncesi
  `sum(usage_count) = count(*)` (bugün 41 = 41), eşit değilse `RAISE EXCEPTION` ile dur.
- Eşleşmeyen 1 serbest metin kaydını **silme** — migration sonunda `RAISE NOTICE` ile raporla.

## 4. TS/API katmanı

**`src/lib/member-profile-api.ts` — `updateProfileAttribute`:** `attributeKey === "referral_code"` ise
RPC'den önce mevcut `validateReferralCodeBeforeSubmit`'i çağır (yeni doğrulama kodu yazmadan aynı
doğrulama + `getReferralValidationMessage` üzerinden hazır Türkçe mesajlar). `full_name`'deki mevcut
özel-durum bloğunun yanına, aynı desende. SQL katmanı yine nihai otorite (defense in depth — ön kayıt
akışının aynısı).

**Yeni:** aynı dosyada `getMyReferralCodeUsage()` — `referral_code_usages`'tan kendi satırını okur
(`self_select` politikası sayesinde filtre gerekmez), `{ code, usedAt }` döner. Kilit durumunun kaynağı bu.

**`src/lib/submissions.ts`:** `getReferralValidationMessage`'a `locked` statüsü için Türkçe mesaj ekle
("Referral kodun zaten doğrulandı; değiştirmek için yöneticiyle iletişime geç.") ve RPC hatasının
`details` alanından statü çözen küçük bir yardımcı ekle (SQL backstop hatalarını Türkçeleştirmek için).

## 5. Profil UI

**`src/pages/ProfilePage.tsx`:**

- `ProfileAttributeEditor` içinde `referral_code` için özel dal (mevcut `REFERRAL_SOURCE_ATTRIBUTE_KEY`
  dalının yanına): kilitliyse `readOnly` + "✓ Doğrulandı · &lt;tarih&gt;" ibaresi; değilse "Sizi yönlendiren
  admin/davet kodunu gir — kaydederken doğrulanır." yardım metni.
- Kilit verisini `getMyReferralCodeUsage()` ile çek (React Query, mevcut profil hook'larının yanında) ve
  `PRIVATE_ONLY_ONBOARDING_ATTRIBUTE_KEYS` mantığıyla birlikte editöre geçir.
- `handleSaveRoleSpecificAttributes` döngüsünü hata-toleranslı yap: her alanın hatasını topla, kalanları
  kaydetmeye devam et, sonunda tek özet toast göster (bugünkü "ilk hata tüm kaydı çökertiyor"
  davranışının düzeltmesi).

## 6. Admin panel — kullanım listesi

**`src/pages/admin/AdminReferralPage.tsx`:**

- `ReferralUsageRow` tipine `source` ve `user_id` ekle, select'i güncelle.
- Hata yutmayı bitir: `if (error)` → `toast(...)` (sessiz boş liste bir daha görünmesin).
- Bugünkü virgüllü tek satır yerine küçük bir liste/tablo: **Ad · E-posta · Kaynak rozeti
  (Ön kayıt / Profil) · Tarih**, başlıkta "Kullanımlar (N)".
- Accordion'daki `Usage Count` / `Son Kullanım` alanları olduğu gibi kalsın (artık profil kullanımlarını
  da içerecek).

## 7. Tipler ve testler

- **`src/integrations/supabase/types.ts`:** `referral_code_usages` tipine `user_id` + `source` ekle.
  Tercihen regen (Management API + geçerli `SUPABASE_ACCESS_TOKEN`); mümkün değilse yalnız bu tabloyu elle güncelle.
- **`src/lib/member-profile-api.test.ts`** (mevcut, `rpc` mock deseni var): ① geçerli kodda
  `validate_and_bind_referral_code` sonra `update_profile_attribute` çağrılıyor ② geçersiz kodda
  `update_profile_attribute` **çağrılmıyor** ve Türkçe mesaj fırlıyor ③ kilitli durumda değişiklik reddediliyor.
- **`src/lib/submissions.test.ts`** desenini izleyerek `locked` mesaj eşlemesi için birim test.

## Uygulama sırası

1. Migration 1 (şema + RLS/grant) → 2 (fonksiyon) → 3 (backfill), her biri `--single-transaction` ile.
2. TS/API + UI + admin panel değişiklikleri.
3. Tipler + testler.

Migration'lar `supabase/migrations/` **üst dizinine** yazılır (uygulanmışlar `applied/` altında;
`supabase db push` bu repoda çalışmaz). Uygulama:

```bash
PGPASSWORD="$SUPABASE_DB_PASSWORD" PGCLIENTENCODING=UTF8 psql \
  "host=aws-1-eu-west-2.pooler.supabase.com port=5432 dbname=postgres user=postgres.injprdrsklkxgnaiixzh sslmode=require" \
  -v ON_ERROR_STOP=1 --single-transaction -f supabase/migrations/<dosya>.sql
# ardından: insert into supabase_migrations.schema_migrations (version, name) values (...) on conflict do nothing;
```

## Doğrulama

**Statik:** `npm run lint` · `npm run test` · `npx tsc --noEmit` (types.ts güncellendikten sonra).

**DB (read-only psql):**
- `pg_policy`'de `referral_code_usages` için 2 politika, `information_schema.role_table_grants`'ta
  `authenticated → SELECT`.
- Backfill sonrası: `source='profile'` satır sayısı = 35;
  `sum(referral_codes.usage_count) = count(*) from referral_code_usages`.
- `user_id` partial unique index mevcut.

**Uçtan uca (manuel):**
1. Üye olarak `/profile/bireysel` → "Rolüne Özel Alanlar" → geçerli bir kod gir → kaydet → başarı toast'ı;
   `referral_code_usages`'ta `source='profile'` satırı ve `referral_codes.usage_count` +1.
2. Aynı alanı farklı bir kodla değiştirmeyi dene → kilit mesajı, kayıt değişmiyor.
3. Geçersiz/süresi geçmiş/pasif kod gir → Türkçe hata, alan kaydedilmiyor, sayaç artmıyor.
4. Aynı profilde başka bir rol-özel alanı kaydet → referral hatası olmadan geçiyor (döngü regresyonu düzeldi).
5. Admin olarak `/admin/referral` → kodu aç → "Kullanımlar" listesinde ön kayıt satırları **ve** yeni profil
   satırı doğru rozetle görünüyor.
6. Admin olmayan bir üye ile `referral_code_usages` select → yalnız kendi satırı (403 değil, 0/1 satır).

## Kapsam dışı (bilinçli)

- `/login?ref=KOD` ve `?referral_code=` link akışı ölü (`/form` rotası `/login`'e redirect) — bu plan
  kapsamında değil.
- Üye-üye referral (`AmbassadorReferralCard` hiçbir yere mount edilmemiş, `apply_referral_discount`
  canlıda no-op legacy trigger) — ayrı ürün kararı.
- `/businesses`, `/consultants`, `/bloggers`, `/kariyer` sayfalarındaki `InterestForm` referral alanı
  dekoratif (input'un `name`'i/state'i yok, hiçbir çağıran `referralCode` prop'unu geçmiyor) — ayrı düzeltme.
