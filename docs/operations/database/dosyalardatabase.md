# Dosyalar Database Aktarım Standardı

Bu dosya, `resource_entries` tablosuna CSV ile toplu veri aktarım standardını tanımlar.

## Amaç
- Bundan sonra aynı formatta verilecek CSV dosyalarını doğrudan veritabanına aktarmak.
- Aktarım atomik olmalıdır: ya tüm satırlar aktarılır ya hiçbiri aktarılmaz.

## CSV Zorunlu Kolonları
- `order_no`
- `slug`
- `bolum`
- `alt_bolum`
- `kayit_turu`
- `ekleyen`
- `baslik`
- `aciklama`
- `url`
- `file_id`
- `dosya_tipi`
- `mime_type`
- `gizlilik`
- `public_import`
- `import_onerisi`
- `etiketler`
- `source_path`
- `status`

## Mapping
- `order_no -> order_no`
- `slug -> slug`
- `bolum -> section` ve `department`
- `alt_bolum -> subsection` ve `source_subfolder`
- `kayit_turu -> record_kind`
- `ekleyen -> added_by`
- `baslik -> title`
- `aciklama -> description`
- `url -> url`
- `file_id -> file_id`
- `dosya_tipi -> file_type`
- `mime_type -> mime_type`
- `gizlilik -> privacy_level`
- `public_import -> is_public_import`
- `import_onerisi -> import_suggestion`
- `etiketler -> tags`
- `source_path -> source_path` ve `source_folder`
- `status -> status`
- `import_batch -> otomatik batch id`

## Çalıştırma
1. CSV dosyasını proje kökünde `filesnew.csv` olarak güncelle.
2. Aşağıdaki komutu çalıştır:
   - `npm run import:resources:replace`

## Doğrulama Checklist
- Aktarım sonrası satır sayısı CSV satır sayısı ile eşit olmalı.
- `section` distinct değerleri CSV `bolum` ile birebir eşleşmeli.
- `section + subsection` distinct değerleri CSV `bolum + alt_bolum` ile birebir eşleşmeli.
- Hata durumunda tablo yarım dolu kalmamalı (rollback).

