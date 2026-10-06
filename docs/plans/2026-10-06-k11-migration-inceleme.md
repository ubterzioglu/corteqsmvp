# K11 — Bekleyen 4 migration incelemesi (6 Ekim 2026)

> **Kapsam:** `supabase/migrations/applied/20261006060000 … 090000`. **Salt okunur inceleme** — hiçbiri
> uygulanmadı, hiçbir dosya değiştirilmedi (canlıda uygulanıp uygulanmadığı doğrulanamadı: bu makinede
> `psql` yok; uygulanmış bir dosyayı sonradan düzenlemek repo ile canlıyı ayrıştırır).
> Dayanak: dört dosya ve etkinlik onayı zinciri (`…5900000`, `…6100000`) satır satır okundu; şema varsayımları
> `supabase/baseline/2026-08-04-public-schema.sql` ve diğer migration'lara karşı kontrol edildi.
> Bu rapor bir ajanın bulgularına dayanır; **uygulamadan önce canlı şemada ölç**.

| Dosya | Sınıf | Özet |
|---|---|---|
| `060000_b7_cadde_search` | ✅ uygulanabilir (no-op) | Gövde `select 1;` — "Cadde araması kapalı" kararının kaydı. Şema varsayımı yok. |
| `070000_b6_group_report_notification` | ⚠️ **düzeltme gerekir** | Aşağıda. |
| `080000_b8_events_manual_approval` | ✅ uygulanabilir (no-op) | Gövde `select 1;`. Eski "ilk etkinlik admin onayı" taslağının iptali; zinciri bozmaz. Dosya adı yanıltıcıdır (kozmetik). |
| `090000_b8_weekly_city_digest_toggle` | ✅ uygulanabilir **(sıralama şartıyla)** | Aşağıda. |

## 070000 — düzeltme gerekir (iş mantığı)

`review_group_report_v1` içine grup sahibine **uygulama içi** bildirim ekliyor (upheld/rejected); mail yok.
Şema (notifications, group_reports, whatsapp_landings), `begin/commit`, `create or replace`,
`security definer` + `set search_path = public` ve `is_admin` kapısı doğru; G14'ün kilit sırası (deadlock
düzeltmesi) korunmuş.

**Kusur:** sahip yalnız `owner_user_id`'den okunuyor. Diğer grup bildirimleri sahibi
`coalesce(owner_user_id, submitted_by, user_id)` ile çözüyor (`20261002120000_group_notifications.sql:191`).
Sahibi henüz talep edilmemiş (sahiplik doğrulanmamış) bir grupta `owner_user_id` null'dır ve bildirim
**sessizce atlanır** (`owner_notified:false`).

**Öneri:** `select wl.group_name, coalesce(wl.owner_user_id, wl.submitted_by, wl.user_id)` kullanılsın.
Dosya canlıya uygulanmadıysa doğrudan düzelt; **uygulandıysa yeni bir migration** (`create or replace`) yaz.
**Karar (sizde):** bildirim yalnız `owner_user_id`'ye mi gitsin, yoksa `submitted_by` yedeğiyle mi (öneri: yedek).
Ayrıca `owner_notified` yeni bir jsonb anahtarıdır; admin panelinin bunu bekleyip beklemediği SQL'den doğrulanamadı.

## 090000 — uygulanabilir, ama haftalık özeti AÇMADAN önce 130000 şart

`get_admin_notification_state`'e `weeklyCityDigestEnabled` ekliyor ve `set_notification_setting`
allowlist'ine `email.weekly_city_digest.enabled` anahtarını ekliyor. Mevcut hiçbir anahtar düşmemiş;
fonksiyon gövdeleri son sürümün (radar_scan_digest) birebir kopyası + yeni anahtar.

⚠️ **Bağımlılık:** outbox `event_type` CHECK'inde `weekly_city_digest` bulunmalıdır. A15
(`20261005100500`) CHECK'i 19 değerle yeniden kurup bu tipi **düşürmüştü**; onarım
`20261006130000_outbox_event_type_check_restore_weekly_digest.sql` dosyasındadır ve **henüz uygulanmadı**.
`130000` uygulanmadan toggle açılırsa satır `23514` ile reddedilir ve mail sessizce gitmez.
Sıra: **`130000` önce canlıda ölçülüp uygulanır, ancak sonra toggle açılır.**

## Etkinlik onayı zinciri (T1 ile ilişki)

Zaman sırasıyla: `20261003010000` ilk-onay kuralını kurar → `…5900000` `first_approval_required=false`,
`create_event_v1` her zaman `published` + `approval_source='auto'`, aktif limit 2, `event_date >= current_date`
→ `…6080000` no-op → `…6100000` aynı ayar ve aynı gövde (yalnız yorum farkı).

**Nihai davranış:** herkesin etkinliği anında yayınlanır; limit 2 SQL'de `event_active_limit` (P0001) ile
zorlanır; ilk-onay SQL'de yoktur. Bu, **verdiğiniz karar**dır (tüm üyelere otomatik yayın) ve çelişki yoktur.

- ⚠️ **CLAUDE.md T1 metni bayat:** hâlâ "ilk etkinlik onaydan geçer" kuralını anlatıyor. Karara göre
  güncellenmeli (CLAUDE.md'yi doğrudan düzenlemedim; öneri `2026-10-05-tur1-claude-md-onerileri.md` desenine).
- ⚠️ **Doğrulanamayan:** `status='published'` ile doğrudan PostgREST INSERT'inin RLS'te engellenip
  engellenmediği bu dosyalardan görülemiyor (M03 politikası başka yerde olmalı). Engellenmiyorsa **limit 2
  atlanabilir** (RPC'yi dolaşan doğrudan insert). Canlıda ölçülmeli: `select polname, pg_get_expr(polwithcheck, polrelid) from pg_policy where polrelid='public.events'::regclass;`
- Kozmetik: `…5900000:113-115` yorumunda `backfill_auto` değeri geçiyor ama `events_approval_source_check`
  yalnız `('auto','admin')` kabul eder (yalnız yorum, işlevsel sorun yok). `5900000` ile `…6100000` aynı kuralı iki kez uygular (zararsız).

## Uygulama sırası önerisi (canlı ölçümden sonra, sizin onayınızla)

1. `20261006130000` (CHECK onarımı) — önce `pg_get_constraintdef` ile mevcut listeyi ölç.
2. `20261006090000` (toggle) — ancak (1) sonrası; haftalık özeti açmak ayrı karar.
3. `20261006060000`, `…080000` (no-op'lar) — yalnız ledger satırı için.
4. `20261006070000` — sahip çözümlemesi düzeltildikten sonra.
5. Her biri sonrası `supabase_migrations.schema_migrations`'a elle satır ekle, `npm run check:migrations`.
