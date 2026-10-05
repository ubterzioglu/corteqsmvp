# TUR 1 — ajan planı (V · 2.2 · 2.4 · 2.5 · 2.9)

> Kaynak: `docs/plans/2026-10-05-tek-plan-kalan-isler.md` (kararlar §1, işler §2). Bu dosya yalnız **Tur 1**'in
> uygulanabilir, ölçülmüş ayrıntısıdır. Tur 2 (B2 CV, rol zinciri, B10, B12, B13) **V temiz çıkmadan başlamaz.**
> Her batch ayrı commit; **push yok**; canlıya yazma/deploy/migration uygulama **yok**.

## Durum fotoğrafı (5 Ekim akşam, ölçüldü)

- 25 dosya değişik + 24 izlenmeyen dosya var, **A-batch commit'i yok.** 7 yeni migration dosyası uygulanmamış.
- **A-batch'lerin hiçbiri için kabul SQL'i (`supabase/qa/…`) yok** — `ls supabase/qa`: son dosyalar OTP/G17/G14. Planın "kabul önce KIRMIZI sonra yeşil" şartı karşılanmamış.
- `src/pages/ProfilePage.tsx` **833 satır** (sınır 800; ben 800'de bırakmıştım, A1/A12 işleri 33 satır eklemiş).
- `package.json`: **`xlsx@^0.18.5` devDependency** eklenmiş (A5 betiği için); `package-lock.json` +115 satır.
- İki migration **15 haneli** damgalı: `202610051000000_event_published_notification.sql`, `202610051100000_public_content_search_events.sql`.
- Planda olmayan iş: `CaddeReactionActorsPopover.tsx` + `cadde-api.ts`/`cadde-types.ts` + `20261005150000_cadde_post_reactors_list.sql` ("kimler beğendi" listesi).
- A13 migration'ı (`20261005900000`) en altta **bekleyen etkinlikleri migration içinden toplu yayınlıyor** (`approval_source='backfill_auto'`) — B9b ile çelişir (§V3).
- Balonda (`AssistantBubble.tsx`) ziyaretçi/üye ayrımı yok; tek metin (§2.5).
- Etkinlik sözleşme testleri (`events-first-approval*`) değişmemiş (§2.4 doğrulayacak).

---

## V · A1–A16'yı bağımsız doğrula, düzelt, commit'le  *(ilk iş)*

Amaç: "tamamlandı" iddiasını **kanıta** çevirmek. Kod yazdığın kişi değilsin; kırmaya çalış, onaylamaya değil.

### V1 · Envanter (kod yok)
`git status` + `git diff --stat` ile her dosyayı bir batch'e eşle; `docs/plans/2026-10-05-tur1-envanter.md` olarak yaz
(tablo: batch → dosyalar → migration → test → kabul SQL var/yok). Eşleşmeyen dosya = "plansız" (Cadde reactors gibi).
Beklenen eşleme (doğrula): A1 `profile-sidebar-menu.tsx`+`ProfilePage.test.tsx` · A2 `Pricing.tsx`+`plans.ts`+testler · A3 `PremiumLockCard*` ·
A4 `features.ts`+`AdminUserOverridesPage.tsx`+`20261005600000` · A5 `role-structure.ts`+`scripts/generate-role-structure.mjs`+`xlsx` ·
A6 (`flat-roles-api*`? **dosya değişmemiş görünüyor → yapılmamış olabilir**) · A7 `20261005700000`+`job-listings-api*` ·
A8 `JobListings*Page.tsx`+`App.tsx` · A9 `Footer*` · A10 `AssistantBubble*` · A11 `useAdminAccess*` ·
A12 `security.ts`+`useProfileDocuments.ts`+`profile-attribute-keys.ts`+`20261005800000` · A13 `20261005900000`+`CreateEventFormSection.tsx` ·
A14 `MyEventsPanel.tsx`+`EventDetailPage.tsx` · A15 `…event_published…`+`event-published.ts`+`send-notification-emails/index.ts` ·
A16 `public-content-search.ts`+`DirectoryPage.tsx`+`PublicContentSearchResults.tsx`+`…search_events`.
**Yapılmamış batch bul** (en az A6 şüpheli): rapora "YAPILMAMIŞ" yaz, uydurma.

### V2 · Migration kapısı
1. **15 haneli iki dosyayı yeniden adlandır** (henüz uygulanmadılar, güvenli): sıra **600000 → 700000 → 800000 → 900000 → 910000 (event_published) → 920000 (search_events)**;
   `ls supabase/migrations/applied | tail` ile çakışma kontrolü. İçerideki yorumlarda eski ad geçiyorsa güncelle.
2. Cadde reactors migration'ı **bu sıraya KATMA**; kendi karar bayrağıyla ayrı tut (§V7).
3. Her migration için oku ve doğrula: `begin/commit`, idempotentlik (`if not exists`/`create or replace`), `security definer` + `set search_path`,
   `revoke … from public, anon` + doğru `grant`, RLS, `role_features` satırı **her aktif rol için** (`A4`: `false`; `A12`: `true`) — sayıyı yazmadan önce **dosyadan/şemadan türet, uydurma**.
4. **Eksik kabul SQL'lerini YAZ** (çalıştırma — canlı DB izni yok): `supabase/qa/` altında geri alınan işlemde (`begin … rollback`), assert'li, mevcut `phone-otp-claim-acceptance.sql` biçimi örnek:
   `career-premium-features-acceptance.sql` (A4) · `career-listing-quota-acceptance.sql` (A7: 5 farklı ilan açılır, 6.'sı `career_listing_limit_reached`, tekrar açış hak harcamaz,
   `career.listing.view_unlimited` override ile sınırsız, anon detay RPC'sini çağıramaz, `job_listing_views` anon/başkası okuyamaz; **iki oturum yarışı için ayrı not dosyası** `docs/operations/…` — G14 deadlock kılavuzu desenini izle) ·
   `profile-license-acceptance.sql` (A12: bucket sınırı, 8 politika, sahip/admin okur, başkası okuyamaz, MIME listesinde `application/octet-stream` YOK) ·
   `events-auto-approval-acceptance.sql` (A13/B9) · `event-published-notification-acceptance.sql` (A15: tek satır dedupe, RPC yolu + admin yolu, CHECK reddi yok, ayar kapalıyken satır yok) ·
   `public-content-search-events-acceptance.sql` (A16: yalnız `published` + gelecek; anon yanıtında `user_id`/e-posta/iletişim yok).
5. Hiçbir migration'ı uygulama. `npm run check:migrations` uygulanmamış dosyaları drift diye gösterir — beklenen, raporla.

### V3 · A13 bekleyen-etkinlik yayınlamasını migration'dan ÇIKAR (karar B9b)
Kararlar: eski `pending` etkinlikler **yayınlanacak, ama onay maili ATMADAN, önce sayılarak, geri alınabilir tek işlemle.** Mevcut migration (satır ~107–113) bunu migration içinde otomatik yapıyor:
- (a) `events` T1 koruyucusu (`20261003020000_events_rls_status_guard.sql`) doğrudan `status` güncellemesini `event_status.via_rpc` bayrağı olmadan reddeder mi? **Oku**, reddediyorsa migration zaten patlar.
- (b) A15'in `pending→published` trigger'ı her toplu satır için e-posta kuyruğa atar → B9b'ye aykırı; `corteqs.skip_*` bayrağı bu trigger'da **gerçekten** kontrol ediliyor mu? Bayrak adı mevcut desenden (`grep -rn "corteqs.skip" supabase/migrations`).
- (c) Sıra: A13 (900000) A15'ten (910000) önce uygulanır; yine de toplu işlem ayrı olmalı.
Yap: migration'dan toplu `update`'i **kaldır** (yalnız `create_event_v1` + ayar kalsın). Ayrı dosya `docs/operations/2026-10-05-etkinlik-bekleyenleri-yayinla.sql`: (1) `select count(*), min(created_at) from events where status='pending'` (salt okuma, sonucu kullanıcı görsün),
(2) onay istemi yorumu, (3) `begin;` + `set local event_status.via_rpc='on'` + `set local corteqs.skip_…='on'` + update + doğrulama sayımı + `commit`, (4) geri alma SQL'i. **Çalıştırma.**

### V4 · Bağımlılık: `xlsx`
`npm audit` (yalnız rapor; kendi başına `npm audit fix` ÇALIŞTIRMA). SheetJS'in npm'deki son sürümü 0.18.5 ve bilinen güvenlik bulguları var **(bunu `npm audit` çıktısıyla doğrula, ezberden yazma)**.
Betik yalnız yerel, güvenilir Excel'i okuyup `role-structure.ts` üretiyor; çıktı commit'li. Karar önerisi (raporla, kendin sil): devDependency kalabilir **mi**, yoksa betik `npx` ile tek seferlik mi çalıştırılsın. `package-lock.json` farkının yalnız xlsx ağacını eklediğini doğrula.

### V5 · Dosya boyutu: `ProfilePage.tsx` 833 → ≤800
Kural: üretim dosyası 800 satırı geçmez. Eklenen A1/A12 satırlarını ayrı bileşene/hook'a taşı (örn. `ProfileDocumentsGrid`); davranış değişmez; `ProfilePage.test.tsx` değişmeden yeşil kalmalı (özellikle "ilgi alanları kartı HEMEN altında" ve premium düzen testleri).

### V6 · Her batch için kapı + mutasyon + inceleme
Her batch: ilgili testler → `tsc` → `eslint <dosyalar>` → `verify:text` → `check:dead` → `ingest:tools:check` → tam `vitest` (`--maxWorkers=2`).
Her batch'te **≥3 mutasyon** (migration/RPC batch'lerinde ≥5): koşulu boz → test kırılmalı → geri al. Kırılmayan mutasyon = zayıf test → güçlendir.
**Türkçe harf kontrolü gözle** (`verify:text` eksik harfi yakalamaz): örn. `…event_published…` başlığında "Etkinliğiz yayında" yazıyor → "Etkinliğiniz yayında". Kullanıcıya görünen her yeni metni oku.
Özel dikkat: A2 (`/pricing` JSON-LD bozulmadı mı) · A3 (`ProLockedInboxCard` ve testi DEĞİŞMEDİ) · A8 (`/ilanlar` rotası `useSeo`+`canonicalPath`, detay giriş ister `?next=`, sitemap'e detay girmez; hata kodu→Türkçe harita çift yönlü test) ·
A11 (`useAdminAccess`: aynı kullanıcı `TOKEN_REFRESHED`/`SIGNED_IN` → `checking`'e DÜŞMEZ; farklı kullanıcı/çıkış → eski davranış) · A12 (kova sınırı ⇄ istemci sınırı sözleşme testi, `getPublicUrl` yok) ·
A14 (şerit yalnız yayınlanmış + sahibe) · A15 (maile dosya yolu/imzalı bağlantı YOK, link `…/events/<id>?share=1`) · A16 (hata artık sessiz boş dönmez).

### V7 · Plansız Cadde "kimler beğendi" işi
`CaddeReactionActorsPopover.tsx`, `cadde-api.ts`, `cadde-types.ts`, `20261005150000_cadde_post_reactors_list.sql`. **Commit'leme, karar verme.** Yalnız incele ve raporla:
başkalarının hangi bilgisini (ad/avatar/rol?) kime gösteriyor, banlı/gizli profil süzülüyor mu, `diaspora_key` filtresi, Cadde sözleşme testleri (`cadde-rules`, karakterizasyon). Cadde kuralı: CLAUDE.md "Cadde 3.0 Rules". Kullanıcı kararına bırakılır (ayrı commit mi, geri al mı).

### V8 · Commit planı
Interaktif `git add -p` çalışmaz. Aynı dosyaya dokunan batch'leri **birlikte** commit'le (örn. `features.ts` A4+A12; `ProfilePage.tsx` A1+A12+V5), mesajda batch kimlikleri yazılı.
Önerilen sıra (bağımsızdan bağımlıya): A9 → A2+A3 → A11 → A10 → A1 → A5+A6 → A4 → A7+A8 → A12 → A13+A14 → A15 → A16. Her commit: `git add -- <yollar>` + `git commit -m … -- <aynı yollar>`; başkasının dosyası (`.agents/` vb.) ve Cadde reactors **dışarıda**.
**Gate yeşil değilse commit yok.** Gate'i kırmızı olan batch'i commit'leme, raporda "KIRMIZI + neden" yaz.

Kabul (V): envanter dosyası · her batch için kapı çıktıları · eksik kabul SQL'leri yazılı · iki migration yeniden adlandırılmış · A13 migration'ı toplu `update`'siz + ayrı operasyon SQL'i · `ProfilePage.tsx` ≤800 · yeşil commit'ler.

---

## 2.2 · Örnek ilan SQL'i (karar B3b: önce SQL ile örnek ilan)

- Dosya `docs/operations/2026-10-05-ornek-ilan-seed.sql`. **Çalıştırma.** `job_listings` şeması (baseline `:20137`): `user_id uuid NOT NULL` (sahip), `business_name`, `title NOT NULL`, `department`, `employment_type`,
  `location_type`, `country`, `city`, `location`, `salary_min/max`, `currency`, `description`, `requirements`, `package`, `total_price`, `status` (varsayılan `published`), `expires_at`, `hide_business_name`.
- Sahip: psql değişkeni `:owner_user_id` (kullanıcı kendi test/admin hesabının id'sini verir; **e-posta/kimlik uydurma ve dosyaya yazma**). Dosya başında "sahip kimliğini şöyle bul" yorumu.
- 6–8 ilan, **hepsi açıkça örnek**: `title` `[ÖRNEK] …`, `business_name` gerçek bir şirket adı DEĞİL ("Örnek Şirket A"), gerçekçi ama uydurma-olduğu-belli içerik. 1–2 tanesinde `hide_business_name=true`. Çeşitli şehir/ülke (Berlin, İstanbul, Doha…) ve `employment_type`.
- Silme SQL'i (aynı dosyada, `title like '[ÖRNEK]%'` koşulu) + "kaç satır silinecek" önizleme `select`'i.
- **DEMO deseni (CLAUDE.md "DEMO içerik deseni"):** örnek veri varken `/ilanlar` rotası `src/lib/demo-pages.ts` `DEMO_ROUTES`'a **bir satır** olarak eklenir (path `App.tsx`'teki ile BİREBİR; `demo-pages.test.ts` bunu kilitler). Gerçek ilan gelince satır silinir. Detay rotası (`/ilanlar/:id`) için aynı kuralı oku, gerekiyorsa ekle.
- Kabul: `[ÖRNEK]` olmayan hiçbir satır eklenmiyor; seed + silme birbirinin tersi; `demo-pages.test.ts` yeşil; A7 kabulü (V2.4) bu seed ile 5+1 ilan senaryosunu kapsıyor.

---

## 2.4 · B9 hizalama (etkinlik)

Kararlar: **tüm üyeler** (ilk etkinlik dahil, bireysel dahil) hemen `published` · aktif limit **2 aynen** · ek spam önlemi **yok** · eski `pending` etkinlikler maillesiz yayınlanır (V3) · giriş yapmamış → `event_auth_required`.
- `create_event_v1` (A13): üye ayrımı YOK, `published`+`approval_source='auto'`, `approval_requests` yazılmıyor, limit/`event_date >= current_date` korunuyor, **T1** (doğrudan `status='published'` INSERT reddi) bozulmadı — kabul SQL'i (V2.4) bunu da yoklasın.
- Mevcut sözleşme testlerini oku ve **gerçekten güncel mi** kontrol et (`events-first-approval-schema.test.ts`, `events-first-approval.test.ts`, `events-rules.ts` aynası, `EventAttendeeButton.test.tsx` kaynak sözleşmesi): `git status`'ta değişmemişler → ya hâlâ eski migration'ı kilitliyorlar (yeni tanım kilitsiz — `group-health-score` dersi) ya da yeni davranışı yoklamıyorlar. Eski migration'ı kilitleyenleri "geçmiş tanım" diye işaretle ve **güncel migration için ayrı sözleşme bloğu ekle** (bayatlama kapanı: fonksiyonu yeniden tanımlayan en son migration kilitli olsun).
- Kullanıcıya görünen metinler (Türkçe harf kontrolü): `CreateEventFormSection.tsx` (başarı toast'u artık "onaya düştü" DEMESİN), `MyEventsPanel.tsx`, `EventDetailPage.tsx`, `events-vocabulary.ts`. Gönderim sonrası yönlendirme: `/profile` Etkinliklerim sekmesi — `?tab=events` desteğini **doğrula**, yoksa ekle; giriş yapmamış akışta OAuth sonrası taslak geri yüklenir ama "gönder"e otomatik BASILMAZ (kullanıcıya açıkça söyle).
- `CLAUDE.md`'deki "ilk etkinlik onay" ifadelerini **düzenleme** (kullanıcı onayı yok): hangi satırlar bayat olduysa `docs/plans/2026-10-05-tur1-claude-md-onerileri.md`'ye diff olarak yaz.
- Kabul: V2.4'teki `events-auto-approval-acceptance.sql` · güncel sözleşme blokları · mutasyon ≥5 (üye ayrımı geri gelirse, `approval_requests` yazımı geri gelirse, limit gevşerse, T1 gevşerse, anon geçerse).

---

## 2.5 · Asistan balonu + üye rehberi taslakları (karar B11b/B11c)

### 2.5a · Balon (A10) — ziyaretçi/üye ayrımı
- Mevcut hâl (commit'siz diff): panel kendiliğinden **açılmıyor** (doğru), ipucu 2 sn sonra çıkıyor, 5 sn sonra kapanıyor, `sessionStorage` anahtarı `corteqs_assistant_welcome_shown`; ama **metin tek** ve ziyaretçi/üye ayrımı yok.
- Karar: bot yalnız girişli üyeyle konuşuyor (`GUEST_MESSAGE`). **Ziyaretçide** metin: "Giriş yap, sorularını yanıtlayayım 👋"; **üyede**: "Platform hakkında soracakların olursa buradayım! 👋". Oturum bilgisi mevcut `useAuth` (`@/components/auth/useAuth`) — başka yol açma. Test mock yolu bileşenin gerçekten import ettiği yol olmalı.
- Ziyaretçi balonuna tıklayınca mevcut davranış (panel + `GUEST_MESSAGE`) korunur; yeni yönlendirme EKLEME.
- Kabul: fake timer'lı testler — üye metni · ziyaretçi metni · tıklayınca panel + ipucu gizlenir · ikinci mount'ta gösterilmez · `sessionStorage` patlarsa sessiz · 800+ satır yok. Mutasyon ≥4 (ayrım silinirse, panel otomatik açılırsa, anahtar yazılmazsa, metinler yer değiştirirse).

### 2.5b · Üye rehberi taslakları (`docs/guides/`)
Bot `docs/guides/` içindeki dosyaları **üye** kitlesine okutur (`scripts/ai-knowledge/sources.mjs` `docs-member`); yani buraya yazdığın her şey ziyaretçi dışı herkese söylenebilir olmalı: **yönetici/iç bilgi, fiyat, söz, uydurma özellik YOK.**
- Yaz (Markdown, sade Türkçe, adım adım, **ekrandaki etiketleri birebir** koduna bakarak doğrula — uydurma buton adı yok):
  `uye-belge-yukleme-rehberi.md` (profilde CV/sunum/ruhsat-lisans nereden yüklenir, hangi dosya türü/boyut, kimler görür — yalnız sahip+admin; `ProfilePage`/`ProfileDocumentCard`/`security.ts` sınırlarından) ·
  `uye-etkinlik-olusturma-ve-paylasma-rehberi.md` (etkinlik formu, aktif etkinlik sınırı 2, yayına hemen girer, "Etkinliklerim"de paylaşım düğmeleri; **A13 kararları esas**) ·
  `uye-cadde-tanitim-rehberi.md` ("reklam/tanıtım": `/cadde` Tanıtım kampanyaları; **kodu oku**, olmayanı yazma; fiyat/₺/vaat YOK) ·
  `uye-rol-talepleri-rehberi.md` (Profil → Rol Talepleri; **yalnız bugün çalışan akış**, 3 adımlı seçici henüz yok → yazma).
- Her dosyanın başında: kime, hangi sayfa. Sonunda "Sık sorulanlar" 3–5 madde. **TODO/placeholder cümlesi bırakma**; emin olmadığın şeyi dosyaya yazma, raporda "Burak'a sor" listesine koy.
- **`npm run ai:ingest` / `embed` / `ingest.mjs` ÇALIŞTIRMA** (canlı bilgi tabanına YAZAR; geçmişte `npm --` tuzağı canlıya yazdırdı, bkz. KALANLAR N04). Dosyaları yaz, commit'le; ingest'i kullanıcı/izinli oturum yapar.
- Kabul: 4 dosya · her iddia koda dayalı (rapora dosya:satır) · `verify:text` + gözle Türkçe harf · admin/iç bilgi sızıntısı yok (dosyayı admin gözüyle değil ziyaretçi gözüyle oku).

---

## 2.9 · G17 QA tamamlama (küçük)

`supabase/qa/g17-health-score-reports-acceptance.sql`'e eksik senaryoyu ekle (**çalıştırma**): `groups.health_score_queue_window_days` oynatılınca şikayet kalemi **değişmez**; `groups.health_score_report_window_days` oynatılınca şikayet kalemi **değişir**; 91 gün önceki `upheld` şikayet 20 puanı kırmaz, 89 gün önceki kırar; `open`/`rejected` şikayet kırmaz. Geri alınan işlem, assert'li, mevcut dosyanın biçimiyle. Migration (`20261005500000`) ve `group-health-score-schema.test.ts` G17b bloğu **değişmez**; çelişki bulursan raporla.

---

## Tur 1 çıkış kapısı

`tsc` 0 · değiştirdiğin dosyalarda `eslint --max-warnings 0` · `verify:text` · `check:dead` 0 yeni · `check:drift` · `ingest:tools:check` · tam `vitest` yeşil · her batch için mutasyon sonucu ·
`tek-plan` dosyasının §0 ve §2 durum satırları ve `docs/handover/2026-10-04-yan-ajan-ilerleme.md` güncel · **raporda her iddianın yanında çalıştırdığın komut ve çıktısı.** `public/sitemap.xml` değiştiyse (build yan etkisi) `git checkout -- public/sitemap.xml`.
