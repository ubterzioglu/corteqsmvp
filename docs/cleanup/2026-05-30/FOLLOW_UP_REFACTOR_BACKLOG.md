# Follow-up Refactor Backlog

| ID | Oncelik | Alan | Dosya veya Modul | Sorun | Risk | Onerilen Sonraki PR | Not |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B-001 | P0 | Security | Runtime env / local secrets | Onceki secret scan raporunda `VITE_ADMIN_PASSWORD` ve diger hassas degerlerin local env'de bulundugu goruluyor | High | Secret hygiene ve env ownership review | Bu cleanup pasinda secret rotasyonu yapilmadi |
| B-002 | P0 | Security | `/api/chat` proxy ve server-only env | `RAG_API_SECRET` korunuyor ama server/runtime akisinin ADR seviyesinde tek yerde belgelenmesi gerekiyor | Medium | Server-only env boundary review | Uygulama davranisi bu passta degistirilmedi |
| B-003 | P1 | Architecture | `src/App.tsx` | Buyuk route tablosu modul bazli ayrismamis | Medium | Route registration refactor | Bu gorevde dokunulmadi |
| B-004 | P1 | Architecture | Supabase erisim katmani | `supabase.from()` cagri stili ile wrapper/hook kullanimlari karisik | Medium | Canonical Supabase access strategy PR | Query key ve error handling ile birlikte ele alinmali |
| B-005 | P1 | Architecture | Profile / RolesGo / New Member | Paralel profil sistemleri ve role/feature akislari birlikte yasiyor | High | Canonical profile system decision ADR | Tablo veya route kaldirma bu passta yapilmadi |
| B-006 | P1 | Performance | Build chunking | `build` ciktisinda buyuk chunk uyarilari ve static/dynamic import karisimi var | Medium | Lazy loading ve chunk strategy PR | `vite.config.ts` bu passta korunmustur |
| B-007 | P2 | Type Safety | `tsconfig`, `src/lib/admin.ts`, `src/pages/admin/*` | `strict` kapali, ana repoda da yaygin `any` kullanimi var | Medium | Controlled `no-explicit-any` reduction PR | `ref/global-network-bridge/**` ayrica ele alinmali |
| B-008 | P2 | Type Safety | `import-resources.ts` | Root'taki eski import scriptinde `any` kullanimlari ve lint hatasi var | Low | Script modernizasyonu veya emeklilik karari | Bu passta arşivlenmedi |
| B-009 | P3 | Testing | `May19*`, `FooterSection`, `AdminHomePage` | Baseline testler kirik; UI beklentileri drift olmus | Medium | Failing test stabilization PR | Cleanup bu davranislari degistirmedi |
| B-010 | P3 | Testing | E2E coverage | Admin login, public submission, survey response, muhasebe, referral ve profile approval akislari eksik veya parcali | Medium | Critical smoke E2E paketi | `cleancode.md` kabul kriterleriyle uyumlu |
| B-011 | P4 | Documentation | `docu/info-*.html/**`, `docu/reference/images/**` | Legacy dokuman paketleri ve gorsel bundle'larin sahipligi/guncelligi net degil | Medium | Legacy docs ownership cleanup PR | Bu passta yalniz raporlandi |
| B-012 | P4 | Documentation | Cleanup / architecture decisions | Route, auth, profile ve deploy kararlarinin bir kismi plan belgelerinde daginik durumda | Low | ADR extraction PR | `docs/decisions/` klasoru simdilik bos ayrildi |
