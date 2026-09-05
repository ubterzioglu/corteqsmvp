# Rol / etiket mimarisi — karar notu (Profil WS1 13–16, Batch C)

**Tarih:** 5 Eylül 2026
**Durum:** ⛔ **UYGULAMAYA BAŞLANMADI — bilinçli.** Üç bağımsız mimari önerisi üretildi,
dokuz yargıç üç ayrı lensle (geçiş / mantık doğruluğu / ürün uygunluğu) puanladı.
**Üçü de 3/10 aldı ve üçü de "bu hâliyle uygulama" dedi.**

Bu not, o turun kalıcı çıktısıdır: neyin çürüdüğünü, hangi kararın kimde beklediğini ve
hangi teknik tuzağın *hangi tasarım seçilirse seçilsin* geçerli olduğunu kaydeder.

---

## 1) Neden kod yazılmadı

Üç öneri farklı açılardan geldi (en az değişim / temiz veri modeli / etiket-rol ayrımı) ve
üçünün de **iskeleti sağlam** bulundu: birincil rolü `user_role_assignments`'ta bırakmak,
ek unvanları ayrı hafif bir tabloda tutmak, birleşimi tek bir yardımcı fonksiyona toplamak,
tablo boşken davranışı NO-OP başlatmak, tek satırlık kill-switch bırakmak.

Kırılan şey iskelet değil, **birleşim SQL'inin kendisi ve ürün kapsamı** oldu.

### Ürün lensinin cümlesi (kararın özü)

> Tasarım T19'u "etiketi nereye **yazalım**" sorusu sanmış; oysa karar
> "etiket nerede **görünsün** ve ne **iş yapsın**" sorusudur.

### Üç soru — üçü de kod kararı değil, ürün kararı

1. **Unvan YETKİ verir mi, yoksa yalnız GÖRÜNÜR MÜ?**
   "Yalnız görünür" cevabı, önerilen tasarımların yaklaşık **%80'ini gereksiz kılıyor**
   (AFS birleşimi, feature çözümlemesi, RLS dokunuşları hepsi düşer; geriye onaylı bir
   unvan listesi ve onu çizen bir yüzey kalır).
2. **76 rolün hangileri unvan sözlüğüne girer?** Hepsi mi, yoksa seçilmiş bir alt küme mi?
3. **Tüzel kişilik (kurum/dernek/hastane) nerede durur?** `catalog_items` zaten kullanıcı
   hesabından bağımsız kurum profili tutuyor ve M:N rol ilişkisi orada **çözülmüş durumda**.
   T19'un 4. maddesi bu yüzden büyük ölçüde mevcut sistemle karşılanabilir.

### Kabul kriteri — yazılmadan hiçbir faz "bitti" sayılmamalı

> "Danışman etiketi onaylanan üye `/directory`'de Danışman filtresinde çıkar, uzmanlık alanı
> kartında görünür, public profilinde onaylı unvan olarak ayırt edilir."

Önerilen tasarımların **hiçbiri** bunu sağlamıyordu: üçü de dizin sorgusunda etiket satırını
`distinct on (user_id) ... is_primary desc` ile bilerek atıyordu. Yani etiket veritabanında
duruyor ama **aranamıyor ve görünmüyordu** — ürünün asıl değeri tam orada kayboluyor.

---

## 2) Hangi tasarım seçilirse seçilsin geçerli olan altı teknik tuzak

Bunlar yargıçlar tarafından `supabase/baseline/2026-08-04-public-schema.sql` içindeki
**gerçek fonksiyon gövdeleriyle karşılaştırılarak** kanıtlandı. İleride bu iş açıldığında
tasarımı bunlara karşı sınayın.

| # | Tuzak | Kanıt |
|---|---|---|
| 1 | **`update_profile_attribute`'ta yetki kapısı yok olur.** Gövde `v_rule public.role_attributes%rowtype` değişkenine `select rar.* … limit 1` yapar; kapı `if v_rule.id is null then raise 42501` satırıdır. Birleşimi GROUP BY'sız bir agregata çevirmek bu kapıyı **yapısal olarak** siler ve yerine hiçbir şey koymaz. | baseline:16562, 16595–16603 |
| 2 | **`get_current_user_features` her özelliği iki kez döner.** `distinct role_key` yalnız aynı anahtarın tekrarını siler; iki farklı rol varken `fc.scope_role='*'` koşulu iki satır için de doğrudur. Fonksiyon `RETURNS TABLE` olduğu için çoğalma çağırana yansır. | — |
| 3 | **`has_cadde_feature` sert kırılır (21000).** Gerçek gövde bir **skaler alt sorgudur**; birleşim CTE'si onu çok satırlı hâle getirir ve tüm Cadde yetki çözümlemesi patlar. | baseline:10166–10177 |
| 4 | **Yeni `SECURITY DEFINER` fonksiyonlar RLS'i deler.** Dışarıdan `uid` alan bir definer fonksiyona Postgres varsayılanı `PUBLIC EXECUTE`'tur ve bu depoda zaten `GRANT ALL ON FUNCTION … TO anon` deseni var. Yeni fonksiyonlarda **REVOKE zorunlu**. | baseline:36828 |
| 5 | **Birleşim kuralı `role_attributes`'ın 10 politika kolonundan yalnız 6'sı için tanımlıydı.** Anılmayan dördü ölü değil: `is_public` public nitelik ifşasının kapısıdır, `visibility` varsayılanı `'public'`tir. | baseline:21454–21471, 8615 |
| 6 | **Mevcut üyeler için backfill yoktu → aynı unvanın iki temsili.** Bugün birincil rolü "Danışman" olan üye öyle kalır, yeni onaylanan etiket alır; biri dizin filtresine düşer, diğeri düşmez. | — |

Ek olarak: `is_admin()` / `is_moderator()` **`Admin_%` önekine** bakar. Etiket sistemi
kurulursa admin/moderatör rollerinin etiket olarak verilmesi veritabanı düzeyinde
(trigger ile) yasaklanmalıdır — aksi hâlde etiket bir **yetki yükselmesi** yoludur.

---

## 3) Öneri: işi ikiye böl

**Faz 1 — "yalnız görünür unvan" (küçük, geri alınabilir, ürünün istediğini büyük ölçüde verir)**
Onaylı unvanları saklayan tek bir tablo + public profilde ve dizinde gösterim + dizin
filtresine dahil etme. Yetki modeline **hiç dokunulmaz**. Yukarıdaki altı tuzağın 1–5'i
bu fazda devreye girmez.

**Faz 2 — "unvan yetki de versin" (ancak ürün 1. soruya 'evet' derse)**
AFS birleşimi, feature çözümlemesi, RLS dokunuşları. Bu faz açılırsa yukarıdaki altı tuzak
tek tek karşılanmalı ve her biri için regresyon testi yazılmalı.

Ürün 1. soruya **"yalnız görünür"** derse Faz 2 hiç açılmaz ve iş birkaç güne iner.

---

## 4) Bu turda üretilenler nerede

- Tam tasarım metinleri, dokuz yargıç raporu ve gerekçeleri workflow çalıştırma kaydında:
  `.claude/projects/…/subagents/workflows/wf_5d6daa7e-1fc/journal.jsonl`
- Aynı turda üretilen **44 revizyon isteğinin triyajı** ayrı iş olarak yürütüldü:
  20 madde "şimdi yapılabilir", 23 madde ürün kararı/ekran görüntüsü bekliyor.

## 5) Sıradaki adım

Bu notu Burak ile birlikte okuyup **1. soruyu yazılı cevaplamak**. Cevap gelmeden
`user_role_tags` benzeri hiçbir migration yazılmamalı — üç bağımsız yargıç da aynı şeyi söyledi.
