# W03 — Meta Graph gönderim yolunu `_shared`'a çıkar (uygulama planı)

> **Tarih:** 4 Ekim 2026 · **Yazan:** plan oturumu · **Uygulayan:** BAŞKA ajan
> **Batch:** W03 (KALANLAR.md → W bölümü) · **Boyut:** küçük · **Davranış DEĞİŞMEZ**
> **Kapı:** 🟢 — "Sıra bağlayıcı" kilidi 04.10 karar turunda gevşedi (KALANLAR §2.0 karar 1).
> Onay İSTEME; başla.
>
> Bu dosya kendi kendine yeter. Kodu okuyup şartnameyi yeniden türetmene gerek yok.

## 0 · Ne yapılacak (tek cümle)

`supabase/functions/whatsapp-reply/index.ts` satır 65–90'daki Graph API çağrısını
(`sendMessage` kapanışı) ve satır 15–16'daki sürüm doğrulamasını yeni bir
`_shared/whatsapp-graph.ts` modülüne taşı. **Davranış birebir aynı kalır.** Sebep:
W05'te yazılacak `whatsapp-autoreply` aynı yolu kullanacak ve **ikinci bir Graph
istemcisi yazılmayacak.**

## 1 · Ölçülmüş başlangıç durumu (04.10 — ezberleme, başlarken yeniden doğrula)

| Ne | Ölçüm |
|---|---|
| Graph çağrısının tek yeri | `whatsapp-reply/index.ts:65-90`. `graph.facebook.com` / `WHATSAPP_GRAPH_API_VERSION` repoda **yalnız bu dosyada** geçiyor. |
| Sürüm doğrulaması | `index.ts:15-16` — `/^v\d+\.\d+$/`, geçersizse **sessizce** `"v26.0"`'a düşer (fırlatmaz). |
| Hata kodları | `meta_http_<status>` ve `meta_response_invalid`. `index.ts` bunları handler'a fırlatır; handler `errorCode = error.message.slice(0,120)` ile `admin_finalize_whatsapp_reply`'a yazar. |
| 🔴 **Test boşluğu** | `whatsapp-reply.test.ts` dört testi `sendMessage`'i **sahte `vi.fn()`** ile değiştiriyor. Yani Graph yanıtını ayrıştıran 26 satır **bugün HİÇ test edilmiyor.** Bu batch'in asıl kazancı bu. |
| SQL↔TS ayna | `applied/20260830135000_harden_whatsapp_reply_finalize.sql:19` — `p_provider_message_id !~ '^wamid\.'` ise SQL reddeder. TS'teki `startsWith("wamid.")` kontrolü bunun aynasıdır. **İkisi birlikte kalmalı.** |
| Vitest kapsamı | `vitest.config.ts:44` → `supabase/functions/**/*.test.ts` dahil. Yeni test otomatik koşar. |
| `check:dead` | Yalnız `src/main.tsx`'ten yürür → `supabase/` **etkilenmez**. |
| `config.toml` | `[functions.whatsapp-reply] verify_jwt = true` zaten var. Değiştirme. |
| Canlı sırlar | `WHATSAPP_*` beşi **yer tutucu** (U09 bekliyor). ⇒ Meta'ya gerçek gönderim bu batch'te **doğrulanamaz**; aşağıdaki §5 buna göre yazıldı. |

## 2 · Dokunulacak dosyalar (tam liste — başkasına dokunma)

| Dosya | İş |
|---|---|
| `supabase/functions/_shared/whatsapp-graph.ts` | **YENİ** |
| `supabase/functions/_shared/whatsapp-graph.test.ts` | **YENİ** |
| `supabase/functions/whatsapp-reply/index.ts` | `sendMessage` + sürüm satırlarını modül çağrısına çevir |
| `supabase/functions/_shared/whatsapp-reply.ts` | **DOKUNMA** (`MetaReplyPayload` tipi orada kalır; taşıma bu batch'in işi değil) |
| `src/lib/admin-shell/admin-updates/2026-10.ts` | kapanış kaydı (en üste, tek giriş) |
| `docs/kalanlar/KALANLAR.md` | W03 ✅ + kanıt satırı |

⚠️ Çalışma ağacında **paralel bir oturumun** tavsiye (`recommendations`) dosyaları açık
duruyor. Onlara dokunma, commit'ine alma. Commit'te **her zaman pathspec**:
`git commit -m "..." -- <yukarıdaki dosyalar>`.

## 3 · Hedef API (bu imzaya sadık kal — W05 buna dayanacak)

```ts
// supabase/functions/_shared/whatsapp-graph.ts
import type { MetaReplyPayload } from "./whatsapp-reply.ts";

export const DEFAULT_GRAPH_VERSION = "v26.0";

export interface GraphSendConfig {
  accessToken: string;
  phoneNumberId: string;
  graphVersion: string; // resolveGraphVersion() çıktısı
}

/** Geçersiz/boş/undefined -> DEFAULT_GRAPH_VERSION. ASLA fırlatmaz (mevcut davranış). */
export function resolveGraphVersion(candidate: string | null | undefined): string;

export function buildGraphMessagesUrl(config: GraphSendConfig): string;

/** Başarıda wamid.* döner. Hata kodları mevcutla BİREBİR: meta_http_<status> | meta_response_invalid */
export async function sendGraphMessage(
  config: GraphSendConfig,
  payload: MetaReplyPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<string>;
```

Notlar:
- Import yolları Deno için **`.ts` uzantılı** yazılır (`./whatsapp-reply.ts`), mevcut `_shared`
  dosyalarındaki gibi. Vitest bunları çözüyor.
- `fetchImpl` parametresi **test için** var; üretimde varsayılan `fetch`.
- `index.ts` en üstteki **"gerekli sır eksikse yükleme anında fırlat"** kontrolünü
  (satır 18–20) AYNEN korur. Sırların varlık kontrolü modüle taşınmaz.
- `index.ts` sonrası şuna benzer olur: `sendMessage: (payload) => sendGraphMessage(graphConfig, payload)`.

## 4 · Testler — önce yaz (RED), sonra taşı (GREEN)

`whatsapp-graph.test.ts` — `fetchImpl` enjekte edilir, ağa gidilmez. **Karakterizasyon**
testleri: mevcut davranışı kilitler, "iyileştirme" yapmaz.

| # | Test | Beklenen |
|---|---|---|
| 1 | URL + istek biçimi | `https://graph.facebook.com/v26.0/<id>/messages` · `POST` · `Authorization: Bearer <token>` · `Content-Type: application/json` · gövde = `JSON.stringify(payload)` |
| 2 | `phoneNumberId` kodlanır | `a/b?c` → URL'de `a%2Fb%3Fc` (`encodeURIComponent`) |
| 3 | Başarı | `{messages:[{id:"wamid.X"}]}` → `"wamid.X"` döner |
| 4 | HTTP hatası | 401 / 429 / 500 → `meta_http_401` / `meta_http_429` / `meta_http_500` |
| 5 | Gövde ayrıştırılamıyor | `response.json()` fırlatır + `ok=false` → `meta_http_<status>` |
| 6 | 🔴 **PİNLE, "düzeltme"** | `200` ama gövde `null`/string → **`meta_http_200`** (mantıksız görünür ama MEVCUT davranış; handler hata kodu olarak bunu yazıyor) |
| 7 | `messages` yok / boş | `{}` ve `{messages:[]}` → `meta_response_invalid` |
| 8 | wamid öneki | `{messages:[{id:"abc"}]}`, `id` sayı, `id` yok → `meta_response_invalid` |
| 9 | `resolveGraphVersion` geçerli | `"v26.0"`, `"v25.1"`, `"v100.12"` olduğu gibi döner |
| 10 | `resolveGraphVersion` geçersiz | `"26.0"`, `"v26"`, `"latest"`, `""`, `undefined`, `null`, `"v26.0/../x"` (sonda `$` yoksa geçer), `"v26.0 "` (sonda boşluk), `"xv26.0"` (başta `^` yoksa geçer) → hepsi `"v26.0"` |
| 11 | 🔴 **Sır sızıntısı** | Her hata yolunda fırlatılan `error.message` içinde `accessToken` metni **YOK** |
| 12 | Tek istemci kilidi | Kaynak sözleşmesi (aşağıda) |

**Test 12 — "ikinci Graph istemcisi yazılmaz" kilidi** (`readFileSync` deseni
`rate-limit-contract.test.ts`'tekiyle aynı): `supabase/functions/` altındaki **tüm**
`index.ts` dosyalarını tara (`readdirSync`); `graph.facebook.com` dizesi **yalnızca**
`_shared/whatsapp-graph.ts`'te geçmeli. Ek olarak `whatsapp-reply/index.ts`
`from "../_shared/whatsapp-graph.ts"` import'unu içermeli. ⚠️ Bu kilit W05'in
`whatsapp-autoreply/index.ts`'ini de **gelecekten** korur — dizin taramalı olsun, sabit
liste olmasın (S/G/C serisi deseni: "dizin taramalıdır").

⚠️ Beklenen sayıyı yazmadan önce **kümeyi say.** Bu repoda iki kez "1 olmalı" denip 5
çıktı (G11b dersi).

## 5 · Doğrulama

```bash
# 1) tam takım — yalnız ilgili dosya YETMEZ
npx tsc -p tsconfig.app.json --noEmit
npm run test
npm run lint                 # ⚠️ ~29 hata corteqs-ekstre-motoru/ içinde (takipsiz, senin değil); kendi dosyalarının 0 olduğunu ayır
npm run check:dead
npm run verify:text
```

**Mutasyon turu (6/6 hedef)** — her mutasyonu uygula → test koşmalı ve **düşmeli** →
geri al. ⚠️ Düzenek "betik patladı" ile "iddia düştü"yü AYIRT ETMELİ: özet satırına
("TUMU YAKALANDI") bak, çıktıda "FAIL" yokluğuna değil. (CC/KS serisinde üç sahte
"geçti" bu yüzden çıktı.)

| M | Mutasyon | Hangi test yakalar |
|---|---|---|
| M1 | `Authorization` başlığını sil | 1 |
| M2 | `encodeURIComponent`'i kaldır | 2 |
| M3 | `startsWith("wamid.")` kontrolünü sil | 8 |
| M4 | sürüm regex'inden `^` veya `$` çıkar | 10 |
| M5 | hata mesajına `accessToken` ekle (`meta_http_${status}:${token}`) | 11 |
| M6 | `graph.facebook.com`'u `whatsapp-reply/index.ts`'e geri yaz | 12 |

**Canlı doğrulama — NE yapılabilir, NE yapılamaz:**

- ❌ Meta'ya gerçek gönderim **doğrulanamaz** (U09 secret'ları yer tutucu). Bunu
  "doğrulandı" diye yazma; kapanış kaydına açıkça **"U09'a kadar doğrulanamadı"** yaz.
- ✅ Fonksiyon **açılıyor ve handler'a ulaşıyor** kanıtlanabilir. Deploy sonrası, anon
  anahtarla (admin kimliği KULLANMA):
  1. `POST …/functions/v1/whatsapp-reply`, `Authorization: Bearer <ANON_KEY>`, gövde `{}`
     → **HTTP 400 `{"error":"invalid_request"}`** (boot + handler kanıtı).
  2. Aynı çağrı, gövde = geçerli biçimli iki UUID + `body` → **HTTP 409
     `{"error":"reply_not_allowed"}`** — **403 DEĞİL.** 🔴 Ölçüldü (04.10): `anon`'un
     `admin_prepare_whatsapp_reply` üzerinde EXECUTE yetkisi **YOK** (KS03, dün çekildi),
     yani çağrı RPC'ye ulaşır ama `permission denied` ile düşer; mesajında `admin_required`
     geçmediği için handler onu genel `reply_not_allowed`'a (409) çevirir. Eski belgelerde
     "anon → 403 admin_required" yazabilir; **o bilgi KS03 öncesinden kalmadır.**
     403 görmek için **girişli ama yönetici olmayan** bir kullanıcı JWT'si gerekir — bu
     batch için zorunlu değil, istersen ek kanıt olarak yap.
  - ⚠️ `verify_jwt` yetki DEĞİLDİR: anon anahtar geçerli bir JWT'dir, gateway'den geçer.
    Reddi **fonksiyonun kendisi** yapar. 401 gelirse ve gövde `{"error":"unauthorized"}`
    değilse gateway reddediyordur → `verify_jwt` ayarını ÖLÇ.
  - Bu iki çağrı **hiçbir satır yazmamalı.** `whatsapp_customer_messages` taban sayısı
    04.10'da **0** ölçüldü; çağrılardan sonra yine **0** olmalı (önce/sonra `count(*)`).

## 6 · Deploy

```bash
supabase functions deploy whatsapp-reply --project-ref injprdrsklkxgnaiixzh
npm run check:functions      # sapma 0 olmalı
```

- **Coolify edge function deploy ETMEZ.** Commit'lemek canlıya çıkarmaz.
- Bu Bash'te `dangerouslyDisableSandbox: true` ister (ağ/CLI).
- Deploy sonrası **canlı `verify_jwt` değerini ÖLÇ** (Management API
  `/v1/projects/<ref>/functions`) — CLI, `config.toml` girdisi yoksa varsayılanı uygular
  ve hata hiçbir yerde görünmez (A99-R2). Beklenen: `whatsapp-reply` → `true`.
- Deploy'u **testler yeşil olmadan** yapma. Deploy sonrası §5'teki iki smoke çağrısı kırmızıysa
  **önceki sürüme dön** (`git revert` + yeniden deploy) ve dur; W04'e geçme.

## 7 · Kapanış

1. `src/lib/admin-shell/admin-updates/2026-10.ts`'e **tek** giriş (18:00 Berlin özet
   maili buradan beslenir). Düz dille: "WhatsApp gönderim yolu ortak modüle taşındı,
   davranış değişmedi; Meta'ya gerçek gönderim sırlar girilene dek doğrulanamadı."
2. `KALANLAR.md`: W03'ün başına ✅ + kanıt satırı (commit hash · test sayısı · mutasyon
   N/6 · iki smoke HTTP kodu · `check:functions` · canlı `verify_jwt`). Satırı **Kapananlar**
   tablosuna taşı.
3. Tek commit, pathspec'li, Türkçe mesaj (repo konvansiyonu). Trailer'lar:
   `Constraint:` (davranış değişmez) · `Rejected:` (aşağıya bak) · `Not-tested:`
   (Meta'ya gerçek gönderim — U09).
4. **Push etmeden önce** `git status -sb` + tam takım. Push sonrası `gh run list --limit 1`.

## 8 · Tuzaklar (bu repoda yaşanmış — ihlal etme)

1. **"Küçük iyileştirme" YAPMA.** Test 6'daki `meta_http_200` mantıksız görünür; yine de
   mevcut davranış. Bu batch'in adı "davranış DEĞİŞMEZ". İyileştirme istiyorsan ayrı not
   bırak, W04+ planına gir.
2. **`MetaReplyPayload`'u taşıma.** `_shared/whatsapp-reply.ts`'te kalır; yeni modül
   ondan `import type` yapar. Taşırsan `whatsapp-reply.test.ts` ve handler bağımlılıkları
   değişir — kapsam dışı.
3. **Sırları loglama / mesaja koyma.** `index.ts:106` yorumu ("Tokens, recipients,
   message bodies and provider responses are never logged") bağlayıcı. Hata mesajı
   yalnız kod taşır.
4. **Yer tutucu sırlar.** `.env.local`'daki `WHATSAPP_*` değerlerini yazdırma, commit'leme,
   sohbete koyma. Kanıt gerekiyorsa yalnız digest.
5. **Windows/PowerShell.** Backtick içeren metni PowerShell çift tırnaklı dizeyle
   yazma — backtick kaçış karakteri olur, kod işaretleri silinir. Dosya yazarken `Write`
   aracını veya tek tırnaklı here-string kullan; **yazdıktan sonra** backtick sayısını doğrula.
6. **CRLF.** Windows çalışma kopyasında `LF will be replaced by CRLF` uyarısı normaldir;
   mutasyon betikleri CRLF yüzünden "uygulanamadı" diyebilir → mutasyonun gerçekten
   uygulandığını (`git diff`) doğrula.

## 9 · Reddedilen alternatifler

| Alternatif | Neden reddedildi |
|---|---|
| `whatsapp-autoreply`'ı doğrudan `whatsapp-reply`'ı HTTP ile çağıracak şekilde yazmak | Yanıt yolu `admin_prepare…` ister → admin JWT; bot admin değil (W04 `bot_*` RPC çifti bu yüzden var). Ayrıca iki fonksiyon arası HTTP, gecikme + ek hata yüzeyi. |
| `sendGraphMessage` içinde `phoneNumberId`/token'ı `Deno.env`'den okumak | Modül Deno API'sine bağlanır → vitest'te test edilemez (`_shared/*.test.ts` deseni Deno API'siz saf mantık ister). Yapılandırma çağırandan gelir. |
| Geçersiz sürümde fırlatmak | Mevcut davranış sessiz geri dönüş; fırlatmak canlı fonksiyonu **yükleme anında** düşürürdü. |
| W03'ü W04 ile birleştirmek | W03 saf yeniden düzenleme (kolay geri alınır); W04 migration (geri alınamaz). Tek commit'te karışırsa regresyon kaynağı ayrıştırılamaz. |

## 10 · Bittiğinde sıradaki

**W04** (migration: `is_automated` + `bot_*` RPC çifti + `whatsapp_bot_settings`) — bu planın
kapsamı DIŞINDA; W04 başlamadan önce KALANLAR'daki şartnamesini oku. Karar bloğu §2.0
karar 1 W03–W06'nın şimdi yazılabileceğini söylüyor; **W07 (test turu) ve W01/W02 secret
gelmeden koşmaz.**
