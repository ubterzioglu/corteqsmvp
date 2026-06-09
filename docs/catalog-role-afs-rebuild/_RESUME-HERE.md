# 🔵 RESUME HERE — Catalog/Flat-Role/AFS Rebuild

> **Bu dosya kaldığım yeri ve sıradaki adımı anlatır. Devam ederken ÖNCE bunu oku.**
> Tarih: 2026-06-09 · Branch: `rebuild/catalog-flat-role-afs` · Repo: corfin-mvp · Supabase: `injprdrsklkxgnaiixzh`

## TEK CÜMLE DURUM
Phase 1 (raporlar) + Phase 2 (şema migration 002–010) **tamamlandı ve local DB'de doğrulandı (commit edildi)**. Phase 3 seed migration'ları yazıldı ama **014 (placeholder seed) local'de BLOKE** — `catalog_items`'e insert, eski `ci.title` kolonunu okuyan bir trigger fonksiyonunu (`catalog_rebuild_search_document`) tetikliyor; o kolon 002'de `display_name`'e rename edildi.

## SIRADAKİ ADIM (kullanıcı kararı bekleniyor / verildi)
Kullanıcıya sorulan "sequencing" sorusu: **write-path trigger fonksiyonlarını seed'den ÖNCE rewire et** seçeneği öneriliydi. Kullanıcı "dur, not yaz" dedi — yani **bu karar henüz uygulanmadı**. Devam edince:
1. Yeni bir migration ekle (örn. `20260609100900_rebuild_010b_rewire_write_path_fns.sql`) — `catalog_rebuild_search_document` içindeki `ci.title` → `ci.display_name` düzelt (SADECE satır ~18'deki `ci.title`; `catalog_search_documents.title` kolonu RENAME EDİLMEDİ, ona dokunma). Yazma yolunu tetikleyen DİĞER fonksiyonları da kontrol et (aşağıdaki 17 fonksiyon listesi).
2. 014 + 015'i bu rewire'dan SONRA çalışacak şekilde bırak (zaten timestamp olarak sonradalar: 101300/101400 > 100900).
3. `supabase start` ile tekrar local doğrula → EXIT=0 + 015 "Rebuild verification PASSED" beklenir.
4. Phase 3'ü commit et.

## ÖNEMLİ: title→display_name RENAME 17 FONKSİYONU KIRDI
`catalog_items` + `title` referans eden fonksiyonlar (Phase 4'te hepsi rewire edilecek; write-path olanlar ÖNCE):
admin_list_catalog_claims, admin_list_catalog_profiles, admin_list_member_catalog_profiles, admin_list_unified_records, admin_set_catalog_item_attribute, catalog_create_duplicate_candidates_for_item, **catalog_rebuild_search_document (WRITE-PATH, trigger — ÖNCE)**, catalog_upsert_source_item, get_catalog_item_profile, get_catalog_item_public_profile, get_current_member_catalog_profile, get_my_editable_catalog_items, list_member_catalog_names, search_catalog, search_directory_catalog, sync_member_catalog_role_for_user, update_catalog_item_attribute.
> Trigger olarak `catalog_items` üzerinde yazıda çalışanlar: `trg_catalog_search_document_items`→`catalog_search_document_item_trigger`→`catalog_rebuild_search_document` (title burada). `trg_sync_user_profile_role_from_catalog`→`sync_user_profile_role_from_catalog` (title yok). `update_updated_at_column` (title yok).

## DB ERİŞİMİ (token'ı ASLA yazdırma/loglama)
- `.secretdb` = Supabase **access token** (`sbp_...`) + URL, TEK satır. `.gitignore` satır 86'da. **GÜVENLİK: token bir kez shell'de göründü → kullanıcıya rotation öner.**
- Read-only remote sorgu: `export SUPABASE_ACCESS_TOKEN="$(head -1 .secretdb | tr -d '[:space:]')"` → `POST https://api.supabase.com/v1/projects/injprdrsklkxgnaiixzh/database/query` (body `{"query": "..."}`).
- Local DB: Docker UP olmalı. `supabase start` tüm 199+ migration'ı + benim rebuild migration'larımı replay eder. Local container: `supabase_db_injprdrsklkxgnaiixzh`. psql: `docker exec supabase_db_injprdrsklkxgnaiixzh psql -U postgres -t -A -c "..."`.
- Remote'a DDL/yazma YASAK (kullanıcı sınırı: Phase 2-7 local-only). Sadece read-only introspection remote'ta serbest.

## KARARLAR (kullanıcı, kesin)
1. Full rebuild; mevcut Haziran AFS işi de legacy sayılır.
2. **Rename-to-plan-names + tüm consumer'ları rewire** (en geniş blast radius — kullanıcı bunu seçti).
3. **Tüm satellite tabloları KORU** (hiçbiri drop edilmez). Sadece family residue drop: family kolonları, 6 legacy rol, catalog_item_types + item_type_*, role_taxonomy_rules.
4. Matrix **option A**: uniform 24/30/7 matrisi 76 rol için aynen üret (differentiation sonraya).
5. role_features **feature_key (text FK) korunur** (feature_id'ye çevirme).
6. Çalışma modu: **Phase 2-7 kesintisiz, checkpoint YOK; sadece Phase 8 prod-push öncesi go/no-go DUR.**
7. **No-backup drop kabul edildi** (163 item / 998 attr / 129 assignment kalıcı kaybı kullanıcı 3x onayladı). Yeni backup ALMA, drop'a izin verildi.

## DOĞRULANMIŞ GERÇEKLER
- Roller: 82 = 76 gerçek + 6 legacy → final **76**.
- attribute_catalog=**53** ("55" başlık hatası), feature_catalog=42, profile_section_catalog=7.
- Matrix %100 UNIFORM (her rol 24 attr/30 feat/7 sec — distinct_sig=1).
- Live veri (prod): catalog_items=163 (item_type: member=129, person_profile=14, advisor=10, community_group=10), user_role_assignments=129, user_profile_attributes=998, claims=1.
- `catalog_items.status` CHECK: draft|pending_review|**published**|archived|rejected — **'active' YOK**. Placeholder'lar `status='published'` kullanır (002/009/010'da 'active'→'published' düzeltildi).
- `catalog_items.item_type` → FK `catalog_item_types(key)` ON DELETE RESTRICT. Rol key'leri (case-sensitive, örn `User_Standard`) catalog_item_types'ta MEVCUT → placeholder `item_type=r.key` kullanır (014'te `lower()` BUG'ı düzeltildi). Bu FK + catalog_item_types migration 016'da drop edilecek.
- `catalog_item_roles` tablosu YOKTU; 008'de yaratıldı + `platform_role_key`'den backfill (local'de 0 çünkü local'de item yok; prod'da 163 olur).

## YAPILAN MIGRATION'LAR (hepsi yazıldı; 002-013+015 local'de geçti, 014 bloke)
- `20260609100000_rebuild_002_catalog_items.sql` — title→display_name, created_by_user_id→created_by, +is_placeholder/is_verified/country_code/city/deleted_at
- `20260609100100_rebuild_003_flat_roles.sql` — family kolonları drop, 6 legacy deaktive (+deleted_at)
- `20260609100200_rebuild_004_afs_catalogs.sql` — attribute/feature/section_catalog → afs_*; +storage_strategy/default_visibility/validation_schema; component_name→component_key
- `20260609100300_rebuild_005_role_afs_relations.sql` — role_*_rules/flags → role_attributes/features/sections; feature_key KORUNDU; unique constraint'ler
- `20260609100400_rebuild_006_item_values_and_overrides.sql` — catalog_item_attributes → catalog_item_attribute_values; typed value kolonları
- `20260609100500_rebuild_007_claims_and_managers.sql` — catalog_claim_requests→catalog_item_claims; catalog_item_memberships→catalog_item_managers (role→manager_role)
- `20260609100600_rebuild_008_item_roles_indexes_constraints.sql` — catalog_item_roles yarat+backfill+one-primary index+perf indexler
- `20260609100700_rebuild_009_rls_policies.sql` — catalog_item_roles RLS (status='published' düzeltildi)
- `20260609100800_rebuild_010_public_owner_admin_rpc.sql` — get_flat_roles, get_role_form_schema, get_public_catalog_item_profile (status='published')
- `20260609101000_rebuild_011_seed_flat_roles.sql` — 76 aktif assertion
- `20260609101100_rebuild_012_seed_afs_catalogs.sql` — storage_strategy ata + 53/42/7 assertion
- `20260609101200_rebuild_013_seed_role_afs_matrix.sql` — explicit AFS satır assertion
- `20260609101300_rebuild_014_seed_placeholder_items.sql` — 76 placeholder (item_type=r.key, status=published, slug=placeholder-{kebab}) + catalog_item_roles primary link ← **BURADA BLOKE (ci.title trigger)**
- `20260609101400_rebuild_015_verify_system.sql` — tam doğrulama assertion pass

## 4 PRE-EXISTING REPLAY BUG DÜZELTİLDİ (commit edildi, prod'da no-op)
- 20260423140000 (DROP FUNCTION önce — 42P13), 20260604103000 (on conflict (module,slug) — 42P10), 20260609031000 (wa_* to_regclass guard — 42P01), 20260609033000 (CONCURRENTLY strip + table guard — 25001).

## KALAN FAZLAR
- Phase 3: 014 bloğunu çöz (write-path fn rewire) → commit.
- Phase 4: 17 fn + ~100 RPC + RLS toptan + edge functions + src/lib/*-api.ts + types.ts regen. Rapor 07.
- Phase 5: frontend 23 dosya (new-member form flat rol, public/owner/admin profil). Rapor 08.
- Phase 6: admin Veritabanı menüsü + /admin/new-member/guide + docs/roles-infogram.html. Rapor 09.
- Phase 7: E2E + cleanup grep. Rapor 11, 13.
- Phase 8 GATE: migration 016 (drop legacy: 6 rol, family kolon, catalog_item_types+item_type_*, role_taxonomy_rules, item_type FK) + 017 verify → **prod push öncesi DUR/go-no-go** → push (Management API veya supabase db push) → remote doğrula. Rapor 10,12,14.

## RAPORLAR (docs/catalog-role-afs-rebuild/)
00 preflight ✅, 01 audit ✅, 02 roles ✅, 03 afs ✅, 04 matrix ✅, 05 design ✅, 06 ER+satellite ✅, _phase2-live-structure-notes ✅. Kalan: 07-14.

## ÖNEMLİ NOT
Context'te yüklenen CLAUDE.md, KARDEŞ proje `corteqs_fin` landing app'i anlatır — corfin-mvp DEĞİL. Tablo konvansiyonları farklı. Bu iş için live DB + git remote'a güven, o CLAUDE.md'ye değil. Memory: [[project_catalog_afs_rebuild_2026_06_09]].
