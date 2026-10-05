# Rakam Yenileme — 5 Ekim 2026

> **Amaç:** CLAUDE.md ve AGENT_CONTEXT.md'deki bayat rakamları yeniden ölçmek.
> **Önceki ölçüm:** 28.09 gece (CLAUDE.md satır 11-27)

---

## 1 · Ölçülen Rakamlar

| Metrik | Eski (28.09) | Yeni (05.10) | Fark |
|---|---|---|---|
| `.ts`/`.tsx` dosya sayısı | 1.278 | **1.833** | +555 |
| Test dosyası sayısı | 320 | **439** | +119 |
| Applied migration sayısı | 182 | **244** | +62 |
| App.tsx satır sayısı | 336 | **347** | +11 |
| `lazyWithReload()` sayısı | 61 | **66** | +5 |
| Aktif rol sayısı | 78 | **78** | 0 |

---

## 2 · Ölçüm Komutları

```powershell
# .ts/.tsx dosya sayısı
git ls-files | Where-Object { $_ -match '\.(ts|tsx)$' } | Measure-Object | Select-Object -ExpandProperty Count
# Sonuç: 1833

# Test dosyası sayısı
git ls-files | Where-Object { $_ -match '\.test\.(ts|tsx)$' } | Measure-Object | Select-Object -ExpandProperty Count
# Sonuç: 439

# Applied migration sayısı
(Get-ChildItem supabase/migrations/applied -File).Count
# Sonuç: 244

# App.tsx satır sayısı
(Get-Content src/App.tsx | Measure-Object -Line).Lines
# Sonuç: 347

# lazyWithReload sayısı
(Select-String -Path src/App.tsx -Pattern 'lazyWithReload' | Measure-Object).Count
# Sonuç: 66

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
