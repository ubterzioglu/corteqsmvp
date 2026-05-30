# Baseline Results

Tarih: `2026-05-30`
Branch: `main`

## Baslangic Gozlemleri

- `git status --short` komutu global git ignore dosyasina erisim icin permission warning uretse de repo ici beklenmeyen degisiklik gostermedi.
- Root seviyesinde `README.md` disinda cok sayida calisma dokumani bulunuyordu.
- `docs/` ve `docu/` birlikte kullanildigi icin dokumantasyon iki farkli agaca dagilmisti.
- `scripts/` altinda 3 aktif script, root seviyede ise 3 yardimci script bulunuyordu.

## Baslangic Komut Sonuclari

| Komut | Durum | Ozet |
| --- | --- | --- |
| `git branch --show-current` | OK | `main` |
| `git status --short` | Warning | Global git ignore erisim warning'i var; repo ici kirik durum tespit edilmedi |
| `npm run lint` | Failed | `326` problem (`281` error, `45` warning); hatalarin buyuk kismi `ref/global-network-bridge/**`, kalanlari `src/**` ve `import-resources.ts` |
| `npm run test` | Failed | Mevcut test kumesinde gorunen kirik senaryolar: `FooterSection.test.tsx`, `May19MapPage.test.tsx`, `May19CampaignPage.test.tsx`, `AdminHomePage.test.tsx` |
| `npm run build` | OK | Production build basarili; buyuk chunk ve `supabase/client.ts` dynamic/static import uyarilari var |
| `npm run verify:release` | OK | Local `dist/` paketi tutarli gorundu |

## Baslangicta Mevcut Olan Hatalar

- ESLint kapsaminda `ref/global-network-bridge/**` agacinda yogun `no-explicit-any`, `no-empty`, hook ve refresh uyarilari var.
- Ana repo tarafinda da `src/hooks/useCurrentUserDashboard.ts`, `src/lib/admin.ts`, `src/lib/member-profile-api.ts`, `src/pages/admin/*` ve benzeri dosyalarda `no-explicit-any` hatalari var.
- Test kiriklari cleanup disi mevcut UI/test beklenti uyumsuzluklarindan geliyor; bu passta davranis degisikligi yapilmadi.

## Baslangic Kapsam Siniri

Asagidaki alanlar bu cleanup'ta degistirilmemek uzere sadece gozlemlendi:

- `server.mjs`
- `vite.config.ts`
- `src/main.tsx`
- `src/components/auth/AuthProvider.tsx`
- `src/integrations/supabase/client.ts`
- `src/App.tsx`
- `supabase/migrations/**`
- `src/components/ui/**`
