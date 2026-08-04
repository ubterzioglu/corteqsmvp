# Migration taban çizgisi, arşiv ve sapma kontrolü

**Tarih:** 2026-08-04 · **Kapsam:** `supabase/migrations/**`, `supabase/baseline/`, `npm run check:migrations`

## Neden bu düzen

`supabase/migrations/applied/` 352 dosyaya çıkmıştı ve "hangileri canlıya uygulanmadı?" sorusu
her seferinde elle psql sorgusuyla cevaplanıyordu. İki ayrı sorun vardı:

1. **Kontrol elle yapılıyordu** — asıl maliyet buydu ve dosya sayısından bağımsızdı.
2. Klasör kalabalıktı — ama ölçüldüğünde 8,8 MB'ın 5,8 MB'ı **tek bir dosyaydı**
   (`20260606133000_global_geo_reference.sql`); kalan 351 dosya toplam 3,1 MB.

**Eski dosyalar SİLİNMEDİ.** Silinseydi veritabanı sıfırdan kurulamaz hale gelirdi (yeni ortam,
yerel geliştirme, felaket kurtarma, staging kopyası) — şu an şemanın tek yedeği canlı DB'nin
kendisiydi. Ayrıca RLS politikalarının bugünkü hâline nasıl geldiğinin tek kaydı bu dosyalar;
bu depoda RLS birkaç kez sıfırlandı.

## Bugünkü yerleşim

| Yol | Adet | Anlamı |
|-----|------|--------|
| `supabase/migrations/applied/` | 100 | Taban çizgisi sonrası (≥ `20260615100000`) — çalışma kümesi |
| `supabase/migrations/archive/` | 252 | Taban çizgisi öncesi; **canlıda uygulanmış, asla silinmez** |
| `supabase/baseline/2026-08-04-public-schema.sql` | 1 | Canlı `public` şemasının `pg_dump --schema-only` dökümü |

Taban çizgisi dökümünün kapsamı (alındığı an ölçüldü): 237 tablo, 312 fonksiyon,
481 RLS politikası, 236 RLS-etkin tablo, 342 index, 115 trigger, 5 view, 1568 GRANT.

> `--no-owner` kullanıldı ama **`--no-acl` KULLANILMADI**: Supabase'de `anon`/`authenticated`
> rollerine verilen GRANT'ler RLS kadar kritiktir, ACL'siz bir döküm sessizce yetkisiz bir şema
> üretir.

## Sıfırdan kurulum

```
supabase/baseline/2026-08-04-public-schema.sql   (önce)
  + supabase/migrations/applied/*.sql            (dosya adı sırasıyla)
```

`archive/` bu akışta çalıştırılmaz — içeriği zaten taban çizgisinin içinde. Arşiv, taban
çizgisinin eksik çıkması ihtimaline karşı duran gerçek kaynaktır.

## Sapma kontrolü

```bash
npm run check:migrations        # sapma varsa exit 1
npm run check:migrations:warn   # raporlar, exit 0
```

`applied/` + `archive/` dosya adlarını canlı `supabase_migrations.schema_migrations` tablosuyla
karşılaştırır (session pooler üzerinden psql; `.env.local` içinde `SUPABASE_DB_PASSWORD` gerekir).

- **Bağlanamazsa exit 2** ve bunu açıkça yazar. Başarısız bir kontrol asla "temiz" diye
  raporlanmaz — sessiz yeşil, bu işin en tehlikeli sonucu olurdu.
- Saf karşılaştırma mantığı (`diffMigrations`) DB'siz test edilir:
  `scripts/check-migrations.test.mjs` (11 test).

### Çakışan zaman damgaları (yanlış alarm kaynağı)

İki damga **ikişer dosya** taşıyor:

| Damga | Dosyalar | Canlıdaki kayıt |
|-------|----------|-----------------|
| `20260718120000` | `brainstorming_tables`, `revision_requests_mvp_seed` | `...0000` ve `...0001` |
| `20260718130000` | `remove_world_cup_campaign`, `statusreport_comments_admin_only` | `...0000` ve `...0001` |

`schema_migrations.version` tekil olduğu için her çiftin ikincisi 1 saniye ileri kaydedilmiş.
Bu bir hata değil, gerçekte olan durum. Naif bir "dosya adı ↔ DB sürümü" karşılaştırması burada
**4 yanlış pozitif** üretir; script bunu `expectedVersionsFor` ile modeller (N kopyalı damga için
V, V+1, … V+N−1 bekler).

**Yeni migration yazarken var olan bir damgayı tekrar kullanma** — farklı bir saniye seç.

## Bilinen tuzaklar

- **Tablo canlıda var olması, `schema_migrations` kaydının da var olduğu anlamına gelmez.**
  Bu boşluğa iki kez düşüldü (2026-07-18, 2026-07-20). Uygulamadan önce şemanın gerçek hâline bak.
- **`supabase db push` bu depoda çalışmaz** — CLI yalnız `supabase/migrations/` üst düzeyini okur,
  dosyalar alt klasörlerde olduğu için canlıdaki migration'ları "yerelde yok" sanar.
  `supabase migration repair --status reverted` önerisini **asla çalıştırma**: uygulanmış
  migration'ları geri alınmış işaretleyip geçmişi kalıcı bozar. Daima psql akışını kullan.
- **Direct host (`db.<ref>.supabase.co`) artık çözülmüyor** — yalnız session pooler
  (`aws-1-eu-west-2.pooler.supabase.com:5432`, kullanıcı `postgres.<ref>`) çalışıyor.
- **Türkçe içerikli SQL'i psql'e `-c` ile geçirme** — UTF-8 bozulur; UTF-8 dosya yazıp `-f` kullan.

## Taban çizgisi ne zaman yenilenir?

`applied/` yeniden 150–200 dosyaya yaklaştığında: yeni bir `pg_dump` alınır
(`supabase/baseline/<tarih>-public-schema.sql`), o tarihten eski dosyalar `archive/`e taşınır,
bu doküman ve `CLAUDE.md` sayıları güncellenir. Dosya **silinmez**, taşınır.
