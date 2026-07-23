-- Hide internal / admin / experimental roles from the public directory
--
-- Problem (2026-06-15): Experimental_1/2 roller kaynak User_DiasporaMember
-- rolünden is_directory_visible=true miras almıştı (bkz. 20260612120000), bu
-- yüzden public directory rol dropdown'ında ve arama sonuçlarında görünüyorlardı.
-- Aynı risk admin / super_admin / owner gibi sistem rolleri için de geçerli.
--
-- Çözüm: sadece public directory görünürlüğünü (is_directory_visible) kapat.
-- is_active / is_assignable ALANLARINA DOKUNMUYORUZ — admin panel rol yönetimi
-- ve rol ataması bozulmamalı. Frontend tarafında ayrıca isPublicDirectoryRole()
-- guard'ı var (catalog-directory.ts) — bu migration birincil savunma.
--
-- Idempotent: tekrar çalıştırılabilir, yalnız eşleşen rolleri false yapar.

update public.roles
set is_directory_visible = false
where (
    lower(key) in (
      'experimental_1',
      'experimental_2',
      'admin',
      'super_admin',
      'owner',
      'platform_admin'
    )
    or lower(label) like '%admin%'
    or lower(label) like '%experimental%'
    or lower(label) like '%deneysel%'
    or lower(label) like '%yönetici%'
    or lower(label) like '%yonetici%'
  )
  and is_directory_visible is distinct from false;
