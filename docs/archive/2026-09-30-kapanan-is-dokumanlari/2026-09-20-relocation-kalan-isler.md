# Relocation motoru — KALAN İŞLER (2026-09-20)

Bu dosya, 20 Eylül 2026 oturumunda **bitmeyen** işleri tutar. Ne yapıldığının tam
dökümü ve gerekçeleri: [2026-09-20-relocation-motor-plani.md](2026-09-20-relocation-motor-plani.md).

Commit: `6ab181e` (25 dosya) + `chore(agent)` katalog tazeleme. **main'e push edildi.**

---

## Durum özeti

| Katman | Durum |
|---|---|
| Veritabanı (4 tablo + RLS + grant) | ✅ Canlıda. `check:migrations` 398/398 |
| Edge function `relocation-assistant` | ✅ **Deploy edildi ve canlı duman testi geçti** |
| Frontend (sekmeler, çoklu plan, header linki) | ✅ Push edildi → Coolify otomatik alır |
| **İçerik (maliyet + belge verisi)** | ❌ **BOŞ — asıl kalan iş bu** |

---

## 1. İÇERİK — tek gerçek blokaj

Dört tablo da canlıda ve **sıfır satır**. Maliyet ve belge sekmeleri verisi olmadığı
için **hiç çizilmiyor** (bilinçli: boş sekme göstermiyoruz). Yani bugün kullanıcı
`/relocation`'a girerse eskisinden tek farkı Asistan sekmesi ve plan devam
ettirmedir.

**Ne yapılacak:** şablonu doldur ve çalıştır.

Dosya: **`docs/operations/2026-09-20-relocation-icerik-seed-sablonu.sql`**

```powershell
$env:PGPASSWORD = "<SUPABASE_DB_PASSWORD>"
psql "host=aws-1-eu-west-2.pooler.supabase.com port=5432 dbname=postgres `
  user=postgres.injprdrsklkxgnaiixzh sslmode=require" `
  -v ON_ERROR_STOP=1 -f docs/operations/2026-09-20-relocation-icerik-seed-sablonu.sql
```

⚠️ Dosyayı UTF-8 olarak kaydet ve **`-f` ile dosya olarak gönder**. PowerShell komut
satırından geçen Türkçe karakter bozulur (ı→i). Şablonun sonunda doğrulama sorguları
var — "girdim" demeden önce satırı gör.

⚠️ Önce prova: başına `BEGIN;` sonuna `ROLLBACK;` ekleyip bir kez koş.

**Kurallar (şablonda da yazılı):**
- `item_key` yalnız 6 değer alır: `rent`, `groceries`, `transport`, `insurance`,
  `utilities`, `childcare`. Başkası CHECK kısıtına takılır.
- Tutarlar **sayısal** (`amount_min`/`amount_max`). "800-1500/ay" gibi metin girilmez.
- `household_size` gerçek rakamla girilir; motor katsayıyla **çarpmaz**.
- Verisi olmayan ülke için satır ekleme — sekme çizilmez, bu doğru davranıştır.

---

## 2. Deploy sonrası doğrulama

Frontend push edildi, Coolify otomatik alacak. Deploy bitince:

- [ ] `/relocation` aç → "Taşınma Planlayıcı" header menüsünde görünüyor mu
- [ ] Bir plan oluştur → **sayfayı yenile** → plan kayboluyor mu? (kaybolmamalı,
      URL'de `?move=` olmalı). Bu düzeltilen kusurun asıl testi.
- [ ] Asistan sekmesinde bir soru sor → yanıt geliyor mu
- [ ] Tarayıcı konsolunda CSP ihlali var mı

⚠️ **Edge function'ları Coolify DEPLOY ETMEZ.** `Dockerfile` yalnız frontend kurar,
`.github/workflows` yok. Fonksiyon değişirse `supabase functions deploy
relocation-assistant` elle çalıştırılmalı.

---

## 3. Yapılmayan sekmeler (veri kaynağı yok)

Referansta vardı, bizde **bilerek yapılmadı**: **İş & İşletmeler · Okullar ·
Hoşgeldin Paketi**. Referansta bunlar tamamen dosyaya gömülü dizilerdi; bizde
besleyecek veri kaynağı yok. Gömülü mock eklemek referansın kusurunu taşımak olurdu.

Yapılacaksa önce veri kaynağı kararı gerekir (yeni tablo mu, mevcut
`catalog_items`/`relocation_services` mi).

---

## 4. Bilinçli açık bırakılanlar

Bağımsız inceleme bunları buldu; düzeltilmedi ve sebepleri şunlar:

- **Rate limit TOCTOU yarışı.** Okuma ile yazma arasında eşzamanlı istek sayacı
  bir-iki aşabilir. Tam atomiklik tek SQL ifadesi/RPC ister. Korunan şey sürekli
  çağrı akışı, tek fazladan istek değil. `find-matches` de aynı desende.
  *(Karşılaştırmanın metin yerine epoch ile yapılması DÜZELTİLDİ — o hata sınırı
  tamamen öldürüyordu.)*
- **Fazlalık RLS politikaları.** `relocation_move_progress` ve `_documents`'ta
  `for select` + `for all` aynı koşulda. `for all` zaten SELECT'i kapsıyor;
  politikalar OR'lanır, işlevsel zarar yok. Kaldırmak yeni migration ister.
- **`updated_at` tetikleyicisi yok.** API katmanı elle set ediyor. Doğrudan SQL
  UPDATE yapan bir yönetim aracı eklenirse tetikleyici gerekir.
- **Sohbet maliyet takibi DB'de tutulmuyor.** `relocation_cost_ledger` kullanılamaz —
  `job_id`'si `relocation_jobs`'a zorunlu FK, o tablo ingestion hattına ait. Kullanım
  şimdilik fonksiyon logunda (`usage`, `provider` alanları).

---

## 5. AI sağlayıcı

Varsayılan **Gemini Flash** (`AI_PROVIDER` tanımsızsa). Değiştirmek için kod değil
ayar: `AI_PROVIDER=groq` + `GROQ_API_KEY`. Tek dosya:
`supabase/functions/relocation-assistant/providers.ts`.

- [ ] **Faturalandırma doğrula.** Google AI Studio anahtarı, projeye billing
      BAĞLANMADIKÇA ücretsiz katmanda çalışır. Google Cloud Console → Billing'e bak.
      Kapalıysa para çıkmaz; kota dolunca 429 döner, sessizce ücret işlemez.
      `GEMINI_API_KEY` zaten tanımlı (`find-matches` aylardır kullanıyor).
- ⚠️ Groq'a geçilecekse **önce Türkçe çıktı kalitesini ölç.** Vize/denklik gibi
  konularda yanlış bilgi veren zayıf model, asistanın hiç olmamasından kötüdür.

---

## 6. Keşfedilebilirlik — kısmen

- [x] Header üye menüsüne "Taşınma Planlayıcı" eklendi.
- [ ] `/tools` hub'ı ile çapraz bağ. Araçlar canlı ve kullanılıyor (19 oturum,
      8 sonuç, 347 cevap) — trafiği oradan getirmek en kısa yol.
- [ ] `src/lib/admin-shell/admin-updates/2026-06.ts` içinde `/relocation/tools`
      yazıyor; gerçek rota `/tools`. Yalnız geçmiş kayıt metni, davranışı
      etkilemiyor — düşük öncelik.

---

## 7. Bu işin DIŞINDA bulunan, raporlanması gereken şeyler

Relocation çalışması sırasında ölçüldü. **Hiçbirine dokunulmadı.**

### 7.1 CLAUDE.md'deki edge function listesi yanlış

Management API'den çekilen canlı liste (2026-09-20) ile repo karşılaştırması:

| Durum | Fonksiyonlar |
|---|---|
| **Repoda var, canlıda YOK** | `whatsapp-reply`, `whatsapp-webhook` — CLAUDE.md'ye göre 30 Ağustos'ta eklenmiş, **hiç deploy edilmemiş** |
| **Canlıda var, repoda YOK** | `chat-register` (v10), `diaspora-search` (v12), `whatsapp-bot-lookup` (v12), `relocation-chat` (v14) |

⚠️ CLAUDE.md açıkça *"There is no `chat-register` function — that name was stale"*
diyor ama `chat-register` canlıda **ACTIVE**. Liste güncellenmeli.

⚠️ `relocation-chat` v14 (5 Mayıs'tan beri canlı) kaynağı repoda yok ve ne yaptığı
bilinmiyor. Benim yazdığım `relocation-assistant` ayrı isim, çakışma yok — ama bu
eskisinin hâlâ gerekli olup olmadığı araştırılmalı.

### 7.2 Ana sayfadaki ChatBot'ta canlı kusur

`/api/chat` bağlam bulamadığında da `hasContext: true` dönüyor. Bu yüzden
`src/components/chat/ChatBot.tsx:65`'teki yedek metin ("Bu konuda şu anda yeterli
bağlam bulamadım...") **hiç devreye girmiyor**; kullanıcı ham
*"Sağlanan bağlamda bilgi bulunmamaktadır"* cümlesini görüyor. Canlı ölçümle
doğrulandı, `/` ana sayfasında.

### 7.3 RAG korpusu taşınma bilgisi içermiyor

`rag.corteqs.net` sağlıklı ama korpusu yalnız Corteqs platform dokümantasyonu.
*"Almanya'ya taşınmak için hangi belgeler gerekli?"* → *"Sağlanan bağlamda bilgi
bulunmamaktadır."* Ayrıca **tek soruluk** — mesaj geçmişi ve sistem prompt alanı yok.
Asistanın ayrı fonksiyon olmasının sebebi budur.

### 7.4 ESLint yoksayma boşluğu (düzeltildi)

`.claude/worktrees/**` `eslint.config.js` listesinde yoktu; `.worktrees/**` ve
`.kilo/**` zaten elenmişti. Oraya açılan bir ajan worktree'si `npm run lint`'i
**286 hatayla** kırdı, hiçbiri depo kodu değildi. Bu commit'te eklendi.

---

## 8. Doğrulama komutları

```bash
npm run test                                  # 291 dosya / 2171 test yeşil
npm run lint                                  # 0 problem
npx tsc -p tsconfig.app.json --noEmit         # 0 hata — ELLE koş, prelint/pretest koşmaz
npm run verify:text
npm run ingest:tools:check                    # src/lib/** veya functions/** değişince bayatlar
npm run check:migrations                      # canlı schema_migrations ile karşılaştırır
```

⚠️ **Vitest'i Bash kabuğundan koşma.** Küçük harfli sürücü yolu (`/cygdrive/c/...`)
tüm test dosyalarını `TypeError: Cannot read properties of undefined (reading 'config')`
ile **sahte** kırar. PowerShell'den koş.
