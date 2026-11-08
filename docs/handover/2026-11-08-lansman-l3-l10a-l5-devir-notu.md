# Devir notu — 1 Ocak lansmanı (9 Kasım 2026, gece sonu)

Kanonik plan: `docs/plans/2026-11-08-ocak-lansman-uygulama-plani.md`. Başındaki **durum tablosu** ve
**"L0 doğrulamasıyla gelen düzeltmeler"** tablosu batch metninden önce gelir. Kanıtlar:
`docs/audits/2026-11-08-ocak-lansman-tutarsizlik-raporu.md`. Satırlar: `docs/kalanlar/KALANLAR.md` §1.10.
Barış'ın okuyacağı sürüm (Claude Docs): https://claude.ai/artifact/UpF7j4Uu9UoTmSznSvKKDG

## 1. Durum

`main` = `origin/main`. Açık ajan, açık dal ve commit'lenmemiş iş yok. L5 worktree'si kaldırıldı.

| Batch | Durum | Commit |
|---|---|---|
| L0 plan + rapor + Docs | ✅ | `4d838900` |
| L3 güvence kapıları (regresyon testleri, ilk JS gzip bütçesi 271 KB, Lovable yasak listesi, Playwright smoke) | ✅ | `b41683e6` |
| L10a profilde Geri Bildirim + admin "REV'e taşı" | ✅ kod · ✅ migration `20261108120000` **CANLIDA** (9 Kasım; Claude uyguladı, `schema_migrations` kaydı var, doğrulandı) | `b41683e6` |
| L5 Lovable hero + arama çubuğu | ✅ (küre animasyonu alınmadı) | `92138ed8` (merge) |
| L10b profil doluluk e-postası (0/3/10. gün) | ✅ kod + mig `20261109100000` **CANLIDA** (Claude uyguladı, doğrulandı: ayar false, cron var, kapalıyken 0 kayıt) · ayar **KAPALI** | `c9f0bb75` |

> **L10b'yi açmadan önce:** opt-out/abonelikten çıkma + tercih ayarı + gizlilik politikası (inceleme: HIGH, tanıtım sayılabilir) · Burak metin onayı · 0. gün kararı · `send-notification-emails` deploy → `check:functions` → ayar `true`. Kuyruk sıralama (claim ordering) düzeltmesi ayrı migration ister (F13, yapılmadı).
> **Not:** §3'teki "0. Önce L10b'yi bitir" maddesi TAMAMLANDI.

**Gönderilen mailler (9 Kasım gecesi, toplam 5):**
- L0
- ara durum
- "ana dala alındı"
- gün sonu + 14 karar (`a18c6360`)
- adım adım durum listesi (`6a21fdd9`)

Hepsi `sent`, hiçbiri hata vermedi.

- **Kapılar (birleşik hâl):** 4.657 test · Playwright smoke 5/5 · lint · typecheck · build · check:bundle (ilk JS **250,6 KB** gzip) · check:dead · check:docs · ingest:tools hepsi yeşil.
- **Mailler:** L0 ve ara durum gönderildi (`processed 2 / sent 2`). Son kayıt `20261109-lansman-l3-l10a-l5-ana-dalda` gönderilmek üzere kuyrukta; bu notun commit'iyle gider.

## 1b. Gece kapanışı (9 Kasım)

- `main` = `origin/main` = `b745c3ef`. Açık iş yok.
- Toplam 11 Güncellemeler maili gitti, hepsi hatasız.
- Sorular şu kayıtlarda duruyor:
  - `20261109-lansman-baris-ve-burak-yapilacaklar-ve-sorular`: Burak'a 14 soru ve yapılacaklar.
  - `20261109-lansman-barisa-sorular`: Barış'a 12 geliştirme/altyapı sorusu.
  - `20261109-lansman-sorular-hakkinda-son-not`: Burak bilmediğini ve geliştirme sorularını atlar, onlara Barış karar verir.
- **L1'in ilk işi:** Burak'ın ve Barış'ın cevaplarını kaydet. Cevapsız ürün sorularında önerilen seçenek geçerlidir.

## 2. Barış'ın kararları (8–9 Kasım)

- `GGVBLA-M7SDSR` bizim gerçek kampanya kodumuz; yasak listeye girmez.
- Ana sayfa H1: "Gittiğin ülkede organize bir ağ seni bekliyor".
- **Süreç kuralı:** batch başına **tek** bağımsız inceleme. İstenen düzeltme ikinci incelemeye girmez; yalnız kapılardan geçer. Hız öncelikli.

## 3. Sıradaki iş

> **Ultracode AÇIK (Barış, 9 Kasım).** Her batch'i Workflow aracıyla yürüt:
> 1. **Anla:** paralel okuyucular.
> 2. **Uygula:** çakışma varsa worktree'de.
> 3. **İncele:** 3 farklı bakış açısıyla çürütmeye çalış: doğruluk · güvenlik/gizlilik · test dişi (mutasyon).
> 4. **Düzelt.** Düzeltme yalnız kapılardan geçer, ikinci inceleme turu yok.
>
> Hız öncelikli.

0. **Önce L10b'yi bitir.**
   - **Ajan bitti mi?** `git status`'a bak. Beklenen dosyalar:
     - `supabase/migrations/applied/20261109100000_profile_completion_reminder.sql`
     - `supabase/functions/send-notification-emails/index.ts`'teki değişiklik
     - yeni sözleşme testleri
     Dosyalar hâlâ değişiyorsa ajan çalışıyordur; bekle.
   - **İnceleme (workflow):**
     - Outbox CHECK listesinden hiçbir değer düşmedi mi? `20261005100500` bir kez düşürmüştü.
     - Beş parçalı bildirim hattının beşi de var mı?
     - `email.profile_completion_reminder.enabled` varsayılanı **false** mı?
     - dedupe idempotent mi?
     - Sorgu küçük RAM'li DB'yi yormuyor mu?
     - Taslak metin "TASLAK — Burak onaylayacak" diye işaretli mi?
   - **Durum (9 Kasım):** L10b ajanı bitirdi: 4.679 test yeşil, ayar kapalı. Workflow `wf_a9af7be7-71d` başlatıldı (3 bakış açısıyla inceleme → düzeltme → kapılar). Raporu bu oturuma gelir; yeni oturumda gelmez, o yüzden `git status` + kapılarla doğrula.
   - **Ardından:**
     1. Kapılar.
     2. Güncellemeler kaydı.
     3. Commit (pathspec) ve push.
     4. **Migration'ı `20261109100000` CLAUDE uygular** (aşağıdaki tarif).
     5. `send-notification-emails` deploy'u: Barış yapar ya da açıkça isterse Claude.
     6. Burak metni onaylayınca ayar açılır.
   - **Karar bekleyenler:**
     - Abonelikten çıkma bağlantısı yok; hukuk görüşü gerekiyor.
     - 0. gün hatırlatması hoş geldin maili ile aynı güne düşüyor.
     - Taslak metin Burak'ın onayını bekliyor.

> **Migration'ları Claude uygular (Barış kararı, 9 Kasım).** Tarif:
> 1. Ön durumu ölç: sürüm kaydı var mı, nesne var mı, etkilenen tablonun satır sayısı.
> 2. Dosyada `begin;`/`commit;` sarmalı olduğunu doğrula.
> 3. Dosyayı UTF-8 olarak oku ve Management API `POST /v1/projects/injprdrsklkxgnaiixzh/database/query` ile tek istekte gönder.
> 4. Sürüm kaydını düş: `insert into supabase_migrations.schema_migrations(version,name) values (...) on conflict do nothing`.
> 5. Nesneleri ve yetkileri doğrula: `has_function_privilege` ile anon kapalı mı, ilgili rolde açık mı.
>
> Yalnız incelenmiş ve commit'lenmiş migration uygulanır. psql bu makinede yok.
1. **L1:** bugün 14:00'teki toplantının 14 kararını kaydet (planın §4'ü). Kararlar rapora, plana, Docs'a ve KALANLAR'ın K bölümüne işlenir. Kapanmayan karar önerilen varsayımla ilerler.
2. **Karar bekleyen batch'ler:** L2, L4, L6, L7, L8, L11–L13, L17.
3. **Kararsız ilerleyebilenler:**
   - L10b: doluluk e-postası; metni Burak'tan gelir.
   - L5'in açıkları: aramaya etkinlik, grup ve Çarşı kapsamı (backend ister); Lighthouse mobil ölçümü.
4. **Sende kalanlara bağlı batch'ler:** L9 (Meta onayı), L14 ve L15 (Stripe hesabı).

## 4. Barış'ta bekleyenler

- **L10a migration'ı** (`20261108120000_feedback_profile_and_promote.sql`) canlıya uygulanmalı. Sıra serbest: uygulanmadan site çökmez, yalnız "REV'e taşı" ve üye geçmişi çalışmaz.
- **Coolify deploy:** 7 Kasım düzeltmeleri + L3, L10a ve L5 ancak deploy'dan sonra görünür.
- 🔴 **GB1** anahtar yenileme.
- **Yedek dizini:** `C:/tmp/corteqs-cleanup-yedek-2026-11-07/` silinmeli (içinde `.env` dosyaları var).
- **14 karar.**

## 5. Tuzaklar

1. **`check:docs` KIRIK:** denetim git'e bakar. Yeni bir `docs/...` dosyasına atıf veren belge, dosya `git add` edilene kadar KIRIK verir.
2. **`npm run build` iki dosyayı yeniden yazar:** `public/sitemap.xml`'i yeniden üretir, `public/llms-full.txt`'i DB erişimi olmadan boşaltır. Commit'ten önce `git checkout -- public/sitemap.xml public/llms-full.txt`.
3. **Canlı DB:** Management API (`POST /v1/projects/injprdrsklkxgnaiixzh/database/query`); token `.env.local`'daki `SUPABASE_ACCESS_TOKEN`'dan okunur; `dangerouslyDisableSandbox` gerekir.
4. **Maili hemen göndermek için:** önce kuyruğa bak (`notification_email_outbox`'ta `status='pending'`). Sonra `POST /functions/v1/send-notification-emails`, `x-dispatch-secret` = `NOTIFY_DISPATCH_SECRET`, gövde `{"source":"cli-manual","force":true}`. `force` kuyruktaki her şeyi gönderir.
5. **Paralel ajanlar aynı çalışma ağacında:** tam vitest yarım yazılmış dosyaları da toplar. Büyük iş için worktree kullan; worktree'de önce `npm ci`.
6. **Kapı komutlarını `| tail` ile borulama;** çıkış kodu kaybolur. Bash aracının sahte `claude-*-cwd` satırını yok say.
