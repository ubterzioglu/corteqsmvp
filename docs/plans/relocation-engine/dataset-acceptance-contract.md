# Relocation Dataset Acceptance Contract

Bir veri seti (resmi dosya, API veya partner feed) relocation motoruna kabul edilmeden önce bu
checklist'i **tam** geçmelidir. Amaç: veri ekibi, backend ve frontend'in aynı sözlüğü konuşması ve
hukuki/teknik riskin adapter yazımından önce kapatılması.

## Kabul Checklist

- [ ] **Kaynak & lisans:** Her dosya/API için kaynak sahibi, erişim yöntemi ve lisans/yeniden kullanım
      koşulu tanımlı mı? Ticari API'lerde cache ve redistribution kısıtları `source-registry.md`'ye işlendi mi?
- [ ] **Encoding & format:** UTF-8 encoding, tarih biçimi, zaman dilimi, para birimi ve locale alanları
      açık mı? (Repo `npm run verify:text` ile UTF-8/mojibake denetimi yapıyor — uyumlu olmalı.)
- [ ] **Birincil anahtar:** Stabil bir PK veya güvenilir dedup anahtarı var mı? Yoksa canonicalization
      kuralı tanımlandı mı? (Worker `dedupe.ts` deseni.)
- [ ] **Geo:** Ülke kodu, şehir kodu, lat/lon, adres normalizasyonu ve hassasiyet seviyesi var mı?
      `geo_countries`/`geo_cities` ile eşleşiyor mu?
- [ ] **PII / hassas:** PII, hassas veya hassasa-yakın alanlar işaretlendi mi? Yasal dayanak, saklama
      süresi ve silme politikası yazıldı mı? (Sağlık/aile → coarse-grained etiket; teşhis verisi YOK.)
- [ ] **Freshness:** Kaynak tazeliği, güncellenme sıklığı ve son başarılı ingest zamanı izlenebilir mi?
      (`freshness_at` + `refresh_sla_hours`.)
- [ ] **Null semantiği:** Null, bilinmiyor, yok, uygulanamaz ve silinmiş değerleri birbirinden ayıran
      semantik sözlük var mı?
- [ ] **Schema validation:** En az 50–200 satır örnek veri ile schema validation (`schemas/*.json`) ve
      mapper testleri (vitest) geçti mi?
- [ ] **Authority level:** Kaynak güvenilirliği ve authority_level dolduruldu mu? official / regulator /
      licensed_commercial / verified_community / user_generated ayrıldı mı?
- [ ] **Backfill:** Backfill ve incremental update stratejisi tanımlandı mı?
- [ ] **Sandbox:** Veri sağlayıcının test/sandbox bilgileri ve rate-limit sınırları kaydedildi mi?

## Fixture kuralı
Gerçek veri gelmeden Faz 1 fixture/seed ile ilerler. `schemas/` altındaki JSON Schema'lar hem fixture
üretimi hem entegrasyon testleri için tek doğru kaynaktır. Fixture'lar `tr-TR` + `en-US` örnek içermelidir.
