# KALAN SEO/GEO + GÜVENLİK İŞLERİ (5 Ekim 2026 gece)

> **Kapsam:** yalnız SEO/GEO ve güvenlikte **henüz yapılmamış / doğrulanmamış** işler. Yapılanlar dahil değildir.
> **Kaynaklar:** `2026-10-05-birlesik-uygulama-plani.md` §A2, §A10, §B1, §B4 · `docs/security/SECURITY_AUDIT.md` · `2026-10-05-seo-geo-plani.md`.
> **Kural:** Her batch ayrı commit, yol belirterek (`git commit -- <dosyalar>`), push yok. Canlı DB yazması ve deploy ayrı onay ister. Burada olmayan iş kuralı için dur ve sor.
> **Ölçüm tarihi:** 5 Ekim 2026 — dosya sistemi, git ve canlı `schema_migrations` kaydıyla doğrulandı. Test/build çalıştırılmadı.

## 0 · Bugünkü durum (ölçüm)

| Alan | Yapıldı (dokunma) | Kalan |
|---|---|---|
| SEO/GEO | `public/ai/summary.json`, `public/ai/faq.json`, `public/.well-known/ai.txt` commit'li; yasak rakam yok. nginx/SG01–SG03/SG06/SG07 düzeltmeleri (`seo-geo-plani.md` §3) | Aşağıda **SE1–SE6** |
| Güvenlik | SG1 (backups izlemeden çıktı) · SG2–SG4, SG6, SG9 migration'ları **canlıya uygulandı** (5 Ekim) · `kullanim-envanteri.md` · `find-matches`, `server.mjs`, `LoginPage`, `security.ts`, nginx `server_tokens`, CI SHA kısmen commit'li | Aşağıda **GV1–GV9** |

> ⚠️ Birleşik plandaki "A2 SG0–SG10 ✅" işareti **fazla iyimserdi**: SSRF (SG7) yapılmamış, SG0 `ilerleme.md` yok, SG9 edge kısmı eksik. Bu plan gerçek durumu esas alır.

---

# BÖLÜM A — KARAR GEREKTİRMEYEN İŞLER (büyükten küçüğe)

## GV1 · SG7 — SSRF ve sahte grup sahipliği (S6) [M] — **en büyük açık iş**
*Neden:* `_shared/safe-invite-fetch.ts` yok; hiçbir edge function'da SSRF koruması yok (taranıp doğrulandı).
- `supabase/functions/_shared/safe-invite-fetch.ts`: yalnız `https`, izinli host listesi (WhatsApp/Telegram/Discord davet alan adları), DNS çözümlemesi sonrası özel/loopback/link-local/metadata (`169.254.169.254`) IP reddi, yönlendirme takibi kapalı veya her sıçramada yeniden doğrulama, zaman aşımı + gövde boyut tavanı.
- 3 çağrı noktası ve `group-preview` bu yardımcıyı kullanır (çağrı noktalarını `SECURITY_AUDIT.md` S6'dan al; elle bulma).
- Önce KIRMIZI test (özel IP, `http`, `@` ile host kandırma, yönlendirme zinciri), sonra yama; mutasyon ≥ 4.
- Kabul: kabul testleri yeşil + hiçbir edge function'da yardımcıyı atlayan doğrudan `fetch(userUrl)` kalmadı (taramayla göster).

## GV2 · SG9 edge kalanı — O4, O5, O6, O7 [M → ayrı 4 küçük commit]
Commit `0bd2d105` yalnız `_shared/rate-limit.ts` ve `find-matches`'i değiştirdi. Kalanlar:
- **O4** `send-submission-email`: kimliksiz çağrıda keyfi adrese mail → doğrulanmamış adrese onay maili yok; `x-dispatch-secret`/outbox. *Anonim form grant'i değişirse → §B4.*
- **O5** `submit-survey-response`: tekrar eden `questionId` reddi; `"default-salt"` fallback kaldırılır, salt yoksa **fail-closed**.
- **O6** `whatsapp-autoreply`: `systemInstruction`, çıktı filtresi, alıcı thread'den okunur, ham hata dönülmez. (Bağlantı zaten kapalı; deploy yok.)
- **O7** `deno.json` + `deno.lock`, esm.sh sürümlerini eşitle. **Deno kurulu değilse dur → §B4.**
- Rate-limit anahtarı `user.id`; gateway `X-Forwarded-For` davranışı non-prod'da Burak ölçer (§B).

## GV3 · SG8 doğrulama [S] — kod var, kanıt yok
Commit'te `server.mjs`, `LoginPage`, `security.ts`, nginx, CI var; her biri için ayrı kabul yok.
- **O12 `server.mjs`:** `GET /%5c..%5c.env.local` → 4xx; `0.0.0.0` yerine varsayılan `127.0.0.1`; test ekle.
- **`LoginPage ?next=`:** `//evil.com`, `/\evil`, `javascript:` reddedilir (test).
- **`safeHref`**, ölü `sanitizeHtml` kaldırıldı mı; `EventDetailPage.tsx` başkasının diff'i → o satırlara dokunma.
- **CI SHA sabitleme:** bugün SHA'lı `uses:` sayısı **2**; tüm `.github/workflows/*` taranıp kalan etiketli (`@v4`) action'lar SHA'ya çevrilir.
- **nginx:** `server_tokens off` var; `CLAUDE.md` md.1–6 (add_header kalıtımı, `default_server`) ihlal edilmedi mi — metin testi + **deploy sonrası `curl -I`**.

## GV4 · Uygulanan 6 migration'ın kabul turu [M] — **uygulandı ama sınanmadı**
`20261006000000…050000` canlıda; kabul SQL'leri çalıştırılmadı.
- Her biri için `supabase/qa/*-acceptance.sql` (yoksa yaz; `begin … rollback`, assert'li): anon artık çağıramıyor, authenticated beklenen yolu kullanıyor.
- **Regresyon taraması (frontend deploy öncesi):** `sg2` (anon/authenticated EXECUTE kaldırıldı), `sg6` (`notifications` INSERT, `job_listings` anon SELECT, `todos`, `command_center_hot_fixes` politikaları kaldırıldı), `sg4`/`sg9`. `src/` taramasında doğrudan yazma/okuma çıkmadı; yine de canlıda admin paneli + Cadde bildirimleri + `/ilanlar` elle denenir.
- `sg2` içindeki `alter default privileges … revoke … from public, anon` **gelecekteki** fonksiyonları da etkiler → yeni RPC yazan herkes açıkça `grant` ister; `CLAUDE.md` önerisi olarak `docs/plans/2026-10-05-tur1-claude-md-onerileri.md`'ye yaz (CLAUDE.md'yi düzenleme).
- `check:migrations` yeniden çalıştır; kalan "kaydı yok" listesi ayrı iştir (SEC dışı).

## GV5 · SG10 — düşük/bilgi maddeleri [S, her biri ayrı commit]
`SECURITY_AUDIT.md` "DÜŞÜK / BİLGİ" bölümü: hangilerinin yapıldığı commit mesajı dışında doğrulanmadı → tek tek işaretle. Pepper/anahtar ayırma, anonim form grant'i, `event-published.ts` ekleme → **§B'ye düşer, bu batch'te yapılmaz.**

## GV6 · SG0 + SG11 kapanış [S]
- **SG0:** `docs/security/ilerleme.md` yok → başlangıç kapı değerleri (lint, tsc, test, `npm audit`) yaz.
- **SG11:** tam kapı (`tsc`, lint, `vitest --maxWorkers=2` cwd büyük harfli `C:`, `build`, `check:dead`, `ingest:tools:check`, `verify:text`); `SECURITY_AUDIT.md`'deki her S/O maddesine durum (kapandı / kısmi / açık / insan işi) yaz; **uygulama sırası listesi**. `SECURITY_AUDIT.md` izlenmiyor → commit'e ekle.
- `npm audit` çıktısını raporla (kendi başına `audit fix` yok); `xlsx` ayrı.

## SE1 · A10 doğrulaması [S]
- `faq.json`'ın `index.html` FAQPage'den **betikle** üretildiğini kanıtla (12 soru eşleşmesi, Türkçe karakter diff'i); elle yazılmışsa betikle yeniden üret.
- `npm run build` → `dist/ai/summary.json`, `dist/ai/faq.json`, `dist/.well-known/ai.txt` var mı; sonra `git checkout -- public/sitemap.xml`.
- `nginx.conf.template`'te `/ai/` ve `/.well-known/` SPA fallback'ine düşmüyor mu **oku, değiştirme**. Düşüyorsa değişiklik önerisini yaz, uygulama §B'de.
- `PYTHONUTF8=1`; mevcut dosyaları ezme; rakam yasağı ("164 ülke / 8,8 milyon") taraması.

## SE2 · SG09 — `BlogPostPage` "Tüm yazılar" bağlantısı [S]
`/blog` 301 ile `/radar/rehberler`'e gidiyor; iç bağlantıyı doğrudan `/radar/rehberler`'e çevir (`src/lib/redirects.ts` kaynağına bak). Bileşen testi + mutasyon ≥ 2.

## SE3 · Deploy sonrası SEO doğrulaması [S — komut seti hazır]
`2026-10-05-seo-geo-plani.md` §5'teki `curl` dizisini deploy sonrası çalıştır; sonuçları `docs/plans/` altına yaz. Beklenen: `/blog` göreli Location · `/lansman` 200 · `/commercial` 200 · `/anket` canonical var · olmayan blog yazısı `noindex`. nginx değişikliği çalışan nginx'te hiç denenmedi (yalnız metin testi) → **bu adım atlanamaz.**

---

# BÖLÜM B — KARAR / HESAP / İZİN BEKLEYENLER

| # | Boyut | Konu | Ne gerekiyor |
|---|---|---|---|
| **GB1** | XL 🔴 | **Secret ve geçmiş temizliği (S1, S4, B1/H1–H2)** | Repo private yap → DB parolası döndür → `auth.refresh_tokens`/`sessions` temizle → dump'taki 5 kullanıcıya parola sıfırlama → `git filter-repo --path docs/archive/backups --invert-paths` + force-push → GitHub Support cache temizliği → KVKK/GDPR bildirim değerlendirmesi. Service role (yeni `sb_secret_`), DB parolası, 2 PAT, WhatsApp token, `RAG_API_SECRET`, admin parolası; sonra yerel `refs/original` + `reflog expire` + `gc`. **Aciliyeti en yüksek iş; diğerlerinden bağımsız.** |
| **GB2** | L | **"Dur ve sor" kapıları (§B4)** | `whatsapp_landings` eski INSERT politikasının kaldırılması (yeni bundle yayında olunca) · `send-phone-otp-hook` pepper/anahtar ayırma (mevcut şifreli veriyi bozar) · anonim form tablolarında kolon grant'i · `notifications` doğrudan INSERT çıkarsa tetikleyici/RPC'ye taşıma · `_shared/emails/event-published.ts` (başka oturumun dosyası) · Deno yoksa O7 |
| **GB3** | M | **Canlı deploy + doğrulama (§B9)** | Frontend deploy (SG8 ve `/ilanlar` kota ekranı o zamana kadar görünmez) · `curl -I` güvenlik başlıkları · tarayıcı konsolunda CSP ihlali · `verify:release` · edge deploy (`find-matches`, `check:functions`) · `check:migrations` |
| **GB4** | M | **Gateway `X-Forwarded-For` davranışı** | Rate-limit'in gerçek IP'ye güvenip güvenmediği non-prod'da ölçülür (Burak). |
| **GB5** | S 🔴 | **SG04 — `http://corteqs.net/` 404** | Coolify'da HTTP→HTTPS yönlendirmesi (kullanıcı). |
| **GB6** | S | **SG05 — `mvp.corteqs.net` eski derleme** | Coolify'da eski uygulamayı kapat veya alan adını bu uygulamaya bağla (kullanıcı). |
| **GB7** | S | **SG08 — sitemap'e girmeyen public sayfalar** | `/addcom`, `/tavsiye`, `/liderlik` için "thin content" yargısı insan kararı (`/liderlik` boş tablo olabilir). Karar gelmeden `STATIC_ROUTES`'a eklenmez. |
| **GB8** | S | **`index.html` JSON-LD (karar 8: dokunulmaz)** | `FAQPage` 12 soru, `Offer` 99 € (ürün modeliyle çelişiyor), sabit `dateModified`, "164 ülkede 8,8 milyon" iddiası, `SearchAction`/`Speakable`/`meta keywords`, AI tarayıcı politikası (`robots.txt`), gerçek HTTP 404. Yalnız rapor; karar çıkarsa ayrı plan. |
| **GB9** | S | **`geo audit` skoru** | Deploy sonrası önce/sonra (önce 61; beklenen +3–6). |

---

## Sıra önerisi
1. **GB1** (hemen, sizde) — diğerlerinden bağımsız ve en acil.
2. **GV4** (uygulanmış migration'ları sına) → **GV1** (SSRF) → **GV2** → **GV3** → **GV5** → **GV6** (kapanış).
3. **SE1** → **SE2** → deploy (**GB3**) → **SE3** → **GB9**.
4. Kararlar: GB2, GB4–GB8.

## Kapsam dışı (sorulmadan yapılmaz)
Canlı DB yazma (yeni migration uygulama dahil) · secret rotasyonu · git geçmişi yeniden yazma · `whatsapp_landings` INSERT politikasının kaldırılması · `index.html` JSON-LD · `robots.txt` · `geo fix --apply` · sabit canonical.
