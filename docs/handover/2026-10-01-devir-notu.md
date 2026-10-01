# Devir notu — 1 Ekim 2026

> **Bu dosya bir sonraki ajan içindir.** Kısa tutuldu: açık işlerin tamamı ve
> kabul kriterleri **[`docs/kalanlar/KALANLAR.md`](../kalanlar/KALANLAR.md)**'de.
> Burada yalnız *"bu oturumda ne oldu, nereden devam edilecek, nerede tuzak var"*
> yazıyor. Çelişki olursa **KALANLAR doğrudur**.

## 1 · Tek cümlelik durum

13 commit atıldı, **hepsi lokal — `origin/main`'e PUSH EDİLMEDİ.** Açık batch
78 → 72'ye indi. Kullanıcıda **üç iş** bekliyor ve bunlardan biri (G03b deploy)
canlıdaki bir veri sızıntısının kapanmasını bloke ediyor.

## 2 · İLK YAPILACAK — çalışmaya başlamadan

```bash
git log --oneline origin/main..HEAD   # 13 commit görmelisin (bu devir notu dahil)
git status --porcelain -- src/ supabase/ docs/kalanlar CLAUDE.md   # BOŞ olmalı
```

⚠️ **Push kararı kullanıcınındır, kendi başına push etme.**

⚠️ **Depo kökünde sana ait OLMAYAN dosyalar var** (`corteqs-ekstre-motoru/`,
`EKİP WEB SAYFASI ...`, `Antigravity-x64.exe`, bir PDF). Başka oturumlara /
kullanıcıya ait; **dokunma, commit'leme.** `npm run lint`'in verdiği ~32 problemin
**hepsi** `corteqs-ekstre-motoru/`'den gelir — kendi batch'inin lint sonucunu bu
gürültüden ayır (`npm run lint 2>&1 | grep corteqs_fin` ile kaynak dosyaları gör).

## 3 · Kullanıcının çalışma kuralları (bu oturumda konuldu)

1. 🛑 **Her batch'e BAŞLAMADAN onay al.** Kapı 🟢 olması "plan onaylı" demektir,
   "şimdi başla" demek DEĞİLDİR.
2. **Yanıtlar Türkçe.**
3. **Plan onayı (01.10):** ✅ N · G · KR onaylı · ⏳ **M onay bekliyor.**
4. **Canlı erişim (01.10):** ajan migration'ı `psql -f` ile **kendi uygular**,
   `applied/` altına taşır, `schema_migrations` kaydını atar, edge function'ı
   **kendi deploy eder** — her batch sonunda kanıtla rapor verir.
5. Kullanıcı teknik jargondan rahatsız olabiliyor; sonuç özetlerini **sade** yaz.

## 4 · Bu oturumda kapananlar

| Batch | Commit | Not |
|---|---|---|
| KALANLAR yeniden yapılandırma | `c09ace9` `835ca31` `01bec1e` | durum panosu + kapı sözlüğü + karar ağacı |
| **A14** · #REV-034 sıralama grafikleri | `c3ff905` `f944263` | ⏳ **Burak'ın görsel onayı bekliyor** |
| **G01** · Dijital Gruplar paketi + CLAUDE.md | `bacc959` | kök temizlendi |
| **G02** · anon INSERT kapatıldı | `d5a2356` | canlıda, `42501` kanıtlı |
| **G03a** · PII'siz view + davet RPC | `a28ddf1` | canlıda, salt ekleme |
| **G03b** · istemci göçü | `61f367d` | ⏳ **deploy bekliyor** |
| **N01+N02** · menü sıra numaraları | `3718068` | 88 öğe |
| **N03** · üretilen katalog + bayatlama kapanı | `b59bbf3` | `docs/agent/admin-menu.json` |
| N03 düzeltmesi | `9fb1eda` | unutulan araç kataloğu (↓ §7.6) |

## 5 · 🔴 KULLANICIDA BEKLEYEN — biri canlı sızıntıyı bloke ediyor

### (a) G03b'yi Coolify'dan deploy et → sonra G03c

**Canlıda açık:** `whatsapp_landings` taban tablosu anon'a açık; **10/10 satırda
davet linki + grup yöneticilerinin adı/e-postası/telefonu** okunabiliyor
(`admin_contact`). G03a hedefi kurdu, G03b istemciyi taşıdı, **kapatan G03c.**

G03c **deploy edilmeden uygulanamaz** — canlıdaki eski frontend hâlâ tabandan
okur, dizin ziyaretçiye **boş** görünür.

**Sıra:**
1. Kullanıcı deploy eder.
2. Ziyaretçi olarak (gizli sekme) `/addcom`: liste geliyor mu · detay açılıyor mu ·
   **"Katıl" yerine "Giriş yap ve katıl"** çıkıyor mu?
3. Üçü tamamsa G03c'yi uygula. **SQL, geri alma SQL'i ve kabul testi #5'in dört
   yolu KALANLAR → G03c maddesinde hazır.**

ℹ️ Kabul testi #5'in 4 yolundan 3'ü 01.10'da **zaten temiz** ölçüldü
(`view`, `catalog_items`, `catalog_search_documents`). Katalog için ayrı iş YOK —
`catalog_search_documents` politikası `is_moderator()`, anon 0 satır görüyor.
"Katalog da sızdırıyor" sonucuna varma, ölçüldü.

### (b) A14 önizlemesini Burak'a paylaş

<https://claude.ai/artifact/5KN3KXDDt7vvnR9PwD1R8L> — sayfa **özel**, Share
menüsünden paylaşılmalı. Onay gelince panelden REV-034 "Yapıldı" işaretlenir.

### (c) Push kararı — 13 commit lokalde

## 6 · Sıradaki iş

**N04** (bot korpusuna `admin-menu` kaynağı). Migration YOK — ölçüldü:
`ai_knowledge_documents.source_key` üzerinde CHECK yok, `audience` CHECK'i
`admin`'i kabul ediyor.

- `scripts/ai-knowledge/sources.mjs` → `loadAdminMenuDocuments()` + tek satır kayıt
- **Öğe başına BİR belge** (tek blob DEĞİL) — semantik arama tek kayda kilitlensin
- Kabul: `npm run ai:ingest -- --source=admin-menu --dry-run` ~88 belge raporlar
  (dry-run güvenli, yazma yok)
- Sonra N05 (prompt, **deploy ister**) → N07 (canlı ingest, **canlı yazar**) ·
  **N06 bağımsız** ve bugün canlıda olan bir kusuru kapatıyor: bot yanıtındaki
  linkler ham markdown görünüyor, tıklanamıyor

Sıra ve ayrıntı: KALANLAR → N bölümü. Alternatif: G04+ (⛔ U06) veya KR01.

## 7 · ⚠️ Bu oturumda ÖDENEN bedeller — tekrarlama

### 7.1 Regex kaçış dizisi ham karaktere dönüştü (iki kez)

Test dosyasına yazdığım kelime-sınırı kaçış dizisi **ham BACKSPACE (U+0008)**
olarak yazıldı; regex hiçbir şeyle eşleşemez hâle geldi ve kusuru bir süre
**bileşende** aradım — oysa bileşen doğruydu. 7 ham karakter temizlenince düzeldi.
**Dersi KALANLAR'a yazarken aynı hatayı tekrar yaptım** (5 ham karakter daha).

- `npm run verify:text` bunu **YAKALAMAZ** — yalnız kodlama/mojibake denetler.
- **Kural:** regex yazan bir düzenlemeden sonra dosyayı `ascii(line)` ile doğrula.
  Gözle bakınca kaçış dizisi ile ham karakter **ayırt edilemez**.

### 7.2 `vitest run -u <yol>` yolu YUTAR

| Biçim | Koşan |
|---|---|
| `vitest run -u <yol>` | 380 dosya / 2947 test ❌ |
| `vitest run --update <yol>` | 380 dosya / 2947 test ❌ |
| `vitest run <yol> -u` | 1 dosya / 4 test ✅ |

Bayrak yolun önünde olursa **tüm takım snapshot-güncelleme modunda** koşar ve
başka yerdeki bayat bir snapshot sessizce yeniden yazılır. **Bayrak daima arkaya.**

### 7.3 `check:dead`, bağlanmamış yeni modülü erişilemez sayar ve CI'ı kırar

Planın N01/N02 ayrımı bu yüzden ayakta kalmadı; **tek commit** oldular.
`src/lib/**` altına "henüz bağlanmamış" modül ekleyen her batch aynı duvara çarpar:
**üreten ve bağlayan adımlar aynı commit'te olmalı.**

### 7.4 Bitişik `<span>`'ler erişilebilir adı boşluksuz birleştirir

Numara etikete yapışıp `"2Kayıt Veritabanı"` oluyordu — ekran okuyucu tek kelime
gibi okur. Ayrı bir `sr-only` ayırıcı düğüm gerekti. Rozetin **içine** koyma:
rozet metni `"2."` olur ve DOM sözleşmesi testi çıpasını kaybeder.

### 7.5 PowerShell komut satırı Türkçe karakteri bozuyor

Türkçe literalle yapılan dosya eşleşmesi sessizce başarısız oldu. **Türkçe metinle
dosya düzenlerken `python` (bash heredoc içinde) kullan**, PowerShell string
literali değil. CLAUDE.md'deki psql uyarısının aynısı, editleme için de geçerli.

### 7.6 Pathspec'li commit üretilen dosyaları dışarıda bırakır

N03'te `ingest:tools` çalıştırıldı ama üretilen iki dosya commit'e dahil
edilmedi. Çalışma ağacında katalog güncel göründüğü için `ingest:tools:check`
**yeşil** veriyordu, ama **commit'li katalog bayattı** → CI'da aynı kontrol
kırılırdı (`9fb1eda` ile düzeltildi).
**Kural:** `src/lib/**` altına dosya ekleyen her commit'e `docs/agent/tools.json`
+ `src/lib/agent/tools-catalog.generated.ts` **açıkça** eklenmeli.

### 7.7 Vakum test, mutasyon turunda yakalandı

Yazdığım bir test "sayfada herhangi bir düğme var mı" diye bakıyordu; "Sayfayı
Paylaş" her durumda olduğu için **hep geçiyordu**. **Her yeni sözleşme testini
mutasyonla sına** — bu oturumda 6 mutasyon turu yapıldı, hepsi bir şey yakaladı.

## 8 · Ölçüm tabanı (1 Ekim 2026, bu oturumun sonunda)

```text
tsc 0 · lint 0 (⚠️ corteqs-ekstre-motoru/ hariç) · 380 dosya / 2947 test yeşil
check:dead 0 yeni / 0 borç / 963 erişilebilir · check:drift temiz
ingest:tools güncel (55 tool) · verify:text ✓ (1850 dosya)
check:migrations 444 dosya / 444 canlı kayıt · sapma yok
Bu oturumda uygulanan migration'lar (ikisi de canlıda + applied/ + ledger):
  20261001100000_whatsapp_landings_rls_cleanup
  20261001110000_whatsapp_landings_public_view_and_invite_rpc
whatsapp_landings RLS: 11 → 8 politika
Yeni artefakt: docs/agent/admin-menu.json (88 öğe)
```

⚠️ **Rakamları ezberleme, batch'e başlarken yeniden ölç.**

## 9 · Yerel ortam notları

- **Vitest'i büyük harfli `C:` ile çalıştır** (küçük harfli cwd'de testler sahte kırılır).
- `git commit` **pathspec'siz yapılmaz** — index başka oturumlarla paylaşılıyor.
- Canlı DB: `psql` + pooler `aws-1-eu-west-2.pooler.supabase.com:6543`,
  kullanıcı `postgres.injprdrsklkxgnaiixzh`, şifre `.env.local` →
  `SUPABASE_DB_PASSWORD`. Bash aracında **`dangerouslyDisableSandbox: true`** gerekir.
- `types.ts` regen: Management API, **`?included_schemas=public,graphql_public`** —
  yalnız `public` istenirse `graphql_public` şeması **silinir** (01.10'da yakalandı).
