# Devir notu — 2 Ekim 2026 (gece oturumu)

> **Bu dosya bir sonraki ajan içindir.** Önceki iki devir notu hâlâ geçerli —
> özellikle [`2026-10-01-devir-notu.md`](2026-10-01-devir-notu.md) §7 (tuzaklar) ve §9
> (yerel ortam), [`2026-10-01-devir-notu-2.md`](2026-10-01-devir-notu-2.md) §7 (bedeller).
> Açık işlerin tamamı ve kabul kriterleri **[`docs/kalanlar/KALANLAR.md`](../kalanlar/KALANLAR.md)**'de.
> Çelişki olursa **KALANLAR doğrudur**.

## 1 · Tek cümlelik durum

**Kariyer serisi KR01–KR09 kapandı** (yalnız KR10 kaldı) + **G08** ve **G09** kapandı.
Kullanıcı bu oturumda "sormadan, kalanlardan çalış" dedi; 11 batch tek akışta yürütüldü.
**Commit'ler lokalde — `origin/main`'e PUSH EDİLMEDİ.** Açık batch 68 → **57**.

## 2 · İLK YAPILACAK

```bash
git log --oneline origin/main..HEAD   # bu notla birlikte 36 commit
git status --porcelain -- src/ supabase/ scripts/ docs/kalanlar CLAUDE.md   # BOŞ olmalı
```

⚠️ **Çalışma ağacında sana ait OLMAYAN değişiklikler var — DOKUNMA, commit'leme:**
`docs/README.md`, `docs/archive/2026-09-30-kapanan-is-dokumanlari/README.md`,
`docs/operations/2026-09-30-kalici-operasyon-dersleri.md`,
`docs/plans/2026-09-28-onay-sonrasi-uygulama-plani.md` + kökteki untracked dosyalar
(`corteqs-ekstre-motoru/`, EKİP zip/klasör, `Antigravity-x64*.exe`, fatura PDF'i).
`git commit` **pathspec'siz yapılmaz** — index başka oturumlarla paylaşılıyor.

⚠️ **Push kararı kullanıcınındır.**

## 3 · Bu oturumda kapananlar

| Batch | Commit | Öz |
|---|---|---|
| **G08** | `5a4a0165` | Davet sayfası spike raporu — 59 istek ölçüldü, 3 platform |
| **G09** | `4c1a5887` | `group_settings` ayar tablosu canlıda, 15 satır, 3 okuma yardımcısı |
| **KR01** | `32d7c17f` | `src/lib/careers/` — 17 ilan + staj, makineyle çıkarıldı |
| **KR02** | `818442de` | `career_applications` + private kova + RPC (canlı smoke 10 çağrı) |
| **KR03** | `cec682d1` | `careers-api` + şemalar + çift yönlü hata haritası |
| **KR04** | `32cb386f` | Sayfa iskeleti: hero · saat bandı · kurucu mektupları · modeller |
| **KR05** | `28e17708` | 17 ilan listesi + alan filtresi + staj bloğu + derin bağlantı |
| **KR06** | `670a8461` | Başvuru formu (3 dosya) — uçtan uca canlı kanıt |
| **KR07** | `41ec13d2` | Önceki dönem 4 ilan korundu, yeni akışa bağlandı |
| **KR08** | `e6b5f56e` | `/admin/kadro/basvurular` + imzalı dosya bağlantısı |
| **KR09** | *(bu oturum)* | Yeni başvuruda e-posta — canlı `sent`, 2 alıcı · **mail TÜM yöneticilere** (↓ §5.7) |

Her batch'in kanıtı KALANLAR → **Kapananlar** tablosunda tek satır hâlinde.

## 4 · 🔴 KULLANICIDA BEKLEYEN

Önceki notun dört maddesi **hâlâ duruyor** (hiçbiri bu oturumda kapanmadı):

1. **G03b'yi Coolify'dan deploy et.** Bu oturumda canlı paket yeniden ölçüldü:
   hâlâ eski kod (`whatsapp_landings` taban tablosunu `select("*")` ile okuyor).
   **Davet linki sızıntısı AÇIK** — iki grubun `chat.whatsapp.com` linki anonime
   döndü. Deploy olmadan **G03c uygulanamaz** (taban tablonun anon erişimi
   kapatılırsa canlı site kırılır). Aynı deploy N06 link düzeltmesini de çıkarır.
2. **N07 UI kabulü** (deploy sonrası, ~2 dk).
3. **A14 önizlemesini Burak'a paylaş:** <https://claude.ai/artifact/5KN3KXDDt7vvnR9PwD1R8L>
4. **Push kararı** — 36 commit lokalde.

➕ Bu oturumdan **yeni** iki kullanıcı maddesi:

5. **Kariyer sayfası canlıya çıkmadı.** KR01–KR09 kodu hazır ama `/kariyer` hâlâ
   eski sürümü gösteriyor; frontend deploy'u gerekiyor (G03b ile aynı kuyruk).
   Deploy sonrası görsel kabul: 17 ilan + filtre + staj + form açılıyor mu,
   tarayıcı konsolunda CSP ihlali var mı.
6. **Radar özet maili artık gidebilir** (↓ §5.2) — ilk taramadan sonra mail
   kutusunu kontrol et; 19 Eylül'den beri hiç gelmiyordu.

## 5 · ⚠️ Bu oturumda ÖDENEN bedeller ve bulunan kusurlar

### 5.1 Mutasyon turu ÜÇ kez testimin çürük olduğunu gösterdi

Üçü de "test yeşil ama hiçbir şey kanıtlamıyor" sınıfı:

1. **KR05 — derin bağlantı yalnız mount'ta okunuyordu.** `setFilter(ALL)` satırı
   silindiğinde hiçbir test düşmedi, çünkü mount anında filtre zaten `ALL`'du:
   satır **fiilen ölü koddu**. Gerçek senaryo SPA'da sayfadayken `#ilan-…`
   bağlantısına tıklamak — o durumda bileşen yeniden mount OLMAZ ve bağlantı
   sessizce ölürdü. `hashchange` dinleyicisi eklendi.
2. **KR06 — seçilen pozisyon testi mount anını ölçüyordu.** `defaultValues` zaten
   seçimi taşıdığı için senkron eden `useEffect` silinse de yeşil kalıyordu.
   `rerender` ile gerçek senaryoya çevrildi.
3. **KR07 — iddialar yalnız `"LEGACY_..."` metnini arıyordu.** Kullanım tamamen
   boşaltılsa bile **import satırı o adı taşıdığı için** test geçiyordu. Biri
   davranış testine, diğeri gerçek JSX çıpasına (`{LEGACY_POSITION_NOTE}`) çevrildi.

📌 **Ders:** kaynak metnine bakan bir iddia, aradığı adı **import/yorum satırında**
bulup sahte yeşil verir. Çıpa ya davranış olmalı ya da gerçek kullanım biçimi
(`{AD}`, `AD.map(`), çıplak ad değil.

### 5.2 🔴 Radar özet maili 19 Eylül'den beri hiç gitmemiş (onarıldı)

`notification_email_outbox.event_type` CHECK listesi `radar_scan_digest` değerini
**içermiyordu**, ama `supabase/functions/radar-news-scan/index.ts:440` tam o tiple
kuyruğa yazıyor. Her insert `23514` ile reddedilmiş; kuyrukta **0 radar satırı**
ölçüldü. KR09 aynı kısıtı zaten değiştirmek zorundaydı, iki değer birlikte eklendi
(`20261002000000`).

⚠️ **Sınıf:** `client_error_reports.source` ile aynı — "yeni olay tipini TS'te
tanımlamak yetmez, CHECK listesine de eklenmeli". CLAUDE.md'de yazılı, yine yaşandı.

### 5.3 Yorum satırı, yasakladığı deseni test eder

İki kez oldu (KR02 migration testi, KR06 form testi): migration/bileşen başlığı
"`has_role` KULLANMA" / "`instanceof Error` ile daraltma" diye **açıklıyor**, ham
metne bakan test bunu ihlal sanıp düşüyor. Çözüm: iddiadan önce yorumları ayıkla
(`stripComments` / `code()` yardımcıları ilgili test dosyalarında).

### 5.4 `check:dead` baseline'ı mekanizma olarak kullanıldı — ve kendini temizledi

Kariyer modülü tüketicisinden önce geldi (veri KR01, API KR03, sayfa KR04–KR06).
Dört dosya geçici olarak `KNOWN_DEAD_FILES`'a yazıldı; KR05 ve KR06 onları
kullanınca denetleyici **"bayat baseline kaydı"** diye uyardı ve satırlar silindi.
Liste bugün **yeniden boş**. Eklerken **silecek batch'i adıyla yaz**.

### 5.5 Admin menüsüne madde eklemek üç adım daha getirir

KR08'de yeni menü maddesi N03'ün bayatlama kapanını (`admin-menu-catalog.test.ts`)
düşürdü — doğru davranış. Sıra: `npm run ingest:admin-menu` →
`node scripts/ai-knowledge/ingest.mjs --source=admin-menu` → `node scripts/ai-knowledge/embed.mjs`.
(88 → **89** öğe; korpus 89/89 gömülü.) ⚠️ İkinci ve üçüncüsü **doğrudan node ile**
koşulur — npm `--` sonrasını yutar.

### 5.6 Rancher Desktop + ağ

Deploy Docker ister; motor yine ölüydü, exe yeniden başlatınca ~1 dk'da geldi
(Docker 29.5.3) ve deploy geçti. ⚠️ **Rancher başladıktan sonra node'un ağ yığını
bozuldu**: `fetch` `UND_ERR_CONNECT_TIMEOUT`, sonra DNS "No such host" verdi;
PowerShell ve psql aynı anda çalışıyordu. Ağ tamamen düşünce kullanıcı modemi
resetledi. **Ders:** node'dan ağ hatası alıyorsan önce PowerShell/psql ile dene —
sorun ağda değil, node'un çözücüsünde olabilir.

### 5.7 Bildirim alıcıları opt-in'di — kariyer için opt-out yapıldı

Kullanıcı oturum sırasında "kariyer başvurusu maili sadece bana değil tüm adminlere
gidecek" dedi. Ölçüm: `admin_get_notification_subscribers` alıcıları
**`admin_notification_subscriptions` tablosundan** çekiyor, yani **satırı olmayan
yönetici hiç dönmüyor**. Bugün sistemde **2 yönetici** var ve ikisinin de satırı var —
yani mail zaten ikisine gidiyordu; kusur **gelecekte** patlayacaktı: yeni atanan bir
yönetici, satır açılana kadar hiçbir başvurudan haberdar olmaz ve bunu fark ettiren
bir hata da yoktur.

Migration `20261002010000` yalnız `career_application` dalını **opt-out**'a çevirdi:
`is_admin(u.id)` olan herkes alıcıdır, satırı olmasa da alır, yalnız açıkça
`career_application_email = false` diyen çıkar. **Diğer olay tipleri değişmedi.**

Kanıt geri alınan bir işlem içinde alındı (canlı veri etkilenmedi): satırı silinen
yönetici kariyer alıcılarında **kaldı**, aynı kişi `new_member`'da listeden **düştü**,
açık `false` ile **çıktı**.

## 6 · Ölçüm tabanı (2 Ekim 2026, bu oturumun sonunda)

```text
tsc 0 · lint 0 (⚠️ corteqs-ekstre-motoru/ gürültüsü hariç — başkasının klasörü, 6 dosya)
check:dead 0 yeni / 0 bilinen borç / 981 erişilebilir kaynak
verify:text ✓ · check:functions 12/12 sapmasız · migration ledger sapmasız
Bu oturumda 4 YENİ migration: 20261001120000 (group_settings) ·
  20261001130000 (career_applications) · 20261002000000 (career bildirimi + CHECK onarımı) ·
  20261002010000 (kariyer maili tüm yöneticilere)
Bu oturumda 1 edge deploy: send-notification-emails (94 kB)
Mutasyon turları: G09 3/3 · KR01 5/5 · KR02 5/5 · KR03 6/6 · KR04 6/6 ·
  KR05 6/6 · KR06 7/7 · KR07 5/5 · KR08 7/7 · KR09 6/6 (şablon) + 8/8 (bildirim hattı)
```

⚠️ **Rakamları ezberleme, batch'e başlarken yeniden ölç.**

## 7 · Sıradaki iş

- **KR10** (SEO · sitemap · araç kataloğu · kök temizliği) — kariyer serisinin son
  batch'i, 🟢. İçinde bir kullanıcı adımı var: kökteki `EKİP WEB SAYFASI …`
  klasörü/zip'i kaldırılacak (başkasının dosyası olabilir, **sorarak** yap).
- **G03c** ⛔ hâlâ kullanıcı deploy'una bağlı; deploy biterse AJAN UYGULAR (SQL hazır).
- **G06–G07** · **G10–G25** 🟢 · **G04–G05** ⛔ U06 · **W01–W08** ⛔ U09 ·
  **M01–M27** ⏳ plan onayı bekliyor.
