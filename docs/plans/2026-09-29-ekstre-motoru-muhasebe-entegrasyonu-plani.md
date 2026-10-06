# Ekstre motoru → muhasebe modülü entegrasyon planı — 29 Eylül 2026

> **Durum: plan yazıldı, UYGULAMA BAŞLAMADI.** Dört karar bu oturumda alındı
> (tablo öneki · iade politikası · PDF okuyucu · Mercury ertelemesi); kod
> yazılmadı, migration uygulanmadı, commit atılmadı.
>
> Kaynak paket: `corteqs-ekstre-motoru/` (30 dosya, 3.834 satır) — depo kökünde
> **takipsiz** duruyor, `.gitignore`'da da değil. Repoya commit edilmez.

## Neden bu iş var

`corteqs-ekstre-motoru/` (30 dosya, 3.834 satır, **git'te değil**, `.gitignore`'da da değil — takipsiz duruyor)
kart ekstresi PDF/CSV'sini okuyup teknoloji giderlerini ayıklayan, USD'ye çeviren, mükerrerleri eleyen
ve **onaydan sonra** muhasebeye yazan bir motor. Bugün Burak ekstre satırlarını elle giriyor; motor bu işi
"yükle → gözden geçir → onayla" akışına çeviriyor.

Paket kendi başına tutarlı ve test edilmiş (13/13 `node:test`), ama **bu depoya doğrudan kopyalanamaz.**
Ölçülen yedi somut engel var (aşağıda kanıtlarıyla). En kritik ikisi sessizce değil, **gürültülü** patlar
(migration hiç çalışmaz / commit RPC'si hata verir) — yani fark edilir; ama üçü sessiz sınıftan:
kapanmış bir mimari borcu yeniden açmak, üretilen tip dosyasını bayatlatmak ve enum dışı bir kategori
değerini yalnızca canlıda hataya çevirmek.

**Hedef:** motor `/admin/muhasebe/ekstre` sekmesi olarak depo sözleşmelerine uygun biçimde yaşasın;
Mercury ertelensin; iadeler muhasebeye hiç girmesin.

### Verilen kararlar (bu oturumda onaylandı)

| Karar | Seçim |
|---|---|
| Tablo adları | **`muhasebe_` öneki** (`relocation_fx_rates`, `muhasebe_butce_state` emsali) |
| İadeler | **`CHECK (amount >= 0)` korunur, iade muhasebeye AKTARILMAZ** (incelemede kalır, elle işlenir) |
| PDF okuyucu | **Mevcut Gemini** (`GEMINI_API_KEY` + `AI_PROVIDER`), Anthropic eklenmez |
| Mercury | **Ertelendi** — Faz 6, kart/token gelince |

---

## Ölçülen engeller (planın dayanağı)

| # | Engel | Kanıt | Sonuç |
|---|---|---|---|
| **E1** | Parametresiz `public.is_admin()` **YOK** | `baseline` yalnız `is_admin(uid uuid)` tanımlar; deponun tüm RLS'i `public.is_admin(auth.uid())`; `_shared/edge-authorization.ts:80` → `rpc("is_admin", { uid })`. `applied/`'daki 6 `is_admin()` geçişinin **hepsi yorum satırı** | Paket migration'ı 7 RLS + 2 fonksiyonda `public.is_admin()` çağırıyor → **migration hiç çalışmaz** |
| **E2** | Kategori enum uyuşmazlığı | Enum: `…,banka_komisyon,**diger_gider**`. Paket: `types.ts` union'da `"diger"`, `pipeline.ts:100` fallback `"diger"`, seed satır 42–43 `'diger'` | `expenses.category` enum → commit anında geçersiz değer hatası |
| **E3** | 5 kolon enum, motor `text` üretiyor | `expenses.person/category/currency/status/payment_method` = `person_type`/`expense_category`/`currency_code`/`expense_status`/`payment_method` | `insert … values (r.person, …)` text→enum **örtük cast etmez**, açık `::` gerekir |
| **E4** | `CHECK (amount >= 0)` canlıda var | `expenses_amount_check` | Negatif iade satırı commit'te patlar |
| **E5** | UI sayfası 12 doğrudan Supabase çağrısı yapıyor | `EkstreAktar.tsx` satır 71,81,89,105,117,119,134,144,159,176,189,435 | **Kapanmış B6 borcunu yeniden açar** (A04b, 27.09: "bileşen/sayfa katmanında doğrudan tablo sorgusu KALMADI") |
| **E6** | `src/components/ui/alert.tsx` **yok** (yalnız `alert-dialog.tsx` var) | `ls src/components/ui` | Sayfa derlenmez |
| **E7** | Edge function sözleşmesi farklı | Depo: `https://esm.sh/@supabase/supabase-js@2.108.2` (15/15, pinned) + `Deno.serve` (12/12). Paket: `npm:@supabase/supabase-js@2`, `x-cron-secret`, kendi naif secret karşılaştırması | Kanonik `_shared/edge-authorization.ts` (`secretsMatch`, `x-dispatch-secret`) kullanılmalı |

### Doğrulanan "engel değil"ler — bunlardan iş çıkarma

- **Tablo adı çakışması yok.** `payment_cards · merchant_rules · fx_rates · statement_imports · statement_lines · mercury_sync_state · accounting_settings` → baseline 0, applied 0.
- **TRY-only view'lar sorun DEĞİL.** Dört view (`v_muhasebe_kpi/by_person/by_category/cashflow_monthly`) `currency='TRY'` filtreliyor, ama **hiçbir sayfa onları kullanmıyor** (`useKpiSummary`/`usePersonSummary`/`useCategorySummary`/`useCashflowMonthly` → 0 kullanım). Her muhasebe sayfası `useExpenses`/`useIncomes` ile tam satır çekip `muhasebe-aggregations.ts` ile **döviz bazında** topluyor (`CURRENCY_CODES` USD içerir). USD kayıtlar panoda görünür. ⚠️ Bu view'ları "USD eklemek için" düzeltmeye kalkma — ölü yüzeydir.
- **Depolama anahtarına ham dosya adı girmiyor.** `EkstreAktar.tsx:116` → `crypto.randomUUID()`; `file.name` yalnız gövdede metin olarak gider. `service-attachment-security.test.ts` dosyaya özgüdür (`ServiceRequestForm.tsx`), dizin taramaz → kızarmaz.
- **Motor testleri depoda koşabilir.** `vitest.config.ts` include zaten `supabase/functions/**/*.test.ts` içeriyor ve mevcut `_shared/*.test.ts` dosyaları `.ts` uzantılı import kullanıyor (`allowImportingTsExtensions: true`).
- **`fx_rates` ayrı tablo olarak HAKLI.** Mevcut `relocation_fx_rates` *son kur* tablosudur (`rate_at timestamptz`, kaynak `open.er-api.com`). Muhasebe **tarih bazlı, resmî TCMB** kuru ister. Ayrı tablo bilinçlidir; migration yorumunda bu yazılacak.

### Yanlış olduğu ölçülen belge iddiası (düzeltilecek)

`CLAUDE.md` kanonik tablolar satırında **`muhasebe_gelirler`/`muhasebe_giderler`** yazıyor.
Gerçek tablolar **`public.expenses` / `public.incomes`** (baseline + `muhasebe-api.ts`).
Bu ad yanlışı bir sonraki oturumu olmayan tabloya yönlendirir → Faz 5'te düzeltilecek.

---

## Batch planı

Her batch **tek başına yeşil bırakır** ve tek başına geri alınabilir. Migration'lar depo akışına uyar:
**yaz → canlıya `psql -f` ile uygula → `applied/` altına TAŞI → `schema_migrations` kaydı at →
`npm run check:migrations`.** Dosyayı parent `supabase/migrations/` içinde bırakma (05.08 kör noktası).
Zaman damgası tavanı bugün **`20260929140000`** — yeniler bunun üstünde ve birbirinden farklı olmalı.

---

### Faz 0 — Ölçüm (kod yok, ~20 dk)

**A0 · Canlı şemayı teyit et.** Baseline dump 2026-08-04'tür ve *güncel gerçek değildir*; şema/kısıt
sorusu canlı kataloğa sorulur.

```sql
-- is_admin imzaları (E1)
select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='is_admin';
-- expenses kısıtları (E4) + kolonlar
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.expenses'::regclass;
select column_name, data_type, udt_name from information_schema.columns
where table_schema='public' and table_name='expenses' order by ordinal_position;
-- enum üyeleri (E2/E3)
select t.typname, e.enumlabel from pg_type t join pg_enum e on e.enumtypid=t.oid
where t.typname in ('expense_category','person_type','currency_code','expense_status','payment_method')
order by t.typname, e.enumsortorder;
-- ad çakışması
select tablename from pg_tables where schemaname='public'
  and tablename ~ '^(muhasebe_|payment_cards|merchant_rules|fx_rates|statement_|accounting_settings)';
```

⚠️ **Canlı örnek (keşif) sorgusu yazma.** Üretim örneği <1 GB RAM'dedir; 05.08'de satır başına
fonksiyon uygulayan tek bir ölçüm sorgusu Postgres'i düşürdü ve site ~50 dk kapandı. Yukarıdakiler
katalog sorgusudur, güvenlidir.

**Çıktı:** E1–E4'ün canlıda da geçerli olduğu (ya da olmadığı) yazılı teyit. E1 canlıda farklıysa
B1/B3'teki ifade ona göre değişir — **varsayımla yazma.**

---

### Faz 1 — Veri katmanı (4 migration + tip üretimi)

#### B1 · `2026XXXX_muhasebe_ekstre_motoru.sql` — 6 yeni tablo + kova

Paketin migration'ından türetilir, şu farklarla:

1. **Ad öneki:** `muhasebe_payment_cards · muhasebe_merchant_rules · muhasebe_fx_rates ·
   muhasebe_statement_imports · muhasebe_statement_lines · muhasebe_settings`.
   `mercury_sync_state` **bu batch'te yok** (Faz 6).
2. **RLS:** paketin `do $$ … foreach` döngüsü ve `public.is_admin()` yerine, her tabloya
   **açık** politika: `for all to authenticated using (public.is_admin(auth.uid()))
   with check (public.is_admin(auth.uid()))`. Depodaki `expenses` politikalarıyla (`admins_*_expenses`)
   birebir aynı ifade.
3. **`muhasebe_statement_lines`'a enum aynalı CHECK ekle** — `category`, `person`, `payment_method`,
   `currency_original`, `line_type`, `decision`, `status`. Gerekçe: bu kolonlar `text` ve
   **`events.type` dersinin aynısı** — CHECK yoksa enum dışı değer (`'diger'`) hata vermeden kaydedilir,
   hata yalnız commit anında ortaya çıkar. CHECK ile yanlış değer *ayrıştırma* anında düşer.
4. **`muhasebe_fx_rates` yorumu:** neden `relocation_fx_rates`'ten ayrı (tarih bazlı resmî TCMB kuru
   ≠ son kur/er-api) — sonraki oturum "iki FX tablosu var" diye birleştirmeye kalkmasın.
5. **Kova:** `statements` (private, 20 MB, `application/pdf,text/csv,application/json`).
   `storage.objects` politikası `public.is_admin(auth.uid())` ile. Kova adı `statements` kalabilir
   (kova ad alanı tablo ad alanından ayrı; mevcut kovalarla çakışmıyor).
6. Depo migration stili: ağır başlık yorumu (amaç/ölçüm/karar/uygulama adımları), `begin; … commit;`,
   sonda **GERİ ALMA** bloğu. Emsal: `applied/20260929120000_revision_attachments_document_mimes.sql`.

#### B2 · `2026XXXX_expenses_ekstre_kolonlari.sql` — `expenses` ek kolonları

Paketteki 14 kolon (`amount_original, currency_original, partner_name, amount_try, amount_usd,
amount_usd_net, partner_share_usd, fx_rate_usd, card_last4, merchant_raw, source, source_import_id,
source_fingerprint, external_id`) + 3 index (`source_fingerprint` uq, `external_id` uq, `source` idx).

**Ayrı migration olmasının sebebi:** mali tabloya dokunur, kendi geri alması olmalı.
Hepsi `add column if not exists` ve **boş bırakılabilir** → mevcut 0 kayıt etkilenmez.
`source text not null default 'manual'` mevcut satırları `'manual'` işaretler (doğru).

⚠️ `CHECK (amount >= 0)` **DOKUNULMAZ** (verilen karar).

#### B3 · `2026XXXX_muhasebe_commit_statement_lines.sql` — commit + revert RPC

`public.muhasebe_commit_statement_lines(p_import_id uuid, p_line_ids uuid[] default null)` ve
`public.muhasebe_revert_statement_import(p_import_id uuid)`. Pakete göre dört değişiklik:

1. `public.is_admin()` → **`public.is_admin(auth.uid())`** (E1).
2. **Açık enum cast'ları** (E3):
   `r.person::public.person_type`, `r.category::public.expense_category`,
   `'USD'::public.currency_code`, `'odendi'::public.expense_status`,
   `r.payment_method::public.payment_method`.
3. **İade elemesi** (E4, verilen karar): `amount_usd is null` kontrolünün yanına
   `line_type = 'refund' or amount_usd_net < 0` → satır atlanır, sayaca `skipped_refund` olarak
   yazılır, `flags`'a `iade_aktarilmadi` eklenir. Dönen `jsonb`'ye `skipped_refunds` alanı eklenir ki
   **UI sessiz kalmasın** ve kullanıcı "şu N iade elle işlenecek" uyarısını görsün.
4. `security definer` + `set search_path = public` korunur; `revoke … from public, anon` +
   `grant execute … to authenticated` korunur. `service_role` grant'i **kaldırılır** (Faz 1'de cron yok).

#### B4 · `supabase/seed/muhasebe_merchant_rules_seed.sql` — kural/kart tohumu

34 kural + 3 kart. **İki düzeltme:**
- `'diger'` → **`'diger_gider'`** (satır 42 "Kişisel eğlence", satır 43 "Amazon") — E2.
- Tablo adları `muhasebe_merchant_rules` / `muhasebe_payment_cards`.

Tekrar çalıştırılabilir kalır (`where not exists (… pattern = …)` / `on conflict do nothing`).
Seed `applied/` altına **girmez** — `supabase/seed/` veri tohumudur, migration değil.

#### B5 · `src/integrations/supabase/types.ts` yeniden üret

6 yeni tablo + `expenses`'ın 14 yeni kolonu üretilen tip dosyasında yoksa
`supabase.from("muhasebe_statement_imports")` **tsc hatası** verir ve depo 0-hata durumunu kaybeder.
Yol: Management API + geçerli `SUPABASE_ACCESS_TOKEN` (B1 emsali).

⚠️ Supabase yüklerinde **`as TablesInsert<…>` cast KULLANMA** — `satisfies` kullan. Cast, olmayan
sütuna yazmayı tsc'den gizler; hata yalnız canlıda `PGRST204` olarak çıkar.

---

### Faz 2 — Motor (saf TS, testli)

#### C1 · Motoru `supabase/functions/_shared/ekstre/` altına taşı

8 dosya: `types.ts · normalize.ts · rules.ts · fx.ts · dedupe.ts · pipeline.ts · sources.ts ·
extract-pdf.ts` (+ `index.ts` barrel). `_shared/engine/` değil **`_shared/ekstre/`** — `_shared` kökü
zaten 18 dosyalı ve "engine" adı hangi motor olduğunu söylemiyor.

Değişiklikler:
- **`types.ts` Category union:** `"diger"` → **`"diger_gider"`** (E2). Dosyadaki
  "mevcut şema ile birebir" yorumu bugün **yanlıştır** — düzeltilir.
- **`pipeline.ts:100`** fallback `?? "diger"` → `?? "diger_gider"`.
- `.ts` uzantılı importlar **korunur** (depo emsali: `_shared/edge-authorization.test.ts`).
- Motor **Deno API'si kullanmaz** — vitest altında koşabilmesi buna bağlı. `crypto.subtle` (dedupe)
  ve `fetch` (fx) Node 22'de globaldir; `extract-pdf.ts` `env`'i **parametre olarak** alır, `Deno.env`
  okumaz. Bu sözleşmeyi bozma.

#### C2 · Testleri vitest'e port et + sözleşme testleri ekle

`tests/engine.test.ts` (13 test, `node:test` + `node:assert/strict`) →
`supabase/functions/_shared/ekstre/ekstre-engine.test.ts`, `describe/it/expect` ile.
Mekanik dönüşüm: `test(…)` → `it(…)`, `assert.equal` → `expect(…).toBe(…)`,
`assert.deepEqual` → `toEqual`.

**Yeni sözleşme testi — `muhasebe-ekstre-vocabulary.test.ts`** (kaynak metin taramalı, `events-vocabulary.test.ts`
emsali). Üç yakayı birbirine kilitler:
1. `types.ts`'teki `Category`/`Person`/`PaymentMethod` union üyeleri = `src/types/muhasebe.ts`'teki
   `ExpenseCategory`/`PersonType`/`PaymentMethod` union üyeleri.
2. Aynı üyeler B1 migration metnindeki CHECK listelerinde geçer.
3. Seed dosyasında **enum dışı kategori yok** (`'diger'` bir daha giremez).

⚠️ Kaynak metni dilimlerken çıplak `indexOf + slice` **kullanma** — `@/test/source-slice`
yardımcıları zorunlu (`test-source-slice-contract.test.ts` kilitler; `indexOf` −1 dönünce
`slice(-1)` hata vermez, son karakteri döner ve iddia **her iki polaritede** sessizce geçer).

#### C3 · TCMB kur yolu

`fx.ts` değişmez (`fetchTcmb` + `liveFx` + `tableFx`). Yalnız `context` tarafında tablo adı
`muhasebe_fx_rates` olur. ⚠️ Canlı TCMB çağrısı bu pakette **hiç denenmedi** — Faz 5'te
ilk yüklemeden sonra `select * from muhasebe_fx_rates order by rate_date desc limit 10` ile
TCMB sitesiyle karşılaştırılacak.

---

### Faz 3 — Edge function (yalnız `statement-parse`)

#### D1 · `_shared/ekstre/context.ts` — kanonik hâle getir

Paketin `context.ts`'i (153 satır) şu dört noktada depo sözleşmesine çekilir:

| Paket | Depo sözleşmesi |
|---|---|
| `npm:@supabase/supabase-js@2` | **`https://esm.sh/@supabase/supabase-js@2.108.2`** (15/15 fonksiyon, pinned) |
| `rpc("is_admin")` parametresiz | **`resolveAdminOrSecretCaller`** (`_shared/edge-authorization.ts`) — içinde `rpc("is_admin", { uid })` |
| `x-cron-secret` + `===` karşılaştırma | Kanonik **`x-dispatch-secret`** + `secretsMatch` (sabit zamanlı). *Faz 1'de cron yok* → secret yolu hiç açılmayabilir; açılırsa kanonik olan kullanılır |
| `cors: Access-Control-Allow-Origin: "*"` | `_shared/edge-security.ts` → **`buildAssistantCorsHeaders(req)`** (origin allowlist) |

⚠️ `verify_jwt` **yetki denetimi DEĞİLDİR** — anon anahtarı da geçerli bir JWT'dir ve frontend
paketinde herkese açıktır. `service_role` istemcisiyle veri okuyan bu fonksiyon kendi içinde
çağıranı doğrulamak **zorundadır** (`edge-authorization.ts` başlığındaki gerekçe).

Tablo adları `muhasebe_*` olur; `loadContext`'teki `expenses` sorgusu **aynı kalır** (tablo adı gerçekten
`expenses`). `loadSettings` → `muhasebe_settings`.

#### D2 · `supabase/functions/statement-parse/index.ts`

Paketten alınır; `Deno.serve` korunur (12/12 emsal). Değişiklikler:
- Import yolu `../_shared/ekstre/index.ts`.
- **PDF okuyucu Gemini** (verilen karar): `extract-pdf.ts`'in Gemini yolu kullanılır,
  `AI_PROVIDER` varsayılanı `gemini`, anahtar `GEMINI_API_KEY`. Anthropic dalı kodda kalabilir ama
  **varsayılan değildir** ve secret eklenmez.
  ⚠️ Gemini yolu gerçek PDF ile **hiç denenmedi** (yalnız `fixtures/ornek_gemini_cikti_qnb.json` ile
  simüle edildi) → Faz 5'te satır sayısı + toplam PDF'le karşılaştırılacak. Motorun mutabakat uyarısı
  (`sanitize`, satır toplamı ≠ ekstre toplamı) bu yüzden **susturulmaz.**
- `mercury-sync` **kopyalanmaz** (Faz 6).

#### D3 · `supabase/config.toml` + deploy

```toml
# Yalnız admin panelinden çağrılır; cron yolu yok (Mercury Faz 6'da).
# Yetki fonksiyonun içinde: resolveAdminOrSecretCaller (getUser + is_admin RPC).
[functions.statement-parse]
verify_jwt = true
```

⚠️ `config.toml` **şu an commit'siz değişiklik taşıyor** (`radar-news-scan` bloğu, `git diff` ile
doğrulandı) — üzerine yazma, bloğu **ekle**.

Deploy: `supabase functions deploy statement-parse` → `npm run check:functions` ile iki yakayı
karşılaştır. ⚠️ **Coolify edge function deploy ETMEZ** (`Dockerfile` yalnız frontend'i kurar):
commit'lemek canlıya çıkarmaz, elle deploy şarttır.

**Secret:** yeni secret **yok** — `GEMINI_API_KEY` zaten canlıda. Bu, Gemini kararının somut kazancı.

---

### Faz 4 — İstemci

#### E1 · `src/components/ui/alert.tsx` ekle (E6)

Eksik shadcn primitive'i. `src/components/ui/*` otomatik üretilen katmandır — kanonik shadcn
`alert` kaynağı eklenir, elle özelleştirilmez.

#### E2 · `src/lib/muhasebe-ekstre-api.ts` + `src/hooks/useMuhasebeEkstre.ts` (E5)

**Bu batch pazarlık konusu değil:** sayfadaki 12 doğrudan çağrı API katmanına taşınır, yoksa
27.09'da kapatılan B6 borcu yeniden açılır.

`muhasebe-ekstre-api.ts` (emsal: `muhasebe-api.ts`) — açık dönüş tipli fonksiyonlar:
`fetchStatementImports() · fetchStatementLines(importId) · fetchMuhasebeSettings() ·
updateMuhasebeSettings(patch) · uploadStatementFile(file) · parseStatement(body) ·
updateStatementLine(id, patch) · commitStatementLines(importId, lineIds?) ·
revertStatementImport(importId) · createMerchantRule(input)`

⚠️ `fetchStatementLines` **tam liste olmalı** — `fetchAllRows` (`src/lib/supabase-chunked.ts`,
`fetchExpenses` emsali). PostgREST 1000 satırda **sessizce keser**; bir ekstrede 1000+ satır olması
olağandışı ama mali listede eksik satır gösterilmesi kabul edilemez. `fetchStatementImports` ise
açık `.limit(30)` ile "son 30 yükleme" olarak kalır (bilinçli pencere, tam liste değil).

`useMuhasebeEkstre.ts` — `muhasebe-ekstre-schemas.ts`'te Zod şemaları (satır düzenleme + kural
formu), `useMuhasebe.ts` emsaliyle `queryKey` fabrikası ve mutasyon sonrası invalidasyon.
Gider yazıldığında **`muhasebeKeys.all` de invalidate edilmeli** — yoksa commit sonrası Giderler
sayfası bayat kalır.

#### E3 · `EkstreAktar.tsx` → ince sayfa + rotaya bağlama

Paketin 468 satırlık sayfası, DB çağrıları çıkarılınca sunum katmanına iner. Bağlama üç dosyada:

- `src/pages/admin/muhasebe/routes.tsx` → `const EkstreAktar = lazyWithReload(() => import('./EkstreAktar'))`
  + `<Route path="ekstre" …>` (`Suspense` + `PageFallback` deseni aynen).
  ⚠️ `lazy()` **doğrudan kullanılmaz**, `lazyWithReload()` sarmalayıcısı zorunlu.
- `src/pages/admin/muhasebe/MuhasebeLayout.tsx` → `TABS`'a `{ to: 'ekstre', label: 'Ekstre Aktar', icon: FileUp }`.
- `src/lib/admin-shell/admin-navigation-registry/muhasebe.ts` → `muhasebe-ekstre` girdisi
  (`to: "/admin/muhasebe/ekstre"`, `accent: "green"`, `aliases: ["ekstre","statement","kart","pdf"]`).
  URL path'i route ağacıyla **birebir** aynı olmalı.

Etiket sabitleri **çoğaltılmaz**: `EXPENSE_CATEGORY_LABELS`, `PERSON_LABELS`,
`PAYMENT_METHOD_LABELS` `@/types/muhasebe`'den alınır.

⚠️ **Türkçe metin:** `verify:text` yalnız kodlama/mojibake denetler, **eksik harfi yakalamaz**
(19.09'da 459 satırda 5 Türkçe karakter ASCII'ye düşmüştü). Gözle kontrol et.
Kullanıcıya görünen arama/filtre eşleşmesinde `trIncludes`, görüntü case'inde `trUpper/trLower`
(`src/lib/text-normalization.ts`) — çıplak `toUpperCase()` kullanma.

#### E4 · Giderler sayfasında USD/orijinal/gider ortağı gösterimi

`GiderlerPage.tsx`'te USD tutarın yanında küçük gri `amount_original currency_original` ve gider
ortağı varsa `Baran −$100` rozeti. Bu olmadan Burak ekstreden gelen `$100`'ün brütünün `$200`
olduğunu **yalnız not alanını açarak** görebilir.

#### E5 · Testler

- `muhasebe-ekstre-api.test.ts` — Supabase istemcisi mock'lu (muhasebe testleri emsali).
- `EkstreAktar.test.tsx` — sekme/tablo/onay akışı; `@/hooks/useMuhasebeEkstre` mock'lanır.
  ⚠️ `vi.mock` yolu bileşenin **gerçekten import ettiği** yol olmalı.
- `muhasebe-ekstre-commit-contract.test.ts` — B3 migration metninde (a) `is_admin(auth.uid())`
  geçtiğini ve parametresiz `is_admin()` **geçmediğini**, (b) beş enum cast'ının bulunduğunu,
  (c) iade elemesinin durduğunu kilitler. Bu üçü sessizce geri alınabilir sınıftır.

---

### Faz 5 — Doğrulama ve belge

#### F1 · Tam kapı

```bash
npm run verify:text
npm run lint                              # 0 problem beklenir
npx tsc -p tsconfig.app.json --noEmit     # 0 hata — ELLE koşar, prelint/pretest'te YOK
npm run test                              # tam takım yeşil (bugünkü taban 2875)
npm run ingest:tools:check                # src/lib/** eklendi → ajan kataloğu bayatlar
npm run check:migrations                  # sapma yok + parent dizinde stray yok
npm run check:functions                   # repo ↔ canlı: 13 = 13
npm run check:dead                        # 0 beklenir
```

⚠️ `ingest:tools:check` bu sınıfta **zorunlu**: `src/lib/**` altına dosya eklemek
`docs/agent/tools.json` + `src/lib/agent/tools-catalog.generated.ts` + `docs/agent/openapi.yaml`
üçlüsünü bayatlatır ve **ne lint ne test yakalar** (`prelint` yalnız `check:drift` koşar).

#### F2 · Gerçek ekstreyle uçtan uca (kabul kriteri)

1. Son QNB sanal kart ekstresini yükle → **satır sayısı ve toplamı PDF'le karşılaştır**
   (tutmazsa sayfada mutabakat uyarısı çıkar). Gemini satır kaçırırsa Anthropic dalı tartışmaya açılır.
2. `select * from muhasebe_fx_rates order by rate_date desc limit 10` → USD/TRY ve EUR/USD değerleri
   TCMB sitesiyle aynı olmalı (**canlı TCMB çağrısı ilk kez burada denenir**).
3. "İncele" sekmesini düzelt → "Kural yap" → gider ortağı olan satıra ad + $ yaz.
4. Onayla → Giderler'de USD tutarları ve notu (`Gider ortağı Baran: $100.00 (brüt $200.00)`) kontrol et.
5. **İade satırı varsa:** muhasebeye girmediğini ve UI'da "N iade aktarılmadı" uyarısının
   göründüğünü doğrula (E4 kararının kanıtı).
6. Aynı ekstreyi **ikinci kez** yükle → `0 yeni kayıt` (mükerrer eleme).
7. **Geri al** → `expenses`'tan silindiğini ve satırların `pending`'e döndüğünü doğrula.
8. Admin olmayan bir hesapla RPC çağır → reddedilmeli.

#### F3 · Belge

- `CLAUDE.md`: (a) **`muhasebe_gelirler`/`muhasebe_giderler` → `expenses`/`incomes` düzeltmesi**
  (ölçülmüş yanlış), (b) yeni "Ekstre motoru" bölümü — `muhasebe_` önekli 6 tablo, iade kararı,
  Gemini kararı, Mercury'nin ertelendiği, TRY-only view'ların ölü olduğu.
- `docs/modules/` altına akış belgesi; paketin `README.md`/`BARIS_ICIN_NOTLAR.md` özü buraya taşınır.
- `corteqs-ekstre-motoru/` + `.zip`: entegrasyon bittikten sonra **silme kararı kullanıcıya ait**.
  Repoya commit **edilmez** (kök temizliği kuralı: kökte yalnız `CLAUDE.md` + `README.md`).

---

### Faz 6 — Ertelenen: Mercury (kart/token gelince)

Ayrı batch: `muhasebe_mercury_sync_state` tablosu + `mercury-sync` edge function +
`MERCURY_API_TOKEN`/`x-dispatch-secret` secret'ları + `config.toml` bloğu
(`verify_jwt = false`, gerekçe yorumuyla) + saatlik cron. Motor **değişmez**.
`muhasebe_settings.mercury_auto_commit` zaten `false` varsayılanıyla B1'de kurulu — Mercury
satırları da önce incelemeye düşer.

---

## Dokunulacak kritik dosyalar

**Yeni:** `supabase/migrations/` (3) · `supabase/seed/muhasebe_merchant_rules_seed.sql` ·
`supabase/functions/_shared/ekstre/*` (9) · `supabase/functions/statement-parse/index.ts` ·
`src/lib/muhasebe-ekstre-api.ts` · `src/lib/muhasebe-ekstre-schemas.ts` ·
`src/hooks/useMuhasebeEkstre.ts` · `src/pages/admin/muhasebe/EkstreAktar.tsx` ·
`src/components/ui/alert.tsx` · testler (4)

**Değişecek:** `src/pages/admin/muhasebe/routes.tsx` · `MuhasebeLayout.tsx` ·
`src/lib/admin-shell/admin-navigation-registry/muhasebe.ts` · `src/pages/admin/muhasebe/GiderlerPage.tsx` ·
`src/integrations/supabase/types.ts` (üretilir) · `supabase/config.toml` (ekleme) · `CLAUDE.md`

**Yeniden kullanılacak (yazılmayacak):** `_shared/edge-authorization.ts`
(`resolveAdminOrSecretCaller`, `secretsMatch`) · `_shared/edge-security.ts`
(`buildAssistantCorsHeaders`, `readJsonWithLimit`) · `src/lib/supabase-chunked.ts` (`fetchAllRows`) ·
`src/lib/lazy-with-reload.ts` · `src/lib/security.ts` (`safeStorageFileName`) ·
`src/lib/text-normalization.ts` · `src/types/muhasebe.ts` (etiket sözlükleri) ·
`src/lib/muhasebe-format.ts` (`formatCurrency`)

## Commit

Batch başına bir commit, conventional subject + `git` trailer'ları (`Constraint:`, `Rejected:`,
`Confidence:`, `Scope-risk:`, `Not-tested:`). `Not-tested:` bu işte gerçekten dolu olacak:
canlı TCMB çağrısı ve Gemini'nin gerçek PDF okuması Faz 5'e kadar doğrulanmamış durumda.
Commit'lerde pathspec kullan (`git commit -- <dosyalar>`) — çalışma dizini paylaşılıyor olabilir.
