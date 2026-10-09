# Yatırımcı / Teknik Danışman Sayfası (`/yatirimci`)

Platformun teknik olgunluğunu (Featurlar · Teknolojiler · Serverlar · Database · Kodlar ·
Teknik Danışmanlık) anlatan, siteden **bağımsız tasarımlı** (lacivert + açık zemin) ve
**parolalı** sayfa. İlk okuyucu: Chief Technology Advisor adayımız. İçerik taslağı:
[`icerik-taslagi.md`](icerik-taslagi.md).

## Dosya haritası

| Katman | Yer |
|---|---|
| Rota yolu (tek kaynak) | `src/lib/investor/investor-route.ts` |
| Rota tanımı | `src/App.tsx` — `PublicLayout` **dışında**, `{adminRoutes}` yanında |
| Sayfa + tema | `src/pages/investor/InvestorPage.tsx` · `investor-theme.css` |
| Bileşenler | `src/components/investor/*` |
| İçerik (tüm metinler) | `src/lib/investor/investor-content.ts` |
| Repo rakamları (üretilir) | `src/lib/investor/investor-stats.generated.ts` ← `scripts/generate-investor-stats.mjs` |
| Parola kapısı | `src/lib/investor/investor-access.ts` · `InvestorGate.tsx` |

## Değişmez kurallar

1. **Parola istemci taraflıdır — gerçek kilit değildir.** Hash herkese açık `env-config.js`
   içinde, sayfa kodu JS paketindedir; meraklı biri DevTools ile içeriği okuyabilir.
   Bu yüzden sayfaya **hiçbir zaman** yazılmaz: proje kimliği, host/IP, bağlantı adresleri,
   tablo/RPC/secret adları, açık güvenlik kusurları, kapasite zaafları.
   `investor-content-safety.test.ts` bunu tarar — **gevşetme**, içeriği düzelt.
2. **Sitemap'e, `robots.txt`'e, `DEMO_ROUTES`'a eklenmez.** Sayfa `noindex, nofollow` ister.
   `robots.txt`'e `Disallow` yazmak yolu ifşa eder. `investor-route-contract.test.ts` kilitler.
3. **`PublicLayout` dışında kalır**; asistan balonu ve yukarı-çık düğmesi bu yolda çizilmez
   (`App.tsx` → `FloatingWidgets`).
4. **Rakam elle yazılmaz.** Repo rakamları betikle üretilir; canlı DB rakamları
   `LIVE_DB` içinde **ölçüm tarihiyle** durur ve sayfa alt bilgisinde iki tarih de görünür.
5. Modül durumları (`Canlı` / `Pilot` / `Geliştiriliyor`) dürüst tutulur. Demo içerikli modül
   "Canlı" yazılmaz.

## Parolayı belirlemek / değiştirmek

Parola düz metin olarak hiçbir yere yazılmaz. Yalnız **doğrulayıcı** verilir:
`pbkdf2:<iterasyon>:<tuz>:<özet>` (PBKDF2-SHA256, 600.000 iterasyon, 16 bayt rastgele tuz).
Doğrulayıcı herkese açık `env-config.js`'te durduğu için **parola cümlesi uzun olmalı**:
en az **5–6 rastgele kelime** ya da **20+ rastgele karakter**. Kısa parola, açık doğrulayıcı
üzerinden çevrimdışı denemeyle kırılabilir.

```bash
npm run investor:hash   # parolayı gizli istemle sorar (ekrana ve kabuk geçmişine yazılmaz)
```

**Canlı (Coolify):** ortam değişkenlerine `INVESTOR_PASS_HASH=<doğrulayıcı>` ekle ve yeniden
başlat. Değer çalışma anında `docker-entrypoint-env.sh` ile `env-config.js`'e yazılır —
**yeniden build gerekmez.** Script değeri yalnız izinli karakterlerle (`pbkdf2:` + hex + `:`)
kabul eder; biçim dışı değer boşaltılır ve sayfa "yapılandırılmamış" der (kapalı kalır).
Tırnak/yeni satır içeren hatalı bir değer böylece `env-config.js`'i ve tüm sitenin Supabase
ayarını bozamaz.

**Yerel:** `npm run dev` için `.env.local`'a `VITE_INVESTOR_PASS_HASH=<doğrulayıcı>`;
`npm run start` (server.mjs) için `INVESTOR_PASS_HASH` ortam değişkeni.

Parola değişince eski oturumlar kendiliğinden düşer (oturum kaydı doğrulayıcıya bağlıdır).
3 yanlış denemede form 30 sn kilitlenir (görsel fren; gerçek koruma değildir).

> ⚠️ Kapı kozmetiktir: içerik lazy JS paketindedir ve oturum kaydı tarayıcıda taklit
> edilebilir. Kapının işi meraklıyı ve arama motorunu durdurmaktır, kararlı bir saldırganı
> değil. Bu yüzden içerik kuralı (madde 1) asıl korumadır.
>
> `noindex` istemci tarafında ayarlanır. Kapıdan önce içerik çizilmediği için JS çalıştırmayan
> tarayıcılar yalnız genel kabuk görür; nginx'e ayrı `X-Robots-Tag` konumu bilerek eklenmedi
> (yeni `add_header` konumu güvenlik başlıklarını tekrar etmeyi gerektirir — CLAUDE.md
> "Değişmez sözleşmeler" md.2).

## Rakamları güncellemek

```bash
npm run investor:stats          # repo rakamlarını yeniden üretir
npm run investor:stats:check    # dosya bayatsa exit 1
```

Sayım `git ls-files` iledir — **yalnız izlenen dosyalar** sayılır. Yeni dosya ekleyen bir
değişiklikten sonra rakamlar ancak commit'ten sonra doğrudur: commit → `npm run investor:stats`
→ üretilen dosyayı ayrı commit'le. "Sunucu fonksiyonu" sayısı **kaynak koddaki** fonksiyondur,
canlı dağıtım sayısı değildir (`npm run check:functions` ikisini karşılaştırır).

Canlı DB rakamları için (salt-okur katalog sorguları — `geo_cities` gibi büyük tablolara
satır bazlı fonksiyon UYGULAMA) şunu `psql -f` ile çalıştır, sonuçları
`investor-content.ts` → `LIVE_DB`'ye yaz ve `measuredAt`'i güncelle:

```sql
select 'tables', count(*) from pg_tables where schemaname='public'
union all select 'rls', count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' and c.relrowsecurity
union all select 'policies', count(*) from pg_policies where schemaname='public'
union all select 'secdef', count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef
union all select 'indexes', count(*) from pg_indexes where schemaname='public'
union all select 'triggers', count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid
  join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal
union all select 'roles_active', count(*) from public.roles where is_active
union all select 'afs_attributes', count(*) from public.afs_attributes
union all select 'afs_features', count(*) from public.afs_features
union all select 'cron_active', count(*) from cron.job where active
union all select 'extensions', count(*) from pg_extension;
```

> RLS'siz tek tablo `spatial_ref_sys`'tir (PostGIS'in kendi referans tablosu) — bu yüzden
> sayfada "uygulama tablolarının tamamında RLS" yazar. Sayı değişirse önce hangi tablo
> olduğuna bak.

## Ölçüm kaydı

| Tarih | Kaynak | Değerler |
|---|---|---|
| 2026-10-09 | canlı katalog | 292 tablo (291 RLS) · 525 politika · 412 security-definer · 836 indeks · 146 trigger · 14 aktif cron · 11 eklenti · 82/78 rol · 59 alan · 64 özellik |
| 2026-10-09 | `investor:stats` | 1.039 kaynak dosya · ~152 bin satır · 490 test dosyası · 11 E2E · 19 edge function · 529 migration |

## Yazdırma / PDF

Tarayıcıda Yazdır → PDF: gezinme gizlenir, tüm "Teknik ayrıntı" ekleri otomatik açılır.
