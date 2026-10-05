# P04–P07 ölçüm raporu (5 Ekim 2026)

> Kaynak: `.kilo/plans/1790537630793-tidy-cactus.md` "ONAY GEREKTİREN İŞLER" (P04–P07) ·
> karar 13 (`docs/kalanlar/KALANLAR.md` §2.0): hepsi onaylı.
> Yazan: yan ajan (Claude). Her bölüm ayrı commit'tir. **Sır değeri bu dosyada YOKTUR**;
> anahtarlar yalnız tür + sha256 ilk 8 hanesiyle (parmak izi) anılır.

---

## P04 · `lansman-admin` + `relocation-notifications` yetki okuması

**Sonuç: kusur YOK, deploy GEREKMEDİ.** İki fonksiyon da canlıda yetkisiz çağrıyı veri
döndürmeden reddediyor; canlı sürüm repodaki kapılı kodla aynı.

### Kod okuması

| Fonksiyon | Service role kullanır mı | Kapı | Veri döndürür mü |
|---|---|---|---|
| `lansman-admin` | `createClient(url, serviceRoleKey)` kurar ama **hiç sorgu atmaz** | yok — gerek de yok | **Hayır.** Her POST'a koşulsuz `410 Deprecated` döner |
| `relocation-notifications` | Evet — `relocation_moves` + `relocation_bureaucratic_steps` (RLS atlanır) | `resolveAdminOrSecretCaller` (`_shared/edge-authorization.ts`): `x-dispatch-secret` **veya** admin JWT (`getUser` + `is_admin` RPC); RPC hatası = ret | Yalnız kapıdan geçen çağırana |

`relocation-notifications` kapısı `d4095d17` (28.09 20:37 UTC, "P3a") ile eklendi.

### Canlı ölçüm (5 Ekim, Management API + gerçek HTTP)

`GET /v1/projects/injprdrsklkxgnaiixzh/functions`:

| Fonksiyon | Sürüm | `verify_jwt` | Son güncelleme (UTC) |
|---|---|---|---|
| `lansman-admin` | v31 ACTIVE | `true` | 2026-05-31 15:06 |
| `relocation-notifications` | v27 ACTIVE | `true` | **2026-09-28 20:38** — `d4095d17` commit'inden 1 dk sonra → kapılı sürüm canlıda |

Gerçek POST `{}` istekleri:

| İstek | `lansman-admin` | `relocation-notifications` |
|---|---|---|
| Authorization yok | **401** (gateway, `verify_jwt=true`) | **401** (gateway) |
| Anon anahtar (geçerli JWT) | **410** `{"error":"Deprecated. …"}` | **401** `{"error":"unauthorized"}` ← fonksiyonun KENDİ reddi |
| Anon + yanlış `x-dispatch-secret` | **410** | **401** `{"error":"unauthorized"}` |

Anon anahtarla gelen isteğin gövdesi fonksiyonun kendi `unauthorized` metni: gateway
anon JWT'yi geçiriyor (beklenen — `verify_jwt` yetki DEĞİLDİR), reddi kod yapıyor.

### Kanıtlanamayan

- Meşru yolun (doğru `NOTIFY_DISPATCH_SECRET` veya admin JWT → 200) bugün çalıştığı
  **denenmedi** — admin oturumu yok, secret'ı çağrıda kullanmak gereksiz risk.
- `lansman-admin` hâlâ `SUPABASE_SERVICE_ROLE_KEY` okuyor (yoksa 500). Fonksiyon ölü
  olduğu için anahtarı okumasının işlevi yok → **U01 spike'ında** ele alındı.

### Yan bulgu (P04 kapsamı dışı, kayda geçti)

`npm run check:functions` → **repo 16 · canlı 15**: `whatsapp-autoreply` **canlıda YOK**.
W05/W06 "bitti" diye kapandı ama W06 kabulünün "deploy sonrası 16/16" maddesi tutmuyor.
Etkisi bugün sıfır (`whatsapp_bot_settings.enabled=false`; webhook'un ateşlediği çağrı
404 alır, `waitUntil` ile beklenmediği için Meta yanıtı bozulmaz) ama bot açılmadan önce
deploy + paylaşımlı secret kontrolü şart → kullanıcı-adımları dosyasına yazıldı.

---

## P05 · Git geçmişi sır taraması

**Sonuç: 🔴 1 KRİTİK gerçek bulgu.** Legacy `service_role` JWT'si **herkese açık
GitHub deposunun** (`ubterzioglu/corteqsmvp`, `visibility=PUBLIC` — `gh repo view` ile
ölçüldü) `origin/main` geçmişinde ve **güncel ağacında** duruyor (bu batch yerelde
temizledi, push edilmedi → GitHub'daki `main` hâlâ taşıyor), ve anahtar **bugün GEÇERLİ**.

### Yöntem

`gitleaks`/`trufflehog` makinede yok. Yerine betik: `git log --all -p -U0` (1.533 commit)
üzerinde 10 desen (JWT · `sb_secret_` · `sb_publishable_` · `sk_live/test` · `AIza` ·
`gh*_` · `EAA…` Meta · `sbp_` Supabase PAT · parolalı postgres URL · PEM özel anahtar) +
`.env.local`'daki her gerçek değerin geçmişte **birebir** geçip geçmediği. Çıktı yalnız
tür · parmak izi · commit · dosya; değer hiçbir yere yazılmadı. JWT'lerin yalnız `role`
iddiası çözüldü. Geçerlilik yalnız **HTTP durum koduyla** ölçüldü.

### Bulgular

| # | Tür (parmak izi) | Nerede | Uzakta mı | Bugün geçerli mi | Düzeltilmeli mi |
|---|---|---|---|---|---|
| 1 | 🔴 JWT `service_role` / `injprdrsklkxgnaiixzh` (`2526e534`) | `deployerror.txt` (`3c937293`, 07.06 "oh") + `deployment-…-all-logs-….txt` (`f5927714`, 07.06) → `c025a763` (11.06) dosyayı `docs/archive/root-2026-06-11/deployerror.txt`'e TAŞIDI, **silmedi** | **EVET** — `origin/main` + `origin/codex/limit-sprint-2026-08-30` | **EVET** — `auth/v1/admin/users` **200**, `rest/v1/` **200** | **EVET, ACİL** — bkz. aşağı |
| 2 | JWT `anon` / `injprdrsklkxgnaiixzh` (`1181fa29`) | aynı iki dosya + `.env.local` | evet | — | Hayır — anon anahtar zaten frontend paketinde herkese açık |
| 3 | JWT `anon` / `azrxqgzfryzpaqchhrkk` (`83fafb4b`) | `docs/reference/global-network-bridge/vite.config.ts` | evet | — | Hayır — başka projenin anon anahtarı (herkese açık tür) |
| 4 | `.env.local` dosyasının TAMAMI (`52e6faf4`, 30.05 "first") — service_role JWT, 2 `sbp_` PAT, Meta `ACCESS_TOKEN` | yalnız `refs/original/refs/heads/main` + `refs/original/refs/stash` (filter-branch yedek ref'leri) | **HAYIR** — hiçbir uzak dalda yok | 2 PAT: **401/401** (ölü) · Meta token: W01'de ölü ölçülmüştü (190/467) · service_role: #1 ile aynı anahtar | Yerel temizlik önerilir (`refs/original` silinmeli) — kullanıcı kararı |
| 5 | Meta `EAA…` deseni ×~100 | `info-*.html`, `CLAUDE.md`, kariyer arşivi | evet | — | **Yanlış pozitif** — base64 gömülü görsel verisi (önceki bağlam `…AAAQhAAAIQgAAEIAABC…`) |
| 6 | Parolalı postgres URL | `scripts/migration/restore-selfhost.mjs` | evet | — | **Yanlış pozitif** — yardım metnindeki 6 harfli örnek kelime |

`.env.local`'daki bugünkü değerlerin geçmişte birebir geçişi: `SUPABASE_SERVICE_ROLE_KEY`
(bugün `sb_secret_` türünde) **0** · `SUPABASE_ACCESS_TOKEN` **0** · `WHATSAPP_ACCESS_TOKEN`
**0** · `WHATSAPP_APP_SECRET` **0** · `NOTIFY_DISPATCH_SECRET` **0** · `RADAR_NEWS_CRON_SECRET`
**0** · `GEMINI_*` **0** · `TAVILY_*` **0** · `SERPAPI` **0** · `ZOHO_SMTP_PASSWORD` (eşik altı,
taranmadı — kısa değer). Geçenler yalnız açık türden: proje kimliği, anon/publishable anahtar,
e-posta adresleri, Meta telefon/işletme kimlikleri.

### 🔴 Ölçümün çürüttüğü öncül

KALANLAR U01: *"anahtar bir ara diske yazılmıştı (`aeb2ea8` geçmişten temizledi; ölçüldü —
`origin`'e hiç ulaşmadı)"*. Bu **o tek olay için** doğru olabilir, ama legacy service_role
JWT projede tektir ve **7 Haziran'dan beri** herkese açık depoda, iki dalda, ve 5 Ekim'e
kadar güncel ağaçta duruyordu. "Anahtar dışarı sızmadı" varsayımı **geçersiz.**

### Bu batch'te yapılan (geri alınabilir)

- `docs/archive/root-2026-06-11/deployerror.txt` içindeki **2 service_role JWT**
  `<REDACTED: service_role JWT - P05 05.10>` ile değiştirildi (anon olanlar dokunulmadı,
  CRLF korundu). **Bu yalnız güncel ağacı temizler; geçmiş ve GitHub'daki eski commit'ler
  anahtarı taşımaya devam eder.** Push edilmedi.

### Gerçek düzeltme (kullanıcıda — bkz. U01 spike + kullanıcı-adımları)

1. Legacy JWT anahtarlarını **iptal etmek** tek gerçek çözüm: Supabase panelinde
   *"Disable JWT-based API keys"* (veya JWT secret rotasyonu). 🔴 Bunu ajan YAPMAZ ve
   önce edge function'ların yeni anahtar düzenine taşındığı doğrulanmalı (U01 spike).
2. Geçmişi yeniden yazmak (`git filter-repo`) herkese açık depoda **yetmez** — anahtar
   4 aydır açıkta; fork/önbellek olabilir. Yine de istenirse ayrı karardır (force-push).
3. Yerel `refs/original/*` yedek ref'leri `.env.local`'ın tamamını taşıyor; uzakta değil,
   ama makine paylaşılırsa risk. Silinmesi kullanıcı kararı.

### Kanıtlanamayan

- Anahtarın **kötüye kullanılıp kullanılmadığı** ölçülmedi (Auth/REST erişim günlüğü
  incelemesi ayrı iş; 04.10 erişim logu raporu K12 ile ilişkili olabilir).
- Tarama desen tabanlıdır; kısa (<16 karakter) veya biçimsiz sırları kaçırabilir.

---

## P06 · Türkçe collate ölçümü

**Sonuç: canlı ölçüm bu oturumda YAPILAMADI** — canlı DB'ye `psql` çağrısı oturumun izin
denetçisi tarafından reddedildi (salt-okunur SQL olmasına rağmen). Yeniden denenmedi,
dolanılmadı. Yerine: önceki ölçümün yöntemi incelendi ve yerel ICU ile sınandı.

### 🔴 A08c'nin "tr-TR-x-icu gerekmiyor" sonucu büyük olasılıkla YANLIŞ

A08c (`7e79be4`, 29.09) canlıda yalnız **tek harf çiftlerini** ölçtü:
`c<ç<d · g<ğ<h · h<ı<i<j · I<İ<J · o<ö<p · s<ş<t · u<ü<v` → "7/7 doğru". Bu yöntem kusuru
ayırt EDEMEZ: ICU `en_US` Türkçe harfleri ayrı harf değil, **aksanlı varyant** (ikincil
fark) sayar. Tek harfte ikincil fark sırayı yine doğru verir; **kelimede** birincil fark
(sonraki harf) önce gelir ve sıra bozulur.

Yerel ölçüm (Node `Intl.Collator`, ICU 78.2 / CLDR 48 — Postgres ICU ile aynı CLDR kuralları,
farklı sürüm):

| Çift (Türkçede SOL < SAĞ) | `en-US` | `tr` |
|---|---|---|
| `c` / `ç` | ✅ | ✅ |
| `Cuma` / `Çay` | ❌ (Çay önce) | ✅ |
| `Su` / `Şeker` | ❌ | ✅ |
| `Ok` / `Ödül` | ❌ | ✅ |
| `Uzun` / `Ümit` | ❌ | ✅ |
| `Gaz` / `Ğa` | ❌ | ✅ |
| `ılık` / `ip` | ❌ (ı'yı i'den sonra koyar) | ✅ |
| `Isparta` / `İzmir` | ✅ | ✅ |

13 kelimelik liste: `en-US` → `Çay < Cuma < Iğdır < ip < Isparta < İzmir < ılık < Ödül < Ok
< Şeker < Su < Ümit < Uzun` · `tr` → `Cuma < Çay < Iğdır < ılık < Isparta < ip < İzmir < Ok <
Ödül < Su < Şeker < Uzun < Ümit`. **Tek harf testi geçiyor, kelime testi 6/7 düşüyor.**

### Etki (kod okuması)

Sunucu sıralaması bugün `src/lib/dashboard/command-center-items/queries.ts:70`
(`query.order(order.column, …)`) üzerinden — A08b'nin sıralanabilir başlıkları. Başlık/metin
kolonuna göre sıralanan Komuta Merkezi listesi Ç/Ş/Ö/Ü/Ğ/ı ile başlayan kayıtları yanlış
yere koyar. Kullanıcıya veri kaybı yok, yalnız sıra; **önem: düşük-orta.**

### Yapılan / kalan

- Hazır ölçüm dosyası: `docs/operations/2026-10-05-p06-turkce-collate-olcum.sql`
  (salt-okunur; 7 kelime çifti × varsayılan/`tr-TR-x-icu` + 54 satırlık `cadde_cities`
  ayrışma sayısı). **Kullanıcı ya da DB izni olan oturum koşmalı.**
- Canlı ölçüm `varsayilan_dogru = false` gösterirse düzeltme seçenekleri (karar + migration
  gerektirir, bu batch'te YAPILMADI): (a) sıralanan metin kolonlarına
  `collate "tr-TR-x-icu"` (kolon tanımı veya sıralı view), (b) PostgREST `.order()`
  collate desteklemediği için sıralamayı bir RPC/view'a taşımak.
- KALANLAR'daki A08c satırı ("tr-TR-x-icu gerekmedi") bu ölçüm koşulana dek **şüpheli**.

---

## P07 · A09a · A10b · A11a/b · A12b · A99 — tanımlar ve durum

**Sonuç: P07 listesi BAYAT.** Planın (`tidy-cactus.md`, 28.09) saydığı beş maddenin beşi
de 28–30.09'da kapanmış; KALANLAR "Kapananlar" tablosunda kanıtlarıyla duruyor. Yeni iş
YOK; yalnız bugün yeniden ölçülebilenler ölçüldü.

| Madde | Tanım (kaynak) | Kapanış kanıtı (git) | 05.10 yeniden ölçüm |
|---|---|---|---|
| **A09a** bucket MIME | `revision-attachments` kovasına belge MIME'ları (KALANLAR Kapananlar) | `1a3a5ea` (29.09) mig `20260929120000` `applied/`'da · A09b `7624e78` · A09c `c8ed5ff` | ❌ yapılamadı — kova ayarı yalnız service anahtarı/DB ile okunur, DB çağrısı bu oturumda izinsiz |
| **A10b** | ⚠️ KALANLAR'da **tanımı YOK** (yalnız A10 satırı). Tanım geçmişte: `70201ec9` → "A10b · Forma bağla + URL alanını değiştir (~20 dk)" (etkinlik kapağı) | `96abd0a6` (28.09) "kapak gorseli yukleme - ham URL kutusu kaldirildi (A10a+A10b)" · kova `cf8db1a` | kod ağaçta (`EventCoverUpload.tsx`); canlı ekran denenmedi |
| **A11a/b** cadde sil/düzenle RPC | `delete_cadde_post_v1` + `update_cadde_post_v1` | `9044dfd` mig `20260929130000` · `908170d` mig `20260929140000` (ikisi de `applied/`'da) · CD04 (03.10) canlı kabul 10/10 | ❌ `prosecdef` yeniden ölçülemedi (DB izni) |
| **A12b** site-assistant sayfa bağlamı | `askSiteAssistant(messages, pageContext)` | `299608c` (30.09) | ✅ `site-assistant` **v22 ACTIVE `verify_jwt=true`** (Management API, 05.10) — A12b'deki v19'dan sonra 3 deploy daha olmuş (N05 vb.) |
| **A99** Radar | bayat kilit + `verify_jwt` düzeltmesi | `f6b5c6f` (28.09) · `86c1f63` (30.09) · 30.09 08:39 uçtan uca 125 aday | ✅ `radar-news-scan` **v36 ACTIVE `verify_jwt=false`** (30.09 07:36 UTC) · ❌ son koşu/aday sayısı yeniden ölçülemedi (admin tablosu, DB izni) |

**Kanıtlanamayan:** Bu oturumda canlı DB okunamadığı için A09a/A11 ve Radar'ın **bugün**
de sağlıklı olduğu yeniden kanıtlanmadı; kanıt 28–30.09 ölçümleridir.
