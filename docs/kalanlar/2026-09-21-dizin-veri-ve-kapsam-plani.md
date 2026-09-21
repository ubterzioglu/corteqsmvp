# Dizin Verisi ve Arama Kapsamı Planı

**Tarih:** 21 Eylül 2026
**Kaynak:** `docs/plans/2026-09-20-dizin-arama-plani.md` Batch 4 + Batch 5
**Durum:** PLANLANDI — başlanmadı. Ayrılma gerekçesi aşağıda.

> Bütün rakamlar **canlı veritabanında ölçülmüştür** (pooler üzerinden `psql`,
> 21 Eylül 2026). Ezberleme — dokunmadan önce yeniden ölç. Sorguların hepsi
> hafiftir; CLAUDE.md'deki "1 GB RAM" uyarısına uygun olarak `geo_cities`
> (76.990 satır) üzerinde satır-başına fonksiyon çalıştıran sorgu yoktur.

---

## Neden ayrı plan

Dizin/arama planının Batch 0–3'ü **kod işiydi ve bitti** (bkz. o dosyanın
"Uygulama notu" bölümü). Geriye kalan iki batch kod işi DEĞİL:

| Batch | Gerçekte ne | Neden ayrıldı |
|---|---|---|
| 4 — Veri kalitesi | 61 gerçek kişiyi herkese açık yayına almak | Geri alması zor, kişisel veri barındıran **ürün/gizlilik kararı** |
| 5 — Kapsam genişletme | Aramaya yeni kaynaklar eklemek | Ayrı tasarım gerektiriyor + planın yazıldığı hâli **Batch 0 ile çelişiyor** |

Kod tarafı ikisini de beklemeden canlıya çıkabildi; bu yüzden bunları aynı
dosyada tutmak "arama işi bitmedi" yanılgısı üretiyordu.

---

## A. 61 bekleyen uzman kaydı

### A.1 Ölçülen durum

`catalog_items` içinde `status='pending_review'` **363** kayıt var:

| item_type | Adet | Ne |
|---|---|---|
| `organization` | 241 | Elçilik/konsolosluk (aşağıda C) |
| `advisor` | **61** | **Bu bölümün konusu** |
| `member` | 61 | Ayrı sınıf, bu planın dışında |

61 uzman kaydının **hepsinde** veri tam:

| Alan | Dolu |
|---|---|
| Başlık | 61 / 61 |
| Açıklama (`headline` veya `short_description`) | 61 / 61 |
| Şehir | 61 / 61 |
| Ülke | 61 / 61 |
| `visibility='public'` | **0 / 61** (hepsi `private`) |
| `created_by` (sahibi) | **0 / 61** |

Rol dağılımı: `Healthcare_Doctor` 16 · `Consultant_LawTax` 20 ·
`Healthcare_Dentist` 7 · `Consultant_VisaImmigration` 7 ·
`Consultant_RealEstate` 4 · `Consultant_BusinessSetupWork` 3 ·
`Consultant_PsychologistCoach` 3 · `Consultant_PracticalLife` 1.
Konum: ağırlıklı Toronto / Vancouver / Mississauga. Oluşturma tarihi:
**17 Haziran 2026** — `/admin/bulk-import` toplu içe aktarması.

### A.2 Kazanç

Bugün dizinde görünen 249 katalog kaydının yalnız **21'inde** şehir dolu.
Bu 61 kayıt yayına alınırsa şehir doluluğu **21/249 → 82/310** olur. Arama
motoru ne kadar iyi olursa olsun şehir verisi olmadan "Toronto doktor" sonuç
veremez; bu, arama kalitesine yapılacak **tek en büyük katkıdır**.

`/consultants` sayfası da kendiliğinden zenginleşir (bugün 20 yayında kayıt;
sitemap notu bunu zaten öngörmüş).

### A.3 Karar gerektiren nokta

⚠️ **Bunlar gerçek kişiler ve hiçbiri kendi kaydını açmadı.** `created_by`
boş, `verification_status='unverified'`. Yayınlamak, adları + meslekleri +
şehirleri herkese açık ve indekslenebilir hâle getirir. `/directory` 21 Eylül'de
anonim erişime açıldığı için bu artık **giriş yapmış üyelere değil, tüm
internete** görünmek demektir.

Cevaplanması gereken sorular:

1. **Kaynak neydi?** Veriler halka açık bir kaynaktan mı geldi (klinik siteleri,
   meslek odası listeleri), yoksa özel bir listeden mi? Yanıt, yayınlamanın
   meşru olup olmadığını belirler.
2. **KVKK/GDPR dayanağı ne?** Kişiler Kanada'da; GDPR kapsamı tartışmalı ama
   PIPEDA var. `docs/` altında `legal/kvkk` sayfası mevcut — dayanak oraya
   eklenmeli.
3. **Çıkarılma yolu var mı?** Kendi kaydını istemeyen biri nasıl sildirir?
   `catalog_item_claims` akışı sahiplenme için var, **silme için yok**.

### A.4 Önerilen uygulama (karar OLUMLU ise)

Toplu `UPDATE` yapma. Aşamalı git:

1. **Pilot 10 kayıt** — en eksiksiz olanlardan, tek şehir (Toronto).
   `status='published'`, `visibility='public'` yap. `catalog_search_documents`
   trigger'ı otomatik tazeler (`trg_catalog_search_document_items`).
2. `/directory` ve `/consultants` üzerinde **gözle doğrula**: kart doğru
   çiziliyor mu, `/directory/catalog/<slug>` 404 vermiyor mu, iletişim bilgisi
   sızmıyor mu.
3. Sorun yoksa kalan 51'i aynı şekilde aç.
4. Her kayda `attributes` içine kaynak künyesi yaz (`source_note`) — altı ay
   sonra "bu nereden geldi" sorusunun cevabı kalsın.
5. Silme talebi için bir yol aç (en basiti: `/iletisim` üzerinden gelen talebi
   yöneticinin işlemesi; en azından belgelensin).

**Geri alma:** `update catalog_items set status='pending_review',
visibility='private' where id in (...)`. Kimlikleri önceden bir dosyaya yaz.

---

## B. Arama kapsamını genişletme

### B.1 Ölçülen durum — kazanç neredeyse tamamen blogda

Planın orijinal listesi ile canlı veri:

| Kaynak | Canlı kayıt | Aramada | Değerlendirme |
|---|---|---|---|
| Blog | **50** | yok | ✅ **Gerçek kazanç burada** |
| Etkinlik (`events`) | **1** | yok | Veri yok, beklemeli |
| Anket (`surveys`) | **1** | yok | Veri yok, beklemeli |
| Rehber (`/radar/rehberler`) | ölçülmedi | yok | Ölçülmeli |
| Şehir elçisi | 10 | **zaten var** (katalogda) | İş yok |
| İşletme | demo | yok | ⚠️ `/businesses` demo içerik — eklenmemeli |
| Konsolosluk | 241 | yok | Aşağıda C — veri kararı |
| `/tools` | statik | yok | Küçük, kolay |
| **Cadde** | — | yok | ❌ **Eklenmemeli**, aşağıda B.2 |
| İş ilanı | **0** | yok | ✅ Çip zaten kaldırıldı (21.09) |

### B.2 ❌ Cadde aramaya EKLENMEMELİ

Bu, orijinal planın **Batch 0 ile doğrudan çelişen** tek maddesidir.

Cadde `src/App.tsx`'te `RequireAuth` + `RequireFeature(caddeAccess)` arkasındadır
ve bu yüzden **sitemap'ten de bilinçli olarak çıkarılmıştır** (CLAUDE.md,
2026-08-04). Cadde gönderileri üyelerin birbirine yazdığı sosyal içeriktir;
yazarları bunu halka açık yazdıklarını bilmiyor.

21 Eylül'de `/directory` araması anonime açıldı. Cadde içeriğini bu aramaya
koymak, **giriş duvarı arkasındaki sosyal içeriği tüm internete açmak** olur.
Ayrı bir "yalnız giriş yapmış kullanıcıya görünen arama katmanı" tasarlanmadan
bu madde uygulanmamalıdır.

### B.3 Önerilen sıra

**B-1 — Blog (tek gerçek kazanç).**
50 yazı. `catalog_sync_*` köprü deseni zaten var; blog için de benzeri kurulur
ya da arama RPC'sine üçüncü bir dal eklenir. Karar noktası: blog sonuçları
`/directory` içinde mi çıksın, yoksa ayrı bir "site içi arama" yüzeyi mi
kurulsun? **Öneri:** ayrı yüzey — dizin "kim/nerede" sorusunu, site araması
"ne yazılmış" sorusunu cevaplıyor; ikisini tek listede karıştırmak sonuç
sıralamasını bozar.

**B-2 — `/tools` araçları.** Statik liste, PII yok, kolay. Blogla aynı yüzeye.

**B-3 — Rehberler.** Önce say, sonra karar ver.

**B-4 — Etkinlik + anket.** Veri 1'er kayıt. Veri geldiğinde yap; şimdi yapmak
boş çip üretir (İş İlanları hatasının aynısı).

**B-5 — Konsolosluk.** Aşağıdaki C ile birlikte.

⚠️ `src/lib/**` altına yeni dosya ekleyen her batch sonrası
`npm run ingest:tools:check` **zorunludur** — ne lint ne test yakalar.

---

## C. 241 elçilik/konsolosluk kaydı

`Organization_EmbassyConsulate`, hepsi `pending_review`. Bu kayıtlar A'dan
**farklı bir sınıftır**: kurum bilgisi, kişisel veri değil, ve zaten resmî
kaynaklarda halka açıktır. Gizlilik engeli yok.

Buradaki soru kalite: 241 kaydın kaçında adres/telefon güncel? Yanlış konsolosluk
bilgisi yayınlamak, hiç yayınlamamaktan daha zararlıdır. Yayına almadan önce
**örneklem doğrulaması** (10–15 kayıt, resmî siteyle karşılaştır) yapılmalı.

`/directory` bunlarla birlikte 249 → 490 kayda çıkar.

---

## Çıkış kriterleri

| # | Kriter |
|---|---|
| A | 61 kaydın yayın kararı verildi; olumluysa pilot 10 + gözle QA + kalan 51 tamam, geri alma kimlikleri yazılı |
| B-1 | Blog aramada; ayrı yüzey mi dizin mi kararı verilmiş ve belgelenmiş |
| B-2 | `/tools` aramada |
| C | Konsolosluk örneklemi doğrulandı, sonra yayın |
| — | Cadde **eklenmedi** ve bu dosyada gerekçesiyle kayıtlı |
