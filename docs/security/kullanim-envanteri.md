# SG0 · Kullanım Envanteri + Başlangıç Kapı Değerleri

> Tarih: 5 Ekim 2026
> Kaynak: `docs/security/SECURITY_AUDIT.md` + istemci kodu taraması

---

## 1 · Kritik/Yüksek Bulguların Durumu

| # | Bulgu | Durum | A2 Batch | Not |
|---|---|---|---|---|
| **S1** | DB dump'ları public repoda | → **B1** | — | `git filter-repo` + force-push + secret rotasyonu (kullanıcı kararı) |
| **S2** | `catalog_upsert_*` anon yazma/silme | 🔴 AÇIK | A2.3 | İstemci çağrısı YOK → revoke güvenli |
| **S3** | `catalog_upsert_owner_membership` anon | 🔴 AÇIK | A2.3 | İstemci çağrısı YOK → revoke güvenli |
| **S4** | `.env.local` yerel ref'lerde | → **B1** | — | Secret rotasyonu (kullanıcı kararı) |
| **S5** | `find-matches` kimliksiz | 🔴 AÇIK | A2.7 | Edge function — istemci çağrısı var, `auth.getUser()` ekle |
| **S6** | SSRF + sahte grup sahipliği | 🔴 AÇIK | A2.5, A2.8 | `whatsapp_landings` guard + fetch filtresi |
| **S7** | `catalog_items` self-verify | 🔴 AÇIK | A2.4 | Kolon grant + tetikleyici |
| **S8** | Grup INSERT guard yok | 🔴 AÇIK | A2.5 | BEFORE INSERT tetikleyici |
| **S9** | Relocation worker herkese açık | 🔴 AÇIK | A2.3 | İstemci çağrısı YOK → revoke güvenli |
| **S10** | `advisor_social_media_links` açık | 🔴 AÇIK | A2.6 | Politika değiştir |

---

## 2 · İstemciden Çağrılan RPC'ler (Revoke Adayları)

Aşağıdaki fonksiyonlar **istemci kodunda** (`src/**`) çağrılıyor. Bunları revoke etmek **uygulamayı bozar**.

### Güvenli (revoke edilebilir — istemci çağrısı YOK)

| Fonksiyon | SG0 Not |
|---|---|
| `catalog_upsert_owner_membership` | S3 — istemci çağrısı yok |
| `catalog_upsert_source_item` | S2 — istemci çağrısı yok |
| `catalog_delete_item_for_source` | S2 — istemci çağrısı yok |
| `catalog_reset_item_projection` | S2 — istemci çağrısı yok |
| `catalog_create_duplicate_candidates_for_item` | S2 — istemci çağrısı yok |
| `catalog_sync_*` (7 fonksiyon) | S2 — istemci çağrısı yok |
| `catalog_rebuild_search_document(s)` | S2 — istemci çağrısı yok |
| `catalog_refresh_all_search_documents` | S2 — istemci çağrısı yok |
| `sync_member_catalog_role_for_user` | O2 — istemci çağrısı yok |
| `notify_followers` | O3 — istemci çağrısı yok |
| `list_member_catalog_names` | Düşük — istemci çağrısı yok |
| `worker_*_relocation_*` (7 fonksiyon) | S9 — istemci çağrısı yok |

### Revoke EDİLEMEZ (istemci çağrısı VAR)

| Fonksiyon | Çağrıldığı Yer | Not |
|---|---|---|
| `admin_get_user_email` | `admin-catalog.ts`, `brainstorming-api.ts` | Admin panel — `is_admin` kontrolü var mı? |
| `admin_role_record_counts` | `admin-catalog.ts` | Admin panel |
| `admin_list_unified_records` | `admin-catalog.ts` | Admin panel |
| `admin_set_catalog_item_role` | `admin-catalog.ts` | Admin panel |
| `get_catalog_item_rules` | `admin-catalog.ts` | Admin panel |
| `admin_upsert/delete_catalog_item_*` | `admin-catalog.ts` | Admin panel |
| `admin_grant/revoke_catalog_editor` | `admin-catalog.ts` | Admin panel |
| `admin_approve/reject_catalog_claim` | `admin-catalog.ts` | Admin panel |
| `admin_list_catalog_claims` | `admin-catalog.ts` | Admin panel |
| `admin_search_profiles` | `admin-catalog.ts` | Admin panel |
| `create_carsi_item_v1` | `cadde-carsi-api.ts` | Authenticated kullanıcı |
| `update_carsi_item_v1` | `cadde-carsi-api.ts` | Authenticated kullanıcı |
| `delete_carsi_item_v1` | `cadde-carsi-api.ts` | Authenticated kullanıcı |
| `record_carsi_contact_v1` | `cadde-carsi-api.ts` | Authenticated kullanıcı |
| `add_brainstorming_comment_v1` | `brainstorming-api.ts` | Authenticated kullanıcı |
| `list_cadde_cafe_join_requests_v1` | `cadde-cafe-api.ts` | Authenticated kullanıcı |
| `join_cadde_cafe_v1` | `cadde-cafe-api.ts` | Authenticated kullanıcı |
| `create_cadde_cafe_v1` | `cadde-cafe-api.ts` | Authenticated kullanıcı |
| `approve_cadde_cafe_member_v1` | `cadde-cafe-api.ts` | Authenticated kullanıcı |
| `archive_cadde_cafe_v1` | `cadde-cafe-api.ts` | Authenticated kullanıcı |
| `update_cadde_cafe_logo_v1` | `cadde-cafe-api.ts` | Authenticated kullanıcı |
| `get_cadde_actor_context` | `cadde-api.ts` | Authenticated kullanıcı |
| `delete_cadde_post_v1` | `cadde-api.ts` | Authenticated kullanıcı |
| `list_cadde_post_reactors_v1` | `cadde-api.ts` | Authenticated kullanıcı (A1.9) |
| `set_group_status_v1` | `group-moderation-api.ts` | Admin/moderatör |
| `admin_review_group_claim` | `group-moderation-api.ts` | Admin |
| `group_post_review` | `group-moderation-api.ts` | Admin/moderatör |
| `admin_record_group_strike` | `group-moderation-api.ts` | Admin/moderatör |
| `admin_set_group_setting` | `group-moderation-api.ts` | Admin |
| `group_moderator_summary` | `group-moderation-api.ts` | Admin/moderatör |
| `get_admin_notification_state` | `notification-settings-api.ts` | Admin |
| `set_notification_setting` | `notification-settings-api.ts` | Admin |
| `set_my_notification_subscription` | `notification-settings-api.ts` | Authenticated |
| `get_rebuild_status_report` | `durum-raporu-api.ts` | Admin |

---

## 3 · Başlangıç Kapı Değerleri

### Şu anki durum (ölçülmedi — canlıda doğrula)

| Kapı | Hedef | Mevcut | Not |
|---|---|---|---|
| `anon EXECUTE` | YOK | 🔴 Var (S2, S3, S9) | Ortak SQL ile revoke |
| `authenticated EXECUTE` | Yalnız kendi fonksiyonları | 🔴 Geniş | Daraltma gerekli |
| `service_role EXECUTE` | Tüm fonksiyonlar | ✓ | Değişiklik yok |
| `RLS enabled` | Tüm tablolar | 🟡 Bazıları eksik | `role_structure` (A3), `job_listing_views` ✓ |
| `storage bucket private` | Tüm profile bucket'lar | ✓ | `cv`, `presentation`, `license` ✓ |

### Hedef durum (A2 bitince)

| Kapı | Hedef |
|---|---|
| `anon EXECUTE` | Yalnız `search_public_content`, `list_job_listings_public`, `public_member_next_event` |
| `authenticated EXECUTE` | Yalnız kendi verisi üzerinde işlem yapan fonksiyonlar |
| `service_role EXECUTE` | Tüm fonksiyonlar (admin panel + edge functions) |
| `RLS enabled` | Tüm tablolar |
| `storage bucket private` | Tüm profile bucket'lar |

---

## 4 · İlerleme Takibi

| Batch | Durum | Not |
|---|---|---|
| SG0 | ✓ | Bu dosya |
| SG1 | Bekliyor | `docs/archive/backups` → §B1 (kullanıcı kararı) |
| SG2 | Bekliyor | İç SECURITY DEFINER revoke |
| SG3 | Bekliyor | `catalog_items` kolon grant |
| SG4 | Bekliyor | `whatsapp_landings` guard |
| SG5 | Bekliyor | Açık RLS politikaları |
| SG6 | Bekliyor | `find-matches` kimlik |
| SG7 | Bekliyor | SSRF koruması |
| SG8 | Bekliyor | `server.mjs` + nginx |
| SG9 | Bekliyor | Rate-limit + edge |
| SG10 | Bekliyor | Düşük/bilgi |
| SG11 | Bekliyor | Tam kapı + build |

---

## 5 · §B4 Karar Bekleyenler

A2 ilerledikçe şu sorular ortaya çıkacak:

1. **`notifications` doğrudan INSERT** var mı? → Varsa tetikleyici/RPC'ye taşı (O3)
2. **`whatsapp_landings` eski INSERT politikası** kaldırılacak mı? → Yeni bundle yayında olunca (S8)
3. **`send-phone-otp-hook` pepper** ayırma → Mevcut şifreli veriyi bozar (Düşük)
4. **Anonim form tabloları** yeniden tasarım → Kolon grant'i (O11)
5. **`job_listings` politika** kaldırma → Önce okumaların RPC üzerinden olduğu doğrulanmalı (O10)
6. **`_shared/emails/event-published.ts`** → A15'te eklendi, commit edildi ✓
