# Turkish Missions Import Builder

Bu paket, Türkiye Cumhuriyeti Dışişleri Bakanlığının resmî yurtdışı temsilcilik sayfalarını tarayarak Supabase / PostgreSQL için doğrudan import edilebilir SQL üretir.

## Neleri kapsar?

Ana tabloda mümkün olduğu ölçüde aşağıdaki temsilcilik türleri tutulur:

- Büyükelçilik
- Başkonsolosluk
- Konsolosluk
- Konsolosluk ofisi

Bağlı birimler ayrı tabloda tutulur:

- Eğitim müşavirliği veya ataşeliği
- Çalışma ve sosyal güvenlik müşavirliği veya ataşeliği
- Ticaret müşavirliği veya ataşeliği
- Din hizmetleri müşavirliği veya ataşeliği
- Basın / iletişim müşavirliği
- Kültür ve tanıtma müşavirliği
- Silahlı kuvvetler ataşeliği
- Diğer bağlı birimler

Her kayıt için standart alanlar çıkarılır. Ayrıca:

- normalize arama alanları,
- çıkarımsal `country_code`,
- veri kalite skorları,
- yapılandırılmış çalışma saatleri,
- değişiklik takibi için `source_hash`

üretilir. Resmî sayfadaki standart dışı veya ayrıştırılması güç içeriklerin kaybolmaması için `raw_snapshot` JSONB alanında kaynak özeti de saklanır.

## Resmî kaynaklar

Ana liste:
`https://www.mfa.gov.tr/yurtdisi-teskilati.tr.mfa`

Randevu sistemi:
`https://www.konsolosluk.gov.tr/`

Temsilcilik iletişim sayfaları genel olarak:
`https://<temsilcilik-subdomain>.mfa.gov.tr/Mission/Contact`

## Windows PowerShell ile çalıştırma

Bu klasörde PowerShell açın:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\build-import.ps1
```

Komut tamamlandığında aşağıdaki dosyalar oluşur:

```text
output\turkish_missions_import.sql
output\turkish_missions.csv
output\turkish_mission_units.csv
output\turkish_mission_relations.csv
output\turkish_missions.json
output\scrape_report.json
```

## İsteğe bağlı çalışma sınırları

Tam tarama uzun sürebilir. Gerekirse ortam değişkenleriyle kapsamı sınırlayabilirsiniz:

```powershell
$env:MAX_AJAX_PAGES = "20"
$env:MAX_DIRECT_SITES = "50"
$env:TIMEOUT_MS = "20000"
$env:EXTRA_WAIT_MS = "1500"
.\build-import.ps1
```

- `MAX_AJAX_PAGES`: AJAX keşif sayfa limiti
- `MAX_DIRECT_SITES`: ziyaret edilecek `Mission/Contact` sayfa limiti
- `TIMEOUT_MS`: sayfa başına timeout
- `EXTRA_WAIT_MS`: ilk bekleme süresi

## Supabase import

1. Supabase Dashboard > SQL Editor bölümünü açın.
2. Önce `schema.sql` dosyasını çalıştırın.
3. Ardından `output\turkish_missions_import.sql` dosyasını çalıştırın.

SQL dosyası tekrar çalıştırılabilir. Kayıtlar `upsert` mantığıyla güncellenir.

## Neden tarayıcı otomasyonu kullanılıyor?

Bakanlığın ana yurtdışı teşkilatı sayfasındaki liste JavaScript ile yüklenmektedir. Script, açılır listeleri ve sayfadaki resmî bağlantıları tarar; AJAX kaynaklarını yakalar; temsilciliklerin resmî `Mission/Contact` sayfalarını ziyaret eder; bağlı birimleri ve fahri konsoloslukları da yakalamaya çalışır.

## Kontrol raporu

`output\scrape_report.json` dosyasında:

- bulunan ana temsilcilik sayısı,
- bağlı birim sayısı,
- ilişki sayısı,
- ziyaret edilen sayfalar,
- düşük güven skorlu kayıt sayısı,
- yapılandırılmış çalışma saatleri çıkarılan kayıt sayısı,
- değişim tespit edilen kayıt sayısı,
- kritik eksik alan özetleri,
- yalnızca sınırlı bilgiyle oluşturulan kayıtlar,
- oluşan hatalar

yer alır.

`needs_review` durumundaki kayıtları manuel olarak gözden geçirmek faydalıdır. Bakanlık sayfalarında bazı eski veya farklı biçimde yazılmış alanlar bulunabilir.
