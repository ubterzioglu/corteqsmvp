-- Profil Tamamlanma zorunlu alan setini profil kartındaki checklist ile hizala.
--
-- Önceki canlı durum (AFS tekleştirme sonrası, tüm rollerde aynı):
--   zorunlu = full_name, referral_code, referral_source
-- referral_* alanları onboarding'e özel/private'dır ve profil UI'sında düzenlenemez —
-- kullanıcı tamamlama yüzdesini hiçbir eylemle %100'e taşıyamıyordu (bug raporu 2026-06-12:
-- "ilgi alanları tamamlanınca profil tamamlama kısmına yansımıyor").
--
-- Yeni set, ProfilePage tamamlama kartının listelediği 5 alanla birebir aynıdır:
--   full_name, country, city, bio_short, interests
--
-- Not: is_required yalnızca get_current_user_profile() tamamlama sayacında ve admin
-- "Required" rozetinde kullanılır; kaydetme tarafında yaptırımı yoktur (rebuild_010c).
-- AFS şu an tüm rollerde User_DiasporaMember kopyasıdır (mig 20260612110000); bu güncelleme
-- de tutarlılık için tüm rollere uygulanır. Rol bazlı özelleştirme admin AFS ekranından
-- yapılabilir.

begin;

update public.role_attributes ra
set is_required = true,
    updated_at = now()
from public.afs_attributes a
where a.id = ra.attribute_id
  and a.key in ('full_name', 'country', 'city', 'bio_short', 'interests')
  and ra.is_required = false;

update public.role_attributes ra
set is_required = false,
    updated_at = now()
from public.afs_attributes a
where a.id = ra.attribute_id
  and a.key in ('referral_code', 'referral_source')
  and ra.is_required = true;

commit;
