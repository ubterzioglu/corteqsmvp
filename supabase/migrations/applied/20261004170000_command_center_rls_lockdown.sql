-- 🔴 CANLI AÇIK KAPATILDI — `command_center_items` anonime tamamen açıktı.
--
-- ── BULGU (04.10, gerçek anonim HTTP isteğiyle DOĞRULANDI) ──────────────────
-- Tabloda DÖRT politika vardı ve ikisi her şeyi açıyordu:
--   command_center_items_all_open      ALL    {anon,authenticated}  qual=true  ← 🔴
--   command_center_items_select_public SELECT {anon,authenticated}  qual=true  ← 🔴
--   command_center_items_select_admin  SELECT {authenticated}  is_admin(auth.uid())
--   command_center_items_write_admin   ALL    {authenticated}  is_admin(auth.uid())
-- RLS politikaları OR'lanır: iki açık politika, iki admin politikasını
-- tamamen ANLAMSIZ kılıyordu.
--
-- Kanıt (kapatmadan önce, anon anahtarla):
--   GET  /rest/v1/command_center_items?select=id  Prefer:count=exact
--     → `Content-Range: 0-0/1761` → **1.761 kaydın TAMAMI**
--     → gövde: {"title":"Level sayfaları ve sade hero","detail":"…","assignee":"UBT"}
--   PATCH /rest/v1/command_center_items?id=eq.<rastgele>
--     → **HTTP 204** (401/403 DEĞİL) → RLS yazmaya İZİN veriyordu
--
-- Yani şirketin iç yol haritası, toplantı notları, görev detayları ve
-- sorumluları herkese açıktı — üstelik ALL politikası yüzünden
-- DEĞİŞTİRİLEBİLİR ve SİLİNEBİLİR durumdaydı.
--
-- ── NEDEN GÜVENLE KAPATILABİLİR (ölçüldü) ───────────────────────────────────
-- Tabloyu okuyan/yazan tüm kod `src/lib/dashboard/command-center-items/*` ve
-- `src/components/dashboard/commandcenter/*` altında; bu yüzey `RequireAuth` +
-- `AdminLayout` (→ `is_admin()`) arkasındadır. Anonim bir yüzey YOK.
-- Dolayısıyla `_select_admin` + `_write_admin` politikaları tek başına yeter.
--
-- ⚠️ `v_command_center_facets` view'ı `security_invoker=on` olduğu için
--    tablo politikasını OTOMATİK izler; ayrıca düzeltme gerektirmez. Yine de
--    anon grant'ı savunma derinliği için çekilir (view boş dönse bile
--    sütun adları şemayı sızdırır).

drop policy if exists command_center_items_all_open      on public.command_center_items;
drop policy if exists command_center_items_select_public on public.command_center_items;

-- Kalan iki politika (admin okuma + admin yazma) DEĞİŞTİRİLMEZ; doğru olan onlar.

revoke all on table public.v_command_center_facets from anon;

comment on table public.command_center_items is
  'İç planlama panosu. 04.10.2026: `_all_open` (ALL, anon+authenticated, '
  'qual=true) ve `_select_public` politikaları kaldırıldı — 1.761 kayıt '
  'anonim okunabiliyor VE yazılabiliyordu (gerçek istekle ölçüldü). '
  'Erişim yalnız is_admin(auth.uid()) üzerinden. Bu tabloya anon/public '
  'politika EKLEME: yüzeyin tamamı RequireAuth + AdminLayout arkasındadır.';
