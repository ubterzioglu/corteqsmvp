# Oturum özeti — 2026-08-06 (session 7): "paylaşımlar yansımıyor" — veri değil kural

**İstek:** "paylaşımlar yansımıyor? database tablolarını kontrol et." Değişiklik yapılmadan
önce kontrol + plan istendi.

**Sonuç:** Cadde akışında **veri tarafında hiçbir bozukluk yok**. Akışı kapatan şey ürün
kuralının kendisi. Çözüm SQL dosyası olarak yazıldı ve commit'lendi (`ec7f34e`, main'de
push'lu) ama **canlıya UYGULANMADI** — sıradaki oturumun ilk işi bu.

---

## 1. Ölçüm (canlı DB, yalnız SELECT, 2026-08-06)

| Ölçüm | Sonuç |
|---|---|
| `cadde_posts` | 20 satır, **hepsi** `published` / `public` / `real` |
| Hedefsiz post | **0** — her postun `cadde_post_targets` satırı var |
| Bugünkü 6 post | ubterzioglu 4 → hedef **Türkiye/Antalya** · burakakcakanat 2 → hedef **Katar/Doha** |
| ubterzioglu'nun gördüğü | **12 / 20** |
| burakakcakanat'ın gördüğü | **7 / 20** |
| Birbirlerinin bugünkü postları | **hiç görünmüyor** |
| "Global" editöryel postların hedef kapsaması | **22 / 22** aktif ülke — bu boşluk kapanmış |
| Sayaç kolonlarında NULL | `reaction_count` / `comment_count` / `share_count` → **0 / 0 / 0** |

Üye dağılımı (neden kalıcı bir sorun olduğunu gösteriyor):

| Ülke | Üye | Giriş yapmış |
|---|---|---|
| Türkiye | 44 | 7 |
| *(konum boş)* | 31 | **28** |
| Almanya | 28 | 3 |
| Belirtilmedi | 14 | 0 |
| Katar | 11 | 4 |

Yani gerçekten aktif olan küçük grup üç ayrı kovaya bölünmüş. Konumu hiç girilmemiş 31 üye
**emniyet supabı** sayesinde her şeyi görüyor (`v_viewer_city_id is null and
v_viewer_country_id is null` dalı) — sorunu yaşayanlar konumu DOĞRU girmiş olanlar.

## 2. Kök neden zinciri

`list_cadde_feed_v1`, varsayılan `scope=all` dalında bir postu ancak şu üçünden biri
sağlanırsa gösteriyor:

1. izleyicinin **şehri** post hedefiyle eşleşir,
2. izleyicinin **ülkesi** eşleşir,
3. post **global eşiği** aşar → `cadde.global.min_reactions=10` / `min_comments=5` /
   `min_shares=10`.

~6 aktif kullanıcıda (3) fiilen ulaşılamaz. Dolayısıyla akış katı biçimde ülke içine
kilitli. Türkiye'deki üye Katar'daki üyenin postunu **asla** göremez.

**Üç kaçış yolu da kapalı (ölçüldü, tahmin değil):**

- `has_cadde_feature(uid, 'cadde.post.multi_target')` → **her ikisinde de false**. Ek hedef
  eklenirse `create_cadde_post_v2` `cadde_multi_target_premium_required` ile reddeder.
  (`cadde.post.multi_target_requires_premium = true`, hedef üst sınırı **2**.)
- `src/pages/cadde/CaddePage.tsx:285` → `isBridge: false` **sabit yazılı**. Köprü yolu
  arayüzden erişilemiyor, oysa `can_post_kopru` **ikisinde de true**.
- ubterzioglu TR yerleşik → `cadde_tr_scope_restricted` nedeniyle Katar'ı zaten
  hedefleyemez (`is_tr_resident` + `v_has_non_tr_target` dalı).

## 3. Çürütülen varsayımlar (tekrar etme)

- ❌ **"Hedefsiz post kalmış olabilir."** Hayır — 20/20 postun hedefi var. Bu, önceki
  oturumların bilinen tuzağıydı (`cadde_post_targets` satırı olmayan post kimseye
  görünmez), bu kez sorun o değil.
- ❌ **"Post oluşturunca akış tazelenmiyor olabilir."** Hayır — `CaddePage.tsx:246-251`
  `invalidateCadde()` hem `feedRoot` hem `cafesRoot` invalidate ediyor ve
  `postMutation.onSuccess` bunu çağırıyor. Yazar kendi postunu anında görüyor.
- ❌ **"Feed hatası sessizce yutuluyor olabilir."** Hayır — `listCaddeFeed` artık
  `caddeReadError` fırlatıyor (63b12f0), hata kartı çiziliyor.
- ❌ **"'Global Akış' etiketi doğru, akış gerçekten global."** Hayır — `summarizeCaddeFilters`
  filtresiz akışa "Global Akış" diyor ama akış ülkeyle sınırlıydı. Eşik değişikliği
  uygulandıktan sonra etiket **doğru hale gelir**, ayrı düzeltme gerekmez.

## 4. Karar ve teslim

**Kullanıcı kararı:** bu aşamada herkes her postu görsün. Uygulama, kullanıcının
çalıştıracağı SQL dosyası olarak teslim edilsin.

Yapılan: üç global eşik `0`'a çekilir, `cadde.global.enabled` **true kalır**.
Sayaçlar `>= 0` olduğu için her post global katmandan geçer, filtre fiilen kalkar.

**Yerellik kaybolmuyor** — yalnız filtre kalkıyor, **sıralama bantları aynen çalışıyor**:
bant 1-2 aynı şehir, 3 aynı ülke, 4-5 etkileşim, 6 diğerleri. Kullanıcı hâlâ önce kendi
şehrini görür; farkı, yereli bittiğinde akışın boşa düşmemesi.

**Doğrulanan iki teknik varsayım — plan bunlara dayanıyor, ikisi de canlıda ölçüldü:**

1. `cadde_setting_int` gövdesi `coalesce((select value ...), p_default)`. `coalesce`
   satırın **varlığına** bakar, değerine değil → `0` yazmak varsayılana **düşmez**.
   Farklı yazılmış olsaydı bütün yaklaşım işe yaramazdı.
2. Sayaç kolonlarında hiç NULL yok. NULL olsaydı `>= 0` karşılaştırması NULL dönerdi ve
   postlar yine görünmezdi.

**Yayılma yarıçapı:** `pg_proc` taraması bu üç ayarı okuyan tek fonksiyonun
`list_cadde_feed_v1` olduğunu gösterdi.

## 5. ✅ UYGULANDI — 2026-08-10

**SQL canlıya uygulandı** (`UPDATE 3` + `COMMIT`). Doğrulama sorgusu koştu:
eşikler **0/0/0** (`enabled=true`), iki test hesabı **12/20 ve 7/20 → 20/20 ve 20/20**.
Türkiye'deki üye artık Katar'daki üyenin paylaşımını görüyor.

⚠️ **Bu notun eski hâli "yazma bu ortamda engelli, kullanıcı çalıştırmalı" diyordu —
YANLIŞ ÇIKTI.** `psql -f` ile yazma geçti. Ders: erişim sınırını ezberden iddia etme,
her seferinde ölç.

⚠️ Uygulamanın yan etkisi: **Cadde erişim kartı iki yerden birden yanlışa düştü** ve
aynı turda düzeltildi — `caddeGlobalThresholdText` "0 reaksiyon · 0 yorum · 0 paylaşım"
yazıyordu, ve `get_cadde_feed_reach_v1` yalnız konum dallarını saydığı için erişim sayısı
gerçeği eksik gösteriyordu (`caddeEffectiveReach` eklendi).

<details>
<summary>Uygulanan komut (tekrar gerekirse — dosya idempotent)</summary>


```bash
set -a && source <(grep -E "^SUPABASE_DB_PASSWORD=" .env.local) && set +a
PGPASSWORD="$SUPABASE_DB_PASSWORD" PGCLIENTENCODING=UTF8 psql \
  "host=aws-1-eu-west-2.pooler.supabase.com port=5432 dbname=postgres user=postgres.injprdrsklkxgnaiixzh sslmode=require" \
  -v ON_ERROR_STOP=1 -f docs/operations/2026-08-06-cadde-global-esik-sifirlama.sql
```

Geri alma dosyanın içinde yorumda: 10 / 5 / 10.

</details>

**Kalan gözle doğrulama:** ubterzioglu ile `/cadde` aç → burakakcakanat'ın iki Doha postu
akışta görünmeli ama Antalya postlarının **altında** (bant sırası korunuyor). Feed
`staleTime: 30_000` taşıyor, sayfayı yenile. Eşik değişikliği için deploy gerekmez
(sunucu tarafı), ama **erişim kartı düzeltmesi için gerekir**.

## 6. Yan bulgular — düzeltilmedi, ayrı iş

1. **Composer premium tuzağı — gerçek hata.** `src/components/cadde/CaddeComposer.tsx:289-299`
   "+ Hedef" düğmesi **yetkiye bağlı değil**, herkese açık. Premium olmayan üye ek hedef
   ekleyip gönderince RPC `cadde_multi_target_premium_required` ile reddediyor; kullanıcı
   bunu ancak ağ turundan sonra öğreniyor. Düğme `has_cadde_feature(...,
   'cadde.post.multi_target')` sonucuna bağlanmalı ya da baştan "Premium" olarak
   gösterilmeli. Eşik değişikliği bunu **çözmez**.
2. **`isBridge: false` sabit yazılı** (`CaddePage.tsx:285`) — iki hesapta da Köprü yetkisi
   varken arayüzde Köprü paylaşımı yapmanın hiçbir yolu yok. Özellik fiilen ölü.
3. **TR yerleşik kısıtı** (`cadde_tr_scope_restricted`) — Türkiye'deki üye hiçbir koşulda
   yurtdışını hedefleyemiyor. Ürün kararı; bilinçli mi, bayat mı, sorulmadı.

## 7. Bu oturumda öğrenilenler (bir sonraki oturuma uyarı)

- ⚠️ **`src/lib/cadde-ranking.ts:38` `CADDE_GLOBAL_THRESHOLD_SETTINGS` hâlâ 10/5/10'dur ve
  öyle kalmalıdır.** O sabit **seed varsayılanını** tanımlar ve
  `src/lib/cadde-global-threshold-migration.test.ts` onu değişmez seed migration'ı
  `20260802160000_cadde_global_threshold.sql` **metnine** kilitler. Sabiti değiştirmek testi
  kırar ve uygulanmış bir migration'ın metnini değiştirmeyi gerektirir. **Sabite bakıp
  "canlı eşik 10" sanma** — canlı değer bilinçli bir çalışma-anı ezmesidir.
- **Migration yazılmadı, bilinçli.** Bu şema değişikliği değil, ürün ayarı kararı.
  CLAUDE.md kuralı: `cadde_settings` ürün limitlerinin tek kaynağıdır, ürün kararları SQL
  güncellemesidir. Geri alması tek `UPDATE`; sürüm geçmişine girmesi gerekmiyor.
- **`cadde_resolve_viewer_location` (d) dalı tehlikelidir:** `cadde_fold_text(g.name)` ile
  `geo_cities` (76.990 satır) üzerinde çalışır. **156 üye için tek tek çağırma.** Bu
  oturumda üye dağılımı ölçülürken fold, **attribute değerinin kendisine** uygulandı
  (156 çağrı), büyük tabloya değil. 2026-08-05'te tersini yapmak instance'ı düşürmüştü
  (904 MB RAM).
- **Şema hatırlatmaları:** yazar kolonu `author_user_id`; `user_profile_attributes`
  `attribute_key` değil **`attribute_id`** taşıyor (metin için `cadde_attr_text(uid, 'city'
  | 'country')` yardımcısını kullan); `cadde_settings.value` **jsonb** — `'0'::jsonb`
  yaz, `'"0"'::jsonb` değil.
- **psql `-c` içinde `\echo` çalışmaz** — meta komutlar ayrı `-c` ya da `-f` ister.

## 8. Bu oturumda değişen dosyalar

Commit `ec7f34e` (main'de push'lu, `7d3ab86..ec7f34e`):

- **yeni** `docs/operations/2026-08-06-cadde-global-esik-sifirlama.sql` — UPDATE + iki
  doğrulama sorgusu + geri alma; başında ölçüm ve gerekçe.
- `CLAUDE.md` — Cadde kuralları bölümüne canlı eşik / seed sabiti ayrışması notu.

Kod değişmedi. `npm run test -- src/lib/cadde` → **23 dosya / 228 test geçti.**
