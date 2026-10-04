-- Eski pano tabloları `authenticated` seviyesinden `is_admin()` seviyesine daraltılır.
--
-- ── NEDEN (KS07'nin bilerek açık bıraktığı madde) ───────────────────────────
-- `20261004190000` anonim erişimi kaldırmıştı ama `*_all_authenticated`
-- politikalarına (qual=true) dokunmamıştı. Yani GİRİŞLİ HERKES bu tabloları
-- hâlâ okuyup yazabiliyordu.
--
-- ÖLÇÜM: sistemde **175 kullanıcı**, bunların **2'si** `Admin_SuperAdmin`.
-- Yani 173 sıradan üye, API üzerinden ~1.650 satır iç veriye (toplantı notları,
-- yol haritası, kişi adları, özgeçmiş kayıtları) erişebiliyordu.
--
-- ── NEDEN GÜVENLE DARALTILABİLİR (ölçüldü) ──────────────────────────────────
-- Bu 15 tablonun tüketicisi yalnız `src/pages/admin/**` ve `src/lib/dashboard/**`.
-- Rotalar `src/pages/admin/routes.tsx` üzerinden `adminRoutes` ile bağlanıyor
-- ve arayüz kapısı `AdminAccessGate` → `userIsAdmin()` → **`is_admin()` RPC**.
-- Yani bu sayfalara zaten YALNIZ admin girebiliyor; veritabanı kuralını arayüz
-- kapısıyla aynı yere getirmek davranışı değiştirmez, yalnız API kaçağını kapatır.
--
-- ⚠️ `command_center_items` (KS06) zaten bu seviyededir; bu migration eski pano
--    tablolarını onunla TUTARLI hâle getirir. İki ayrı seviyede bırakmak,
--    "hangi tablo hangi seviyede" sorusunu her seferinde yeniden sordurur.

do $$
declare
  t text;
  tablolar text[] := array[
    'arge_cards','arge_files','arge_links','command_center_legacy_map','contacts',
    'doc_categories','draft_notlar','gorevler','links','meeting_notes','mvp_items',
    'resource_entries','social_media_links','todo_items','user_cvs'
  ];
  v_dusurulen int := 0;
  v_eklenen int := 0;
begin
  foreach t in array tablolar loop
    -- Koşulsuz authenticated politikalarını düşür (ad kalıpları: *_all_authenticated,
    -- *_select_authenticated). Admin'e kapılı olanlara DOKUNMA.
    execute format('drop policy if exists %I on public.%I', t || '_all_authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_authenticated', t);
    v_dusurulen := v_dusurulen + 1;

    -- Admin politikası YOKSA ekle. `mvp_items` ve `resource_entries` zaten
    -- *_select_admin + *_write_admin taşıyor; onlarda yeniden yaratmaya gerek yok
    -- ama idempotent olsun diye aynı ada bakılır.
    if not exists (
      select 1 from pg_policies
       where schemaname='public' and tablename=t
         and policyname = t || '_admin_all'
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))',
        t || '_admin_all', t);
      v_eklenen := v_eklenen + 1;
    end if;
  end loop;

  raise notice 'eski pano: % tabloda kosulsuz politika dusuruldu, % admin politikasi eklendi',
    v_dusurulen, v_eklenen;
end;
$$;

comment on table public.user_cvs is
  'Eski pano özgeçmiş kayıtları (ad, soyad, rol, file_path). 04.10.2026: önce '
  'anon erişimi (KS07), sonra koşulsuz authenticated erişimi kaldırıldı — '
  'artık yalnız is_admin(). Arayüz kapısı AdminAccessGate ile aynı seviyede.';
