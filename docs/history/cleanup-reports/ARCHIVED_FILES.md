# Archived Files Report

**Tarih:** 2026-05-15
**Hedef:** `_archive/cleanup-2026-05-15/`

---

## Arşivlenen Dosyalar

| # | Dosya | Sebep | Referans |
|---|-------|-------|----------|
| 1 | `vite-dev.err.log` | Geliştirme log çıktısı, kaynak kodda referans yok | Yok |
| 2 | `vite-dev.log` | Geliştirme log çıktısı, kaynak kodda referans yok | Yok |
| 3 | `hata.txt` | Hata kayıt dosyası, kaynak kodda referans yok | Yok |
| 4 | `muh.xlsx` | Yerel Excel dosyası, kaynak kodda referans yok | Yok |
| 5 | `glm5.md` | Agent prompt dosyası (çalışma tamamlandı), kaynak kodda referans yok | Yok |
| 6 | `guide.md` | Dokümantasyon, kaynak kodda referans yok | Yok |
| 7 | `SECURITY_AUDIT_REPORT.md` | Eski güvenlik raporu, root'ta olmamalı | Yok |
| 8 | `SECURITY_FIX_PLAN.md` | Eski güvenlik planı, root'ta olmamalı | Yok |
| 9 | `playwright-fixture.ts` | Test fixture kök dizinde, kaynak kodda referans yok | Yok |
| 10 | `corteqs_influencer_davet.html` | Bağımsız davet HTML şablonu, Vite build'de kullanılmıyor | Yok |
| 11 | `mail-davet-influencer.html` | Bağımsız mail davet şablonu, Vite build'de kullanılmıyor | Yok |
| 12 | `maskot.png` | Kök dizindeki görsel, kaynak kodda import yok (info-*.html CDN kullanıyor) | Yok |
| 13 | `home-header.png` | Kök dizindeki görsel, hiçbir kaynak dosyada referans yok | Yok |
| 14 | `about-with-header.png` | Kök dizindeki görsel, hiçbir kaynak dosyada referans yok | Yok |
| 15 | `founding1000-with-header.png` | Kök dizindeki görsel, hiçbir kaynak dosyada referans yok | Yok |
| 16 | `may19-header-close.png` | Kök dizindeki görsel, hiçbir kaynak dosyada referans yok | Yok |
| 17 | `may19-header.png` | Kök dizindeki görsel, hiçbir kaynak dosyada referans yok | Yok |
| 18 | `may19-with-shared-header.png` | Kök dizindeki görsel, hiçbir kaynak dosyada referans yok | Yok |
| 19 | `newera.png` | Kök dizindeki görsel, hiçbir kaynak dosyada referans yok | Yok |
| 20 | `vidbg.mp4` | Kök dizindeki video, hiçbir kaynak dosyada referans yok | Yok |
| 21 | `sharedx/maillogo.png` | `public/sharedx/maillogo.png` kopyası, duplicate | `public/` altında mevcut |

---

## Arşivlenmeyen Dosyalar (Neden Arşivlenmedi)

| Dosya | Sebep |
|-------|-------|
| `info-ambassador.html` | `vite.config.ts:26` build plugin tarafından kullanılıyor |
| `info-community-leader.html` | `vite.config.ts:22` build plugin tarafından kullanılıyor |
| `info-contributor.html` | `vite.config.ts:10` build plugin tarafından kullanılıyor |
| `info-influencer-partner.html` | `vite.config.ts:14` build plugin tarafından kullanılıyor |
| `info-strategic-partner.html` | `vite.config.ts:18` build plugin tarafından kullanılıyor |
| `lansman/index.html` | `vite.config.ts:71` rollup input entry point |
| `0logomail.png` | 3 dosyada import ediliyor (FormPage, SiteHeader, AIFormPage) |
| `logo.png` | 3 dosyada import ediliyor (AdminLayout, HeroSection, LansmanPage) |
| `maskotanasayfa.png` | 2 dosyada import ediliyor (NotFound, SEOContentSection) |
| `burak.png` | 2 dosyada import ediliyor (FoundersPage, CommandCenterManager) |
| `denemeremake.png` | HeroSection'da import ediliyor |
| `foundersicinlogo.png` | FoundersPage'de import ediliyor |
| `ubt.png` | 2 dosyada import ediliyor (FoundersPage, CommandCenterManager) |
| `yeniinffffffff.png` | LansmanPage'de import ediliyor |
