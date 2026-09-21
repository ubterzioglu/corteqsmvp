# Kadro Konsolu — Küçük Batch Uygulama Planı

**Hedef:** 52 pozisyonluk kadro planını yalnızca yöneticilere açık, geçmiş tutan ve
aday takibi yapan `/admin/kadro` konsoluna taşımak.

**Kaynaklar:**

- Tasarım: `docs/superpowers/specs/2026-09-20-kadro-konsolu-design.md`
- Ayrıntılı uygulama planı: `docs/superpowers/plans/2026-09-20-kadro-konsolu.md`
- Kaynak artifact: `S84nnpXoGob3Y9z7QM7QXi`

## Mimari kararlar

- Rol tanımları ve ilan metinleri kodda, değişken durum DB’de tutulacak.
- DB’de `kadro_role_states`, `kadro_role_events` ve `kadro_candidates` tabloları olacak.
- `kadro_role_events` yalnız trigger ile yazılacak ve silinemeyecek.
- Tüm Supabase erişimi `src/lib/kadro/kadro-api.ts` üzerinden geçecek.
- Admin dışı kullanıcılar kadro rotalarına erişemeyecek.
- Rol tanımları admin panelinden düzenlenmeyecek; değişiklik deploy gerektirecek.
- Public kariyer sayfası ve başvuru formu bu işin kapsamında olmayacak.

## Batch 0 — Kaynak ve çalışma alanı hazırlığı

- Artifact’ın tam içeriğini yeniden al ve yerel kopyasını doğrula.
- 52 rolün isim, bölüm, eksen, dalga, çalışma tipi, öncelik ve ilan metni alanlarını çıkar.
- Artifact’taki mevcut `roles` koleksiyonunun boş olduğunu teyit et; veri taşıma planlama.
- Git çalışma dizinini ve staged index’i kontrol et.
- Kadro dosyalarının mevcut olmadığını doğrula.

**Çıkış kriteri:** Rol verisinin tek güvenilir kaynağı ve aktarım formatı net.

## Batch 1 — Tipler ve taksonomi

Oluştur:

- `src/lib/kadro/kadro-types.ts`
- `src/lib/kadro/kadro-taxonomy.ts`
- Taksonomi sözleşme testi

Tanımla:

- Bölümler ve eksenler
- Dalgalar
- Çalışma tipleri
- Durumlar: `dolu`, `destek`, `gorusme`, `aday`, `teklif`, `acik`, `beklemede`
- Öncelikler: `kritik`, `yuksek`, `orta`, `dusuk`
- Aday aşamaları: `aday`, `gorusme`, `teklif`, `kapandi`
- Ortak ilan blokları

**Çıkış kriteri:** Tipler ve sabit değerler derleniyor; kullanıcı etiketleri Türkçe,
veritabanı anahtarları bilinçli ASCII.

## Batch 2 — 52 rol kataloğu

Oluştur:

- `src/lib/kadro/roles/liderlik.ts`
- `src/lib/kadro/roles/kurumsal.ts`
- `src/lib/kadro/roles/pazarlama-urun.ts`
- `src/lib/kadro/roles/pazarlama-islev.ts`
- `src/lib/kadro/roles/pazarlama-cografya.ts`
- `src/lib/kadro/roles/urun-teknoloji.ts`
- `src/lib/kadro/roles/operasyon.ts`
- `src/lib/kadro/roles/gelir.ts`
- `src/lib/kadro/roles/index.ts`

- Artifact’taki 52 rolü birebir aktar.
- 50 roldeki ilan metnini koru; iki kurucu rolde `ad: null` bırak.
- Rol ID’lerini benzersiz ve sabit tut.
- Bölüm başına rol adetlerini testle kilitle.

**Çıkış kriteri:** 52 rol yükleniyor, hiçbir ID tekrarlanmıyor ve zorunlu alanlar boş değil.

## Batch 3 — Rutinler ve saf iş mantığı

Oluştur:

- `src/lib/kadro/kadro-routines.ts`
- `src/lib/kadro/kadro-view.ts`
- İlgili testler

- 17 rutini sıklığına göre tanımla.
- Her rutinin `owner` alanını gerçek bir `role_key` ile eşleştir.
- Rol ve DB state kayıtlarını birleştiren görünüm modelini oluştur.
- Varsayılan state ile DB state önceliğini sabitle.
- Yetim DB state kayıtlarını görünür bir uyarı/sayaç olarak üret.
- Filtreleme, sıralama ve özet sayaçlarını saf fonksiyonlarda tut.
- Türkçe aramada `trIncludes`, sıralamada `trCompare` kullan.

**Çıkış kriteri:** UI olmadan rol birleştirme, filtreleme ve özet sonuçları test ediliyor.

## Batch 4 — Veritabanı migration’ı ve güvenlik

Oluştur:

- `supabase/migrations/applied/20260920100000_kadro_konsolu.sql`
- Migration sözleşme testi

Migration şunları içerecek:

- `kadro_role_states`
- `kadro_role_events`
- `kadro_candidates`
- Status, priority ve stage CHECK kısıtları
- Gerekli index’ler
- `updated_at` trigger’ları
- State değişikliklerini event tablosuna yazan AFTER INSERT/UPDATE trigger’ı
- Admin-only RLS politikaları
- Event tablosunda DELETE politikasının olmaması

`role_key` için DB foreign key oluşturulmayacak; kod kataloğu kaynak olarak kalacak.

**Çıkış kriteri:** Migration dosyası `applied/` altında, RLS ve trigger sözleşmeleri testte doğrulanıyor.

## Batch 5 — Kadro API ve şemalar

Oluştur:

- `src/lib/kadro/kadro-schemas.ts`
- `src/lib/kadro/kadro-api.ts`
- API testleri

- `LooseQuery` shim’i ile Supabase erişimini tek dosyada topla.
- State kayıtlarını okuma ve upsert etme.
- Aday ekleme, güncelleme ve silme.
- Event geçmişini role göre okuma.
- Zod ile form ve API payload doğrulaması.
- Boş state için kod varsayılanını koru.
- Kaydedilmemiş state’in otomatik yazılmasını engelle; yalnız açık Kaydet işlemi yazsın.

**Çıkış kriteri:** API testleri gerçek UI olmadan state, aday ve event akışlarını doğruluyor.

## Batch 6 — İlan metni ve CSV

Oluştur:

- `src/lib/kadro/kadro-ad-text.ts`
- `src/lib/kadro/kadro-csv.ts`
- İlgili testler

- Rol alanları ile ortak ilan bloklarını birleştir.
- `ad: null` olan roller için ilan metni üretme.
- CSV kolon sırasını sabitle.
- UTF-8 BOM kullan.
- Türkçe karakterlerin Excel’de bozulmadığını test et.

**Çıkış kriteri:** İlan metinleri doğru üretiliyor ve CSV Türkçe karakterlerle açılabiliyor.

## Batch 7 — Admin route ve navigasyon iskeleti

Oluştur:

- `src/pages/admin/kadro/routes.tsx`
- `src/pages/admin/kadro/AdminKadroPage.tsx`
- `src/pages/admin/kadro/AdminKadroMatrisPage.tsx`
- `src/pages/admin/kadro/AdminKadroRutinlerPage.tsx`
- `src/pages/admin/kadro/AdminKadroIlanlarPage.tsx`
- `src/lib/admin-shell/admin-navigation-registry/kadro.ts`

Güncelle:

- Admin route meta kayıtları
- Ana admin navigation registry

Rotalar:

- `/admin/kadro`
- `/admin/kadro/matris`
- `/admin/kadro/rutinler`
- `/admin/kadro/ilanlar`

**Çıkış kriteri:** Dört rota açılıyor, admin olmayan erişim engelleniyor ve menüde Kadro grubu görünüyor.

## Batch 8 — Ana kadro listesi

Oluştur:

- `KadroSummary`
- `KadroFilters`
- `KadroRoleTable`

- Toplam, açık, dolu ve kritik-açık sayaçlarını göster.
- Arama ve bölüm/dalga/tip/durum filtrelerini ekle.
- “Yalnızca açık” filtresini ekle.
- Rolleri bölüm ve eksen başlıklarıyla grupla.
- Yetim DB state varsa görünür uyarı göster.
- Satırdan rol çekmecesini aç.

**Çıkış kriteri:** 52 rol listeleniyor, filtreler Türkçe karakterlerle doğru çalışıyor.

## Batch 9 — Rol çekmecesi ve kayıt akışı

Oluştur:

- `KadroRoleDrawer`
- `KadroEventLog`
- `KadroCandidateList`

- Rol sabit bilgilerini göster.
- Durum, öncelik, sahip ve not alanlarını düzenlet.
- Açık Kaydet düğmesi kullan.
- Kaydedilmemiş değişiklikte kapanış uyarısı göster.
- State kaydedildikten sonra geçmiş listesini yenile.
- Her değişiklikte kim, ne zaman, eski değer ve yeni değer göster.
- Aday ekleme, düzenleme ve aşama değiştirme akışını ekle.

**Çıkış kriteri:** Sayfa yenilendiğinde state korunuyor; event geçmişi ve aday hunisi doğru görünüyor.

## Batch 10 — Matris, rutinler ve ilanlar ekranları

- `KadroMatrix` ile pazarlama matrisini oluştur.
- `KadroRoutines` ile rutinleri sıklığa göre grupla.
- `KadroAdTexts` ile ilan metinlerini göster.
- İlan metni için kopyalama düğmesi ekle.
- CSV dışa aktarımını uygun admin ekranına bağla.

**Çıkış kriteri:** Dört admin rotasının tamamı gerçek veriyle kullanılabilir.

## Batch 11 — Entegrasyon ve sözleşme testleri

Çalıştır ve düzelt:

```powershell
npm run test -- src/lib/kadro
npx tsc -p tsconfig.app.json --noEmit
npm run lint
npm run verify:text
npm run ingest:tools:check
```

Test senaryoları:

- 52 rol ve bölüm adetleri
- Taksonomi ile migration CHECK listelerinin eşleşmesi
- State upsert ve varsayılan state birleşimi
- Trigger ile event geçmişi
- Aday CRUD ve stage doğrulaması
- Türkçe arama: `uskudar` → `Üsküdar`
- CSV BOM ve Türkçe karakterler
- Admin olmayan erişim engeli
- Route/navigation/meta kayıtlarının tutarlılığı

**Çıkış kriteri:** Yeni kadro kodu için en az %80 kapsama ve tüm kontrat testleri yeşil.

## Batch 12 — Migration canlı doğrulama ve tarayıcı QA

- Migration’ı kontrollü şekilde canlıya uygula.
- `npm run check:migrations` çalıştır.
- Admin kullanıcıyla dört rotayı manuel test et.
- Admin olmayan kullanıcıyla erişim engelini doğrula.
- Bir state değiştir, yenile ve event geçmişini kontrol et.
- Bir aday oluştur, aşamasını değiştir ve sil.
- CSV’yi Excel/uyumlu tablo aracında aç.
- CSP ve tarayıcı konsolunu kontrol et.

**Çıkış kriteri:** Üretim ortamında admin kadro konsolu kullanılabilir ve güvenlik kontrolleri temiz.

## Batch 13 — Teslim, commit ve push

- Her batch’in staged kapsamını açık pathspec ile kontrol et.
- `git diff --cached --name-status` ile ilgisiz WIP olmadığını doğrula.
- Kadro değişikliklerini ayrı conventional commit’lerle kaydet.
- Commit mesajlarına proje zorunlu trailer’larını ekle.
- Son doğrulamaları yeniden çalıştır.
- Kullanıcı onayı sonrası `main` branch’ine push et.
- Coolify deploy sonrası release ve smoke test yap.

**Çıkış kriteri:** Kod, migration, testler ve dokümantasyon birlikte izlenebilir; üretimde doğrulanmış durumda.

## Bilinçli kapsam dışı

- Public kariyer sayfası
- Başvuru formu ve bildirim hattı
- Admin’den rol tanımı düzenleme
- Ücret/hisse alanlarının düzenlenebilir hale getirilmesi
- Radar Editörü artifact’ı
- `types.ts` yeniden üretimi

## Genel kabul kriterleri

- `/admin/kadro` altındaki dört rota çalışıyor.
- Yalnız admin kullanıcılar erişebiliyor.
- 52 rol eksiksiz ve benzersiz.
- State değişiklikleri kalıcı ve geçmişli.
- Event geçmişi trigger ile otomatik oluşuyor.
- Aday hunisi çalışıyor.
- Filtreler Türkçe karakterleri doğru işliyor.
- CSV Excel’de Türkçe karakterleri koruyor.
- `npm run test`, `npm run lint`, `tsc`, `check:migrations` ve `ingest:tools:check` başarılı.
