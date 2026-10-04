# Kapanan iş dokümanları — 30 Eylül 2026

Buradaki dosyalar **silinmedi, donduruldu** (`git mv`, geçmiş kesintisiz:
`git log --follow <dosya>`). Anlattıkları iş ya tamamlandı ya da
`docs/kalanlar/KALANLAR.md` master'ının devraldığı eski turların
devir notu / plan / durum raporu kalıntıları.

## Taşıma ölçütü (2026-09-20 dalgasıyla aynı)

1. **Depoda hiçbir canlı dosyadan atıf almıyor.** Tarama kapsamı: `git ls-files`
   içindeki tüm `.md/.ts/.tsx/.mjs/.js/.json/.html/.txt` (arşiv ve referans
   klasörleri hariç). İki tur ölçüldü: ilk turda atıf alan adaylar listeden
   çıkarıldı, ikinci turda kalan 33 dosyanın **0 atıf aldığı** doğrulandı.
2. **Anlattığı iş bitti ya da aşıldı** — güncel durum tek kaynak olarak
   `docs/kalanlar/KALANLAR.md` + `CLAUDE.md` + `docs/ARCHITECTURE.md`'de.

## Ölçüt sağlanmadığı için taşınMAYANlar (ezberleme, teyit et)

| Dosya | Neden kaldı |
|---|---|
| `docs/handover/2026-09-13-buyuk-dosya-temizligi.md` | `src/lib/admin-shell/admin-updates/2026-09.ts` + testi yola atıf yapıyor |
| `docs/notes/2026-09-13-komuta-merkezi-iptal-edilenler.md` | Aynı — admin güncelleme içeriği ve test kilitli |
| `docs/handover/2026-09-09-devir-notu.md` · `2026-09-05-batch-cef-ve-canli-kusurlar.md` | Sırasıyla `2026-09-13` devir notu ve `docs/guides/2026-09-05-burak-gui-test-rehberi.html` atıf yapıyor |
| `docs/notes/2026-09-17-persembe-burak-toplantisi.md` · `2026-09-14-buraka-toplu-sorular-maili.md`* | `2026-09-09-devir-notu.md` atıf yapıyor (*09-14 dalga sonunda kaldı — bkz. aşağı) |
| `docs/status/2026-09-05-burak-onay-kuyrugu-kanit-raporu.md` | Kalan `2026-09-05-batch-cef` handover'ı atıf yapıyor |
| `docs/plans/2026-09-05-rol-etiket-mimarisi-karar-notu.md` · `2026-09-07-kalan-isler-batch-listesi.md` · `2026-09-09-hotfix-sorulari.md` | Kalan handover/devir notları atıf yapıyor |
| `docs/plans/platform-safety-core.md` | `2026-09-20-teknik-borc-dokumantasyon-plani.md` atıf yapıyor |
| `docs/plans/admin-v2/**` · `2026-06-10-admin-panel-v2-masterplan.md` | masterplan `src/` içinden atıf alıyor (2026-09-20 dalgasının notu) |
| `docs/plans/relocation-engine/**` · `service-finder/**` | `src/`, `workers/`, `supabase/functions/` yorumlarından canlı atıflar |
| `docs/plans/2026-09-20-main-plan.md` ve alt planları (final-teslim, kadro-batch, teknik-borc, uretim-kontrol, dizin-arama, public-rotalar-sitemap) | `docs/kalanlar/README.md` "Nereden geldi" bölümü atıf yapıyor |
| `docs/plans/CorteQS_MVP_Duzeltmeler_*` · `corteqs-premium-profile-experimental-2-*` · `landing_page_denemesi.md` · `profile-premium-experimental-2-pilot.md` | `docs/README.md` tarihçesi / `ARCHITECTURE.md` / `status/rapor.html` atıf yapıyor |
| `docs/kalanlar/2026-09-21-*` | Klasör README'si "ölçüm/gerekçe arşivi" olarak canlı tutuyor; `CLAUDE.md` ve `scripts/ai-knowledge/sources.mjs` atıfları var |

> *`docs/notes/2026-09-14-buraka-toplu-sorular-maili.md` bu dalgada taşındı;
> yalnız başka bir arşiv dosyası atıf yapıyordu.

## Buradaki dosyalar (orijinal klasörü parantezde)

| Dosya | Neden güncelliğini yitirdi |
|---|---|
| `2026-07-28-muhasebe-butce-sekmesi.md` (handover) | İş bitti; `superpowers/plans/2026-07-28-muhasebe-butce-sekmesi.md` + design spec'i uygulanmış |
| `2026-08-30-limit-sprint-final-handoff.md` · `2026-08-31-codex-limit-sprint-ozet.md` (handover) | Limit sprinti kapandı; A-serisi batch'leri 27–30.09'da tamamlandı (bkz. KALANLAR Kapananlar tablosu) |
| `2026-09-04-t19-profil-workshop-ve-tip-borcu.md` · `2026-09-06-olu-kod-temizligi-ve-kalan-is-envanteri.md` (handover) | T19–T22 ve ölü kod temizliği kapandı (Kapananlar: "Eski tamamlananlar") |
| `2026-09-20-kalan-isler.md` (handover) | Master `docs/kalanlar/KALANLAR.md` devraldı |
| `2026-08-30-bundle-ve-route-yukleme-raporu.md` · `cadde-acceptance.md` · `limit-sprint-baseline.md` · `member-welcome-rollout.md` · `relocation-abandonment-reminders.md` · `relocation-report-location.md` (status) | 30.08 durum anlık görüntüleri; sayılar 30.09 ölçüm tabanıyla aşıldı |
| `AFS_Done.md` · `AFS_hadi.md` · `AFS_new.md` · `AFS_new_2.md` · `mainplan.md` · `corteqs_codex_*` (plans) | AFS/catalog rebuild Haziran'da kapandı (`docs/catalog-role-afs-rebuild/` kapanış raporları canlı) |
| `CorteQS_Radar_Admin_Onayli_Haber_Pipeline_E2E_AI_Agent.md` (plans) | Radar pipeline kuruldu ve A99-R2 ile 30.09'da canlı doğrulandı; güncel operasyon bilgisi KALANLAR + `docs/modules/radar/`'da |
| `experimental-3-kullanici-bilgilendirme-wa.md` · `platform-rolleri.md` (plans) | Uygulanmış/aşılmış erken dönem planları; canlı rol şeması `CLAUDE.md` "Canonical schema"da |
| `2026-08-02-command-center-summary7-9-devir.md` · `2026-08-02-tools-hub-redesign-devir.md` · `2026-08-03-0028-tools-hub-space-handover.md` (plans) | Tools hub ve komuta merkezi devirleri; Komuta Merkezi sunucu sıralaması A08b/c/d ile 29.09'da kapandı |
| `2026-08-04-cadde-canli-feed-plan.md` · `2026-08-30-cadde-workshop-backlog.md` (plans) | Cadde canlı feed yayında; workshop backlog'u T19–T22 çıktıklarıyla kapandı |
| `2026-08-30-decision-epics.md` · `2026-08-30-komuta-merkezi-gorev-denetimi.md` (plans) | Karar epikleri K01–K08 olarak güncel master'da; görev denetimi 28.09'da yapıldı (18 MD + 18 panel düzeltmesi) |
| `2026-09-06-kalan-isler-10dk-batch-plani.md` (plans) | 10 dk batch planı uygulandı; kalan işler master'da |
| `2026-09-20-relocation-kalan-isler.md` (plans) | Relocation'ın açık kalanları master'ın X bölümünde (RAG/demo içerik kararı Burak'ta) |
| `2026-09-25-profil-cadde-kampanya-ve-canli-hata-duzeltmeleri.md` (plans) | 25.09 canlı hata düzeltmeleri 28–29.09 batch'lerinde kapandı |

## Kalıcı dersler nereye taşındı?

Bu dokümanların içindeki **hâlâ geçerli operasyon bilgisi** tek dosyada toplandı:
[`docs/operations/2026-09-30-kalici-operasyon-dersleri.md`](../../operations/2026-09-30-kalici-operasyon-dersleri.md)
(deploy, DB erişimi, secret yönetimi, bilinen tuzaklar). Geçmiş gerekçeler için
dosyalar burada donduruldu; geri döndürmek tek `git mv`.
