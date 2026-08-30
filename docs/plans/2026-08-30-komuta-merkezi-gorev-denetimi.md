# Komuta Merkezi görev denetimi + batch implementasyon planı

> **Durum:** 2026-08-30 · Denetim tamamlandı, uygulama başlamadı.
> **Bu belge soğuk başlangıç içindir** — okuyan ajanın önceki oturumun bağlamına ihtiyacı yoktur.
> Aşağıdaki sayıların hepsi canlı veritabanından `psql` ile ölçüldü, tahmin değildir.
> Uygulamaya başlamadan önce ölçümleri **yeniden doğrula** (her batch'in altında sorgusu var);
> bu repoda "dosyada var" ile "canlıda var" defalarca ayrışmıştır.

## Context

İstek: `https://corteqs.net/admin/workspace/command-center` (Komuta Merkezi) üzerindeki görevleri
incelemek, bitmiş olanları "yapıldı" olarak işaretlemek, bitmemişler için batch batch ayrıntılı bir
implementasyon planı çıkarmak.

Panonun beslendiği yer:
`src/pages/admin/workspace/AdminCommandCenterPage.tsx` → `src/components/dashboard/commandcenter/CommandCenterManager.tsx`
→ `src/lib/dashboard/command-center-items.ts` → `public.command_center_items` tablosu.
Kategori/atanan/durum sabitleri: `src/lib/dashboard/todo-items.ts`.

### Ölçüm (2026-08-30, canlı DB)

| | Baslanmadi | Beklemede | Devam ediyor | Tamamlandi | Toplam |
|---|---|---|---|---|---|
| `meeting_note` | 765 | 406 | – | 223 | 1394 |
| `todo` | 28 | 47 | 3 | 29 | **107** |

Panodaki 1501 aktif kaydın %93'ü toplantı notu. **Gerçek görev sayısı 107, bunun 78'i açık.**

```sql
select item_type, status, count(*)
from public.command_center_items
where deleted_at is null and archived_at is null
group by 1,2 order by 1,3 desc;
```

### Denetim sonucu — dürüst özet

Açık 78 maddeyi tek tek okudum. **Zaten bitmiş olup panoda açık kalan bir madde bulamadım.**
Bunun yerine bulduğum şey daha değerli: bir madde tek bir ayar anahtarı kadar uzakta, bir başkası
için veri canlıda birikiyor ama onu gösteren ekran hiç yok.

Açık 78 maddenin dağılımı:
- **~62 madde kod işi değil** — kişiyle görüşme, FAQ yazımı, Drive klasörü, sosyal medya hesabı,
  ücret/hisse modeli kararı, ambassador bulma. Bunlar UBT/Burak'ın işi; **plan kapsamı dışı**
  (kullanıcı kararı: "sadece kod işi olanlar").
- **~10 madde gerçek mühendislik işi** — aşağıdaki batch'ler.
- **~6 madde kod işi ama önce ürün kararı bekliyor** — en sonda ayrı listede.

Kanıtlanan iki kritik bulgu:

**1. Hoş geldin maili altyapısı canlıda çalışıyor ama anahtarı kapalı.**
`notification_settings` → `email.member_welcome.enabled = false` (2026-07-30'dan beri).
Sonuç: `notification_email_outbox` içinde **16 adet `member_welcome` kaydı `skipped`**, hepsinin
sebebi `global_switch_off`. Aynı dönemde `new_member` tipinin 16'sı `sent`. Yani boru hattı,
trigger, dedupe, retry — hepsi çalışıyor; sadece anahtar kapalı. Madde: `38f7f8ac`.

**2. Kayıt formu ekleri canlıda birikiyor, onları gösteren admin ekranı yok.**
`submissions`: 138 kayıt, **27'sinde `documents`, 25'inde `document_url` dolu**.
`src/lib/submissions.ts` içinde hazır `getSubmissionDocuments()` yardımcısı var, ama
`@/lib/submissions` modülünü **hiçbir admin sayfası import etmiyor** — sadece
`RegisterInterestForm`, `BackerForm`, `FormPage`, `ProfilePage`. Yüklenen 25-27 dosya pratikte
erişilemez durumda. Maddeler: `7c6401c3` + `6ef6797a`.

---

## Batch 0 — İşaretleme dosyası (SQL, uygulama kodu yok)

Karar: işaretlemeler doğrudan canlıya yazılmaz; `docs/operations/` altındaki mevcut guard'lı
desene uyan, gözden geçirilebilir SQL dosyası üretilir
(örnek: `docs/operations/2026-08-30-workshop-cadde-teslim-isaretleme.sql`).

**Önce düzeltilmesi gereken bir yanılgı:** çalışma ağacındaki
`docs/operations/2026-08-30-workshop-cadde-mevcut-kanit-isaretleme.sql` dosyası m70, m77, m91,
m93, m100'ü hedefliyor — **bu beş madde canlıda zaten `ubt_done = true`**. Dosya
`and ubt_done = false` guard'ı taşıdığı için çalıştırılsa 0 satır günceller. O dosyanın işi
bitmiş; tekrar uygulanmasına gerek yok, silmeye de gerek yok (idempotent).

Kalan `...teslim-isaretleme.sql` dosyası (m76, m92, m134, m135) canlıda hâlâ `false` ve
**Batch 1'e bağımlı** — kendi başlığındaki uyarı da bunu söylüyor. Batch 1 bitmeden çalıştırılmaz.

**Yeni yazılacak dosya:** `docs/operations/2026-08-30-komuta-merkezi-isaretleme.sql`
- Aynı `do $$ ... $$` guard deseni: hedef `id` listesi bulunamazsa `raise exception`.
- `command_center_items` için `status = 'Tamamlandi'` yazar; `deleted_at`/`archived_at`'a dokunmaz.
- Her batch tamamlandıkça bu dosyaya ilgili `id` eklenir — **tek dosya, batch başına bir blok**.

Doğrulama sorgusu:
```sql
select id, status, title from public.workshop_items -- veya command_center_items
where item_no = any(array[76,92,134,135]);
```

---

## Batch 1 — Cadde kafe katılım istekleri teslimi (çalışma ağacında yarım duruyor)

Bu batch panodaki bir todo değil ama **Batch 0'ın teslim dosyasını kilitliyor** ve iş zaten
%90 yazılmış halde commit edilmemiş durumda duruyor.

Ölçüm: `20260830100000_cadde_cafe_join_requests.sql` **canlıda uygulanmamış**
(`supabase_migrations.schema_migrations` içinde yok) ve
`select to_regclass('public.cadde_cafe_join_requests')` → **null**. Tablo canlıda yok.

Kapsanan dosyalar (**hepsi commit edilmemiş**, `git status` ile teyit et):
- `supabase/migrations/applied/20260830100000_cadde_cafe_join_requests.sql` (133 satır)
- `src/lib/cadde-api.ts`, `src/lib/cadde-types.ts`, `src/pages/cadde/CaddeCafePage.tsx`,
  `src/pages/cadde/CaddePage.tsx`, `src/components/cadde/CaddePostComments.tsx`
- Yeni testler: `src/lib/cadde-cafe-join-requests.test.ts`, `src/lib/cadde-promotion-flow.test.ts`,
  `e2e/cadde-staging-multiuser.spec.ts`
- İlgili test güncellemeleri: `src/pages/cadde/CaddePage.test.tsx`, `CaddeCafePage.test.tsx`

Adımlar:
1. `npm run test` — üç yeni test dosyası dahil tam süit yeşil olmalı.
2. Migration'ı canlıya `psql -v ON_ERROR_STOP=1 -f <dosya>` ile uygula. Türkçe içerik var →
   **komut satırından değil, dosyadan** (CLAUDE.md Türkçe kuralı 4; PowerShell ı→i bozar).
3. `npm run check:migrations` — sapma yok **ve parent dizinde stray dosya yok**. Dosya zaten
   `applied/` altında, orada kalmalı.
4. Commit + push, sonra Coolify deploy.
5. Staging'de iki gerçek kullanıcıyla E2E: kafeye katılım talebi → sahibe bildirim → sahip
   talep edenin profilini görüyor → kabul/red. (`e2e/cadde-staging-multiuser.spec.ts` bunu kapsıyor.)
6. E2E geçerse **Batch 0'ın teslim dosyasını uygula** (m76, m92, m134, m135).

Dikkat: `CaddePostComments.tsx` değişikliği m134'ün ("yorum yazınca sayfa hataya geçiyor,
eklenen görsel...") karşılığı — E2E'de yorum + görsel ekleme yolunu ayrıca elle doğrula.

Cadde'ye dokunurken CLAUDE.md'nin "Cadde 3.0 Rules" bölümü geçerli: mutasyonlar yalnız
security-definer RPC üzerinden, yeni hata kodları `cadde-rules.ts` Türkçe mesaj haritasına
eklenir, yeni `cadde_*` tablosu `diaspora_key` + CHECK taşır.

---

## Batch 2 — Hoş geldin maili anahtarını aç (`38f7f8ac`)

En küçük iş, en yüksek getiri. Kod yazılmayacak; **doğrulama + tek ayar**.

Madde: "Kayıt olanlara email otomasyonu. Görsel + Hoşgeldiniz, artı kısa yol haritası mesajı"

Mevcut durum kanıtı:
```
email.member_welcome.enabled | false      (notification_settings)
member_welcome | skipped | 16 | last_error = global_switch_off
new_member     | sent    | 16
```
Migration `20260729140000_member_welcome_email.sql` canlıda **kayıtlı ve uygulanmış**.
Altyapı `notification_email_outbox` üzerinden; `dedupe_key` UNIQUE, `claim_notification_emails`
(`for update skip locked`), retry ve panel logu miras alınıyor. Tek yapısal farkı alıcısının
üyenin kendisi olması (`payload.email`) — bu yüzden `admin_get_notification_subscribers`'a
hiç uğramaz.

Adımlar:
1. Bildirim ayarları panelinden **"örnek mail" gönder** — göz kontrolü. Migration'ın kendi
   yorumu bunu şart koşuyor. (Panel kaydı: `src/lib/admin-shell/admin-navigation-registry.ts`,
   "Yeni üye ve güncelleme e-postalarını aç/kapa" satırı.)
2. E-posta HTML'ini kontrol et: **görsel + hoş geldiniz + kısa yol haritası** mesajı — maddenin
   metni üçünü de istiyor. Eksikse şablonu güncelle: `supabase/functions/send-notification-emails`.
3. **Geriye dönük 16 `skipped` kayıt için karar ver.** Migration bilinçli olarak backfill yapmıyor;
   trigger yalnız yeni doğrulama geçişlerinde çalışıyor. Bu 16 kişiye mail gitsin isteniyorsa
   ayrı, tek seferlik ve dedupe'a saygılı bir requeue SQL'i yazılır.
   **Varsayılan: gitmesin** — bazıları bir aylık, bugün gelen "hoş geldin" maili tuhaf kaçar.
4. `email.member_welcome.enabled = true` yap — **panelden, SQL'den değil**, ki `updated_by` dolsun.
5. Yeni bir test kaydıyla uçtan uca doğrula: outbox'ta `sent`, gelen kutusunda mail.
6. `38f7f8ac` → Batch 0 dosyasına ekle.

Risk: anahtar açılınca **her yeni doğrulanan üyeye** mail gider. Rollback tek ayar
(`enabled = false`) — geri dönüş maliyeti sıfır.

Doğrulama:
```sql
select event_type, status, count(*), max(created_at)
from public.notification_email_outbox group by 1,2 order by 1,2;
-- member_welcome | sent satırı görünmeli
```

---

## Batch 3 — Kayıt formu ekleri + üye takibi ekranı (`7c6401c3`, `6ef6797a`)

İki madde tek özellik. En çok gerçek değer üreten kod işi.

Madde metinleri:
- `7c6401c3` "Kayıt Formu ile gelen ekleri ne yaptık, üye paneline ek için link verecek miyiz?
  Bu ara trafik artarsa kaçırmayalım ekleri"
- `6ef6797a` "Üyelerin kayıtta bıraktıkları Açıklama (ihtiyaç vs.) + yükledikleri dosyaları
  ÜYE TAKİBİ modülümüzde görebilir miyiz. Açıklamalardan 'iş arıyorum'ları filtre etsek gibi"

Mevcut zemin (**yeniden yazma, kullan**):
- `src/lib/submissions.ts` — `getSubmissionDocuments()`, `buildSubmissionSearchText()`,
  `allowedSubmissionDocumentTypes`, `maxSubmissionDocumentBytes/Count`, `submissionStatusOptions`,
  `getCategoryLabel` / `getStatusLabel` / `getFormTypeLabel`. Hepsi hazır, saf, test edilebilir.
- Alanlar canlıda mevcut: `description`, `offers_needs`, `documents` (Json), `document_url`,
  `document_name`, `status`, `reviewed_at/by`, `referral_*`, `onboarding_key`.
- Türkçe arama için **`trIncludes`** (`src/lib/text-normalization.ts`) — "iş arıyorum" filtresi
  bare `toLowerCase()` ile yazılırsa Türkçe'de yanlış çalışır (CLAUDE.md Türkçe kuralı 1).

Yapılacak:
1. `src/lib/admin/admin-submissions-api.ts` — `admin.ts` barrel'ının domain modülü deseniyle
   (`src/lib/admin/*.ts`, 7 domain API zaten var). İçerik: `fetchSubmissions(filters)`,
   `updateSubmissionStatus(id, status)`, imzalı dosya URL'i üretimi.
   **PostgREST 1000 satır kesmesine karşı `Range` sayfalama** (CLAUDE.md sözleşme 5; referans
   desen `scripts/generate-sitemap.mjs` içindeki `fetchAllRows()`). Bugün 138 kayıt var ama
   kesme sessizdir — hata dönmez, eksik veri döner.
2. `src/pages/admin/AdminSubmissionsPage.tsx` (+ `src/components/admin/submissions/`) —
   muhasebe desenine uygun: React Query `useQuery`/`useMutation`, liste + detay dialog.
   Detayda: açıklama, `offers_needs`, ek dosyaları indirilebilir liste, referans bilgisi,
   durum değişimi.
3. Filtreler: durum, form tipi, kategori, tarih, **serbest metin (`trIncludes` ile)** ve
   "ek dosyası olanlar" toggle'ı. "İş arıyorum" için hazır bir kayıtlı filtre çipi ekle.
4. Depolama erişimi: `documents` içindeki yolların hangi bucket'ta olduğunu doğrula; admin
   tarafında **imzalı URL** üret, public URL sızdırma.
5. Rota + navigasyon: `src/App.tsx` (lazy import) + `src/lib/admin-shell/admin-navigation-registry.ts`
   "Üyeler ve Dizin" grubuna kayıt. `RequireAuth` + admin gate.
   **Sitemap'e eklenmez** (auth arkasında — CLAUDE.md sözleşme 4).
6. RLS: `submissions` üzerinde admin okuma politikasının var olduğunu **test ortamında** doğrula;
   yoksa yeni migration. RLS'in bu repoda sıfırlanma geçmişi var, körlemesine ekleme.
7. Testler (TDD, hedef %80): `admin-submissions-api.test.ts` (filtre + sayfalama),
   `AdminSubmissionsPage.test.tsx` (liste / detay / eksik dosya durumu),
   Türkçe arama testi: "is ariyorum" → "İş Arıyorum" bulmalı.
8. Her iki `id`'yi Batch 0 dosyasına ekle.

Doğrulama:
```sql
select count(*) total,
       count(*) filter (where coalesce(description,'') <> '') as has_desc,
       count(*) filter (where documents is not null and documents::text not in ('null','[]','{}')) as has_docs,
       count(*) filter (where document_url is not null) as has_doc_url
from public.submissions;
-- 2026-08-30 ölçümü: 138 | 3 | 27 | 25
```
Yeni ekranda ek dosyası olan 27 kaydın listelendiğini say.

---

## Batch 4 — Komuta Merkezi'nin kendi UX maddeleri (`e7debd72`, `bb0c2b6b`, `b923edf8`)

Küçük ama panoyu kullananın her gün gördüğü şeyler.

### `e7debd72` — "Yeni todo eklerken kime: B+B (Barış+Burak) opsiyonu"

Ölçüldü, yapılmamış. **İki taraflı iş** — sadece TS sabitini değiştirmek canlıda sessiz
INSERT hatası verir:

```ts
// src/lib/dashboard/todo-items.ts:16
export const TODO_ASSIGNEES = ['Atanmadi', 'UBT', 'Burak'] as const
```
```sql
-- canlı CHECK constraint
command_center_items_assignee_check
  CHECK (assignee = ANY (ARRAY['Atanmadi'::text, 'UBT'::text, 'Burak'::text]))
```

- Yeni migration: CHECK'i `'B+B'` içerecek şekilde drop/add. Constraint adı bilinen olduğu için
  doğrudan adla düşürülebilir, ama `20260729140000` dosyasındaki "ada güvenme, tara" deseni
  daha güvenli.
- `TODO_ASSIGNEES`'e `'B+B'` ekle; `ASSIGNEE_LABELS`
  (`src/lib/dashboard/command-center-items.ts` ~satır 196) etiketini ver ("Barış + Burak").
- `CommandCenterManager.tsx` dört yerde `TODO_ASSIGNEES.map` yapıyor (~639, ~811, ~1314 ve form) —
  sabitten üretildiği için kendiliğinden gelir. **Sayım/facet tarafını gözden geçir:**
  `buildCommandCenterItemCounts` ve `v_command_center_facets` view'ı.
- Test: `validateCommandCenterFormState` yeni değeri kabul etmeli.

### `bb0c2b6b` — "Kategorilere Sosyal Medya eklesek"

Bugün `'İçerik, SEO & Sosyal Medya'` kategorisi var (`todo-items.ts:5`, 12 kategoriden biri).
Yani istek **kısmen karşılanmış**. Ayrı bir `'Sosyal Medya'` kategorisi açmak mevcut 9 kaydı
ikiye böler.

**Bu bir ürün kararı — UBT'ye sorulmadan yapılmaz.** Önerim: yapılmasın, madde "mevcut kategori
kapsıyor" notuyla kapatılsın. Karar aksi yönde çıkarsa: kategori sabiti + mevcut kayıtların
taşınması için tek seferlik SQL (kategori de CHECK constraint'li olabilir, önce kontrol et).

### `b923edf8` — "uiea" / detay "uieauieauieaiuea"

Test sırasında bırakılmış çöp kayıt, `urgent = true` olduğu için panoda **acil** olarak görünüyor.
Batch 0 dosyasına **soft-delete** (`deleted_at = now()`) olarak eklenir — `Tamamlandi` değil.

---

## Batch 5 — Referral QR üretimi (`c0dc7a45`)

"Bir veya amacına göre birkaç QR üretip dashboard'a koyalım referral gibi, postlarda kullanırız."

Ölçüldü: repoda **hiçbir QR kütüphanesi yok** (`package.json` ve `src/` taramasında 0 eşleşme).
Zemin var: `src/pages/admin/AdminReferralPage.tsx`, `referral_*` tabloları,
`submissions.referral_code` / `referral_code_id`.

Yapılacak:
1. Kütüphane seçimi. **SVG üreten bir çözüm tercih edilmeli** — sosyal medya postu için
   ölçeklenebilir ve indirilebilir. Repoda zaten SVG + Sharp ile görsel üretim deseni var
   (LinkedIn görsel üretim sistemi, `scripts/`) — önce ona bak, aynı boru hattına oturabilir.
2. `src/lib/referral-qr.ts` — referans kodundan hedef URL + QR SVG üretimi (saf fonksiyon,
   test edilebilir).
3. `AdminReferralPage` içine kod başına "QR indir" (PNG + SVG).
4. **CSP uyarısı:** harici QR servisi (api.qrserver.com vb.) **kullanma** —
   `nginx.conf.template` CSP'si buna izin vermez ve `'unsafe-inline'` eklenmez
   (CLAUDE.md sözleşme 3). Üretim istemcide/build'de yapılmalı.
5. Test: URL üretimi + kod normalizasyonu; snapshot yerine deterministik SVG içerik testi.

---

## Batch 6 — VIP davet / özel onboarding sayfası (`0c5f21a7`)

"LP'ye htm special invitation eklesek. WhatsApp/LinkedIn yazışma sonrası bir VİP onboard sayfası
gönderiyorum size gibisinden... Dernek, Vakıf, İş adamları dernekleri / CEO, Konsolos gibi ağır
toplara göndersek (referralını koysak: VİP onboard / privileges / notlar)."

Zemin: `submissions.onboarding_key` alanı **zaten var**; `src/lib/pending-onboarding-api.ts:166`
onu yazıyor ve `src/lib/submissions.ts:453` üzerinde UNIQUE ihlali yakalıyor. Yani "kişiye özel
davet anahtarı" kavramı kısmen kurulu — **sıfırdan şema açma**.

Yapılacak:
1. **Ürün kararı netleştir:** davet sayfası kişiye özel mi (key ile) yoksa tek statik VIP sayfası mı
   (referral kodlu)? Madde metni ikisini de ima ediyor. Bu karar alınmadan kod yazılmaz.
2. Kişiye özel seçilirse: `/vip/:key` rotası, key ile ön-doldurulmuş kayıt formu,
   `onboarding_key` üzerinden eşleştirme, admin tarafında davet üretme ekranı.
3. SEO: sayfa **`noindex`** olmalı ve **sitemap'e girmez** — kişiye özel ve thin content,
   CLAUDE.md sözleşme 4'ün üç kriterinden ikisini karşılamıyor.
4. Kalıcı bir `/vip` yolu açılıyorsa `nginx.conf.template` ve `src/lib/redirects.ts` tarafında
   çakışma olmadığını doğrula; `src/lib/redirects.test.ts` yeşil kalmalı.

---

## Kod işi ama önce ürün kararı bekleyenler (batch açılmadı)

Bunlar mühendislik işi içeriyor ama bugün başlanamaz — hepsinin önünde bir karar var.

| id | Madde | Neyi bekliyor |
|---|---|---|
| `387ae286` → `c7632c0c` | WhatsApp bot mimarisi (resmi vs alternatif) → "Bot → admin panel Müşteri Talepleri entegrasyonu" | Mimari karar. Repoda "Müşteri Talepleri" diye bir modül **yok**; hedef ekran tanımsız. Ayrıca `6054132a` (admin bot), `f2f1ea82` (kanal bot), `62a83bd6` (mastermind bot), `4e8ad5e2` (role-based bot), `772bc920` (multi-lingual/DM/kategori bot) hepsi bu karara bağlı — **tek epic, 6 madde**. |
| `fc13bebf` | MVP V2 merge kapsamı (`Devam ediyor`, acil) | Madde "WhatsApp grup post özelliği çalışıyor, akışı açalım" diyor — ama **2026-08-04'te WhatsApp grup sayfaları silindi** (`WhatsAppGroupLanding`, `WhatsAppGroups`; sıfır importer, ölü rota). Madde bayat; kapsamı yeniden yazılmadan uygulanamaz. Önce alt maddelere bölünmeli. |
| `5aae97f2` | Platforma girişte filtreleme, davranış güvenliği, izolasyon/red/çıkarılma sistemi | Cadde tarafında ban kill-switch (`has_cadde_feature`) + rapor/moderasyon RPC'leri **zaten var**; istenen platform geneli. Maddede atıf yapılan "Güvenlik Klasörü"ndeki araştırma dosyası okunup kapsam daraltılmalı. |
| `4e74a927` | Chat grupları smart post planı + export'ların ERP'ye girmesi | Kod kısmı yalnız export; gerisi içerik planı. Bölünmeli. |
| `a3fd7819` + `12c929da` | Vlogger verilerini tool'lara entegre etme (**mükerrer çift**) | Araştırma maddesi; hangi veri, hangi tool tanımsız. |

---

## Kapsam dışı bırakılanlar (bilgi)

Açık 78 maddenin ~62'si kod işi değil: kişiyle görüşme (`5eee0947`, `0818c7a2`, `e9d07c8b`),
doküman/FAQ yazımı (`b95ede67`, `a6a9c566`, `9e7ef07e`, `48631e43`), Drive/HR klasör yapısı
(`30812dcd`, `1a1573b5`, `c0014f12`, `be4adf74`, `283facbd`), sosyal medya ve marketing
(`ccd1d97f`, `c23d243e`, `e950128e`, `60340076`, `622f5cc5`), ücret/teklif modeli
(`516fa86f`, `9571e7e8`, `8bc6dc61`, `1e28d689`), strateji (`9fa1b3e3`, `fa50ccc7`, `37ee0367`, …).

Ayrıca **pano hijyeni** olarak şunlar tespit edildi (kapsam dışı, bilgi olarak — istenirse ayrı
temizlik batch'i açılır):

**9 mükerrer çift**
| | |
|---|---|
| `37ee0367` ↔ `bf5485fd` | Tech cost fizibilite matrisi |
| `fa50ccc7` ↔ `75454af7` | RASCI |
| `ed00d945` ↔ `622f5cc5` | Gerilla paylaşımlar |
| `9fa1b3e3` ↔ `f7a1ee76` | DATA / veri stratejisi |
| `78120e82` ↔ `2a87081d` | Ekip ücret & hisse |
| `3211bf9a` ↔ `b25cde7e` | CorteQS yönetim kullanıcı profili |
| `a3fd7819` ↔ `12c929da` | Vlogger verileri |

**Görev olmayan 2 karar notu:** `451805ef` ("Remiks'e gerek yok, Burak devam edecek"),
`0a569d3f` ("Burak teknik todolar için Barış'a topu atıyor").

Bu, 2026-06-26'daki "43 kopya soft-delete" temizliğinin tekrar birikmiş hali — pano zamanla
yeniden kirleniyor.

---

## Doğrulama

Batch başına, sırayla:

1. `npm run test` — tam süit yeşil. Yeni kod için `npm run test -- <dosya>` ile hedefli koşum.
2. `npm run lint` — yeni dosyalarda sıfır yeni hata (repoda 1280 önceden gelen problem var;
   sayının **artmadığını** doğrula, sıfırlamaya çalışma).
3. Migration eklendiyse: `psql -v ON_ERROR_STOP=1 -f <dosya>` (Türkçe içerik → **dosyadan**,
   komut satırından değil) → `npm run check:migrations` (sapma yok **ve** parent dizinde stray
   dosya yok). Dosya `applied/` altında yaşar; parent dizin sürüm karşılaştırmasına dahil değildir.
4. `npm run build` → Coolify deploy → `BASE_URL=https://corteqs.net npm run verify:release`.
5. Yeni rota/asset eklendiyse deploy sonrası: `curl -I https://corteqs.net/` ile güvenlik
   başlıkları geliyor mu, tarayıcı konsolunda CSP ihlali var mı.
6. **Ölçerek doğrula, ezberleyerek değil** — her batch'in altındaki SQL'i çalıştır.
7. En son: `docs/operations/2026-08-30-komuta-merkezi-isaretleme.sql` çalıştırılır ve panoda
   ilgili maddelerin `Tamamlandi`'ya geçtiği **ekrandan** görülür.

### ⚠️ Canlı DB uyarısı

Production örneği **904 MB RAM** ile çalışıyor ve 2026-08-05'te tek bir keşif sorgusu siteyi
~50 dakika düşürdü. Doğrulama sorguları küçük tutulmalı; `geo_cities` (76.990 satır) veya
`geo_countries` üzerinde **satır başına fonksiyon çağıran sorgu yazılmaz** — önce
`select distinct` ile değer kümesini daralt, sonra join et.

### DB bağlantısı (bu oturumda çalıştığı doğrulandı)

```
host=aws-1-eu-west-2.pooler.supabase.com port=5432
user=postgres.injprdrsklkxgnaiixzh dbname=postgres sslmode=require
```
Şifre `.env.local` içindeki `SUPABASE_DB_PASSWORD`. Windows'ta `$env:PGCLIENTENCODING='UTF8'`
ayarla, yoksa Türkçe çıktı bozulur.
