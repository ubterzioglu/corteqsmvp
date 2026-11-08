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
| L10a profilde Geri Bildirim + admin "REV'e taşı" | ✅ kod · ⚠️ migration `20261108120000` canlıda **değil** | `b41683e6` |
| L5 Lovable hero + arama çubuğu | ✅ (küre animasyonu alınmadı) | `92138ed8` (merge) |
| L10b profil doluluk e-postası (0/3/10. gün) | 🟡 bir ajan ANA çalışma ağacında yazıyordu; **commit yok**; ayar **KAPALI** tasarlandı | tag `lansman-l10b-oncesi-2026-11-09` |

**Gönderilen mailler (9 Kasım gecesi, toplam 5):**
- L0
- ara durum
- "ana dala alındı"
- gün sonu + 14 karar (`a18c6360`)
- adım adım durum listesi (`6a21fdd9`)

Hepsi `sent`, hiçbiri hata vermedi.

- **Kapılar (birleşik hâl):** 4.657 test · Playwright smoke 5/5 · lint · typecheck · build · check:bundle (ilk JS **250,6 KB** gzip) · check:dead · check:docs · ingest:tools hepsi yeşil.
- **Mailler:** L0 ve ara durum gönderildi (`processed 2 / sent 2`). Son kayıt `20261109-lansman-l3-l10a-l5-ana-dalda` gönderilmek üzere kuyrukta; bu notun commit'iyle gider.

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
   - **Ardından:** kapılar → Güncellemeler kaydı → commit (pathspec) → push.
   - **Barış'a kalanlar:** migration'ı uygula, edge function'ı deploy et, Burak metni onaylayınca ayarı aç.
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
