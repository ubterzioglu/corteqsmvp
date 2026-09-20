# Güncelliğini yitirmiş dokümanlar — 20 Eylül 2026

Buradaki dosyalar **silinmedi, donduruldu.** Anlattıkları iş ya tamamlandı ya da
başka bir çözümle aşıldı; ama *neden* öyle yapıldığını taşıdıkları için
saklanıyorlar (bu depoda RLS ve rol sistemi birkaç kez sıfırlandı — eski planlar
o kararların tek kaydı).

## Buraya taşıma ölçütü

Bir dosya buraya **yalnız iki koşul birlikte** sağlandığında taşındı:

1. **Depoda hiçbir yerden atıf almıyor.** `CLAUDE.md`, `README.md`, `docs/**`,
   `scripts/**`, `src/**` tarandı, sonuç **0 atıf**.
2. **Anlattığı iş bitti ya da aşıldı** ve bunu `CLAUDE.md` belgeliyor.

Ölçüt sağlanmadığı için **taşınMAYAN** dosyalar (ezberlemek yerine teyit et):

| Dosya | Neden kaldı |
|---|---|
| `docs/plans/2026-06-10-admin-panel-v2-masterplan.md` | **7 atıf**, ikisi `src/` içinden (`useAdminAccess.ts`, `admin-shell-types.ts`) |
| `docs/plans/2026-08-04-modernization-plan.md` | `CLAUDE.md` doğrudan atıf yapıyor |
| `docs/refactor/2026-06-09-refactor-backlog.md` | `CLAUDE.md` "B1–B10" yol haritası olarak gösteriyor |
| `docs/status/burakubtstatus.html` · `docs/status/rapor.html` | `CLAUDE.md` + `docs/README.md` indeksinde |
| `docs/10tool/**` | **33 atıf** — canlı araçların referansı |
| `docs/proref/**` | Kod YORUMLARINDAN anılıyor (`ProfilePage.tsx:716`, `PremiumProfileTabs.tsx:62`) |
| `docs/status/mevcut-profil-yapisi-raporu-2026-08-20*.html` | 6 atıf (devir notları + kalan iş listeleri) |

## Buradaki dosyalar

| Dosya | Tarih | Neden güncelliğini yitirdi |
|---|---|---|
| `2026-06-09-legacy-user-roles-removal.md` | 2026-06-09 | Dosyanın kendi durumu "uygulama aşamasında" diyor; iş **bitti**. `user_roles` / `app_role` / `has_role` düşürüldü, tek kaynak `user_role_assignments` (bkz. CLAUDE.md "Canonical schema" — `profiles`, `user_profiles`, `admin_users` DROPPED). |
| `2026-06-06-admin-menu-refactor.md` | 2026-06-06 | Durumu üç buçuk aydır "ONAY BEKLİYOR"da kalmış; bu arada admin gezinme ağacı **başka biçimde** yeniden kuruldu — `admin-navigation-registry.ts` 849 satırdan 13 gruplu dizine bölündü (CLAUDE.md md.7, 2026-09-13). Plan artık mevcut yapıyı anlatmıyor. |
| `2026-06-06-directory-improvements.md` | 2026-06-06 | Dizin arama/filtre refaktörü planı. Aradan `DirectoryFilters`, `DirectorySearchBar`, `directory-grouping.ts` geldi; 2026-09-20'de İşletmeler/Uzmanlar/Şehir Elçileri kendi sayfalarına ayrıldı. Plandaki tek-sayfa varsayımı artık geçerli değil. |
| `2026-06-07-3plan.md` | 2026-06-07 | "Rol, feature ve attribute yönetimini sadeleştirme" taslağı. İki gün sonra **AFS yeniden kurulumu** ile fiilen uygulandı ve dokümantasyonu `docs/catalog-role-afs-rebuild/` altına taşındı (9 tablo yeniden adlandırıldı, `roles`/`afs_*` geldi). Taslak, canlı şemayı yansıtmıyor. |

## Bir dosyayı geri döndürmek gerekirse

`git mv` ile taşındılar, yani geçmiş kesintisiz: `git log --follow <dosya>` tüm
tarihçeyi gösterir. Geri almak tek komuttur, yeniden yazmak gerekmez.
