# Document Inventory

Taranan kapsam: root, `docs/`, `docu/` ve repo icindeki proje-belgesi niteligindeki dosyalar. `node_modules/`, `dist/`, `.git/`, `.kilo/`, `.omc/`, `playwright-mcp/` ve `ref/global-network-bridge/` altindaki ucuncu taraf / referans agaclari reorganizasyon disi birakildi.

| Mevcut dosya yolu | Onerilen kategori | Guncellik durumu | Referans sayisi | Islem | Gerekce | Yeni konum | Risk |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| `README.md` | guide | active | 1 | keep | Root giris dokumani olarak kalmali | `README.md` | Low |
| `cleancode.md` | guide | active | 0 | keep | Bu cleanup calismasinin aktif gorev spesifikasyonu | `cleancode.md` | Low |
| `anket.md` | module | active | 0 | move | Aktif anket/Surveys teknik dokumani | `docs/modules/surveys/anket.md` | Low |
| `survey.md` | module | active | 0 | move | Anket modulu icin ikinci teknik belge | `docs/modules/surveys/survey.md` | Low |
| `cadde.md` | module | active | 2+ | move | Cadde MVP teknik dokumani | `docs/modules/cadde/cadde.md` | Low |
| `caddePLAN.md` | history | historical | 0 | move | Tamamlanmis uygulama plani | `docs/history/completed-plans/caddePLAN.md` | Low |
| `profil.md` | module | active | 0 | move | Profil ve yetki sistemi ana teknik dokumani | `docs/modules/profiles/profil.md` | Low |
| `rolesgo.md` | module | active | 1 | move | Roles/attributes/features mimarisini tanimliyor | `docs/modules/rolesgo/rolesgo.md` | Low |
| `v2.md` | module | active | 1 | move | New Member System teknik devam belgesi | `docs/modules/new-member/v2.md` | Low |
| `dosyalardatabase.md` | operations | active | 2 | move | Resource import standardi operasyonel database rehberi | `docs/operations/database/dosyalardatabase.md` | Low |
| `today.md` | history | historical | 0 | move | Tarihli durum raporu | `docs/history/status-reports/today-2026-05-15.md` | Low |
| `last.md` | history | historical | 0 | move | Gecmis commit ozeti; aktif rehber degil | `docs/history/status-reports/last-50-changes.md` | Low |
| `revizyon.pdf` | inbox-review | uncertain | 0 | move | PDF icerigi ve guncelligi teyit edilmedi; root'ta kalmamali | `docs/inbox-review/revizyon.pdf` | Medium |
| `docs/PROJECT_TECHNICAL_OVERVIEW.md` | architecture | active | 1 | move | Guncel teknik genel bakis | `docs/architecture/PROJECT_TECHNICAL_OVERVIEW.md` | Low |
| `docs/auth-login-durumu-2026-05-24.md` | history | historical | 0 | move | Tarihli auth durum notu | `docs/history/status-reports/auth-login-durumu-2026-05-24.md` | Low |
| `docs/commercial-contributor-structure.md` | module | active | 0 | move | Commercial sayfa yapisini acikliyor | `docs/modules/commercial/commercial-contributor-structure.md` | Low |
| `docs/marquee-haber-akisi.md` | module | active | 0 | move | Marquee akisi icin guncel modul dokumani | `docs/modules/marquee/marquee-haber-akisi.md` | Low |
| `docs/new-member-system-login-roller-featurelar.md` | module | active | 1 | move | New Member System teknik modulu | `docs/modules/new-member/new-member-system-login-roller-featurelar.md` | Low |
| `docs/new-member-system-son-durum-cok-basit.md` | module | active | 0 | move | New Member System'in aktif isleyisini ozetliyor | `docs/modules/new-member/new-member-system-son-durum-cok-basit.md` | Low |
| `docs/rolesgo-mvp-kullanim-klavuzu.md` | guide | active | 0 | move | Gunluk operasyon rehberi | `docs/guides/rolesgo-mvp-kullanim-klavuzu.md` | Low |
| `docs/workspace-resources-admin-kullanim-rehberi.md` | guide | active | 0 | move | Admin workspace kaynak rehberi | `docs/guides/workspace-resources-admin-kullanim-rehberi.md` | Low |
| `docs/member-system-v2-registry.json` | module | active | 0 | move | New Member System registry referansi | `docs/modules/new-member/member-system-v2-registry.json` | Low |
| `docs/cleanup/ARCHIVED_FILES.md` | history | historical | 0 | move | Onceki cleanup raporu | `docs/history/cleanup-reports/ARCHIVED_FILES.md` | Low |
| `docs/cleanup/CLEAN_CODE_SECURITY_REPORT.md` | history | historical | 0 | move | Onceki cleanup/security sonucu | `docs/history/cleanup-reports/CLEAN_CODE_SECURITY_REPORT.md` | Low |
| `docs/cleanup/GITIGNORE_REVIEW.md` | history | historical | 0 | move | Onceki cleanup yan raporu | `docs/history/cleanup-reports/GITIGNORE_REVIEW.md` | Low |
| `docs/cleanup/SECRET_SCAN_REPORT.md` | history | historical | 0 | move | Onceki secret scan raporu | `docs/history/cleanup-reports/SECRET_SCAN_REPORT.md` | Low |
| `docu/reference/tech.md` | architecture | active | 0 | move | Aktif mimari ve deploy baglami iceriyor | `docs/architecture/CORTEQS_LANDING_TEKNIK_DOKUMANTASYON.md` | Low |
| `docu/reference/anket-user-guide.md` | guide | active | 0 | move | Anket modulu kullanim kilavuzu | `docs/guides/anket-user-guide.md` | Low |
| `docu/reference/corteqs-seo-geo-plan-v2.md` | history | historical | 0 | move | Tarihli SEO/GEO plan dokumani | `docs/history/completed-plans/corteqs-seo-geo-plan-v2.md` | Low |
| `docu/reference/membercount.md` | history | historical | 0 | move | Tamamlanmis UI degisiklik plani | `docs/history/completed-plans/membercount.md` | Low |
| `docu/archive/benioku_dmchange.md` | history | historical | 0 | move | Gecmis migration/env degisiklik notu | `docs/history/status-reports/benioku_dmchange.md` | Low |
| `docu/archive/secret_ignore.md` | history | historical | 0 | move | Bos/eskimis not; tarihsel olarak saklandi | `docs/history/deprecated/secret_ignore.md` | Low |
| `docu/notes/commit.md` | history | historical | 0 | move | Tamamlanmis uygulama notu | `docs/history/completed-plans/commit.md` | Low |
| `docu/notes/remiks.md` | history | historical | 0 | move | Tamamlanmis frontend remix ozeti | `docs/history/completed-plans/remiks.md` | Low |
| `docu/info-influencer-partner.html/**` | inbox-review | uncertain | 0 | keep | HTML + asset + DOCX paketi; build/distribution baglami belirsiz | Yerinde birakildi | Medium |
| `docu/info-strategic-partner.html/**` | inbox-review | uncertain | 0 | keep | HTML + asset + DOCX paketi; build/distribution baglami belirsiz | Yerinde birakildi | Medium |
| `docu/reference/images/**` | inbox-review | uncertain | 0 | keep | Referans gorsellerin aktif kullanim durumu net degil | Yerinde birakildi | Medium |
