# Onay sonrası uygulama planı — 28 Eylül 2026

> **Bu plan, 28.09'da alınan kararların uygulama adımlarıdır.** Kararlar verildi,
> uygulama YAPILMADI (kullanıcı "dur" dedi). Sıradaki oturum buradan devam eder.
>
> Bağlam: `docs/kalanlar/2026-09-27-KALANLAR.md` → "DEVİR NOTU — 28.09".
> Onaysız zincir (S01–S09 · G01–G03h · C00–C06) **tamamen bitti**, 22 batch push'lu.

## ✅ Bu turda kapanan

- **U02 · Supabase Pro + compute** — KAPANDI, ölçümle doğrulandı.
  RAM **407 → 904 MB**, swap kullanımı **615 → 151 MB**, `selected_addons` →
  `ci_micro`. Ayrıntı ve tuzak KALANLAR'daki U02 bölümünde.

---

## P1 · Bucket sıkılaştırma — KARAR: UYGULA

**Durum:** migration YAZILDI, canlıda UYGULANMADI.
**Dosya:** `docs/operations/2026-09-28-service-attachments-bucket-hardening.sql`

**Uygulama öncesi ölçüm (28.09, alındı):**

```text
storage.buckets: id=service-attachments · public=true · file_size_limit=YOK · mime=0
storage.objects policy: "Anyone can view attachments" [SELECT]
```

⚠️ INSERT policy bu sorguda görünmedi (`qual` boş, koşul `with_check`te). Uygulamadan
önce policy listesini `cmd` filtresi olmadan tekrar çek — silinecek policy'nin adı
tam olarak `Authenticated users can upload attachments` olmalı.

**Adımlar:**

1. `psql -f docs/operations/2026-09-28-service-attachments-bucket-hardening.sql`
   (⚠️ PowerShell'den satır yapıştırma — Türkçe karakter bozulur, dosyayla gönder)
2. Dosyayı `supabase/migrations/applied/20260928120000_service_attachments_hardening.sql`
   olarak **taşı**
3. `schema_migrations` kaydını at (yoksa `check:migrations` sapma gösterir)
4. `npm run check:migrations` → sapma yok
5. Uçtan uca dene: geçerli PDF **geçmeli** · 20 MB dosya ve `.exe` **reddedilmeli** ·
   başka kullanıcının klasörüne yazma **reddedilmeli**

**Kapsam:** B1 (boyut/tür) · B2 (sahiplik) · B4 (kendi ekini silme). Davranışı bozmaz.
**Geri alma:** dosyanın sonunda hazır. ⚠️ Geri alma açıkları da geri getirir.

## P2 · Bucket gizliliği (B3) — KARAR: ÖNCE ÖLÇ

Bucket `public=true` ve SELECT policy giriş yapmış herkese açık. Hizmet talebi ekleri
CV/sözleşme/kimlik taşıyabilir.

**Önce yapılacak ölçüm** (karar bundan sonra):

```sql
select count(*) as ek_sayisi,
       count(distinct (storage.foldername(name))[1]) as kullanici_sayisi,
       min(created_at) as ilk, max(created_at) as son
from storage.objects where bucket_id = 'service-attachments';

select lower(regexp_replace(name, '^.*\.', '')) as uzanti, count(*)
from storage.objects where bucket_id = 'service-attachments'
group by 1 order by 2 desc;
```

⚠️ **Yalnız dosya ADI ve uzantısı okunur, İÇERİK okunmaz.**

**Ölçüm sonucuna göre iki yol:**

- Ekler gerçekten hassas → signed URL geçişi (~yarım gün). ⚠️ **Mevcut ek adresleri
  geçersizleşir**, daha önce paylaşılmış linkler kırılır.
- Ekler hassas değil → public kalır, karar gerekçesiyle kayda geçer.

## P3 · Edge function'lar — KARAR: İNCELE **VE** DEPLOY ET

⚠️ **Coolify edge function deploy ETMEZ** (`Dockerfile` yalnız frontend'i kurar).
Commit'lemek canlıya çıkarmaz ve bunu haber veren hiçbir şey yok — ne CI, ne test.

**(a) Yetki denetimi — önce oku, eksikse yaz**

- `lansman-admin` (handler bugün HTTP 410 döndürüyor — deprecated; yine de doğrula)
- `relocation-notifications`

**(b) Deploy edilmemiş iki fonksiyon** — 30 Ağustos'tan beri repoda, canlıda YOK:

```bash
supabase functions deploy whatsapp-reply      --project-ref injprdrsklkxgnaiixzh
supabase functions deploy whatsapp-webhook    --project-ref injprdrsklkxgnaiixzh
```

⚠️ `WHATSAPP_*` secret'larını okuyorlar — deploy öncesi `supabase secrets list` ile
var olduklarını doğrula, yoksa fonksiyon sessizce çalışmaz.

**(c) Deploy sonrası:** `npm run check:functions` → repo/canlı ayrışması kapandı mı.

## P4 · Cadde tepki sayımı — KARAR: ŞİMDİLİK YETERLİ

Parça boyu tahmini (`CADDE_ROWS_PER_POST = 50`) bugünkü hacimde güvenli. Sınır
kaynakta yazılı (`cadde-api-support.ts`). Gönderi başına 50+ tepki gelmeye başlarsa
sunucu tarafı toplama RPC'si yazılacak. **Şimdilik iş yok.**

---

## ⏸️ EN SONA — U01 · Service role anahtarı

**KARAR: ertelendi.** Sebep teknik, ihmal değil:

Legacy `service_role` anahtarı **bağımsız döndürülemiyor**. Panelde o satırda yalnız
"Reveal" var; tek seçenek **"Disable JWT-based API keys"** ve o da legacy JWT secret'ını
komple devre dışı bırakır.

⚠️ **Bu üç edge function'ı düşürür** (ölçüldü — hepsi `SUPABASE_ANON_KEY` okuyor):

| Fonksiyon | Etki |
|---|---|
| `site-assistant` | **canlı site asistanı botu susar** |
| `relocation-assistant` | açıkça hata fırlatır (`Missing ... SUPABASE_ANON_KEY`) |
| `radar-news-scan` | haber taraması durur |

**Önce yapılması gereken:** bu üç fonksiyon yeni anahtar sistemine (`sb_secret_` /
`sb_publishable_`) taşınmalı. Ancak ondan sonra legacy anahtarlar güvenle kapatılabilir.

✅ **İyi haber:** `.env.local` ve frontend **zaten yeni sisteme geçmiş**
(`SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_…`, client `VITE_SUPABASE_PUBLISHABLE_KEY`
okuyor). Yani geriye yalnız üç edge function kaldı.

⚠️ **O güne kadar risk DURUYOR:** sızan anahtar geçerli ve RLS'i tamamen atlıyor.
