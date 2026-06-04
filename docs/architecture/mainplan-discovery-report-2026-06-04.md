# Mainplan Discovery Report

Tarih: 2026-06-04

## Kanonik eşleştirme

- `mainplan.md` içindeki `user_profiles_v2` beklentisi repo gerçekliğinde fiilen `public.user_profiles` olarak çalışıyor.
- `mainplan.md` içindeki `rolesgo_*` beklentisi repo gerçekliğinde fiilen `public.roles`, `public.feature_catalog`, `public.role_feature_flags`, `public.role_feature_defaults`, `public.user_feature_overrides`, `public.role_attribute_rules`, `public.user_profile_attributes` yapılarıyla çalışıyor.
- Profil okuma/yazma için mevcut kanonik write path:
  - auth kimliği: `auth.users.id`
  - temel profil: `public.user_profiles`
  - role/feature çözümü: `roles` + `role_feature_flags` + `role_feature_defaults` + `user_feature_overrides`
  - attribute write path: `public.update_profile_attribute(...)`
  - self profile read path: `public.get_current_user_profile()`

## Auth ve client kararı

- Uygulamada iki Supabase client kaynağı var:
  - `src/integrations/supabase/client.ts`: session persistence açık, fiilen auth akışında kullanılan client
  - `src/lib/supabase.ts`: runtime config re-export, session persistence kapalı
- Bu iş kapsamında tam client consolidation yapılmayacak.
- Onboarding ve auth yüzeyinde standart client olarak `src/integrations/supabase/client.ts` kullanılacak.

## Onboarding ile ilgili mevcut durum

- `/welcome/activate` route/page henüz yok.
- `profile_onboarding_imports` tablosu henüz yok.
- `/form` sayfası bugün doğrudan `signUp + submissions insert` akışıyla çalışıyor.
- `public.submissions` tablosunda bugün `user_id` veya idempotent onboarding anahtarı yok.
- `public.submissions` insert policy bugün authenticated kullanıcıya client-supplied `user_id` kısıtı koymuyor; bu, auth-linked kayıt için sıkılaştırılmalı.

## Reuse edilecek mevcut mekanizmalar

- Self profile payload: `public.get_current_user_profile()`
- Attribute write path: `public.update_profile_attribute(...)`
- Admin attribute write path: `public.admin_update_user_profile_attribute(...)`
- Auth -> profile sync trigger: `public.upsert_profile_from_auth_identity(...)`
- Referral doğrulama: `public.validate_and_bind_referral_code(...)`
- Public individual profile mirror kaynağı: `public.individual_profile_details.profile_settings`

## Bu implementasyonda eklenecekler

- `public.submissions.user_id`
- `public.submissions.onboarding_key`
- `public.profile_onboarding_imports`
- onboarding activation için kontrollü RPC yüzeyi
- `/form` için versioned pending onboarding payload katmanı
- `/welcome/activate` aktivasyon sayfası
- onboarding import/report scriptleri

## Riskler

- `src/App.tsx` merkezi route dosyası olduğu için route eklemeleri hedefli ve minimal tutulmalı.
- `update_profile_attribute` ve `admin_update_user_profile_attribute` fonksiyonları zaten canlı profil akışının merkezinde; yeni referral/private kuralları bu akışı bozmayacak şekilde patch edilmeli.
- `individual_profile_details` authenticated kullanıcılar tarafından okunabildiği için private referral alanları bu tabloya mirror edilmemeli.

## Açık bırakılmayan kararlar

- Bu işte kanonik profil omurgası `public.user_profiles` tabanlı mevcut stack olarak kabul edildi.
- `src/integrations/supabase/client.ts` onboarding/auth için tek istemci standardı olarak seçildi.
- Onboarding foundation ile taxonomy/role cleanup aynı migration fazına alınmadı.
