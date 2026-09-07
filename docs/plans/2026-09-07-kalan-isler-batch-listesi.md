# CorteQS — kalan işler, tek tek yapılabilir batch listesi

> **Nasıl kullanılır:** yeni bir oturumda yalnız batch numarasını söyle (ör. `S1`).
> Ajan bu dosyayı açar, o batch'i okur ve **başka belge okumadan** yapar.
> Önceki plan (`2026-09-06-kalan-isler-10dk-batch-plani.md`) bunun yerini bıraktı;
> çelişki olursa **bu dosya geçerlidir**.

## Context

Kalan işler bugüne kadar 10 dakikalık batch'lere bölünmüştü
(`docs/plans/2026-09-06-kalan-isler-10dk-batch-plani.md`). Bu plan onu **daha küçük ve
kendi kendine yeterli** parçalara indirir: kullanıcı yeni bir oturumda yalnız **batch
numarasını** söyleyecek ve o batch bağlam kazısı yapmadan, tek başına yapılabilecek.

Bu yüzden her batch aşağıdaki beşini birden taşır: **ne** yapılacak · **hangi dosya** ·
**kabul kriteri** · **tuzak** · **bağımlılık**. Batch'ler arasında bilgi taşınmaz.

**Ölçülen taban (7 Eylül 2026):** `main` = `origin/main` = `77e166a`, bekleyen commit yok ·
`tsc` **9** hata (ölçüldü, CLAUDE.md'nin "Known Limitations" bölümünde hâlâ 12 yazıyor,
o satır bayat) · ESLint **0** · test **259 dosya / 1.816** yeşil · migration 383/383 sapmasız.

**Kullanıcı kararları (bu planı şekillendirdi):**
- Her batch sonunda **tam doğrulama turu** koşulacak (regresyonun hangi batch'ten geldiği
  kesin bilinsin diye).
- Ajan yürütme katmanı ve kullanılmayan shadcn primitifleri **silinecek** — karar verildi,
  batch'ler yazıldı.

---

## Yeni oturum böyle başlar

Kullanıcı `S1` gibi bir numara söyler. Ajan sırasıyla:

1. Bu dosyayı açar, o batch'i okur. **Başka belge okumasına gerek yoktur.**
2. Çalışma dizininin **BÜYÜK harfli** olduğunu doğrular (`C:\temp_private\...`).
   Küçük harfli `c:` ile vitest 266 dosyanın 262'sini **sahte** kırar — Node
   `file:///c:/` ile `file:///C:/` adreslerini farklı modül sayar. Bağımlılık düşürme.
3. Batch'i yapar, kabul kriterini kontrol eder, doğrulama turunu koşar.
4. Taban bozulmuşsa **commit etmez** — batch'i böler ya da geri alır.

### Her batch'in kapanış turu (değişmez)

```
npm run test        # taban 259 dosya / 1.816 — DÜŞERSE DUR
npm run lint        # taban 0 problem
npx tsc -p tsconfig.app.json --noEmit   # taban ARTMAMALI (batch hedefi kadar düşmeli)
```

⚠️ `src/lib` altına **yeni bir export** eklediysen `npm run ingest:tools` çalıştır; yoksa
`scripts/agent/tools-catalog.test.mjs` kırılır ve `npm run check:drift` bunu **görmez**
(ayrı mekanizmalar).

⚠️ Migration yazan batch'lerde: dosya `supabase/migrations/` **parent** dizinine yazılır,
`npm run migrate:apply -- <yol> --dry-run` ile prova edilir, sonra `--dry-run` olmadan
uygulanır. Script dosyayı `applied/` altına **kendisi taşır**. Parent'ta bırakılan dosya
`check:migrations` tarafından görülmez.

---

## Batch grupları

| Harf | Grup | Batch | Toplam süre |
|---|---|---|---|
| **O** | Operasyon — canlı etki, en acil | O1–O5 | ~45 dk |
| **S** | Silme — ölü kod | S1–S3 | ~30 dk |
| **T** | Tip borcu — bitince `tsc` 0 | T1–T6 | ~60 dk |
| **A** | Bileşen içi Supabase → API katmanı | A1–A13 | ~2 sa |
| **Q** | QA turu (elle, tarayıcıda) | Q1–Q12 | ~60 dk |
| **K** | Karar — kod yok, cevap gerekiyor | K1–K4 | ~15 dk |

**Önerilen sıra:** O1 → O2 → S1 → S2 → S3 → T1…T6 → A1 (desen) → A2… → Q1…Q12 → K1…K4

### Tüm batch'ler tek bakışta *(kopyalanabilir kontrol listesi)*

```
O1  hoş geldin maili anahtarı            KRİTİK, canlı
O2  dispatch.secret düz metinden çıkar   GÜVENLİK
O3  iki sahipsiz dosyayı karara bağla
O4  bayat admin-todos kaydını kapat
O5  Burak'a 45 maddelik listeyi sun      insan işi

S1  ajan katmanı 13 ölü dosya            + ingest:tools ZORUNLU
S2  20 kullanılmayan shadcn primitifi
S3  ölü kod analizörünü depoya al

T1  resource-links insert yükü           tsc 9 → 7
T2  LinkManager insert yükü              tsc 7 → 6   (A4'ten önce)
T3  MvpManager insert yükü               tsc 6 → 5   (A2'den önce)
T4  iki test fixture'ı                   tsc 5 → 3
T5  command-center özyineleme 1/2        tsc 3 → 2
T6  command-center özyineleme 2/2        tsc 2 → 0

A1  flat-roles (2 dosya)                 DESENİ BURADA KUR
A2  MvpManager        A3  InterestForm        A4  LinkManager
A5  MessagesInbox     A6  ServiceRequestForm  A7  WelcomePackOrderForm
A8  ServiceRequestsList                   A9  AdminDurumRaporuPage
A10 AdminReferralPage A11 ProfilePage upsert  A12 AdminRolesOverviewPage (4 çağrı)
A13 AdminWhatsAppLandingEditorsPage

Q0  kanarya (1 dk)    Q1–Q12  QA adımları, tarayıcıda

K1  unvan yetki mi verir?                ~%80'i buna bağlı
K2  ek hedef ücretli mi?
K3  m22 kapatılsın mı?
K4  araç sonucu profile kaydedilsin mi?
```

---

## O — Operasyon *(canlı etki; en acil olan burada)*

### O1 — Hoş geldin maili anahtarını aç · ~10 dk · **KRİTİK**

Canlı ölçüm: `email.member_welcome.enabled = false`. Anahtar kapalıyken kaydolan üye
maili **hiç almıyor ve sonradan telafi edilmiyor** — her gecikme mailsiz üye biriktiriyor.
Diğer üç anahtar (`admin_update`, `new_member`, `revision_request`) açık.

**Adımlar:** (1) `notification_settings` tablosunda anahtarı canlıdan doğrula.
(2) **Önce kendine örnek gönder**, mailin geldiğini ve içeriğinin doğru olduğunu gör.
(3) Sonra anahtarı aç. (4) Yeni bir test kaydıyla uçtan uca doğrula.

**Kabul:** anahtar `true`; test hesabına gerçek mail ulaştı.
**Tuzak:** anahtar açılınca geçmiş üyelere toplu mail GİTMEZ — telafi ayrı bir iştir
(WS1-12, `member_reactivation`). Bunu O1 sanma.

### O2 — `dispatch.secret` düz metinden çıkar · ~10 dk · **GÜVENLİK**

`notification_settings` tablosunda düz metin bir gönderim sırrı duruyor ve sıradan bir
`SELECT` ile okunabiliyor. RLS admin ile sınırlıysa risk düşük ama sır bir ayar
tablosunda durmamalı.

**Adımlar:** sırrı Edge Function secret'ına taşı (`supabase secrets set`), fonksiyonu
secret'tan okuyacak şekilde güncelle, tablodaki satırı temizle.
**Kabul:** tabloda düz metin sır yok; bildirim gönderimi hâlâ çalışıyor (bir test maili).
**Tuzak:** sırrı tablodan silmeden ÖNCE fonksiyonun yeni yoldan okuduğunu doğrula —
sıra ters olursa bildirimler sessizce durur.

### O3 — İki sahipsiz dosyayı karara bağla · ~5 dk

`public/sitemap.xml` (yalnız `lastmod` değişmiş) ve
`docs/status/mevcut-profil-yapisi-raporu-2026-08-20-sade-anlatim.html` (takipsiz).
**Dört oturumun** da ilk `git status`'ünde vardılar; kimse dokunmadı.

**Adımlar:** `git diff public/sitemap.xml` ile farkı gör (yalnız tarih mi?), HTML'i aç ve
hâlâ değerli mi bak. Sonra ya commit et ya `git checkout` / sil.
**Kabul:** `git status` temiz.

### O4 — Bayat `admin-todos` kaydını kapat · ~5 dk

`20260802-sonuc-cta-karari` ("Yakında" mı gerçek link mi) 5 Eylül'de çözüldü — CTA'lar
gerçek link. Kayıt hâlâ açık görünüyor ve panelde var olmayan bir iş gösteriyor.

**Dosya:** `src/lib/admin-shell/admin-todos.ts`
**Kabul:** kayıt kapalı; `npm run test` yeşil (bu dosyanın sözleşme testi var).

### O5 — Burak'a 45 maddelik onay listesini sun · ~5 dk · *insan işi*

Rapor hazır: `docs/status/2026-09-05-burak-onay-kuyrugu-kanit-raporu.md`.
Test kılavuzu da yayında: `docs/guides/2026-09-05-burak-gui-test-rehberi.html`.
**Kabul:** iki bağlantı Burak'a iletildi.

---

## S — Silme *(karar verildi; ölü kod)*

### S1 — Ajan yürütme katmanının ölü modüllerini sil · ~10 dk

**Silinecek 13 dosya** (`src/lib/agent/` altında, ~1.259 satır):
`agent-client.ts` + `.test.ts` · `anonymize.ts` + `.test.ts` · `injection-guard.ts` +
`.test.ts` · `resilience.ts` + `.test.ts` · `telemetry-sink.ts` + `.test.ts` ·
`tool-executor.ts` · `tool-verifier.ts` · `tool-orchestration.test.ts`

⚠️ **SİLİNMEYECEK ikisi CANLI:** `tool-router.ts` ve `tools-catalog.generated.ts` —
`AdminAgentAnalyticsPage.tsx` ve `AdminToolRegistryPage.tsx` bunları kullanıyor.

⚠️ **En kritik tuzak:** `tools-catalog.generated.ts` silinecek dosyaları **veri olarak**
listeliyor (12 satır, JSON envanteri — `import` değil). Silme sonrası
**`npm run ingest:tools` çalıştırmak zorunludur**; yoksa `tools-catalog.test.mjs` kırılır.
Üretilen üç dosya (`docs/agent/tools.json`, `src/lib/agent/tools-catalog.generated.ts`,
`docs/agent/openapi.yaml`) commit'e dahil edilir.

**Adımlar:** (1) 13 dosyayı sil. (2) `npm run ingest:tools`. (3) Kapanış turu.
**Kabul:** `src/lib/agent/` altında yalnız `tool-router.ts` + `tools-catalog.generated.ts`
kaldı; test sayısı 9 test kadar düştü (silinen testler); iki admin sayfası hâlâ çalışıyor.

### S2 — Kullanılmayan shadcn primitiflerini sil · ~10 dk

**Ölçüldü (7 Eylül): 49 dosyanın 20'si hiçbir yerden import edilmiyor.**

```
alert-dialog · alert · aspect-ratio · avatar · breadcrumb · calendar · carousel · chart
context-menu · drawer · hover-card · input-otp · menubar · navigation-menu · pagination
resizable · sidebar · slider · toggle-group · use-toast.ts
```

**Batch başında listeyi TEKRAR ölç** (aradan geçen değişiklik kaydırır):
```powershell
Get-ChildItem src/components/ui -File | ForEach-Object {
  $n = $_.BaseName
  $hit = (Get-ChildItem src -Recurse -Include *.ts,*.tsx |
          Select-String -Pattern ("ui/" + [regex]::Escape($n) + '"') | Measure-Object).Count
  if ($hit -eq 0) { $_.Name }
}
```

⚠️ **Üç dosyayı silmeden önce ayrıca düşün:**
- **`use-toast.ts`** — bu bir primitif değil, hook. Uygulama `@/hooks/use-toast`
  kullanıyor; `ui/` altındaki muhtemelen **kopya**. Silmeden önce ikisinin aynı olup
  olmadığını karşılaştır; farklıysa hangisinin canlı olduğunu doğrula.
- **`chart.tsx`** — recharts sarmalayıcısı. 5 Eylül'de sonuç grafikleri işinde "zaten
  kurulu" diye anıldı ama kullanılmadı. Grafik işi tekrar açılırsa istenir.
- **`hover-card.tsx`** — 5 Eylül'de tepki paneli için **bilinçli reddedildi** (Radix
  içindeki odaklanabilir öğelere `tabindex="-1"` veriyor, klavye erişimini kırıyor).
  Gerekçe `CaddePage.tsx` içinde yorum olarak duruyor; dosya silinse de gerekçe kalır.

⚠️ **Tuzak:** `ui/` bir **vendored kit** — silinen primitif shadcn CLI ile yeniden
eklenebilir, bu geri alınabilir bir silmedir.
⚠️ Bir primitifi **başka bir primitif** import ediyor olabilir (ör. `form` → `label`).
Hepsini birden silme; sil → `npm run build` → kırılırsa o dosyayı geri al.

**Kabul:** build yeşil, test tabanı korunuyor, `src/components/ui` 49 → ~29 dosya.

### S3 — Ölü kod analizörünü depoya al · ~10 dk

6 Eylül'de 134 erişilemez dosya bir **oturumluk scratchpad script'iyle** bulundu; script
depoya alınmadı, yani bir dahaki sefere sıfırdan yazılacak.

**Yeni dosya:** `scripts/check-dead-code.mjs` + `package.json`'a `check:dead` script'i.
**Yöntem:** `src/main.tsx` kökünden BFS, `@/` → `src/` çözümlemesi, test dosyaları hariç.

⚠️ **Belgelenmesi zorunlu kör nokta:** config **dizeleriyle** anılan dosyalar yanlış
pozitif çıkar — `src/test/setup.ts` (vitest.config içinde dize) ve `src/vite-env.d.ts`
(ambient bildirim). Bunlar bilinen istisna listesine yazılmalı, yoksa script her koşuda
gürültü üretir ve kimse bakmaz.

**Kabul:** `npm run check:dead` çalışıyor ve bugün **0 yeni** ölü dosya bildiriyor
(istisnalar hariç).

---

## T — Tip borcu *(T1–T6 bitince `tsc` 9 → 0)*

Hataların tam dökümü (7 Eylül ölçümü). Her batch tek dosya, tek kavram.

### T1 — `resource-links.ts` insert yükü · ~10 dk · `tsc` 9 → 7

İki `TS2345`: satır **207** ve **226**. Insert yükü satır tipiyle uyuşmuyor.
**Desen:** yükü açıkça `TablesInsert<"resource_links">` ile tiple. Bu, A sınıfının en
temiz örneği — sonraki üç batch bunun tekrarı.
**Kabul:** `tsc` 7.

### T2 — `LinkManager.tsx` insert yükü · ~10 dk · `tsc` 7 → 6

Tek `TS2345`: satır **299**. T1 ile aynı desen.
**Dosya:** `src/components/dashboard/links/LinkManager.tsx` (994 satır — yalnız insert
çağrısına dokun, refactor'e girişme).
**Kabul:** `tsc` 6.
**Bağımlılık:** A grubunda aynı dosyaya dokunan bir batch var — **T2 önce yapılmalı**.

### T3 — `MvpManager.tsx` insert yükü · ~10 dk · `tsc` 6 → 5

Tek `TS2345`: satır **110**. Yük şu an `{ [x: string]: string }` olarak çıkarılıyor;
gerçek satır tipi verilmeli.
**Dosya:** `src/components/dashboard/mvp/MvpManager.tsx`
**Kabul:** `tsc` 5.
**Bağımlılık:** A grubunda aynı dosya var — **T3 önce**.

### T4 — İki test fixture'ı · ~10 dk · `tsc` 5 → 3

`src/lib/marquee.test.ts:17` (TS2322) ve `src/lib/submissions.test.ts:82` (TS2345).
Fixture'lar üretilen satır tipine uydurulur. İkisi aynı kavram olduğu için tek batch.
**Tuzak:** fixture'ı `as any` ile susturma — hata gerçek bir tip uyuşmazlığı, tipi düzelt.
**Kabul:** `tsc` 3.

### T5 — `command-center-items.ts` özyinelemesi, 1. yarı · ~10 dk · `tsc` 3 → 2

`TS2589` "Type instantiation is excessively deep" — satır **703**.
**Yöntem:** sorgu zincirini böl ya da ara tip ver. Bu, C sınıfının tek kalemi ve en zoru.
⚠️ **Geçmiş uyarı:** `COMMAND_CENTER_SELECT`'e `: string` anotasyonu **denendi ve geri
alındı** — 3 hatayı kaldırdı ama 5 yeni hata üretti. Literal tip KALSIN, tekrar deneme.
**Kabul:** `tsc` 2.

### T6 — `command-center-items.ts` özyinelemesi, 2. yarı · ~10 dk · `tsc` 2 → 0

Kalan iki `TS2589`: satır **750** ve **787**. T5'te bulunan deseni uygula.
**Kabul:** `tsc` **0**. Bu, "relaxed strict mode"u sıkılaştırma tartışmasını ilk kez
masaya koyabilecek durum demektir.

---

## A — Bileşen içi Supabase çağrılarını API katmanına taşı

**Ölçüldü (7 Eylül): 13 dosyada 18 çağrı.** Hedef: `src/lib/*-api.ts` + React Query
(CLAUDE.md "Data Layer" bölümündeki tercih edilen desen; referans `muhasebe-api.ts`).

⚠️ **A1 deseni kurar. Sonraki 12 batch onun tekrarıdır — deseni yanlış kurarsan
12 batch'i birden yeniden yapmak gerekir.** A1'i acele etme.

⚠️ Yeni bir `src/lib` export'u eklediğin **her** A batch'inde `npm run ingest:tools`
çalıştır (S1'deki aynı tuzak).

| Batch | Dosya | Çağrı | Hedef modül | Not |
|---|---|---|---|---|
| **A1** | `profile/RequestNewProfileDialog.tsx` **+** `ProfilePage.tsx:503` | 2 rpc | **yeni** `src/lib/flat-roles-api.ts` | **İkisi de aynı `get_flat_roles` RPC'sini çağırıyor** — deseni burada kur, tek modül iki çağrıyı birden kapatır |
| A2 | `dashboard/mvp/MvpManager.tsx:155` | 1 | **yeni** `mvp-api.ts` | T3'ten SONRA |
| A3 | `InterestForm.tsx:146` | 1 | **yeni** `interest-registrations-api.ts` | insert |
| A4 | `dashboard/links/LinkManager.tsx:412` | 1 | **yeni** `resource-entries-api.ts` | T2'den SONRA; dosya 994 satır, yalnız çağrıyı taşı |
| A5 | `messaging/MessagesInbox.tsx:178` | 1 | **yeni** `messaging-api.ts` | ⚠️ testi `@/components/auth/useAuth` yolunu mock'lar; yanlış yolu mock'lamak sessizce çalışmaz |
| A6 | `ServiceRequestForm.tsx:200` | 1 | **mevcut** `service-finder-api.ts` | yeni modül AÇMA |
| A7 | `WelcomePackOrderForm.tsx:95` | 1 | **yeni** `welcome-pack-api.ts` | |
| A8 | `ServiceRequestsList.tsx:147,151` | 2 | **mevcut** `service-finder-api.ts` | iki update tek işlem; A6'dan sonra |
| A9 | `admin/AdminDurumRaporuPage.tsx:138` | 1 rpc | **yeni** `admin/admin-durum-raporu-api.ts` | |
| A10 | `admin/AdminReferralPage.tsx:96` | 1 | **mevcut** `admin/admin-referral-api.ts` | yeni modül AÇMA |
| A11 | `ProfilePage.tsx:1180` | 1 | **mevcut** `member-profile-api.ts` | `individual_profile_details` upsert; dosya 2818 satır — **yalnız çağrıyı taşı, refactor'e girişme** |
| A12 | `admin/AdminRolesOverviewPage.tsx:56–61` | 4 | **yeni** `admin/admin-roles-overview-api.ts` | dördü de tek `Promise.all` bloğunda, tek modüle birlikte taşınır |
| A13 | `admin/AdminWhatsAppLandingEditorsPage.tsx:45` | 1 | **yeni** `admin/admin-whatsapp-editors-api.ts` | ⚠️ bu ekran daha önce düşürülmüş `user_profiles` tablosuna join yaptığı için canlıda açılmıyordu; taşırken sorgunun `user_role_assignments` kullandığını doğrula |

**Her A batch'inin kabul kriteri:** çağrı bileşenden çıktı, `*-api.ts` modülünde tiplenmiş
bir fonksiyon oldu, bileşen onu React Query (`useQuery`/`useMutation`) ile çağırıyor,
dosyanın mevcut testi hâlâ yeşil.

**A grubu bitince:** `src/components` + `src/pages` altında `supabase.from(` / `supabase.rpc(`
araması **0 sonuç** vermeli. Ölçüm komutu:
```
Get-ChildItem src/components,src/pages -Recurse -Include *.ts,*.tsx |
  Select-String -Pattern 'supabase\.(from|rpc)\(' | Measure-Object
```

---

## Q — QA turu *(elle, tarayıcıda; kılavuz zaten yazılı)*

Kaynak: `docs/guides/2026-09-05-burak-gui-test-rehberi.html`. Her adım ayrı batch, çünkü
tek oturumda 60 dakika ayırmak yerine aralara serpiştirilebilir.

**Q0 — kanarya (~1 dk):** `corteqs.net/cadde/carsi` → kategori rozetine tıkla.
Gidiyorsa yeni sürüm yayında ve Q4–Q12 test edilebilir; gitmiyorsa yalnız Q1–Q3.

| Batch | Ne | Nerede |
|---|---|---|
| Q1 | Kafe temasında "İş" var mı, "HR" → "İK" oldu mu | `/cadde` → Kafe Aç |
| Q2 | ABD/İngiltere ülkeli üye paylaşım yapabiliyor mu | `/cadde` |
| Q3 | Yazı tipi doğru mu (Ctrl+F5) | herhangi bir sayfa |
| Q4 | Çarşı kategori rozetleri filtreliyor mu | `/cadde/carsi` |
| Q5 | Tepki kartı açılıyor, tıklanabiliyor, klavyeyle erişilebiliyor mu | `/cadde` |
| Q6 | "Ek hedef" düğmesi normal üyede gizli mi | `/cadde`, yönetici olmayan hesap |
| Q7 | Boş tanıtım kutusunda maskot çıkıyor mu | `/cadde` sağ kolon |
| Q8 | Sihirbazda ülke ADI yazıyor mu (kod değil) | `/relocation` |
| Q9 | Şehir seçimi listeden mi ve 4. sorudaki ülkeyi mi kullanıyor | `/tools` → Meslek & Maaş |
| Q10–Q12 | Kılavuzun kalan adımları | kılavuzdan oku |

**Kabul (her Q):** kılavuzdaki "Görmeli" satırı gerçekleşti. Gerçekleşmediyse
**düzeltme değil, kayıt**: bulguyu yaz, ayrı bir batch açılsın.

---

## K — Karar *(kod yok; cevap gelmeden arkasındaki iş başlayamaz)*

### K1 — Unvan yetki mi verir, yalnız görünür mü? · ~5 dk

Profil workshop "Rol ve Etiket Mimarisi" (madde 13–16) bunsuz uygulanamaz. Üç bağımsız
tasarım dokuz yargıçtan da 3/10 aldı; yeniden tasarım bu cevaba bağlı.
**"Yalnız görünür" cevabı işin ~%80'ini kaldırır.**
Ayrıntı: `docs/plans/2026-09-05-rol-etiket-mimarisi-karar-notu.md`

### K2 — Ek hedef ücretli mi kalacak? · ~2 dk

`cadde.post.multi_target` kapısı şu an **kapalı** (üye kaybı durdu). Açılacaksa
`afs_features`'a anahtar + rol eşlemesi işi doğar.

### K3 — m22 kapatılsın mı? · ~2 dk

"Enter ile gönder" maddesi WS2-80/81 ile çelişiyor ve canlıda WS2 uygulanmış.
Onaylanmamalı, kapatılmalı — ama bu bir pano kararı.

### K4 — Araç sonucu profile kaydedilsin mi? (`50362e2a`) · ~5 dk

Hangi nitelik (`afs_attributes`) yazılacak ve açık rıza metni ne olacak. İkisi
belirlenmeden kod işi başlamaz.

---

## Doğrulama (planın tamamı için)

Bir batch dizisi bittiğinde:

```
npm run test                              # 259 dosya / 1.816 taban
npm run lint                              # 0
npx tsc -p tsconfig.app.json --noEmit     # T6'dan sonra 0 olmalı
npm run build                             # yeşil
npm run check:migrations                  # 383/383, sapma yok
```

Canlı doğrulama (deploy webhook'u `main` push'unda çalışır):
`curl -I https://corteqs.net/` → `Last-Modified` push saatinden sonra olmalı; ardından
**Q0 kanarya adımı**.
