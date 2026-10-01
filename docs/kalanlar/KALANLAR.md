# KALANLAR — master iş listesi

> **Tek kaynak.** Açık her iş bu dosyadadır. Kapanan iş en alttaki **Kapananlar**
> tablosuna tek satır olarak taşınır (yeniden açılmasın diye).
> **Dosya adı geneldir** (`docs/kalanlar/KALANLAR.md`) — her turda yeniden adlandırılmaz.
> Eski ad: `2026-09-27-KALANLAR.md` (git geçmişi `--follow` ile kesintisiz).
>
> | | |
> |---|---|
> | **Son yapısal düzenleme** | 1 Ekim 2026 |
> | **Son ölçüm tabanı** | 30 Eylül 2026 öğlen (↓ "Ölçüm tabanı") |
> | **Açık batch** | **71** (N 3 · W 8 · M 27 · G 23 · KR 10) |
> | **Kullanıcı eli bekleyen** | 10 (U bölümü) · **Karar** 7 (K) · **Onay** 6 (P) |
> | **Plan onayı (01.10)** | ✅ **N · G · KR onaylandı** · ⏳ M onay bekliyor |
> | **Canlı erişim kararı (01.10)** | Ajan migration'ı `psql -f` ile **kendi uygular**, `applied/` altına taşır, `schema_migrations` kaydını atar ve edge function'ı **kendi deploy eder**; her batch sonunda kanıtla rapor verir |
> | **Son devir notu** | [`docs/handover/2026-10-01-devir-notu.md`](../handover/2026-10-01-devir-notu.md) — 1 Ekim oturumu, 13 commit (PUSH EDİLMEDİ) |
> | **Kalıcı operasyon dersleri** | [`docs/operations/2026-09-30-kalici-operasyon-dersleri.md`](../operations/2026-09-30-kalici-operasyon-dersleri.md) |

---

## 0 · Sonraki işi nasıl seçerim (karar ağacı)

Bu dosyaya yeni gelen ajan **sırayla** şunu yapar:

1. **§2 Durum panosu**ndan kapısı 🟢 olan en üstteki batch'i al. Varsa onu yap, dur.
2. 🟢 kalmadıysa: kullanıcıya **§2'deki 🟡 satırları** göster, plan onayı iste.
   Onay gelen seri 🟢 olur, 1'e dön.
3. 🔴 satırlar **ajan tarafından yapılamaz** — kullanıcıya hatırlat, kendin başlamayı deneme.
4. Bir batch'e başlarken **§4 zorunlu doğrulama** bloğunu ve serinin kendi
   "tüm batch'lerinde geçerli" kutusunu oku. Kaynak plan dosyası varsa ilgili fazını oku.
5. Bitince: başlığın önüne ✅ + **kanıt satırı** (commit hash · ölçüm · SQL sonucu · HTTP kodu).
   Sonra satırı **Kapananlar** tablosuna taşı ve §2'den sil.

**Kurallar (ihlal edilmez):**

- **Bir batch = bir oturum = bir commit.** Bir batch bitmeden diğerine geçme.
- **"Yaptım" kanıt değildir.** Bu repoda panolar üç kez yanlış "yapıldı" gösterdi.
  Kanıt = hash, ölçülmüş sayı, SQL çıktısı, canlı HTTP kodu.
- **Rakamlar bayatlar.** Aşağıdaki ölçüm tabanı 30.09'dan; batch'e başlarken yeniden ölç.
- **Seriler birbirini bloke etmez.** U/K/P beklerken 🟢 olan başka bir seriden devam edilir.
- 🛑 **Her batch'e BAŞLAMADAN kullanıcı onayı alınır** (kullanıcı kuralı, 01.10). Kapı 🟢
  olması "plan onaylı" demektir, "şimdi başla" demek DEĞİLDİR — hangi batch'e geçileceği
  her seferinde teyit edilir.

**Önerilen yürütme sırası (01.10 onayından sonra):**

1. **A14** — tek başına duran küçük UI işi, hiçbir şeye bağlı değil.
2. **G01 → G02 → G03** — ⚠️ **canlıda AÇIK iki güvenlik kusuru.** Onaylı seriler arasında
   tek "bugün zarar veriyor" sınıfı bu; sıranın başında olmaları bu yüzden.
3. **N01 → N07** — 7 küçük batch, sıfır migration, en düşük risk.
4. **G04 → G25** — G04/G05 ⛔ U06, G11 ⛔ U07; o üçü atlanıp gerisi sürdürülebilir.
5. **KR01 → KR10**.
6. **M01–M27** — onay geldiğinde.

---

## 1 · Kapı sözlüğü

| Kapı | Anlamı | Ajan ne yapar |
|---|---|---|
| 🟢 | **Onay gerekmez** — kapsam ve kabul kriteri yazılı, kullanıcı girdisi yok | Hemen yapar |
| 🟡 | **Plan onayı bekliyor** — kaynak plan "onaya sunuldu" durumunda | Onay ister, beklemede tutar |
| 🔴 | **Kullanıcı eli gerekli** — secret, gerçek telefon, panel kararı, dosya | Yapamaz; hatırlatır |
| ⛔ | **Bloke** — başka bir batch/U maddesi bitmeden başlanamaz | Bağımlılığı §2'de yazılı |

---

## 2 · DURUM PANOSU — açık batch'lerin tamamı

### A · Ajan yapar, karar gerekmez

**Açık A batch'i YOK** — A14 01.10'da kapandı (↓ Kapananlar).

### N · Admin menü numaraları + asistanın yönetici bağlamı

Sıra bağlayıcı: N01 → N02 → N03 → N04 → N05 → N07. **N06 bağımsız**, araya girebilir.
Sıfır migration · sıfır yeni bağımlılık. Tahmin: 1–2 gün.

| ID | Başlık | Boyut | Kapı | Not |
|---|---|---|---|---|
| ~~N01~~ | ✅ **KAPANDI 01.10** — numaralandırma çekirdeği (88 kayıt: 75 üst · 13 alt · 3 inaktif) | ✅ | N02 ile BİRLİKTE commit'lendi |
| ~~N02~~ | ✅ **KAPANDI 01.10** — numara sidebar + komut paletinde görünüyor | ✅ | ⚠️ N01 tek başına commit'lenemezdi (↓) |
| ~~N03~~ | ✅ **KAPANDI 01.10** — `docs/agent/admin-menu.json` (88 öğe) + bayatlama kapanı | ✅ | — |
| ~~N04~~ | ✅ **KAPANDI 01.10** — `admin-menu` bilgi kaynağı (88 belge, öğe başına bir) | ✅ | ⚠️ npm argüman tuzağı + canlıya erken yazım (↓ N04) |
| **N05** | Prompt kuralı (yalnız yöneticide) · **DEPLOY** | küçük | 🟢 | ⛔ N04 |
| **N06** | Bot yanıtında tıklanabilir link | küçük | 🟢 | **bağımsız · bugün canlıda kusur** |
| **N07** | Canlı ingest + uçtan uca kabul · **KANIT TURU** | küçük | 🟢 | ⛔ N05 |

### W · WhatsApp botu otomatik yanıt

Sıra **bağlayıcıdır**; W02 geçmeden W03'e başlanmaz. Otomatik yanıt bugün **YOK** —
bu bir kurulum işi değil, yeni geliştirme (W04 migration + W05 yeni edge function).

| ID | Başlık | Boyut | Kapı | Bağımlılık |
|---|---|---|---|---|
| **W01** | Beş secret'ı gir + webhook doğrula (kod yok) | küçük | 🔴 | ⛔ **U09** |
| **W02** | İnsan yanıtıyla uçtan uca doğrulama (kod yok) | küçük | 🔴 | ⛔ W01 · gerçek telefon |
| **W03** | Graph gönderim yolunu `_shared`'a çıkar | küçük | 🟢 | ⛔ W02 (sıra bağlayıcı) |
| **W04** | Migration: bot yanıtı + kill-switch + hız limiti | orta | 🟢 | ⛔ W03 |
| **W05** | `whatsapp-autoreply` fonksiyonu (beyin) | orta | 🟢 | ⛔ W04 |
| **W06** | Webhook'tan tetikleme + deploy | küçük | 🟢 | ⛔ W05 |
| **W07** | Test turu (9 senaryo) · **KANIT TURU** | küçük | 🔴 | ⛔ W06 · gerçek telefon |
| **W08** | Test notlarını revizyon yorumlarına yaz + kapanış | küçük | 🔴 | ⛔ W07 · panel erişimi |

### M · Topluluk Motoru — ücretsiz işlevler

Faz sırası bilinçli: Faz 6 (metrik) Faz 2'den (tavsiye) **önce** — tavsiyeye girmeden
traction ölçülecek.

| Faz | ID | Kapsam | Kapı |
|---|---|---|---|
| 0 | **M01** | Ücretsizliği kilitleyen sözleşme testi + CLAUDE.md bölümü | 🟡 |
| 1 | **M02–M07** | Etkinlik: ilk-onay kuralı · RLS sıkılaştırma · katılım · UI · canlı doğrulama | 🟡 |
| 5 | **M08–M10** | Panel hızlı eylemleri · başlangıç kartı · `feature_interest` | 🟡 |
| 3 | **M11–M13** | Davet tabloları/RPC · `/liderlik` · kayıt akışı | 🟡 |
| 6 | **M14–M16** | 5 türetilmiş metrik view · AdminTractionPage · canlı doğrulama | 🟡 |
| 2 | **M17–M23** | Tavsiye İste (en büyük modül) · `/tavsiye` · kilitli gelen kutusu | 🟡 |
| 4 | **M24–M27** | Haftalık şehir özeti · `user_city_follows` · pg_cron | 🟡 |

### G · Dijital Gruplar Motoru

⚠️ **G02/G03 canlıda AÇIK iki güvenlik kusurunu kapatır** — sıranın başında olmaları bu yüzden:
`whatsapp_link` anonime tamamen açık · `Anyone can insert whatsapp landings` politikası
`{anon,authenticated}` ve `WITH CHECK` yok (anonim sınırsız grup ekleyebiliyor).

| Faz | ID | Kapsam | Kapı | Bağımlılık |
|---|---|---|---|---|
| A | ~~G01~~ | ✅ **KAPANDI 01.10** — `docs/dijital-gruplar/` + CLAUDE.md bölümü + kök temiz | ✅ | — |
| A | ~~G02~~ ~~G03a~~ ~~G03b~~ · **G03c** | ✅ G02 + G03a + G03b KAPANDI 01.10 · 🔴 **sızıntı G03c'ye kadar AÇIK** (taban tablo hâlâ anonime açık) | 🟢 | ⛔ G03b canlıda olmalı |
| B | **G04–G05** | Telefon OTP (Auth native + `user_verifications` aynası) + arayüz | 🟢 | ⛔ **U06** |
| B | **G06–G07** | Kurumsal doğrulama: şema + belge yükleme + admin inceleme | 🟢 | — |
| C | **G08** | M1 spike: davet sayfasından grup adı okunabiliyor mu (rapor) | 🟢 | — |
| C | **G09–G11** | `group_settings` · `whatsapp_landings` genişletme · 10 grubun göçü | 🟢 | ⛔ **U07** (G11) |
| D | **G12–G17** | Durum makinesi · sahiplik · şikayet · uyarı · gönderiler · sağlık skoru | 🟢 | — |
| E | **G18–G21** | 4 sayfa: form · dizin · detay · sahip paneli | 🟢 | — |
| F | **G22–G25** | 6 zamanlanmış görev · 8 bildirim · moderatör paneli · 13 kabul testi | 🟢 | — |

### KR · Kariyer sayfası yenilemesi

⚠️ `KR01` ≠ `K01`. **Yeni sayfa değil** — `/kariyer` zaten canlıda, bu bir değiştirme işi.

| Faz | ID | Kapsam | Kapı |
|---|---|---|---|
| 0 | **KR01** | `src/lib/careers/` modülü + sözleşme testi | 🟢 |
| 1 | **KR02–KR03** | Migration (tablo + kova + RPC) · `careers-api` + şema + hata haritası | 🟢 |
| 2 | **KR04–KR06** | Sayfa iskeleti · ilan listesi + filtre · başvuru formu (3 dosya) | 🟢 |
| 3 | **KR07** | Eski 4 ilanın korunması | 🟢 |
| 4 | **KR08–KR09** | `/admin/kadro/basvurular` · yeni başvuruda e-posta | 🟢 |
| 5 | **KR10** | SEO · sitemap · araç kataloğu · doküman | 🟢 |

### Plan yazılmamış, batch'e bölünmemiş ajan işi

| Konu | Durum |
|---|---|
| **Cadde gönderi DÜZENLEME UI'ı** | `update_cadde_post_v1` canlıda hazır (A11b); composer'ı "düzenleme modu"nda açacak form + menü bağlantısı yazılacak. **Ayrı plan ister** — batch'e bölünmedi |

### U · Kullanıcı eli gerekiyor (öncelik sırasıyla)

| ID | Konu | Neyi açar |
|---|---|---|
| **U09** | WhatsApp Meta kimlik bilgileri (5 secret) — 30.09: "bilgiler hazır" | **W01–W08** |
| **U03** | İki gerçek mail testi (e-posta doğrulama · revizyon tamamlanma) | A14 kapanış maili |
| **U06** | Telefon/SMS sağlayıcısı teyidi (panelden) | **G04–G05** |
| **U07** | G11 eşleme CSV'si — 4 veri kararı (ekip) | **G11** |
| **U04** | Etkinlik planındaki 16 kanıtsız ✅ — kanıtla veya 🔒'ya döndür | — |
| **U05** | Cadde logosu (Burak'tan dosya) | ~20 dk'lık UI işi |
| — | Command Center arşiv dalgası — **A/B/C kararı** | ~1653 → 150-200 kayıt |
| — | REPO-DIŞI ~50 maddenin toplu teyidi | panel durumları |
| **U08** | G03 sonrası dönüşüm gözden geçirme — **2 hafta sonra** | takvim maddesi |
| **U01** | Service role anahtarı — **EN SONA** (3 edge function düşer) | — |

### K · Karar · P · Onay · X · Ertelenen

- **K01–K07** — kod işi olmayan kararlar (K08 ✅ cevaplandı → G bölümü).
- **P02–P07** — clean-code planının canlı DB/deploy/ürün kararı isteyen maddeleri.
- **X** — batch'e bölünmeden önce ayrı plan isteyen büyük işler.

Üçünün tabloları aşağıda, seri bölümlerinin ardından.

---

## 3 · Ortam notları ve bilinen tuzaklar (batch'e başlamadan oku)

- ⚠️ **`corteqs-ekstre-motoru/`** repoda untracked duruyor (başka oturum) ve `npm run lint`
  bu klasörden **~29 hata** veriyor. Tam lint yeşil isteniyorsa klasör düzeltilmeli veya
  eslint kapsamı dışına alınmalı. Kendi batch'inin lint sonucunu bu gürültüden ayır.
- ⚠️ **Vitest'i büyük harfli `C:` ile çalıştır.** Küçük harfli `c:\...` cwd'de test
  dosyaları sahte kırılır (bilinen tuzak).
- ⚠️ **`git commit` pathspec'siz yapılmaz** — index başka oturumlarla paylaşılıyor,
  `-- <dosyalar>` ŞART.
- ⚠️ **Sayarken `git ls-files`** kullan, çıplak `find` değil: gitignore'lu
  `referanslovable/` klonu sayıları şişirir.
- ⚠️ **Coolify edge function deploy ETMEZ** — `Dockerfile` yalnız frontend'i kurar.
  Commit'lemek canlıya çıkarmaz; **elle** `supabase functions deploy`.
- ⚠️ **`verify_jwt` flip tuzağı (A99-R2 dersi):** `config.toml` girdisi olmayan bir
  fonksiyonu CLI ile deploy etmek `verify_jwt`'yi varsayılana döndürür; çağrı 401 yer ve
  **hata hiçbir yerde görünmez.** Deploy sonrası canlı değeri ÖLÇ.
- ⚠️ **`cron.job_run_details` "succeeded" kanıt DEĞİLDİR** (A99-R2 dersi).
- ⚠️ **Compute Micro'ya çıktı ama bellek hâlâ küçük:** `geo_cities` 76.992 satır. Satır
  başına fonksiyon uygulayan keşif sorgusu YASAK; önce `select distinct`, sonra join.
- ⚠️ **Secret rotasyonu ÜÇLÜDÜR:** `.env.local` + Vault + edge. Plaintext'in tek okunur
  kaynağı Vault (`vault.decrypted_secrets`). Biri bayat kalırsa sessizce 401 alırsın.
- Tam liste: [`docs/operations/2026-09-30-kalici-operasyon-dersleri.md`](../operations/2026-09-30-kalici-operasyon-dersleri.md)

---

## 4 · Her batch'te zorunlu doğrulama

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run lint
npm run test                  # TAM takım — yalnız ilgili dosya yetmez (27.09'da CI tam bu yüzden kırıldı)
npm run check:dead
npm run ingest:tools:check    # src/lib/** değiştiyse; bayatsa `npm run ingest:tools` + openapi.yaml'ı da commit'le
git commit -m "..." -- <dosyalar>   # index başka oturumlarla paylaşılıyor, pathspec ŞART
gh run list --limit 1         # push sonrası CI yeşil mi
```

- Migration varsa: parent `supabase/migrations/`'a yaz → `psql -f` ile uygula →
  `applied/` altına **TAŞI** → `schema_migrations` kaydını at. Zaman damgası tekrar kullanılmaz.
- Edge function değiştiyse: `supabase functions deploy <ad> --project-ref injprdrsklkxgnaiixzh`
  + `npm run check:functions` — **Coolify deploy ETMEZ.**
- Yeni `cadde_*` hata kodu eklediysen `src/lib/cadde-rules.ts` haritasına Türkçesini yaz
  (`cadde-error-map.test.ts` kilitler).
- Kapanışta: `src/lib/admin-shell/admin-updates/2026-10.ts`'e kayıt (18:00 Berlin özet maili
  buradan beslenir).

---

## 5 · Nerede ne var

| Arıyorsan | Bak |
|---|---|
| Açık batch'in **kapsamı ve kabul kriteri** | ↓ ilgili seri bölümü (A · N · W · M · G · KR) |
| Serinin **kaynak planı** | seri başlığının altındaki alıntı bloğu |
| **Güncel sayılar** (test, tsc, migration, edge sürümleri) | ↓ "Ölçüm tabanı (30.09 öğlen)" |
| **Kapanan iş** + kanıtı | ↓ "Kapananlar" tablosu · git geçmişi |
| **Kalıcı operasyon dersleri** | `docs/operations/2026-09-30-kalici-operasyon-dersleri.md` |
| 29–30.09 oturumunun kapanan 14 batch'i | Kapananlar tablosu · `7e79be4`…`c2e5156` zinciri |
| Radar (A99-R2) kök neden zinciri + kalıcı dersler | Kapananlar tablosu son satırları · `86c1f63` · dersler dosyası |

---

# AÇIK İŞLERİN AYRINTISI

## A — Ajan yapar (senin kararın gerekmez)

### ✅ A14 · #REV-034 — "Hangi Ülke Sana Uygun" sonuç grafikleri → kutulu renkli görsel

> **KAPANDI 2026-10-01 · `c3ff905`.** `RankedListCard` öğeleri artık bant rengini taşıyan
> başlık şeridi olan kutular; alt boyut barları `h-1` → `h-2.5`, sayılar bant renginde.
> **Kapsam kararı:** `ranked_list` canlıda **DÖRT** aktif araçta (`country_match` ·
> `city_match` · `banka_secim_almanya` · `sigorta_secim_almanya`) — aşağıdaki eski not
> "`city_match` gibi" diyordu, ölçülen sayı **4**. `toolKey` prop'u ile tek araca özel
> görünüm üretmek YERİNE dördü birden güncellendi: aynı `result_kind` için iki ayrı
> grafik dili tutarsızlık olurdu.
> **Kanıt:** tsc **0** · lint **0** (32 problemin hepsi untracked `corteqs-ekstre-motoru/`'den) ·
> `npm run test` **373 dosya / 2889 test** yeşil (taban 372/2882) · `check:dead` 0 yeni /
> 0 borç / **962** erişilebilir · 7 yeni test **mutasyonla sınandı** (h-2.5→h-1, bant
> rengi→nötr, bant etiketi silme — üçü de ilgili testi düşürdü, vakum test değil).
> ⚠️ `ScoreBandBar`'a DOKUNULMADI — yalnız `className` geçildi; a275f131'in `progressbar`
> rolü/aria sözleşmesi ve mevcut 21 testi aynen duruyor.
> **Kalan tek adım: Burak'ın görsel onayı.** Önce/sonra önizlemesi:
> <https://claude.ai/artifact/5KN3KXDDt7vvnR9PwD1R8L> — onay gelince panelden REV-034
> "Yapıldı" işaretlenir (tamamlanma maili `#REV-034` numaralı gider, mekanizma U03(b)).

- **İstek (Açık · Ö5 · ARAÇLAR 17.07.2026 · Burak, 18.07 kaydı):** test bitince çıkan
  **yatay bar grafikler** → "görselli kutular içinde **renkli** grafikler olabilir mi?"
- **Mevcut durum (ölçüldü):** `country_match` aracının `result_kind`'ı `ranked_list` →
  grafikleri `src/components/relocation/tools/RankedListCard.tsx` çiziyor: ülke başına
  ince (`h-1`) `ScoreBandBar` satırları + `Badge` skor; bant renkleri
  `ScoreBand.tsx`'teki `SCORE_BAND_STYLES`'tan geliyor.
- ⚠️ **Tuzak:** `RankedListCard` bu araca özel DEĞİL — `city_match` gibi tüm
  `ranked_list` araçlarının sonuç sayfası aynı bileşen. Değişiklik hepsini değiştirir;
  tasarım tutarlılığı için bu istenen şey olabilir, ama **yalnız `country_match`**
  isteniyorsa araç anahtarı prop olarak geçilmeli. Hangi kararın verildiği commit
  mesajına yazılır.
- Kapsam: her ülke öğesi görsel olarak belirgin kutuda, barlar kalınlaşmış + bant
  renginde; sayı `tabular-nums` kalır. `ScoreBandBar`'ın `progressbar` rolü/aria'sı ve
  mevcut testleri bozulmaz (revizyon a275f131'in band sözleşmesi korunur).
- **Kabul:** tarayıcıda `country_match` çözülünce sonuç "kutulu renkli grafik"
  görünüyor; test/tsc/lint yeşil. Burak görsel onayı verince **panelden REV-034
  "Yapıldı" işaretlenir** (tamamlanma maili `#REV-034` numaralı gider — mekanizma U03(b)).

### İsteğe bağlı clean-code adayları (plan kapsamı dışı)

- 500–800 satır bandında 33 üretim dosyası (C00 ölçümü).
- `zgen-data.ts` 980 satır — veri dosyası, bölmek gerekli mi tartışmalı.

---

## N — Admin menü sıra numaraları + asistanın yönetici bağlamı (N01–N07)

> **Kaynak plan:** [`docs/plans/2026-09-30-admin-menu-numaralari-ve-asistan-plani.md`](../plans/2026-09-30-admin-menu-numaralari-ve-asistan-plani.md)
> — bağlam, ölçüm kanıtları ve tuzaklar orada. **Durum:** plan onaya sunuldu.
> **İstek sahibi:** Burak — "admin menüsü uzun, bir sayfayı tarif etmek/bulmak zor;
> bot açıklama veriyor ama menüde nerede olduğu belli değil."
> **Sıra:** N01 → N02 → N03 → N04 → N05 → N07. **N06 bağımsızdır**, araya sıkıştırılabilir.
> **Sıfır migration · sıfır yeni bağımlılık** — ölçüldü: `ai_knowledge_documents.source_key`
> üzerinde CHECK YOK, `audience` CHECK'i `admin`'i zaten kabul ediyor
> (`applied/20260921100000_ai_knowledge_base.sql:28,42`).

**Neden ayrı bir bot/RAG/model GEREKMİYOR (ölçüldü 30.09 — bu soruyu tekrar açma):**

| Şey | Değer | Kanıt |
|---|---|---|
| Menü grubu / üst seviye öğe | **14** / **75** | registry barrel + 14 grup dosyasında `^      id:` |
| İnaktif / external öğe | **3** / **5** | `isInactive: true` · `isExternal: true` |
| Dinamik alt öğeli ebeveyn | **2** | `workspace-docs` · `advisor-profiles` |
| Yönetici kitle ayrımı | **VAR** | `resolveAudiences()` — `_shared/ai-assistant-context.ts:46` |
| Admin kararı sunucuda | **VAR** | `is_admin()` RPC — `site-assistant/index.ts:194` |
| `audience='admin'` kaynağı çalışıyor | **VAR** (`docs-admin`) | `scripts/ai-knowledge/sources.mjs:199` |
| Asistan balonu admin sayfalarında | **VAR** (kök, `<Routes>` dışı) | `src/App.tsx:331` |
| Sayfa bağlamı gönderiliyor | **VAR** (A12b) | `ChatBot.tsx:114-117` |

Eksik olan tek şey korpusta menüyü anlatan **veri seti** ve promptta **bir kural**.

**Tüm N batch'lerinde geçerli (tekrar yazılmayacak):**

- Kapanış turu: yukarıdaki "Her batch'te zorunlu doğrulama" bloğu aynen.
- Menü sırası **kullanıcıya göre DEĞİŞMEZ** — sidebar rol/feature filtresi uygulamaz
  (`AdminSidebar.tsx:71`, `AdminSidebarGroup.tsx:26`). Mutlak numara bu yüzden geçerli.
- Numara **tek yerden** gelir: `buildAdminMenuCatalog()`. İkinci bir sayaç yazma —
  sidebar ile korpus sessizce ayrışır.
- Yeni `src/lib/**` dosyası → `npm run ingest:tools` + üretilen dosyalar commit'e dahil.
- Edge function değişirse **elle deploy** — Coolify deploy ETMEZ.

### Faz 1 — numara (görünür iş, bota hiç dokunmaz)

**✅ N01 + N02 — Numaralandırma çekirdeği + menüde görünmesi** · KAPANDI 01.10

> ⚠️ **PLANIN N01/N02 AYRIMI AYAKTA KALMADI — tek commit oldular.**
> N01'in kabulü "yalnız yeni dosya, UI değişmez" diyordu. Ama o hâlde modülü
> **hiçbir yer import etmiyor** → `npm run check:dead` onu *erişilemez* sayıp
> **exit 1** veriyor ve **CI bu kontrolü çalıştırıyor**
> (`.github/workflows` → `npm run check:dead`). Yani N01 tek başına CI'ı kırardı.
> Alternatif ölü-kod istisna listesine yazmaktı; o gerçek sinyali gizlerdi.
> **Ders:** `src/lib/**` altına "henüz bağlanmamış" bir modül ekleyen her batch
> aynı duvara çarpar — üreten ve bağlayan adımlar AYNI commit'te olmalı.

> **Ölçüm (canlı registry):** **88 kayıt** = 75 üst seviye · 13 alt öğe ·
> 3 inaktif · 5 external. Plandaki 14 grup / 75 öğe rakamıyla birebir uyuştu.
> Alt öğeler: `29.1–29.3` (advisor-profiles) · `37.1–37.10` (workspace-docs).
>
> **Sıra sidebar KODUNDAN okundu, tahmin edilmedi** (`AdminSidebar.tsx:24,71,91`,
> `AdminSidebarGroup.tsx:26`): gruplar registry sırasında → grup içi aktif öğeler
> → **en sonda** tüm gruplardan toplanan inaktifler.
>
> ⚠️ **FAVORİLER NUMARALANMAZ.** Sidebar en üstte kullanıcıya özel bir "Favoriler"
> bloğu çizer; oradaki öğe grubundakinin AYNISIDIR ve kendi numarasını taşır.
> Ayrı numara verilseydi aynı sayfanın kullanıcıdan kullanıcıya değişen İKİ
> numarası olurdu ve "mutlak numara" fikri çökerdi.
>
> ⚠️ **Alt öğeler üst sayacı KAYDIRMAZ** (`37.1 … 37.10`, sonraki üst öğe 38).
> `workspace-docs`/`advisor-profiles` dinamik alt sayfa alıyor; kaymaya izin
> verilseydi bir alt sayfa eklenince TÜM menü numaraları bir gecede bayatlardı.
>
> ⚠️ `flattenAdminNav()` KULLANILMADI — grup sınırını ve `isInactive` ayrımını
> kaybediyor, oysa numaralandırmanın tamamı o iki bilgiye dayanıyor.
>
> **N02:** numara rozeti `AdminSidebarItem`'ın **ÜÇ render dalına da** eklendi
> (external `<a>` · alt öğeli ebeveyn `<button>` · düz `NavLink`); tek dala
> eklemek external ve ebeveyn satırlarını numarasız bırakırdı. Komut paletinde
> aynı numara, aynı kaynaktan. Daraltılmış sidebar'da çizilmez (72px).
> Numara **`aria-hidden` DEĞİL** — ekran okuyucu "17, Üyeler" der; botun vereceği
> "menüde 17. sırada" referansı sesli okumada da karşılık bulsun.
>
> **Sözleşme testleri (17 test, hepsi mutasyonla sınandı):**
> `admin-menu-numbering.test.ts` (12) — alt öğe üst sayacı kaydırsın → **4 düştü**;
> inaktifler araya girsin → **7 düştü**.
> `AdminSidebar.numbering.test.tsx` (5) — ⚠️ katalogu YENİDEN HESAPLAMAZ, sidebar'ın
> gerçekten render ettiği DOM'u okur. "İkinci sayaç" mutasyonu → **3 düştü**;
> `aria-hidden` mutasyonu → **1 düştü**. Bu test "iki ayrı sayaç" sınıfını kapatır
> (numara sidebar'a bir yerden, bot korpusuna başka yerden gelirse hiçbir şey
> patlamaz, yalnız kullanıcı yanlış satıra bakar). **Gevşetme.**
> ℹ️ DOM testi favori listesi BOŞ çalışır: favoriler üstte tekrar çizilir ve
> numara dizisi katalog sırasını izlemez. Favorinin numarası gruptakiyle aynı
> olduğu için kapsam kaybı yok; gerekçe testin içinde yazılı.

> ⚠️ **N02'de üç mevcut `AdminLayout.test.tsx` testi kırıldı — iki AYRI sebep,
> ikisi de öğretici:**
> 1. **Beklenen kırılma:** numara erişilebilir ada girdi → `getByRole("link",
>    { name: "Kayıt Veritabanı" })` artık eşleşmiyor, ad `"2. Kayıt Veritabanı"`.
>    Bu PLANIN BİLİNÇLİ KARARI (`aria-hidden` değil). İddialar sona-çapalı regex'e
>    çevrildi; `toContain` ile gevşetilmedi (başka satıra da uyardı).
> 2. ⚠️ **Beklenmeyen ve asıl tehlikeli olan:** düzeltme sırasında yazdığım
>    regex'e koyduğum **kelime-sınırı kaçış dizisi** dosyaya **ham BACKSPACE
>    karakteri (U+0008) olarak** yazıldı. Regex hiçbir şeyle eşleşemez hâle geldi
>    ve ben bir süre kusuru BİLEŞENDE aradım. **7 ham backspace** temizlenince
>    testler düzeldi. Bu, CLAUDE.md'nin "Regex'teki kaçış dizileri ham karaktere
>    çevrilmemeli" uyarısının birebir tekrarı (daha önce `date-groups.ts`'te
>    yaşanmıştı). **Ders:** regex yazan bir düzenlemeden sonra dosyayı
>    `ascii(line)` ile **DOĞRULA**; gözle bakınca kaçış dizisi ile ona dönüşen
>    ham kontrol karakteri **ayırt edilemez**. `verify:text` de bunu YAKALAMAZ —
>    o yalnız kodlama ve mojibake denetler, kontrol karakterini değil.
>
> ⚠️ **Erişilebilir ad ayırıcısı ŞART.** Bitişik `<span>`'ler ad hesabında
> BOŞLUKSUZ birleşir: numara etikete yapışıp `"2Kayıt Veritabanı"` olur ve ekran
> okuyucu tek kelime gibi okur — numarayı sesli okumaya katma amacının tam tersi.
> Rozetin YANINA ayrı bir `sr-only` düğüm kondu. **Rozetin İÇİNE koyma:** o zaman
> rozetin metni `"2."` olur ve DOM sözleşmesi testi çıpasını kaybeder.
>
> ⚠️ Numara kutusu `w-7` DEĞİL `min-w-[1.75rem]`: alt öğe numaraları beş karaktere
> çıkıyor (`37.10`) ve sabit 28px kutudan taşardı.
>
> ⏭️ **N03 için not:** aynı tuzak orada da var — `admin-menu-catalog.test.ts`
> snapshot üretecek ve `docs/agent/admin-menu.json` yazacak. O dosya `src/lib/**`
> altında olmadığı için `check:dead` etkilenmez, ama yeni bir `src/lib` modülü
> eklenirse aynı kural geçerli.

**✅ N03 — Üretilen katalog + bayatlama kapanı** · KAPANDI 01.10

> `docs/agent/admin-menu.json` üretildi: **88 öğe, 39 KB**. Üretim komutu
> `npm run ingest:admin-menu`. Test: `src/lib/admin-shell/admin-menu-catalog.test.ts` (4 test).
>
> **KABUL KRİTERİ ÖLÇÜLDÜ:** artefaktdaki bir etiket elle `"ELLE DEGISTIRILDI"`
> yapıldı → test **KıRıLDı** (`Snapshot ... mismatched`); geri alınınca 4/4 yeşil.
> Yani menü değişip artefakt tazelenmezse **CI kırılır** — `ingest:tools:check`'in
> bilinen "ne lint ne test yakalar" sorununa DÜŞMÜYOR.
>
> ⚠️ **PLANDAKİ SCRIPT HATALIYDI — düzeltildi.** Plan
> `vitest run -u <yol>` diyordu. Ölçüm:
>
> | Biçim | Koşan |
> |---|---|
> | `vitest run -u <yol>` | **380 dosya / 2947 test** ❌ |
> | `vitest run --update <yol>` | **380 dosya / 2947 test** ❌ |
> | `vitest run <yol> -u` | **1 dosya / 4 test** ✅ |
>
> Bayrak yolun ÖNÜNE yazılırsa vitest yolu **yutuyor** ve tüm takımı
> snapshot-güncelleme modunda koşuyor. Bugün zararsızdı (repoda başka snapshot
> yok) ama ileride biri snapshot testi eklediğinde menüyü tazelemek **başka
> yerdeki bayat bir snapshot'ı sessizce yeniden yazardı**. **Bayrak DAİMA yolun
> ARKASINA.** Ölçüm test dosyasının başında yazılı.
>
> ℹ️ Artefaktın `.json` olması bilinçli: `classifyDocumentationPath` yalnız
> `.md|.html` alır (`sources.mjs:27`), böylece menü `docs-admin` korpusuna **ikinci
> kez girmez**. `.md` yapılırsa menü korpusa iki kez girer ve semantik arama kendi
> kendisiyle yarışır.
>
> ℹ️ `toMatchFileSnapshot` bu repoda **ilk kez** kullanıldı (ölçüldü: 0 önceki
> örnek). Vitest 4.1.11 ile sorunsuz çalışıyor.

**N04 — `admin-menu` bilgi kaynağı** · küçük · migration YOK

> ✅ **KAPANDI 2026-10-01 · `3be3e694`.** `sources.mjs`'e `buildAdminMenuDocuments()`
> (saf, test edilebilir) + `loadAdminMenuDocuments()` + kayıt `{ key: "admin-menu",
> audience: "admin" }` eklendi. Öğe başına BİR belge; metin kullanıcının kelimelerini
> taşır (etiket · "yönetici sol menüsünde N. sırada" · grup · yol/href · açıklama ·
> diğer adlar · alt/üst öğe bağı · pasif-taslak durumu). `url = to ?? href ?? null`.
> **Kanıt:** kabul `node scripts/ai-knowledge/ingest.mjs --source=admin-menu --dry-run`
> → **88 belge → 88 parça, yazma yok** · 9 yeni test, **3 mutasyon turu 3/3 yakalandı**
> (url önceliği `href??to`, grup adı silme, alias filtresi kaldırma) · tam takım
> **380 dosya / 2955 test yeşil** · lint 0 · `check:dead` 0 yeni/0 borç/963 ·
> `verify:text` ✓ (1851 dosya).
>
> ⚠️ **OLAY + KALICI DERS (npm argüman yutma):** kabul ilk denemede
> `npm run ai:ingest -- --source=admin-menu --dry-run` ile koşuldu; npm bu makinede
> `--` sonrasını script'e GEÇİRMEDİ (`npm warn Unknown cli config "--source"`), script
> argümansız → **tüm kaynaklar + gerçek yazım** modunda koştu ve **canlı DB'ye yazdı**:
> `admin-menu` 88 belge **insert edildi (embedding 0 — bekleyen 88, yani aranamaz,
> bota sızmaz)** · `catalog` +65 yeni/+10 güncel · `docs-member` +5 (yayımlı içerik,
> idempotent, zararsız) · `docs-admin` **ortada patladı** (↓). `ai:embed` ÇALIŞTIRILMADI
> (N07'nin işini N05'ten önce yapmak olurdu, sıra korundu). **Kural: bu repoda
> `ai:ingest`/`ai:embed` argümanlı çağrılacaksa npm DEĞİL doğrudan
> `node scripts/ai-knowledge/ingest.mjs …` kullan; çıktıdaki "(DRY RUN — yazma yok)"
> başlığını GÖRMEDEN dry-run'a güvenme.**
>
> 🔴 **YENİ AÇIK KUSUR (bu olayda ortaya çıktı):** tam ingest'te `docs-admin` kaynağı
> `docs/kalanlar/KALANLAR.md` upsert'inde `Empty or invalid json` hatasıyla düşüyor
> (kaynak yarıda kesildi, prune koşmadı). N04 öncesinde de var mıydı bilinmiyor —
> KALANLAR.md 01.10'da büyüyüp yeniden adlandırıldı. N07 öncesi araştırılmalı: olası
> yönler dosya boyutu/içerik (RPC veya PostgREST limiti) ya da chunk içeriği.
> **N07'nin kendi komutları etkilenmez** (`--source=admin-menu`), ama tam korpus
> ingest'i bu kusur yüzünden `docs-admin`'i güncelleyemiyor.

- `scripts/ai-knowledge/sources.mjs`: `loadAdminMenuDocuments()` (üretilen JSON'u okur) +
  tek satır kayıt `{ key: "admin-menu", label: "Yönetici menüsü", audience: "admin", … }`.
- **Öğe başına BİR belge** (tek blob DEĞİL) — semantik arama tek kayda kilitlensin.
- Belge metni kullanıcının yazacağı kelimeleri taşır: label · "menüde N. sıra" · grup adı ·
  sayfa yolu · açıklama · aliases · "bu sayfa yönetici sol menüsünde nerede".
- `url` = `item.to` → "Kaynaklar" bloğu tıklanabilir link verir (N06 ile birlikte).
- `sources.test.mjs`'e vaka ekle.
- **Kabul:** `npm run ai:ingest -- --source=admin-menu --dry-run` ~80 belge raporlar.

**N05 — Prompt kuralı (yalnız yöneticide)** · küçük · **DEPLOY gerekir**
- `_shared/ai-assistant-context.ts`: `ADMIN_MENU_PROMPT_BLOCK` + `buildAdminModeNote()`.
- `site-assistant/index.ts:219`: `SITE_ASSISTANT_SYSTEM_PROMPT +
  buildAdminModeNote(isAdminData === true, payload.page) + buildPageContextNote(payload.page)`.
- ⚠️ Kapı **`is_admin()`**'dir, `page.path`'in `/admin` olması DEĞİL — `page` istemci
  iddiasıdır ve yönetici halka açık bir sayfadan da sorabilir.
- ⚠️ Prompt'taki **"veride yoksa numara VERME"** cümlesi çıkarılmaz; onsuz model numara
  UYDURUR ve kabul kriteri sessizce çürür.
- `ai-assistant-context.test.ts`: blok yalnız `isAdmin=true` iken ekleniyor.
- `supabase functions deploy site-assistant --project-ref injprdrsklkxgnaiixzh`.

### Faz 3 — link + kanıt

**N06 — Bot yanıtında tıklanabilir link** · küçük · **BAĞIMSIZ**
- ⚠️ **Bu bugün canlıda bir kusur:** `ChatMessage.tsx:29` yalnız `**kalın**` işliyor;
  `appendSources()`'ın ürettiği "Kaynaklar" bloğu kullanıcıya ham
  `[Başlık](/admin/members)` metni olarak görünüyor — hiçbir link tıklanabilir değil.
- `[metin](/ic/yol)` → react-router `<Link>`; `[metin](https://…)` → `<a target="_blank">`.
- **Yalnız `/` veya `https://` ile başlayan hedef kabul edilir**; `javascript:` vb. düz
  metne düşer. Model çıktısı güvenilmeyen girdidir.
- Mevcut `**kalın**` davranışı aynen korunur (var olan testler geçmeli).
- **Kabul:** yeni `ChatMessage.test.tsx` — iç yol `<a href>` üretir, `javascript:` ÜRETMEZ.

**N07 — Canlı ingest + uçtan uca kabul** · küçük · **KANIT TURU**
```bash
npm run ingest:admin-menu
node scripts/ai-knowledge/ingest.mjs --source=admin-menu   # ⚠️ npm DEĞİL node — npm argümanları yutuyor (↓ N04 olayı)
node scripts/ai-knowledge/embed.mjs                        # ⚠️ embed TÜM bekleyenleri gömer: 88 admin-menu + ~308 diğer (catalog/docs)
```
- ℹ️ **01.10 durumu (N04 olayı):** 88 `admin-menu` belgesi npm'in argüman yutması
  yüzünden canlıya **zaten insert edildi** — hepsi `embedding NULL / bekleyen`, yani
  gömülene kadar aranamaz ve bota sızmaz. N07'nin ingest adımı büyük ölçüde
  "değişmedi" raporlayacak; **asıl kalan iş embed + uçtan uca kabul.** Embed'i N05
  deploy'undan ÖNCE çalıştırma: prompt kuralı olmadan bot menü numarası söylemeye
  başlar, kabul kriteri ("veride yoksa numara VERME") denetlenemez.
- 🔴 Embed öncesi `docs-admin` upsert kusuruna bak (↓ N04): tam ingest
  `KALANLAR.md`'de `Empty or invalid json` ile düşüyor.

- Yönetici hesabıyla `/admin` üzerindeyken **"üyeler menüde nerede"** → yanıtta sıra
  numarası geçiyor **ve** o numara sol menüde aynı satırda yazıyor; kaynak linki
  tıklanınca sayfa açılıyor. (İstenen kabul kriteri birebir budur.)
- Üye (admin olmayan) hesapla aynı soru → menü kaydı **GELMEMELİ** (`audience='admin'`).
- ⚠️ **Yanıt "bulamadım" gelirse EŞİĞE DOKUNMA.** `ChatBot.tsx:120` — getirme 0.35'i
  geçemezse modelin cevabı ATILIR ve `NO_CONTEXT_MESSAGE` gösterilir. 0.35 ölçülmüş
  değerdir; ilk bakılacak yer **N04'teki belge metnidir** (ifadeler yeterince doğal mı).
- Kapanışta bu dosyaya not: **menü sırası her değiştiğinde** `ingest:admin-menu` +
  `ai:ingest` + `ai:embed` çalıştırılmalı, yoksa bot bayat numara söyler.

---

## W — WhatsApp botu: otomatik yanıt (W01–W08)

> **Kaynak plan:** bu bölümün kendisi (ayrı plan dosyası yazılmadı — kapsam buraya sığdı).
> **İstek:** müşteri revizyonu — "API key sisteme girilsin (kodda değil, secret) · bot
> çalışır hale gelsin · bir süre test edilsin · test sonuçları bu revizyonun yorumlarına
> yazılsın." **Kabul:** WhatsApp'tan bota yazıldığında bot yanıt veriyor + notlar paylaşılmış.
> **Ön koşul:** **U09** (Meta kimlik bilgileri — 30.09'da "bilgiler hazır, sende" dendi).
> **Kullanıcı kararı (30.09):** bot **OTOMATİK** yanıt verecek → bu bir kurulum işi değil,
> **yeni geliştirme**. Sıra bağlayıcıdır; W02 geçmeden W03'e başlanmaz.

**Ölçülen taban (30.09 — "bot zaten var" sanma, ezberleme, yeniden ölç):**

| Parça | Durum | Kanıt |
|---|---|---|
| `whatsapp-webhook` | Canlı `v17 ACTIVE`; imza doğrular, PII'yi hash+şifreler, olayı yazar | `_shared/whatsapp-webhook.ts:217` |
| `whatsapp-reply` | Canlı; **yalnız yönetici** gönderir (`admin_required`), 24 saat penceresi + onaylı şablon kuralı kodda | `_shared/whatsapp-reply.ts:138-147` |
| Konuşma modeli | Tam: `whatsapp_customer_threads` · `_messages` · `_message_templates` | `applied/20260830133000_whatsapp_customer_requests.sql` |
| Yönetici paneli | **Var:** `/admin/customer-requests` "Müşteri Talepleri" | `AdminCustomerRequestsPage.tsx` · `src/lib/customer-requests.ts` |
| **Otomatik yanıt** | **YOK** — hiçbir tetikleyici yok; gelen mesaj konuşmaya düşer, insan cevaplar | `ingest_whatsapp_webhook_event` yalnız yazar |
| `verify_jwt` | Doğru: webhook `false`, reply `true` | `supabase/config.toml:41-45` |

**Tasarımı belirleyen üç kısıt (gevşetilmez):**

1. **WhatsApp'tan yazan KİMLİKSİZDİR** — yalnız bir telefon numarası; oturumu, rolü,
   üyeliği yok. Bot korpusu bu yüzden **yalnız `audience='public'`** olabilir.
   `catalog` **member**'dır (dizin girişe kapalı), `docs-admin` yöneticiler içindir —
   **ikisi de WhatsApp'a AÇILAMAZ.** Bugün public olan tek kaynak `blog`.
2. **Meta hızlı 200 bekler** — embedding + model çağrısı webhook'u BLOKLAYAMAZ.
   (A99-R2 dersi: gateway 504 dönerken fonksiyon arka planda bitebiliyor; "200 döndüm"
   ile "iş bitti" aynı şey değil.) Yanıt üretimi **ayrı fonksiyonda**.
3. **Botun yazdığı mesaj yönetici RPC'sinden geçemez** — `admin_prepare_whatsapp_reply`
   admin JWT ister, yoksa `admin_required`. Servis-rol RPC çifti + **migration** gerekir.

**Tüm W batch'lerinde geçerli (tekrar yazılmayacak):**

- Kapanış turu: yukarıdaki "Her batch'te zorunlu doğrulama" bloğu aynen.
- Edge function değişen her batch: **elle deploy** (`supabase functions deploy <ad>
  --project-ref injprdrsklkxgnaiixzh`) — Coolify deploy ETMEZ — ve `npm run check:functions`.
- ⚠️ **`verify_jwt` tuzağı (A99-R2):** CLI deploy'u `config.toml` girdisi yoksa varsayılanı
  uygular; çağrı 401 yer ve **hata hiçbir yerde görünmez**. Deploy sonrası canlı değeri ÖLÇ.
- Token/secret sohbete veya commit'e yazılmaz; kanıt olarak yalnız digest kullanılır.
- Migration akışı: parent'a yaz → `psql -f` uygula → `applied/` altına **TAŞI** →
  `schema_migrations` kaydı. Zaman damgası tekrar kullanılmaz.

### Faz 1 — hattı aç ve kanıtla (kod yok)

**W01 — Secret'ları gir + webhook doğrula** · küçük · kod yok
- Beş secret girilir; **kanıt digest karşılaştırmasıyla** (bugün dördü birebir aynı).
- `GET /whatsapp-webhook?hub.mode=subscribe&hub.challenge=…` → **200 + challenge**
  (`_shared/whatsapp-webhook.ts:221-229`).
- Yanlış `hub.verify_token` → **403**; imzasız POST → **401 invalid_signature**.
- **Kabul:** üç HTTP kodu da ölçülmüş olarak yazılır.

**W02 — İnsan yanıtıyla uçtan uca doğrulama** · küçük · kod yok
- Gerçek telefondan mesaj → `whatsapp_customer_threads`'e düşüyor + panelde görünüyor.
- Panelden elle yanıt → telefona ulaşıyor (`admin_finalize_whatsapp_reply` audit kaydı).
- ⚠️ **Neden ayrı batch:** otomasyon yazmadan önce hattın (token, numara, şifre çözme,
  Graph gönderimi) sağlam olduğu kanıtlanır. Burada çıkacak bir hata, sonraki beş
  batch'i teşhis edilemez hâle getirir.
- **Kabul:** gelen + giden mesaj hem DB'de hem telefonda görüldü.

### Faz 2 — otomatik yanıtın altyapısı

**W03 — Meta gönderim yolunu `_shared`'a çıkar** · küçük · davranış DEĞİŞMEZ
- `whatsapp-reply/index.ts`'teki Graph API çağrısı (`graphVersion` biçim doğrulaması
  dahil) → `_shared/whatsapp-graph.ts`. Bot da aynı yolu kullanacak; **ikinci bir Graph
  istemcisi yazılmaz.**
- Mevcut `_shared/whatsapp-reply.test.ts` yeşil kalmalı + yeni birim testi.
- `supabase functions deploy whatsapp-reply` (kod değişti, davranış aynı).

**W04 — Migration: bot yanıtı + kill-switch + gönderen bazlı hız limiti** · orta
- `whatsapp_customer_messages` + `is_automated boolean not null default false` —
  panelde "bot mu yazdı" ayırt edilsin (demo/otomatik içerik DB'den ayırt edilebilir olmalı).
- `bot_prepare_whatsapp_reply` / `bot_finalize_whatsapp_reply`: `admin_*` çiftinin
  **service_role** karşılığı. Yönetici çiftine DOKUNULMAZ; grant yalnız `service_role`.
- `whatsapp_bot_settings` tek satır: `enabled` · `model` ·
  `max_replies_per_sender_per_day` · `handover_keywords` · `fallback_message`.
  **Ürün kararı SQL update'i olsun, kod değişikliği değil** (`cadde_settings` deseni).
- Hız limiti için **yeni tablo yazılmaz**: mevcut `edge_rate_limits` (`scope`+`client_key`),
  `client_key = wa_id_hash`.
- **Kabul:** `check:migrations` temiz; `anon`/`authenticated` yeni RPC'leri çağıramıyor.

**W05 — `whatsapp-autoreply` fonksiyonu (yanıtı üreten beyin)** · orta
- Saf mantık `_shared/whatsapp-autoreply.ts`'te (Deno API'si kullanmaz → vitest'te test
  edilir; `_shared/*.test.ts` deseni kurulu).
- **Mevcut parçalar yeniden kullanılır:** `ai_knowledge_search` RPC ·
  `_shared/ai-assistant-context.ts` (`buildContextBlock` · `buildContextTurns` ·
  `collectSources`) · `providers.ts` `callModel` · `_shared/assistant-usage.ts`
  `recordAssistantUsage` (`functionName: "whatsapp-autoreply"` — maliyet görünür olsun).
- ⚠️ **Kitle `["public"]` SABİT.** `resolveAudiences()` KULLANILMAZ (o non-admin'e `member`
  de verir). Sözleşme testi bunu kilitler: `member`/`admin` sızarsa test kırılır.
- ⚠️ **WhatsApp promptu AYRIDIR.** `SITE_ASSISTANT_SYSTEM_PROMPT` "Markdown kullan" diyor;
  WhatsApp markdown render ETMEZ (`**kalın**` ham görünür, WhatsApp `*kalın*` ister).
  Yeni `WHATSAPP_ASSISTANT_SYSTEM_PROMPT`: düz metin, tek `*yıldız*`, **kısa**
  (hedef ≤ 600 karakter; sert tavan 4000 — DB CHECK'i de 4000).
- **Bağlam yoksa uydurma yok:** `hasContext=false` → `fallback_message` + konuşma insana
  devredilir (`status='new'`, atanmamış). Site asistanındaki disiplinin aynısı.
- **İnsan devri:** `handover_keywords` ("insan", "temsilci", "yetkili") eşleşirse bot susar
  ve o konuşmada bir daha yazmaz.
- **Hız limiti:** gönderen başına günlük tavan — kimliksiz kanal her mesajda hem model
  hem Meta konuşma ücreti doğurur.
- `enabled=false` iken fonksiyon hiçbir şey yapmadan döner (redeploy'suz kapatma).

**W06 — Webhook'tan tetikleme + deploy** · küçük
- `whatsapp-webhook` olayı yazdıktan **sonra** `whatsapp-autoreply`'ı ateşler ve
  **beklemez** (`EdgeRuntime.waitUntil` + servis-rol başlığı). Meta'ya dönen 200 gecikmez.
- ⚠️ İmza doğrulama yolu **DEĞİŞMEZ**. Tetikleme yalnız `eventType==='inbound_message'`
  ve metin varsa; `message_status` olayları tetiklemez.
- `config.toml`'a `[functions.whatsapp-autoreply] verify_jwt = false` + kendi paylaşılan
  secret'ı.
- **Kabul:** `check:functions` sapma **0**; canlı sürümde `verify_jwt=False` ölçülmüş.

### Faz 3 — test ve rapor (revizyonun asıl istediği)

**W07 — Test turu** · küçük · **KANIT TURU**

| # | Senaryo | Beklenen |
|---|---|---|
| 1 | Blog korpusunda cevabı olan temel soru | Türkçe, kısa, doğru yanıt |
| 2 | Korpusta olmayan soru | `fallback_message` + insana devir; **uydurma YOK** |
| 3 | "insan" yaz | Bot susar, konuşma insana geçer |
| 4 | Aynı numaradan tavan üstü mesaj | Hız limiti devreye girer, sessizce çökmez |
| 5 | Panelden yönetici yanıtı | Hâlâ çalışıyor (W02 regresyonu yok) |
| 6 | İmzasız/yanlış imzalı POST | 401, hiçbir şey yazılmaz |
| 7 | `enabled=false` | Bot yazmaz; mesaj yine de konuşmaya düşer |
| 8 | 24 saatlik pencere dışı | Serbest metin gönderilmez (şablon kuralı) |
| 9 | Panelde ayrım | Bot mesajları `is_automated=true` görünür |

- Maliyet ölçümü: `assistant_usage` kayıtlarından test turunun çağrı/token sayısı.
- Bulunan her sorun **madde madde**; çözülenler ve çözülmeyenler AYRI yazılır.

**W08 — Test notlarını revizyon yorumlarına yaz + kapanış** · küçük
- ⚠️ **REV numarası bilinmiyor** — `docs/` içinde bu isteğin numarası geçmiyor (yalnız
  `#REV-034` ve `#REV-056` var). Numara `/admin/revision-requests` panelinden alınır;
  notlar **o kaydın yorum thread'ine** yazılır (istek metninin dediği yer).
- Bu dosyada U09 + W01–W08 ✅ + kanıt (commit hash, HTTP kodları, ölçümler) →
  **Kapananlar** tablosuna taşı.
- `src/lib/admin-shell/admin-updates/2026-10.ts`'e kayıt (18:00 Berlin özet maili
  buradan beslenir).

---

## M — Topluluk Motoru: sürtünmesiz ücretsiz işlevler (M01–M27)

> **Kaynak plan:** [`docs/plans/2026-09-30-topluluk-motoru-ucretsiz-islevler-plani.md`](../plans/2026-09-30-topluluk-motoru-ucretsiz-islevler-plani.md)
> — bağlam, ölçülen taban, T1/T2 tuzakları ve faz ayrıntıları orada. Batch'e başlamadan
> önce planın ilgili fazını oku; bu liste yalnız sıra + kapsam + kabul özeti.
> **Durum:** plan "onaya sunuldu" — M01'den önce onayı teyit et.
> **Sıra:** M01 → M02…M07 (Faz 1 etkinlik) → M08…M10 (Faz 5 panel) → M11…M13 (Faz 3 davet)
> → M14…M16 (Faz 6 metrik) → M17…M23 (Faz 2 tavsiye) → M24…M27 (Faz 4 özet mail).
> Faz 6'nın Faz 2'den önce olması bilinçli: tavsiyeye girmeden önce traction ölçülecek.

**Tüm M batch'lerinde geçerli (tekrar yazılmayacak):**

- Kapanış turu: yukarıdaki "Her batch'te zorunlu doğrulama" bloğu aynen.
- Migration akışı: parent `supabase/migrations/` → dry-run → uygula → `applied/` altına TAŞI;
  zaman damgası tekrar kullanılmaz. Her M migration'ı **ayrı dosya** (tek oturumda uygulanır).
- **T2:** `/events`, `/events/create`, `/addcom`, `/tavsiye`, `/liderlik` rotalarına
  **`RequireFeature` EKLENMEZ** (`events.create`/`offers.create`'in `role_features`'ta kuralı
  yok — flag'e hiç dokunma). M01'deki sözleşme testi bunu kilitler.
- Yeni `src/lib/**` dosyası → `npm run ingest:tools` + üretilen dosyalar commit'e dahil.
- `as TablesInsert<...>` CAST YASAK — `satisfies`. RPC hataları **düz nesne** —
  `instanceof Error` ile daraltma; `code`/`details`/`hint` oku.
- DB'ye yazılan `value`/`key` alanlarından Türkçe karakter silinmez; vokabüler tek kaynaktan.

### Faz 0 — ücretsizliği kilitle

**M01 — Sözleşme testi + CLAUDE.md bölümü** · küçük, kod+migration yok
- `src/lib/community-free-features.test.ts` (yeni): `App.tsx` metninden `/events`,
  `/events/create`, `/addcom`, `/tavsiye`, `/liderlik` rotalarının `RequireFeature`
  **içermediğini** doğrular; `cadde.access`'in bilinçli korunduğunu belgeler.
  Desen: `redirects.test.ts`. ⚠️ Çıplak `indexOf + slice` YASAK — `@/test/source-slice`
  zorunlu (`test-source-slice-contract.test.ts` kilitler).
- ⚠️ `/tavsiye` ve `/liderlik` rotaları henüz YOK (M20/M12'de eklenecek) — test, rota
  yokken de yeşil kalmalı; "rota varsa guard'sız olmalı" biçiminde yaz.
- `CLAUDE.md`'ye "Ücretsiz topluluk işlevleri" bölümü: T1 (RLS status zorlamıyor) ve
  T2 (kuralı olmayan feature) tuzakları.
- **Kabul:** test yeşil; M12/M20'de rota eklenince test değişmeden yeşil kalıyor.

### Faz 1 — etkinlik: ilk-onay kuralı + katılım

**M02 — Migration 1: `approval_source` + ayar tablosu + `create_event_v1`**
- `events.approval_source text` (`'auto'|'admin'`).
- Etkinlik ayar tablosu (`cadde_settings` deseni): aktif limit (=2) + bireysel dışı rol
  muafiyeti — ürün kararı SQL update'i olsun, kod değişikliği değil.
- **RPC `create_event_v1(...)` security definer — tek yazma yolu:** ilk etkinlik →
  `pending` + `approval_requests`'e `event_create` satırı; sonrası → `published` +
  `approval_source='auto'`; aynı anda en fazla 2 aktif (`published` ve
  `event_date >= current_date`) → `errcode='P0001'`, mesaj `event_active_limit`.
- **Kabul:** canlıya uygulandı + `applied/`'a taşındı; SQL smoke: ilk/ikinci/üçüncü
  etkinlik senaryoları RPC üzerinden doğrulandı.

**M03 — Migration 2: RLS sıkılaştırma + status trigger (T1'i kapatır)**
- INSERT politikası `status='pending'` zorunlu; status değiştirmeyi engelleyen **trigger**
  (RLS, UPDATE'te eski satırı göremez). Yayınlama yalnız RPC + `is_admin()`.
- **Kabul (ölç, varsayma):** PostgREST'e doğrudan `status='published'` POST → **reddedildi**
  (yanıt gövdesi kanıt olarak buraya yazılır).

**M04 — Migration 3: `event_attendees` + join/leave RPC'leri**
- `event_attendees (event_id, user_id)` PK · `created_at` · `status` (`going|cancelled`).
  RLS: kendi kaydını yazar/siler; sahip+admin okur; sayaç **aggregate RPC** ile (satırlar değil).
- `join_event_v1`/`leave_event_v1`: `max_attendees` kontrolü **SQL'de** (istemcide yarış olur).
- **Kabul:** SQL smoke — kontenjan dolunca join reddediliyor.

**M05 — Kod: events-api + events-rules + ayna sözleşme testi**
- `src/lib/events-api.ts`: `createEvent` artık `create_event_v1` RPC'sini çağırır;
  `joinEvent`/`leaveEvent`/`fetchEventAttendeeCount` eklenir.
- `src/lib/events-rules.ts` (yeni): limit sabiti + hata kodu → Türkçe mesaj.
- `src/lib/events-first-approval.test.ts` (yeni): migration metnindeki sabit ile
  `events-rules.ts` sabiti birebir + hata kodları iki yönlü eşleşiyor (desen:
  `cadde-rules.ts`). ⚠️ Yeni lib dosyaları → `ingest:tools`.
- **Kabul:** ayna test yeşil; `createEvent`'ten doğrudan `insert` çağrısı kalktı.

**M06 — Kod UI: katılım düğmesi + MyEventsPanel**
- `src/components/events/EventAttendeeButton.tsx` (yeni).
- `MyEventsPanel.tsx`: limit ve onay durumu kullanıcıya açıkça anlatılır.
- **Kabul:** tsc/lint/test yeşil; etkinlik detayında katılım düğmesi çalışıyor.

**M07 — Faz 1 canlı doğrulama (elle) · kanıt zorunlu**
- Test hesabıyla: **ilk** etkinlik → `pending` + `approval_requests` satırı → admin onayı;
  **ikinci** → doğrudan `published`, `approval_source='auto'`; **üçüncü aktif** →
  `event_active_limit`; PostgREST doğrudan `status='published'` POST → red (M03 tekrar).
- **Kabul:** dört ölçümün sonucu da bu batch'in kanıt satırında.

### Faz 5 — panel hızlı eylemleri + ilgi kaydı

**M08 — QuickActionsCard**
- `src/lib/community-quick-actions.ts` (yeni, tek kaynak liste) +
  `src/components/profile/QuickActionsCard.tsx`; `ProfileSidebarLayout` ilk ekranı, tüm roller.
- Başlangıçta: "Etkinlik oluştur" · "Grup ekle". **"Davet et" M12'de, "Tavsiye iste"
  M20'de** listeye eklenir (rota yokken ölü link koyma).
- **Kabul:** kart tüm rollerde görünüyor; iki eylem de hedefine gidiyor.

**M09 — GettingStartedCard**
- `src/components/profile/GettingStartedCard.tsx`: profili tamamla · ilk hizmet/ürün/etkinlik ·
  3 davet. Tamamlanma **gerçek veriden** okunur (uydurma yüzde yok).
- ⚠️ "3 davet" satırı M11–M13'e kadar veri kaynağı olmadığından pasif/ölçüsüz gösterilir
  ya da sonraya bırakılır — sahte tamamlanma yazma.
- **Kabul:** her satırın durumu ilgili tablodan okunuyor; elle SQL ile karşılaştırıldı.

**M10 — feature_interest + EventFeaturePromo (kilitli ücretli yüzey)**
- Migration (küçük): `feature_interest (feature_key, user_id, created_at)` + RLS (kendi satırı).
- `src/components/events/EventFeaturePromo.tsx` (yeni): "Öne çıkar" / "Bilet sat" **kilitli**
  kart + ilgi kaydı. Ödeme YOK (Stripe ayrı plan).
- **Kabul:** karta tıklayınca `feature_interest` satırı oluşuyor (DB ölçümü).

### Faz 3 — davet + liderlik

**M11 — Migration: davet tabloları + RPC'ler + rozet ayarları**
- `user_invites (code benzersiz, owner_user_id, created_at)` — alfabe:
  `referral-codes.ts`'teki `SAFE_CHARS` yeniden kullanılır. ⚠️ Mevcut `referral_codes`
  tablosu admin'in **pazarlama kodu** — karıştırma, dokunma.
- `user_invite_redemptions (code, invited_user_id BENZERSİZ, redeemed_at)`.
- RPC: `get_or_create_my_invite_code()` · `redeem_invite_code(p_code)` ·
  `get_invite_leaderboard(p_limit)`.
- ⚠️ Rozet eşikleri **ayar tablosundan** (M02 deseni), koda gömülmez.
- ⚠️ Liderlik SQL'i dizin görünürlüğünü aynen yansıtır: `is_directory_visible=false` roller
  ve `[PLACEHOLDER]` kayıtlar **SQL'de** elenir (AI korpus sızıntısı tekrarı).
- **Kabul:** SQL smoke — leaderboard çıktısında admin/test/placeholder yok.

**M12 — Kod: invites-api + LeaderboardPage + InviteCard**
- `src/lib/invites-api.ts` · `src/lib/invites-badges.ts` (eşik → rozet) ·
  `src/pages/LeaderboardPage.tsx` (`/liderlik`, `lazyWithReload`, **RequireFeature YOK**) ·
  `src/components/invites/InviteCard.tsx` (link + kopyala + QR — `referral-qr.ts` yeniden).
- Anonime açılacaksa: RPC'nin `anon` EXECUTE grant'i **ve gövdede auth kontrolü olmadığı**
  ayrı ayrı doğrulanır. `community-quick-actions.ts`'e "Davet et" eklenir (M08).
- Sitemap'e ancak CLAUDE.md'deki **3 kriter** doğrulanırsa girer. Veri bağımlı `useSeo` → `deps`.
- **Kabul:** `/liderlik` canlıda; quick action linki çalışıyor.

**M13 — Kayıt akışı + Faz 3 canlı doğrulama**
- Kayıt akışında `redeem_invite_code` çağrısı (davet linkiyle gelen kullanıcı).
- **Kabul (canlı):** davet linkiyle yeni kayıt → `user_invite_redemptions` satırı; aynı
  kullanıcı ikinci kez sayılmıyor; `/liderlik`'te admin ve test hesapları görünmüyor.

### Faz 6 — admin traction panosu

**M14 — Migration: 5 türetilmiş metrik view'ı**
- `metrics_weekly_active_users` · `metrics_content_created` · `metrics_recommendation_response_rate`
  (M17 öncesi boş dönebilir — normal) · `metrics_invite_signups` · `metrics_30d_return_rate`.
- ⚠️ Hepsi `security_invoker` view veya `is_admin()` gövdeli RPC; ham view'a **anon grant yok**.
  ⚠️ **Materialized view YASAK** (1 GB RAM refresh riski).
- **Kabul:** her view admin olarak SELECT edilebiliyor; anon → hata (ölçüldü).

**M15 — Kod: AdminTractionPage**
- `src/lib/admin/admin-traction-api.ts` · `src/pages/admin/AdminTractionPage.tsx`
  (`KpiCard` muhasebe deseni) · navigasyon satırı
  `admin-navigation-registry/overview.ts`'e eklenir.
- **Kabul:** sayfa admin nav'dan açılıyor; beş metrik kartı dolu.

**M16 — Faz 6 canlı doğrulama**
- Her metrik için SQL çıktısı ile panel rakamı **elle** karşılaştırılır; beşi de kanıt satırına.

### Faz 2 — Tavsiye İste (en büyük modül)

**M17 — Migration 1: tablolar + RPC-only yazma + ban kill-switch**
- `recommendation_requests`: `id, user_id, title, body, category_slug, country, city,
  status (open|answered|closed), diaspora_key + CHECK, created_at`. ⚠️ CLAUDE.md kuralı:
  yeni topluluk içerik tablosu `diaspora_key` taşır ve liste filtresine girer.
- `recommendation_answers`: `id, request_id, user_id, body, is_professional, created_at`.
- RLS: okuma herkese açık (yayınlanmış); yazma **yalnız security-definer RPC**
  (`create_recommendation_request_v1`, `answer_recommendation_v1`).
- Ban kill-switch tek noktadan (`has_cadde_feature` deseni) — yeni yazma yolları otomatik kapsansın.
- **Kabul:** banlı kullanıcı RPC'den reddediliyor (SQL smoke).

**M18 — Migration 2: `match_recommendation_professionals(request_id)`**
- Kategori + şehir/ülke eşleşen profesyoneller; **eşleşme eler değil sıralar** (`match_rank`
  dersi); `catalog_search_normalize()` ile katlanır.
- ⚠️ **`catalog_search_documents.search_text` KULLANILMAZ** — iletişim bilgisi taşır.
- **Kabul:** örnek taleple SQL smoke; dönen listede iletişim bilgisi sızıntısı yok.

**M19 — Kod lib: api + schemas + rules + hook**
- `src/lib/recommendations-api.ts` · `recommendations-schemas.ts` (Zod + z.infer) ·
  `recommendations-rules.ts` (hata → Türkçe; SQL ile aynalı + ayna testi) ·
  `src/hooks/use-recommendations.ts` (React Query). `ingest:tools`.
- **Kabul:** ayna test yeşil; modül `muhasebe` desenini izliyor.

**M20 — Kod sayfalar: /tavsiye + detay + rotalar**
- `src/pages/RecommendationsPage.tsx` (`/tavsiye`) · `RecommendationDetailPage.tsx`
  (`/tavsiye/:id`) · `App.tsx`'e `lazyWithReload` ile ekle, **RequireFeature YOK**.
- Türkçe arama `trIncludes`/`trCompare` (`text-normalization.ts`). `useSeo` → `deps`.
  `community-quick-actions.ts`'e "Tavsiye iste" eklenir (M08).
- **Kabul:** M01 sözleşme testi değişmeden yeşil; anonim ziyaretçi listeyi görüyor.

**M21 — Kod bileşenler + Cadde kartı**
- `src/components/recommendations/*` (form, kart, yanıt listesi) ·
  `src/components/cadde/CaddeRecommendationCard.tsx` (yalnız görünürlük).
- ⚠️ Cadde'nin bant/skor sıralamasına ve hedefleme kurallarına **bulaşmaz** (karar 2).
- **Kabul:** Cadde akışında kart görünüyor; sıralama testleri değişmeden yeşil.

**M22 — Kilitli profesyonel gelen kutusu**
- Eşleşen profesyonele bildirim düşer ama iletişim detayı `ProLockedInboxCard` ile
  **kilitli** → `feature_interest` kaydı (M10). Desen: `MessagesInbox.tsx`.
- **Kabul:** profesyonel test hesabında kilitli kart + ilgi satırı (DB ölçümü).

**M23 — Faz 2 canlı doğrulama**
- Anonim `/tavsiye` listesini görür → üye talep açar → eşleşen profesyonele bildirim düşer
  → kilitli kutu görünür. Dördü de kanıt satırına.

### Faz 4 — haftalık şehir özeti

**M24 — Migration 1: `user_city_follows` + outbox CHECK genişletme**
- `user_city_follows (user_id, country, city birlikte PK)`; RLS: kendi satırları.
- ⚠️ `notification_email_outbox.event_type` CHECK'i canlıda **7 değere kilitli** —
  `weekly_city_digest` eklemek migration ister. TS birliğini tek başına genişletirsen RPC
  reddeder, kayıt **sessizce kaybolur**.
- **Kabul:** CHECK'in yeni değeri kabul ettiği `information_schema`'dan ölçüldü.

**M25 — Migration 2: `enqueue_weekly_city_digest()` + pg_cron**
- Son 7 günün yeni etkinlik/tavsiye/profesyonelleri; outbox'a **kullanıcı başına tek satır**
  (`dedupe_key = user_id || hafta`). `pg_cron` haftada bir; gönderimi mevcut
  `notification-email-drain` cron'u yapar.
- ⚠️ **1 GB RAM:** `geo_cities` 76.990 satır — satır başına fonksiyon YASAK; önce
  `select distinct` ile küçült, sonra join et. ⚠️ PostgREST 1000 satır tavanı →
  `fetchAllRows()` deseni (`scripts/generate-sitemap.mjs`).
- **Kabul:** fonksiyon elle çağrıldı, outbox satırı oluştu (SQL ölçümü).

**M26 — Kod: city-follows-api + CityFollowCard + tercih anahtarı**
- `src/lib/city-follows-api.ts` · `src/components/profile/CityFollowCard.tsx` ·
  `NotificationPreferencesPage.tsx`'e özet aç/kapa. Mail HTML: hoş geldin maili deseni.
  `ingest:tools`.
- **Kabul:** takibi ekle/sil uçtan uca çalışıyor; tercih anahtarı outbox'a yansıyor.

**M27 — Faz 4 canlı doğrulama · kanıt zorunlu**
- `enqueue_weekly_city_digest()` elle tetiklenir → outbox satırı → drenaj sonrası
  **`sent_at` dolu**. ⚠️ "cron yeşil" kanıt DEĞİLDİR (Radar dersi, 28.09/30.09).
- **Kabul:** gerçek mail test hesabına ulaştı; `sent_at` ölçümü kanıt satırında.

---

## G — Dijital Gruplar Motoru (G01–G25)

> **Kaynak plan:** [`docs/plans/2026-09-30-dijital-gruplar-plani.md`](../plans/2026-09-30-dijital-gruplar-plani.md)
> — bağlam, M0 keşif tablosu, K1–K5 canlı kusurları ve batch ayrıntıları orada. Batch'e
> başlamadan önce planın ilgili fazını oku; bu liste yalnız sıra + kapsam + kabul özeti.
> **Politika + tasarım:** `docs/dijital-gruplar/` (G01'de taşınır). Prompt/tanıtım dosyaları
> pakette kalır. **İlgili:** #REV-056 · **K08'i cevaplıyor** · **X'teki "WhatsApp grupları
> sayfası (T22)" maddesini devralıyor** · **K02**'nin uygulama tarafı G04–G05.
> **Durum:** plan "onaya sunuldu" — G01'den önce onayı teyit et.
> **Sıra:** G01→G03 (zemin+güvenlik) → G04–G05 (OTP) · G06–G07 (kurumsal doğrulama) →
> G08 (spike) → G09→G11 (veri modeli) → G12→G17 (iş kuralları) → G18→G21 (sayfalar) →
> G22→G25 (otomasyon, bildirim, moderatör, QA).

**M0 keşif 30.09'da yapıldı — tasarımın BEŞ varsayımı çürüdü. Ezberleme, plandaki tabloyu oku:**
`whatsapp_link_requests` YOK · `whatsapp_landing_comments`/`_likes`/`_follows` **ÜÇÜ DE YOK**
(grup sayfası gönderileri sıfırdan) · `site_settings` anahtar-değer DEĞİL (bayrak oraya konamaz,
`cadde_settings` deseniyle `group_settings` açılacak) · "Seviye 2 kuruluş" kavramı YOK
(`trust_level` yalnız `radar_news_sources`'ta) · telefon OTP hiç kurulmamış
(`user_verifications` **0 satır**, `auth.users`'da **0 onaylı telefon**).
**Hazır çıkanlar:** `pg_cron`+`pg_net` (6 aktif iş) · `geo_countries` 251 / `geo_cities` 76.992 ·
`user_verifications` şeması (OTP aynası için doğru) · `catalog_item_claims`
(`claim_type`+`evidence jsonb`+reviewer — kurumsal doğrulamanın birebir karşılığı) ·
`whatsapp_landing_editors` + 5 RPC (sahip paneli temeli) · 6 aktif `Community_*`/`Organization_*` rolü.

**⚠️ Canlıda AÇIK iki güvenlik kusuru (G02/G03 bunun için önde):**
`whatsapp_link` anonime **tamamen açık** (tasarımın kabul testi #5 bugün BAŞARISIZ) ·
`Anyone can insert whatsapp landings` politikası `{anon,authenticated}` ve `WITH CHECK` **yok**
(anonim herkes sınırsız grup ekleyebiliyor).

**Tüm G batch'lerinde geçerli (tekrar yazılmayacak):**

- Kapanış turu: yukarıdaki "Her batch'te zorunlu doğrulama" bloğu aynen.
- Migration akışı: parent → dry-run → uygula → `applied/` altına **TAŞI**; zaman damgası tekrar
  kullanılmaz. Her G migration'ı **ayrı dosya** (tek oturumda uygulanır).
- Şehir/ülke **`geo_*`**'tan gelir, **`cadde_*`'tan DEĞİL** (iki ayrık katalog — Cadde'de aylarca
  sessiz kusur üretti). Serbest metin konum yok.
- Her eşik/bayrak **`group_settings`** satırıdır; **kodda sabit yazılmaz** (`cadde_settings` deseni).
- `as TablesInsert<...>` CAST YASAK → `satisfies`. RPC hataları **düz nesne** —
  `instanceof Error` ile daraltma; `code`/`details`/`hint` oku.
- Yeni `src/lib/**` dosyası → `npm run ingest:tools`, üretilen dosyalar commit'e dahil.
- ⚠️ **1 GB RAM:** `geo_cities` 76.992 satır — satır başına fonksiyon uygulayan sorgu YASAK;
  önce `select distinct`, sonra join.

### Faz A — zemin ve canlı güvenlik açıkları

**✅ G01 — Paket dosyalarını repoya al + CLAUDE.md eki** · KAPANDI 01.10

> **Kanıt:** `docs/dijital-gruplar/` = `01_politika_v1.1.md` · `02_motor-tasarimi.md` ·
> `07_insa-notlari-eklentisi.md` · `README.md`. CLAUDE.md'ye **"Dijital Gruplar modülü"**
> bölümü eklendi (6 değişmez kural + çürüyen 5 varsayım tablosu + K1–K5 kusurları).
> Kök temiz: paket + zip repo dışına **TAŞINDI** (silinmedi) →
> `C:\temp_private\corteqs\_paketler\`. `check:drift` ✓ · `verify:text` ✓ · tsc 0.
> ⚠️ **`07` ikinci bir takip listesi DEĞİLDİR.** Paket onu `claude_corteqs-insa-notlari.md`
> sonuna eklemeyi söylüyor ama **o dosya bu repoda YOK** (ölçüldü: `git ls-files` 0 eşleşme,
> repoda `[ ] **BE**` deseni taşıyan doküman yok) — Barış'ın repo dışı notları. 07 arşiv
> olarak kondu; canlı takip tek yerde: **bu dosyanın G bölümü**. İkisi ayrışırsa KALANLAR doğru.
> ⚠️ `docs/README.md` indeksine satır EKLENMEDİ — o dosyada başka oturumun commit'lenmemiş
> değişiklikleri var, karıştırmamak için dokunulmadı. Klasör CLAUDE.md ve buradan bulunur.
> ⚠️ Pakette kalan `00` · `03`–`06` (prompt + tanıtım) repoya ALINMADI — iş kuralı taşımazlar.

**✅ G02 — RLS temizliği: anonim INSERT kapatma + mükerrer politika silme** · KAPANDI 01.10

> **KAPANDI 2026-10-01 · migration `20261001100000_whatsapp_landings_rls_cleanup.sql`**
> (canlıya uygulandı · `applied/` altında · `schema_migrations` kaydı atıldı ·
> `check:migrations` **442 dosya / 442 canlı kayıt · sapma yok**).
>
> **CANLI KANIT (psql, hepsi rollback'li):**
> | # | Senaryo | Sonuç |
> |---|---|---|
> | 1 | `set role anon` → INSERT | **`42501`** new row violates RLS ✅ |
> | 2 | Girişli kullanıcı KENDİ `user_id`'siyle INSERT | **başarılı** (`INSERT 0 1`) — form kırılmadı ✅ |
> | 3 | Girişli kullanıcı BAŞKASININ `user_id`'siyle INSERT | **`42501`** ✅ |
> | 4 | Politika sayısı | **11 → 8** (INSERT 2→1, SELECT 5→3) ✅ |
> | 5 | `set role anon` → SELECT | **10 satır** — dizin kırılmadı ✅ |
>
> **Yeni INSERT politikası YAZILMADI** — zaten doğru olan `Users can create own landings`
> (`authenticated`, `WITH CHECK (auth.uid() = user_id)`) duruyordu; permissive politikalar
> OR'landığı için yanlış olan silinince INSERT yolu kendiliğinden doğruya düştü.
>
> **Arayüz zaten kapalıydı:** `handleGroupSubmit` → `ensureSignedInForGroupSubmit()`
> ("Üye olmalısınız" + Google OAuth). Açık olan yol **formu atlayıp doğrudan PostgREST'e**
> POST atmaktı; kapanan o. Sözleşme testi `src/lib/whatsapp-landings-insert-auth-contract.test.ts`
> (8 test) **iki yakayı birden** kilitler — mutasyonla sınandı, ikisi de düştü.
>
> 🔴 **DAVET LİNKİ HÂLÂ AÇIK — G02 onu kapatmadı ve kapatmaya çalışmadı.** Ölçüldü:
> anon hâlâ 10 satırın 10'unda `whatsapp_link` okuyabiliyor (`Anyone can view approved
> landings` tüm kolonları döner). **K1'i kapatan G03'tür.**
>
> ⏭️ **Günlük 5 gönderim sınırı bu batch'te YAPILMADI** (kullanıcı kararı 01.10, seçenek a):
> sınır `group_settings`'ten okunacak, o tablo **G09**'da açılıyor; eşiği koda sabit yazmak
> CLAUDE.md kuralına aykırı olurdu. **G09'dan sonra ayrı küçük batch** olarak yapılacak.
>
> ⚠️ **Yan bulgu (G02 kapsamı DIŞI, ele alınmadı):** `anon` rolünün `whatsapp_landings`
> üzerinde tablo düzeyinde `INSERT, UPDATE, DELETE, TRUNCATE` **grant'ı var**. Bugün
> zararsız — RLS hepsini kesiyor — ama RLS bir gün kapatılırsa anon tabloyu
> `TRUNCATE` edebilir. Grant daraltma ayrı bir karar; burada yalnız kayda geçiriliyor.

> ⚠️ **ÖLÇÜLDÜ 01.10 — bu maddedeki iki ayrıntı YANLIŞ, düzeltilmeden migration yazma:**
> 1. **`submitted_by` diye bir kolon YOK.** `whatsapp_landings`'in sahip kolonu **`user_id`**
>    (27 kolon listelendi). Plandaki `WITH CHECK (auth.uid() = submitted_by)` canlıda
>    `42703 column does not exist` ile patlar.
> 2. **`Anyone can insert whatsapp landings` politikasında `WITH CHECK` YOK değil, `true`.**
>    Etkisi aynı (hiçbir şey kısıtlamıyor) ama `pg_policies.with_check = 'true'` görünür —
>    "boş mu" diye arayan bir kontrol onu bulamaz.
>
> **Ölçülen 11 politika (01.10):** INSERT 2 · SELECT 5 · UPDATE 2 · DELETE 2.
> Zaten DOĞRU olan `Users can create own landings` (authenticated, `WITH CHECK (auth.uid() =
> user_id)`) **duruyor** — `Anyone can insert...` silinince INSERT yolu kendiliğinden doğru
> politikaya düşer, yeni INSERT politikası YAZMAYA GEREK YOK.
> Mükerrer SELECT çiftleri doğrulandı: `Anyone can view approved landings` ≡ `Public approved
> whatsapp landings select` · `Users can view own landings` ≡ `Owners can select own whatsapp
> landings`. ⚠️ Hangisinin silineceği **keyfi değil**: kalan politika anon'a `status='approved'`
> satırının TÜM kolonlarını (yani `whatsapp_link`'i) döndürmeye devam eder — K1'i kapatan
> **G03'tür**, G02 değil. G02'yi tek başına uygulayıp "link kapandı" sanma.
- `Anyone can insert whatsapp landings` kaldırılır → `authenticated` + `WITH CHECK (auth.uid()
  = submitted_by)`. 2 mükerrer SELECT politikası silinir (`Public approved whatsapp landings
  select`, `Owners can select own whatsapp landings`).
- Günlük 5 gönderim sınırı `group_settings`'ten okunan trigger/RPC'ye bağlanır.
- **Kabul:** anonim INSERT `42501`; aynı kullanıcı 6. gönderimde reddedilir.

**G03 — Davet linki anonime kapanır + tek kapı RPC** · ÜÇE BÖLÜNDÜ (kullanıcı kararı 01.10)

> ⚠️ **ÖLÇÜLDÜ 01.10 — sızıntı K1'de yazılandan GENİŞ.** Anon'a açık olan yalnız
> `whatsapp_link` değil: **`admin_contact` 10/10 satırda DOLU** ve biçimi
> `Ad Soyad e-posta@alan.com +90xxxxxxxxxx` — yani grup adminlerinin **adı +
> e-postası + telefonu**. Kişisel veri ve enumeration yüzeyi. K1'i buna göre oku.
>
> ⚠️ **Neden tek batch'te yapılamadı:** RLS **satır** düzeyinde çalışır, **kolon**
> düzeyinde değil — "satırı göster, kolonu gizle" politikası YAZILAMAZ. Kolon
> grant'ını çekmek de çözüm değil: istemcinin iki anon yolu da (`getLanding`,
> `listLandings`) `select("*")` kullanıyor; çekilince ikisi de `42501` ile düşer ve
> kullanıcıya "izin yok" diye DEĞİL **"dizin boş"** diye görünür.

**✅ G03a — PII'siz view + davet RPC'si (salt ekleme)** · KAPANDI 01.10

> **Migration `20261001110000_whatsapp_landings_public_view_and_invite_rpc.sql`**
> canlıya uygulandı · `applied/` altında · `schema_migrations` kaydı atıldı ·
> `check:migrations` sapmasız · **RLS politikaları DEĞİŞMEDİ (8 → 8)**.
>
> `public.whatsapp_landings_public` view'ı: `whatsapp_link` · `admin_contact` ·
> `user_id` · `rejection_reason` **`null::<tip>` olarak** döner. Kolon adları ve
> sırası tabanla AYNI tutuldu → `rowToLanding` DEĞİŞMEDEN çalışır, G03b yalnızca
> tablo adını değiştirir.
> `security_invoker = false` (taban RLS'i bypass eder — G03c'de anon'un taban
> yetkisi alınınca view çalışmaya devam etsin diye) + `security_barrier = true`.
> ⚠️ Bu yüzden **`status = 'approved'` filtresi view'ın İÇİNDEDİR**; kaldıran,
> `pending` ve `rejected` grupları anonime açar.
>
> `get_whatsapp_landing_invite(p_slug)` · security definer · `search_path` sabit ·
> `anon`/`public`'ten EXECUTE geri alındı, yalnız `authenticated`.
>
> **CANLI KANIT (hepsi rollback'li):**
> | # | Senaryo | Sonuç |
> |---|---|---|
> | 1 | anon → view SELECT | **10 satır**, `whatsapp_link`/`admin_contact`/`user_id` **0 sızıntı** ✅ |
> | 2 | anon → davet RPC | **permission denied for function** ✅ |
> | 3 | girişli → davet RPC (geçerli grup) | `https://chat.whatsapp.com/…` döndü ✅ |
> | 4 | girişli → olmayan slug | **`P0002`** group not found ✅ |
> | 5 | girişli → **linki BOŞ** grup | **`P0002`** — boş string DÖNMÜYOR ✅ |
>
> ⚠️ **5 numara testte bulundu ve migration düzeltildi.** İlk sürüm ham kolonu
> döndürüyordu; canlıda yayındaki 10 grubun **2'sinin linki boş string** (K4'teki
> bilinen veri kusuru). İstemci boş string'i geçerli link sanıp **tıklanamayan bir
> "Katıl" düğmesi** çizerdi ve hata hiçbir yerde görünmezdi. Çözüm:
> `nullif(trim(l.whatsapp_link), '')`. **Gevşetme.**
>
> Sözleşme testi: `src/lib/whatsapp-landings-public-view-contract.test.ts` (14 test),
> 4 mutasyonla sınandı (PII kolonunu açma · `approved` filtresini silme ·
> `security_invoker=true` · `nullif` kaldırma) — dördü de yakalandı.
>
> ⏭️ **Günlük 20 çağrı sınırı YOK** — `group_settings` G09'da açılıyor, eşik koda
> sabit yazılmaz. G09 sonrası ayrı batch (G02'nin 5 gönderim sınırıyla aynı kuyruk).
> ⏭️ **`types.ts` yeniden üretilmedi** — view + RPC tipleri G03b'de gerekecek,
> regen orada yapılacak (Management API + geçerli `SUPABASE_ACCESS_TOKEN`).

**✅ G03b — İstemci göçü: dizin ve detay view'dan okuyor** · KAPANDI 01.10

> `getLanding` + `listLandings` → `whatsapp_landings_public`. Yeni
> `fetchLandingInviteUrl(slug)` davet linkini RPC'den alır ve **`42501` (giriş
> gerek) ile `P0002` (link yok) hatalarını AYIRT eder** — ikisini tek mesaja
> indirmek, kullanıcıya giriş yapması gerektiğini söylemeyen bir düğme üretirdi.
>
> ⚠️ **ASIL RİSK BURADAYDI:** eski CTA `hasLink` yanlışsa düğmeyi **hiç
> çizmiyordu.** Link artık satırla gelmediği için o davranış bırakılsaydı
> ziyaretçi için "Katıl" düğmesi **SESSİZCE YOK OLURDU**. Dört durumun dördünün
> de görünür karşılığı var: `ready` → dış bağlantı · `signed_out` → "Giriş yap ve
> katıl" · `loading` → devre dışı bekleme · `unavailable` → **sebebi yazan**
> `role="status"` mesajı (linki boş 2 grubu da bu karşılıyor).
>
> ⚠️ **Link TIKLAMADA değil SAYFA AÇILIRKEN çekilir.** Tıklamadan sonra
> `window.open` çağırmak mobil tarayıcılarda açılır pencere engeline takılır ve
> kullanıcı hiçbir şey olmadığını görür. Böylece düğme normal bir `<a>` kalıyor.
> Bu kararı geri alma.
>
> ⚠️ **Giriş mesajı niyete göre ayrıldı.** Eski tek fonksiyon "Grup EKLEMEK için
> üye olmalısınız" diyor ve dönüşte `openGroupForm=1` ile formu açıyordu —
> katılma akışında yanlış mesaj + yanlış dönüş adresi. `ensureSignedIn(intent)`.
>
> **`types.ts` yeniden üretildi: +105 satır, −0 satır.** ⚠️ İlk denemede
> `included_schemas=public` kullanıldı ve **`graphql_public` şeması siliniyordu**
> (diff'te 28 silinen satır görülüp yakalandı). Doğrusu:
> `?included_schemas=public,graphql_public`. Bir dahaki regen'de bunu kontrol et.
>
> **Testler mutasyonla sınandı:**
> `LandingDetailView.invite.test.tsx` (6 test) — eski "sessizce kaybol"
> davranışına döndürüldü → **5 test düştü**.
> `whatsapp-landings-public-source.test.ts` (8 test) — okuma tabana çevrildi +
> hata kodu ayrımı silindi → **3 test düştü**.
> ⚠️ Bir test ilk yazımında **VAKUMDU** ("sayfada herhangi bir düğme var mı" —
> "Sayfayı Paylaş" her durumda var, iddia hep geçiyordu). Mutasyon turunda
> yakalandı ve katılmaya ait eylemi arayacak şekilde daraltıldı. Gevşetme.
> ⚠️ `sliceBetween`'de bitiş çıpası `"export async function"` OLAMAZ —
> başlangıcın kendisiyle eşleşir. Yardımcı bunu sessiz geçirmedi, AÇIKÇA düşürdü.
>
> **Yönetici/sahip yolları DEĞİŞMEDİ** — `rejection_reason` ve `admin_contact`
> gerektikleri için tabandan/RPC'den okumaya devam ediyorlar.
>
> ⚠️ **SIZINTI HÂLÂ AÇIK.** Bu batch istemciyi taşıdı; taban tablo anon'a hâlâ
> açık. Kapanması **G03c** ile.

**G03c — Taban tablonun anon yetkisi daraltılır (SIZINTIYI KAPATAN ADIM)** · migration

> ⛔ **BLOKE: G03b CANLIYA DEPLOY EDİLMEDEN UYGULANAMAZ** (kullanıcı kararı 01.10).
> Kod commit'li ama Coolify deploy'u kullanıcıda. Şimdi uygulanırsa canlıdaki ESKİ
> frontend hâlâ taban tablodan okur → **dizin ziyaretçiye boş görünür.**
> Sıra: (1) G03b deploy → (2) `/addcom` ziyaretçi olarak açılıp dizin + detay
> çalışıyor mu doğrula → (3) bu migration.

**Uygulanacak SQL (hazır):**

```sql
-- İKİSİ BİRLİKTE uygulanır. Tek başına politikayı düşürmek tablo grant'ını
-- bırakır; ileride biri yeni bir anon politikası eklerse kapı SESSİZCE yeniden
-- açılır. Grant'ı da çekmek o sınıfı kapatır.
drop policy if exists "Anyone can view approved landings" on public.whatsapp_landings;
revoke select on public.whatsapp_landings from anon;
```

**Geri alma (dizin boşalırsa):**

```sql
grant select on public.whatsapp_landings to anon;
create policy "Anyone can view approved landings" on public.whatsapp_landings
  for select to anon, authenticated using (status = 'approved');
```

> ⚠️ **`anon`'un DİĞER grant'ları da duruyor:** `INSERT, UPDATE, DELETE, TRUNCATE`
> (ölçüldü 01.10). Bugün zararsız — RLS hepsini kesiyor, G02'den sonra anon'un
> hiçbir yazma politikası yok — ama RLS bir gün kapatılırsa anon tabloyu
> **TRUNCATE** edebilir. Aynı desen `catalog_search_documents`'ta da var. Bu
> migration'a dahil edilip edilmeyeceği ayrı karar; en azından `truncate`/`delete`
> çekilmesi düşünülmeli.

**KABUL TESTİ #5 — dört yolun DÖRDÜ birden ölçülerek yazılır.** Üçü 01.10'da
zaten temiz ölçüldü, G03c'den sonra yeniden doğrulanacak:

| Yol | 01.10 ölçümü | G03c sonrası beklenen |
|---|---|---|
| `whatsapp_landings` (taban) | 🔴 link **10/10** · `admin_contact` **10/10** | **0 satır** (yetki yok) |
| `whatsapp_landings_public` (view) | ✅ link 0 · contact 0 | aynı, 10 satır görünür |
| `catalog_items` | ✅ 651 kayıtta link **0** | aynı |
| `catalog_search_documents` | ✅ anon **0 satır** (politika `is_moderator()`) | aynı |

> ℹ️ Katalog tarafı için AYRI İŞ YOK. `catalog_search_documents.search_text`
> içinde 8 satırda davet linki + 1 satırda e-posta var, ama tablonun SELECT
> politikası `is_moderator(auth.uid())` — anon da, sıradan üye de okuyamıyor.
> "Katalog senkronu da sızdırıyor" sonucuna varma, ölçüldü.

- ⚠️ Kırıcı değişiklik (politika bilinçli istiyor): ziyaretçi dizini görmeye devam
  eder ama **"Katıl" için giriş** gerekir → **U08** "2 hafta sonra dönüşüm gözden
  geçirme" maddesini tetikler; canlıya çıkış tarihini U08'e NOT ET.

- ⚠️ **G03b canlıya çıkmadan uygulanamaz** — çıkarsa dizin anında boşalır.
- ⚠️ Katalog senkron trigger'ı (`trg_catalog_sync_whatsapp_landing`) ve
  `catalog_items` yolu ayrıca denetlenir: link oradan da sızmamalı (kabul testi #5
  "katalog senkronu" yolunu açıkça sayıyor).
- **Kabul (kabul testi #5):** anonim istemci **ham tablo · view · RPC · katalog**
  yollarının HİÇBİRİNDEN link veya `admin_contact` okuyamıyor. Ölçülerek yazılır.
- ⚠️ Kırıcı değişiklik (politika bilinçli istiyor) → U listesinde **U08** "2 hafta
  sonra dönüşüm gözden geçirme" maddesini tetikler; canlıya çıkış tarihini not et.

### Faz B — ön koşul altyapıları (iki kararın gerektirdiği; pakette YOK)

**G04 — Telefon OTP: Supabase Auth native + `user_verifications` aynası** · migration + kod
- **Native yol:** `updateUser({phone})` → SMS OTP → `verifyOtp({type:'phone_change'})` →
  `auth.users.phone_confirmed_at`; trigger `user_verifications`'a aynalar.
  ⚠️ Tasarımın adını verdiği `send-phone-otp`/`verify-phone-otp` edge function'larını **YAZMA** —
  şema zaten ayna olarak tasarlanmış. Native başarısız olursa özel fonksiyona düşülür.
- ⚠️ **GÜVENLİK:** sağlayıcıyı açmak telefonla **giriş/kayıt** yolunu da açabilir. Amaç yalnız
  mevcut hesaba telefon eklemek → phone **sign-in ve sign-up KAPALI** kalmalı.
- ⚠️ **Ülke telefon alan kodundan TÜRETİLMEZ.** `phone_country_code` dolsa bile profil ülkesi
  olmaz; `phone-country-derivation.test.ts` `src/`'i tarar ve `countryFromPhone`/`dialCode`/
  `callingCode`/`libphonenumber` girerse **DÜŞER**. E.164 doğrulaması `profile-phone.ts`'de var.
- ⚠️ `phone` attribute `private_storage` ve aktif — sözleşme bozulmaz.
- **Ön koşul:** sağlayıcı teyidi (U listesi — K02 `sms_provider=twilio` iddiası yalnız bu
  dosyada geçiyor, `config.toml`'da `[auth]` bölümü YOK).
- **Kabul:** `user_verifications` ≥1 gerçek satır; `is_phone_verified()` `true`; telefonla giriş
  denemesi **reddediliyor**.

**G05 — Telefon doğrulama arayüzü + hız sınırı** · kod + migration
- Profil/ayarlarda doğrulama kartı; yeniden gönderme bekleme süresi, deneme sınırı.
- ⚠️ **SMS ÜCRETLİ (bütçe 20–25 €, T21) → hız sınırı zorunlu**, yoksa fatura riski. Sınırlar
  `group_settings`'te, sayım **DB'de** (istemcide değil).
- **Kabul:** sınır aşımında Türkçe mesaj; sınır DB'de sayılıyor.

**G06 — Kurumsal doğrulama seviyesi: şema + belge yükleme** · migration + kod
- `catalog_items.verification_level` (0/1/2) + `verified_at` + `verified_by`. Talep akışı
  **mevcut `catalog_item_claims`** üzerinden: `claim_type='verification_level_2'`, belgeler
  `evidence jsonb`'de. ⚠️ `claim_type`/`status` CHECK'i **önce ölçülür**; varsa yeni değer eklenir
  (yoksa satır sessizce reddedilir).
- Ayrı **private** bucket `org-verification-docs`. ⚠️ `service-attachment-security.test.ts`
  sözleşmesi: denetim `accept=` ile hizalı, **ham `file.name` depolama anahtarına GİRMEZ** →
  `safeStorageFileName`.
- **Kabul:** kurum belge yükleyip talep açabiliyor; belge anonime kapalı; **267** mevcut kurumsal
  kayıt `verification_level=0` ile tutarlı.

**G07 — Kurumsal doğrulama admin inceleme ekranı** · kod
- Kuyruk + belge önizleme + Onayla (→ seviye 2) / Reddet + sebep; karar
  `catalog_item_claims.status`/`reviewed_by_user_id`/`reviewed_at`'a. Navigasyon satırı
  `admin-navigation-registry/members.ts` (veya `roles-afs.ts`).
- ⚠️ **Rozet/filtre yayılımı bu batch'te YOK** — dizin ve arama belgesine dokunulmaz (X listesi).
- **Kabul:** onay sonrası `verification_level=2` canlıda ölçülüyor; log izi var.

### Faz C — spike ve veri modeli

**G08 — M1 Spike: davet sayfasından grup adı okunabiliyor mu?** · rapor, üretim kodu yok
- WhatsApp / Telegram / Discord için sunucu tarafında ad+görsel okuma denenir; hız sınırı ve
  `unknown` davranışı ölçülür. Okunamıyorsa sahiplik **ekran görüntüsü + manuel onaya** döner.
- **Kabul:** üç platform için `ok`/`invalid`/`unknown` ölçümlü kısa rapor; istek sayısı ve yanıt
  kodları yazılı.

**G09 — `group_settings` anahtar-değer ayar tablosu** · migration
- `cadde_settings` deseni. İlk satırlar: `fast_lane_enabled=false` · `daily_submit_limit=5` ·
  `report_threshold=3` · **`report_require_phone=true`** · `report_min_account_age_days=7` ·
  `blocklist_keywords[]` · `invite_open_daily_limit=20` · `claim_code_ttl_minutes=10` ·
  `otp_rate_limits`.
- **Kabul:** her sayı bu tablodan okunuyor; kodda eşik sabiti yok (sözleşme testi kaynak metnini
  denetler).

**G10 — `whatsapp_landings` şema genişletme** · migration
- Yeni: `platform` · `invite_code` (unique, normalize) · `listing_status` · `hidden_reason` ·
  `ownership` · `owner_user_id` · `submitted_by` · `submitted_as_admin` · `review_flags[]` ·
  `is_global` · `country_code` · `city_id`(→`geo_cities`) · `short_description(160)` · `rules` ·
  `strike_count` · `published_at` · `suspended_until` · `owner_renewal_due` · `link_fail_count` ·
  `link_checked_at`.
- `status`→`listing_status` eşlenir (`approved`→`published`); `group_score` `health_score` olarak
  kalır (yeni kolon açma); `member_approved`/`admin_approved` **kaldırılır**.
- ⚠️ `catalog_sync_whatsapp_landing` + trigger'ı **aynı migration'da** güncellenir.
- **Kabul:** `tsc` 0 (types regen dahil); katalog senkronu 10 grup için çalışıyor.

**G11 — Mevcut 10 grubun eşlemesi + veri göçü** · migration + CSV
- CSV üretilir, **ekibe gider** (U listesi). 4 karar: `diger`×3'ün kategorisi · 6 `Global/Genel`
  grubun hedef ülkesi (`almanya101→Almanya`) · **2 boş linkin** akıbeti · açıklamaların 160'a
  indirilmesi. Hepsi `published` + `unclaimed` başlar.
- **Kabul:** serbest metin konum kalmadı; `invite_code` 10/10 dolu (veya boş linkli 2 grup
  bilinçli `hidden`); CSV ekip onaylı.

### Faz D — iş kuralları

**G12 — Durum makinesi + moderasyon logu** · migration · `group_moderation_log` + **tek**
`set_group_status_v1(...)`; doğrudan `update ... set listing_status` YASAK (trigger engeller).
**Kabul:** kabul testi **#12** — her geçiş logda.

**G13 — Sahiplik doğrulama** · migration + kod · `group_claims`; `CQ`+4 hane, 10 dk, 3 deneme,
10 dakikada 3 deneme sınırı; yedek yol ekran görüntüsü. Doğrulanınca platforma göre
`Community_WhatsApp/Telegram/DiscordAdmin` rolü. ⚠️ `user_role_assignments` PK'si **kullanıcı
başına TEK rol** — mevcut rolü ezme. `verified` gruba yeni talep → **otomatik devir YOK**.
**Kabul:** G08 sonucuna göre kod veya ekran görüntüsü yolu uçtan uca çalışıyor.

**G14 — Şikayet sistemi** · migration + kod · `group_reports`; eşik: girişli + **telefonu
doğrulanmış** (G04) + hesap ≥7 gün + farklı 3 hesap (hepsi `group_settings`'ten). Sebepler kırmızı
çizgilerle birebir + "Diğer (açıklama zorunlu)". Aynı kişi aynı gruba 30 günde 1.
**Kabul:** kabul testi **#6** — 3 uygun hesap gizler; 6 günlük hesabın **ve** telefonu
doğrulanmamış hesabın şikayeti sayılmaz. ⚠️ "0 geçerli şikayet" ile geçmiş sayma — eşiğin
**gerçekten tetiklendiği** ölçülür.

**G15 — Uyarı sistemi** · migration · `group_strikes`: uyarı → 30 gün `suspended` → `removed` +
ekleme yasağı; kırmızı çizgi 2/4/6 doğrudan `removed`.
**Kabul:** üç senaryo ayrı ölçüldü; askı süresi `suspended_until`'da.

**G16 — Grup sayfası gönderileri + moderasyon** · migration + kod · ⚠️ **yorum tablosu YOK** →
`group_posts` sıfırdan (`post_status` + `escalate_at`). İlk durum: doğrulanmış admin ve güvenilir
üye → `published`; diğerleri sahipli grupta → `pending_group_admin`, sahipsizde →
`pending_platform`. Güvenilir üye **grup bazlı** (≥5 onaylı gönderi, onaylı şikayet yok).
**Kabul:** kabul testi **#7** — 48 saat bekleyen gönderi platform kuyruğuna geçiyor.

**G17 — Grup Sağlık Skoru** · migration · `group_recommendations` + tasarım §5 formülü birebir;
ilk 7 gün `null`; rozet 70'te kazanılır, **65 altında** kaybedilir (histerezis).
**Kabul:** kabul testi **#11** — ilk 7 gün `null` ve kartta görünmüyor.

### Faz E — sayfalar (paketin S1–S4'ü)

**G18 — S1 Form** · link → otomatik ad/görsel/platform; 7 kategori tek seçim; `geo_*` otomatik
tamamlama + Global; 160 karakter; "admini misin"; Grup Sözü. **Platform seçimi ve serbest metin
konum KALKAR.** "Aile & Çocuk" yalnız `verification_level=2` hesaplara açık (G06).
**Kabul:** kabul testi **#1** · **#2** · **#4** · **#10**.

**G19 — S2 Dizin** · "Admin onaylı!"/"Üye onaylı!" **kalkar** → "Sahibi doğruladı"/"Üye önerisi";
"Skor bekleniyor" **hiçbir yerde** görünmez; filtreler kartlarla aynı listeyi kullanır; Türkçe
arama `trIncludes`/`trCompare`. ⚠️ PostgREST 1000 satır tavanı → sayfalama.
**Kabul:** kabul testi **#3** ("Yeni" 72 saat sonra kalkıyor).

**G20 — S3 Detay** · boş "Grup koşulları" gizlenir; "Bu grup sizin mi?" + "Şikayet et"; "Katıl"
G03 RPC'sinden geçer. **Kabul:** anonimde link sayfa kaynağı dahil hiçbir yerde görünmüyor.

**G21 — S4 Sahip paneli** · düzenleme, onay kuyruğu, skor kalemleri ("Kurallarını ekle, +15"),
rozet görseli, "Sayfayı paylaş", "Grubu listeden kaldır". Mevcut `whatsapp_landing_editors` +
5 RPC üzerine. **Kabul:** kabul testi **#9** — kaldırma isteği grubu **anında** gizliyor.

### Faz F — otomasyon, bildirim, moderatör paneli, QA

**G22 — 6 zamanlanmış görev** · migration · `link-health` (haftalık, yayılmış) ·
`queue-escalation` (saatlik) · `health-score` · `suspension-release` · `owner-renewal` (günlük) ·
`claim-expiry` (10 dk). ⚠️ Link kontrolü **üç değerli**; **`unknown` sayacı ARTIRMAZ.**
⚠️ "cron yeşil" kanıt DEĞİLDİR (Radar dersi) — görevin **etkisi** ölçülür.
**Kabul:** kabul testi **#8** — 2 başarısız gizler, 1 başarılı geri açar, `unknown` etkisiz.

**G23 — 8 bildirim metni** · migration + kod · tasarım §9. ⚠️ `notification_email_outbox.event_type`
CHECK'i canlıda **7 değere kilitli** — yeni tip **migration ister**; TS birliğini tek başına
genişletirsen RPC reddeder, kayıt **sessizce kaybolur**.
**Kabul:** her bildirim için outbox satırı + drenaj sonrası **`sent_at` dolu**.

**G24 — M5 Moderatör paneli** · kod · tek ekran 4 kuyruk (Yeni gruplar · Sahiplik talepleri ·
Şikayetler · `pending_platform` gönderiler); kısayollar `A`/`R`/`J`/`K`; üst şerit kuyruk
sayıları + **moderasyondan geçen grup sayacı (x/100)** + hızlı şerit anahtarı + görevlerin son
çalışma zamanı. Navigasyon satırı `admin-navigation-registry/communities.ts`'e.
**Kabul:** 4 kuyruk canlı veriyle doluyor; anahtar `group_settings`'i yazıyor.

**G25 — QA: 13 kabul testi** · test · tasarım §13'ün tamamı otomatik (mümkün olmayan için yazılı
canlı ölçüm). ⚠️ Test **#5** (RLS) ve **#6** (şikayet eşiği) **mutasyonla** sınanır — kuralı
bozunca kırmızıya dönmüyorsa **test yanlıştır**.
**Kabul:** 13/13 + `npm run test` · `tsc` 0 · `lint` 0 · `verify:text` temiz.

⚠️ **Tanıtım (`05`/`06` dosyaları) G19 canlıya çıktıktan SONRA başlar** — eski sayfaya trafik
gönderilmez.

---

## KR — Kariyer sayfası yenilemesi (KR01–KR10)

> **Kaynak plan:** [`docs/plans/2026-09-30-kariyer-sayfasi-yenileme-plani.md`](../plans/2026-09-30-kariyer-sayfasi-yenileme-plani.md)
> — bağlam, gelen dosyalardaki üç hata, karar gerekçeleri ve yeniden kullanılacak kod
> listesi orada. Bu liste yalnız sıra + kapsam + kabul özeti.
> **Durum:** plan "onaya sunuldu" — KR01'e başlamadan önce onayı teyit et.
> **Sıra:** KR01 (veri) → KR02–KR03 (altyapı) → KR04–KR06 (public sayfa) → KR07 (geçiş)
> → KR08–KR09 (yönetim) → KR10 (kapanış).
> ⚠️ **Bu bölüm aşağıdaki `K — Karar bekleyenler` bölümünden AYRIDIR** (`KR01` ≠ `K01`).

**Bu iş yeni sayfa DEĞİL — `/kariyer` zaten canlıda.** `src/pages/Career.tsx` (4 pozisyon,
`InterestForm`), `App.tsx:311`, `PAGE_SEO.career`, `footerLinks.ts:22` ve sitemap
`STATIC_ROUTES` girdisi mevcut. Bugünkü başvurular `interest_registrations` tablosuna
gidiyor ve **o tablonun özel admin ekranı yok** — başvurular düzenli okunmuyor.

**Tüm KR batch'lerinde geçerli (tekrar yazılmayacak):**

- Kapanış turu: yukarıdaki "Her batch'te zorunlu doğrulama" bloğu aynen.
- Migration akışı: parent `supabase/migrations/` → dry-run → uygula → `applied/` altına TAŞI;
  zaman damgası tekrar kullanılmaz.
- Yeni `src/lib/**` dosyası → `npm run ingest:tools` + üretilen dosyalar commit'e dahil.
- `as TablesInsert<...>` CAST YASAK — `satisfies`. RPC hataları **düz nesne** —
  `instanceof Error` ile daraltma; `code`/`details`/`hint` oku.
- **Türkçe karakter ASCII'ye düşürülmez.** `npm run verify:text` bunu YAKALAMAZ
  (yalnız kodlama/mojibake denetler, eksik harfi değil) — gözle kontrol et.
- Dosya doğrulama/ad temizleme **yeniden yazılmaz**: `src/lib/security.ts` içindeki
  `validateFile` / `validateCvFile` / `validatePresentationFile` / `safeStorageFileName`
  kullanılır. `accept=` niteliği ile uzantı kümesi birebir aynı olmalı
  (`service-attachment-security.test.ts` kilitler).

### Faz 0 — ilan verisi

**KR01 — `src/lib/careers/` modülü + sözleşme testi** · küçük, UI ve migration yok

- Yeni: `careers-types.ts` · `careers-data.ts` · `careers-data.test.ts`.
- Kaynak HTML'in 405–406. satırlarındaki `JOBS` (17 kayıt) ve `INTERN` JSON'u TS'e taşınır.
  Alanlar: `id · area · tr · en · badges[] · intro · tasks[] · profile[] · plus · report · model`.
  `AREAS` (ops/biz/mkt/prd/tech) ayrı sabit.
- `careers-data.ts` başına **kadro modülünden neden ayrı olduğu** yorum olarak yazılır
  (sonraki oturum "kopya veri" sanıp birleştirmesin — gerekçe kaynak planda).
- **Kabul:** 17 ilan, `id`'ler benzersiz, `tasks`/`profile` boş değil, `area` geçerli;
  `tsc` + test yeşil. Sayfa henüz değişmedi.

### Faz 1 — altyapı

**KR02 — Migration: tablo + kova + `submit_career_application` RPC**

- `public.career_applications` — gelen SQL'in düzeltilmiş hâli.
  ⚠️ `has_role(auth.uid(),'admin')` **YOK** → `public.is_admin(auth.uid())` (argümanlı!).
- `career-applications` **private** kova (25 MB, MIME listesi gelen SQL'den).
- RPC security definer, **tek yazma yolu**: alan doğrulaması sunucuda; `status='yeni'` ve
  `notes is null` gövdede zorlanır (istemci iddiası kabul edilmez); hız sınırı
  `report_client_error` desenindeki gibi. **`anon`'a tabloya INSERT yetkisi verilmez**,
  yalnız RPC `EXECUTE`.
- Storage policy: anon yalnız bu kovaya INSERT; SELECT yalnız `is_admin(auth.uid())`.
- Ardından `src/integrations/supabase/types.ts` yeniden üretilir.
- **Kabul (ölç, varsayma):** `npm run check:migrations` temiz; anon oturumla RPC smoke —
  ilk çağrı satır oluşturuyor, art arda çağrı hız sınırına takılıyor, doğrudan
  PostgREST INSERT **reddediliyor** (yanıt gövdesi kanıt satırına yazılır).

**KR03 — `careers-api.ts` + `careers-schemas.ts` + hata haritası**

- Zod şema → `z.infer`. `uploadCareerFiles(applicationId, files)`: `safeStorageFileName` +
  `validateFile` (CV pdf/doc/docx 10 MB · sunum pdf/ppt/pptx/key 25 MB), anahtar `{id}/cv-…`.
- `submitCareerApplication(input)` → RPC. Hata kodu ↔ Türkçe mesaj haritası + **çift yönlü**
  sözleşme testi (desen: `service-finder-format.test.ts`).
- **Kabul:** testler yeşil; bileşen katmanında doğrudan `supabase.from(...)` yok.

### Faz 2 — public sayfa

**KR04 — Sayfa iskeleti: hero · kurucu mektupları · saat bandı · katılım modelleri**

- `src/pages/Career.tsx` yeniden yazılır; `src/components/career/` altına `CareerHero` ·
  `CareerClockBand` · `FounderLetters` · `ParticipationModels`.
- Kurucu fotoğrafları base64'ten çıkarılıp `public/career/` altına **gerçek dosya** olarak
  yazılır (HTML satır 257 ve 263). Base64'ü koda gömme.
- Saat bandı: 8 şehir, `Intl.DateTimeFormat("tr-TR", { timeZone })`, 15 sn;
  `prefers-reduced-motion` desteklenir.
- `useSeo(PAGE_SEO.career, [])` — opts sabit olduğu için **açık `[]`**
  (`use-seo-deps-contract.test.ts` zorunlu kılar). `PAGE_SEO.career.description` güncellenir.
- **Kabul:** sayfa mevcut tema/tipografiyle açılıyor; `tsc`/`lint`/`test` yeşil.

**KR05 — İlan listesi + alan filtresi + staj bloğu**

- `CareerPositionList` · `CareerPositionCard` · `CareerInternProgram`.
  Alan çipleri (Tümü + 5 alan) + shadcn `Accordion`.
- Arama eklenirse `trIncludes` — çıplak `toLowerCase()` DEĞİL (Türkçe i/İ kuralı).
- "Bu pozisyona başvur" → form seçimini doldurur + forma kaydırır.
- **Kabul:** 17 ilan + staj görünüyor, filtre çalışıyor, derin bağlantı (`#ilan-<id>`) açılıyor.

**KR06 — Başvuru formu (3 dosya) · canlı kanıt zorunlu**

- `CareerApplicationForm` + `CareerFileDrop`; `react-hook-form` + `zodResolver`,
  sürükle-bırak + tıkla. KVKK onayı zorunlu (`/legal/kvkk`, `/legal/privacy` — ikisi de mevcut).
- **Kabul (elle, canlıda):** uçtan uca bir başvuru oluşturulur → `career_applications`'ta
  satır + kovada dosyalar; anon `select` **0 satır/yetki hatası**; aynı e-postayla art arda
  gönderim hız sınırına takılıyor. Dört ölçümün sonucu kanıt satırında.

### Faz 3 — geçiş

**KR07 — Eski 4 ilanın korunması**

- `global-local-contributor` · `content-creator` · `global-content-lead` ·
  `technical-core-team` **silinmez**; yeni 17'nin altında ayrı bölümde, her birinde
  "önceki dönem ilanı" ibaresiyle durur. Başvuru düğmeleri yeni forma bağlanır.
- Kaldırma koşulu bu master'a bir satır olarak yazılır (karar sonraya bırakıldı).
- **Kabul:** eski dört ilan sayfada ibareli görünüyor; başvuruları yeni tabloya düşüyor.

### Faz 4 — yönetim

**KR08 — Admin ekranı: `/admin/kadro/basvurular`**

Yeni admin grubu AÇILMAZ — `/admin/kadro` zaten işe alım konsoludur ("İlan Metinleri"
orada). Başvurular oraya **5. madde** olarak girer.

- Yeni: `src/pages/admin/kadro/AdminKadroBasvurularPage.tsx` · `src/lib/careers/careers-admin-api.ts`.
- ⚠️ **Üçü birlikte güncellenir, yoksa ekran menüde/breadcrumb'da görünmez:**
  `src/pages/admin/kadro/routes.tsx` · `src/lib/admin-shell/admin-navigation-registry/kadro.ts`
  (`accent: "amber"`) · `src/lib/admin-shell/admin-route-meta.ts` (satır ~113 listesi).
- Liste + pozisyon/durum filtresi + durum geçişi (`yeni → inceleniyor → görüşme →
  teklif/olumsuz/arşiv`) + not. Arama `trIncludes`.
- Dosyalar **`createSignedUrl`** ile geçici bağlantı — kova private kalır, dosya asla
  public olmaz.
- **Kabul:** admin hesabıyla kayıt görünüyor, CV signed URL ile açılıyor, durum güncelleniyor;
  admin olmayan oturumda ekran/veri erişilemiyor.

**KR09 — Yeni başvuruda e-posta bildirimi**

- Mevcut bildirim altyapısı üzerinden kurucu ekibe uyarı.
- ⚠️ Edge function değiştiyse **elle deploy**: `supabase functions deploy <ad> --project-ref
  injprdrsklkxgnaiixzh` — **Coolify edge function deploy ETMEZ.**
- **Kabul:** gerçek bir test başvurusu sonrası mail kutusunda kanıt (gönderim kaydı + ekran görüntüsü değil, log satırı).

### Faz 5 — kapanış

**KR10 — SEO, sitemap, araç kataloğu, doküman**

- `STATIC_ROUTES` içindeki `/kariyer` önceliği `0.4 → 0.7` (içerik artık zengin;
  üç kriteri de geçiyor: public, `useSeo`+canonical, thin değil).
- `npm run ingest:tools:check` — `src/lib/careers/**` eklendiği için katalog bayatlar;
  bayatsa `npm run ingest:tools` + `docs/agent/openapi.yaml` da commit'lenir.
- **Kök dizin temizliği:** `EKİP WEB SAYFASI 28 EYLÜL VERS.-*` klasörü ve zip'i kökten
  kaldırılır (kökte yalnız `CLAUDE.md` + `README.md` durur).
- Deploy sonrası: `curl -I https://corteqs.net/kariyer` + tarayıcı konsolunda **CSP ihlali yok**.
- **Kabul:** sitemap üretimi yeşil, `ingest:tools:check` temiz, kök temiz, canlı kontrol yapıldı.

---

## U — Senin elin gerekiyor (öncelik sırasıyla)

### U03 · İki gerçek mail testi

- **(a) E-posta doğrulaması:** test kaydı yap. Gönderen `info@corteqs.net`, SMTP
  kimliği `update@corteqs.net`. **Zoho alias değilse 553 döner ve yeni üye hesabına
  giremez.** Kurtarma: `PATCH /config/auth {"smtp_admin_email":"update@corteqs.net"}` ·
  acil: `{"mailer_autoconfirm":true}`.
- **(b) Revizyon tamamlanma maili:** bir revizyonu panelden "Yapıldı" yap; iki admine
  mailin geldiğini ve `#REV-NNN` numarasının göründüğünü doğrula.
- **Bitti ölçütü:** iki mail gelen kutusunda; `notification_email_outbox` satırları `sent`.

### U04 · Etkinlik planındaki 16 kanıtsız ✅

- `docs/plans/2026-09-20-etkinlik-modulu-plani.md` commit'lendi (`d8377da`) ama 16 QA
  batch'i hâlâ **kanıtsız** ✅. Gerçekten yaptıysan kanıtı yaz; yapmadıysan 🔒'ya
  ("auth gerektiriyor, test hesabı gerekli") geri döndür.

### U05 · Cadde logosu

- Dosya Burak'tan bekleniyor (T21). `CaddePage.tsx` başlığındaki kimlik şeridi 09.09'da
  (m151) **bilinçli** kaldırılmıştı — geri eklerken o kararı oku. Dosya gelince ~20 dk.

### U09 · WhatsApp Meta kimlik bilgileri — **W01'i açar** (30.09: bilgiler sende, hazır)

- `WHATSAPP_*` secret'larının **beşi de yer tutucu** (dördünün özeti birebir aynı
  `222d5bc7…`). Fonksiyonlar 22.09'dan beri canlıda **v17 ACTIVE** — sorun deploy değil,
  kimlik. `whatsapp-webhook` HMAC imzasını `WHATSAPP_APP_SECRET` ile doğruluyor; bu
  haliyle Meta'dan gelen her istek reddedilir.
- **Gereken beş değer** (Supabase Vault → edge secret; `.env.local` yalnız yerel ölçüm):
  `WHATSAPP_ACCESS_TOKEN` · `WHATSAPP_APP_SECRET` · `WHATSAPP_PHONE_NUMBER_ID` ·
  `WHATSAPP_VERIFY_TOKEN` (bizim seçtiğimiz rastgele dize) · `WHATSAPP_GRAPH_API_VERSION`
  (biçim `v\d+\.\d+`, varsayılan `v26.0`).
- ⚠️ **Kalıcı sistem kullanıcısı token'ı şart.** Meta'nın 24 saatlik test token'ıyla
  kurulum yapılırsa bot ertesi gün **sessizce** susar.
- Meta panelinde: webhook URL'i + `messages` alanına abonelik. Test için gerçek bir telefon.
- ⚠️ Token'lar sohbete/commit'e yazılmaz.
- **Kabul:** beş secret'ın digest'i birbirinden farklı; W01 başlayabilir.

### Command Center arşiv dalgası — A/B/C kararı

- Canlı 1653 kayıt (108'i zaten soft-delete). Seçenekler:
  **A)** 843 Baslanmadi `meeting_note` kaydını arşivle → ~810 kalır ·
  **B)** A + doğrulanmış Tamamlandi tarihî kayıtlar → ~480 ·
  **C)** A + B + KARAR'lı/süresi geçmiş Beklemede → **~150-200** (#539'un
  "50-100 anlamlı aksiyon" hedefine en yakın).
- Arşiv = `archived_at` damgası, geri alınabilir.
- ⚠️ Denetim notları (`[Denetim 28.09]`, 313 adet) LOKAL MD'lerde:
  `docs/commandcenter/` gitignore'da. Export'u yeniden üretmek notları **siler** —
  arşiv dalgasından önce export ÜRETME (veya notları önce başka dosyaya kopyala).

### REPO-DIŞI ~50 maddenin toplu teyidi

- Denetim notlarında 📁 işaretli maddeler (Drive/pazarlama/domain/Zoho/sosyal medya —
  çoğu dosya 12 ve 14'te). Topluca "yapıldı/yapılmadı" de; panel durumları buna göre
  güncellenecek.

### U06 · Telefon/SMS sağlayıcısı teyidi — **G04'ün ön koşulu**

- K02 "`sms_provider=twilio` tanımlı ama kapalı" diyor, bütçe de kesinleşmiş (20–25 €, T21).
  ⚠️ Ama 30.09 ölçümü: bu iddia **yalnız KALANLAR.md'de** geçiyor. `supabase/config.toml`
  dosyasında **hiç `[auth]` bölümü yok** (Auth tümüyle panelden yapılandırılıyor) ve
  `auth.users`'da **0 telefon / 0 onaylı telefon**, `user_verifications` **0 satır**.
- **Yapılacak:** Supabase panelinden bak — telefon sağlayıcısı gerçekten tanımlı mı, hangisi,
  açık mı? Gerekiyorsa hesabı aç ve etkinleştir.
- ⚠️ Etkinleştirirken **telefonla giriş/kayıt KAPALI** kalsın — amaç yalnız mevcut hesaba
  telefon eklemek. Açık kalırsa e-posta doğrulamasını atlayan yeni bir kayıt yolu doğar.
- G04 kodu sağlayıcıdan bağımsız yazılabilir ama **bu olmadan uçtan uca doğrulanamaz.**

### U07 · G11 eşleme CSV'si — 4 veri kararı (ekip)

Mevcut 10 grup yeni veri modeline taşınırken karar gerekiyor (K08'in kalan tek parçası):

1. `diger` kategorisindeki **3 grubun** yeni kategorisi (politika §5: "'Diğer' kategorisi yoktur").
2. `country='Global'` / `city='Genel'` olan **6 grubun** hedef ülkesi (`almanya101 → Almanya`).
3. **2 grubun davet linki BOŞ** (`hcd-bilinc-...`, `shaman-kocluk-...`) — link istenip
   eklenecek mi, yoksa `hidden` mı? (Link kontrolü bunları hemen `link_dead` yapar.)
4. Uzun açıklamaların **160 karaktere** indirilmesi (hangi metin kalacak).

### U08 · G03 sonrası dönüşüm gözden geçirme — **2 hafta sonra**

- G03 ile "Katıl" butonu **girişe bağlanıyor** ve davet linki anonime kapanıyor (politika §8
  bilinçli istedi). Paketin ekip notu: *lansmandan 2 hafta sonra dönüşüm oranına bakılıp
  gözden geçirilecek.* G03 canlıya çıktığı tarihi not et ve takvime al.

### U01 · Service role anahtarı — **EN SONA**

- Legacy `service_role` anahtarı **bağımsız döndürülemiyor**: paneldeki tek seçenek
  **"Disable JWT-based API keys"** ve o da üç edge function'ı düşürür. Önce edge
  function'ların anahtar düzeni yeni şemaya taşınmalı, U01 ancak ondan sonra.
- Bağlam: anahtar bir ara diske yazılmıştı (`aeb2ea8` geçmişten temizledi; ölçüldü —
  `origin`'e hiç ulaşmadı). Service role, RLS'i **tamamen** devre dışı bırakır.

---

## K — Karar bekleyenler (kod işi değil)

| # | Konu | Sahibi | Not |
|---|---|---|---|
| K01 | Cadde ana sayfa sıralaması | UBT + Burak | `CaddePage.tsx` yorumu (05.08) sağ kolon, T18 (27.08) akışın üstü diyor — çelişkili. **A06c bu karara bağlı değil** |
| K02 | SMS sağlayıcısı | UBT | Bütçe 20–25 € KESİNLEŞTİ (T21); `sms_provider=twilio` tanımlı ama kapalı; uygulama (M95) başlamadı. **Uygulama tarafı artık G04–G05'te.** ⚠️ 30.09 ölçümü: `sms_provider=twilio` iddiası **yalnız bu dosyada** geçiyor — `supabase/config.toml`'da `[auth]` bölümü YOK ve `auth.users`'da **0 telefon / 0 onaylı**. Panelden teyit et (bkz. U06) |
| K03 | Google giriş özel alan adı | UBT + Burak | Pro plan + 10 $/ay eklenti. **Ön koşul karşılandı: Pro aktif (U02 kapandı)** — karar verilebilir |
| K04 | Cadde davet kodu kavramı | Burak | Ölçüldü (#1731): kullanıcının "kendi kodu" diye bir şey YOK; profildeki alan ters yönde çalışıyor |
| K05 | Checkout / Stripe | Burak | Ödeme kodu SIFIR (yalnız `MockStripeCheckout`); abonelik 01.01.2027 · Kurucu 1000: 99 € |
| K06 | `docs-admin` korpusu | UBT | 4.214 iç doküman / 30 MB bilgi tabanında — silinsin mi? (Pro ile bellek baskısı azaldı ama çöp duruyor) |
| K07 | 25 Eylül transkriptinin son 25 dk'sı | UBT | yalnız ilk ~55/80 dk işlendi |
| K08 | 5 grup karar mesajı | UBT → Burak | grup ekleme politikası · onay akışı · form alanları · şehir grupları · ekleme çağrısı. ✅ **CEVAPLANDI** — Dijital Gruplar politikası v1.1 (27.09) beşini de kapsıyor; kod karşılığı **G bölümü**. Kalan tek şey: G11 eşleme CSV'sindeki 4 veri kararı (U07) |

---

## P — Onay bekleyenler

- **P02–P07:** `.kilo/plans/1790537630793-tidy-cactus.md` (clean-code planının canlı
  DB/deploy/ürün kararı gerektiren maddeleri). **P01 uygulandı** (28.09 — bkz. Kapananlar).

---

## X — Büyük / ertelenen (batch'e bölmeden önce ayrı plan ister)

Konuşmalı AI Search (özet + soru + makale önerisi) · RAG ülke/şehir/konu içeriği (Burak) ·
taşınma planlayıcısının RAG'e bağlanması (**120 servisin 120'si demo**; `/relocation`
demo rozetli) · Rehberler içeriği (Burak; en yeni yazı 13 Haziran) · profil sol dikey
menü + mobil çekmece (karar verildi 17.09; uygulama başlamadı) · ~~WhatsApp grupları
sayfası (T22)~~ → **G bölümüne taşındı (G18–G21)** · admin bekleyen onay bildirimleri
(T22 — kısmen G23/G24 kapsıyor) · rol başvurusu belge pop-up'ı (T22 — G06 belge yükleme
deseni burada yeniden kullanılabilir) · Radar ana sayfa yerleşimi (T22) · çoklu rol
(1–2 ay ertelendi; şema kullanıcı başına tek rol) · **kurumsal doğrulama rozetinin
dizine/aramaya yayılması** (G06/G07 yalnız dijital gruplara yetecek çekirdeği kurar;
ölçüldü: **267 kurumsal katalog kaydı** + dizin RPC'si + `catalog_search_documents`
etkilenir → ayrı plan).

---

## Ölçüm tabanı (30.09 öğlen)

```text
tsc 0 · lint 0 (⚠️ corteqs-ekstre-motoru/ hariç — bkz. ortam notu) · 372 dosya / 2.882 test yeşil
check:dead 0 yeni / 0 borç · check:migrations sapmasız (440+) · ingest:tools güncel (55 araç)
CI yeşil: 105cf34 (run 36686371679) — 29-30.09 oturumunun 14 commit'i push edildi
types regen: 16.301 satır (delete/update_cadde_post_v1 tipte)
Supabase: Pro + Micro compute · site-assistant v19 (verify_jwt=true, config girdisi VAR)
  · radar-news-scan v34 (verify_jwt=false, config girdisi VAR)
revision-attachments: PRIVATE · 15 MB · 11 MIME (4 görsel + pdf/word/excel/ppt)
service-attachments: PRIVATE · 15 MB · 6 MIME · own-or-admin (anon → HTTP 400)
event-covers: hazır (5 MB · 4 MIME)
RADAR: ✅ CANLI — v34 (verify_jwt=false) · 30.09 08:39 elle tetikleme: 125 yeni aday,
  takılı kilit kendiliğinden failed, DW Deutschland last_success_at dolu
DB erişim notu: db.<ref> IPv6-only (rota düşünce kopuyor) → pooler
  aws-1-eu-west-2.pooler.supabase.com:6543, kullanıcı postgres.<ref> (aws-0 tanımıyor)
```

---

## Kapananlar — yeniden AÇILMASIN (kanıt git'te; ayrıntı eski commit'lerde)

| İş | Kanıt (tek satır) |
|---|---|
| N04 · `admin-menu` bilgi kaynağı (`sources.mjs`, öğe başına bir belge) | `3be3e694` — kabul `node scripts/ai-knowledge/ingest.mjs --source=admin-menu --dry-run` **88 belge/88 parça** · 9 test, 3 mutasyon 3/3 yakalandı · 380 dosya/2955 test yeşil · ⚠️ **npm `--` sonrasını yuttu** → ilk deneme canlıya GERÇEK yazım yaptı (88 admin-menu belgesi embed'siz bekliyor, aranamaz; catalog/docs-member idempotent tazelendi) → kural: argümanlı ingest **doğrudan node** ile · 🔴 yeni açık kusur: `docs-admin` ingest'i `KALANLAR.md` upsert'inde `Empty or invalid json` ile düşüyor (↓ N07) |
| N03 · `docs/agent/admin-menu.json` üretilen katalog + bayatlama kapanı | 88 öğe/39 KB · kabul ölçüldü: artefakt elle bozulunca test KıRıLDı · ⚠️ plandaki `vitest run -u <yol>` script'i yolu YUTUP tüm takımı (2947 test) snapshot-güncelleme modunda koşturuyordu — bayrak yolun arkasına alındı (1 dosya/4 test) |
| N01+N02 · yönetici menüsü mutlak sıra numaraları (sidebar + komut paleti) | 88 kayıt (75 üst · 13 alt · 3 inaktif) · 17 test, 4 mutasyonun hepsi yakalandı · DOM↔katalog sözleşmesi "iki ayrı sayaç" sınıfını kapatır · ⚠️ N01 TEK BAŞINA commit'lenemezdi: `check:dead` bağlanmamış modülü erişilemez sayıp exit 1 veriyor ve CI onu çalıştırıyor |
| G03b · dizin + detay view'a taşındı, davet linki RPC'ye | `types.ts` +105/−0 (⚠️ ilk regen `graphql_public`'i siliyordu, yakalandı) · "Katıl" düğmesi 4 durumda da GÖRÜNÜR (eski kod linki yokken düğmeyi hiç çizmiyordu) · link sayfa açılırken çekilir (popup engeli) · 14 test, mutasyonla 8 düşüş · ⚠️ bir vakum test yakalanıp daraltıldı |
| G03a · PII'siz public view + davet linki RPC'si (salt ekleme) | mig `20261001110000` — anon view 10 satır / **0 PII sızıntısı** · anon RPC **permission denied** · girişli RPC link döndü · olmayan slug + **boş linkli grup** `P0002` · RLS 8→8 değişmedi · 14 sözleşme testi 4 mutasyonla sınandı · ⚠️ `admin_contact` ad+e-posta+telefon taşıyordu, K1'de yazılı değildi |
| G01 · Dijital Gruplar paketi repoya + CLAUDE.md bölümü + kök temiz | `bacc959` — `docs/dijital-gruplar/` 4 dosya · çürüyen 5 varsayım + K1–K5 CLAUDE.md'de · paket repo dışına taşındı · ⚠️ `claude_corteqs-insa-notlari.md` bu repoda YOK, 07 arşiv |
| G02 · anon INSERT kapatıldı + 2 mükerrer RLS politikası silindi | mig `20261001100000` — canlı: anon INSERT **42501** · kendi satırı INSERT **başarılı** · başkasının `user_id` **42501** · politika **11→8** · anon SELECT 10 satır (dizin sağlam) · 8 sözleşme testi mutasyonla sınandı · 🔴 davet linki HÂLÂ açık → G03 |
| A14 · #REV-034 sıralama sonuçları kutulu renkli görsel (4 `ranked_list` aracı) | `c3ff905` — 373 dosya/2889 test yeşil · 7 yeni test mutasyonla sınandı · önizleme claude.ai/artifact/5KN3KXDDt7vvnR9PwD1R8L · ⏳ Burak görsel onayı bekliyor |
| S01–S09 · G01–G03h · C00–C06 (22 batch: sessiz başarısızlık + güvenlik + clean code) | `3d8adc3`…`ccfbc28` zinciri · 28.09 devir notu (git geçmişi) |
| A01 CI yeşil (katalog nokta-dosya sızıntısı) | `8389fb3` |
| A03a/b pano ölçümü + yanlış onay migration'ı | `20260927200000…sql` · UPDATE 6+1 |
| A04a/b AuthProvider test + `auth-api.ts` taşıma (B6 kapandı) | 10 test · 96→72 satır |
| A05a–d `as any` + `as unknown as` borcu SIFIR | types regen 613→631 tanım · 5+5 dosya |
| A06a/b CaddePage ayrıştırma (1314→661) | `5c5d2f9` · 74 test değişmeden yeşil |
| A07a–f ProfilePage (918→772; 800 üstü üretim dosyası 0) | `d118527` · `c456105` · `628b098` |
| A08a sayfalama ölçümü (sunucuda — istemci sıralama YASAK) | `queries.ts:64-68` |
| A08b/c/d Komuta Merkezi sunucu sıralaması + sıralanabilir başlıklar (aria-sort) + collation ölçümü | `e94ac1d` · `86b2ec7` · `7e79be4` — ICU en_US Türkçe harf sırası DOĞRU (7/7 ölçüm, tr-TR-x-icu gerekmedi) · 10 test |
| A09a/b/c revizyon eklerinde belge kabulü (11 MIME + tek kaynak modül + belge kartı) | `1a3a5ea` (mig 20260929120000, canlı UPDATE 1) · `7624e78` · `c8ed5ff` — kontrat + bileşen testleri |
| A11a/b `delete_cadde_post_v1` (soft-delete) + `update_cadde_post_v1` RPC | `9044dfd` (mig 20260929130000) · `908170d` (mig 20260929140000) — canlı prosecdef=t + smoke; hedef eşleştirmesi cadde_fold_text |
| A11c/d üç nokta menüsü + silme onayı + Paylaş | `196bcec` · `f91ee21` — ⚠️ DÜZENLEME UI'I YOK (update RPC hazır, açık gündem #5) |
| A12b site-assistant sayfa bağlamı | `299608c` — edge v19 ACTIVE verify_jwt=true canlı ölçümlü; retrieval 0.35/1536 değişmedi |
| A06c sağ kolon ayrıldı (`CaddeRightRail.tsx`, CaddePage 670→261) | `85f33e8` — 53 test DEĞİŞMEDEN yeşil |
| DW Deutschland endpoint fix (rss-de-ger→rss-de-all) | `105cf34` (mig 20260929150000) — canlı probe 61KB RSS; `last_success_at` ilk taramada dolacak |
| A99-R2 verify_jwt düzeltmesi + radar v34 deploy | `86c1f63` — v34 ACTIVE verify_jwt=False ölçüldü |
| 🔴 A99-R2 RADAR CANLANDI — uçtan uca doğrulandı | 30.09 08:39 UTC elle tetikleme: koşu `16fd6890` partial · takılı 14.09 satırı bayat-kilit mantığıyla KENDİLİĞİNDEN `failed` · 30 dk'da **125 yeni aday** · DW Deutschland `last_success_at` dolu · `.env.local` secret'ları Vault'tan yenilendi (digest kanıtlı) |
| A10 etkinlik kapağı yükleme + `event-covers` bucket | kod `df0b6a2` öncesi · bucket `cf8db1a` |
| A13a/b/c CLAUDE.md + ARCHITECTURE Cadde haritası + MEMORY sıkıştırma | `9155459` · `f1bb4af` |
| C07 quick actions tabla güdümlü (`public-catalog-profile-view-model`) | `1ddad75` · 5 tekrarlayan find+push bloğu → tek spec tablosu · refactor ÖNCESİ 6 karakterizasyon testi (44/44 eski kodu kilitledi) |
| A12a asistan balonu (karar: yüzen balon, her sayfa) | 29.09 · `AssistantBubble.tsx` + `ChatBot` compact/sectionId prop'ları · UP düğmesi yuvarlak+turuncu+beyaz ok ("UP" yok) · yazma kapısı çift katman zaten (ChatBot guests'e istek göndermez + edge 401) · 4 yeni test |
| A99 kök neden + bayat-kilit kod düzeltmesi | `f6b5c6f` — ⚠️ ama Radar HÂLÂ ÖLÜ: en üstteki ACİL bölümü |
| Y1 P3(a) relocation-notifications yetki düzeltmesi | `d4095d1` · canlı v25 · anon→401 ölçüldü |
| Y2/Y5 deploy'lar | relocation-notifications v25 · radar-news-scan v33 |
| Y3 bucket hardening (15 MB + 6 MIME + sahiplik) | `cf8db1a` · canlı ölçümlü |
| Y4 event-covers bucket | `cf8db1a` · canlı ölçümlü |
| Y6/P2/B3 bucket PRIVATE + imzalı link akışı | `df0b6a2` · `20260928210000` · anon→400 · 2.835 test |
| U02 Supabase Pro + Micro (swap 615→151 MB) | 28.09 canlı ölçüm (git geçmişi) |
| P01 hardening migration uygulaması | `cf8db1a` |
| Command Center denetimi (18 MD · 313 not) + 18 panel durum düzeltmesi | 28.09 · lokal MD + canlı DB |
| 28.09 admin güncelleme mailleri (7 kayıt) | force dispatch · outbox 7/7 `sent` |
| 30.09 admin güncelleme mailleri (8 kayıt — 29/30.09 işleri) | force dispatch `{"processed":8,"sent":8,"failed":0}` · outbox 8/8 `sent` (DB ölçümü) · ⚠️ dispatch secret VAULT'tan alındı: `.env.local`'daki `NOTIFY_DISPATCH_SECRET` da BAYAT (edge 07.09'da döndürülmüş, local digest ≠ edge digest — U listesine eklendi) |
| Revizyon numarası + tamamlanma maili (kod) | `97eda4e` — gerçek mail testi U03'te |
| Eski tamamlananlar (CI, hot-fix akordeonu, kafe logo, HNSW, T19–T22 çıktıları, m93/m94/m135, referanslovable) | `847fd23` · `31d4d82` · `7fa281a` · `e773fc3` · `8e23c07` · `0d8d989` · `01ce895` |
