# 31 Ağustos Codex Limit Sprinti — Başlangıç Durumu

**Dal:** `codex/limit-sprint-2026-08-30`  
**Başlangıç commit'i:** `167c98f`  
**Kayıt zamanı:** 2026-08-30

## Kalite kapıları

| Kontrol | Sonuç | Not |
|---|---|---|
| `npm test` | Geçti | 226 dosya, 1.611 test |
| `npx tsc --noEmit` | Geçti | Tip hatası yok |
| `npm run build` | Geçti | 4.792 modül; üç büyük chunk uyarısı var |
| `npm run check:migrations` | Geçti | 364 dosya / 364 canlı ledger kaydı |
| `npm run check:drift` | Kaldı | Edge Function ve worker `supabase-js` pinleri frontend'den eski |

## Bilinen başlangıç borçları

- `main` yaklaşık 1.076 KB, `AdminSocialShareVaultPage` yaklaşık 1.018 KB ve
  `ComposedChart` yaklaşık 406 KB minified chunk üretiyor.
- Testler yeşil olmasına rağmen `act(...)`, `window.scrollTo`, Radix erişilebilirlik
  uyarıları ve eksik Cadde mock'larından kaynaklanan yoğun stderr çıktısı var.
- Komuta Merkezi'nde toplantı notlarından ayrı olarak 70'ten fazla açık todo var;
  canlı kanıt olmadan hiçbir görev tamamlandı olarak işaretlenmeyecek.

## Korunan kullanıcı çalışmaları

- `docs/status/mevcut-profil-yapisi-raporu-2026-08-20-sade-anlatim.html` bu sprintte
  değiştirilmeyecek veya commit'e alınmayacak.
- `docs/marketing/2026-08-30-tools-whatsapp-post.md` mevcut kullanıcı taslağı olarak
  korunacak; B1 sırasında yalnız doğrulanmış eklemelerle tamamlanacak.

