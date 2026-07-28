# Handover — Muhasebe "Bütçe" Sekmesi

**Tarih:** 2026-07-28
**Durum:** Kod tamam, doğrulandı, **merge edilmedi**. Canlıya çıkmak için 3 adım kaldı (aşağıda).

## Ne yapıldı

Kök dizindeki tek dosyalık statik prototip `muhasebenew.html` (vanilla JS + `window.storage`),
muhasebe modülünün mimarisine uygun bir React route'una dönüştürüldü: **`/admin/muhasebe/butce`**.
Sekme, `MuhasebeLayout` sekme çubuğunda "Bütçe" olarak görünür (Dashboard / Giderler / Gelirler /
Nakit Akışı'ndan sonra).

Prototipin tüm işlevleri korundu: 4 departmanın bütçe/gerçekleşen tablosu, sabit veya net-gelir
yüzdesi alokasyonu, çoklu para birimi (USD/EUR/TRY kur varsayımlarıyla), gelir kalemleri
(adet × birim fiyat × komisyon), konsolide nakit akışı, runway/burn hesabı ve CSV export.

## Branch

| | |
|---|---|
| Worktree | `c:\temp_private\corteqs\corteqs_fin\.claude\worktrees\muhasebe-butce-sekmesi` |
| Branch | `worktree-muhasebe-butce-sekmesi` |
| Commit aralığı | `7ce3b26` … `6bfd85e` (13 commit) |
| Base | `main` (`8c8243c` = plan dokümanı commit'i) |

Branch `main`'e **merge edilmedi**. Merge komutu için "Kalan işler" bölümüne bak.

## Doğrulama sonuçları (hepsi bu branch üzerinde koşuldu)

| Kontrol | Sonuç |
|---|---|
| `npx tsc --noEmit` | ✅ çıkış kodu 0, hata yok |
| `npm run build` | ✅ başarılı |
| Bütçe sekmesi testleri (8 dosya) | ✅ **36/36 geçti**, React uyarısı yok |

Test dosyaları: `muhasebe-butce-schemas` (5), `muhasebe-butce-aggregations` (12),
`muhasebe-butce-csv` (3), `useMuhasebeButce` (4), `BudgetMonthTable` (2),
`DepartmentBudgetPanel` (4), `RevenuePanel` (3), `ConsolidatedCashflowPanel` (3).

> **Not:** Repoda bu branch'ten **önce de** var olan 3 test hatası mevcut
> (`src/App.aiform-routes.test.tsx`). Bizim değişikliklerimizle ilgisi yok, baseline'da da vardı.

## Eklenen dosyalar

```
supabase/migrations/20260728090000_create_muhasebe_butce_state.sql   (canlıya UYGULANMADI)

src/lib/muhasebe-butce-schemas.ts          tipler + Zod şeması + sabit DEPTS/REV_SEEDS + seedYear()
src/lib/muhasebe-butce-aggregations.ts     12 pure hesaplama fonksiyonu (fx, alokasyon, runway, burn)
src/lib/muhasebe-butce-api.ts              fetchButceYear / upsertButceYear
src/lib/muhasebe-butce-csv.ts              buildButceCsv (saf string) + downloadButceCsv (BOM'lu Blob)

src/hooks/useMuhasebeButce.ts              useButceYear / useSaveButceYear / useDebouncedButceSave

src/components/admin/muhasebe/BudgetMonthTable.tsx     paylaşılan MonthRow (12 aylık input satırı)

src/pages/admin/muhasebe/butce/ButcePage.tsx                    container (yıl seçici, CSV, iç sekmeler)
src/pages/admin/muhasebe/butce/DepartmentBudgetPanel.tsx        departman tablosu + alokasyon + KPI
src/pages/admin/muhasebe/butce/RevenuePanel.tsx                 gelir tablosu + komisyon
src/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel.tsx    parametreler + runway + konsolide tablo
```

Değiştirilen (cerrahi, 2 dosya): `src/pages/admin/muhasebe/routes.tsx` (lazy route),
`src/pages/admin/muhasebe/MuhasebeLayout.tsx` (Bütçe sekmesi + `Wallet` ikonu).

## Mimari kararlar

- **State tek JSONB blob'da.** `muhasebe_butce_state` tablosu: `year` (unique) + `state` (jsonb).
  Normalize şema yerine blob tercih edildi — kapsam bilinçli olarak küçük tutuldu. İleride
  normalize edilmek istenirse ayrı bir migration işi.
- **Departman ve gelir kategorileri sabit kodlu** (`DEPTS`, `REV_SEEDS`), prototiple aynı.
  Kullanıcı kalem ekleyip silebilir; departman/kategori kümesi değişmez. Bu kasıtlı.
- **Otomatik kayıt**: input değişince 700 ms debounce ile Supabase upsert
  (`useDebouncedButceSave`), UI'da "kaydediliyor… / kaydedildi" göstergesi.
- **İç sekmeler ayrı route değil** — `ButcePage` içinde state. URL kirlenmiyor, prototipteki UX aynı.
- **Hesaplamalar pure fonksiyon** (`muhasebe-butce-aggregations.ts`), state mutasyonu yok, ayrı test edilir.

## KALAN İŞLER (canlıya çıkmak için)

### 1. Migration'ı canlıya uygula — ZORUNLU, sekme bunsuz çalışmaz

**`supabase db push` bu repoda ÇALIŞMAZ.** Sebep: proje uygulanmış migration'ları
`supabase/migrations/applied/` alt klasörüne taşımış, CLI ise sadece üst düzeyi okuyor. CLI bu yüzden
canlıdaki ~300 migration'ı "yerelde yok" sanıp push'u kilitliyor ve şunu öneriyor:

```
supabase migration repair --status reverted 20260322185422 ... 20260723100000
```

> ⛔ **BU KOMUTU ÇALIŞTIRMAYIN.** Uygulanmış 300 migration'ı "geri alınmış" diye işaretler,
> migration geçmişini kalıcı olarak bozar. CLI bu repo düzenini anlamıyor, önerisi hatalı.

Bunun yerine Supabase Studio → SQL Editor'da
`supabase/migrations/20260728090000_create_muhasebe_butce_state.sql` içeriğini çalıştırın, ardından:

```sql
insert into supabase_migrations.schema_migrations (version)
values ('20260728090000')
on conflict (version) do nothing;
```

**Önce şunu doğrulayın** — policy `public.is_admin(auth.uid())` kullanıyor:

```sql
select p.proname || '(' || pg_get_function_arguments(p.oid) || ')'
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'is_admin';
```

`is_admin(uuid)` dönmeli. Parametresiz `is_admin()` çıkarsa migration'daki iki
`public.is_admin(auth.uid())` ifadesini `public.is_admin()` olarak değiştirin.

### 2. Branch'i merge et

```bash
cd c:/temp_private/corteqs/corteqs_fin
git merge worktree-muhasebe-butce-sekmesi
```

Ardından worktree'yi kaldır: `git worktree remove .claude/worktrees/muhasebe-butce-sekmesi`

### 3. `muhasebenew.html` dosyasını sil

Ana repo kökünde **untracked** olarak duruyor (bu yüzden worktree'ye taşınmadı, silinmesi bir git
işlemi değil — dosyayı kaldırmak yeterli). Silinmeden önce yedeklendi (byte-identical doğrulandı):

```
C:/Users/BARIS-~1/AppData/Local/Temp/claude/c--temp-private-corteqs-corteqs-fin/4545e49d-1f73-4df7-9b80-aeaac8607028/scratchpad/muhasebenew.html.bak
```

Bu, kullanıcının asıl isteğiydi: *"html kalmayacak"*. Merge doğrulandıktan sonra silin.

### 4. Deploy + duman testi

Coolify deploy sonrası `/admin/muhasebe/butce` adresinde:
- Sekme çubuğunda "Bütçe" görünüyor mu
- Bir tutar gir → ~1 sn sonra "kaydedildi" → sayfayı yenile → değer duruyor mu (Supabase yazımını kanıtlar)
- Gelirler sekmesinde adet gir → komisyon/net değişiyor mu
- Konsolide sekmesinde runway metni ve grafik güncelleniyor mu
- "CSV indir" → Excel'de Türkçe karakterler (İ, ş, ç) doğru mu (BOM kontrolü)

## Bilinen açık konular

1. **Manuel/tarayıcı testi yapılmadı.** Otomatik testler ve build geçiyor, ancak sekme gerçek bir
   tarayıcıda hiç açılmadı — migration canlıda olmadığı için anlamlı bir duman testi mümkün değildi.
   İlk açılışta beklenmedik bir şey çıkarsa en olası yer: Supabase yazım hatası (tablo/RLS) veya
   `ButcePage`'in yıl değiştirme akışı.

2. **`20260721140000_social_share_global_id_migration.sql` canlıya uygulanmamış.** Yerelde var,
   `schema_migrations`'ta yok. **Bu iş bu görevin parçası değil** — başka bir iş akışından kalmış,
   bilerek dokunmadım. Karar sizin.

3. **Çok kullanıcılı eşzamanlı düzenleme düşünülmedi.** Tablo `year` üzerinde unique; iki admin aynı
   yılı aynı anda düzenlerse son yazan kazanır. Prototipte de böyleydi, kapsam dışı bırakıldı.

4. **Kod review'u tamamlanmadı.** Otomatik review turu (spec uyumu / hesap doğruluğu / React kalitesi
   mercekleri) başlatıldı ama sonuçları alınamadan oturum bitti. Kod yine de doğrulanmış durumda:
   her task testli commit'lendi, `tsc` ve `build` temiz, 36/36 test geçiyor, route bağlantısı ve
   panel bileşenleri elle incelendi. Yine de merge öncesi bir göz gezdirmek isterseniz en değerli
   bakış noktaları: `ButcePage`'in yıl değiştirme + autosave etkileşimi ve
   `DepartmentBudgetPanel`'in immutable state güncelleyicileri.

## İlgili dokümanlar

- Tasarım: `docs/superpowers/specs/2026-07-28-muhasebe-butce-sekmesi-design.md`
- Uygulama planı (tüm kod blokları dahil): `docs/superpowers/plans/2026-07-28-muhasebe-butce-sekmesi.md`
