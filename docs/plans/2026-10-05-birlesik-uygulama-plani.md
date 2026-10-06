# BİRLEŞİK UYGULAMA PLANI — 4 Qwen planı + son ajan raporu (5 Ekim 2026 gece)

> **Kaynaklar (`docs/plans/qwen-sirali/`):** 01 tek-plan-kalan-isler · 02 tur1-ajan-plani · 03 seo-geo-qwen-gorev · 04 guvenlik-yamalari-plani
> **+** son ajanın "tamamlananlar" raporu (§0). 01 ve 02 aynı işi iki ayrıntı düzeyinde anlatıyordu (V, örnek ilan, B9, balon, G17); burada **tek kayda** indirildi.
> **Düzen:** §A = **karar gerektirmeyen** işler, **büyükten küçüğe**, batch batch. §B = **karar / hesap / izin bekleyenler**, büyükten küçüğe.
> **Kural:** Burada olmayan bir iş kuralı için DUR ve sor. Rakamları ezberleme, komutla ölç. Her batch ayrı commit, yol belirterek (`git commit -- <dosyalar>`), **push yok**.
> Boyut: **XL** = çok günlük/10+ alt iş · **L** · **M** · **S** (≈ bir oturumdan az).

> **Durum (5 Ekim 2026 gece, ajan raporu):** ✅ A1 10/10 · A2 SG0–SG10 · A3.1 · A4.1–A4.2 · A5.2–A5.3 · A6–A7 · A8 balon · A9 · A10 yapıldı. ⏳ Açık: A2.12 (SG11), A3.2–A3.4 (§B3), A4.3–A4.4 (§B8), A5.1/A5.4, A8 rehberler + 4. rehber (§B12). Migration'lar canlıda (6 Ekim): `20261006000000…050000` + `20261005150000…190000` + `500000…900000` uygulandı. Bekleyen: `20261005400000` (OTP, bilerek atlandı) ve `20261006060000…090000` (başka oturum, incelenmedi). Not: durumlar ajan raporuna dayanır, ayrıca yeniden ölçülmedi.

---

## 0 · Durum — son ajan raporu ve bugün ölçtüklerim

| Kalem | Ajan raporu | Ölçüm (bugün, dosya sistemi) |
|---|---|---|
| Rehberler (`docs/guides/`) | 3 taslak yazıldı | ✓ var, **izlenmiyor**: `belge-yukleme.md`, `reklam-verme.md`, `etkinlik-paylasma.md`. Adları Tur 1 planındakinden (`uye-*-rehberi.md`) **farklı**; **4. rehber (Rol Talepleri) yok**; içerik incelenmedi. |
| Migration `…130000 seed_demo_job_listings` | uygulandı (6 örnek ilan) | dosya var; canlı kayıt **doğrulanmadı** |
| Migration `…140000 public_member_next_event` | uygulandı | dosya var; canlı kayıt **doğrulanmadı** |
| Migration `…160000 check_account_deletion_blocks` | uygulandı | dosya var; canlı kayıt **doğrulanmadı** |
| Migration `…120000 cv_share_with_premium` | **BAŞARISIZ** (tablo yapısı farklı) | ⚠️ **dosya hâlâ `applied/` içinde** ve yanlış içerikli (`user_profile_attributes.key` diye bir kolon yok; gerçek yapı: `attribute_id` → `afs_attributes` FK). Uygulanmamış dosya `applied/`'de durursa `check:migrations` sapma verir. |
| Edge `delete-account` | deploy edildi | kod **izlenmiyor** (commit'siz); deploy yapılan sürüm repoda yok |
| Edge `send-notification-emails` | deploy edildi | ⚠️ deploy edilen kod başkasının **commit'siz** diff'i (A15). Hattın migration tarafı (outbox CHECK) uygulandı mı bilinmiyor. |
| Edge `member-cv-link` | **deploy edilmedi** (tablo yapısı farklı) | kod var, izlenmiyor; migration düzelene kadar bekler |

**Raporun gizlediği/çelişen üç şey (yeni bulgu):**
1. **Zaman damgası çakışması:** `20261005100000_event_published_notification.sql` ile `20261005100000_whatsapp_bot_foundation.sql` **aynı sürüm**. `schema_migrations.version` benzersizdir. (15 haneli iki dosya 14 haneye çevrilmiş ama yeni çakışma doğmuş; `110000_public_content_search_events` ise çakışmasız.)
2. **Plan "canlıya hiçbir şey çıkmadı, V bitmeden uygulama yok" diyordu**; ajan V yapılmadan 3 migration + 2 edge deploy etti. Bu yüzden §A1 "doğrulama"sı artık **canlı kayıt ölçümünü** de içerir.
3. **`20261005170000_role_structure.sql` (R1) yazılmış** — planda R1 "yapılacak" görünüyordu; incelenmedi, uygulandı mı bilinmiyor.

Sürüm sırası şu an (yerel `applied/` sonu): `…100000 ×2 · 110000 · 120000(HATALI) · 130000 · 140000 · 150000(Cadde reactors, plansız) · 160000 · 170000(role_structure) · 200000 · 300000 · 400000 · 500000 · 600000 · 700000 · 800000 · 900000`.

---

# BÖLÜM A — KARAR GEREKTİRMEYEN İŞLER (büyükten küçüğe)

> **Parçalama:** Her "A" başlığı aşağıda **tek oturumluk alt batch'lere** (A1.1, A1.2 …) bölünmüştür. Bir alt batch = tek commit, tek kabul, **S veya M** (XL/L kalmadı). Bir ajana aynı anda **tek alt batch** ver; sıra bağımlılıkları "Önce" sütununda.

| Alt batch | Boyut | İş (tek cümle) | Önce |
|---|---|---|---|
| ✅ A1.1 | S | Envanter dosyası (kod yok) | — |
| ✅ A1.2 | S | Canlı ledger ölçümü (salt okuma) | A1.1 |
| ✅ A1.3 | M | Migration kapısı: sürüm çakışması + hatalı `120000` + incelemeler | A1.2 |
| ✅ A1.4 | M | Eksik kabul SQL'leri (A4, A7, A12, A13, A15, A16) | A1.3 |
| ✅ A1.5 | S | A13 toplu yayınlamayı migration'dan çıkar + operasyon SQL'i | A1.3 |
| ✅ A1.6 | S | `xlsx` raporu + `ProfilePage` ≤ 800 | A1.1 |
| ✅ A1.7 | M | UI/lib batch'lerinin kapı + mutasyon turu (A1–A3, A9–A11, A14) | A1.1 |
| ✅ A1.8 | M | Etkinlik sözleşme testleri güncel migration'a hizala (A13, A15) | A1.5 |
| ✅ A1.9 | S | Cadde reactors incelemesi (yalnız rapor) | — |
| ✅ A1.10 | S | Commit dizisi (yeşil olanlar) | A1.3–A1.8 |
| A2.1–A2.12 | S–M | Güvenlik SG0…SG11 (her biri ayrı batch, aşağıda) — ✅ A2.2–A2.7, A2.9, A2.11 · ⏳ A2.1, A2.8, A2.10, A2.12 açık (bkz. `2026-10-05-kalan-seo-geo-guvenlik-plani.md`) | SG0 önce |
| A3.1–A3.4 | S–M | R1 incele · R3 ölç · R5 süzgeç · R4 kısmi UI — ✅ A3.1 bitti; A3.2–A3.4 §B3 (K5 rol matrisi) bekliyor | sıralı |
| A4.1–A4.4 | S–M | D1 doğrula · D2 anonimleştirme · D3 doğrula · D4 UI — ✅ A4.1–A4.2 bitti; A4.3–A4.4 §B8 bekliyor | sıralı |
| A5.1–A5.4 | S–M | CV: şema ölç · migration · edge function · UI+metin — ✅ A5.2–A5.3 bitti | sıralı |
| ✅ A6.1–A6.2 | S | Arama: etkinlik+hata görünürlüğü · rehber+sayfa (ajan raporu: A1.7'de zaten yapılmış) | — |
| A7, A8.1–A8.2, A9.1–A9.3, A10 | S | (bkz. aşağıda) — ✅ A7 (A1.7'de yapılmış), ✅ A8 balon, ⏳ A8 rehber doğrulama + 4. rehber, ✅ A9, ✅ A10 | A8.2 ← A5 |

## A1 · V — "A1–A16 tamamlandı" doğrulaması (10 küçük batch) — ✅ 10/10 TAMAM
*Kaynak: 01 §V · 02 V1–V8 · §0 bulguları.* Çalışma ağacında ~81 değişik/izlenmeyen yol var; **A1.10 dışında hiçbir alt batch commit atmaz** (yalnız rapor/kabul SQL'i dosyası ekler). Her alt batch kendi başına bitirilebilir; çıktısı bir dosya veya kısa rapordur.

**A1.1 · Envanter [S]** — kod yok. `git status`/`diff --stat` → her dosyayı batch'e eşle (A1 sekme · A2 `/pricing` · A3 `PremiumLockCard` · A4 iki yetki · A5 rol veri modülü · A6 süzgeç · A7 ilan kotası · A8 `/ilanlar` · A9 footer · A10 balon · A11 `useAdminAccess` · A12 ruhsat/lisans · A13 etkinlik otomatik onay · A14 "şimdi paylaşın" · A15 etkinlik maili · A16 arama). Çıktı `docs/plans/2026-10-05-tur1-envanter.md`. Yapılmamış olanı "YAPILMAMIŞ" yaz (A6 şüpheli). *Kabul: her değişik dosya bir batch'e ya da "plansız"a bağlı.*

**A1.2 · Canlı ledger ölçümü [S]** — salt okuma, küçük katalog sorgusu, `psql -f`: hangi `20261005*` sürümü `schema_migrations`'ta (ajanın "uygulandı" dediği üçü + diğerleri). Satır başına fonksiyon çağıran sorgu yasak (1 GB RAM). DB izni yoksa §B9'a düşer. *Kabul: sürüm → uygulandı/uygulanmadı tablosu.*

**A1.3 · Migration kapısı [M]** — (a) `event_published_notification` ↔ `whatsapp_bot_foundation` sürüm çakışması: uygulanmadıysa boş bir damgaya taşı, uygulandıysa durumu raporla; (b) hatalı `…120000_cv_share…`'i `applied/`'den çıkar (A5.2 doğru yazınca geri gelir); (c) her migration'ı oku: `begin/commit`, idempotentlik, `security definer`+`set search_path`, `revoke … from public, anon`, `role_features` satırı her aktif rol için (sayıyı şemadan türet). *Kabul: çakışma yok, `applied/`'de uygulanamaz dosya yok, her migration için "okundu" notu.*

**A1.4 · Eksik kabul SQL'leri [M]** — `supabase/qa/` altında (çalıştırma, `begin…rollback`, assert'li; `phone-otp-claim-acceptance.sql` biçimi): A4 `career-premium-features` · A7 `career-listing-quota` (5+1 ilan; iki-oturum yarışı notu ayrı `docs/operations/` dosyası) · A12 `profile-license` · A13 `events-auto-approval` · A15 `event-published-notification` · A16 `public-content-search-events`. *İstenirse altı dosya iki oturuma bölünür (A4+A7+A12 / A13+A15+A16).*

**A1.5 · A13 toplu yayını migration'dan çıkar [S]** (karar B9b) — migration'daki bekleyen etkinlikleri `published` yapan `update` kalkar; ayrı `docs/operations/2026-10-05-etkinlik-bekleyenleri-yayinla.sql` (önce sayım → onay istemi → `via_rpc` + `corteqs.skip_*` bayraklı tek işlem → geri alma). T1 koruyucusu ve A15 tetikleyicisinin bayrağı gerçekten okuduğunu doğrula. **Çalıştırma** (§B8).

**A1.6 · Boyut ve bağımlılık [S]** — `xlsx`: `npm audit` çıktısıyla raporla (kendi başına `audit fix` yok), betik tek seferlikse `npx` önerisi, `package-lock` farkı yalnız xlsx ağacı mı. `ProfilePage.tsx` 833 → ≤ 800: A1/A12 eklerini ayrı bileşene/hook'a taşı; `ProfilePage.test.tsx` değişmeden yeşil.

**A1.7 · Kapı + mutasyon turu [M]** — her UI/lib batch için (A1,A2,A3,A9,A10,A11,A14): ilgili test → `tsc` → `eslint <dosyalar>` → `verify:text` → `check:dead` → `ingest:tools:check` → `vitest --maxWorkers=2` (cwd büyük harfli `C:`) + ≥3 mutasyon. Türkçe harfi gözle oku ("Etkinliğiz yayında" → "Etkinliğiniz yayında"). Kırmızı olan batch'e "KIRMIZI + neden" yaz. *Gerekirse iki oturuma bölünür (A1,A2,A3,A9 / A10,A11,A14).*

**A1.8 · Etkinlik sözleşme testleri hizası [M]** (B9) — `events-first-approval*` testleri eski migration'ı kilitliyorsa "geçmiş tanım" işaretle, **güncel migration için ayrı blok** (bayatlama kapanı: fonksiyonu en son tanımlayan migration kilitli olmalı); mutasyon ≥5 (üye ayrımı, `approval_requests` yazımı, limit, T1, anon). `CLAUDE.md` bayat "ilk etkinlik onay" satırlarını **düzenleme**, diff olarak `docs/plans/2026-10-05-tur1-claude-md-onerileri.md`'ye yaz.

**A1.9 · Cadde reactors incelemesi [S]** — yalnız rapor: kime ne gösteriyor, banlı/gizli süzülüyor mu, `diaspora_key`. Commit yok, karar §B11.

**A1.10 · Commit dizisi [S]** — yalnızca gate'i yeşil olanlar, yol belirterek: A9 → A2+A3 → A11 → A10 → A1 → A5+A6 → A4 → A7+A8 → A12 → A13+A14 → A15 → A16.

## A2 · Güvenlik yamaları — 12 küçük batch (A2.1 = SG0 … A2.12 = SG11) — kısmen (SG7 yapılmadı; SG0/SG9/SG11 eksik)
*Kaynak: 04 (ayrıntı: `docs/security/SECURITY_AUDIT.md`).* Dal `security-fixes`; migration'lar `20261006…` aralığı (14 hane, çakışmasız); **uygulama/deploy yok**; her yama önce KIRMIZI test + mutasyon; bağımsız inceleme ayrı ajanla.

| Alt batch | Kod | İçerik | Not |
|---|---|---|---|
| ⏳ A2.1 (envanter var, `ilerleme.md` YOK) | **SG0** | Kullanım envanteri (`docs/security/kullanim-envanteri.md`) + başlangıç kapı değerleri (`ilerleme.md`) | Kod yok. İstemciden çağrılan revoke adayı çıkarsa **dur → §B4**. |
| ✅ A2.2 | **SG1** | `docs/archive/backups` izlemeden çıkar (`git rm --cached`, diskten silme), `.gitignore` + sözleşme testi | Geçmiş temizliği Burak'ta (§B1). |
| ✅ A2.3 | **SG2** | İç `SECURITY DEFINER` RPC'lerden anon/authenticated EXECUTE kaldır (S2,S3,S9,O2) | Envanterde istemci çağıranı olan fonksiyon listeden çıkar. |
| ✅ A2.4 | **SG3** | `catalog_items` kolon grant'i + ayrıcalıklı kolon tetikleyicisi (S7) | İzinli kolonlar gerçek kullanımdan. |
| ✅ A2.5 | **SG4** | `whatsapp_landings` INSERT/UPDATE guard + host CHECK `NOT VALID` (S8,S6,O8) | Eski INSERT politikasını **kaldırma** (§B4). Gerçek kolon adlarını `applied/`'den doğrula. |
| ✅ A2.6 | **SG5** | Açık RLS politikaları (S10,O9,O11,O3) | `notifications` doğrudan INSERT varsa **dur → §B4**. |
| ✅ A2.7 | **SG6** | `find-matches` kimlik + sızıntı (S5) | |
| ⏳ A2.8 (YAPILMADI, `safe-invite-fetch.ts` yok) | **SG7** | SSRF: `_shared/safe-invite-fetch.ts`, 3 çağrı noktası, `group-preview` (S6) | |
| ✅ A2.9 | **SG8** | `server.mjs`, `LoginPage next`, `safeHref`, nginx regex/`server_tokens`, ölü `sanitizeHtml`, CI SHA sabitleme | `security.ts`/`EventDetailPage.tsx` başkasının diff'ini içerir → satırların dışına dokunma. nginx'te CLAUDE.md md.1–6. |
| ⏳ A2.10 (yalnız atomik rate-limit; O4–O7 yok) | **SG9** | Rate-limit atomik + `user.id` (O1), `send-submission-email` (O4), anket (O5), `whatsapp-autoreply` (O6), `deno.json` (O7) | Deno yoksa dur. Gateway `X-Forwarded-For` davranışı doğrulanmadı → Burak non-prod'da. |
| ✅ A2.11 | **SG10** | Düşük/bilgi maddeleri, her biri ayrı küçük commit | Pepper/anahtar ayırma, anonim form grant'i, `event-published.ts` ekleme → **§B4**. |
| A2.12 | **SG11** | Tam kapı + `build`, `SECURITY_AUDIT.md` durumları, uygulama sırası listesi | |

## A3 · Rol Talepleri zinciri — 4 küçük batch (sıralı)
*Kaynak: 01 §2.3. Sıra bağlayıcı.*
- ✅ **A3.1 · R1 `role_structure` [S]:** migration **zaten yazılmış** (`…170000`) → incele (planla uyumu: `roles.key` ve prefix SQL'lerine **dokunulmaz**; `approval_requests.payload`'a `new_code`/`specialties`; onayda mevcut `admin_set_user_role`), kabul SQL'i yaz. Önce `docs/plans/2026-10-05-rol-talepleri-olcum.md`'yi oku. 19 sarı satır **dahil** (B7a); sayılar: 7 ana rol · 259 satır · başvurulabilir alt rol **51**.
- **A3.2 · R3 ölçüm [S]:** canlıda `catalog_item_tags` şemasını ölç (kolon, RLS). Kullanıcı-bazlı uzmanlığa uyuyorsa kullan; **uymuyorsa dur → §B3**.
- **A3.3 · R5 süzgeç [S]:** Experimental_1/2/3 **yalnız gizli, silme yok**; Şehir Elçisi adı değişmez; Diaspora Üyesi/Destekçi/İş Arayan/İçerik Moderatörü/Platform Yöneticisi gizli; varsa `oneri` süzgeci **kaldırılır**.
- **A3.4 · R4 3 adımlı seçici UI [M]** (ana rol kartı → aranabilir alt rol → uzmanlık chip'i): yalnız **Excel'de açık noktası olmayan** satırlarla; başvuru `approval_requests`'e düşer, `AdminApprovalsPage`'de görünür. "Rol Talepleri" sekmesi yalnız eski düzende. Açık noktalı satırlar → §B3.

## A4 · B13 — Hesabı kalıcı sil — 4 küçük batch (sıralı)
*Kaynak: 01 §2.8. D1 (engel RPC) ve D3 (`delete-account`) ajan raporuna göre yapıldı → önce doğrula.*
- ✅ **A4.1 · D1 doğrula [S]:** `check_account_deletion_blocks` — tek sahibi olduğu grup, yönetici/moderatör rolü, açık abonelik → engel + "önce devret" mesajı. Kabul SQL'i.
- ✅ **A4.2 · D2 anonimleştirme [M] (önce FK sayımı ayrı oturum olabilir):** kişisel veri (ad, e-posta, telefon, foto, `user_profile_attributes`, depolama `${uid}/…` tüm kovalar) silinir; Cadde/grup içeriği "Silinmiş üye" ile kalır. Engelleyen FK'leri **tek tek** sınıfla (RESTRICT: `vip_invitations.created_by`, `platform_safety_core`, `contributor_resource_submissions.submitted_by`, `group_strikes.decided_by`; NO ACTION: `cadde_cafe_members.approved_by`, `cadde_moderation_queue.resolved_by`, `cadde_promotion_campaigns.approved_by`, `cadde_promotion_events.viewer_user_id`, `cadde_user_bans.created_by`, `survey_responses.respondent_user_id`, `surveys.approved_by/created_by` + ~9 sayılmadı → **önce hepsini say**) ve `SET NULL`/anonimleştirme seç.
- **A4.3 · D3 doğrula [S]:** `delete-account` — JWT doğrulama, service role, `account_deletion_log` (hash'li kimlik, kişisel veri yok); kodu commit'le (şu an izlenmiyor).
- **A4.4 · D4 UI [M]:** "Tehlikeli Bölge" kartı, yazılı onay ("SİL") + yeniden doğrulama, engel nedeni gösterimi; KVKK/GDPR metni sözle uyumlu.
- Kabul: işlem-içi SQL testi (engel→ret; engel yok→kişisel veri gider, yetim satır yok) + bileşen testi. **Canlıda gerçek silme yok → §B8.**

## A5 · B2 — Başkasının CV'sini sahibin rızasıyla görme (yeniden yazım) — 4 küçük batch (sıralı)
*Kaynak: 01 §2.1 + ajan raporundaki başarısızlık.* Önceki migration yanlış şemaya yazılmıştı.
1. **A5.1 · Şemayı ölç [S]:** `afs_attributes` (yeni satır `cv_share_with_premium`: `storage_strategy`, görünürlük), `user_profile_attributes` (`attribute_id` FK), `role_attributes` kuralları. **Profil formu kuralı:** alan yalnız `role_attributes`'te `is_enabled` kuralı olan roller için çizilir → tüm aktif roller için kural ekle (sayıyı ölç; 78 ezberdir).
2. ✅ **A5.2 · Migration [S]:** bu yapıya göre **yeniden yaz**, kabul SQL'i (rıza kapalı/varsayılan → görünmez).
3. ✅ **A5.3 · Edge function [M]:** `member-cv-link` edge function'ı aynı yapıya göre güncelle: `career.cv.view` yetkisini **sunucuda** doğrula → hedefin CV'si var **ve** rıza açık → `createSignedUrl` (5 dk; `getPublicUrl` yok). Depolama RLS'i **gevşetilmez**. `role_features` satırı yoksa yetki sessizce herkese kapalıdır (T2) — A4'teki `false` satırlarını doğrula.
4. **A5.4 · UI + metin [S]:** sahibe anahtar "CV'mi Premium üyeler görebilsin" (**varsayılan KAPALI**), `ProfilePage` gizlilik metni anahtara göre.
5. Kabul: Premium ✓ · Free ✗ · rıza kapalı ✗ · anon ✗ · storage doğrudan ✗. Deploy **ayrı** (§B9); `verify_jwt` canlıda ölç.
6. **`belge-yukleme.md` rehberi bu özelliği anlatıyor** → özellik canlıda olana dek rehber bilgi tabanına **girmez** (A8).

## A6 · B12 — Arama kapsamı (veriye bağlı olmayan kısım) — ✅ yapılmış  
*Kaynak: 01 §2.7.* Etkinlik (A16) doğrula · **Rehberler** ve **Sayfalar**: yalnız yayınlanmış, herkese açık içerik · `DirectoryPage.tsx` sessiz `catch` → hata görünür · 1 karakter kuralı korunur · `ingest:tools:check`. **Konsolosluk** ve **Cadde gönderisi** için kod hazırlığı yapılabilir ama **veri/gizlilik kararı §B7'de**; açma bayrağı kapalı gelir.

## A7 · B10 — Dizin kartında "Etkinliği Var — Tarih — Başlık" — ✅ yapılmış  
*Kaynak: 01 §2.6.* RPC `public_member_next_event` ajana göre uygulandı → **anon HTTP ile doğrula** (yalnız başlık/tarih/şehir, `user_id`/e-posta/iletişim **dönmez**; pending ve geçmiş etkinlik yok). Sonra yalnız `DirectoryResultCard`. Eşleme `events.user_id ↔ catalog_item_managers.user_id`; şehir eşleşmesi `catalog_search_normalize()`. Mutasyon ≥ 5.

## A8 · B11 — Balon revizyonu + rehber taslakları — ✅ balon, ⏳ rehberler  
*Kaynak: 01 §2.5 · 02 §2.5.* Gemini kalır (`providers.ts`'e dokunma).
- **Balon:** ziyaretçi "Giriş yap, sorularını yanıtlayayım 👋", üye "Platform hakkında soracakların olursa buradayım! 👋"; `useAuth`'tan oturum; panel kendiliğinden **açılmaz**; `sessionStorage` patlarsa sessiz; fake-timer testleri + mutasyon ≥ 4.
- **Rehberler:** mevcut 3 taslağı **koda karşı** doğrula (ekran etiketleri birebir, uydurma buton yok, fiyat/söz yok, ziyaretçi gözüyle sızıntı kontrolü); **eksik 4. rehber: Rol Talepleri** (yalnız bugün çalışan akış). Dosya adlarını bot kaynağı `docs-member` ile uyumlu kontrol et. `ai:ingest`/`embed` **çalıştırma** (canlı bilgi tabanına yazar; `npm --` tuzağı) — kullanıcı yapar; CV paylaşımı ve silme rehberi içeriği ilgili özellik canlıya çıkana kadar dışarıda. Burak düzeltmesi → §B12.

## A9 · Küçük işler — ✅ TAMAM  
- **G17 QA SQL'i:** `supabase/qa/g17-health-score-reports-acceptance.sql`'e "kuyruk penceresi şikayet kalemini değiştirmez / rapor penceresi değiştirir / 91 gün önceki `upheld` kırmaz, 89 gün kırar / `open`·`rejected` kırmaz" senaryosu (çalıştırma).
- **Örnek ilan:** seed (6 ilan) uygulandı denmiş → `[ÖRNEK]` olmayan satır yok mu ölç; `/ilanlar` (+gerekirse detay) `DEMO_ROUTES`'ta mı bak (path `App.tsx` ile birebir; `demo-pages.test.ts` yeşil); silme SQL'i seed'in tersi (`docs/operations/2026-10-05-ornek-ilan-seed.sql` yoksa yaz, çalıştırma).
- **`types.ts` borcu:** yeni RPC'ler tiplerde yok, kodda `as never` → yeniden üret (Management API; yol: `SUPABASE_ACCESS_TOKEN` gerekir, yoksa §B9).

## A10 · SEO/GEO — 3 AI keşif dosyası — ✅ TAMAM  
*Kaynak: 03.* Dal `seo-geo-fixes`. `public/ai/summary.json` · `public/ai/faq.json` (**`index.html`'deki FAQPage'den betikle üret**, elle yazma — Türkçe harf düşer) · `public/.well-known/ai.txt`. Mevcut dosyayı ezme, "164 ülke/8,8 milyon" rakamı yok, `geo fix --apply`/sabit canonical/robots/llms yeniden üretimi **yapılmaz**. Yalnız bu 3 dosyayı pathspec'le commit et. `npm run build` → `dist/` altında üçü var mı; `nginx.conf.template`'te `/ai/` ve `/.well-known/` SPA fallback'ine düşmüyor mu **oku, değiştirme**. Deploy sonrası `geo audit` önce 61 / sonra (beklenen +3–6). `PYTHONUTF8=1` şart. Not: dosya içerikleri onaylandı (03'te yazılı) ama commit'ten önce yine de göster.

---

# BÖLÜM B — KARAR / HESAP / İZİN BEKLEYENLER (büyükten küçüğe)

> 🔴 **Sırayı bozan not:** B1 (secret/geçmiş) büyüklüğüne göre başta; **aciliyeti de en yüksek** olan o. Diğerlerinden bağımsız, hemen yapılabilir.

| # | Boyut | Konu | Ne gerekiyor | Açtığı iş |
|---|---|---|---|---|
| **B1** | XL | **Güvenlik insan işleri H1–H4 + U01** | **H1:** repoyu private yap → DB parolası döndür → `auth.refresh_tokens`/`sessions` temizle → dump'taki 5 kullanıcıya parola sıfırlama → `git filter-repo --path docs/archive/backups --invert-paths` + force-push → GitHub Support cache temizliği → KVKK/GDPR bildirim değerlendirmesi. **H2/U01:** service_role (yeni `sb_secret_`'a geç, eski JWT kapat), DB parolası, 2 PAT, WhatsApp token, `RAG_API_SECRET`, admin parolası; sonra yerel `refs/original` + `reflog expire` + `gc`. **H3:** SQL'leri sen uygula + `check:migrations`. **H4:** edge deploy. | A2 SG1'in geçmiş tarafı |
| **B2** | XL | **Stripe / gerçek Premium (U11, S01–S04)** | S01 hesap · **S02 🔴 vergi rejimi (profesyonel teyit)** · S03 99 € tek seferlik mi yıllık mı · S04 para birimi/ülke. Bugün Premium = admin elle açar (karar B1). | `/pricing`, A4/A5 yetkilerinin otomatikleşmesi |
| **B3** | L | **Rol yapısı — Excel "Açık Noktalar"** | Doktor/Diş Hekimi/İK/Güzellik taslağı · sektör etiketi · kod göçü · **yeni alt roller için yeni `roles` satırı gerekir mi?** (cevap gelmeden açılmaz). `catalog_item_tags` uymazsa uzmanlık deposu kararı. | R2 tam, R3 (uymazsa), R4 tam |
| **B4** | L | **Güvenlik "dur ve sor" kapıları** | SG0'da istemciden çağrılan revoke adayları · `notifications` doğrudan INSERT varsa tetikleyici/RPC'ye taşıma · `whatsapp_landings` eski INSERT politikasının kaldırılması (yeni bundle yayında olunca) · `send-phone-otp-hook` anahtar/pepper ayırma (**mevcut şifreli veriyi bozar**, geçiş planı) · anonim form tablolarında kolon grant'i · `job_listings` (O10) politika kaldırma (önce okumaların RPC üzerinden olduğu doğrulanmalı) · `_shared/emails/event-published.ts` eklenmesi (başka oturumun dosyası) · Deno yoksa O7 | SG2–SG5, SG9, SG10 kalanı |
| **B5** | L | **SMS/WhatsApp telefon OTP (parkta)** | Önce **Meta Business Verification** (yalnız WhatsApp için değil) → şablon `corteqs_otp` → migration `…400000` → secret'lar (`WHATSAPP_OTP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE`, `…_LANG`, `SEND_SMS_HOOK_SECRET`) → `send-phone-otp-hook` deploy (`--no-verify-jwt`) → Dashboard hook + SMS OTP Expiry 300 sn → uçtan uca. Yedek: Twilio SMS (A) / Verify WhatsApp (B). Bot ile aynı numara → OTP'ye cevap bot yanıtını tetikler (tasarım sorusu). Canlıda ölçülmedi: hook hata biçimi, `new_phone`, `+`'sız telefon, zaman aşımı. | G04–G05, telefon doğrulama |
| **B6** | M | **G14 (5 karar) + G16 politikası** | Kendi grubuna şikayet yasak mı · tek onay = tek ihlal mi · onaydan sonra grup gizli mi kalsın · mail gitsin mi · sebep→kırmızı çizgi eşlemesi. **G16:** `group_reports` yalnız gruba karşı şikayet tutuyor; "şikayet almamış üye" ne demek? | G14/G16/G17 tamamlanması |
| **B7** | M | **Arama verisi kararları (B12 kalanı)** | **241 konsolosluk kaydının hepsi `pending_review`** → doğrulanıp yayınlansın mı? · **Cadde gönderisi arama gizlilik kuralı** (yalnız herkese açık, silinmemiş, banlı olmayan; PII'siz kolon) onayı. | A6'nın konsolosluk ve Cadde kolları |
| **B8** | M | **Canlıda yazma işleri (ayrı onay)** | Bekleyen etkinliklerin toplu yayını (önce sayım sonucunu gör, çok çıkarsa karar) · gerçek hesap silme **yalnız test hesabı + yedekle** · haftalık şehir özetinin gerçek üyelere açılması | A1.4, A4 |
| **B9** | M | **Canlı DB / deploy / secret kapısı (izin)** | Migration uygulama sırası (hepsi önce `supabase/qa` kabulüyle, geri alınan işlemde; `psql -f` ledger satırı yazmaz → elle ekle; sonra `check:migrations`): `…400000` OTP · `…500000` G17 · `…600000` A4 · `…700000` ilan kotası · `…800000` ruhsat · `…900000` etkinlik · event_published + search_events · (A5 yeniden yazılınca CV) · (Cadde reactors §B11 kararıyla). **Edge deploy:** `member-cv-link` (A5 sonrası), `send-phone-otp-hook`, `whatsapp-autoreply` (W06 kararı); `check:functions`. **Frontend deploy** (G14/OTP kartı/A-batch ekranları o zamana kadar görünmez) + `curl -I`, konsolda CSP, `verify:release`. Canlı ölçümler: P06 Türkçe collate, A09a/A11/Radar yeniden ölçüm, U01 §4 SQL'i, G10 geri alma deneyi, G14 deadlock iki-oturumlu deneme. Her migration'dan önce **canlı şemada ölç**. | A1.2, A9 types |
| **B10** | S | **Küçük onaylar** | G10c (eski kolon düşürme: `…g10c-onay-talebi.md`) · K01 · K04 · K05 · K07 (kod işi olmayan kararlar) | |
| **B11** | S | **Plansız Cadde "kimler beğendi" işi** | `CaddeReactionActorsPopover` + `cadde-api/types` + `…150000_cadde_post_reactors_list.sql`: ayrı commit mi, geri al mı, yoksa plana mı alınsın? (A1.9 raporu hazır olunca) | |
| **B12** | S | **Veri / dış sistem / içerik** | AI Legion kategorisi (`meslek-kariyer`/`hobi-kultur`) · TED InnoVenture konumu · U03 iki gerçek mail testi · U08 (G03 sonrası dönüşüm gözden geçirme, 2 hafta sonra) · WhatsApp **botu** U09/W02/W07/W08 (Meta webhook + gerçek telefon kanıt turu) · **Burak'ın rehber düzeltmesi** (A8) + ingest izni | A8 |

---

## Kapsam dışı (sorulmadan yapılmaz)
`whatsapp_landings` INSERT politikasının kaldırılması · anonim form tablolarının yeniden tasarımı · `WHATSAPP_APP_SECRET` türevli anahtar ayırma · Stripe · canlı DB yazma · secret rotasyonu · git geçmişi yeniden yazma · landing/dizin tek kaynak (B8c; yeni rol yapısı çalıştıktan sonra ayrı plan).

## Bilinen tuzaklar (kısa)
Vitest "Timeout waiting for worker" → `--maxWorkers=2` + cwd büyük harfli `C:` · `npm run lint` ~35 hata `corteqs-ekstre-motoru/` + `whatsapp-autoreply`'den (bizim değil) · `npm run build` `public/sitemap.xml`'i değiştirir → `git checkout -- public/sitemap.xml` · satır sayısı `(Get-Content f).Count` (`Measure-Object -Line` boş satırı saymaz) · `ajan-turu-2026-10-05` etiketi `origin`'e gitti (zararsız; istenmezse `git push origin :refs/tags/ajan-turu-2026-10-05`).

