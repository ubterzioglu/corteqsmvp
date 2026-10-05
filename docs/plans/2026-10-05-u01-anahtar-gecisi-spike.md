# U01 · Service role anahtarı — yeni anahtar düzenine geçiş SPIKE'ı (5 Ekim 2026)

> Karar 12 (`KALANLAR.md` §2.0): *"önce 3 edge function yeni anahtar düzenine taşınır, SONRA
> rotasyon."* Bu dosya o öncülü ölçer. **Rotasyon YAPILMADI.** 🔴 *"Disable JWT-based API
> keys"* düğmesine **basılmadı** — panel eylemidir, kullanıcıya aittir.
> Sır değeri bu dosyada YOK; anahtarlar yalnız türüyle ve sha256 ilk 8 hanesiyle anılır.

---

## 0 · Neden ACİL (P05 bulgusu)

Legacy `service_role` JWT'si (parmak izi `2526e534`) **herkese açık** GitHub deposunun
(`ubterzioglu/corteqsmvp`, PUBLIC) `origin/main` geçmişinde ve güncel ağacında
(`docs/archive/root-2026-06-11/deployerror.txt`, 7 Haziran'dan beri) duruyor ve **bugün
geçerli**: `GET /auth/v1/admin/users` → **200**, `GET /rest/v1/` → **200** (05.10, yalnız
durum kodu ölçüldü). Service role RLS'i tamamen atlar. Ayrıntı:
`docs/plans/2026-10-05-p04-p07-olcum-raporu.md` §P05. Legacy JWT tek başına döndürülemez —
**tek kalıcı çözüm legacy JWT anahtarlarını kapatmak.** "EN SONA" önceliği bu bulguyla
**geçersizleşti.**

---

## 1 · Ölçüm: edge function'lar ZATEN yeni anahtarla çalışıyor

Management API `GET /v1/projects/injprdrsklkxgnaiixzh/secrets` her secret için değerin
sha256 özetini döner. Özetler bilinen adaylarla karşılaştırıldı (değer yazdırılmadı):

| Edge ortamındaki ad | Özeti eşleşen anahtar |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **`sb_secret_…`** (`.env.local`'daki yeni secret anahtar) — legacy service_role JWT DEĞİL |
| `SUPABASE_ANON_KEY` | **`sb_publishable_…`** (`.env.local` `SUPABASE_PUBLISHABLE_KEY`) — legacy anon JWT DEĞİL |
| `SUPABASE_SECRET_KEYS` · `SUPABASE_PUBLISHABLE_KEYS` · `SUPABASE_JWKS` | mevcut (platformun yeni anahtar ortam değişkenleri) |

Yani `SUPABASE_SERVICE_ROLE_KEY` okuyan **15** fonksiyonun (aşağıda) hiçbiri legacy JWT'ye
bağlı değil — platform eski adla yeni anahtarı veriyor. **"3 edge function taşınmalı" öncülü
ölçümle ÇÜRÜDÜ**: taşınacak edge function yok.

`SUPABASE_SERVICE_ROLE_KEY` okuyan fonksiyonlar (repo, `git grep`, 15 — devir notu 14 + 
`whatsapp-autoreply` dedi; sayım tutuyor):
`directory-search` · `find-matches` · `group-claim-verify` · `group-link-health` ·
`group-preview` · `lansman-admin` · `radar-news-scan` · `relocation-assistant` ·
`relocation-notifications` · `send-notification-emails` · `send-submission-email` ·
`site-assistant` · `submit-survey-response` · `whatsapp-autoreply` · `whatsapp-webhook`.
(`whatsapp-reply` okumaz.) ⚠️ `whatsapp-autoreply` **canlıda deploy edilmemiş** (repo 16 /
canlı 15 — P04 yan bulgusu).

Çağrı yolları (kod taraması): `.from()` / `.rpc()` (PostgREST) çoğunda; `auth.getUser(token)`
(kullanıcı JWT'sini doğrulama) `group-claim-verify` · `group-preview` · `radar-news-scan` ·
`relocation-assistant` · `send-notification-emails` · `site-assistant` + `_shared/edge-authorization.ts`
üzerinden `relocation-notifications` · `whatsapp-autoreply`. **`auth.admin.*` çağrısı kodda
YOK** (M27'de kaldırıldı). `lansman-admin` anahtarı okur ama hiç kullanmaz (410 döner).

### Yeni anahtarlar doğrudan HTTP'de (05.10, yalnız durum kodu)

| İstek | Sonuç |
|---|---|
| `rest/v1` · apikey=`sb_secret` (± Bearer) | 200 / 200 |
| `auth/v1/admin/users` · apikey=`sb_secret` (± Bearer) | **200 / 200** |
| `auth/v1/settings` · apikey=`sb_publishable` | 200 |
| `rest/v1` · apikey=`sb_publishable` | 200 |
| `functions/v1/lansman-admin` (`verify_jwt=true`) · Bearer=`sb_publishable` | **410** (gateway geçirdi, fonksiyon yanıtladı) |
| `functions/v1/lansman-admin` · yalnız apikey=`sb_publishable`, Authorization YOK | **410** (gateway geçirdi) |
| `functions/v1/lansman-admin` · hiç başlık yok | 401 (gateway) |

⚠️ **M27 dersi ("`sb_secret` auth admin API'de 401") doğrudan HTTP'de TEKRARLANMADI** —
`/auth/v1/admin/users` 200 döndü. M27'deki 401 edge içindeki supabase-js çağrı biçiminden
ya da farklı bir uçtan (`/admin/users/{id}`) gelmiş olabilir; **o yol ölçülmedi.** Kod
bugün o API'yi kullanmadığı için geçişi etkilemez.

---

## 2 · Ölçüm: legacy JWT'ye GERÇEKTEN bağlı olan — FRONTEND

Canlı `https://corteqs.net/env-config.js` (herkese açık dosya) çözüldü:
`VITE_SUPABASE_PUBLISHABLE_KEY` = **legacy JWT, `role=anon`** (parmak izi `1181fa29`).
Yani adı "publishable" ama değeri **eski anon JWT**. Coolify ortam değişkeninden gelir
(`docker-entrypoint-env.sh:19`). `.env.local`'daki `VITE_SUPABASE_PUBLISHABLE_KEY` /
`VITE_SUPABASE_ANON_KEY` da aynı legacy anon JWT.

🔴 **Bugün "Disable JWT-based API keys"e basılırsa düşen: 3 fonksiyon değil, SİTENİN TAMAMI**
(her anonim/oturumlu PostgREST + Auth + function çağrısı apikey olarak bu JWT'yi taşıyor).

Legacy anahtar kullandığı **ölçülemeyen** yerler (DB okuması bu oturumda izinsizdi):
- `cron.job.command` içinde `Authorization: Bearer eyJ…` taşıyan iş (repodaki
  `applied/` migration'larında **yok** — hepsi `x-dispatch-secret` kullanıyor; ama canlıda
  elle kurulmuş iş olabilir)
- Database Webhook (`supabase_functions.http_request` trigger'ı) başlıkları
- `vault.decrypted_secrets` içinde legacy anahtar saklayan kayıt
- Repo dışı tüketiciler: service-finder worker, `workers/relocation-ingestion`, prerender
  servisi, Coolify'da `SUPABASE_SERVICE_ROLE_KEY` tutan başka konteyner

---

## 3 · Geçiş sırası (kesintisiz, her adım geri alınabilir)

| # | Adım | Kim | Geri alma | Doğrulama |
|---|---|---|---|---|
| 1 | §4 SQL'ini koş: cron/webhook/vault'ta legacy anahtar var mı | DB izni olan oturum | salt-okunur | çıktı 0 satır olmalı |
| 2 | Coolify → frontend uygulaması → env `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_…` (`.env.local` `SUPABASE_PUBLISHABLE_KEY` değeri) → yeniden deploy | **kullanıcı** | env'i eski değere çevir + redeploy | §5 komut 1: env-config tipi `sb_publishable`; tarayıcıda giriş, dizin araması, asistan, form gönderimi |
| 3 | Repo dışı tüketicilerin anahtarlarını `sb_secret_` / `sb_publishable_`'a çevir (varsa) | kullanıcı | eski değer | ilgili servis logu |
| 4 | `.env.local`'daki `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` yeni publishable'a | kullanıcı/ajan | eski değer | `npm run dev` ile giriş |
| 5 | 24–48 saat gözle: `client_error_reports`'ta 401 artışı yok | ajan | — | `select count(*) … where created_at > now()-interval '1 day'` |
| 6 | Panel → Settings → API Keys → **"Disable JWT-based API keys"** | **yalnız kullanıcı** | panelde yeniden etkinleştirme (⚠️ panelde teyit et — dokümana güvenme) | §5 komut 2: sızan JWT **401** |
| 7 | `sb_secret_` anahtarını da döndür (yeni secret oluştur → edge/`.env.local`/Vault üçlüsü → eskiyi sil). `sb_secret` bu oturumda hiçbir dosyaya sızmadı (P05: geçmişte 0), bu adım hijyen | kullanıcı | — | edge fonksiyonları smoke |

Edge function kodu **değişmez**, deploy **gerekmez** (§1). Tek kod dışı kritik yol adım 2.

---

## 4 · Adım 1 SQL'i (salt-okunur; DB izni olan oturumda)

```sql
-- legacy JWT içeren cron işi
select jobid, jobname from cron.job where command ilike '%eyJ%' or command ilike '%Bearer%';
-- Database Webhook trigger'ları (başlıkları argümanlarda)
select tgrelid::regclass, tgname from pg_trigger t join pg_proc p on p.oid = t.tgfoid
 where p.proname = 'http_request';
-- Vault'ta JWT biçimli değer (yalnız ad)
select name from vault.decrypted_secrets where decrypted_secret like 'eyJ%';
```

## 5 · Doğrulama komutları

```bash
# 1 · canlı frontend anahtar TÜRÜ (değer yazmaz)
curl -s https://corteqs.net/env-config.js | python -c "import sys,re;[print(k, 'jwt' if v.startswith('eyJ') else v.split('_')[0]+'_'+v.split('_')[1]) for k,v in re.findall(r'(VITE_[A-Z_]+_KEY)\s*[:=]\s*[\"\']([^\"\']+)', sys.stdin.read())]"
# 2 · adım 6'dan sonra sızan legacy JWT reddediliyor mu (durum kodu)
#     scratchpad betiği: git show f5927714 içinden role=service_role JWT → /auth/v1/admin/users → 401 beklenir
# 3 · edge sapma
npm run check:functions
```

## 6 · Kanıtlanamayan

- §2'deki DB tarafı (cron/webhook/vault) — DB izni yoktu.
- Edge içinde supabase-js'in `sb_secret` ile `auth.getUser(token)` yolu (bugün üretimde
  çalışıyor olmalı çünkü edge zaten `sb_secret` taşıyor, ama admin oturumuyla denenmedi).
- "Disable" sonrası geri alınabilirlik — panelde görülmedi.
- Repo dışı tüketicilerin envanteri.
