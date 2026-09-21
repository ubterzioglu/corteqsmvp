# Final Doğrulama ve Teslim Planı

### Batch 0 — Proje doğrulama

```powershell
npm run test
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npm run verify:text
npm run ingest:tools:check
npm run check:migrations
```

**Çıkış:** Tüm proje kontrolleri yeşil.

### Batch 1 — Tarayıcı QA
- Etkinlik, relocation, public rota, dizin ve ChatBot akışlarını test et.
- CSP/runtime hatalarını kontrol et.
**Çıkış:** Kritik akışlar tarayıcıda çalışıyor.

### Batch 2 — Commit hazırlığı
- Açık pathspec ile stage et.
- `git diff --cached --name-status` ile index’i kontrol et.
**Çıkış:** İlgisiz dosya staged değil.

### Batch 3 — Commit ve push
- Conventional commit oluştur.
- Kullanıcı onayıyla `main` branch’ine push et.
**Çıkış:** Değişiklikler remote’a taşındı.

### Batch 4 — Coolify sonrası kontrol
- Deploy sonrası `verify:release` çalıştır.
- Header/CSP ve smoke testlerini tekrarla.
**Final çıkış:** Özellikler üretimde doğrulanmış ve tüm kontroller yeşil.
