# GECE VARDİYASI — KALAN TÜM İŞLER (sormadan yürütülecek)

> **Kimin için:** tek bir ajan, kullanıcı uyurken baştan sona yürütür. **Soru sorma**: karar gereken yerde aşağıdaki **varsayılan karar** uygulanır; varsayılan "atla" ise atlanır ve rapora yazılır.
> **Kaynaklar:** `2026-10-05-birlesik-uygulama-plani.md` · `2026-10-05-kalan-seo-geo-guvenlik-plani.md` · `docs/security/SECURITY_AUDIT.md`.
> **Ölçüm tarihi:** 6 Ekim 2026 gece. Rakamları ezberleme, komutla ölç.
> **Çıktı:** her batch ayrı commit (`git commit -- <dosyalar>`, **push yok**, mesaj Türkçe, `Co-Authored-By` satırı), en sonda `docs/plans/2026-10-06-gece-vardiyasi-rapor.md` (batch → ✅/⏳/⛔ + kanıt + atlananlar).

---

## 0 · DEĞİŞMEZ SINIRLAR (hiçbir koşulda aşılmaz)

Kullanıcı "sormadan bitir" dedi; ama aşağıdakiler **geri alınamaz veya dışa dönük** olduğu için yapılmaz — **yapılmadı diye raporla, durma, sıradaki işe geç:**

1. **Secret/parola/token rotasyonu, repoyu private yapma, `git filter-repo`, force-push, `git push` (hiçbir biçimde).**
2. **Frontend/edge deploy, Coolify, DNS, Meta/WhatsApp, Stripe, canlı SMS/OTP.**
3. **Canlı DB'de veri silme/güncelleme** (migration dışı `delete/update`), gerçek hesap silme, toplu etkinlik yayını. *İstisna:* migration'ın kendi `insert … where not exists` seed'i.
4. **`20261005400000` OTP migration'ı** (Meta doğrulaması yok) — uygulanmaz.
5. `whatsapp_landings` eski INSERT politikasını kaldırma · pepper/anahtar ayırma · anonim form tablolarının grant'i · `index.html` JSON-LD · `robots.txt` · `geo fix --apply` · sabit canonical.
6. `CLAUDE.md` düzenlenmez (öneri `docs/plans/2026-10-05-tur1-claude-md-onerileri.md`'ye yazılır).
7. **Başkasının commit'siz diff'i:** `git status`'ta senin dokunmadığın dosyaya (`security.ts`, `EventDetailPage.tsx` vb.) satır düzeyinde müdahale yok; pathspec'siz `git commit` yok.

**Canlı DB kuralları (1 GB RAM):** satır başına fonksiyon çağıran keşif sorgusu yasak; `psql -f` UTF-8 dosya ile (Türkçe karakteri komut satırından geçirme); her migration `begin/commit` içinde ve `ON_ERROR_STOP=1`; **uygulamadan önce canlı şemayı ölç** (bu turda 6 migration'ın şema varsayımı yanlış çıktı: `role_attributes.attribute_key`, `catalog_items.image_url`, `user_role_assignments.status`, `get_current_user_features().key`); uygulandıktan sonra `supabase_migrations.schema_migrations`'a satır ekle (`insert … on conflict do nothing`) ve `npm run check:migrations:warn`. Bağlantı: session pooler, `.env.local` parolası, `dangerouslyDisableSandbox`.

**Test kuralları:** Vitest `--maxWorkers=2`, cwd **büyük harfli `C:`**; `npm run build` sonrası `git checkout -- public/sitemap.xml`; her yeni dosyada `verify:text` + Türkçe harfleri **gözle** oku; `ingest:tools:check` (`src/lib/**`'a dosya eklenirse); `check:dead`; `tsc -p tsconfig.app.json --noEmit` elle.

**İki oturum çakışması:** başka bir oturum aynı anda A2'yi (SG0–SG11) yürütüyor. Her batch'ten önce `git status --short` + `git log -5`; o oturumun bitirdiğini **yeniden yapma**, kanıtla (dosya/test) ve "yapılmış" yaz. `20261006000000…050000` canlıda → **yeniden uygulama**. Bu turda şu dosyaları canlı şemaya uysun diye değiştirdim, eski hâline **döndürme:** `…110000`, `…150000`, `…700000`, `…800000`, `…900000`, `20261006050000`.

---

## 1 · SIRA (bağımlılığa göre; her satır = ayrı batch + commit)

| # | Batch | Boyut | Önce |
|---|---|---|---|
| 1 | **K0 Durum tespiti** | S | — |
| 2 | **K1 Uygulanan 15 migration'ın kabul turu** (GV4) | M | 1 |
| 3 | **K2 SSRF `safe-invite-fetch`** (GV1) | M | 1 |
| 4 | **K3 Edge kalanı O4–O7** (GV2) | M | 3 |
| 5 | **K4 SG8 kanıtı + CI SHA** (GV3) | S–M | 1 |
| 6 | **K5 SG0/SG10/SG11 kapanış** (GV5, GV6) | S | 3–5 |
| 7 | **K6 SEO/GEO** (SE1, SE2) | S | — |
| 8 | **K7 CV/UI kalanı** (A5.1, A5.4) | M | — |
| 9 | **K8 Hesap silme** (A4.3, A4.4) | M | — |
| 10 | **K9 Rol Talepleri** (A3.2, A3.3, A3.4 kısmi) | M | — |
| 11 | **K10 Rehberler** (A8) | S | K7 |
| 12 | **K11 Bekleyen 4 migration incelemesi** (`…060000–090000`) | S | 1 |
| 13 | **K12 Deploy hazırlık paketi + rapor** | S | hepsi |

---

## K0 · Durum tespiti [S] — kod yok
`git status`/`log`, `npm run check:migrations:warn`, `ls supabase/functions/_shared`, `docs/security/`. Diğer oturumun A2 çıktılarını (SG0–SG11) listele: hangi kabul dosyası/test/commit var. **Yapılmışı bu planda tekrar yapma.** Kabul: rapora "yapılmış/yapılmamış" tablosu.

## K1 · Uygulanan migration'ların kabul turu [M] (GV4)
Canlıda ve **sınanmamış:** `20261005100500, 110000, 130000, 140000, 150000, 160000, 170000, 180000, 190000, 500000, 600000, 700000, 800000, 900000` + `20261006000000…050000`.
- Her biri için `supabase/qa/*-acceptance.sql` (varsa çalıştır, yoksa yaz; `begin … rollback`, assert'li). Biçim: `phone-otp-claim-acceptance.sql`. Mevcut olanlar: `career-premium-features`, `career-listing-quota`, `profile-license`, `events-auto-approval`, `event-published-notification`, `public-content-search-events`, `check-account-deletion-blocks`, `g17-*`; eksik olanlar için yaz (`sg2…sg9`, `cv_share`, `role_structure`, `reactors`).
- **Mutlaka kanıtlanacaklar:** anon `list_cadde_post_reactors_v1`'i çağıramaz; banlı üye listede yok; `job_listings` anon SELECT yok ama `list_job_listings_public`/`get_job_listing_detail_v1` çalışıyor; `notifications` anon INSERT yok; `catalog_items` ayrıcalıklı kolon güncellemesi reddedilir; `cv_share_with_premium` için **78** aktif rolün tamamında `role_attributes` kuralı var (sayıyı canlıdan türet); `business_license_doc` aynı.
- **Roller dolu mu:** `role_features` her yeni feature için (`career.cv.view`, `career.listing.view_unlimited`, `profile.license_upload`, …) **her aktif rol için satır** var mı (T2: satır yoksa sessizce kapalı). Eksik varsa **yeni bir migration** (idempotent, `…20261006100000+`) ile ekle.
- Başarısız kabul = migration düzeltmesi için **yeni** migration (uygulanmış dosyayı değiştirme).
- Kabul: her migration için PASS/FAIL tablosu; FAIL kalan yok ya da "KIRMIZI + neden".

## K2 · SG7 SSRF [M] (GV1)
- `supabase/functions/_shared/safe-invite-fetch.ts`: yalnız `https`, izinli host listesi (`chat.whatsapp.com`, `t.me`, `telegram.me`, `discord.gg`, `discord.com` — gerçek çağrı noktalarından çıkar), DNS sonrası özel/loopback/link-local/`169.254.169.254`/IPv6 yerel reddi, yönlendirme takibi kapalı (veya her sıçramada yeniden doğrula), zaman aşımı + gövde tavanı.
- `SECURITY_AUDIT.md` S6'daki 3 çağrı noktası + `group-preview` bu yardımcıyı kullanır.
- **TDD:** KIRMIZI test (özel IP, `http`, `evil.com@chat.whatsapp.com`, yönlendirme zinciri, DNS rebinding benzeri) → yama → mutasyon ≥ 4. Deno yoksa testi vitest'te saf fonksiyon olarak yaz; Deno gerektiren kısım "⛔ Deno yok" diye rapora.
- Kabul: tarama (`grep`) gösterir ki hiçbir edge function'da yardımcıyı atlayan `fetch(<kullanıcı URL'i>)` kalmadı.

## K3 · O4–O7 [M, 4 küçük commit]
- **O4 `send-submission-email`:** kimliksiz çağrıda keyfi adrese mail yok; `x-dispatch-secret` veya outbox; doğrulanmamış adrese onay maili yok. **Anonim form grant'i değişecekse DUR** (sınır 5) → o kısmı atla, yalnız fonksiyon tarafını yap.
- **O5 `submit-survey-response`:** tekrar eden `questionId` reddi; `"default-salt"` fallback kalkar, salt yoksa fail-closed.
- **O6 `whatsapp-autoreply`:** `systemInstruction`, çıktı filtresi, alıcı thread'den, ham hata dönülmez. (Bağlantı kapalı; deploy yok.)
- **O7 `deno.json` + `deno.lock`:** Deno kuruluysa yap; **değilse atla ve raporla.**
- Her biri KIRMIZI test + mutasyon ≥ 3.

## K4 · SG8 kanıtı ve CI SHA [S–M] (GV3)
- **O12 `server.mjs`:** `GET /%5c..%5c.env.local` → 4xx; varsayılan `127.0.0.1`; test.
- **`LoginPage ?next=`:** `//evil.com`, `/\evil`, `javascript:` reddedilir (test); `safeHref` testi; ölü `sanitizeHtml` temizliği (başkasının diff'ine dokunma).
- **CI:** `.github/workflows/*` taranır; etiketli `uses: …@vN` action'lar **SHA'ya** çevrilir (SHA'yı `gh api repos/<o>/<r>/git/ref/tags/<tag>` ile çöz; çözemezsen o satırı "⛔ SHA çözülemedi" diye bırak). Ölçüm: başlangıçta SHA'lı `uses:` sayısı **2**.
- **nginx:** `server_tokens off` var; `redirects.test.ts` yeşil mi, CLAUDE.md md.1–6 ihlali yok mu (metin testi). Deploy sonrası `curl -I` K12 paketine girer.

## K5 · SG0 + SG10 + SG11 kapanış [S]
- `docs/security/ilerleme.md` (başlangıç kapı değerleri: lint, tsc, test sayısı, `npm audit`).
- `SECURITY_AUDIT.md` "DÜŞÜK / BİLGİ" bölümü: her madde tek tek ✅/⏳/⛔ (insan işi/karar). Sınır 5'tekiler **yapılmaz**.
- **Tam kapı:** `tsc`, `lint` (bizden olmayan ~35 hata `corteqs-ekstre-motoru/` + `whatsapp-autoreply`), `vitest --maxWorkers=2`, `build`, `check:dead`, `ingest:tools:check`, `verify:text`, `check:migrations:warn`.
- `SECURITY_AUDIT.md`'deki **her S/O maddesine durum** + uygulama sırası listesi; dosyayı `git add` (izlenmiyor).
- `npm audit`: yalnız rapor (`audit fix` yok); `xlsx` ayrı not.

## K6 · SEO/GEO [S] (SE1, SE2)
- **SE1:** `public/ai/faq.json`'ın `index.html` FAQPage'den **betikle** üretildiğini kanıtla (12 soru, Türkçe karakter diff'i); değilse betik yaz ve **yeniden üret** (elle yazma yasak). Rakam yasağı taraması ("164 ülke", "8,8 milyon"). `npm run build` → `dist/ai/*`, `dist/.well-known/ai.txt` var mı; `git checkout -- public/sitemap.xml`. `nginx.conf.template`'te `/ai/` ve `/.well-known/` SPA fallback'ine düşüyor mu **oku, değiştirme** — düşüyorsa öneriyi rapora yaz. `PYTHONUTF8=1`.
- **SE2:** `BlogPostPage` "Tüm yazılar" bağlantısı → `/radar/rehberler` (kaynak `src/lib/redirects.ts`); bileşen testi + mutasyon ≥ 2.
- **Yapılmaz:** sitemap'e `/addcom`, `/tavsiye`, `/liderlik` (karar: şimdilik girmesin).

## K7 · CV kalanı [M] (A5.1, A5.4)
- **A5.1:** `cv_share_with_premium` için şema ölçümü **kanıtla** (`afs_attributes` satırı, 78 kural, `storage_strategy=private_storage`).
- **A5.4 UI:** sahibe anahtar "CV'mi Premium üyeler görebilsin" (**varsayılan KAPALI**); `ProfilePage` gizlilik metni anahtara göre. `ProfilePage.tsx` ≤ 800 satır (`ProfilePage.test.tsx` değişmeden yeşil; yeni UI ayrı bileşen/hook). Türkçe harfleri gözle oku.
- `member-cv-link` edge function'ı **deploy edilmez**; kodu `career.cv.view` yetkisini sunucuda doğruluyor mu, `createSignedUrl` 5 dk, `getPublicUrl` yok → kanıtla. Depolama RLS'i gevşetilmez.
- Kabul: Premium ✓ · Free ✗ · rıza kapalı ✗ · anon ✗ (SQL/test).

## K8 · Hesap silme [M] (A4.3, A4.4)
- **A4.3:** `supabase/functions/delete-account/` izlenmiyor → commit'e al; JWT doğrulama, service role yalnız sunucuda, `account_deletion_log` (hash'li kimlik, kişisel veri yok), `check_account_deletion_blocks` çağrısı. **Deploy yok.**
- **A4.4 UI:** "Tehlikeli Bölge" kartı, yazılı onay ("SİL") + yeniden doğrulama, engel nedeni gösterimi, KVKK/GDPR metni. Bileşen testi.
- **Canlıda gerçek silme ÇALIŞTIRILMAZ** (sınır 3). İşlem-içi SQL testi (engel → ret; engel yok → kişisel veri gider, yetim satır yok) `begin … rollback`.

## K9 · Rol Talepleri [M] (A3.2, A3.3, A3.4 kısmi)
- **A3.2 R3:** canlıda `catalog_item_tags` şemasını ölç (kolon, RLS). Kullanıcı-bazlı uzmanlığa **uymuyorsa DUR → o kolu atla**, raporla.
- **A3.3 R5 süzgeç:** `Experimental_1/2/3` **yalnız gizli** (silme yok); Şehir Elçisi adı değişmez; Diaspora Üyesi/Destekçi/İş Arayan/İçerik Moderatörü/Platform Yöneticisi gizli; varsa `oneri` süzgeci kaldırılır. Veri değişikliği gerekiyorsa **yeni migration**.
- **A3.4 R4 UI (3 adım: ana rol kartı → aranabilir alt rol → uzmanlık chip'i):** yalnız Excel'de **açık noktası olmayan** satırlarla; başvuru `approval_requests`'e düşer, `AdminApprovalsPage`'de görünür. Açık noktalı satırlar ve yeni `roles` satırı gerekip gerekmediği (§B3) **yapılmaz**. Önce `docs/plans/2026-10-05-rol-talepleri-olcum.md`'yi oku. `role_structure` migration'ı canlıda; `roles.key` ve prefix SQL'lerine **dokunma**.

## K10 · Rehberler [S] (A8)
- `docs/guides/belge-yukleme.md`, `reklam-verme.md`, `etkinlik-paylasma.md`'yi **koda karşı** doğrula (ekran etiketleri birebir, uydurma buton yok, fiyat/söz yok, ziyaretçi gözüyle sızıntı).
- **4. rehber: Rol Talepleri** (yalnız bugün çalışan akış; K9 sonrası).
- CV paylaşımı ve hesap silme rehber içeriği ilgili özellik canlıya çıkana kadar **dışarıda**.
- `ai:ingest`/`ai:embed` **çalıştırılmaz** (canlı bilgi tabanına yazar).
- Burak düzeltmesi bekler → rapora "Burak onayı gerekir".

## K11 · Bekleyen 4 migration incelemesi [S] — **inceleme, uygulama YOK**
`20261006060000_b7_cadde_search`, `…070000_b6_group_report_notification`, `…080000_b8_events_manual_approval`, `…090000_b8_weekly_city_digest_toggle` (başka oturumdan). Her biri için: şema varsayımı canlıda doğru mu (ölç), `begin/commit`, idempotent, `security definer`+`search_path`, `revoke … anon`, `role_features` etkisi.
- **`…080000_b8_events_manual_approval`** `…900000_events_auto_approval` ile **çelişiyor olabilir** (T1: ilk etkinlik onayı SQL'de zorlanmalı) — çelişkiyi yaz.
- **`…060000_b7_cadde_search`** Cadde gönderisi arama gizlilik kararına (§B7) bağlı — karar yok → **uygulanmaz**.
- Varsayılan: **hiçbiri uygulanmaz**; "uygulanabilir / düzeltme gerekir / karar bekler" sınıflaması rapora girer.

## K12 · Deploy hazırlık paketi + rapor [S]
- `docs/operations/2026-10-06-deploy-kontrol-listesi.md`: kullanıcı için tek sayfa — frontend deploy sırası, sonrasında `curl` dizisi (`2026-10-05-seo-geo-plani.md` §5 + `curl -I` güvenlik başlıkları), konsolda CSP, `verify:release`, edge deploy listesi (`find-matches`, `member-cv-link`, `delete-account`, `send-notification-emails`…) ve `check:functions`.
- **Elle deneme listesi** (kullanıcı veya Chrome otomasyonu — **otomasyon girişli oturum gerektirir, sormadan deneme**): admin paneli, Cadde bildirimleri + "kimler beğendi", `/ilanlar` kota, profil CV anahtarı, ruhsat yükleme. Her madde: beklenen sonuç + hangi migration'ı sınıyor.
- `docs/plans/2026-10-06-gece-vardiyasi-rapor.md`: K0–K11 sonuçları, atlananlar + nedeni, kırmızılar, commit listesi, **kullanıcıya kalanlar** (aşağıdaki liste).

---

## 2 · KULLANICIYA KALANLAR (ajan yapmaz; raporun sonuna aynen yazılır)
1. **GB1 🔴** secret/parola/token rotasyonu + repo private + `git filter-repo` + force-push + KVKK/GDPR değerlendirmesi.
2. Frontend ve edge **deploy** + deploy sonrası doğrulamalar (K12 listesi).
3. Coolify: `http://corteqs.net` 404 (SG04), `mvp.corteqs.net` eski derleme (SG05).
4. Gateway `X-Forwarded-For` ölçümü (Burak, non-prod).
5. Kararlar: `whatsapp_landings` eski INSERT politikası · pepper ayırma · anonim form grant'i · Cadde arama gizliliği (§B7) · 241 konsolosluk kaydının yayını · `…080000` etkinlik onay çelişkisi · `index.html` JSON-LD (şimdilik kalsın) · rol yapısı Excel "Açık Noktalar" (§B3).
6. OTP: Meta Business Verification → `…400000`.
7. 6 mükerrer demo ilan temizlendi (bilgi); `B11` reactors uygulandı (ban + `cadde.access` filtreli).

## 3 · Durma kuralı
Kırmızı bir kapıda **o batch'i "⛔ KIRMIZI + neden" diye işaretle ve sıradakine geç** (bağımlı batch'ler hariç). Aynı hatayı 3 kez denedikten sonra bırak. Hiçbir koşulda §0'ı çiğneme; çiğnemen gerekiyorsa o işi yapma, rapora yaz.
