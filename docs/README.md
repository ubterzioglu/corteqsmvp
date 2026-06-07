# CorteQS Documentation Index

Bu klasor, aktif teknik dokumani, modul belgelerini, operasyon notlarini ve gecmis raporlari tek yerde toplar.

## Klasor Sozlugu

| Klasor | Icerik |
|--------|--------|
| `architecture/` | Guncel sistem mimarisi, teknik genel bakis, schema audit ve runtime davranislari |
| `modules/` | Belirli urun/modul belgeleri |
| `operations/` | Deploy, database, security ve release odakli operasyon rehberleri |
| `guides/` | Gunluk kullanim ve admin/developer rehberleri |
| `plans/` | Aktif ve tamamlanmamis uygulama planlari (kok dizinden tasindi) |
| `decisions/` | Teknik kararlar ve ADR'lar icin ayrilmis alan |
| `cleanup/2026-05-30/` | Cleanup calismasinin baseline, envanter, manifest ve validation ciktisi |
| `history/` | Tamamlanmis planlar, durum raporlari ve onceki cleanup ciktisi |
| `assets/` | Gorseller, HTML rapor dosyalari ve diger binary varliklar |
| `superpowers/` | Agent tarafindan olusturulan planlar ve spec'ler |
| `archive/` | Emekliye ayrilmis, artik kullanilmayan belgeler |
| `inbox-review/` | Guncelligi veya siniflandirmasi kesinlestirilemeyen dosyalar |

## Agent Context (buradan başla)

- [AGENT_CONTEXT.md](AGENT_CONTEXT.md) — Yeni oturum için tek dosya özet: stack, auth, veri katmanı, kritik dosyalar, kısıtlamalar (13 KB, ~365 satır)

## Aktif Mimari Belgeler

- [architecture/PROJECT_TECHNICAL_OVERVIEW.md](architecture/PROJECT_TECHNICAL_OVERVIEW.md)
- [architecture/CORTEQS_LANDING_TEKNIK_DOKUMANTASYON.md](architecture/CORTEQS_LANDING_TEKNIK_DOKUMANTASYON.md)
- [architecture/CORTEQS_LANDING_TEKNIK_DOKUMANTASYON_2026-05-30.md](architecture/CORTEQS_LANDING_TEKNIK_DOKUMANTASYON_2026-05-30.md)
- [architecture/SISTEM_MIMARI.md](architecture/SISTEM_MIMARI.md)
- [architecture/catalog-ai-search-contract.md](architecture/catalog-ai-search-contract.md)
- [architecture/catalog-schema-audit-2026-06-04.md](architecture/catalog-schema-audit-2026-06-04.md)
- [architecture/mainplan-discovery-report-2026-06-04.md](architecture/mainplan-discovery-report-2026-06-04.md)
- [architecture/simplification-inventory-report.md](architecture/simplification-inventory-report.md)

## Aktif Planlar

- [plans/mainplan.md](plans/mainplan.md) — Birlesik auth, profil, rol ve attribute yonetimi
- [plans/platform-rolleri.md](plans/platform-rolleri.md) — Platform rol tanimlari
- [plans/AFS_new.md](plans/AFS_new.md) — Catalog Item Role Sistemi yeni mimarisi
- [plans/AFS_new_2.md](plans/AFS_new_2.md) — Unified Catalog + Users Admin View
- [plans/AFS_Done.md](plans/AFS_Done.md) — Bridge stratejisi implementasyon plani
- [plans/corteqs_codex_taxonomy_retirement_and_admin_simplification_plan.md](plans/corteqs_codex_taxonomy_retirement_and_admin_simplification_plan.md)
- [plans/corteqs_codex_unified_catalog_role_owner_search_final_plan.md](plans/corteqs_codex_unified_catalog_role_owner_search_final_plan.md)
- [plans/cleancode.md](plans/cleancode.md)
- [plans/AFS_hadi.md](plans/AFS_hadi.md)

## Modul Belgeleri

- [modules/surveys/anket.md](modules/surveys/anket.md)
- [modules/surveys/survey.md](modules/surveys/survey.md)
- [modules/cadde/cadde.md](modules/cadde/cadde.md)
- [modules/profiles/profil.md](modules/profiles/profil.md)
- [modules/rolesgo/rolesgo.md](modules/rolesgo/rolesgo.md)
- [modules/new-member/new-member-system-login-roller-featurelar.md](modules/new-member/new-member-system-login-roller-featurelar.md)
- [modules/new-member/new-member-system-son-durum-cok-basit.md](modules/new-member/new-member-system-son-durum-cok-basit.md)
- [modules/new-member/v2.md](modules/new-member/v2.md)
- [modules/commercial/commercial-contributor-structure.md](modules/commercial/commercial-contributor-structure.md)
- [modules/marquee/marquee-haber-akisi.md](modules/marquee/marquee-haber-akisi.md)

## Operasyon ve Kullanim Rehberleri

- [operations/database/dosyalardatabase.md](operations/database/dosyalardatabase.md)
- [guides/anket-user-guide.md](guides/anket-user-guide.md)
- [guides/rolesgo-mvp-kullanim-klavuzu.md](guides/rolesgo-mvp-kullanim-klavuzu.md)
- [guides/topluluk-yonetimi-kullanma-klavuzu.md](guides/topluluk-yonetimi-kullanma-klavuzu.md)
- [guides/workspace-resources-admin-kullanim-rehberi.md](guides/workspace-resources-admin-kullanim-rehberi.md)
- [guides/katalog-items-roller-features-iliskisi.md](guides/katalog-items-roller-features-iliskisi.md)
- [guides/kategori-rol-feature-yapisi.md](guides/kategori-rol-feature-yapisi.md)
- [guides/catalog-supabase-js-queries.md](guides/catalog-supabase-js-queries.md)

## History

`history/` altinda tarihsel degeri olan ama aktif referans noktasi olmayan planlar, cleanup raporlari ve durum notlari tutulur.

- [history/status-reports/](history/status-reports/) — Teknik durum belgeleri (tarih damgali)
- [history/completed-plans/](history/completed-plans/) — Tamamlanmis planlar
- [history/cleanup-reports/](history/cleanup-reports/) — Guvenlik ve kod temizligi raporlari
- [history/deprecated/](history/deprecated/) — Gecersiz hale gelmis belgeler

## Assets

`assets/` altinda gorseller, HTML rapor dosyalari ve diger binary varliklar tutulur. Kaynak kod veya deployment pipeline'i tarafindan kullanilmayan dosyalar buradadir.

## Yeni Dokuman Ekleme Kurallari

- Kok dizine veya `docs/` kokuне MD dosyasi koymayın — uygun alt klasoru kullanin.
- Aktif bir plan → `plans/`
- Modul belgesi → `modules/<modul-adi>/`
- Operasyonel runbook → `operations/` ya da `guides/`
- Tarihsel rapor → `history/`
- Gorsel veya HTML → `assets/`
- Guncelligi belirsiz → `inbox-review/`
- Isimlendirmede mevcut domain dilini koruyun (Turkish domain terms).
