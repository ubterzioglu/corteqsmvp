-- delete_cadde_post_v1 — Cadde gönderisi soft-delete RPC (A11a)
-- ============================================================================
--
-- ✅ 2026-09-29'da CANLIYA UYGULANDI ve doğrulandı:
--    CREATE FUNCTION · prosecdef=t (security definer) · REVOKE/GRANT uygulandı ·
--    smoke test: authenticated rolünde auth.uid() null → `cadde_auth_required`
--    fırlattı (ölçüldü) · `schema_migrations` 20260929130000 ·
--    `npm run check:migrations` → sapma yok.
--    Uygulandığı için `docs/operations/`ten buraya TAŞINDI.
--
-- Amaç: kullanıcı kendi gönderisini (moderatör/yönetici herhangi bir gönderiyi)
-- Cadde akışından kaldırabilsin. T19'dan beri açık; `applied/` altında
-- update/delete_cadde_post deseninde migration YOKTU (27.09 ölçümü).
--
-- KARAR — SOFT DELETE (KALANLAR A11a):
--   Sert silmede cadde_post_comments/reactions/shares/targets/hashtags/mentions
--   ON DELETE CASCADE ile zincirleme düşer; akış sorguları ve engagement
--   sayaçları (comment_count vb. başka satırlarda tutulan kopyalar) tutarsızlaşır.
--   Bu yüzden satır KORUNUR, `status='hidden'` yapılır:
--     • SELECT policy normal kullanıcıya yalnız 'published' gösterir → akıştan düşer
--     • list_cadde_feed_v1 'published' süzer → sorgular değişmez
--     • moderasyon/admin geri alabilir (status='published')
--
-- YETKİ: yalnız gönderi SAHİBİ (author_user_id) veya admin/moderatör.
--   security definer + RLS üstü okuma; yetki fonksiyon İÇİNDE denetlenir
--   (desen: create_cadde_post_v1, update_cadde_cafe_logo_v1).
--
-- HATA KODLARI (cadde-rules.ts Türkçe haritası + cadde-error-map.test.ts kilidi):
--   cadde_auth_required       (mevcut)
--   cadde_post_not_found      (mevcut — yoksa veya ZATEN hidden ise)
--   cadde_post_owner_required (YENİ — haritaya eklendi)
--
-- UYGULAMA:
--   1) psql -f <bu dosya>   (PowerShell satır yapıştırma — Türkçe bozulur)
--   2) supabase/migrations/applied/20260929130000_delete_cadde_post_v1.sql olarak taşı
--   3) schema_migrations kaydı at (version 20260929130000)
--   4) npm run check:migrations → sapma yok
-- ============================================================================

create or replace function public.delete_cadde_post_v1(p_post_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_post public.cadde_posts%rowtype;
begin
  if v_uid is null then
    raise exception 'cadde_auth_required';
  end if;

  -- Zaten hidden olan gönderi "yok" sayılır: ikinci silme denemesi ve yetkisiz
  -- kullanıcının hidden satırları yoklaması aynı cevabı alır (bilgi sızdırmaz).
  select * into v_post
  from public.cadde_posts
  where id = p_post_id and status <> 'hidden';

  if not found then
    raise exception 'cadde_post_not_found';
  end if;

  if v_post.author_user_id is distinct from v_uid
     and not (public.is_admin(v_uid) or public.is_moderator(v_uid)) then
    raise exception 'cadde_post_owner_required';
  end if;

  update public.cadde_posts
  set status = 'hidden',
      updated_at = now()
  where id = p_post_id;
end;
$$;

revoke all on function public.delete_cadde_post_v1(uuid) from public, anon;
grant execute on function public.delete_cadde_post_v1(uuid) to authenticated;

comment on function public.delete_cadde_post_v1(uuid) is
  'Cadde gönderisini soft-delete eder (status=hidden). Yalnız sahip veya admin/moderatör. A11a: sert silme cascade ile sayaçları bozduğu için bilinçli tercih.';

-- ============================================================================
-- GERİ ALMA
-- ============================================================================
-- drop function if exists public.delete_cadde_post_v1(uuid);
-- (Soft-delete edilen gönderileri geri açmak için:
--   update cadde_posts set status='published' where id = ...;)
