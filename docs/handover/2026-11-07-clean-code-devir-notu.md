---
durum: aktif
son_dogrulama: 2026-11-07
---

# Devir notu — Clean code + doküman düzenleme (7 Kasım 2026)

> Bağlam taşmadan önce yazıldı. Yeni oturum buradan devralır. Plan dosyası:
> `C:/Users/baris-terzioglu/.claude/plans/genel-bir-clean-code-cheerful-hamming.md` (makinede).
> Açık işlerin TEK listesi: `docs/kalanlar/KALANLAR.md` → **§1.9** (bugün eklendi).

## 1. Durum (ölçüldü, 07.11 akşamı)

| | |
|---|---|
| `main` | `b64701f4` → bugün ~40 commit; GitHub'da |
| GitHub CI | ✅ **yeşil** (12/12 adım) — `ca14639a` ve `48d6bdc9`. **4 Ekim'den beri ilk yeşil.** |
| Test | 510 dosya / 4.319 test yeşil (yerel, tam takım) |
| Kapılar | `verify:quality` · `lint` · `format:check` · `check:dead` · `check:knip` · `check:docs:strict` · `check:drift` · `ingest:tools:check` · `build` · `check:bundle` — hepsi yeşil |
| Geri dönüş tag'leri (annotated, push'lu) | `clean-code-dokuman-duzenleme-oncesi-2026-11-07` (b64701f4) · `clean-code-faz1-oncesi-…` · `clean-code-faz2-oncesi-…` · `clean-code-faz3-devam-oncesi-…` |
| Git dışı yedek | `C:/tmp/corteqs-cleanup-yedek-2026-11-07/` (32 dosya, sha256 MANIFEST) — ⚠️ `.env*` içerir, kullanıcı silecek |

## 2. Bugün yapılanlar (faz faz)

**Faz 0 — güvenlik + kırmızı kapılar**
- 🔴 Site asistanı korpusu: `docs/guides/**` tamamı üyeye açıktı (19 doküman, "ÜYELERE GÖSTERİLMEZ" yazan 2 taslak dahil). Üye kitlesi artık açık izin listesi `MEMBER_DOCUMENTATION_PATHS` (`scripts/ai-knowledge/sources.mjs`); archive/history/reference/commandcenter + `durum: yerini-aldı` korpus dışı. **Canlıya uygulandı** (ingest+embed). Liste boşalırsa kaynak budanır (`allowEmpty`, fail-open kapandı).
- `.claude/settings.local.json` (düz metin DB parolası) repo `.gitignore`'unda.
- Üst dizindeki 6 migration kopyası kaldırıldı; `role_structure` applied/ dosyaları canlıyla hizalandı.
- `corteqs-ekstre-motoru/` → `docs/archive/2026-10-07-ekstre-motoru-paketi/` (lint 42 → 0).
- Tarihe bağlı `plans.test.ts` saate sabitlendi; `group-settings` izin listesi tamamlandı.

**Faz 1 — araçlar**
- Prettier 3.9.10 (genişlik 120, ölçülerek), tüm repo tek commit `113dd58a` → `.git-blame-ignore-revs`.
- knip 6.42.1 (bağımlılık kapısı CI'da); kullanılmayan 16 paket kaldırıldı.
- ESLint: `.mjs` lint · `complexity` 15 · `max-depth` 4 · `max-lines` 800; mevcut ihlaller `eslint-suppressions.json` tabanında.
- **CI 04.10'dan beri ilk adımda düşüyordu** (vite.config'in iki `.mjs` eklentisine `.d.mts` yoktu) → düzeltildi; `admin-updates` paketi 500 KB'ı aşıyordu → dar istisna (KALANLAR K16).
- `server.test.mjs` kopya fonksiyonu test ediyor ve hiç koşmuyordu → gerçek fonksiyona bağlandı.
- Bağımsız inceleme gerilemesi: Prettier zinciri bölünce araç kataloğu zod şemasını okuyamıyordu (`directory_search`) → extractor düzeltildi.

**Faz 2 — dokümanlar**
- `npm run check:docs` (+ `--strict` prelint/CI): index · kırık atıf · kopya · yerini-aldı hedefi. 88 hata → 0. Deterministik (diske bakmaz — Windows/Linux farkı CI'ı bir kez kırdı).
- 36 kopya silindi, 25 dosyada kırık atıf onarıldı.
- KALANLAR §1.9: 5 Ekim sonrası **27 açık iş** geri alındı + 8 bayat bilgi düzeltildi.
- 85 plana durum frontmatter'ı (yerini-aldı 20 · tamamlandı 46 · aktif 19).
- CLAUDE.md 1.293 → ~1.064 satır; bayat bloklar `docs/history/2026-11-07-claude-md-arsivi.md`'de (kelimesi kelimesine). ARCHITECTURE/AGENT_CONTEXT bayat rakamları ölçüm komutlarına çevrildi.

**Faz 3 — kod (kısmen)**
- W0: taşınınca sessizce kapsam kaybeden 4 denetim kapatıldı (araç kataloğunda eksik 24 API modülü dahil; `config-paths-exist.test.mjs`).
- W1: 3 yetim betik silindi; SG1 yedek sözleşmesi (`no-backups-tracked.test.mjs`) CI'da.
- W2: **"istanbul" araması "İstanbul"u bulmuyordu** (`country-city-search.ts`, TDD) · baş harfler `trUpper` · iki admin araması `trIncludes`.
- DM01 `/ilanlar` demo bandı (6/6 ilan örnek) · CS01 Cadde araması ölü dalı kaldırıldı.

## 3. ⚠️ Bu oturumun tuzakları (tekrar yaşanmasın)

1. **Kaçış dizisi araç katmanında çözülür**, Prettier'da değil (deneyle gösterildi). `\uXXXX` / ham özel karakter gerekiyorsa `String.fromCharCode` ile üret, bayt araması ile doğrula. `verify:text` U+00C4/U+00C5'i mojibake sayar.
2. **Kapı komutunu `| tail` ile borulama** — çıkış kodu kaybolur, kırmızı yeşil görünür (`979f58db` dersi). Çıktıyı dosyaya yaz, `$?`'yi ayrıca oku.
3. **Mutasyon sonrası `git checkout -- dosya` YAPMA** — commit'lenmemiş gerçek değişikliği de siler. Önce scratchpad'e `cp`, sonra `cp` + `cmp`.
4. **Windows ≠ Linux CI:** büyük/küçük harf duyarsız dosya sistemi + gitignore'lu yerel dizinler. Denetim yazarken diske değil `git ls-files`'a bak.
5. **Bash aracı her komutta `claude-*-cwd: No such file` satırı basar** ve çıkış kodunu 1 gösterir — gerçek sonuç komutun kendi çıktısıdır.
6. "importer yok" ≠ "terk edilmiş": RoleSelector açık A3.4 işinin yarım koduydu (silme kararı geri alındı).

## 4. Kalan ajan işleri (öncelik sırasıyla)

- **KALANLAR §1.9 CC3** — Faz 3 W3 tekilleştirme (`formatDate` 14 · `slugify` 7 ⚠️ altın test şart · `currentUserId` 6 · `round4`/`scale5`) · W4 ilk 10 büyük bileşen (önce karakterizasyon testi) · W5 React Query (56 dosya) · W6 `providers.ts` yönü (deploy ister) · W7 adlandırma · W8 ratchet (knip export uyarıları 276).
- §1.9 ajan maddeleri: EV01 (etkinlik saat dilimleri, bitiş<başlangıç uyarısı) · ST00 (mock "ödeme başarılı" metni) · C6b (`types.ts` yeniden üretimi + `as never`) · `chatConfig.detectCommand` Türkçe/İngilizce komut katlaması (ayrı test ister).

## 5. Kullanıcının yapacakları / kararları

Tam liste ve gerekçeler: KALANLAR §1.9 (GB1, U12, U14, K15, K17, W02b, G10c, K18, PS01, SF01, CO01/CO01a, RH01).
Özet: 🔴 GB1 (anahtar rotasyonu — ayrıntı yalnız plan dosyasında) ·
frontend deploy (arama düzeltmeleri) · yedek dizinini silmek · karar maddeleri.

## 6. Akşam turu (07.11 akşam) — DEVAM NOKTASI

İki branch, ikisi de **yerel** (push/merge YOK; kullanıcı "branch'e commit" dedi):

1. `clean-code/w3-tekillestirme` (main'in 4 commit önünde, TAMAM): `0ec63b2c` relocation ortak
   yardımcıları + 🐛 jobprob linkedin `v/5`→`(v-1)/4` (SQL aynası) + ölçek kilit testleri ·
   `cb212830` `getCurrentUserId` / `AdminLoadingState` / `trSlugify` (🐛 "İstanbul"→`i-stanbul`,
   "Kış"→`k-s`) · `6e247e1b` KALANLAR CC3 · `f01f6580` yönetici güncellemesi (mail GİTTİ).
2. `fix/st00-ev01` (1'in ÜSTÜNDE, COMMIT'SİZ — yarım):
   - ✅ ST00: `ServiceRequestForm` sahte kart ekranı kaldırıldı, talep doğrudan gönderilir,
     "şu an ücret alınmıyor" notu; `MockStripeCheckout.tsx` silindi (tek kullanıcısıydı).
   - ✅ `chatConfig.detectCommand`: `trFold` ile katlanmış komut kelimeleri ("İPTAL", "gec").
   - ✅ W3 tarih (ajan): `src/lib/format-date.ts` (`formatLongDateTimeTR`, `formatShortDateTimeTR`)
     ← 4 admin yorum/ayar + 2 radar çağrı yeri; altın karşılaştırma 3 TZ × 2.876 girdi = 0 fark.
   - ⏳ EV01 (ajan): 13 eksik saat dilimi + bitiş<başlangıç uyarısı.
   - ⏳ Sahte hastane randevusu (ajan): `HospitalAppointment` kart alanları kalkar, dürüst metin,
     `findDemoRoute`'a `:param` desteği + `/hospital-appointment/:id` DEMO_ROUTES satırı.

**Gece sonu durumu (inceleme tamam, düzeltme sürüyor):**
- Yönetici güncellemesi `20261107-sahte-odeme-ve-etkinlik-uyarilari` commit'lendi (`0ea39b38`) ve
  MAİLLENDİ (sent 1). ⚠️ İçindeki iki iddia düzeltme ister: (a) ST00 başarı bildirimi hâlâ
  "Ödeme alındı" diyordu (düzeltme workflow'unda); (b) "kayıt asistanı komutları artık tanınıyor"
  — `detectCommand`'ın canlı ekrandan ULAŞILAMAZ olduğu iddia edildi (useChatMachine hiçbir
  bileşende yok). ✅ İKİSİ DE DOĞRULANDI ve `5afa69ee` (`20261107-duzeltme-ve-ara-durum`) ile
  düzeltilip MAİLLENDİ — tekrar gönderme. Kalan tek mail: iş bitince "son durum".
- Çok açılı inceleme (25 ajan): 34 bulgu → 2 doğrulandı (yukarıdaki ST00 bildirimi + detectCommand
  boşluk testi), 5 çürütüldü, 25 düşük. Mutasyon 12/12 yakalandı.
- Düzeltme workflow'u (4 ayrık parti + her birine çürütücü): ST00 bildirimi/yorum/hitap/docs-stripe ·
  detectCommand erişilebilirlik ölçümü + yorum kaçış dizileri + testler · EV01 canlı bölge a11y +
  ServiceRequestsList tarih · hastane galeri metni + test + BusinessDetailPage yorumu + CLAUDE.md
  DEMO listesi.

**§7 — SON DURUM (07.11 gece geç, YENİ OTURUM BURADAN BAŞLAR):**
- ✅ `main` = `7c81140c` (W3 + gece turu, 13 commit), GitHub'da, **CI YEŞİL**. Branch'ler silindi.
  3 yönetici maili gitti (son: `7c81140c` "gece turu son durum").
- ✅ GECE SONU: `main` = `cc61db31` (CH01 ölü sohbet silindi · W3 para `format-money.ts` · W3 kalan
  tarih kümeleri Cadde dahil — önce karakterizasyon testi), 10/10 kapı (516 dosya / 4.465 test),
  push'lu; açık branch YOK, çalışma ağacı temiz. 4. yönetici maili gitti (`cc61db31`).
- Yeni oturum serbest: başka bir plana doğrudan başlanabilir. Kalan ajan işleri KALANLAR CC3
  (W3 küçükleri, W4–W8) · C6b · EV01 kalanı. Kullanıcıda: deploy, GB1, kararlar (HA01, DM02, …).

**Kalan adımlar (sırayla):** ajanlar bitince → bağımsız çok-açılı çürütme incelemesi (ultracode
açık; Workflow) → `npm run ingest:tools` (yeni `format-date.ts` + yeni export'lar) → tam kapı turu
(10 kapı) → konu başına ayrı commit (ST00 · detectCommand · W3 tarih · EV01 · hastane demo ·
KALANLAR) → yönetici güncellemesine AYRI paket → mail (force).

**Bu turun pratik tuzakları:**
- `npm run build` `public/sitemap.xml`'i canlı `lastmod` ile yeniden üretir → işe ait değil,
  `git restore public/sitemap.xml`.
- PowerShell'de `npx prettier --write $dizi` diziyi TEK argüman yapar → `& npx prettier --write @dizi`.
- Yönetici güncellemesini hemen göndermek: commit kancası kuyruğa yazar; sonra
  `send-notification-emails`'e `{"force":true}` + `x-dispatch-secret` (`.env.local`
  `NOTIFY_DISPATCH_SECRET`; `verify_jwt=false`). Betik: scratchpad `force-send-admin-updates.mjs`
  (gizli değeri yazdırmaz). Yanıt alıcı sayısı DÖNMEZ.
- Paralel ajanlar aynı çalışma ağacını paylaşır: her biri yalnız kendi dosyalarına dokunur;
  `ingest:tools`, build, commit yalnız orkestratörde.
- İnceleme ajanı rapordan sonra arka planda iş bırakabilir → kapı turundan önce durdur,
  `git diff --stat`'ı rapordakiyle karşılaştır.
