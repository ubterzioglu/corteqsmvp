# Relocation — kalan kararlar (2026-09-21)

**Nereden geldi:** [`docs/plans/2026-09-20-relocation-modulu-plani.md`](../plans/2026-09-20-relocation-modulu-plani.md)
— Batch 0–5 kapandı, içerik canlıya girdi (`7a25094`). Aşağıdakiler koddan
kalmadı, **karardan** kalıyor.

**Bugünkü canlı durum (ölçüldü 21 Eylül):**

| Tablo | Satır |
|---|---|
| `relocation_living_costs` | 192 — 12 ülke × hane 1/2/4 |
| `relocation_required_documents` | 204 — 13 ortak × 12 ülke + 48 ülkeye özgü |
| `relocation_locations` | 32 şehir / 12 ülke |

**Risk bağlamı (ölçüldü):** `/relocation` `App.tsx`'te **`RequireAuth` arkasındadır**
ve `scripts/generate-sitemap.mjs`'te **yoktur**. Yani demo içerik ziyaretçiye ve
arama motoruna hiç görünmez, yalnız giriş yapmış üye görür. Aşağıdaki kararlar
bu yüzden acil değildir — ama sayfa bir gün herkese açılırsa **K3 (feragat) önce
kapatılmalıdır.**

## Bu dosya neyi kapsamaz

`/businesses` ve katalog placeholder kayıtlarının görünürlüğü ayrı dosyadadır:
[2026-09-21-demo-icerik-ve-katalog-gorunurlugu.md](2026-09-21-demo-icerik-ve-katalog-gorunurlugu.md).
İki dosya `DEMO_ROUTES` deseninde kesişir — **bir rotanın demo satırını silerken
öbür dosyaya da bak**, desen ortaktır.

---

## K1 — Üç demo sekmenin gerçek veri kaynağı

**Durum:** İş & İşletmeler · Okullar · Hoşgeldin Paketi sekmeleri örnek
**kategori kartları** gösteriyor (`src/lib/relocation-demo-content.ts`). Uydurma
kurum adı yok, bilerek: gerçek görünen bir ad ziyaretçi tarafından aranır ve
bulunamayınca güven kaybettirir.

**Karar gereken:** bu üç sekmeyi ne besleyecek?

| Seçenek | Maliyet | Not |
|---|---|---|
| Yeni tablolar (`relocation_businesses` / `_schools` / `_welcome_pack`) | Migration + RLS + admin ekranı | En temiz, en pahalı |
| Mevcut `catalog_items` / `relocation_services` | Eşleme mantığı | Yeni tablo gerekmez; eşleme kalitesi **canlıda ölçülmeli** |
| Kalıcı demo | Sıfır | Sekmeler hiç gerçek olmaz; o zaman "demo" değil "rehber" diye adlandırılmalı |

**Karar verilince yapılacak tek iş:** `src/lib/demo-pages.ts` → `DEMO_ROUTES`
içinden `/relocation` satırını **sil**. Üç sekme `isDemoRoute` ile gateli
olduğu için kendiliğinden kaybolur; sekme temizliği gerekmez.

⚠️ Bu satır silinirse demo sekmeler gider **ama sayfanın demo bandı da gider**.
Gerçek veri yalnız bir sekmeye geldiyse satırı silme — notu güncelle.

---

## K2 — Rakamların kaynağı ve tazelenme sorumluluğu

**Durum:** 192 maliyet satırı **genel piyasa bilgisine** (2026 başı) dayanır,
resmî bir fiyat endeksinden türetilmemiştir. Aralıklar bilerek geniştir; dar ve
kesin görünen bir rakam, geniş ve dürüst bir aralıktan daha yanıltıcıdır.
`freshness_at` dolduruldu — ama **bugün kimse ona bakmıyor.**

**Karar gereken:**
1. Kaynak yükseltilsin mi? (ör. Eurostat / resmî istatistik kurumu / anlaşmalı
   sağlayıcı) — yoksa mevcut aralıklar kalıcı mı sayılacak?
2. Kim, ne sıklıkla tazeleyecek? Yılda bir mi, hiç mi?
3. Arayüzde **"veri şu tarihte girildi"** görünsün mü? `freshness_at` hazır,
   panel bugün göstermiyor. Göstermek güven artırır ama bayatlığı da ifşa eder.

**Not:** seed idempotenttir — tazeleme, dosyadaki sayıları değiştirip yeniden
çalıştırmaktır. Satır çoğalmaz.

---

## K3 — Belge listelerinde feragat ve doğrulama

**Durum:** 204 belge satırı vize/oturum başvurularının belge listeleridir.
Notlarda "apostil", "yeminli tercüme", "geçerlilik 3 ay" gibi **işlem yönlendiren**
bilgi var. Bu bilgiler konsolosluğa göre değişir ve **yanlış olursa üye somut
zarar görür** (randevu kaçar, başvuru reddedilir).

**Karar gereken:**
1. Sekmeye görünür bir feragat konsun mu? (*"Resmî listenin yerini tutmaz,
   konsolosluktan teyit edin"*) — bugün YOK.
2. Listeleri kim doğrulayacak? Göçmenlik danışmanı mı, topluluk mu, hiç mi?
3. Yanlış bilgi bildirimi için bir yol açılsın mı?

**Öneri:** en azından (1) yapılmalı; tek satırlık iş, en büyük riski kapatır.

---

## K4 — Şehir kırılımı açılsın mı

**Durum:** 192 satırın **tamamında `city_code` NULL** — yani hepsi ülke geneli.
Londra'ya taşınan da Birmingham'a taşınan da **aynı kira aralığını** görüyor;
aradaki fark bu iki şehirde kat düzeyindedir. Şema şehir kırılımını destekliyor,
veri yok.

**Ölçek:** 32 şehir × 16 kalem = **~512 satır** (bugünkü 192'nin yaklaşık 2,7 katı),
ve her biri ayrı ayrı doğrulanmalı.

**Karar gereken:** hepsi mi, yalnız en çok taşınılan birkaç şehir mi, hiç mi?
Kısmi kırılım desteklenir — `pickRowForHousehold` şehir satırı yoksa ülke
satırına düşmez, bu yüzden **kısmi veri girilecekse önce okuma tarafı gözden
geçirilmeli.**

---

## K5 — Para birimi sunumu

**Durum:** her ülke kendi para biriminde (EUR/GBP/USD/CAD/CHF/SEK/AED/QAR).
Bu zorunlu: `sumMonthlyCosts` karışık para biriminde toplamayı **reddeder**
(`relocation-content-format.ts`) ve panelde toplam hiç görünmez. Kur çevrimi
bilinçli olarak yapılmıyor — sessiz yanlış toplam, eksik toplamdan kötüdür.

**Karar gereken:** üye tek bir karşılık (TRY ya da EUR) görmek ister mi?
İsterse **kur kaynağı ve tazeleme sıklığı** ayrı bir iştir; hazır kur olmadan
bu maddeye girilmemeli.

---

## Karar değil — sahipsiz duran işler

README'ye göre bu klasör karar bekleyen maddeler içindir. Aşağıdakiler karar
değil ama **sahipsiz kalmasın diye** buraya yazıldı; biri üstlenince silinmeli.

- [ ] **Tarayıcı QA.** Deploy sonrası: plan oluştur → sayfayı yenile (plan
      kaybolmamalı, URL'de `?move=` olmalı) → maliyet/belge/demo sekmeleri
      çiziliyor mu → asistan yanıt veriyor mu → konsolda CSP ihlali var mı.
- [ ] **Kadro migration'ının eksik ledger satırı.** Ölçüldü 21 Eylül:
      `kadro_candidates` · `kadro_role_events` · `kadro_role_states` üçü de
      **canlıda var**, ama `schema_migrations`'ta `20260920100000` **yok**.
      Dosya `main`'de (`bdf4916`), dolayısıyla `check:migrations` artık
      **yanlışlıkla "uygulanmamış"** diyor. Tek satır:
      ```sql
      insert into supabase_migrations.schema_migrations (version, name)
      values ('20260920100000', 'kadro_konsolu') on conflict (version) do nothing;
      ```
      ⚠️ "Sınıf engelliyor" kaydı **çürüdü** — `psql -f` ile dosya olarak
      gönderildiğinde geçiyor (21 Eylül'de `20260921110000` böyle yazıldı).
- [ ] **Edge function deploy.** `relocation-assistant` canlıda, ama **Coolify
      edge function deploy ETMEZ**. Fonksiyon değişirse
      `supabase functions deploy relocation-assistant` elle koşulmalı.

---

## ⚠️ Bu işin dışında — deploy'u kırabilecek bir risk

> ⚠️ **Bu bölümün TEŞHİSİ 21.09 akşamı çürüdü — bkz.
> [master](2026-09-21-KALANLAR.md).** Risk gerçek ve tıkayıcı, ama sebep başka:
>
> - `scripts/ai-knowledge/text-extract.mjs` **artık temiz ve commit'li**
>   (`String.fromCharCode(0xc4)` kullanıyor). Orada yapılacak iş kalmadı.
> - `verify:text`'i bugün kıran tek dosya
>   `docs/plans/2026-09-21-clean-code-repo-taramasi-plani.md`'dir (satır 7 ve 19) —
>   yani aşağıda anlatılan "alıntılama" tuzağı **ikinci kez** yaşandı.
> - `tsc` **0 hata** veriyor; "5 hata" iddiası çürüdü.
>
> İş master'da **B01**'dir. Aşağıdaki anlatım tarihsel kayıt olarak duruyor.

Ölçüldü 21 Eylül, **hiçbirine dokunulmadı**; sahibi paralel bir oturum.

`Dockerfile` → `RUN npm run build` → `prebuild` → **`verify:text`**. Yani
kodlama denetimi **production build'in içindedir**.

Bugün `scripts/ai-knowledge/text-extract.mjs` bu denetimden **geçmiyor**: içinde
bir HTML entity → Latin-1 harf eşleme tablosu var ve denetim bunu mojibake
sanıyor. Dosya şu an **commit'lenmemiş** olduğu için Coolify'ın çektiği ağaçta
yok ve **deploy güvende**. Commit'lendiği anda `npm run build` kırılır ve
**deploy tamamen durur.**

⚠️ **O satırı hiçbir dosyaya alıntılama.** Alıntının kendisi de denetime takılır
ve alıntılayan dosyayı kırar. Bu tam olarak yaşandı: bu dosyanın ve
`docs/plans/2026-09-20-relocation-modulu-plani.md`'nin ilk yazımında satır
birebir alıntılanmıştı; plan dosyası o hâliyle `7a25094` ile **push'landı** ve
`prebuild` üzerinden deploy'u kıracaktı. Kusuru belgelemek, kusuru kopyalamaktı.

Aynı şekilde `tsc` şu an `src/lib/catalog-directory.test.ts`'te 5 hata veriyor
(`DIRECTORY_PAGE_SIZE`, `getTotalDirectoryCount` kaynakta yok). `tsc` build'e
dahil değildir, deploy'u kırmaz — ama `npm run test` ve `npm run lint`,
`verify:text` kancasına takıldığı için **hiç koşamıyor**.

**Bu iki madde o oturumun kalan-işler dosyasına aittir**
(`docs/plans/2026-09-21-site-geneli-ai-bot-kalan-isler.md`); buraya yalnız
deploy riski görünür olsun diye yazıldı.
