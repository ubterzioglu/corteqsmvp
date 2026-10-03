-- Katalog kısıtlarındaki iki ARTIK temizliği (AFS yeniden adlandırmasından kalan).
--
-- 2026-06-09 rebuild'inde iki tablo yeniden adlandırıldı:
--   catalog_item_memberships  -> catalog_item_managers
--   catalog_claim_requests    -> catalog_item_claims
-- Tablolar yeniden adlandırıldı ama ESKİ ADLI CHECK kısıtları da üzerlerinde
-- KALDI. Postgres bir tablodaki TÜM check'leri birden uygular; sonuç, hiçbir
-- yerde yazılı olmayan bir KESİŞİM kuralıdır.
--
-- ── 1) catalog_item_managers.role — GERÇEK ÇELİŞKİ ──────────────────────────
-- Canlıda iki kısıt vardı:
--   catalog_item_managers_role_chk       owner · admin · editor · moderator
--   catalog_item_memberships_role_check  owner · manager · editor · contributor · viewer
-- Kesişim = {owner, editor}. Yani tablonun BELGELEDİĞİ dört rolden ikisi
-- (`admin`, `moderator`) hiçbir zaman yazılamıyordu — hata mesajı da yanıltıcı
-- geliyordu, çünkü ihlal edilen kısıt eski adı taşıyordu.
--
-- ÖLÇÜLDÜ (03.10, canlı, geri alınan işlem — yedi değerin hepsi denendi):
--   owner YAZILDI · editor YAZILDI
--   admin REDDEDİLDİ · moderator REDDEDİLDİ
--   manager REDDEDİLDİ · contributor REDDEDİLDİ · viewer REDDEDİLDİ
--
-- ⚠️ BU CANLIDA KIRIK BİR ÖZELLİK DEĞİL, GİZLİ BORÇ — ölçüldü, abartılmasın:
--   Tabloya yazan 8 canlı fonksiyon var. Arayüzden ULAŞILABİLEN yalnız ikisi
--   (`admin_grant_catalog_editor`, `admin_set_catalog_item_editor`) ve ikisi de
--   'editor'/'owner' yazıyor — bunlar zaten çalışıyordu.
--   `manager`/`contributor`/`viewer` değerlerini öneren üç fonksiyon
--   (`admin_grant_catalog_item_access` · `admin_update_catalog_item_access` ·
--   `admin_set_catalog_item_editor`'ın kullanılmayan dalları) arayüzden HİÇ
--   çağrılmıyor; yalnız üretilmiş tiplerde görünüyorlar.
--
-- KARAR: eski adlı artık DÜŞÜRÜLÜR, yeniden adlandırma sonrası niyet olan
-- (owner · admin · editor · moderator) listesi KALIR.
--   · Bugün yazılabilen hiçbir değer yazılamaz hâle GELMEZ (owner/editor ikisinde de var).
--   · `admin` ve `moderator` yazılabilir hâle gelir — zaten amaçlanan buydu.
--   · `manager`/`contributor`/`viewer` reddedilmeye DEVAM eder; yani davranış
--     bu üçü için DEĞİŞMEZ. Onları kullanan 3 ölü RPC ayrı bir temizlik işidir
--     (bu migration onlara DOKUNMAZ — ölü kod silmek bu batch'in kapsamı değil).
--
-- ── 2) catalog_item_claims.status — BİREBİR MÜKERRER ────────────────────────
-- İki kısıt da kelimesi kelimesine aynıydı:
--   CHECK (status = ANY (ARRAY['pending','approved','rejected','cancelled']))
-- Davranışsal etkisi YOK; yalnız gürültü ve yanıltıcı hata adı. Eski adlı
-- düşürülür.
--
-- ── Veri güvenliği (ölçüldü 03.10, migration'dan önce) ──────────────────────
--   catalog_item_managers 187 satır — kalan kısıtı ihlal eden: 0 (hepsi 'owner')
--   catalog_item_claims     2 satır — kalan kısıtı ihlal eden: 0
--
-- ⚠️ DOKUNULMAYAN ÜÇÜNCÜ ÇİFT: `todo_items.konu` üzerinde de iki check var
--    (`todo_items_konu_check` değer listesi + `todo_items_konu_length_check`
--    uzunluk ≤ 500). Bunlar ÇELİŞMEZ, birbirini TAMAMLAR — "iki check = artık"
--    diye otomatik silme; her çifti ayrı ayrı oku.

alter table public.catalog_item_managers
  drop constraint if exists catalog_item_memberships_role_check;

alter table public.catalog_item_claims
  drop constraint if exists catalog_claim_requests_status_check;

-- Kalan kısıtların niyetini açıkça yaz ki bir sonraki okuyan aramasın.
comment on constraint catalog_item_managers_role_chk on public.catalog_item_managers is
  'Katalog yöneticisi rolleri. AFS rebuild sonrası TEK kaynak: eski adlı '
  '(catalog_item_memberships_role_check) artık 03.10.2026''da düşürüldü — ikisi '
  'birden uygulanınca geçerli küme sessizce {owner, editor}''a düşüyordu.';

comment on constraint catalog_item_claims_status_chk on public.catalog_item_claims is
  'Talep durumu. Birebir aynı tanımı taşıyan eski adlı ikiz '
  '(catalog_claim_requests_status_check) 03.10.2026''da düşürüldü.';
