# Claude Code'a verilecek talimat

Paketi repo köküne `corteqs-ekstre-motoru/` olarak koy, VS Code'da Claude Code'u aç ve aşağıdakini yapıştır:

---

`corteqs-ekstre-motoru/` klasöründe kart ekstresini admin'deki Giderler'e aktaran bir motor var. Önce BARIS_ICIN_NOTLAR.md'yi, sonra README.md'yi oku ve projeye entegre et:

1. `corteqs-ekstre-motoru/supabase/**` dosyalarını projedeki `supabase/` altına taşı (migration, seed, functions/_shared/engine, functions/_shared/context.ts, statement-parse, mercury-sync). Mevcut dosyaların üzerine yazma; çakışma olursa bana sor.
2. Migration'ı mevcut şemaya göre kontrol et:
   - `public.is_admin()` imzasını bul; farklıysa migration'daki RLS politikalarını ve `commit_statement_lines` / `revert_statement_import` içindeki kontrolleri `expenses` tablosunun mevcut politikasıyla aynı yap.
   - `expenses` kolon tiplerini (`category`, `person`, `status`, `payment_method`, `currency`) kontrol et; enum ise insert'teki değerleri cast et.
   - `expenses.amount` negatif değeri kabul ediyor mu bak (iadeler negatif gelir).
3. `src/pages/admin/muhasebe/EkstreAktar.tsx` sayfasını projenin yapısına uyarla: supabase client import yolu, shadcn bileşen yolları, Giderler sayfasındaki kategori/kişi etiket sabitleri (kopyayı sil, ortak sabiti kullan). Muhasebe sekmelerine "Ekstre Aktar" ekle, route `/admin/muhasebe/ekstre`. Admin guard'ı Giderler sayfasıyla aynı olsun.
4. `supabase/config.toml`'a `[functions.mercury-sync] verify_jwt = false` ekle.
5. Testleri çalıştır: `node --experimental-strip-types --test corteqs-ekstre-motoru/tests/engine.test.ts` ve `deno check --node-modules-dir=none supabase/functions/statement-parse/index.ts supabase/functions/mercury-sync/index.ts`.
6. Yerelde `supabase start` ile migration'ı + seed'i uygula, `fixtures/drive_teknoloji_harcamalari.csv` dosyasını sayfadan yükleyip uçtan uca dene (CSV yolu yapay zekâ anahtarı gerektirmez).
7. Değişiklikleri ayrı bir branch'te commit et; deploy etmeden önce bana özet ver.

Kurallar: `expenses` tablosundaki mevcut verilere dokunma, yalnızca kolon ekle. Ekstreden gelen giderler muhasebeye her zaman USD ve gider ortağı katkısı düşülmüş (net) tutarla girer; bu davranışı değiştirme. PDF okuyucu Claude'dur (`ANTHROPIC_API_KEY`). Motor dosyalarında (`_shared/engine`) davranış değiştirirsen testleri de güncelle.

---
