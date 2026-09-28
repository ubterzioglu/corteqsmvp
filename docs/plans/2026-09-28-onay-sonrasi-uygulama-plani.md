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

## P1 · Bucket sıkılaştırma — KARAR: UYGULA · ⛔ 28.09 GECE UYGULANAMADI (izin)

> **Durum (28.09 gece):** hazırlık TAMAM, uygulama **ajan izniyle engellendi.**
> `psql -f ...hardening.sql` çağrısı oturumun izin sınıflandırıcısı tarafından
> **[Production Deploy]** gerekçesiyle reddedildi. Bu teknik bir engel değil, bir
> yetki sınırı — komut olduğu gibi kullanıcı tarafından çalıştırılmalı.
>
> ✅ **Uygulama öncesi iki kontrol yapıldı ve ikisi de temiz:**
> 1. Silinecek INSERT policy'sinin adı `cmd` filtresi olmadan doğrulandı:
>    `Authenticated users can upload attachments` — dosyadaki adla **birebir aynı.**
>    (storage.objects üzerinde toplam 71 policy var; yalnız bu biri eşleşiyor.)
> 2. Bucket durumu tekrar ölçüldü: `public=t` · `file_size_limit` boş · `mime 0`.
>    Planın yazıldığı gündeki ölçümle aynı, bayatlamamış.
>
> ✅ **İstemciyle hiza doğrulandı** (`src/lib/security.ts`): istemci tavanı
> 15 MB = `15728640` ve uzantı seti `pdf · doc · docx · jpg/jpeg · png · webp`
> migration'daki 6 MIME türüyle birebir karşılanıyor. Ayrışma YOK.
>
> ✅ **Eski veriyi kırma riski YOK:** bucket boş (bkz. P2 ölçümü), yani yeni MIME/boyut
> kısıtının geçersiz kılacağı mevcut nesne bulunmuyor.

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

## ✅ P2 ÖLÇÜMÜ ALINDI (28.09 gece) — bucket BOŞ

```text
storage.objects where bucket_id='service-attachments'
  ek_sayisi = 0 · kullanici_sayisi = 0 · uzanti dagilimi = (bos) · mimetype = (bos)
```

**Bu bir varsayımı çürüttü.** Aşağıda yazan "⚠️ mevcut ek adresleri geçersizleşir,
daha önce paylaşılmış linkler kırılır" riski **fiilen yoktur** — geçersizleşecek adres
yok, kırılacak link yok. Private'a geçişin bedeli yalnız **kod işi** (`getPublicUrl` →
`createSignedUrl`), veri/bağlantı kaybı değil.

Dolayısıyla P2 artık "hassas mı?" sorusu değil: **hiç ek yokken geçmek en ucuz an.**
Karar hâlâ kullanıcının, ama gerekçe değişti — erteledikçe maliyet artar, azalmaz.

⚠️ P1'in MIME kısıtı için de aynı ölçüm iyi haber: uyumsuz `mimetype` ile kayıtlı
mevcut nesne YOK, yani kısıt hiçbir eski dosyayı geçersiz kılmaz.

⚠️ Gelecekteki yüklemeler için tek açık risk: `ServiceRequestForm` yüklemede
`contentType` GEÇMİYOR (`.upload(filePath, file)`), yani depolanan MIME tarayıcının
`file.type`'ıdır. Yaygın uzantılarda (pdf/doc/docx/jpg/png/webp) bu doğru gelir, ama
`file.type` boş gelen bir tarayıcı/OS bileşiminde yükleme 400 döner. P1 uygulandıktan
sonra gerçek bir PDF ile uçtan uca denenmesi bu yüzden şart.

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

## ✅ P3(a) İNCELEME BİTTİ (28.09 gece) — bir GERÇEK açık bulundu ve kod tarafı kapatıldı

**`lansman-admin` — açık YOK.** Handler her istekte HTTP 410 döndürüyor; hiçbir veri
okumuyor. Yetki denetimi yok ama denetlenecek bir iş de yok. Tek tuhaflık: 410'dan
önce gereksiz yere bir `service_role` istemcisi kuruyor (satır 67) — zararsız, ölü.

**`relocation-notifications` — GERÇEK AÇIK VARDI.** Fonksiyon `service_role`
istemcisiyle (RLS **atlanır**) `relocation_moves` tablosundan TÜM kullanıcıların
aktif kayıtlarını okuyup döndürüyordu ve **hiçbir kimlik/yetki denetimi yoktu.**

⚠️ **`verify_jwt` bunu kapatmaz — bu tuzağı tekrar etme.** Fonksiyon
`supabase/config.toml`'da listelenmediği için varsayılan `verify_jwt = true` ile
çalışıyor; ama ağ geçidi yalnız *imzası geçerli* bir JWT arar ve **anon anahtarı da
geçerli bir JWT'dir**, üstelik frontend paketinde herkese açıktır. Yani
`verify_jwt = true` görünce "kapalı" sanma.

**Ölçüldü (28.09, canlı):** `relocation_moves` **4 satır, hepsi `draft`**. Fonksiyon
`status = 'active'` filtrelediği için sızıntı o gün **boş dönüyordu** — açık gerçekti,
yalnız ilk kayıt aktifleşene kadar görünmezdi. Karşılaştırma için: tablonun kendi RLS'i
**doğru** (owner-only, 4 policy) — atlatılan tam olarak oydu.
`relocation_bureaucratic_steps` zaten public-read (62 satır), hassas taraf `moves`'tu.
Frontend'de fonksiyonu çağıran **hiçbir kod yok** (yalnız ajan araç kataloğunda geçiyor).

**Yapılan:** `send-notification-emails`'in kanıtlanmış deseni —
`x-dispatch-secret` (sabit zamanlı karşılaştırma) **VEYA** admin JWT'si
(`getUser` + `is_admin` RPC), ikisi de yoksa **401**. `NOTIFY_DISPATCH_SECRET`
canlıda **mevcut** (ölçüldü).
Mantık `_shared/edge-authorization.ts`'e **yeni** dosya olarak kondu; çalışan ve
deploy edilmiş `send-notification-emails` dosyasına **dokunulmadı** (birleştirme ayrı
batch — yalnız tekilleştirme uğruna çalışan bir fonksiyonu yeniden deploy etmek
gereksiz risk).

**Doğrulama:** tsc 0 · lint 0 · **362 dosya / 2.797 test yeşil** (taban 361/2.788;
fark tam olarak eklenen 1 dosya + 9 test) · check:dead 0 yeni / 0 borç ·
verify:text 1.844 dosya.

⛔ **İKİ ADIM KULLANICIDA:**

1. **Commit** — değişiklik çalışma dizininde DURUYOR, commit'lenemedi (izin
   sınıflandırıcısı reddetti). Dosyalar:
   `supabase/functions/_shared/edge-authorization.ts` (yeni) ·
   `...edge-authorization.test.ts` (yeni) ·
   `supabase/functions/relocation-notifications/index.ts`
2. **Deploy** — `supabase functions deploy relocation-notifications --project-ref injprdrsklkxgnaiixzh`
   ⚠️ **Commit tek başına kapıyı KAPATMAZ.** Coolify edge function deploy etmez;
   deploy edilene kadar canlıdaki açık sürüm çalışmaya devam eder.

⚠️ **`npm run ingest:tools:check` çalıştırılamadı** (aynı izin engeli). `src/lib/**`
değişmedi ama katalog edge function'ları da indeksliyor — commit öncesi bir kez koş.

## ✅ P3(b) — ZATEN DEPLOY EDİLMİŞ (28.09 gece ölçümü bu bölümü ÇÜRÜTTÜ)

> ⚠️ **Aşağıdaki "canlıda YOK, deploy edilmeli" tespiti YANLIŞTI ve kaynağı bayat bir
> nottu.** Management API ile doğrudan ölçüldü (28.09 gece):
> `whatsapp-reply` **v17 · ACTIVE** · `whatsapp-webhook` **v17 · ACTIVE**, ikisi de
> **22 Eylül'de** deploy edilmiş. `npm run check:functions` → **repo 12 · canlı 12 ·
> sapma yok.** Yani P3(b)'de **deploy işi yoktur.**
>
> **Ama sorun ortadan kalkmadı, YER DEĞİŞTİRDİ.** Fonksiyonlar canlıda, yalnız dört
> `WHATSAPP_*` secret'ının da özeti birebir aynı — hepsi aynı yer tutucu. Yani durum
> "deploy edilmeyi bekliyor" değil, **"canlıda ama kimlik bilgileri sahte"**.
> `whatsapp-webhook` gelen isteğin HMAC-SHA256 imzasını `WHATSAPP_APP_SECRET` ile
> doğruluyor; yer tutucuyla Meta'dan gelen her istek reddedilir.
>
> ➡️ **Kalan iş deploy değil, GERÇEK META KİMLİK BİLGİLERİNİ girmek** (sende).
> Bu, admin panelindeki 2026-08 kaydıyla da tutarlı: "Meta hesap bilgileri henüz
> verilmediği için WhatsApp bağlantısı şimdilik kapalı."

---

### (tarihsel — çürüyen tespit) P3(b) DEPLOY EDİLMEDİ

`supabase secrets list` ölçüldü: dört `WHATSAPP_*` secret'ı **da mevcut**, ama
dördünün de sakladığı özet değeri **BİREBİR AYNI**
(`222d5bc797cf151200ae02a73b9b7e4037e1c81d8cdcdec0dc29bdf3e7cda423`):

| Secret | Özet |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | `222d5bc7…` |
| `WHATSAPP_APP_SECRET` | `222d5bc7…` |
| `WHATSAPP_PHONE_NUMBER_ID` | `222d5bc7…` |
| `WHATSAPP_VERIFY_TOKEN` | `222d5bc7…` |

Aynı özet = aynı değer. (Bu çıkarım aynı listede doğrulanıyor: `MAIL_FROM` ile
`ZOHO_SMTP_USER` de aynı özeti taşıyor ve ikisinin aynı e-posta adresi olduğu
biliniyor.) Dört ayrı Meta kimlik bilgisinin aynı olması mümkün değildir — bunlar
**yer tutucu**.

➡️ **Sonuç: şimdi deploy etmek fonksiyonu SESSİZCE bozuk canlıya çıkarır.**
`whatsapp-webhook` gelen isteğin HMAC-SHA256 imzasını `WHATSAPP_APP_SECRET` ile
doğruluyor; yer tutucu değerle Meta'dan gelen her istek reddedilir. Plandaki
"secret var mı" kontrolü *varlığı* sorduğu için bu tuzağı yakalamazdı.
**Önce gerçek Meta değerleri girilmeli**, deploy ondan sonra.

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
