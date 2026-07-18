-- Sosyal Medya Paylaşım Takip — "burak" sekmesini item_tab CHECK'e ekler.
-- /admin/social-share-vault artık sekmesiz tek liste; BURAK BURAYA BAK
-- kalemleri de aynı paylaşım rozeti sistemine (social_share_log/_item_note)
-- bağlanıyor. Önceki migration: 20260627100000_social_share_tracking.sql.
--
-- Orijinal migration constraint'i isimsiz (satır içi `check (...)`) tanımladığı
-- için otomatik üretilen ismi varsaymak yerine information_schema'dan buluyoruz.

do $$
declare
  con_name text;
begin
  for con_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'social_share_log'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%item_tab = any%'
  loop
    execute format('alter table public.social_share_log drop constraint %I', con_name);
  end loop;

  alter table public.social_share_log
    add constraint social_share_log_item_tab_check
    check (item_tab in ('tools', 'diaspora', 'tests', 'burak'));
end $$;

do $$
declare
  con_name text;
begin
  for con_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'social_share_item_note'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%item_tab = any%'
  loop
    execute format('alter table public.social_share_item_note drop constraint %I', con_name);
  end loop;

  alter table public.social_share_item_note
    add constraint social_share_item_note_item_tab_check
    check (item_tab in ('tools', 'diaspora', 'tests', 'burak'));
end $$;
