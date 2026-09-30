# Kalıcı Operasyon Dersleri — tek dosya (30.09.2026)

> **Amaç:** Kapanan devir notlarından, kalan-iş listelerinden ve kaza raporlarından
> damıtılan, **hâlâ geçerli** operasyon bilgisi. Yeni oturum başka hiçbir şey
> okumasa bile buradan deploy/DB/secret/tuzak temellerini alır. Tarihçe ve
> gerekçeler: `docs/archive/2026-09-30-kapanan-is-dokumanlari/` + git geçmişi.
> Güncel iş listesi: `docs/kalanlar/2026-09-27-KALANLAR.md`. Agent kuralları: kök
> `CLAUDE.md` · mimari: `docs/ARCHITECTURE.md` · hızlı bağlam: `docs/AGENT_CONTEXT.md`.
>
> Bu dosya **yaşayan belgedir**: kalıcı bir ders çıktığında buraya eklenir,
> geçici iş durumu EKLENMEZ (o master kalanlar dosyasının işidir).

## 1 · Deploy

- **Frontend:** Coolify otomatik deploy eder. **Edge function'ları ETMEZ.**
- **Edge function:** `supabase functions deploy <ad> --project-ref injprdrsklkxgnaiixzh`
- ⚠️ **verify_jwt flip riski:** `supabase/functions/<ad>/config.toml` içinde
  `[functions.<ad>]` girdisi OLMADAN CLI ile deploy edilen her fonksiyonda gateway
  `verify_jwt` varsayılanla AÇILIR ve cron'un ham secret'ı 401 yer.
  - Cron ile tetiklenen fonksiyon: `verify_jwt = false` config girdisi ŞART
    (örn. `radar-news-scan` v34).
  - Kullanıcı kimliğiyle çağrılan fonksiyon: `verify_jwt = true` girdisi yazılır
    (örn. `site-assistant` v19).
- **Deploy sonrası ÖLÇ:** Management API'den `version`, `status=ACTIVE`,
  `verify_jwt` üçlüsünü doğrula. "Deploy ettim" kanıt değildir.
- Gateway uzun süren çağrılarda **504 IDLE_TIMEOUT** döndürebilir ama fonksiyon
  arka planda tamamlar — DB satırı/çıktı ile doğrula, 504'yü başarısızlık sayma.
- Prerender/nginx ayrıntısı: `docs/coolify-deployment.md`,
  `docs/operations/prerender-setup.md`, DB portu kapatma:
  `docs/operations/2026-08-06-coolify-db-portu-kapatma.md`.

## 2 · Veritabanı erişimi ve migration

- Supabase projesi: **Pro plan + Micro compute** · ref: `injprdrsklkxgnaiixzh`.
- ⚠️ `db.<ref>.supabase.co` **IPv6-only** — rota düşünce kopar. Güvenilir yol pooler:
  `aws-1-eu-west-2.pooler.supabase.com:6543`, kullanıcı `postgres.<ref>`
  (**aws-0 tanımıyor**).
- Migration akışı: dosya `supabase/migrations/applied/` altına → `psql -f` ile
  canlıya uygula → `schema_migrations` kaydını at. Ayrıntı:
  `docs/migration-runbook.md` + `docs/operations/database/guvenli-migration-runner.md`
  + `migration-baseline-ve-kontrol.md`. Sapma kontrolü: `npm run check:migrations`.

## 3 · Secret yönetimi

- **Plaintext'in tek okunur kaynağı Vault:** `vault.decrypted_secrets`
  (postgres rolüyle SQL). Edge fonksiyonlar secret'ı Vault'tan okur.
- **Rotasyon ÜÇLÜSÜ birlikte:** `.env.local` + Vault + edge. Biri bayat kalırsa
  sessiz başarısızlık olur (iki kez yaşandı: radar secret'ları ve
  `NOTIFY_DISPATCH_SECRET` — `.env.local` kopyası edge'den döndürülmüş secret'la
  eşleşmiyordu; digest'i sha256 ile karşılaştır).
- ⚠️ **Legacy `service_role` anahtarı bağımsız döndürülemez:** paneldeki tek
  seçenek "Disable JWT-based API keys" ve üç edge function'ı düşürür. Önce edge
  anahtar düzeni yeni şemaya taşınmalı (U01 — en sona bırakıldı).
- Geçmiş sızıntı ve anahtar dondurma tutanağı:
  `docs/operations/2026-09-22-corebot-env-sizintisi-anahtar-dondurme.md`.
- Secret hiçbir zaman commit'lenmez; `.secretdb` / `walast.txt` bilinçli olarak
  gitignore'da (canlı sır + ham WhatsApp dökümü).

## 4 · Kanıt disiplini (bu reponun en pahalı dersi)

- Panolar bu repoda **üç kez yanlış "yapıldı" gösterdi.** "Yaptım" yazmak yetmez:
  kanıt = commit hash + ölçüm + SQL sonucu.
- ⚠️ `cron.job_run_details` içindeki **"succeeded" kanıt DEĞİLDİR** — fonksiyon
  401 yerken bile cron "succeeded" yazmaya devam etti (Radar 14.09–28.09 arası
  ölüydü ama pano canlı gösteriyordu). Gerçek kanıt: işin ÇIKTISI
  (yeni satır/aday/`last_success_at`).
- Batch başlarken sayıları **yeniden ölç** — dokümandaki rakam bayatlamış olabilir.
- Bir batch = bir oturum = bir commit; batch bitmeden diğerine geçme.

## 5 · Bilinen tuzaklar

| Tuzak | Kural |
|---|---|
| Vitest cwd | Testleri büyük harfli `C:\...` cwd ile çalıştır — küçük harfli `c:\...` cwd'de test dosyaları SAHTE kırılır |
| Paylaşılan git index | Index başka oturumlarla paylaşılıyor → `git commit -m "..." -- <dosyalar>` **pathspec ŞART** |
| Untracked `corteqs-ekstre-motoru/` | Başka oturumun klasörü; `npm run lint` oradan ~29 hata verir — ana repo lint'i yeşil sayılırken bu klasör hariç tutulur |
| Yeni `cadde_*` hata kodu | `src/lib/cadde-rules.ts` haritasına Türkçesini yaz — `cadde-error-map.test.ts` kilitler |
| `src/lib/**` değiştiyse | `npm run ingest:tools:check`; bayatsa `npm run ingest:tools` + `openapi.yaml`'ı da commit'le |
| Bayat kilitler | Radar taramasında takılı `running` kilidi otomatik kapanır (`f6b5c6f`) — elle SQL müdahalesi gerekmez |
| Kök dizine yeni doküman | EKLENMEZ — `docs/` altında ilgili aktif klasöre (bkz. `docs/README.md` klasör sözlüğü) |
| Arşiv klasörleri | `docs/archive/`, `reference/`, `partner-materials/` donmuştur; `verify:text` denetiminden muaftır, canlı doküman buralara eklenmez |

## 6 · Her batch'te zorunlu doğrulama bataryası

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run lint
npm run test                  # TAM takım — yalnız ilgili dosya yetmez (27.09'da CI tam bu yüzden kırıldı)
npm run check:dead
npm run ingest:tools:check    # src/lib/** değiştiyse
git commit -m "..." -- <dosyalar>
gh run list --limit 1         # push sonrası CI yeşil mi
```

## 7 · Runbook ve rehber dizini (kalıcı olanlar)

| Konu | Dosya |
|---|---|
| Coolify / frontend deploy | `docs/coolify-deployment.md` |
| Migration | `docs/migration-runbook.md` · `docs/operations/database/*` |
| WhatsApp Cloud API | `docs/operations/whatsapp-cloud-api-runbook.md` (⚠️ Meta secret'ları yer tutucu — bot konusu KAPALI) |
| Bildirim e-postaları | `docs/operations/2026-07-29-bildirim-e-postalari-devir.md` · `onaymailifonksiyonu.md` |
| Google OAuth / custom domain | `docs/operations/2026-08-02-supabase-custom-domain-google-oauth.md` · `2026-09-25-google-auth-admin-yetkilendirme-rehberi.md` |
| Auth doğrulama yol haritası | `docs/operations/2026-09-04-auth-dogrulama-yol-haritasi.md` |
| Supabase'den çıkış | `docs/supabase-exit-plan.md` |
| Radar operasyonu | `docs/modules/radar/*` |
| Katalog / roller | `docs/guides/katalog-items-roller-features-iliskisi.md` ve kardeşleri |
| SMTP kimliği | Gönderen `info@corteqs.net`, SMTP kimliği `update@corteqs.net` — Zoho alias değilse 553; kurtarma `PATCH /config/auth` (ayrıntı KALANLAR U03) |
