# DEVİR — Komuta Merkezi: WA Summary 7→9 Aktarımı + Tamamlandı Taraması (2026-08-02)

> Oturum limiti dolmak üzereyken yazıldı. **Bu doküman tek başına işi bitirmeye yeter** —
> sıradaki oturum buradan devam etsin. Onaylı plan: `C:\Users\baris-terzioglu\.claude\plans\i-nci-ince-ayr-t-land-r-lacak-bir-agile-starfish.md`

## 0. Görev tanımı (kullanıcı talebi + onaylı kararlar)

1. `walast.txt` (repo kökünde, WhatsApp dökümü) içinde **#summary7 (satır 14470, 9 Haziran) → Summary#9 (satır 25009, 2 Ağustos)** aralığındaki todo/karar/bilgileri komuta merkezine (`/admin/workspace/command-center`, tablo `command_center_items`) ekle.
2. Sonra panodaki **TÜM açık kayıtları** (~729) projenin son haliyle karşılaştırıp bitenleri `Tamamlandi`ya çek.

**Kullanıcı kararları (AskUserQuestion ile onaylandı):**
- Tarama kapsamı: **tüm açık kayıtlar** (T1–T16, tüm WA partileri, Notion, todolar).
- Kanıt eşiği: **kod/DB kanıtı VEYA sohbette açık "bitti/canlıda" teyidi**. Kanıtsızlar açık kalır → raporda "elle karar bekleyen" listesi.

## 1. Ne yapıldı (TAMAM)

**Scratchpad dizini (tüm ara ürünler burada, mutlak yol):**
`C:\Users\BARIS-~1\AppData\Local\Temp\claude\c--temp-private-corteqs-corteqs-fin\29c52579-46b0-4af9-abe5-961ad63bfde5\scratchpad\`

| Dosya | İçerik |
|---|---|
| `wa-slice.txt` | Summary 7→9 aralığı, medya/boş satırlar temiz, 9.144 satır |
| `wa-extract-01..21.md` | 21 parça ekstraksiyon (LINE/DATE/TYPE/KIM/BASLIK/DETAY blokları) — 21/21 TAMAM |
| `wa-merged.psv` | Birleşik 923 kayıt: `TYPE\|DATE\|KIM\|BASLIK\|DETAY\|SRC` (415 todo, 161 karar, 208 bilgi, 139 kanit) |
| `wa-seed-raw.psv` | todo+karar+bilgi (784 satır) — küratasyon girdisi |
| `wa-kanit.psv` | 139 "bitti" kanıtı — Faz C kanıt kaynağı |
| `cc-active-items.txt` | Panodaki 729 aktif kayıt (src~kategori~başlık~atanan~durum) |
| `cc-open-full.txt` | Açık kayıtların tam dökümü: `id~src~category_label~title~detail(220)~assignee~status` |
| `project-evidence.md` | **E1–E45 kanıt özeti** (git log + hafıza + SONDURUM + sohbet) — kapatma kararlarının dayanağı |
| `git-since-june9.txt` | 9 Haziran→bugün 500 commit dökümü |
| `parse-extracts.ps1` | Ekstraksiyon → PSV ayrıştırıcı (yeniden koşturulabilir) |
| `gen-seed-sql.ps1` | **Seed SQL üretici** (aşağıda kullanımı) |
| `seed-title-clash-check.sql` | gen script'in ürettiği başlık çakışma kontrolü (üretilince oluşur) |

**Canlı DB keşfi:** son WA partisi `10 Haziran 2026` (122 kayıt) → summary 7 sonrası hiç aktarım YOK, çakışma yok. `legacy_source_title` üzerinde **GLOBAL UNIQUE index** var (`idx_command_center_items_legacy_source_title_unique`) — yeni başlıklar mevcut 729 kayıtla çakışmamalı. `supabase_migrations.schema_migrations` kolonları: `version(text), statements(array), name(text)`; canlıdaki son sürüm `20260802110000`.

## 2. Bekleyen ajan çıktıları (devir anında GERÇEK durum — aşağıdaki tablo son kontrolde doğrulandı)

⚠️ **PLATFORM SORUNU (kısmen düzeldi, dikkatli ol):** Bu oturumda arka plan ajanları (Agent tool) tekrar tekrar aynı hatayla düştü: `"There's an issue with the selected model (claude-fable-5)..."` / `"Not logged in"`. Bu bir görev/prompt hatası DEĞİL, platform kesintisiydi. **Ama sorun geçici görünüyor** — birkaç yeniden deneme sonrası ajanlar başarıyla tamamlanmaya başladı (bkz. `cc-review-1`, `cc-review-3` altta). Sıradaki oturum: dosya yoksa önce 1 kez yeniden dene, yine düşerse kullanıcıya bildir (döngüye girip limit tüketme).

**GÜNCEL DURUM (son kontrol — devir anında 4/5 TAMAM):**

| Dosya | Üretici | Durum (son kontrolde) |
|---|---|---|
| `wa-curated-todo.psv` | Küratasyon: 415 todo → tekilleştirilmiş seed satırları | ✅ **HAZIR, 412 satır** — KULLANILABİLİR |
| `wa-curated-karar.psv` | Küratasyon: karar+bilgi → "KARAR:"/"NOT:" satırları | ✅ **HAZIR, 328 satır** — KULLANILABİLİR ama ⚠️ beklenenden (100-160) yüksek, sıradaki oturum Faz B'ye geçmeden önce bu dosyayı hızlıca gözden geçirsin (fazla seçici olmamış, gerçek karar/bilgi mi yoksa gürültü mü kontrol et — özellikle "bilgi" tarafı seçici olması gerekiyordu) |
| `cc-review-1.psv` | İnceleme TODO+NO+MAN | ✅ **HAZIR, 77 satır** (KAPAT 25 + ELLE 52) — KULLANILABİLİR |
| `cc-review-2.psv` | İnceleme T1–T16 | ❌ YOK (devir anında) — 2. deneme arka planda çalışıyordu (agentId `a3b519db403cd9f19`), sonucu devir anında belli değil — **TEK EKSİK PARÇA** |
| `cc-review-3.psv` | İnceleme WA partileri | ✅ **HAZIR, 65 satır** (KAPAT 44 + ELLE 21) — KULLANILABİLİR |

**Sıradaki oturumun İLK ADIMI:** yukarıdaki 5 dosyayı `Test-Path` ile tek tek kontrol et (komut Bölüm 3'te) — `cc-review-2.psv` devir anından sonra tamamlanmış olabilir. Yoksa aşağıdaki reçeteyle yeniden üret. 4/5 dosya zaten hazır olduğu için Faz B (seed migration) hemen başlatılabilir, Faz C'nin T1-T16 kısmı `cc-review-2.psv` gelince tamamlanır.

**Eksik kalanları yeniden üretme reçetesi:**
- Küratasyon (todo): girdi `wa-seed-raw.psv` (TYPE=todo satırları) + `wa-kanit.psv` + `cc-active-items.txt`. Kurallar: kopyaları birleştir; panoda zaten olanları ve anlık ıvır zıvırı at; sohbette bittiği kanıtlıysa `STATUS=Tamamlandi` yoksa `Baslanmadi`; kategori 9 slug'dan biri (aşağıda); `DATE ≤ 7/7/26 → "7 Temmuz 2026"`, sonrası → `"2 Ağustos 2026"`. Çıktı formatı (başlıksız):
  `ETIKET|KATEGORI|KIM|STATUS|BASLIK|DETAY`
- Küratasyon (karar+bilgi): aynı format; karar başlığına `KARAR: `, bilgi başlığına `NOT: ` öneki; bilgide SEÇİCİ ol (kalıcı değeri olanlar); STATUS hep `Baslanmadi`.
- İnceleme ajanları: girdi `cc-open-full.txt` (kendi src grubu) + `project-evidence.md` + `wa-kanit.psv`. Karar: KAPAT (somut kanıt, E-no/kanıt satırı zorunlu) / ELLE (muhtemel ama kanıtsız) / AÇIK (yazılmaz). Çıktı: `DECISION|id|title|KANIT-veya-gerekçe`.

## 3. Kalan işler — SIRAYLA

### Faz B — Seed migration (küratasyon dosyaları hazır olunca)
1. `& "<scratchpad>\gen-seed-sql.ps1"` → üretir:
   - `supabase/migrations/20260802120000_seed_command_center_wa_summary9.sql` (do-block, guard: `legacy_source_code='WA' and legacy_source_date_label in ('7 Temmuz 2026','2 Ağustos 2026')`)
   - `<scratchpad>\seed-title-clash-check.sql`
2. Çakışma kontrolü (0 satır dönmeli; dönenleri kürasyon dosyasında yeniden adlandır + script'i tekrar koştur):
```powershell
$envLine = Get-Content .env.local | ? { $_ -match '^SUPABASE_DB_PASSWORD=' } | Select -First 1
$env:PGPASSWORD = $envLine -replace '^SUPABASE_DB_PASSWORD=',''; $env:PGCLIENTENCODING='UTF8'
psql -h aws-1-eu-west-2.pooler.supabase.com -p 5432 -U postgres.injprdrsklkxgnaiixzh -d postgres -X -v ON_ERROR_STOP=1 -f "<scratchpad>\seed-title-clash-check.sql"
```
   (Bash sandbox dış ağa çıkamaz → PowerShell aracı `dangerouslyDisableSandbox: true` ile; Türkçe içerik DAİMA `-f` dosyayla, komut satırıyla değil!)
3. Seed'i uygula (aynı bağlantı reçetesi): `psql ... --single-transaction -f supabase\migrations\20260802120000_seed_command_center_wa_summary9.sql`
4. Doğrula: `select legacy_source_date_label, status, count(*) from command_center_items where legacy_source_code='WA' and legacy_source_date_label in ('7 Temmuz 2026','2 Ağustos 2026') group by 1,2;`
5. History kaydı: `insert into supabase_migrations.schema_migrations(version, name, statements) values ('20260802120000','seed_command_center_wa_summary9', array['-- bkz. repo dosyası']);`

### Faz C — Tamamlandı UPDATE (inceleme dosyaları hazır olunca)
1. `cc-review-1/2/3.psv` dosyalarını OKU ve **KAPAT satırlarını tek tek süz** — kanıt gerekçesi zayıf/ilgisiz olanları ELLE'ye düşür (ajanlar iyimser olabilir; nihai karar ana oturumda). ELLE satırları final rapora girer, DB'ye dokunmaz.
2. Onaylanan id'lerle migration yaz: `supabase/migrations/20260802130000_command_center_close_completed.sql`:
```sql
update public.command_center_items
   set status = 'Tamamlandi', updated_at = now()
 where id in ('<uuid1>','<uuid2>', ...)
   and status <> 'Tamamlandi' and deleted_at is null;
```
3. Uygula + history insert (`20260802130000`,`command_center_close_completed`).
4. Doğrula: öncesi/sonrası açık sayıları (öncesi: ~715 açık / 729 aktif).

### Faz D — Panel duyurusu + commit
1. `src/lib/admin-shell/admin-updates.ts` EN ÜSTE yeni girdi (`id: "20260802-komuta-merkezi-summary9"`, günlük dil, sayılarla) — **ve** `src/pages/admin/AdminDurumRaporuPage.tsx` içindeki paralel diziye senkron girdi (iki liste senkron tutulmalı — hafıza notu!).
2. `npm run test` + `npm run lint` (verify:text otomatik koşar).
3. **Pathspec'li** commit: migration 2 dosya + admin-updates + durum raporu + bu devir dokümanı. Conventional format + trailer'lar. **main'e push öncesi kullanıcıdan onay al** (hafıza kuralı).
4. Not: DB verisi anında canlıda görünür (deploy GEREKMEZ); admin-updates duyurusu ancak Coolify deploy sonrası görünür.

### Final rapor (kullanıcıya, Türkçe)
- Eklenen kayıt sayıları (etiket + statü kırılımı), kapatılan görev listesi (kanıt gerekçeleriyle), **elle karar bekleyenler** listesi (ELLE satırları), toplam açık/kapalı öncesi-sonrası.

## 4. Veri modeli hatırlatmaları (yeniden keşfetme)

- Statüler: `Baslanmadi | Beklemede | Devam ediyor | Tamamlandi` (ASCII). Atanan: `Atanmadi | UBT | Burak`.
- Kategori slug'ları (`legacy_source_category`): `rezervasyon-sistemi, kullanici-kisitlamalari, audit-kayitlari, veritabani-tasarimi, mvp-hedefleri, reklam-modeli, influencer-partnerlikleri, topluluk-yonetimi, ekip-ve-isbirligi`.
- WA satır şablonu (T16 seed'i örnek al: `supabase/migrations/applied/20260619110000_seed_command_center_meeting_t16.sql`):
  `('meeting_note', BAŞLIK, DETAY, ETIKET, KIM, STATUS, 5, null, false, 'meeting_notes', 'WA', ETIKET, KATEGORI-SLUG, BAŞLIK, sort_order10arartan)`
- `category_label` = `legacy_source_date_label` = etiket ("7 Temmuz 2026" / "2 Ağustos 2026").

## 5. Tuzaklar

- **Türkçe içerik komut satırından psql'e BOZUK gider** → daima UTF-8 dosya + `psql -f` + `PGCLIENTENCODING=UTF8`.
- Bash tool'un sandbox'ı dış ağa erişemez → psql'i PowerShell tool + `dangerouslyDisableSandbox: true` ile koştur.
- `legacy_source_title` global unique → seed'te başlık tekrarı ANINDA patlatır; gen script batch içi tekrarları `(2)` ekleyerek çözer ama DB çakışmasını `seed-title-clash-check.sql` ile önceden yakala.
- Migration dosyaları repo'da `supabase/migrations/` köküne (applied/'a taşıma sonraki temizlikte).
- Ajan (Agent tool) nihai raporları bazen boş dönüyor — çıktıyı DAİMA dosyaya yazdır (bu oturumun deseni).
