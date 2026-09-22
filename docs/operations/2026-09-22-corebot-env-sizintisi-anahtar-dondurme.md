# 🔴 Sızıntı: `corebot` public reposunda `.env` — anahtar döndürme listesi

**Bulundu:** 22 Eylül 2026 · **Durum:** dosya silindi, **anahtarlar HENÜZ DÖNMEDİ**

## Ne oldu

`github.com/ubterzioglu/corebot` **public** bir repo ve kök dizininde `.env` dosyası
commit'liydi. İçinde **canlı üretim** anahtarları vardı ve proje bu deponun kullandığı
projenin **aynısı**: `injprdrsklkxgnaiixzh`.

**Maruz kalma süresi:** en az **27 Nisan 2026 → 22 Eylül 2026** (~5 ay), en az üç
commit'te (`6d515dc`, `de322c1`, `e0f59c5`).

| Anahtar | Ne yapmaya yeter |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **Tüm RLS'i baypas eder** — her tabloyu okur/yazar/siler |
| `SUPABASE_DB_PASSWORD` | Postgres'e doğrudan bağlanır |
| `SUPABASE_ACCESS_TOKEN` | Management API — fonksiyon deploy/siler, **secret okur**, projeyi siler |
| `ACCESS_TOKEN` (WhatsApp) | İşletme adına mesaj gönderir |
| `VERIFY_TOKEN` · `PHONE_NUMBER_ID` · `WA_BUSENESS_ID` | Webhook'u devralmaya yeter |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anahtar — döndürmek şart değil, ama RLS'i gözden geçir |

## Yapıldı

- ✅ `.env` `main`'den silindi (`c590b12`). Uygulama bu dosyayı **hiç yüklemiyordu**
  (`dotenv` bağımlılığı yok, kod yalnız `process.env` okuyor) — silmek çalışan botu
  etkilemedi.

⚠️ **Silme sızıntıyı KAPATMADI.** Dosya commit geçmişinden hâlâ okunabiliyor
(`/contents/.env?ref=e0f59c5` → 1611 bayt, silmeden SONRA doğrulandı). Fork, klon ve
önbellekler ayrı kopyalardır. **Tek gerçek çözüm anahtarları döndürmektir.**

⚠️ `.gitignore` içinde `.env` **zaten vardı** — dosya takibe girdikten sonra eklenmiş.
`.gitignore` bir kez commit'lenmiş dosyayı durdurmaz.

## Yapılacaklar — sırayla

### 1. Anahtarları döndür (öncelik sırasıyla)

| # | Anahtar | Nereden |
|---|---|---|
| 1 | `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Settings → API → **Reset** |
| 2 | `SUPABASE_ACCESS_TOKEN` | Account → Access Tokens → **Revoke** + yeni üret |
| 3 | `SUPABASE_DB_PASSWORD` | Settings → Database → **Reset password** |
| 4 | WhatsApp `ACCESS_TOKEN` | Meta → System User → token yenile |
| 5 | `WHATSAPP_VERIFY_TOKEN` | Yeni değer belirle (Meta + corebot ikisinde birden) |

### 2. Yeni değerleri ŞU BEŞ YERE birden yaz

Biri atlanırsa o servis **sessizce** düşer:

| Yer | Ne var | Nasıl |
|---|---|---|
| **Supabase function secrets** | 22 secret — `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_*`, `ZOHO_SMTP_*`, `GEMINI_API_KEY`, … | Dashboard → Edge Functions → Secrets |
| **Coolify (corteqs frontend)** | `VITE_SUPABASE_*` + `SUPABASE_SERVICE_ROLE_KEY` | Coolify → uygulama → Environment |
| **Coolify/nixpacks (corebot)** | `ACCESS_TOKEN`, `VERIFY_TOKEN`, `PHONE_NUMBER_ID`, `SUPABASE_SERVICE_ROLE_KEY`, … | corebot servisinin Environment ekranı |
| **Meta App → Webhook** | `VERIFY_TOKEN` (yeni değerle "Verify and save") | developers.facebook.com → WhatsApp → Configuration |
| **Yerel `.env.local`** | Bu depodaki tüm scriptler + benim DB erişimim | Dosyayı elle güncelle |

⚠️ **GitHub Actions secret kullanmıyor** (`quality.yml` içinde `secrets.` geçmiyor) —
orada yapılacak iş yok.

### 3. Kötüye kullanım izi ara

Service role key RLS'i baypas ettiği için erişim **normal görünür**. Bakılacak yerler:
Supabase → Logs → Postgres / PostgREST; olağandışı IP, toplu `select`, beklenmedik
saatlerde erişim. Özellikle kişisel veri taşıyan tablolar:
`user_profile_attributes`, `catalog_item_contacts`, `whatsapp_*`, `submissions`.

### 4. En son: geçmişi temizle

`git filter-repo` ile `.env`'i geçmişten sil ya da repoyu silip yeniden oluştur.
**Bu adım anahtar döndürmeden SONRA gelir** — önce riski kapat, sonra izi.

## Döndürme sonrası doğrulama

```bash
npm run check:migrations   # DB bağlantısı (yeni SUPABASE_DB_PASSWORD)
npm run check:functions    # Management API (yeni SUPABASE_ACCESS_TOKEN)
npm run fx:refresh         # service role ile yazma
```

Üçü de yeşilse yeni anahtarlar her yere doğru yazılmış demektir.

## Yolda çıkan ayrı bulgu — kayda geçsin

WhatsApp Callback URL'i **`https://corebot.corteqs.net/webhook`**'a bakıyor ve
`messages` alanına **abone**. Yani canlı WhatsApp trafiğinin tamamını, bu deponun
dışındaki bir servis karşılıyor. Bu deponun `whatsapp-webhook` fonksiyonu bu yüzden
**hiç çağrılmadı** (`whatsapp_webhook_events` = 0) ve B05.2 bu yüzden doğrulanamıyor.

Bir Meta uygulamasında **tek** Callback URL olur. Seçenekler B05.2 satırında tartışıldı:
corebot'tan kopya iletme (A) · bizim fonksiyonun proxy'lemesi (B, önerilmez) ·
ayrı test uygulaması (C, risksiz).
