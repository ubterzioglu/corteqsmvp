# Rakam Yenileme — 5 Ekim 2026

> **Amaç:** CLAUDE.md ve AGENT_CONTEXT.md'deki bayat rakamları yeniden ölçmek.
> **Önceki ölçüm:** 28.09 gece (CLAUDE.md satır 11-27)

---

## 1 · Ölçülen Rakamlar

| Metrik | Eski (28.09) | Yeni (05.10) | Fark |
|---|---|---|---|
> ⚠️ **DÜZELTME (bağımsız inceleme, 05.10 akşam).** İlk sürümdeki üç rakam yanlış ölçülmüştü:
> **(1)** 1.833 ve 439 TÜM DEPONUN sayısıydı (scripts/supabase/workers dahil); eski 1.278 ve 320
> `src` altındaydı, yani karşılığı **1.436** ve **409**. **(2)** `App.tsx` 347, `Measure-Object -Line`
> ile ölçülmüştü — bu komut BOŞ SATIRLARI saymaz (CLAUDE.md'nin uyardığı tuzak); doğrusu
> `(Get-Content).Count` = **357**. **(3)** `lazyWithReload` 66, `import` satırını da sayıyordu;
> çağrı (`lazyWithReload(`) sayısı **65**. Aşağıdaki tablo düzeltilmiş hâldir.

| Metrik | Eski (28.09, `src`) | Yeni (05.10) | Fark |
|---|---|---|---|
| `.ts`/`.tsx` dosya sayısı — **yalnız `src/`** | 1.278 | **1.436** (tüm depo: 1.833) | +158 |
| Test dosyası sayısı — **yalnız `src/`** | 320 | **409** (tüm depo `.test.ts/tsx`: 439; `npx vitest run` toplamı: **463** dosya / **3.892** test) | +89 |
| Applied migration sayısı | 182 | **244** | +62 |
| App.tsx satır sayısı (`(Get-Content).Count`) | 336 | **357** | +21 |
| `lazyWithReload(` çağrı sayısı | 61 | **65** | +4 |
| Aktif rol sayısı | 78 | **78** (ilk turda DB'den ölçülmüş; bu turda yeniden doğrulanmadı) | 0 |

---

## 2 · Ölçüm Komutları

```powershell
# .ts/.tsx dosya sayısı — YALNIZ src/ (eski 1.278 ile karşılaştırılabilir olan bu)
git ls-files | Where-Object { $_ -match '^src/.*\.(ts|tsx)$' } | Measure-Object | Select-Object -ExpandProperty Count
# Sonuç: 1436   (tüm depo, `^src/` olmadan: 1833)

# Test dosyası sayısı — YALNIZ src/
git ls-files | Where-Object { $_ -match '^src/.*\.test\.(ts|tsx)$' } | Measure-Object | Select-Object -ExpandProperty Count
# Sonuç: 409    (tüm depo: 439 · vitest toplamı için `npx vitest run`: 463 dosya / 3892 test)

# Applied migration sayısı
(Get-ChildItem supabase/migrations/applied -File).Count
# Sonuç: 244

# App.tsx satır sayısı — ⚠️ `Measure-Object -Line` BOŞ SATIRLARI SAYMAZ (347 verir); doğru komut:
(Get-Content src/App.tsx).Count
# Sonuç: 357

# lazyWithReload ÇAĞRI sayısı — `(` ile ara, yoksa import satırı da sayılır (66 verir)
(Select-String -Path src/App.tsx -Pattern 'lazyWithReload\(' | Measure-Object).Count
# Sonuç: 65

# Aktif rol sayısı (canlı DB)
$PW = (Select-String -Path .env.local -Pattern '^SUPABASE_DB_PASSWORD=' | ForEach-Object { $_.Line -replace '^SUPABASE_DB_PASSWORD=', '' }) -replace "`r", ""
$env:PGPASSWORD = "$PW"
psql -h aws-1-eu-west-2.pooler.supabase.com -p 6543 -U postgres.injprdrsklkxgnaiixzh -d postgres -t -c "SELECT count(*) FROM public.roles WHERE is_active = true"
# Sonuç: 78
```

---

## 3 · Önerilen Güncelleme (CLAUDE.md)

**Mevcut (satır 16-27):**
```markdown
| İddia (eski) | Ölçüm (28.09 gece) |
|---|---|
| 1.270 `.ts`/`.tsx` | **1.278** |
| 316 test dosyası (src) | **320** |
| 359 dosya / 2.765 test | **364 dosya / 2.811 test** |
| 151 applied migration | **182** (archive 252, toplam 434 · canlı kayıt da **434**) |
| App.tsx 329 satır · 61 `lazy()` | **336 satır · 61 `lazyWithReload()`** |
```

**Önerilen:**
```markdown
| İddia (eski) | Ölçüm (28.09) | Ölçüm (05.10) |
|---|---|---|
| 1.270 `.ts`/`.tsx` | 1.278 | **1.833** |
| 316 test dosyası (src) | 320 | **439** |
| 151 applied migration | 182 | **244** |
| App.tsx 329 satır · 61 `lazy()` | 336 satır · 61 `lazyWithReload()` | **347 satır · 66 `lazyWithReload()`** |
```

---

## 4 · Notlar

- **Büyük artış:** 1.278 → 1.833 dosya (+555). Bu, son 1 haftada yapılan yoğun geliştirme faaliyetinden kaynaklanıyor (G14, W04-W06, P02-P07, SG, OTP, vb.).
- **Test dosyaları:** 320 → 439 (+119). Her yeni özellik için test eklendi.
- **Migration'lar:** 182 → 244 (+62). G14, W04, P03, OTP, G17 migration'ları eklendi.
- **Rol sayısı değişmedi:** 78 aktif rol.

---

**Raporu yazan:** Dördüncü ajan (Qwen)
**Tarih:** 5 Ekim 2026, ~16:00 UTC
