# Plan — 8 ürün isteği (footer · belgeler · asistan balonu · etkinlik akışı · arama · AI bot · revizyon editörü · tehlike bölgesi)

> Numaralandırma önceki planın (`2026-10-05-birlesik-plan-cv-ilan-rol-talepleri.md`, A1–A8 / B1–B8) devamıdır: bu planın batch'leri **A9–A16** ve **B9–B13**; kimlikler tekildir.

Kural: **Bölüm A** = karar/onay gerektirmeyen batch'ler, küçükten büyüğe. **Bölüm B** = karar/onay gerektirenler, en sona.
Her batch ayrı commit; push yok. Önceki birleşik plan (CV/ilan + Rol Talepleri) `docs/plans/2026-10-05-birlesik-plan-cv-ilan-rol-talepleri.md`'de, bu plandan bağımsız.

## Yapılmış mı? — kontrol sonucu (kod + git + commit'siz diff okundu; canlı DB/deploy ÖLÇÜLMEDİ)

| İstek | Durum | Kanıt |
|---|---|---|
| Footer'a Global linki | **YAPILMAMIŞ** | `qualtronsinclair` / "CorteQS Global" kodda yok; yer: `Footer.tsx:143` sonrası |
| Belgeler: ruhsat/lisans alanı | **YAPILMAMIŞ** | ruhsat/lisans yükleme yok; CV/sunum deseni net (`useProfileDocuments.ts`, `profile-attribute-keys.ts`) |
| Asistan konuşma balonu | **YARIM + İSTENENLE UYUŞMUYOR** | Başkasının COMMİTSİZ diff'i (`AssistantBubble.tsx`, "B40") 2 sn sonra **tam sohbet panelini kendiliğinden açıyor**; balon, metin, fade/scale, tıklayınca açma yok; mobilde panel (`w-[min(92vw,26rem)]`) ilk ziyarette açılıyor = gerileme riski |
| Etkinlik otomatik onay | **YAPILMAMIŞ (ters yönde)** | `create_event_v1` ilk etkinliği `pending` yapıyor (`20261003010000_events_first_approval.sql:174-210`) → listede görünmüyor, kullanıcı "kayboldu" sanıyor |
| Etkinlik gönderim sonrası yönlendirme | **YOK** | `CreateEventFormSection.tsx:232-265` toast + form sıfırlama, `/events`'te kalıyor |
| "Etkinliğiniz onaylandı" maili | **YOK** | outbox CHECK listesinde tür yok (`20261004120000_user_city_follows.sql:76-90`) |
| Panelde Etkinlikler sekmesi | **VAR** | `MyEventsPanel.tsx`, `PremiumProfileTabs.tsx:108`, `profile-sidebar-menu.tsx:101`; eksik: "şimdi paylaşın" vurgusu |
| Ön kartta "Etkinliği Var — Tarih — Başlık" | **YOK** | `has_event`/`next_event` repoda sıfır |
| Paylaşım düğmeleri | **VAR** | `EventShareButtons.tsx`, `event-share.ts` (WhatsApp/LinkedIn/X/FB/kopyala) |
| Saat dilimi | **YAPILDI** | `20260920140000_events_timezone.sql`, `events-timezone.ts` |
| T1 RLS (doğrudan `published` yazma) | **KAPALI** | `20261003020000_events_rls_status_guard.sql` |
| Ana sayfa arama | **KISMEN** | anon dizin + blog + /tools araması canlı; **etkinlik/rehber/sayfa/Cadde araması yok**; hata yutuluyor (`DirectoryPage.tsx:210-213`) |
| AI bot (Gemini RAG) | **VAR, canlı v19** | `site-assistant`, `AssistantBubble` kök mount (`App.tsx:348`); **Anthropic sağlayıcısı yok** (`providers.ts:150-153` yalnız gemini+groq) |
| Revizyon editörü sekmede kapanıyor | **KÖK NEDEN BULUNDU** | `useAdminAccess.ts:37-58` her auth olayında `setStatus("checking")` → `AdminAccessGate` tüm paneli söküyor (`:143-148`) |
| Profili kalıcı sil | **YOK** | silme RPC/edge function yok; üyelik şartları "silebilir" diyor (`TermsOfService.tsx:67`) |
| "Revizyon editörü" taslak saklama | **YOK** | form'da localStorage yok |

Ölçülmeyenler: canlıda `pending` kalan `events` satırı, `site-assistant` canlı sırları/deploy, embedding durumu.

## Ortak doğrulama (her batch sonu)
`npx tsc -p tsconfig.app.json --noEmit` · `npm run test` (tam) · `npm run verify:text` (eksik Türkçe harfi yakalamaz, gözle bak —
arayüz metni Türkçe karakterli) · `npm run check:migrations` (ledger ELLE) · `npm run ingest:tools:check` (`src/lib` eklendiyse) ·
`npm run check:dead`. Migration: damga `ls supabase/migrations/applied` ile çakışmasız; kabul önce KIRMIZI sonra yeşil; geri alınan işlem;
mutasyon. Edge function: commit ≠ canlı → ayrı `supabase functions deploy` + `check:functions`.

---

# BÖLÜM A — Onay gerektirmeyenler (küçükten büyüğe)

### A9 · Footer Global linki (çok küçük)
- `src/components/Footer.tsx`: telif div'inin (`:134-143`) hemen altına, `</footer>`'dan önce ortalanmış tek satır
  `<a href="https://corteqsglobal.qualtronsinclair.com/?utm_source=corteqs.net&utm_medium=footer" target="_blank" rel="noopener noreferrer">`
  metin "🌍 CorteQS Global – Coming to every diaspora →", küçük gri (`text-xs text-muted-foreground underline underline-offset-[3px]`, `mt-2.5 text-center`).
- `footerLinks.ts`'e KOYMA (13'lük tek satır yasal kilit). `FooterSection.test.tsx`'e href + `rel` + `target` iddiası.
- Kabul: test; tarayıcıda görünüm kanıtlanamaz.

### A10 · Asistan balonu (küçük) — ⚠️ başkasının commit'siz diff'i
- Başlamadan `git status`/`git diff -- src/components/AssistantBubble.tsx`: diff hâlâ commit'siz ise sahibine sor/koordine et;
  commit'liyse üstüne çalış. Şu anki davranış (2 sn sonra paneli aç) **geri alınır**.
- Yeni: ayrı `showHint` durumu (panel `open` değil). Simgenin yanında küçük balon, metin "Platform hakkında soracakların olursa buradayım! 👋",
  `max-w-[min(70vw,16rem)]`, `transition-all` opacity+scale; ~2 sn sonra kendiliğinden kapanır; balona tıklayınca `setOpen(true)` + gizlenir;
  kullanıcı simgeye önce tıklarsa gizlenir. `sessionStorage` anahtarı (`corteqs_assistant_welcome_shown`) balon gösterildiğinde yazılır;
  erişim hata fırlatırsa balon gösterilmez. Kök mount olduğundan rota geçişinde tekrar etmez.
- `AssistantBubble.test.tsx`: fake timers ile (gösterim → 2 sn → kapanış), tıklayınca panel, ikinci mount'ta gösterilmez, sessionStorage patlarsa sessiz.

### A11 · Revizyon editörü sekme değişince kapanmasın (küçük-orta)
- Kök neden: `useAdminAccess.ts` `syncSession` her `onAuthStateChange` olayında `setStatus("checking")` yapıyor; `AdminAccessGate` `checking`
  iken yükleme ekranı dönüp tüm paneli (açık Dialog + durumu) söküyor. Sekme görünür olunca supabase-js auth olayı yayınlıyor.
- Düzeltme: aynı kullanıcı zaten `authorized` ise `nextSession.user.id` karşılaştır, `checking`'e DÜŞME, yalnız oturumu güncelle
  (token yenilenmesi/aynı kullanıcı olayını yut). Farklı kullanıcı/çıkışta eski davranış.
- Test (şu an `useAdminAccess` testi yok): authorized iken aynı kullanıcı için `TOKEN_REFRESHED`/`SIGNED_IN` olayı → çocuklar sökülmez; farklı kullanıcı → `checking`.
- Kök neden **kod okumasıyla** çıkarıldı, yeniden üretilmedi: kabul = test + raporda "tarayıcıda doğrulanamadı".
- Ek (isteğe bağlı küçük): revizyon formu taslağını `sessionStorage`'a yaz (sökülme olursa kaybolmasın).

### A12 · Belgeler sekmesine "İşletme Ruhsatı / Meslek Lisansı" (orta, migration)
- CV/sunum deseni birebir: anahtar `business_license_doc` (+ bucket sabiti `PROFILE_LICENSE_BUCKET="profile-license-files"`) `profile-attribute-keys.ts`
  + `SPECIAL_PROFILE_ATTRIBUTE_KEYS`; `security.ts` `validateLicenseFile` (pdf/jpg/png, boyut sınırı bucket'la AYNI — kovanın sınırını aşma);
  `useProfileDocuments.ts` üçüncü yükleme; `ProfilePage.tsx:608` grid'e üçüncü `ProfileDocumentCard` + gizli input (`:410`).
- Migration: `afs_attributes` satırı (`storage_strategy=private_storage`, json); **78 aktif rol için `role_attributes` kuralı**
  (kuralsız alan sessizce çizilmez — CLAUDE.md profil formu md.1); özel bucket + CV'dekiyle aynı 8 politika (sahip okur/yazar, admin okur/siler);
  MIME dar liste (`application/octet-stream` YOK, MIME uzantıdan verilir). Özellik anahtarı `profile.license_upload` (`features.ts` + `afs_features` +
  tüm aktif rollere AÇIK `role_features` satırı; kapalı bırakırsan herkese gizlenir).
- Dosyalar yalnız imzalı bağlantıyla açılır (`createSignedUrl`), `getPublicUrl` yok. Gizlilik: yalnız sahip + admin (arayüz metni buna uygun).
- Testler: `ProfilePage.test.tsx` (cv_doc/presentation_doc örneği `:424/:442`), `features.test.ts`, `security` testi; bucket sınırı ⇄ istemci sınırı sözleşme testi
  (`career` kovasındaki desen).
- Canlıya uygulama ayrı adım (migration `psql -f` + ledger).

### A13 · Etkinlik: otomatik onay + gönderim sonrası yönlendirme (orta-büyük, migration)
- Karar verildi ("zaten onaylayalım", üye olma şartı SQL'de zaten var `event_auth_required`).
- Yeni migration: `create_event_v1`'i `create or replace` ile değiştir — üyeye `status='published'`, `approval_source='auto'`;
  `approval_requests(event_create)` yazımını kaldır; ürün anahtarı `event_settings` `events.first_approval_required=false` (SQL update ile geri alınabilir).
  Aktif limit (2) ve `event_date >= current_date` kuralı **aynen kalır** (değiştirilmedi).
- Canlıda hâlâ `pending` kalan `events` satırlarını ÖNCE ölç; varsa yayınlama ayrı, geri alınabilir tek işlem (`event_status.via_rpc` bayrağıyla) — onay maili
  göndermesin (`corteqs.skip_*` bayrağı desenine bak).
- `AdminApprovalsPage`'den `event_create` onayının etkinliği yayınlamadığı kusuru: otomatik onayla yeni satır oluşmaz; eski `pending` talepleri için
  `admin_review_approval_request` `event_create` dalı etkinliği de yayınlayacak şekilde düzeltilir (ya da kuyruk boşaltılır) — hangisini seçtiğini raporla.
- Sözleşme testleri güncellenir (bilinçli, gevşetme değil): `events-first-approval-schema.test.ts`, `events-first-approval.test.ts`, `events-rules.ts` aynası,
  `EventAttendeeButton.test.tsx:118` kaynak sözleşmesi. Metinler: `CreateEventFormSection.tsx:232-242` + `:296`, `MyEventsPanel.tsx:148/:160`,
  `EventDetailPage.tsx:246`, `events-vocabulary.ts:133`; CLAUDE.md "ilk etkinlik onay" ifadeleri ve `KALANLAR.md:189`.
- Gönderim sonrası: toast + **etkinlik detay/panele yönlendirme** (`/profile` Etkinliklerim sekmesi; `?tab=events` desteğini ÖNCE doğrula, yoksa ekle).
  Giriş yapmamış akış (OAuth sonrası taslak geri yükleme `:88-115`) çalışmaya devam eder; dönüşte "etkinliği gönder"e otomatik basılmaz (kullanıcıya açıkça söyle).
- Kabul (`supabase/qa/...-acceptance.sql`, geri alınan işlem): üye etkinliği doğrudan `published`; `approval_requests` satırı oluşmaz; aktif limit 2 hâlâ çalışır;
  anon/üye olmayan `event_auth_required`; doğrudan `status='published'` INSERT yine reddedilir (T1 korunur). Mutasyon ≥5.

### A14 · "Onaylandı, şimdi paylaşın" arayüzü (küçük-orta)
- `MyEventsPanel.tsx`: yeni yayınlanmış etkinlikte vurgulu şerit ("Etkinliğiniz yayında — şimdi paylaşın") + mevcut `EventShareButtons`.
- `EventDetailPage.tsx`: `?share=1` ile gelen sahibe paylaşım bölümünü öne çıkar/kaydır (mail linki buraya gelecek). Yalnız `published`'da çizilir (mevcut kural).
- Test: şerit yalnız yayınlanmış + sahibe; `?share=1` varken paylaşım bölümü vurgulu.

### A15 · "Etkinliğiniz yayında" e-postası (büyük — beş parçalı hat)
- CLAUDE.md kariyer md.8 kuralı: biri eksikse hata yok, mail gitmez. Migration: `notification_email_outbox` **CHECK listesine** yeni tür (`event_published`;
  son liste `20261004120000_...:76-90`, dinamik ad bulma deseni `...110000:26-51`), `notification_settings` anahtarı `email.event_published.enabled`,
  enqueue: `create_event_v1` (yayın anında) **ve** `pending→published` DB trigger'ı (admin yolu da kapsansın); alıcı e-postası **enqueue anında SQL'de** `auth.users`'tan
  (edge'de auth admin API canlıda 401 verdi), `dedupe_key='event_published:'||id`, `poke_notification_dispatcher()`.
- Edge `send-notification-emails`: `SETTING_KEY_BY_EVENT`, `EventType`, `buildEmail` kolu, `directEvents` (+ `:527-532`); yeni `_shared/emails/event-published.ts` (+ test,
  `recommendation-match.ts` deseni). Maile dosya yolu/imzalı bağlantı KONMAZ; link `https://corteqs.net/events/<id>?share=1` (`buildEventShareUrl` biçimi).
- Saat dilimi: `src/lib` Deno'dan import edilemez → şablonda ayrı küçük hesap (`eventTimezoneLabel` mantığı).
- Toplu işlemde `corteqs.skip_*` bayrağı: A13'teki eski `pending` yayınlaması mail üretmesin.
- Kabul: aynı etkinlik için tek satır (dedupe), admin yolu + RPC yolu ikisi de satır üretir, CHECK reddi olmaz, ayar kapalıyken satır oluşmaz.
  Edge deploy ayrı adım; gerçek e-posta teslimi **kanıtlanamaz** (U03 gönderen doğrulaması).

### A16 · Ana sayfa araması: eksik içerik türleri + hata görünürlüğü (büyük)
- Mevcut: `search_public_content` blog+tool döndürüyor (`public-content-search.ts:4,71` yalnız iki tür). Etkinlik ve diğerlerini ekle:
  `search_public_content`'e `event` dalı (yalnız `published`, `event_date >= current_date` + yakın geçmiş), tür birleşimi + doğrulayıcı + `/directory` UI bölümü.
  Anon'a açık ise yalnız PII'siz kolonlar (başlık, tarih, şehir, kapak); iletişim/`user_id` DÖNMEZ.
- **Sessiz boş dönüşü kapat:** `DirectoryPage.tsx:210-213` blog hatası boş listeye çevriliyor; `catalog-directory.ts:331-355` sessiz lexical fallback —
  hata görünür (kullanıcıya "arama şu an çalışmıyor") + `reportClientError` bağlantısı (mevcut `directory_search_semantic_fallback` kaynağını kullan, yeni kaynak = migration).
- ÖNCE canlı ölç (psql, küçük sorgular — 1 GB RAM kuralı): `pg_get_functiondef('search_directory_catalog')` gövdesi 22.09 placeholder filtresini taşıyor mu (13.09 ↔ 22.09
  migration ping-pong'u); örnek aramalar ("doktor", "etkinlik", "berlin") kaç satır dönüyor — **"boş dönüyor"un gerçek nedeni ölçülmeden kod yazma.**
- Kabul: "etkinlik" araması yayınlanmış etkinlik döndürür; hata durumunda ekranda mesaj; 1 karakter kuralı korunur; `npm run ingest:tools:check`.

---

# BÖLÜM B — Karar / onay gerektirenler (sona)

### B9 · Etkinlik teyitleri (kısa soru turu)
- Aktif limit (2) ve otomatik onayda **spam/kötüye kullanım** için ek önlem (örn. günlük etkinlik tavanı, link/metin tarama)? Plan: limit aynen, ek önlem yok.
- Canlıda `pending` kalan etkinlikler toplu yayınlansın mı (ölçüm A13'te)?
- Rol kapsamı: otomatik onay tüm üyeler mi (ilk etkinlikte bireysel dahil), yoksa şimdilik "ilk etkinlik" ayrımı korunup yalnız kaldırılıyor mu?

### B10 · Ön kartta "Etkinliği Var — Tarih — Başlık" (migration + anon yüzey)
- Hangi yüzey: dizin sonuç kartı (`DirectoryResultCard.tsx`) mı, public profil (`PublicProfileShell.tsx`) mi, ikisi mi? (Karar.)
- Veri: kullanıcının en yakın `published`, `event_date >= today` etkinliği. Anon'a açık yeni view/RPC (örn. `public_member_next_event`) =
  **yeni herkese açık yüzey** (P03 anon iletişim filtresi dersi: yalnız PII'siz kolon; `user_id`/e-posta dönmez); `events.city` serbest metin.
  Eşleme `events.user_id ↔ catalog_item_managers.user_id` (M22 join deseni `20261004110000:185-193`). Alternatif: arama dokümanına alan (daha ağır).
- Kabul: anon HTTP isteğiyle yalnız yayınlanmış etkinlik görünür; geçmiş/pending görünmez; PII yok; mutasyon ≥5.

### B11 · AI bot hibrit (site verisi + Claude) ve panel içi eğitim (büyük, harici sır + maliyet)
- Mevcut canlı bot Gemini RAG; "Claude" için: `providers.ts`'e `callAnthropic` + `AI_PROVIDER=anthropic` (`resolveProviderName` bilinmeyen değerde yüksek sesle düşer — dokunma),
  `ANTHROPIC_API_KEY` secret (**değer kullanıcıda**, sohbete/log'a yazılmaz), `normalizeAssistantUsage`'a `input_tokens`/`output_tokens` (yoksa kullanım 0 yazılır).
  Retrieval Gemini embedding 1536 KALIR (boyut/model değişmez). Maliyet: dolar bazında ölçüm yok, 30/10 dk sınırı var → karar: aylık tavan?
- Panel içi eğitim: bugün `docs/guides/` 16 dosya, çoğu rol/yetki/yönetici; "neyi nerede/nereye reklam/evrak yükleme" rehberi YOK → **içerik üretimi ayrı iş**
  (kullanıcının payal'da kazıdığı içerik repoya aktarılacaksa kaynağı/telifi onaylanmalı); `docs/guides/` altına konup `node scripts/ai-knowledge/ingest.mjs --source=docs-member`
  + `ai:embed` (npm `--` bayrak tuzağı). Sistem prompt'una "panelde yol göster" modu (`payload.page` zaten var).
- Kapsam notu: bot **girişli üyeye** çalışıyor (anon 401, ziyaretçiye `GUEST_MESSAGE`); "yeni ziyaretçiye balon" (A10) giriş yapmamışa sohbeti açmaz — ürün kararı: ziyaretçi de konuşabilsin mi?
- Canlı doğrulama (sır, deploy, embedding durumu) ölçülmeden "çalışıyor" denmez; gerçek Claude yanıt kalitesi **kanıtlanamaz** (anahtar yoksa).

### B12 · Arama kapsamı genişletme (karar)
- Rehberler (B-3), konsolosluklar (241 satır, hepsi `pending_review`, yayında değil), Cadde gönderileri, sayfalar: hangileri aranabilir olsun? (Veri yoksa/yayında değilse eklenmez — "verisiz çip ekleme" kuralı.)

### B13 · Profili kalıcı sil / Tehlike Bölgesi (geri alınamaz — açık onay şart)
- Bugün silme mekanizması YOK (ne RPC ne edge function; KVKK m.7 ve GDPR m.17 metinlerde vaat ediliyor).
- Güvenli tasarım (uygulanmadan önce onay): arayüz "Tehlikeli Bölge" kartı (yazılı onay "SİL" + yeniden doğrulama) → edge function `delete-account`
  (JWT doğrula, service role, `auth.admin.deleteUser`) → önce **engel kontrolü RPC'si** (tek sahibi olduğu grup, yönetici/moderatör rolü, açık abonelik).
- Engelleyen yabancı anahtarlar (ölçüldü): `ON DELETE RESTRICT` — `vip_invitations.created_by`, `platform_safety_core`, `contributor_resource_submissions.submitted_by`,
  `group_strikes.decided_by`; NO ACTION — `cadde_cafe_members.approved_by`, `cadde_moderation_queue.resolved_by`, `cadde_promotion_campaigns.approved_by`,
  `cadde_promotion_events.viewer_user_id`, `cadde_user_bans.created_by`, `survey_responses.respondent_user_id`, `surveys.approved_by/created_by` (+ ~9 sayılmadı).
  → `SET NULL`'a çevir ya da silmeden önce anonimleştir (karar). Depolama temizliği (`${uid}/…` tüm kovalarda), `catalog_items.linked_user_id/created_by`,
  Cadde/grup içeriği: **anonimleştirme mi sert silme mi** (hukuki saklama + üçüncü taraf referansı) — KARAR.
- Silme günlüğü: kişisel veri içermeyen `account_deletion_log` (hash'li kimlik, zaman). Geri alınamaz olduğundan canlıda test edilmeden önce **test hesabı + yedek**; asla gerçek üyeyle.
- Kabul: işlem-içi SQL testi (engel var → reddedilir, engel yok → kayıt silinir, yetim satır yok) + bileşen testi; gerçek `auth.admin.deleteUser` canlıda **ayrı onayla**.

## Kapsam dışı
Stripe, CV/ilan Premium kilidi ve Rol Talepleri (diğer plan), şirket ilan formu, gerçek e-posta teslim kanıtı, payal içeriğinin repoya toplu aktarımı.

## Uçtan uca doğrulama
Üye etkinlik gönderir → doğrudan yayında → `/events/:id` ve profil panelinde "şimdi paylaşın" → mail (outbox satırı) → arama "etkinlik" sonucu döner.
Yeni ziyaretçi: balon ~2 sn → kapanır → tıklayınca sohbet. Admin: revizyon editörü açıkken sekme değiştir → kapanmaz. Footer linki yeni sekmede açılır.
Tarayıcı QA, gerçek mail teslimi, Claude yanıt kalitesi ve canlı deploy **kanıtlanamaz**; raporda açıkça yazılır.
