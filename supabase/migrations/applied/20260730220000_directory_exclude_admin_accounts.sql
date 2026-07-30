-- ============================================================
-- Purpose:                /directory aramasından yönetici hesaplarını çıkar.
-- Module:                 CATALOG / DIRECTORY (revizyon panosu B20 —
--                         "Searchde super admin yönetici vs çıkıyor" maddesi)
-- Risk level:             low (tek fonksiyona tek NOT EXISTS koşulu; gövde canlıdan okunur)
--
-- Kök neden: dizin listesi TS'ten değil search_directory_catalog RPC'sinden geliyor
--   (catalog-directory.ts:191). Fonksiyonun "Branch 2" bölümü individual_profile_details
--   içindeki TÜM open profilleri listeliyor — Admin_/Moderator_ rol sahipleri dahil.
--   20260615140000 katalog tarafındaki iç rolleri saklamıştı; bireysel dal atlanmıştı.
--
-- Yöntem: canlı pg_get_functiondef okunur, "where ipd.visibility_status = 'open'"
--   çapasının hemen ardına NOT EXISTS koşulu eklenir, sonuç EXECUTE edilir.
--   Rol deseni is_admin()/is_moderator() ile AYNI semantik: r.key ilike 'Admin_%' /
--   'Moderator_%' (LIKE'ta _ joker karakterdir — is_admin de aynı deseni kullanır,
--   tutarlılık bilinçli tercih).
--
-- Rollback:               eklenen not exists bloğunu çıkarıp fonksiyonu yeniden tanımla
--                         (önceki gövde: scratchpad/fn_search_directory.sql).
-- Estimated lock impact:  negligible.
-- ============================================================

BEGIN;

DO $$
declare
  src text;
  anchor text := $a$where ipd.visibility_status = 'open'$a$;
  exclusion text := $x$where ipd.visibility_status = 'open'
    -- B20: yönetici/moderatör hesapları halka açık dizinde listelenmez
    -- (is_admin/is_moderator ile aynı rol deseni).
    and not exists (
      select 1
      from public.user_role_assignments ura_x
      join public.roles r_x on r_x.id = ura_x.role_id
      where ura_x.user_id = ipd.user_id
        and (r_x.key ilike 'Admin_%' or r_x.key ilike 'Moderator_%')
    )$x$;
begin
  select pg_get_functiondef(oid) into src
  from pg_proc where proname = 'search_directory_catalog' limit 1;

  if src is null then
    raise exception 'search_directory_catalog bulunamadi';
  end if;
  if src like '%B20: yönetici/moderatör%' then
    raise notice 'Zaten uygulanmis, atlandi.';
    return;
  end if;
  if (length(src) - length(replace(src, anchor, ''))) / length(anchor) <> 1 then
    raise exception 'CAPA KONTROLU BASARISIZ: anchor tam 1 kez bulunmali';
  end if;

  src := replace(src, anchor, exclusion);
  execute src;

  if not exists (
    select 1 from pg_proc
    where proname = 'search_directory_catalog'
      and prosrc like '%B20: yönetici/moderatör%'
  ) then
    raise exception 'SON KONTROL BASARISIZ: koşul fonksiyona islenmedi';
  end if;
  raise notice 'OK: yonetici haric tutma kosulu eklendi';
end $$;

COMMIT;
