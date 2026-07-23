-- Cadde 3.0 Faz 9 (1/1): Legacy soft-decommission (spec §20, plan Faz 9; veri riski YOK).
-- Envanter (2026-06-10/11 doğrulandı): feed_posts/feed_likes/cafes/cafe_memberships 0 satır,
-- user_follows 1 satır (R-06 — not düşüldü, korunuyor). Runtime kodda 0 referans
-- (dead frontend dosyaları bu fazda silindi).
--
-- Bu migration tabloları DROP ETMEZ (spec §20.4: en az 1 canary sürüm gözlenir; DROP
-- ayrı karar dokümanı + migration ile gelir). Yapılanlar:
--  1. Legacy trigger'lar drop edilir (canlıdan doğrulanmış 7 ad).
--  2. Tablolara write-revoke: anon/authenticated INSERT/UPDATE/DELETE yetkileri kalkar,
--     mevcut RLS policy'leri düşürülür (SELECT de kapanır — tablolar artık API yüzeyi değildir;
--     service_role/postgres erişimi sürer).
--  3. Açıklayıcı COMMENT'ler eklenir (gelecekteki DROP kararına işaret eder).

begin;

-- ── 1. Legacy trigger'lar (canlı DB'den doğrulanmış adlar) ───────────────────
drop trigger if exists trg_enforce_cafe_capacity on public.cafe_memberships;
drop trigger if exists trg_enforce_daily_cafe_join on public.cafe_memberships;
drop trigger if exists trg_update_cafe_member_count_del on public.cafe_memberships;
drop trigger if exists trg_update_cafe_member_count_ins on public.cafe_memberships;
drop trigger if exists trg_notify_followers_on_cafe on public.cafes;
drop trigger if exists feed_likes_count_trigger on public.feed_likes;
drop trigger if exists update_feed_posts_updated_at on public.feed_posts;

-- ── 2. Write-revoke + RLS policy temizliği ───────────────────────────────────
do $$
declare
  v_table text;
  v_policy record;
begin
  foreach v_table in array array['feed_posts', 'feed_likes', 'cafes', 'cafe_memberships', 'user_follows'] loop
    execute format('revoke all on table public.%I from anon, authenticated', v_table);
    for v_policy in
      select policyname from pg_policies where schemaname = 'public' and tablename = v_table
    loop
      execute format('drop policy %I on public.%I', v_policy.policyname, v_table);
    end loop;
    execute format('alter table public.%I enable row level security', v_table);
  end loop;
end $$;

-- ── 3. Açıklayıcı COMMENT'ler ────────────────────────────────────────────────
comment on table public.feed_posts is
  'LEGACY (Cadde 3.0 Faz 9, 2026-06-11): boş; canonical karşılığı cadde_posts. Yazma kapalı. Canary sonrası ayrı kararla DROP edilecek.';
comment on table public.feed_likes is
  'LEGACY (Cadde 3.0 Faz 9, 2026-06-11): boş; canonical karşılığı cadde_post_reactions. Yazma kapalı. Canary sonrası ayrı kararla DROP edilecek.';
comment on table public.cafes is
  'LEGACY (Cadde 3.0 Faz 9, 2026-06-11): boş; canonical karşılığı cadde_cafes. Yazma kapalı. Canary sonrası ayrı kararla DROP edilecek.';
comment on table public.cafe_memberships is
  'LEGACY (Cadde 3.0 Faz 9, 2026-06-11): boş; canonical karşılığı cadde_cafe_members. Yazma kapalı. Canary sonrası ayrı kararla DROP edilecek.';
comment on table public.user_follows is
  'LEGACY (Cadde 3.0 Faz 9, 2026-06-11): 1 satır taşıyor (R-06 — DROP kararında not düşülecek). Yazma kapalı. Canary sonrası ayrı kararla DROP edilecek.';

commit;
