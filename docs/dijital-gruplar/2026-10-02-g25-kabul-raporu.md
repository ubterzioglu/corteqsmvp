# G25 · Dijital Gruplar Motoru — 13 Kabul Testi Raporu (02.10.2026)

**Koşum:** `psql "$SUPABASE_DB_URL" -f supabase/qa/group-motor-acceptance.sql`
**Sonuç:** exit 0 — **13/13** (12 senaryo canlı ölçüldü + #6 tripwire). Betik kendini
doğrular: her senaryo `assert` ile kilitlidir, herhangi biri patlarsa exit ≠ 0. Tüm ölçüm
**geri alınan işlemde** koşulur; #5 RLS bölümü işlem dışında **gerçek rollerle** (anon) ölçülür.
Rollback sonrası canlı dokunulmamıştır (10 landing · 0 skor · 0 log · 0 claim · 0 strike ·
fastlane false · new_badge_hours 72).

| # | Kabul (tasarım §13) | Durum | Kanıt |
|---|---|---|---|
| 1 | Aynı link ikinci kez eklenemez | ✅ | `already_listed` + satır sayısı değişmedi (INSERT sızmadı) |
| 2 | Şerit açıkken admin-olmayan `pending_review` | ✅ | `listing_status=pending_review` + `ownership=claim_pending` |
| 3 | Şerit+admin+sahiplik → anında `published`; "Yeni" 72 saat sonra kalkar | ✅ | published + `fast_lane` log + `is_new=true`; eşik 0'a inince `is_new=false` (72 saat davranışı eşik üzerinden) — UI yarısı G19 bileşen testlerinde |
| 4 | Kara liste kelimesi şeritten geçmez | ✅ | "vize" → `review_flags` dolu + `pending_review` (reddedilmedi — §8) |
| 5 | Üyeliği olmayan link/panel/kuyruk görmez | ✅ | anon: view'da link/PII 0 satır · invite RPC · summary · claims · settings · moderation_log → hepsi `permission denied` |
| 6 | Şikayet eşiği (3/30 gün → hidden · 2 → strike) | ⛔ **TRIPWIRE** | `group_reports` YOK (G14 ⛔ G04/U06). Betik `to_regclass IS NULL` doğrular — tablo ortaya çıkarsa QA KIZARIR ve G14 bu senaryoyu yazmak zorunda kalır. Mutasyon sınavı da G14'le birlikte yapılır |
| 7 | Bekleyen gönderi 48 saatte eskale | ✅ | `pending_group_admin` → `escalate_due()` → `pending_platform` |
| 8 | 2 ölü link gizler · 1 canlı geri açar · `unknown` etkisiz | ✅ | invalid×2 → `hidden(link_dead)` · unknown → sayaç **2 kaldı** · ok → `published` + sayaç 0 |
| 9 | Kaldırma isteği anında gizler | ✅ | `hidden(owner_request)` + log `actor_kind=owner` + dizinden düştü |
| 10 | Aile & Çocuk seviye-2 olmayana kapalı | ✅ (bugünkü hâl) | submit → `group_submit_category_locked` · owner_update → `group_owner_category_locked`. Seviye sistemi yok (K09/G06) → bugün herkese kapalı = doğru; G06 kilidi seviye kontrolüne çevirir |
| 11 | İlk 7 gün skor `null` + kartta görünmez | ✅ | grace: skor NULL (tablo + view) + rozet false · 8. gün: skor 80 + rozet true · kart tarafı G19 bileşen testi ("Skor bekleniyor" render edilmez) |
| 12 | Her durum değişikliği logda | ✅ | `fast_lane · owner_request · link_dead · published · rejected` — 5 sebep de `group_moderation_log`'da |
| 13 | 8 bildirim: outbox satırı + `sent_at` | ✅ | 8/8 event tipi outbox'ta + kural 8 temiz (payload'da davet linki 0) · `sent_at` kanıtı G23 gerçek drenajında: **processed:8, sent:8, failed:0** |

## QA'nın yakaladığı gerçek kusur (bu batch'te onarıldı)

🔴 **#13 ilk koşuda KIRMIZI:** `group_strike_warning` outbox'a hiç düşmedi. Kök neden: G23
bildirimi `group_moderation_log`'a bağlamıştı ama G15 merdiveninin ilk basamağı (warning)
durum geçişi yapmadığı için log satırı **yazılmıyor** (G12: no-op log yazmaz) → uyarı maili
hiçbir zaman gitmeyecekti. Düzeltme `20261002140000_group_strike_notification.sql`: uyarının
tek kancası `group_strikes AFTER INSERT` (her ihlal = 1 satır = 1 mail; outcome `{sebep}`
alanına işlenir), log trigger'ının strike dalı kaldırıldı (strike_2/3 çift mail riski de kapandı).
Düzeltme sonrası #13 yeşil; kilit `group-notifications-schema.test.ts`'te.

## Mutasyon sınavı (tasarım §13 notu: #5/#6 mutasyonla sınanır)

Kuralı boz → QA kırmızıya dönmeli. Üçü de canlı fonksiyon/view üzerinde uygulandı ve
**geri yüklendi** (restore sonrası canlı yeniden ölçüldü):

| Mutasyon | QA tepkisi |
|---|---|
| D1: `unknown` sayacı artırsın (G08 kural 5 ihlali) | **#8 KIRMIZI** — "unknown sayacı DEĞİŞTİREMEZ" assert'i, sayaç 3'e çıkınca patladı |
| D2: `aile-cocuk` kilidi kaldırılsın | **#10 KIRMIZI** — `group_submit_category_locked` beklerken `invalid_category` döndü, assert yakaladı |
| D3: view `whatsapp_link`'i sızdırsın | **#5 KIRMIZI** — "view anon'a link/PII sızdırıyor: 10 satır" |

Düzeltme migration'ının sözleşme mutasyonları: M1 strikes trigger'ı sil → kırmızı ·
M2 strike dalını log'a geri koy (çift mail) → kırmızı · M3 outcome işlemesini sil → kırmızı.
**Toplam 6/6.**

## Otomasyon kapsamı (13 kabulün üç katmanı)

1. **Bu betik** (canlı DB, geri alınan işlem): #1-#5, #7-#13 motor davranışı — tek komutla yeniden koşulur.
2. **Vitest sözleşme/bileşen testleri** (417 dosya / 3437+ test): UI yarıları (#3 "Yeni" etiketi,
   #11 kart, #5 DOM kaynak taraması) + migration metin kilitleri + şablon metinleri (§9/§6 birebir).
3. **Batch kabul koşuları** (G12-G24 kapanışlarında ölçüldü, KALANLAR Kapananlar tablosunda tek satır kanıtlar).

## Sınırlar / sonraki adımlar

- **#6 G14'te tamamlanacak** (şikayet tablosu + eşik + kabul senaryosu + mutasyon sınavı — tripwire hazır).
- QA betiği canlı şema değiştikçe (G11/G14/G06) güncellenir; tripwire'lar bunu zorlar.
- `health_score_cron_enabled` bayrağı deploy sonrası açılana dek #11'in "skor dolar" yarısı
  cron'da değil yalnız recompute'ta ölçülür (bayrak bilinçli kapalı — G17/G22 tuzağı).
