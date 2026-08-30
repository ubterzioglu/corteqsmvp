# Güvenli Migration Runner

Yeni bir migration, SQL gövdesi ve `supabase_migrations.schema_migrations` ledger kaydı aynı
PostgreSQL transaction'ında uygulanarak:

```powershell
npm run migrate:apply -- supabase/migrations/20260831120000_ornek.sql --dry-run
npm run migrate:apply -- supabase/migrations/20260831120000_ornek.sql
```

Not: npm `--dry-run` bayrağını kendi ayarı olarak tüketir; runner bunu
`npm_config_dry_run=true` üzerinden ayrıca algılar. Doğrudan
`node scripts/apply-migration.mjs <dosya> --dry-run` çağrısı da desteklenir.

çalıştırılır.

Runner şu kuralları zorunlu tutar:

- Dosya yalnız `supabase/migrations/` parent dizininde olabilir; `applied/` geçmişi yeniden
  çalıştırılamaz.
- Ad `YYYYMMDDHHMMSS_ascii_snake_case.sql` biçimindedir ve sürüm yerelde benzersizdir.
- Dosyada `BEGIN;`, `COMMIT;`, `ROLLBACK;`, `START TRANSACTION;` veya psql meta komutu bulunamaz.
- `--dry-run` yalnız dosya, ad, çakışma ve SQL güvenlik kontrollerini yapar; DB'ye bağlanmaz.
- Gerçek koşuda `ON_ERROR_STOP` açıktır. Migration veya ledger insert başarısızsa ikisi de geri
  alınır.
- Parola argümana/bağlantı URI'sine girmez ve loglanmaz; yalnız `PGPASSWORD` child-process
  ortamında verilir.
- Başarıdan sonra dosya `supabase/migrations/applied/` altına taşınır.

Runner DB'yi uyguladıktan sonra dosya taşıma başarısız olursa bunu açıkça bildirir. Bu durumda
migration yeniden çalıştırılmaz; dosya elle `applied/` altına taşınır ve
`npm run check:migrations` ile doğrulanır.

Eski migration dosyaları değiştirilmez. Rollback, geçmiş dosyayı yeniden çalıştırmak yerine yeni,
ileri yönlü bir migration ile yapılır.
