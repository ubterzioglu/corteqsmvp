# TEK PLAN — kalan her şey (6 Ekim 2026, öğleden önce)

> **Bu dosya** `2026-10-05-tek-plan-kalan-isler.md` (5 Ekim akşamı) ve `2026-10-06-gece-vardiyasi-*` dosyalarının yerini alır;
> `kalanlar/KALANLAR.md` (3260 satır), birleşik uygulama planı, GB1 ve deploy kontrol listesiyle karşılaştırılarak yazıldı.
> **Rakamları ezberleme, komutla ölç.** Burada olmayan bir iş kuralı için dur ve sor.
> Durum etiketleri: **AÇIK** (ajan yapabilir) · **KARAR** (sizin kararınız) · **DIŞ** (hesap/panel/üçüncü taraf) ·
> **DOĞRULA** (yapıldı denmiş, kanıt yok).

---

## 0 · Önce bunu bil

Raporlar ile çalışma ağacı arasında **bugün ölçülen** farklar. Hiçbir "tamamlandı" ifadesini bunlar çözülmeden kapanmış sayma:

1. **`delete-account` commit'li değil.** Gece raporu K8'de commit'lendiğini yazıyor; `supabase/functions/delete-account/` hâlâ izlenmiyor ve içi yer tutucu (anonimleştirme yazılmamış).
2. **3 rehber commit'li değil:** `docs/guides/belge-yukleme.md`, `reklam-verme.md`, `etkinlik-paylasma.md`.
3. **Uygulanmış migration'lar sonradan değişmiş (6 dosya, commit'siz):** `20261005110000`, `…150000`, `…700000`, `…800000`, `…900000`, `20261006050000`.
   Gece vardiyasının notu: bunlar canlı şemaya uysun diye değiştirildi, **eski hâline döndürme**. Ama commit'siz kalırsa depo ile canlı ayrışır.
   Ayrıca `…180000_ai_legion_hobi_kultur` ve `…190000_ted_innoventure_global` **izlenmiyor**.
4. **K9 ve K11 yanlış gerekçeyle atlanmış.** K9 "rol yapısı kararı bekleniyor" demiş, oysa 5 Ekim akşamı kararlar verildi (aşağıda §6). K11 "zaten uygulandı" demiş,
   oysa `20261006060000–090000` incelenmemişti; `080000` (manuel etkinlik onayı) `…900000` (otomatik onay) ile çelişiyor olabilir.
5. **Frontend deploy durumu belirsiz.** KALANLAR "U10 03.10'da deploy edildi" diyor; A-batch, G14, OTP kartı ekranları için hâlâ "bir sonraki deploy'da canlanır" yazıyor.
   Hangi commit'lerin canlıda olduğu **kanıtlanmadı**.
6. **Push:** `main` bugün push'landı (`1e4b5a21`). KALANLAR'daki "27 commit PUSH'LANMADI" notu bayat.
7. **Kök temizliği yapıldı** (6 Ekim): `ROADMAP.md` ve `sunuekleglobalSKILL.md` arşive taşındı. Kökte yalnız `maillogo.png` (izleniyor) ve `skills-lock.json` (izlenmiyor) kaldı; kararı bekliyor.

---

## 1 · SİZDEN BEKLENENLER (büyükten küçüğe)

### 🔴 1.1 Güvenlik — en acil
| # | Konu | Ne gerekiyor |
|---|---|---|
| **GB1** | Secret rotasyonu + git geçmişi | Repo **public**, geçmişte geçerli `service_role` JWT + DB parolası + WhatsApp token var (commit `52e6faf4`). Sırayla: repoyu private yap → secret'ları döndür (Supabase service role, DB parolası, 2 PAT, WhatsApp token, `RAG_API_SECRET`, admin parolası) → `auth.refresh_tokens`/`sessions` temizle → dump'taki 5 kullanıcıya parola sıfırla → `git filter-repo` + force-push → GitHub Support önbellek temizliği → KVKK/GDPR değerlendirmesi. Ayrıntı: `2026-10-06-gb1-secret-rotasyonu-plani.md`. **Ajan yapamaz.** |
| **U01** | Service role geçişi | Önce 3 edge function yeni `sb_secret_` düzenine taşınacak (karar 12), rotasyon **en sona**. Taşıma ajan işi (§2, B6), rotasyon sizin. |
| **K12** | Erişim logu | 26.09 ~19:11 (Berlin) alfabetik tablo/RPC gezintisi yapan 301 istek: sizin miydi? Cevap yoksa "kötüye kullanıldı mı" sorusu kapanmaz (`docs/operations/2026-10-04-erisim-logu-incelemesi.md`). |
| **KS05** | CV kovaları | Kovalar kapatıldı ama CDN önbelleği TTL dolana kadar eski bağlantıları sunabilir; bağlantı paylaşıldıysa dosyalar yeni adla yeniden yüklenmeli. |

### 🟡 1.2 Kararlar (kod değil, sizin sözünüz)
| # | Konu | Soru |
|---|---|---|
| **§B4** | 5 güvenlik kapısı | (1) `notifications` doğrudan INSERT var mı → tetikleyiciye taşınsın mı (2) `whatsapp_landings` eski INSERT politikası kaldırılsın mı (3) `send-phone-otp-hook` pepper ayırma (mevcut şifreli veriyi bozar) (4) anonim form tablolarında kolon grant'i (5) `job_listings` politika kaldırma |
| **Rol yapısı** | Excel "Açık Noktalar" | Doktor / Diş Hekimi / İK / Güzellik taslağı · sektör etiketi · kod göçü · **yeni alt roller için yeni `roles` satırı gerekir mi?** (cevap gelmeden açılmaz). Not: flat `roles.key` kalsın kararı **zaten verildi**; gece raporundaki "flat mı hiyerarşik mi" sorusu çözülmüş durumda. |
| **K11-çelişki** | Etkinlik onayı | `…080000_b8_events_manual_approval` ile `…900000_events_auto_approval` çelişiyor mu? Kararınız: tüm üyeler otomatik yayın (B9c). Çelişen migration varsa uygulanmaz. |
| **Veri** | 241 konsolosluk kaydı | Hepsi `pending_review`. Yayınlansın mı? (Arama kapsamındaki Konsolosluk kolunu açar.) |
| **Veri** | Cadde gönderisi arama gizliliği | Yalnız herkese açık, silinmemiş, banlı olmayan gönderi, PII'siz kolon — onay? (`…060000_b7_cadde_search` buna bağlı.) |
| **Veri** | AI Legion kategorisi (`meslek-kariyer`/`hobi-kultur`) · TED InnoVenture konumu | Migration `…180000/190000` bu kararlara yazılmış; kararın teyidi. |
| **G14** | 5 tasarım kararı | Kendi grubuna şikayet yasak mı · tek onay = tek ihlal mi · onaydan sonra grup gizli mi kalsın · şikayet maili gitsin mi · sebep→kırmızı çizgi eşlemesi (`docs/handover/2026-10-05-g14-kullanici-adimlari.md`). |
| **G16** | Politika | `group_reports` yalnız gruba karşı şikayet tutuyor; "şikayet almamış üye" ne demek? |
| **G10c** | Eski kolonlar | `member_approved`/`admin_approved` düşürülsün mü? (artık bloke değil, **ayrı onay** ister: `2026-10-05-g10c-onay-talebi.md`) |
| **K01 · K04 · K07** | Cadde sıralaması / davet kodu ters alan (#1731, canlıda duruyor) / 25 Eylül transkriptinin son ~25 dk'sı | Yan ajanın hazırladığı sade dilli dosyalar var; ekran görüntülü anlatım gerekiyor. |
| **K02 · K03** | SMS sağlayıcısı | Metin hâlâ Twilio diyor, yol Meta WhatsApp OTP'ye döndü: K02 yeniden yazılmalı. |
| **WAU** | Metrik tanımı | WAU görünümü Tavsiye aktivitesini saymıyor; sayılsın mı? |
| **Kök** | `maillogo.png`, `skills-lock.json` | Taşınsın / `.gitignore` mı? |

### 🔵 1.3 Dış bağımlılıklar (hesap / panel / üçüncü taraf)
| Konu | Adım |
|---|---|
| **Meta Business Verification** | Önce bu. Açılınca: şablon `corteqs_otp` → secret'lar (`WHATSAPP_OTP_ACCESS_TOKEN`, `_PHONE_NUMBER_ID`, `_PHONE_PEPPER`, `WHATSAPP_OTP_TEMPLATE`, `…_LANG`) → migration `20261005400000` → `send-phone-otp-hook` deploy (`--no-verify-jwt`) → Dashboard Send SMS hook + `SEND_SMS_HOOK_SECRET` → SMS OTP Expiry 300 sn → uçtan uca. Yedek yol: Twilio SMS. |
| **WhatsApp botu** (U09/W02/W07/W08) | Meta panelinde webhook (Callback URL, Verify token, `messages` aboneliği) + gerçek telefonla 9 senaryo + notları revizyon yorumuna yaz. 4 secret girildi, 5. (`WHATSAPP_GRAPH_API_VERSION`) kodda v26.0 varsayılanı. |
| **Stripe (U11)** | S01 hesap/canlı anahtar · **S02 🔴 vergi rejimi (profesyonel teyit şart)** · S03 iade koşulu · S04 kapsam. Model kararlı: 3 kademe × aylık/yıllık + Freemium, yalnız EUR. Faz 1–7 planı yazıldı, batch'lenmedi, S01/S02'ye bloke. Hedef 01.01.2027. |
| **Coolify** | `http://corteqs.net` 404 (SG04) · `mvp.corteqs.net` eski derleme (SG05) |
| **Gateway** | `X-Forwarded-For` davranışı (non-prod'da ölç) |
| **El işleri** | U03 iki gerçek mail testi (e-posta doğrulama, revizyon tamamlanma; Zoho alias değilse 553) · A14 REV-034'ü panelde "Yapıldı" işaretle · G13 canlı kabul (bir grup adına geçici `· CQxxxx`) · G08 gerçek `t.me/+…` linki · HCD-Bilinç/SHAMAN sahiplerinden link · repo-dışı ~50 madde (karar 16: atla) |
| **Takvim** | U08: G03c sonrası 2 haftalık dönüşüm gözden geçirme, ~17 Ekim |

---

## 2 · AJAN İŞLERİ (karar gerektirmeyen, sıralı)

Her batch ayrı commit, **`git commit -- <dosyalar>`**, kapı komutları: `tsc -p tsconfig.app.json --noEmit`, `vitest --maxWorkers=2` (cwd büyük `C:`), `check:dead`, `verify:text`, `ingest:tools:check` (src/lib'e dosya eklenirse), Türkçe harfleri gözle oku.

| # | Batch | Boyut | İçerik |
|---|---|---|---|
| **B0** | **Çalışma ağacı sağlığı** | S | §0.1–0.3'ü kapat: `delete-account` ve 3 rehberi izle (rehber commit'i içerik doğrulamasından sonra), 6 değişmiş + 2 izlenmeyen migration'ı **tek tek oku**, canlı şemaya karşı ölç, `npm run check:migrations:warn` ile ledger farkını çıkar. Kodsuz rapor + commit. |
| **B1** | **K11 gerçek inceleme** | S | `…060000/070000/080000/090000`: şema varsayımı canlıda doğru mu (ölç), `begin/commit`, idempotent, `security definer`+`search_path`, `revoke anon`, `role_features` etkisi. Sınıf: uygulanabilir / düzeltme / karar bekler. **Uygulama yok.** |
| **B2** | **Hesap silme tamamlama** | M | `delete-account`: anonimleştirme gövdesi (FK'ler **tek tek**: RESTRICT 4, NO ACTION ~9 + sayılmamış ~9 → önce hepsini say), `account_deletion_log` (hash'li kimlik, kişisel veri yok), UI'ya yazılı onay modalı ("SİL") + yeniden doğrulama + KVKK metni. İşlem-içi SQL testi + bileşen testi. **Canlıda gerçek silme ayrı onay, yalnız test hesabı + yedek.** |
| **B3** | **Rol Talepleri R2–R5** | M–L | R3: canlıda `catalog_item_tags` şemasını ölç (uymazsa **dur, sor**). R5 süzgeç (Experimental_1/2/3 yalnız gizli, silme yok; Şehir Elçisi adı aynı). R4 3 adımlı seçici UI — **yalnız Excel'de açık noktası olmayan** satırlarla. Önce `2026-10-05-rol-talepleri-olcum.md`. 19 sarı satır **dahil**; alt rol sayısı **51**. |
| **B4** | **CV paylaşımı kalan** | S | A5.1 şema ölçümü (kanıt), A5.4 UI anahtarı "CV'mi Premium üyeler görebilsin" (**varsayılan KAPALI**), gizlilik metni anahtara göre, `ProfilePage.tsx` ≤ 800 satır. `member-cv-link` kodu doğrulaması (`createSignedUrl` 5 dk, `getPublicUrl` yok). |
| **B5** | **Rehberler** | S | 3 rehberi koda karşı doğrula (etiket birebir, uydurma buton yok), 4. rehber (Rol Talepleri, B3 sonrası). CV/silme içeriği özellik canlıya çıkana dek dışarıda. `ai:ingest/embed` **çalıştırılmaz**; Burak düzeltmesi bekler. |
| **B6** | **U01 hazırlığı** | M | 3 edge function'ı yeni `sb_secret_` düzenine taşı (`2026-10-05-u01-anahtar-gecisi-spike.md`). Rotasyon sizin. |
| **B7** | **G17 / G16 sözleşme** | S | G17 skorundaki "90 günde onaylı şikayet yok" kalemi `group_reports`'a bakmıyor (iki sözleşme testi bugünü kilitliyor); G16 kararı gelince. |
| **B8** | **Stripe mock riski** | S | `MockStripeCheckout` iki yerde (`PremiumProfileTabs`, `ServiceRequestForm`) kullanıcıya **"ödeme başarılı"** diyor. Gerçek ödeme gelene dek metin/akış düzeltilmeli (ölçülmüş risk). |
| **B9** | **Dijital Gruplar kuyruğu** | S | G18 (`submitLanding` emekliliği + INSERT politikasını RPC'ye daralt, deploy sonrası) · eski `WhatsAppLandingsModeration` ekranı tek dile · G23 yıllık yenileme maili (opsiyonel, yeni event_type + trigger). |
| **B10** | **Bot/WhatsApp kodu** | M | W04 ledger durumunu ölç (pano ile G14 satırı çelişiyor) · W05/W06 `whatsapp-autoreply` (`config.toml`, `verify_jwt` canlıda ölç); gerçek davranış W02'den sonra. |
| **B11** | **types.ts** | S | Yeniden üret (Management API; `SUPABASE_ACCESS_TOKEN` gerekir). Çıktı kompakt (6923 satır), repodaki verbose (16634) → büyük diff; ayrı commit. `as never` borçları temizlenir. |
| **B12** | **P02/P04/P05/P06/P07** | S | Karar 13 ile onaylı; P04 deploy ister. KALANLAR'da tamamlandı kaydı yok → önce durumu ölç. |
| **B13** | **SG serisi tanımı** | S | Karar 8: SG listeye girsin, `index.html` JSON-LD'ye dokunulmaz. Tek batch tanımı yok → yaz. |
| **B14** | **Opsiyonel borç** | — | 500–800 satır bandında 33 üretim dosyası · `zgen-data.ts` 980 (VERİ, bölme tartışmalı) · `corteqs-ekstre-motoru/` ~30 lint hatası (ortam notu) · Taşınma Planlayıcı: 120 servisin 120'si DEMO (ayrı ürün planı ister). |

**Gece raporunda zaten yapılmış ve tekrar edilmeyecek:** SSRF `safe-invite-fetch` (11 test) · O4–O6 · SG8 kanıtı · SE2 blog bağlantısı · deploy kontrol listesi. O7 (Deno) kurulu olmadığı için atlandı; Deno kurulursa tek küçük batch.

---

## 3 · DEPLOY KAPISI (kullanıcı veya izinli oturum)

Sıra bağlayıcı. Önce `B0`+`B1` bitmeli; **canlıda ölçmeden uygulama yok** (tablo var diye ledger satırı var sanma; `psql -f` ledger satırı yazmaz, elle ekle, sonra `check:migrations`).

1. **Edge önce, migration sonra** (yeni `event_type` rollout'unda): `send-notification-emails` (A15 hattı) · `member-cv-link` · `delete-account` (B2 sonrası) · `send-phone-otp-hook` (Meta sonrası). Coolify edge function deploy **etmez**: `npx supabase functions deploy <ad>` + `npm run check:functions`.
2. **Migration sırası:** `…500000` G17 → `…600000` career_premium → `…700000` ilan kotası → `…800000` ruhsat → `…900000` otomatik etkinlik → `event_published` + `search_events` → CV (`…20261006050000`) → **ancak B1 sınıflamasından sonra** `…060000–090000`. `…400000` OTP Meta'ya bağlı, **atlanır**.
3. **Frontend deploy**; sonra `curl -I https://corteqs.net/` güvenlik başlıkları, `curl -I https://corteqs.net/kariyer` (KR10), tarayıcı konsolunda CSP ihlali, `BASE_URL=https://corteqs.net npm run verify:release`.
4. **Menü sırası değişirse:** `npm run ingest:admin-menu` → `ingest.mjs --source=admin-menu` → `embed.mjs`.
5. **Doğrulanacak ekranlar:** N07 (admin/üye menü), N06 link, A15 etkinlik maili, CD04, M07/M08, `/ilanlar` kota, profil CV anahtarı, ruhsat yükleme, Cadde "kimler beğendi".
6. **İlk gerçek haftalık şehir özeti** (anahtar 04.10'da açıldı, pzt 05:00 UTC; takip eden üye 0) doğrulanmadı.
7. **Canlı ölçümler (salt okuma, 1 GB RAM: satır başına fonksiyon çağıran keşif sorgusu YASAK):** P06 Türkçe collate · A09a/A11/Radar yeniden ölçüm · U01 §4 SQL'i · G10 geri alma · G14 iki oturumlu deadlock denemesi.

---

## 4 · ERTELENMİŞ / BİLİNÇLİ OLARAK YAPILMAYACAK

- `index.html` JSON-LD · `robots.txt` · `geo fix --apply` · sabit canonical (karar 8).
- `/liderlik`, `/addcom`, `/tavsiye` sitemap'e girmez (kayıt birikince değerlendirilecek).
- Eski 4 kariyer ilanı: silinmez; koşul = en az bir tam başvuru döngüsü + ekibin "artık gelmiyor" demesi.
- Kurumsal doğrulama rozetinin dizine/aramaya yayılması (267 kayıt) — ayrı plan.
- "Kurucu 1000 = 99 €" kampanyası — Stripe sonrası.
- Landing/dizin tek kaynak (B8c) — rol yapısı çalıştıktan sonra ayrı plan.
- Command Center'da kalan 10 `Beklemede`+`todo` kaydı — kapsam dışı.
- Arşiv README'lerindeki açık kararlar (61 gerçek kişi kaydı, 69 placeholder görünürlüğü, `AssociationDetail` 18 hareketsiz düğme, bekleyen etkinlikler): ana dosyada ayrıntı yok, **ayrı gözden geçirme** ister.

---

## 5 · VERİLMİŞ KARARLAR (5 Ekim akşamı) — yeniden sorulmaz

Premium = elle açılır (Stripe gelince aynı anahtar) · CV rızayla, varsayılan kapalı · ilan girişi önce SQL örnek · "Rol Talepleri" yalnız eski düzende · `roles.key` aynen kalır + `role_structure` katmanı · sarı 19 satır yayına girer · alt rol sayısı 51 · Şehir Elçisi adı değişmez · Experimental yalnız gizli · etkinlik: tüm üyelere otomatik, limit 2, eski `pending` hepsi yayınlanır **mail atmadan** (önce say) · ön kartta yalnız dizin sonuç kartı · bot Gemini kalır · ziyaretçiye bot konuşmaz, balon metni değişir · arama kapsamı: Rehber, Konsolosluk, Cadde, Sayfa (koşullu) · hesap silme: anonimleştir, engel varsa önce devret, canlıda gerçek silme ayrı onay.

---

## 6 · KALANLAR.md'DE BAYAT SATIRLAR (temizlik batch'i, kod yok)

Aynı dosyada çelişen/bayat 20 satır var; en önemlileri: başlıktaki "Açık batch 11 (W 8 · G 3)" (W01/W03/G14 kapalı) · U09 "beşi de yer tutucu" (4 secret girildi) · G06/G07, G10c, G11/G11b/G11c, G03c SQL bloğu (kapanmış ama açık görünüyor) · M24/M25 başlıkları · CC01 "451 Beklemede" (CC02 kapattı) · KS07 (KS08 kapattı) · K02 Twilio · ölçüm tabanı (30.09: 372 dosya/2882 test; güncel kayıt 455/3772, 493 migration — **ezberleme, ölç**).
Öneri: `KALANLAR.md`'yi bu dosyayı kaynak alarak **kısalt** (kapananları `history/`'ye taşı).

---

## 7 · Tuzaklar (kısa)

Vitest "Timeout waiting for worker" → `--maxWorkers=2` + büyük `C:` · `npm run build` sitemap `lastmod`'larını değiştirir → `git checkout -- public/sitemap.xml` · `npm run lint` ~35 hata `corteqs-ekstre-motoru/` + `whatsapp-autoreply`'den (bizim değil) · PowerShell'den psql'e Türkçe karakter geçirme, `psql -f` UTF-8 dosya · başka bir oturum aynı çalışma ağacında çalışıyor olabilir: her batch öncesi `git status --short` + `git log -5`, pathspec'siz commit yok · `package.json`/`package-lock.json`/`public/sitemap.xml` commit'siz değişiklikleri başkasının; dokunma.

---

## 8 · Önerilen sıra (tek bakışta)

1. **Siz, bugün:** GB1 + K12 cevabı. (Diğer her şeyden bağımsız ve en acil.)
2. **Ajan:** B0 → B1 → B2 → B4 → B3 → B5 (güvenli, karar gerektirmez; B3'ün R4 kolu Excel cevabına kadar kısmi).
3. **Siz:** §B4'ün 5 sorusu + 241 konsolosluk + Cadde arama gizliliği + G14/G16 kararları (hepsi evet/hayır; `B6–B9`'u açar).
4. **Deploy kapısı (§3)** B0/B1 sonrası; edge → migration → frontend.
5. **Meta Business Verification** başlasın (bekleme süresi uzun; OTP + WhatsApp botu buna bağlı), paralelde **Stripe S01/S02**.
