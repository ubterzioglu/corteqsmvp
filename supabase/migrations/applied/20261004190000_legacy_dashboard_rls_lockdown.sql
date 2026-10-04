-- 🔴 Eski pano tablolarından anonim erişim kaldırıldı (~1.650 satır iç veri).
--
-- ── BULGU (04.10) ───────────────────────────────────────────────────────────
-- `command_center_items` kapatıldıktan sonra AYNI desen taranınca, Komuta
-- Merkezi öncesi "eski pano" tablolarının tamamının aynı durumda olduğu
-- görüldü: her birinde çalışan bir `*_all_authenticated` politikasının YANINDA
-- koşulsuz bir `*_select_public` ({anon,authenticated}, qual=true) duruyordu.
-- RLS politikaları OR'landığı için anon her şeyi okuyabiliyordu.
--
-- Ölçülen satır sayıları (gerçek `count(*)`, istatistik değil):
--   command_center_legacy_map 592 · meeting_notes 470 · resource_entries 221
--   mvp_items 188 · todo_items 122 · links 45 · gorevler 9
--   social_media_links 4 · user_cvs 3 · draft_notlar 2 · arge_links 2
--   contacts 0 · arge_cards 0 · arge_files 0 · doc_categories (içerik)
-- Toplam ~1.650 satır: toplantı notları, iç yol haritası, görevler, kişi
-- adları + LinkedIn + dosya yolları (`resource_entries`), özgeçmiş kayıtları
-- (`user_cvs`: ad, soyad, rol, file_path).
--
-- 🔴 İKİSİNDE ANON YAZABİLİYORDU DA:
--   `todo_items_all_open`                        ALL {anon,authenticated}
--   `command_center_legacy_map_all_authenticated` ALL {anon,authenticated}
--   (ikincisi adına rağmen anon'u da kapsıyordu — ad yanıltıcı)
--
-- ── NEDEN GÜVENLE KAPATILABİLİR (ölçüldü) ───────────────────────────────────
-- 15 tablonun TAMAMININ tek tüketicisi `src/pages/admin/**` ve
-- `src/lib/dashboard/**` altındadır (çoğu yalnız `AdminDatabaseTablesPage`).
-- `from('links')` gibi çağrılar kodda HİÇ yok; `social_media_links` için
-- `resource-links.ts` BAŞKA tabloları (consultant_/influencer_/contributor_)
-- kullanıyor. Anonim meşru okuyucu YOK.
--
-- ── KAPSAM KARARI ───────────────────────────────────────────────────────────
-- Bu migration YALNIZ `anon` erişimini kaldırır. `*_all_authenticated`
-- politikaları (girişli HERKES okur/yazar) OLDUĞU GİBİ BIRAKILIR.
-- ⚠️ Bu hâlâ gevşektir — sıradan bir üye bu tabloları görebilir. Admin'e
--    daraltmak AYRI bir karardır: hangi yönetici sayfalarının admin olmayan
--    ekip üyelerince kullanıldığı ölçülmeden daraltmak paneli düşürebilir.
--    Bugünkü iş, anonim dünyaya kapamaktır.

-- ── 1) Koşulsuz "public" okuma politikaları ─────────────────────────────────
drop policy if exists arge_cards_select_public                on public.arge_cards;
drop policy if exists arge_files_select_public                on public.arge_files;
drop policy if exists arge_links_select_public                on public.arge_links;
drop policy if exists command_center_legacy_map_select_public on public.command_center_legacy_map;
drop policy if exists contacts_select_public                  on public.contacts;
drop policy if exists draft_notlar_select_public              on public.draft_notlar;
drop policy if exists gorevler_select_public                  on public.gorevler;
drop policy if exists links_select_public                     on public.links;
drop policy if exists meeting_notes_select_public             on public.meeting_notes;
drop policy if exists mvp_items_select_public                 on public.mvp_items;
drop policy if exists resource_entries_select_public          on public.resource_entries;
drop policy if exists social_media_links_select_public        on public.social_media_links;
drop policy if exists todo_items_select_public                on public.todo_items;
drop policy if exists user_cvs_select_public                  on public.user_cvs;

-- ── 2) anon'u da kapsayan YAZMA politikaları → yalnız authenticated ─────────
-- ⚠️ `command_center_legacy_map_all_authenticated` ADINA RAĞMEN anon'u
--    içeriyordu. Politika adına güvenme, `roles` sütununu oku.
drop policy if exists command_center_legacy_map_all_authenticated on public.command_center_legacy_map;
create policy command_center_legacy_map_all_authenticated on public.command_center_legacy_map
  for all to authenticated using (true) with check (true);

drop policy if exists todo_items_all_open on public.todo_items;
create policy todo_items_all_authenticated on public.todo_items
  for all to authenticated using (true) with check (true);

-- ── 3) `doc_categories`: tek politikası public idi ──────────────────────────
-- Düşürülürse hiç kimse okuyamaz; girişli kullanıcı için yerine konur.
drop policy if exists doc_categories_select_public on public.doc_categories;
create policy doc_categories_select_authenticated on public.doc_categories
  for select to authenticated using (true);

comment on table public.meeting_notes is
  'Eski pano (Komuta Merkezi öncesi) toplantı notları. 04.10.2026: koşulsuz '
  '`_select_public` politikası kaldırıldı — 470 satır anonim okunabiliyordu. '
  'Bu tabloya anon politikası EKLEME; tüketicisi yalnız yönetici panelidir.';
