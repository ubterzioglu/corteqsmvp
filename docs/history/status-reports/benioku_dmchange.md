# Benioku DM Change Log

## 2026-04-06

Supabase baglantisi eski proje `nhvbikijjkymkcldgznv` uzerinden yeni proje `injprdrsklkxgnaiixzh` ref'ine tasindi.

Degisen env degiskenleri:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Uygulama davranisi:

- Frontend, `src/integrations/supabase/client.ts` icinde sadece `VITE_SUPABASE_URL` ve `VITE_SUPABASE_PUBLISHABLE_KEY` kullanmaya devam eder
- `SUPABASE_SERVICE_ROLE_KEY` sadece server-side/local secret olarak tutulur ve `VITE_` prefix'i ile expose edilmez

Guncellenen dosyalar:

- `.env.local`
- `README.md`
- `docu/reference/database-info.md`
- `supabase/config.toml`

Deploy sonrasi kontrol notlari:

- Coolify veya diger runtime ortamlarinda `VITE_SUPABASE_PROJECT_ID=injprdrsklkxgnaiixzh` oldugu dogrulanmali
- Runtime `VITE_SUPABASE_URL` degeri `https://injprdrsklkxgnaiixzh.supabase.co` olmali
- Yeni anon key ve service role key placeholder yerine gercek secret degerlerle degistirilmeli
