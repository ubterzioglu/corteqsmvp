-- `admin_*` RPC'lerinden gereksiz `anon` EXECUTE yetkisi çekilir.
--
-- ── ÖLÇÜM (04.10, uygulamadan önce) ─────────────────────────────────────────
--   public şemasındaki `admin\_%` fonksiyon ......... 79
--   bunlardan `anon` EXECUTE yetkili ................ **51**
--   zaten doğru konumda (anon yetkisiz) ............. 28
--   yetkinin kaynağı: PUBLIC rolünden miras **22** · doğrudan anon grant **29**
--
-- Liste gerçek yönetici işlemlerinden oluşuyor: `admin_set_user_role`,
-- `admin_set_user_feature_override`, `admin_bulk_import_catalog_items`,
-- `admin_replace_resource_entries_from_csv`, `admin_approve_catalog_claim`…
-- Hiçbirinin anonim çağrılması için meşru bir sebep yok.
--
-- ⚠️ BU BİR AÇIK KAPI DEĞİLDİ — abartma. Çalıştırarak ölçüldü (geri alınan
--    işlemde, sıradan üye kimliğiyle): `admin_set_user_feature_override`,
--    `admin_set_catalog_item_role`, `admin_grant_catalog_item_access` →
--    `forbidden`; `admin_list_service_finder_jobs` → `sf_admin_required`.
--    Yani kapılar gövdede VAR ve çalışıyor.
--    Sorun savunma derinliği: kapısı unutulan TEK yeni fonksiyon, bu grant
--    yüzünden doğrudan anonime açılır. Yetki, kapının yedeği olmalı.
--
-- ── YAPILAN ────────────────────────────────────────────────────────────────
--   · anon'dan EXECUTE çekilir.
--   · Yetki PUBLIC'ten miras geliyorsa PUBLIC'ten de çekilir — ama o durumda
--     `authenticated`'a AÇIKÇA verilir ki yönetici arayüzünün bugünkü
--     davranışı AYNEN korunsun. (PUBLIC'ten çekip authenticated'a vermemek
--     admin panelini düşürürdü.)
--   · `service_role` yetkisine DOKUNULMAZ (edge function'lar onu kullanır).
--
-- ⚠️ Liste elle yazılmadı: canlı katalogdan döngüyle üretiliyor. Elle yazılan
--    51 satırlık bir liste, yeni bir `admin_*` fonksiyon eklendiği gün bayatlar
--    ve kimse fark etmez. Kabul testi "0 kaldı" diye ölçer, isim saymaz.

do $$
declare
  r record;
  v_anon int := 0;
  v_public int := 0;
begin
  for r in
    select p.oid,
           p.oid::regprocedure::text as imza,
           has_function_privilege('public', p.oid, 'execute') as public_yetkili
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
       and p.proname like 'admin\_%'
       and has_function_privilege('anon', p.oid, 'execute')
  loop
    if r.public_yetkili then
      -- PUBLIC'ten miras: önce authenticated'a açıkça ver, sonra PUBLIC'i çek.
      -- Sıra ÖNEMLİ — ters sırada yönetici arayüzü bir an için yetkisiz kalır.
      -- ⚠️ Bu `grant` bugün YÜK TAŞIMIYOR: ölçüldü, 22/22 fonksiyonun ZATEN
      --    açık `authenticated=X` grant'ı var (mutasyon Y2 bu yüzden hayatta
      --    kaldı — test kusuru değil, bilinçli fazlalık). Emniyet ağı olarak
      --    duruyor: açık grant'ı olmayan yeni bir fonksiyon eklenirse PUBLIC
      --    çekildiğinde yönetici arayüzü düşmesin.
      execute format('grant execute on function %s to authenticated', r.imza);
      execute format('revoke execute on function %s from public', r.imza);
      v_public := v_public + 1;
    end if;

    execute format('revoke execute on function %s from anon', r.imza);
    v_anon := v_anon + 1;
  end loop;

  raise notice 'admin_* RPC: anon yetkisi cekilen = %, PUBLIC''ten cekilip authenticated''a verilen = %',
    v_anon, v_public;
end;
$$;
