# Dizin ve Arama Planı

> **Uygulama notu (21 Eylül 2026): Batch 0, 1, 2, 3 TAMAMLANDI ve CANLIDA.**
> Migration `applied/20260921090000_directory_search_anon_normalized.sql`
> (schema_migrations'a işlendi). Doğrulama: `tsc` 0 hata · **300 dosya / 2291
> test yeşil** · `lint` 0 problem · `check:drift` temiz.
>
> **Batch 4 ve 5 bu dosyadan ÇIKARILDI** — ikisi de kod değil veri/ürün kararı.
> Yeni yer: [`docs/kalanlar/2026-09-21-dizin-veri-ve-kapsam-plani.md`](../kalanlar/2026-09-21-dizin-veri-ve-kapsam-plani.md).
>
> Üç şey yazılandan farklı çıktı, ezberleme:
> 1. **RPC'nin `anon` EXECUTE grant'i zaten vardı.** Ziyaretçiyi durduran tek
>    şey gövdedeki `42501` satırıydı. "Grant ekle" diye bir iş yoktu.
> 2. **B20 yönetici elemesi yalnız Branch 2'deydi.** Branch 1'de
>    `Admin_ContentModerator` rolüyle bir kayıt (`is_directory_visible=true`
>    kalmış) SQL filtresinden geçiyordu; onu gizleyen tek şey TypeScript
>    guard'ıydı. RPC anonime açılınca doğrudan API çağıran herkes görürdü.
>    Koşul artık **iki dalda da SQL'de**.
> 3. **"Aramayı `catalog_search_documents` üzerine taşı" birebir uygulanmadı.**
>    O tablonun `search_text` kolonu `catalog_item_contacts` değerlerini içerir
>    (canlıda 336 açık iletişim kaydı) — anonime açık aramada bu, e-posta/telefon
>    doğrulama (enumeration) yüzeyi açardı. Aranan metin RPC içinde AÇIKÇA
>    kurulur; csd'den yalnız PII'siz türetilmiş kolonlar (city, country_code,
>    category_slugs) alınır. `search_catalog` ve rebuild fonksiyonu değişmedi.
>
> Ayrıca "verisiz İş İlanları çipi" (Batch 5'in tek kod maddesiydi) **kaldırıldı**:
> canlıda `job_posting_details` 0 satır, `item_type='job_posting'` 0 kayıt.
>
> Canlı ölçüm, uygulama sonrası (`set role anon`):
> `Berlin'de doktor` **0 → 11** · `yazilimci` (eksiz) **0 → 1** · yönetici
> sızıntısı **1 → 0** · `%` araması **0** (joker enjeksiyonu yok) · `limit=999`
> **→ 100** (tavan) · anonim çağrı **42501 → çalışıyor**.

### Batch 0 — Anonim RPC
- `search_directory_catalog` RPC’sini anonim erişime aç.
- Sayfalı ve PII’siz sonuç döndür.
- Görünürlük ve yönetici elemesini koru.
**Çıkış:** Anonim kullanıcı güvenli sonuç alıyor.

### Batch 1 — Dizin bağlantıları
- `/directory` sitemap’te kalsın.
- İnsanlar kartını ve giriş sonrası `next` akışını test et.
**Çıkış:** Dizin bağlantıları aynı sözleşmede.

### Batch 2 — Normalizasyon
- Aramayı `catalog_search_documents` üzerine taşı.
- `lower(unaccent(...))` uygula.
- Tam eşleşmeleri üste sırala.
**Çıkış:** Türkçe/ek kaynaklı boş sonuçlar azalıyor.

### Batch 3 — Güvenlik testi
- B20 yönetici elemesini ve PII sızıntısı yokluğunu test et.
- Sayaç ve sonuç filtrelerini eşitle.
**Çıkış:** Güvenlik ve sayaç tutarlı.

### Batch 4 — Veri kalitesi → **TAŞINDI**
### Batch 5 — Kapsam genişletme → **TAŞINDI**

İkisi de kod işi değil, veri/ürün kararı olduğu için `docs/kalanlar/` altına alındı:
**[`docs/kalanlar/2026-09-21-dizin-veri-ve-kapsam-plani.md`](../kalanlar/2026-09-21-dizin-veri-ve-kapsam-plani.md)**

Batch 5'in tek kod maddesi olan "verisiz İş İlanları çipini kaldır" **burada
tamamlandı** (çip kaldırıldı, `DiasporaSearchBar.test.tsx` geri gelmesini
engelliyor).
