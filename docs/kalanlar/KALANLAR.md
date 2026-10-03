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
> | **Açık batch** | **31** (N 0 · W 8 · M 16 · G 7 · KR 0) — G10+G12+G13+G15–G25+G03c+M01–M12 (**Faz 1 + Faz 5 TAMAM + M11/M12 · T1 KAPANDI**) kapandı; G serisinde açık kalanlar: **G04–G05** (⛔ U06) · **G06–G07** (✅ K09 cevaplandı — bloke DEĞİL) · **G11** (⛔ U07) · **G14** (⛔ G04/U06) · **G10c** (⛔ G11) |
> | **Kullanıcı eli bekleyen** | 8 (U — ✅ U10 + ✅ U05 03.10) · **Karar** 2 açık (**K02 · K07**) · ✅ 4 cevaplandı (K03/K06/K09/K10) · ⏸️ **3 PARK (K01/K04/K05 — Burak 03.10, X bölümünün EN SONU)** · Command Center arşivi ✅ **(C)** → ajan işi · **Onay** 6 (P) |
> | **Kullanıcının 03.10'da üstlendiği U maddeleri** | **U09** (WhatsApp 5 secret) · **U06** (SMS sağlayıcısı) · **U07** (10 grubun 4 veri kararı) · **U03** (iki mail testi) — dördü de kullanıcıda, ajan beklemez |
> | **Plan onayı (01.10 → 03.10)** | ✅ **N · G · KR onaylandı** · ✅ **M ONAYLANDI (03.10 soru-cevap turu, M01'den başla)** · ✅ CD planı onaylandı ve KAPANDI (03.10) |
> | **Canlı erişim kararı (01.10)** | Ajan migration'ı `psql -f` ile **kendi uygular**, `applied/` altına taşır, `schema_migrations` kaydını atar ve edge function'ı **kendi deploy eder**; her batch sonunda kanıtla rapor verir |
> | **Son devir notu** | [`docs/handover/2026-10-02-devir-notu.md`](../handover/2026-10-02-devir-notu.md) — 2 Ekim gece oturumu (KR01–KR10 + G08/G09) · [`2026-10-01-devir-notu.md`](../handover/2026-10-01-devir-notu.md) §7 tuzaklar + §9 ortam hâlâ geçerli |
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
4. **G04 → G25** — G04/G05 ⛔ U06, G10c ⛔ G03b deploy, G11 ⛔ U07; bunlar atlanıp gerisi sürdürülebilir.
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

| ID | Başlık | Boyut | Kapı | Not |
|---|---|---|---|---|
| ~~A15~~ | ✅ **KAPANDI 03.10** — Cadde kimlik işareti kapsam şeridinin sol ucunda | küçük | ✅ | ↓ ayrıntı · ⏳ ekran bir sonraki frontend deploy'unda canlanır |

✅ A14 01.10'da kapandı, **Burak görsel onayını 03.10'da verdi** — kalan tek adım
panelden REV-034 "Yapıldı" işareti (↓ Kapananlar / A14 bölümü).

### N · Admin menü numaraları + asistanın yönetici bağlamı

**Açık N batch'i YOK** — seri 01.10'da TAMAMEN kapandı (N01…N07 ↓ Kapananlar).
⏳ Seride kalan tek kullanıcı adımı: N07'nin UI kabulü (admin hesabıyla soru) —
**frontend deploy'u gerektirir** (G03b ile aynı bekleyen kuyruk).
📌 Kalıcı kural: menü sırası her değiştiğinde `npm run ingest:admin-menu` +
`node scripts/ai-knowledge/ingest.mjs --source=admin-menu` + `node scripts/ai-knowledge/embed.mjs`
çalıştırılmalı, yoksa bot bayat numara söyler (ayrıntı ↓ N07).

Sıra bağlayıcıydı: N01 → N02 → N03 → N04 → N05 → N07. **N06 bağımsızdı**, araya alındı.
Sıfır migration · sıfır yeni bağımlılık.

| ID | Başlık | Boyut | Kapı | Not |
|---|---|---|---|---|
| ~~N01~~ | ✅ **KAPANDI 01.10** — numaralandırma çekirdeği (88 kayıt: 75 üst · 13 alt · 3 inaktif) | ✅ | N02 ile BİRLİKTE commit'lendi |
| ~~N02~~ | ✅ **KAPANDI 01.10** — numara sidebar + komut paletinde görünüyor | ✅ | ⚠️ N01 tek başına commit'lenemezdi (↓) |
| ~~N03~~ | ✅ **KAPANDI 01.10** — `docs/agent/admin-menu.json` (88 öğe) + bayatlama kapanı | ✅ | — |
| ~~N04~~ | ✅ **KAPANDI 01.10** — `admin-menu` bilgi kaynağı (88 belge, öğe başına bir) | ✅ | ⚠️ npm argüman tuzağı + canlıya erken yazım (↓ N04) |
| ~~N05~~ | ✅ **KAPANDI 01.10** — yönetici menüsü prompt kuralı (`is_admin()` kapılı) + DEPLOY | ✅ | canlı: deploy OK + anon 401 |
| ~~N06~~ | ✅ **KAPANDI 01.10** — bot yanıtında tıklanabilir link (beyaz liste: `/…` + `https://`) | ✅ | ⚠️ canlıya yansıması frontend deploy'una bağlı (G03b ile aynı bekleyen) |
| ~~N07~~ | ✅ **KAPANDI 01.10** — canlı ingest + embed + getirme kanıtı; docs-admin vekil kusuru kökten onarıldı | ✅ | ⏳ tek kalan: kullanıcı UI kabulü (admin sorusu) — frontend deploy sonrası |

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
| 0 | ~~M01~~ | ✅ **KAPANDI 03.10** — `community-free-features.test.ts` (8 test) + CLAUDE.md "Ücretsiz topluluk işlevleri" bölümü (T1/T2) | ✅ |
| 1 | ~~M02~~ ~~M03~~ ~~M04~~ ~~M05~~ ~~M06~~ ~~M07~~ | ✅ **FAZ 1 TAMAM 03.10** — M02 (`create_event_v1`) · M03 (**T1 KAPANDI**) · M04 (`event_attendees`) · M05 (events-api RPC + ayna) · M06 (katılım düğmesi + kural notu) · ✅ **M07 KAPANDI 03.10** (tam zincir canlı 8/8: ilk-onay · limit P0001 · T1 iki katman · join/leave/kapak/cancelled · anon aggregate; rollback temiz) | ✅ | UI bir sonraki deploy'da canlanır |
| 5 | ~~M08~~ ~~M09~~ ~~M10~~ | ✅ **FAZ 5 TAMAM 03.10** — M08 (QuickActionsCard) · M09 (GettingStartedCard, gerçek veri) · ✅ **M10 KAPANDI 03.10** (`feature_interest` beyaz liste + EventFeaturePromo kilitli kartlar; kabul DB 6/6, mutasyon 6/6) | ✅ | — |
| 3 | ~~M11~~ ~~M12~~ · **M13** | ✅ M11 03.10 (davet tabloları + 3 RPC; smoke 6/6) · ✅ **M12 KAPANDI 03.10** (`/liderlik` + InviteCard + "Davet et" quick action; sızıntı üçlüsü EKRANDA doğrulandı — anon HTTP ile gerçek veri turu) · kalan: kayıt akışı redeem | 🟢 (onay 03.10) |
| 6 | **M14–M16** | 5 türetilmiş metrik view · AdminTractionPage · canlı doğrulama | 🟢 (onay 03.10) |
| 2 | **M17–M23** | Tavsiye İste (en büyük modül) · `/tavsiye` · kilitli gelen kutusu | 🟢 (onay 03.10) |
| 4 | **M24–M27** | Haftalık şehir özeti · `user_city_follows` · pg_cron | 🟢 (onay 03.10) |

### G · Dijital Gruplar Motoru

⚠️ **G02/G03 canlıda AÇIK iki güvenlik kusurunu kapatır** — sıranın başında olmaları bu yüzden:
`whatsapp_link` anonime tamamen açık · `Anyone can insert whatsapp landings` politikası
`{anon,authenticated}` ve `WITH CHECK` yok (anonim sınırsız grup ekleyebiliyor).

| Faz | ID | Kapsam | Kapı | Bağımlılık |
|---|---|---|---|---|
| A | ~~G01~~ | ✅ **KAPANDI 01.10** — `docs/dijital-gruplar/` + CLAUDE.md bölümü + kök temiz | ✅ | — |
| A | ~~G02~~ ~~G03a~~ ~~G03b~~ ~~G03c~~ | ✅ **SERİ TAMAM 03.10** — G02+G03a+G03b 01.10 · ✅ **G03c KAPANDI 03.10** (deploy sonrası uygulandı — **SIZINTI KAPANDI**: taban tablo anon 42501, kabul #5 dört yol 4/4 ölçüldü) | ✅ | — |
| B | **G04–G05** | Telefon OTP (Auth native + `user_verifications` aynası) + arayüz | 🟢 | ⛔ **U06** |
| B | **G06–G07** | Kurumsal doğrulama: şema + belge yükleme + admin inceleme | 🟢 | ✅ **K09 cevaplandı (a)** — mevcut katalog doğrulaması, yeni kolon YOK |
| C | ~~G08~~ | ✅ **KAPANDI 01.10** — spike raporu yazıldı ([`docs/dijital-gruplar/2026-10-01-g08-davet-sayfasi-spike.md`](../dijital-gruplar/2026-10-01-g08-davet-sayfasi-spike.md)) | ✅ | — |
| C | ~~G09~~ ~~G10~~ · **G10c** · **G11** | ✅ G09 KAPANDI 01.10 (`group_settings` canlıda) · ✅ **G10 KAPANDI 02.10** (mig `20261002020000` canlıda, salt ekleme, sync 10/10) · kalan: eski kolonların düşürülmesi (G10c) + 10 grubun göçü (G11) | 🟢 | ⛔ G10c: **G03b deploy** · G11: **U07** |
| D | ~~G12~~ ~~G13~~ ~~G15~~ ~~G16~~ ~~G17~~ · **G14** | ✅ G12 02.10 (durum makinesi) · ✅ G13 02.10 (sahiplik + guard v2) · ✅ G15 02.10 (strike + yasak) · ✅ G16 02.10 (`group_posts` sıfırdan, §3.D 4 sınıf) · ✅ **G17 KAPANDI 02.10** (sağlık skoru + tavsiyeler + guard v3; skorlar cron'a kadar NULL — 🔴 G22 tuzağı aşağıda) · kalan: şikayet | 🟢 | ⛔ **G14: G04/U06** (kabul testi telefonu doğrulanmış hesap istiyor) |
| E | ~~G18~~ ~~G19~~ ~~G20~~ ~~G21~~ | ✅ **FAZ E TAMAM 02.10** — G18 (S1 form, kabul 14/14) · G19 (S2 dizin, kabul 8/8) · G20 (S3 detay + claim UI, kabul DOM+canlı 5/5; "Şikayet et" G14'e ertelendi) · ✅ **G21 KAPANDI 02.10** (S4 sahip paneli: `group_owner_panel_state`+`group_owner_update_v1`; kabul #9 canlı 9/9 — kaldırma ANINDA hidden) | 🟢 | ⚠️ G18–G21 frontend deploy kuyruğunda (G03b ile aynı) |
| F | ~~G22~~ ~~G23~~ ~~G24~~ ~~G25~~ | ✅ **FAZ F KISMEN TAMAM 02.10** — G22 (6 cron) · G23 (8 bildirim) · G24 (moderatör paneli) · ✅ **G25 KAPANDI 02.10** (13 kabul: `supabase/qa/group-motor-acceptance.sql` exit 0 — 12 ölçüldü + #6 tripwire; QA gerçek kusur yakaladı → strike bildirimi `group_strikes`'a taşındı, mig `20261002140000`; mutasyon 6/6 canlı fonksiyonlar üzerinde) | 🟢 | ⛔ #6 kabulu G14'le tamamlanacak (tripwire kurulu) |
| G | **K10a** | ✅ K10(a) kararıyla AÇILDI (03.10): `group_claim_apply_verified` rol ataması **yükseltme**ye çevrilir — mevcut rol yalnız DEFAULT `User_DiasporaMember` ise `Community_*Admin` atanır; diğer roller ezilmez (`role_skipped_reason` yolu daralır, davranış korunur). Küçük batch: migration yok (fonksiyon redefine) + QA + sözleşme güncelleme | 🟢 | — |

### KR · Kariyer sayfası yenilemesi — ✅ SERİ TAMAMEN KAPANDI (02.10)

⚠️ `KR01` ≠ `K01`. **Yeni sayfa değil** — `/kariyer` zaten canlıda, bu bir değiştirme işi.

| Faz | ID | Kapsam | Kapı |
|---|---|---|---|
| 0 | ~~KR01~~ | ✅ **KAPANDI 01.10** — `src/lib/careers/` (17 ilan + staj) + 6 sözleşme testi | ✅ |
| 1 | ~~KR02~~ ~~KR03~~ | ✅ **İKİSİ DE KAPANDI 01.10** — tablo + kova + RPC canlıda · `careers-api` + şema + çift yönlü hata haritası | ✅ |
| 2 | ~~KR04~~ ~~KR05~~ ~~KR06~~ | ✅ **ÜÇÜ DE KAPANDI 02.10** — iskelet + 17 ilan + staj + filtre + başvuru formu (uçtan uca canlı kanıt) | ✅ |
| 3 | ~~KR07~~ | ✅ **KAPANDI 02.10** — 4 ilan ibareli duruyor, başvuruları yeni tabloya düşüyor | ✅ |
| 4 | ~~KR08~~ ~~KR09~~ | ✅ **İKİSİ DE KAPANDI 02.10** — ekran + imzalı dosya bağlantısı · yeni başvuruda e-posta (canlı `sent`) | ✅ |
| 5 | ~~KR10~~ | ✅ **KAPANDI 02.10** — öncelik 0.7 · kök temiz · katalog güncel · CLAUDE.md bölümü | ✅ |

### Plan yazılmamış, batch'e bölünmemiş ajan işi

| Konu | Durum |
|---|---|
| **Cadde gönderi DÜZENLEME UI'ı** | ✅ **KAPANDI 03.10 (CD01–CD04)** — plan: [`docs/plans/2026-10-03-cadde-gonderi-duzenleme-plani.md`](../plans/2026-10-03-cadde-gonderi-duzenleme-plani.md) · CD01 `updateCaddePost`+şema (`7a3f3f84`) · CD02 composer edit modu + `updateMutation` (`591caa84`) · CD03 menü "Düzenle" + FeedView kablolaması (`4023751e`) · CD04 canlı kabul **10/10** (geri alınan işlem: sahip düzenler · **T1 mentions korunur** · hashtag re-sync · medya `[]` temizler · tek hedef uygulanır [⚠️ hedefler `cadde_countries/cadde_cities`'ten çözülür — geo join'le DOĞRULANMAZ, CD04 dersi] · iki geçerli hedef → `premium_required` · sahip-olmayan → `owner_required` · hidden → `not_found` · cafe `p_targets` yok sayar · 4001 → `invalid_body` · rollback temiz) · mutasyon CD01/02/03 = 6+6+6 · ekran sıradaki frontend deploy'unda canlı olur |

### U · Kullanıcı eli gerekiyor (öncelik sırasıyla)

| ID | Konu | Neyi açar |
|---|---|---|
| **U10** | ~~Frontend deploy kuyruğu~~ ✅ **KAPANDI 03.10** — kullanıcı deploy etti (index hash değişti + bundle'da `AdminGruplarPage` referansı doğrulandı). Deploy sonrası tur ajan tarafından koştu: (1) ziyaretçi turu data+bundle ✅ (view anon 10 satır motor kolonlarla · invite RPC 42501) · (2) **G03c uygulandı** (mig `20261003000000`, ledger 461/461 — **SIZINTI KAPANDI**, kabul #5 dört yol 4/4: taban anon 42501 · view link/contact/user_id 0 · catalog_items kolonu zaten yok · RPC 401; EK: anon'un INSERT/UPDATE/DELETE/TRUNCATE grant'ları da çekildi — authenticated grant'ları DURUYOR, admin moderasyon ekranı bozulmadı) · (3) **`health_score_cron_enabled=true`** (onay 03.10 soru-cevap turundaydı) + ilk hesap elle tetiklendi: **10/10 skor yazıldı** (35 = link 15 + reports 20 — dürüst taban), rozet 0, view anon'a skorlu dönüyor → kart "35 / 100"; günlük 04:31 cron bayrağı açık bulacak. **G17/G22 tuzağı RESMEN KAPANDI** | ~~G03c · health-score cron~~ ✅ bitti · **G10c artık yalnız G11/U07'ye bağlı** (deploy koşulu kalktı; kolon düşürme G11 veri göçünden ÖNCE yapılamaz) |
| **U09** | WhatsApp Meta kimlik bilgileri (5 secret) — 30.09: "bilgiler hazır" · ⏳ **kullanıcı 03.10'da üstlendi** | **W01–W08** |
| **U03** | İki gerçek mail testi (e-posta doğrulama · revizyon tamamlanma) · ⏳ **kullanıcı 03.10'da üstlendi** | A14 kapanış maili |
| **U06** | Telefon/SMS sağlayıcısı teyidi (panelden) · ⏳ **kullanıcı 03.10'da üstlendi** | **G04–G05** |
| **U07** | G11 eşleme CSV'si — 4 veri kararı (ekip) · ⏳ **kullanıcı 03.10'da üstlendi** | **G11** |
| **U04** | Etkinlik planındaki 16 kanıtsız ✅ — kanıtla veya 🔒'ya döndür | — |
| ~~U05~~ | ✅ **DOSYA GELDİ 03.10** — `caddelogo.png` (Burak) | artık **ajan işi** (A15) · ~20 dk |
| — | Command Center arşiv dalgası — ✅ **KARAR VERİLDİ 03.10: (C) en agresif** | ~1653 → **~150-200** kayıt · uygulama ajanda (⚠️ önce `docs/commandcenter/` notları) |
| — | REPO-DIŞI ~50 maddenin toplu teyidi | panel durumları |
| **U08** | G03 sonrası dönüşüm gözden geçirme — **2 hafta sonra** | takvim maddesi |
| **U01** | Service role anahtarı — **EN SONA** (3 edge function düşer) | — |

### K · Karar · P · Onay · X · Ertelenen

- **K01 · K02 · K04 · K05 · K07** — kod işi olmayan kararlar (K03/K06 ✅ 03.10 · K08 ✅ → G bölümü).
- ✅ **K06 CEVAPLANDI (03.10, kullanıcı): KALSIN.** `docs-admin` korpusu (4.214 iç
  doküman / 30 MB) silinmez — Pro plana geçildiği için bellek baskısı yok. Bu soruyu
  yeniden açma.
- ✅ **K03 CEVAPLANDI (03.10, kullanıcı): HAYIR — özel alan adı ALINMAYACAK.** Google
  onay ekranında ham Supabase adresi görünmeye devam edecek; 10 $/ay eklenti açılmaz.
  Bu soruyu yeniden açma.
- ⚠️ **K03 ölçümü (kayıt için): kullanıcının "şu an öyle görünüyor zaten" izlenimi
  ÇÜRÜDÜ.** Canlı `https://corteqs.net/env-config.js` → `VITE_SUPABASE_URL` =
  `https://injprdrsklkxgnaiixzh.supabase.co`; `auth./supabase./api./db.corteqs.net`
  adlarının **hiçbiri çözülmüyor** (4/4 bağlantı yok). Yani özel alan adı **YOK** ve
  Google onay ekranında bugün ham Supabase adresi yazıyor. Karar hâlâ AÇIK.
- ✅ **K09 CEVAPLANDI (03.10, kullanıcı): (a) MEVCUT KATALOG DOĞRULAMASI.** Yeni
  `verification_level` kolonu AÇILMAZ; `catalog_items.verification_status` kullanılır ve
  politikanın dediği gibi kapı BAŞVURAN KİŞİYE bağlanır (kişi ↔ kuruluş bağlantısı G06'da
  ölçülecek). **G06–G07 bu kararla AÇILDI** (⛔ kalktı) — sıraya alınabilir.
- ✅ **K10 CEVAPLANDI (03.10, kullanıcı): (a) YÜKSELTME — tek rol kalır.** Varsayılan
  `User_DiasporaMember` rolü `Community_*Admin`'e YÜKSELTİLEBİLİR (mevcut rol ezilmez
  ilkesi korunur: yalnız DEFAULT rol yükseltmeye açıktır). G13'ün `role_skipped_reason`
  güvenli-atlama kodu gerçek atamaya çevrilecek — küçük batch (K10a olarak sıraya alındı,
  aşağıda G bölümü notuna bakın). Çoklu rol (b) REDDEDİLDİ, erteleme (c) değil.
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

### ✅✅ A14 · #REV-034 — **BURAK ONAYLADI 03.10, TAMAMEN KAPANDI**

> ✅ Görsel onayı 03.10'da geldi. Kalan tek adım **panelden REV-034 "Yapıldı"**
> işaretlemek (tamamlanma maili `#REV-034` numaralı gider — mekanizma U03(b)).

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

> ✅ **KAPANDI 2026-10-01 · deploy canlıda.** `ADMIN_MENU_PROMPT_BLOCK` +
> `buildAdminModeNote(isAdmin, page?)` (`_shared/ai-assistant-context.ts`) ve
> `site-assistant/index.ts` sistem promptu: `SYSTEM_PROMPT + buildAdminModeNote(isAdminData === true,
> payload.page) + buildPageContextNote(payload.page)`. Kapı **`is_admin()` RPC'si** —
> `page.path` yalnız vurgu ("şu an yönetici panelinde"), kapıya KATILMIYOR; üye için
> prompt hiç değişmiyor. "Veride yoksa numara VERME" cümlesi blokta (test kilitledi).
> **Kanıt:** 5 yeni test (21/21 dosya yeşil) · **3 mutasyon turu 3/3 yakalandı**
> (kapı kırma · "numara VERME" cümlesini silme · index.ts kapısını page.path'e bağlama) ·
> `check:functions` 12/12 sapmasız · lint 0 · deploy: `Deployed Functions on project
> injprdrsklkxgnaiixzh: site-assistant` (script 88.19kB) · canlı anon POST → **HTTP 401**
> `UNAUTHORIZED_NO_AUTH_HEADER` (fonksiyon ayakta, yazma kapısı çalışıyor).
> ⚠️ `supabase functions list` bu hesapla **403** (yetki yok) — sürüm kanıtı deploy
> çıktısı + 401 smoke. ⚠️ Deploy için Docker şart: Rancher Desktop motoru takılıydı,
> süreç kapatılıp `wsl -t rancher-desktop` + yeniden başlatma ile açıldı (~1 dk).
> ℹ️ Kuralın kullanıcıya görünür etkisi **N07 embed'inden sonra** başlar: 88 admin-menu
> belgesi henüz embed'siz, getirme eşleşemez.
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

> ✅ **KAPANDI 2026-10-01 · `a506f92c`.** `parseRichText()` + `classifyLinkTarget()`
> (`chatbot-message-helpers.ts`) ve `ChatMessage.tsx` bağlantı işleme: iç yol →
> react-router `<Link>`, `https://` → `<a target="_blank" rel="noopener noreferrer">`,
> diğer her hedef (`javascript:`, `data:`, `http:`, `//evil.com`, `/\evil.com`) →
> link ÜRETİLMEZ, yalnız etiket düz metin. `**kalın**` davranışı aynen korundu.
> **Kanıt:** 17 yeni test (8 bileşen + 9 yardımcı) · **3 mutasyon turu 3/3 yakalandı**
> (`//` koruması silme · `http` kabulü · ham markdown sızdırma) · tam takım
> **381 dosya / 2972 test yeşil** · tsc 0 · lint 0 · check:dead 0/0/963 · verify:text ✓.
>
> ⚠️ **İlk ölçümde iki test DÜŞTÜ ve gerçek kusur yakalandı:** link hedefi deseni
> `[^()\s]+` parantezlu hedefleri (`javascript:alert(1)`, ama aynı zamanda meşru
> `…/wiki/A_(b)`) hiç eşleştirmiyor, ham markdown düz metin olarak sızıyordu.
> Desen bir düzey dengeli paranteze genişletildi — reddedilen hedef de önce
> AYRIŞTIRILIP sonra beyaz listeden geçirilmek zorunda, yoksa filtre hiç çalışmaz.
>
> ℹ️ Canlıya yansıması **frontend deploy'una** bağlı (G03b ile aynı bekleyen kuyruk).
- ⚠️ **Bu bugün canlıda bir kusur:** `ChatMessage.tsx:29` yalnız `**kalın**` işliyor;
  `appendSources()`'ın ürettiği "Kaynaklar" bloğu kullanıcıya ham
  `[Başlık](/admin/members)` metni olarak görünüyor — hiçbir link tıklanabilir değil.
- `[metin](/ic/yol)` → react-router `<Link>`; `[metin](https://…)` → `<a target="_blank">`.
- **Yalnız `/` veya `https://` ile başlayan hedef kabul edilir**; `javascript:` vb. düz
  metne düşer. Model çıktısı güvenilmeyen girdidir.
- Mevcut `**kalın**` davranışı aynen korunur (var olan testler geçmeli).
- **Kabul:** yeni `ChatMessage.test.tsx` — iç yol `<a href>` üretir, `javascript:` ÜRETMEZ.

**N07 — Canlı ingest + uçtan uca kabul** · küçük · **KANIT TURU**

> ✅ **KAPANDI 2026-10-01 · `8a777afc` (kusur onarımı) + canlı ölçümler.**
> - Katalog taze: `npm run ingest:admin-menu` → **drift YOK** (4/4 test).
> - Canlı ingest: `node scripts/ai-knowledge/ingest.mjs --source=admin-menu` →
>   **88 belge / 88 parça (değişmedi 88)** — belgeler N04 olayında zaten yazılmıştı, md5 birebir.
> - Embed 1. tur: **396/396 başarılı** → `admin-menu` **88/88 gömülü**.
> - **Getirme kanıtı** (canlı `ai_knowledge_search`, eşik 0.35 — RPC ile ölçüldü):
>   - ADMIN "üyeler menüde nerede" → **0.287 · admin-menu · Kayıt Veritabanı · /admin/data** (en üstte, doğru kayıt)
>   - ADMIN "kayıt veritabanı menüde kaçıncı sırada" → **0.215** aynı kayıt
>   - MEMBER kitle, iki soruda → **0 admin-menu kaydı** ("üye menu kaydı GELMEMELİ" mekanizması kanıtlı)
> - 🔴 **docs-admin kusuru KÖKTEN ÇÖZÜLDÜ:** "Empty or invalid json" dosya boyutu DEĞİL
>   **yalnız vekil (lone surrogate)** idi — `chunkText` 🔴 emojisini (U+1F534, iki UTF-16
>   birimi) örtüşme sınırından ortasından kesiyordu; `KALANLAR.md` chunk 5 `\uDD34` ile
>   başlıyor, PostgREST (aeson) bunu geçersiz JSON sayıyordu. Deterministik: 93'te tam 1.
>   `JSON.stringify` istemcide geçerli JSON ürettiği için hata YALNIZ sunucuda görünüyordu.
>   Düzeltme: `trimLeadingLoneSurrogates` + `safeBoundaryEnd` (sert kesim de çifti bölemez).
>   **Kanıt:** düzeltme sonrası KALANLAR.md **93/93 canlı upsert OK** · 3 yeni test ·
>   **2/2 mutasyon yakalandı** · tam takım **381 dosya / 2980 test yeşil** · lint 0 · verify:text ✓.
> - docs-admin tam re-ingest (süpürme + prune): **404 belge → 4901 parça**
>   (yeni 1066 · güncel 2 · değişmedi 3833 · **silindi 640** · **hata 0**) — yeniden
>   adlandırılmış eski satırlar temizlendi, diğer olası aynı-sınıf hatalar süpürüldü.
> - Embed 2. tur: **1158/1158 başarılı** → tüm korpus **5639/5639 gömülü, bekleyen 0, hatalı 0**.
> - ⏳ **Tek kalan kullanıcı adımı — UI kabulü:** yönetici hesabıyla `/admin`'de
>   "üyeler menüde nerede" → yanıtta sıra numarası (2) sol menüyle eşleşmeli + kaynak
>   linki tıklanabilir olmalı (N06 — **frontend deploy gerekir**, G03b ile aynı kuyruk);
>   üye hesabıyla aynı soru → menü kaydı görünmemeli. Sunucu tarafı mekanizma yukarıdaki
>   RPC ölçümleriyle kanıtlandı; bu adım yalnız görsel teyit.
> - 📌 **Kalıcı kural:** menü sırası her değiştiğinde `npm run ingest:admin-menu` +
>   `node scripts/ai-knowledge/ingest.mjs --source=admin-menu` + `node scripts/ai-knowledge/embed.mjs`
>   çalıştırılmalı, yoksa bot bayat numara söyler.
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
> **Durum:** ✅ **ONAYLANDI (03.10, kullanıcı): M01'den başla.** Sıra aşağıdaki gibi.
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

**~~M01~~ — ✅ KAPANDI 03.10** · Sözleşme testi + CLAUDE.md bölümü · kod+migration yok

- `src/lib/community-free-features.test.ts` **8/8**: `/events · /events/create · /addcom ·
  /tavsiye · /liderlik` rotaları `RequireFeature` ALAMAZ (T2 — kuralı olmayan feature
  sessizce herkese kapalı); `/tavsiye`+`/liderlik` henüz yok → "rota varsa guard'sız
  olmalı" biçimiyle yeşil kalıyor · `RequireAuth` serbest · **`cadde.access` bilinçli
  istisna olarak AYRICA kilitli** · desen `redirects.test.ts` + `@/test/source-slice`
  (çıplak indexOf+slice yok).
- CLAUDE.md'ye "Topluluk Motoru — Ücretsiz topluluk işlevleri" bölümü: **T1** (etkinlik
  onayı RLS'te zorlanmıyor — `status` kısıtı YOK, kural SQL'e M02/M03'te) + **T2**
  (`events.create`/`offers.create` role_features 0 satır — flag'e dokunma).
- **Kabul ÜÇ yönlü ölçüldü:** temel yeşil · `/tavsiye`+`/liderlik` guard'sız EKLENİNCE
  test DEĞİŞMEDEN yeşil kaldı (M12/M20 kabulü simüle edildi) · guard EKLENİNCE kızardı
  (mutasyon kanıtı; App.tsx her turda geri yüklendi, fc ile doğrulandı).
- **Kanıt:** tam takım **422 dosya / 3480 test** · `tsc` 0 · lint 0 (32 problem tümü
  `corteqs-ekstre-motoru/`) · `check:dead` 0/0 · `ingest:tools` 58 + check 0 · `verify:text` ✓ 1930.
- *(özgün kapsam)* sözleşme testi + CLAUDE.md bölümü. **Kabul:** test yeşil; M12/M20'de
  rota eklenince test değişmeden yeşil kalıyor (ölçüldü ↑).

### Faz 1 — etkinlik: ilk-onay kuralı + katılım

**~~M02~~ — ✅ KAPANDI 03.10** · Migration 1: `approval_source` + ayar tablosu + `create_event_v1`

- Migration `20261003010000_events_first_approval.sql` **canlıda** (`applied/` + kayıt,
  `check:migrations` **462/462** sapmasız): `events.approval_source` ('auto'|'admin', null =
  eski yol) · `event_settings` (cadde/group_settings deseni, RLS + istemciye kapalı; seed:
  `events.active_limit=2` · `events.first_approval_bireysel_key="User_DiasporaMember"`) ·
  **`create_event_v1` security definer — TEK yazma yolu:** ilk etkinlik (bireysel rol +
  published yok) → `pending` + `approval_requests('event_create', target event)` · sonrası
  veya bireysel-dışı rol → `published` + `approval_source='auto'` · aynı anda en fazla 2 aktif
  (published && event_date ≥ bugün) → **`event_active_limit` (P0001)** · user_id YALNIZ
  `auth.uid()` (istemciden kullanıcı parametresi YOK — mevcut istemcinin `userId` geçirme
  yüzeyi RPC'de kapanır). ⚠️ İlk uygulama denemesi COMMENT/GRANT imzasındaki `time`/`text`
  yazım hatasıyla transaction'dan düştü (ON_ERROR_STOP + ledger sırası dersi: ledger'ı
  uygulamadan ÖNCE yazma — düzeltildi, yeniden uygulandı, 462/462 doğrulandı).
- Sıra bilinçli: RPC önce kurulur (M02) → doğrudan PostgREST yazımı M03'te kapanır → istemci
  M05'te RPC'ye geçer. Canlı form bu batch'te BOZULMAZ (eski insert yolu hâlâ açık).
- **Kabul (SQL smoke, geri alınan işlem — 7/7):** S1 ilk etkinlik → `pending` + approval satırı
  (payload'da başlık, target_entity_id) + user_id=auth.uid · S2 ilk onaylanınca ikinci →
  `published`+`auto`, yeni approval satırı YOK · S3 üçüncü → `event_active_limit` **SQLSTATE
  P0001** · S3b geçmişteki published limit YEMEZ → published · S4 bireysel-dışı role çevrilen
  kullanıcı ilk etkinlikte bile `published` (muafiyet) · S5 anon → `permission denied` ·
  S6 boş başlık/tarihsiz → `event_field_required`. Rollback sonrası canlı dokunulmamış
  (events 1 eski satır · approval_requests'teki 2 `event_create` satırı 18.07/02.08'den kalma
  ESKİ kayıtlar — sızıntı değil, ölçüldü).
- **Kanıt:** sözleşme **10/10** (`events-first-approval-schema.test.ts`) · **mutasyon 6/6**
  (limit sabitleme · approval satırını `if false`'a gömme [M2 ilk koşuda METİN kilidi yüzünden
  kaçtı → KOŞUL kilidi eklendi, G21/G24 dersi üçüncü kez — tekil koşuda düştü] · herkes auto ·
  P0001 silme · p_user_id ekleme · security definer silme) · tam takım **423 dosya / 3490 test** ·
  `tsc` 0 · lint 0 (32 problem tümü `corteqs-ekstre-motoru/`) · `check:dead` 0/0 · `ingest` 58+0 ·
  `verify:text` ✓ 1931.
- 📌 **M03'e devir:** T1'in kapanışı (INSERT politikası `status='pending'` zorunlu + status
  trigger'ı); mevcut istemci insert'i `status:'pending'` yazdığı için M03 canlı formu BOZMAZ.
  Admin onay yolu (AdminEventsPage) trigger'da `is_admin` muafiyeti ister; onayda
  `approval_source='admin'` yazılması M08'in işi (bugün null kalır = "eski yol").
- *(özgün kapsam)* `approval_source` + ayar tablosu + `create_event_v1`. **Kabul:** canlıya
  uygulandı + `applied/`'a taşındı; SQL smoke ilk/ikinci/üçüncü etkinlik RPC üzerinden ✓.

**~~M03~~ — ✅ KAPANDI 03.10** · Migration 2: RLS sıkılaştırma + status trigger (**T1 KAPANDI**)

- Migration `20261003020000_events_rls_status_guard.sql` **canlıda** (`applied/` + kayıt,
  `check:migrations` **463/463** sapmasız): INSERT politikası aynı adla yeniden —
  `with check (auth.uid() = user_id and status = 'pending')` · `events_guard_status()`
  BEFORE UPDATE trigger'ı (RLS UPDATE'te eski satırı göremez — status korumasının tek gerçek
  yolu; G12 guard deseni): `status` + `approval_source` değişimi →
  `event_status_direct_update_forbidden`; muafiyet üçlüsü `event_status.via_rpc` bayrağı
  (AYRI GUC isim alanı — grup motorunun bayrağıyla karışmaz) · `is_admin` · `service_role`.
  **İçerik alanları serbest** (başlık/tarih düzenlemesi açık). `create_event_v1`
  security definer → politika RPC'yi kesmez (M02 auto-publish yolu çalışır).
  ⚠️ İlk uygulama denemesi comment satırındaki eksik tırnak yüzünden düştü (transaction
  rollback — politika/trigger YARIM kalmadı); dosya düzeltilip yeniden uygulandı.
- **Kabul (plan T1: "ölç, varsayma" — DÖRT yol, yanıt gövdeleri kanıt):**
  (a) **PostgREST anon POST `status='published'` → HTTP 401, gövde birebir:**
  `{"code":"42501",...,"message":"new row violates row-level security policy for table \"events\""}` ·
  (b) authenticated rol simülasyonu: `published` insert → **42501 RLS** reddi, `pending`
  insert → BAŞARILI · (c) sahibi `update ... set status='published'` →
  **`event_status_direct_update_forbidden`**; `approval_source='auto'` denemesi → aynı red;
  `title` güncellemesi → SERBEST · (d) admin `status='published'` + `approval_source='admin'`
  → BAŞARILI (M08 onay yolu). Rollback sonrası canlı dokunulmamış (1 eski satır, 0 test satırı).
- Mevcut akış bozulmadı: istemci form zaten `status:'pending'` yazıyor (events-api:158);
  AdminEventsPage `is_admin` muaf.
- **Kanıt:** sözleşme **7/7** (`events-status-guard-schema.test.ts` — politika/trigger/muafiyet
  üçlüsü/içerik serbestisi/salt ekleme) · **mutasyon 6/6 İLK TURDA** (pending koşulu · admin
  muafiyeti · raise · approval_source · via_rpc · trigger silme) · tam takım **424 dosya / 3497
  test** · `tsc` 0 · lint 0 (32 problem tümü `corteqs-ekstre-motoru/`) · `check:dead` 0/0 ·
  `ingest` 58+0 · `verify:text` ✓ 1932.
- 📌 **M08'e devir:** admin onay ekranı status'a `approval_source='admin'` damgasını basmalı
  (bugün AdminEventsPage yalnız status güncelliyor — null "eski yol" demek); onay RPC'si
  çıkarsa `event_status.via_rpc` bayrağını o açar.
- *(özgün kapsam)* INSERT `status='pending'` zorunlu + status trigger'ı; yayınlama yalnız
  RPC + `is_admin()`. **Kabul:** PostgREST'e doğrudan `status='published'` POST → reddedildi
  (gövde yukarıda birebir).

**~~M04~~ — ✅ KAPANDI 03.10** · Migration 3: `event_attendees` + join/leave RPC'leri

- Migration `20261003030000_event_attendees.sql` **canlıda** (`applied/` + kayıt,
  `check:migrations` **464/464** sapmasız): `event_attendees` PK `(event_id,user_id)` ·
  `status going|cancelled` (CHECK) · cascade'ler · `(event_id,status)` indeksi · RLS 4 politika
  (okuma: kendi + sahip + admin · yazma: yalnız kendi, insert `status='going'`).
- **RPC'ler:** `join_event_v1` — yalnız `published`; **kapasite SQL'de VE etkinlik satırı
  `for update` KİLİTLİ** (plan: "istemcide yarış olur"); dolu kapakta raise ile TÜM işlem
  geri döner (satır hiç kalmıyor — smoke'ta ölçüldü), `event_attendee_limit` **P0001**;
  yeniden katılım upsert (cancelled satır canlanır). `leave_event_v1` — satır SİLİNMEZ
  `cancelled` olur (denetim izi); katılmamış iptal → `event_attendee_not_joined` (sessiz
  no-op değil). `event_attendee_count` — **aggregate RPC** (satır değil sayı: going_count ·
  max · is_full · viewer_status), **anon'a açık** (detay ziyaretçiye açık — politika tutarlı).
  Yeni kodlar: `event_not_found · event_not_published · event_attendee_limit ·
  event_attendee_not_joined` (M05 haritası Türkçeleştirecek).
- **Kabul (SQL smoke, geri alınan işlem — 7/7):** katılım → `{going_count:1, viewer:going}` ·
  tekrar katılım idempotent (1) · kapak dolu (max=1) → na2 `event_attendee_limit` **P0001** +
  satır YOK (raise tüm işi geri aldı) · ayrılma → 0, ikinci ayrılma → `not_joined` · yer
  açılınca na2 katıldı · pending etkinlik → `event_not_published` · olmayan → `event_not_found` ·
  anon: sayaç OK (`viewer_status:null`) + join `permission denied`. Rollback temiz (attendee 0).
- **Kanıt:** sözleşme **10/10** (`event-attendees-schema.test.ts`) · **mutasyon 6/6 İLK TURDA**
  (for-update kilidi · kapak kontrolü · leave→DELETE · published kontrolü · anon grant · PK) ·
  tam takım **425 dosya / 3507 test** yeşil (⚠️ ilk koşuda 4 ilgisiz dosyada geçici forks-worker
  hatası — G17'de belgelenen sınıf; tekil + tam yeniden koşu temiz) · `tsc` 0 · lint 0 (32 problem
  tümü `corteqs-ekstre-motoru/`) · `check:dead` 0/0 · `ingest` 58+0 · `verify:text` ✓ 1933.
- 📌 **M05'e devir:** `events-api.ts`'e `joinEvent/leaveEvent/fetchEventAttendeeCount` +
  `createEvent` → `create_event_v1` geçişi; `events-rules.ts` hata haritası (M02+M04 kodları:
  `event_auth_required · event_field_required · event_active_limit · event_not_found ·
  event_not_published · event_attendee_limit · event_attendee_not_joined ·
  event_status_direct_update_forbidden`).
- *(özgün kapsam)* `event_attendees (event_id,user_id)` PK · created_at · status; RLS kendi
  kaydını yazar/siler, sahip+admin okur, sayaç aggregate RPC; join/leave'de `max_attendees`
  SQL'de. **Kabul:** SQL smoke — kontenjan dolunca join reddediliyor ✓ (P0001 ile).

**~~M05~~ — ✅ KAPANDI 03.10** · Kod: events-api + events-rules + ayna sözleşme testi

- **`src/lib/events-api.ts`:** `createEvent` artık **`create_event_v1` RPC'si** — doğrudan
  `.from("events").insert` KALKTI (M05 kabulü); `CreateEventInput.userId` alanı SİLİNDİ
  (RPC `auth.uid()` kullanır — istemci kimlik yüzeyi kapandı, form çağrısı güncellendi).
  Dönüş tipi `CreateEventResult {eventId, status, approvalSource}` — form toast'u artık
  status'a göre DOĞRU söylüyor ("yayınlandı" vs "ilk etkinliğiniz onaydan sonra"). Yeni:
  `joinEvent` / `leaveEvent` / `fetchEventAttendeeCount` (M04 RPC'leri; sayaç İKİNCİL yüzey —
  hata fırlatmaz null döner, şerit çizilmez).
- **`src/lib/events-rules.ts` (yeni):** `EVENTS_ACTIVE_LIMIT=2` (event_settings seed aynası) +
  `EVENT_RPC_ERROR_MESSAGES` (M02+M03+M04'ün 8 kodu) + `resolveEventRpcErrorMessage`
  (DÜZ NESNE çözümleyici — m75/cadde deseni, `instanceof Error` YOK).
- **`src/lib/events-first-approval.test.ts`:** hata haritası ÜÇ migration'a karşı **çift yönlü** ·
  limit aynası seed'e karşı (`'events.active_limit', '2'`) · insert'e dönüş + userId sızması
  kilitli · sayaç ikincil-yüzey kilidi.
- **Kabul:** ayna test yeşil (14/14) · `createEvent`'te doğrudan insert YOK (test kilitli) ·
  `ingest:tools` güncel (yeni lib dosyası).
- **Kanıt:** **mutasyon 6/6 İLK TURDA** (limit 2→3 · haritadan kod düşürme · hayalet kod ·
  RPC adı kaydırma · userId geri koyma · sayaç throw'a çevirme) · tam takım **426 dosya /
  3516 test** · `tsc` 0 · lint 0 (32 problem tümü `corteqs-ekstre-motoru/`) · `check:dead` 0/0 ·
  `ingest:tools:check` 0 · `verify:text` ✓ 1935.
- 📌 **M06'ya devir:** katılım düğmesi `joinEvent/leaveEvent` + `fetchEventAttendeeCount`
  üzerine kurulacak (viewer_status düğme durumu, is_full "Kontenjan dolu" pasif hâli);
  MyEventsPanel limit + onay durumu anlatımı (`CreateEventResult.status` formda zaten ayrışıyor).
- *(özgün kapsam)* events-api RPC geçişi + events-rules + ayna testi. **Kabul:** ayna test
  yeşil; `createEvent`'ten doğrudan `insert` çağrısı kalktı ✓.

**~~M06~~ — ✅ KAPANDI 03.10** · Kod UI: katılım düğmesi + MyEventsPanel

- **`src/components/events/EventAttendeeButton.tsx` (yeni)** — `EventDetailPage`'e mount:
  yalnız `published` etkinlikte çizilir (ölü düğme yok) · anon → `/login` yönlendirmesi ·
  katılmamış → "Etkinliğe katıl" (`joinEvent`) · katılmış → "Katılımdan ayrıl" (`leaveEvent`)
  + "Katılımcı listesinde görünüyorsun" · kontenjan dolu → pasif "Kontenjan dolu" · sayaç
  aggregate RPC'den ("X kişi katılıyor · kapasite Y") ve **İKİNCİL yüzey**: count null dönerse
  düğme ÇALIŞMAYA DEVAM EDER, yalnız sayaç satırı gizlenir. Hatalar toast'ta Türkçe
  (`resolveEventRpcErrorMessage` — kontenjan yarışı sunucuda kaybedilirse "Kontenjan dolu").
- **`MyEventsPanel.tsx`:** kural notu eklendi (`my-events-rule-note`): "ilk etkinliğin yönetici
  onayından geçer, sonrakiler otomatik yayınlanır · aynı anda en fazla {EVENTS_ACTIVE_LIMIT}
  aktif (şu an N) · geçmiş etkinlikler limite sayılmaz" — limit **events-rules'tan** (elle
  yazılmış ikinci sabit yok, ayna M05'te kilitli). Boş-durum metnindeki eski "her etkinlik
  onaydan geçer" yanılgısı düzeltildi.
- **Kabul:** tsc/lint/test yeşil; düğme davranışı 6 bileşen testiyle kilitli (katıl/ayrıl
  mutation'ları RPC adlarıyla, dolu/pending/anon/null-count durumları) + MyEventsPanel notu
  kaynak sözleşmesiyle.
- **Kanıt:** **mutasyon 6/6** (her status'te çiz · anon kapısı · isFull dalı · join→leave
  takası · null-count'ta gizleme [ikincil yüzey ihlali] · kural notu silme [M6 ilk koşuda
  zayıf mutasyonla kaçtı — testid yeniden adlandırması alt dizi içeriyordu; gerçek silmeyle
  tekil koşuda YAKALANDI]) · tam takım **427 dosya / 3523 test** · `tsc` 0 · lint 0 (32 problem
  tümü `corteqs-ekstre-motoru/`) · `check:dead` 0/0 · `ingest` 58+0 · `verify:text` ✓ 1937.
- 📌 **M07'ye devir (canlı doğrulama):** test hesabıyla ilk etkinlik → pending + approval
  satırı · admin onayı · ikinci → published/auto · üçüncü aktif → `event_active_limit` ·
  **PostgREST'e doğrudan `status='published'` POST → red** (T1 kanıtı M03'te ölçüldü, M07'de
  RPC+UI zinciriyle tazelenir) · katılım: join/leave/kapak yarışsız.
- *(özgün kapsam)* `EventAttendeeButton.tsx` + MyEventsPanel anlatımı. **Kabul:** tsc/lint/test
  yeşil; etkinlik detayında katılım düğmesi çalışıyor (test kanıtı; canlı tur M07'de).

**~~M07~~ — ✅ KAPANDI 03.10** · Faz 1 canlı doğrulama · kanıt (geri alınan işlem, tam zincir 8/8)

- **C1** ilk etkinlik (`create_event_v1`, na1) → `{"status":"pending","approval_source":null}` +
  `approval_requests('event_create', pending, target event)` satırı · **C2** admin onayı
  (AdminEventsPage yolu: `is_admin` muaf UPDATE) → `published`, `approval_source` null
  ("eski yol" — M08 damga basacak) · **C3** ikinci etkinlik → `{"status":"published",
  "approval_source":"auto"}` · **C4** üçüncü aktif → **`event_active_limit` SQLSTATE P0001**.
- **T1 iki katman (C5/C6):** authenticated rol + na1 claims ile doğrudan `INSERT status=
  'published'` → **`42501 new row violates row-level security policy for table "events"`**
  (yanıt gövdesi birebir) · doğrudan `UPDATE status` → **`event_status_direct_update_forbidden`**;
  ikinci etkinlik `published` KALDI. ⚠️ İlk koşu ders: C5 `set role authenticated` OLMADAN
  postgres rolünde geçti (RLS tablo sahibine uygulanmaz — insert "başarılı" göründü); rol
  gerçek geçilince red ölçüldü. (M03'teki PostgREST-anon kanıtı 401 gövdesiyle ayrıca duruyor.)
- **Katılım zinciri (C7):** na2 join → going 1 · `max_attendees=1` yapılınca na3 →
  **`event_attendee_limit` P0001** (yarış kilidi sunucuda) · na2 leave → going 0 + satır
  **`cancelled`** (silinmedi — denetim izi) · **C8** anon aggregate → `{going_count:0,
  max_attendees:1, viewer_status:null}` (satır sızmaz).
- **Rollback sonrası canlı dokunulmamış:** events 1 (eski satır) · M07/T1 satırı 0 ·
  attendee 0 · yeni approval 0.
- **Kabul:** dört ölçümün sonucu bu blokta (C1-C4) + T1 tekrar (C5/C6) + katılım (C7/C8).
  📌 Faz 1 TAMAM — sıradaki: Faz 5 (M08-M10). Yeni ekranlar (katılım düğmesi, kural notu,
  RPC'li form) **bir sonraki frontend deploy'unda** canlanır; DB kuralları şu an bile geçerli
  (eski ekran `status:'pending'` insert ettiği için M03 politikasıyla uyumlu — kırılma yok).

### Faz 5 — panel hızlı eylemleri + ilgi kaydı

**~~M08~~ — ✅ KAPANDI 03.10** · QuickActionsCard

- **`src/lib/community-quick-actions.ts`** (TEK KAYNAK liste) + **`src/components/profile/QuickActionsCard.tsx`**:
  başlangıçta iki eylem — "Etkinlik oluştur" → `/events/create` · "Grup ekle" → `/addcom`
  (ikisi de `community-free-features.test.ts`'in kilitlediği ÜCRETSİZ rotalar). "Davet et" M12'de,
  "Tavsiye iste" M20'de LİSTEYE EKLENECEK (ölü link yok — test bugünü kilitliyor, o gün bilinçli
  güncellenecek). İkonlar anahtar olarak lib'te (TSX'siz), bileşen lucide'a eşler.
- **TÜM ROLLERDE görünür (kabul):** sidebar yolunda `overview` içeriğinin EN ÜSTÜNDE
  (`profile-sidebar-menu.tsx` — menü ÖĞESİ EKLENMEDİ, kilitli menü sırası bozulmadı) · premium
  yolda (`ProfilePremiumLayout`, bireysel roller) hero'nun altında, sekmelerden bağımsız.
  ⚠️ `<nav>`/`<button>` YOK — Link grid (ProfilePage.test'in premium "ilk nav boş" kilidiyle
  çakışmaz; yapısal emsal `AdminQuickActions`).
- **Kabul ölçüldü:** kart iki düzende de çiziliyor (kaynak sözleşmesi + bileşen testi) · iki
  eylem doğru href'lerde (MemoryRouter) · tek kaynak liste (elle etiket sızması kilitli).
- **Kanıt:** 7 yeni test · **mutasyon 6/6 İLK TURDA** (ölü link ekleme · rota kaydırma ·
  overview sırası · premium'dan çıkarma · nav'a çevirme · elle etiket sızdırma) · tam takım
  **428 dosya / 3528 test yeşil** (⚠️ ilk koşuda `test-source-slice-contract` yakaladı: testimde
  çıplak `indexOf+slice` kullanmıştım → `sliceBetween`'e çevrildi — meta-sözleşme çalışıyor) ·
  `tsc` 0 · lint 0 (32 problem tümü `corteqs-ekstre-motoru/`) · `check:dead` 0/0 · `ingest` 58+0 ·
  `verify:text` ✓ 1940.
- *(özgün kapsam)* tek kaynak liste + kart; `ProfileSidebarLayout` ilk ekranı, tüm roller.
  **Kabul:** kart tüm rollerde görünüyor; iki eylem de hedefine gidiyor ✓.

**~~M09~~ — ✅ KAPANDI 03.10** · GettingStartedCard

- **`src/components/profile/GettingStartedCard.tsx`** — "Başlangıç · N/4 tamam" kartı; her
  satır GERÇEK kaynaktan (uydurma yüzde/sayaç YOK): **Profili tamamla** → `profile.profileCompletion`
  (hero kartıyla AYNI RPC verisi — `get_current_user_profile` required sayımı; `requiredTotal=0`
  → tamam sayılır, SQL'in %100 kuralıyla birebir) · **İlk hizmet/ürün** → `carsi_items`
  (`listMyCarsiItems`, `owner_user_id` + `deleted_at null`; CaddeCarsiPage ile AYNI query key —
  ekstra istek yok) · **İlk etkinlik** → `useMyEvents` (paylaşımlı `["events","my",uid]`) ·
  **3 davet → PASİF** (M11-M13'e dek veri kaynağı YOK — sahte tik yazılmaz;
  `referral_code_usages` pazarlama kodudur, onunla ÖLÇÜLMEZ).
- KARAR (03.10): "hizmet/ürün" = **Çarşı ilanı** — 25.09 kararı "Çarşı İLAN LİSTESİ profil
  kartından kaldırıldı" der; bu kart liste GÖSTERMEZ, ilerleme satırı gösterir. `catalog_items`
  üye/danışman DİZİN kaydıdır, hizmet/ürün değildir.
- Kablolama M08 deseni: sidebar `overview` (quickActions → **gettingStarted** → hero → summary;
  menü ÖĞESİ eklenmedi, kilitli sıra bozulmadı) + premium düzen (hero altı) — **tüm roller**.
- **Kabul (elle SQL karşılaştırması):** 3 gerçek kullanıcıda `carsi_items`/`events` sayıları
  SQL'den okundu (0/0/0) → kart formülü todo satırları üretir (bileşen testleri done/todo
  geçişlerini mock verilerle kilitliyor: 2/4 alan → tik yok · total=0 → tamam · 2 etkinlik →
  "2 etkinliğin var" · 1 ilan → "1 Çarşı ilanın var" · davet pasifken sayaç 0/4). Not:
  `get_current_user_profile` test kullanıcılarında boş döndü (üye profil satırı yok — mevcut
  davranış); kart bu durumda requiredTotal=0 → "tamam" çizer, yani RPC'nin SQL sözleşmesiyle
  (total 0 → %100) tutarlı.
- **Kanıt:** 7 yeni test · **mutasyon 6/6** (davete sahte tik · profil formülü gevşetme ·
  total=0 dalı [M3 ilk koşuda Türkçe yorumlu eşleşme KONSOL KODLAMASI yüzünden uygulanamadı —
  ASCII çıpayla tekil koşuda YAKALANDI; G20/G23 dersi 3. kez] · sidebar/premium çıkarma ·
  Çarşı sayısını sabitleme) · tam takım **429 dosya / 3535 test yeşil** · `tsc` 0 · lint 0
  (32 problem tümü `corteqs-ekstre-motoru/`) · `check:dead` 0/0 · `ingest` 58+0 · `verify:text`
  ✓ 1942 · ProfilePage.test'e iki mock eklendi (use-events + cadde-carsi-api — sayfa modül
  grafı genişledi).
- *(özgün kapsam)* profili tamamla · ilk hizmet/ürün/etkinlik · 3 davet; tamamlanma gerçek
  veriden. **Kabul:** her satırın durumu ilgili tablodan okunuyor; elle SQL ile karşılaştırıldı ✓.

**~~M10~~ — ✅ KAPANDI 03.10** · feature_interest + EventFeaturePromo (kilitli ücretli yüzey)

- Migration `20261003040000_feature_interest.sql` **canlıda** (`applied/` + kayıt,
  `check:migrations` **465/465** sapmasız): `feature_interest (feature_key, user_id)` **TEKİL**
  + `created_at` · RLS: okuma kendi satırı (+admin), **insert/update/delete politikası YOK**
  (kanıt satırı silinemez — yazma yalnız RPC) · anon'a tablo tamamen kapalı ·
  `register_feature_interest(text)` — **beyaz liste** `event.featured` + `event.ticketing`
  (⚠️ ajan ihtiyatı: anahtar adları planın Türkçe yüzey adlarından türetildi; M20 `pro.inbox`'ı
  İKİ tarafla birlikte ekler — ayna testi zorlar) · idempotent (`already:true`).
  ⚠️ `interest_registrations` (lansman LEAD formu, ölçüldü: email/phone/message kolonları,
  1 satır) ile KARIŞTIRILMADI — o tabloya dokunulmadı.
- **`src/lib/feature-interest-api.ts`** (FEATURE_INTEREST_KEYS aynası + hata haritası +
  `fetchMyFeatureInterests` ikincil yüzey: hata fırlatmaz boş döner) + **`EventFeaturePromo.tsx`**:
  iki KİLİTLİ kart ("Öne çıkar"/"Bilet sat") + "İlgileniyorum" → ilgi kaydı → "İlgin kaydedildi".
  **Ödeme/fiyat UI'ı YOK** (plan: ödeme kapsam dışı; test kilitliyor). Yerleşim: MyEventsPanel
  altı — **yalnız etkinliği olan üye görür**.
- **Kabul (DB ölçümü, geri alınan işlem — 6/6):** F1 kayıt → satır (`{registered:true,
  already:false}`) · F2 ikinci tık → `already:true` + TEK satır · F3 beyaz liste dışı
  (`pro.inbox`) ve null → `feature_interest_unknown_key` · F4 ikinci anahtar ayrı satır ·
  F5 anon → fonksiyon VE tablo `permission denied` · rollback sonrası canlı 0 satır.
- **Kanıt:** sözleşme **11** + bileşen **4** test · **mutasyon 6/6** (unique silme · beyaz
  listeye tek taraflı anahtar sızdırma · delete politikası ekleme · idempotency koşulu
  [M4 ilk koşuda metin kilidi yüzünden kaçtı → KOŞUL kilidi eklendi, tekil koşuda düştü —
  G21/M02 dersi 4. kez] · anon revoke silme · istemciye üçüncü anahtar) · tam takım **431
  dosya / 3550 test yeşil** · `tsc` 0 · lint 0 (32 problem tümü `corteqs-ekstre-motoru/`) ·
  `check:dead` 0/0 · `ingest:tools` **59** (feature-interest-api kataloglandı) + check 0 ·
  `verify:text` ✓ 1946.
- 📌 **M20'ye devir:** `ProLockedInboxCard` aynı deseni kullanır — beyaz listeye `pro.inbox`
  eklenirken migration + `FEATURE_INTEREST_KEYS` + ayna testi ÜÇÜ birden güncellenir.
- *(özgün kapsam)* `feature_interest` + RLS + kilitli kart + ilgi kaydı; ödeme YOK.
  **Kabul:** karta tıklayınca `feature_interest` satırı oluşuyor (DB ölçümü) ✓.

### Faz 3 — davet + liderlik

**~~M11~~ — ✅ KAPANDI 03.10** · Migration: davet tabloları + RPC'ler + rozet ayarları

- Migration `20261003050000_user_invites_and_leaderboard.sql` **canlıda** (`applied/` + kayıt,
  `check:migrations` **466/466** sapmasız): `user_invites` (code PK · **owner UNIQUE** — üye
  başına tek kod · alfabe `SAFE_CHARS` birebir: I/O/0/1 YOK, ayna test iki dosyayı kilitler) ·
  `user_invite_redemptions` (**invited_user_id UNIQUE** — bir üye bir kez sayılır · satır
  silinmez) · RLS: select kendi satırı (+admin), **yazma politikası YOK** (tek yol RPC) ·
  `invite_settings` (event_settings deseni): `invites.badge_tiers=[3,10,25]` ⚠️ ajan ihtiyatı
  (paket "3 davet"i söyler, kademeleri söylemez — ürün kararı SQL update) + `leaderboard_limit=20`.
  ⚠️ `referral_codes` (admin pazarlama kodu) ile karıştırılmadı, dokunulmadı.
- **RPC'ler:** `get_or_create_my_invite_code()` (idempotent, 6 hane SAFE_CHARS) ·
  `redeem_invite_code(p_code)` (self-invite → `invite_self_not_allowed` · uydurma kod →
  `invite_code_not_found` · ikinci kullanım `already:true` — row_count ile ayrım) ·
  `get_invite_leaderboard(p_limit)` — **SIZINTI ÜÇLÜSÜ SQL'DE** (AI korpus dersi):
  `is_directory_visible=false` rol + `is_placeholder`/`[PLACEHOLDER]` + `is_admin` elenir;
  katalog kaydı olmayan davetçi hiç listelenmez (yarım kimlik sızmaz) · **anon'a açık +
  gövdede auth.uid() YOK** (ikisi ayrı kilitli — M12 doğrulama notu) · eşikler/limit
  `invite_settings`'ten · yanıt `{entries:[{display_name,slug,invite_count}], badge_tiers}`.
- **Kabul (SQL smoke, geri alınan işlem — 6/6):** D1 kod `HKWXK6` + ikinci çağrı `created:false` +
  alfabe regex ✓ · D2 redeem → tek satır, tekrar → `already:true` · D3 kendi kodu →
  `invite_self_not_allowed`, `ZZZZZZ` → `invite_code_not_found` · D4 liderlik: gerçek katalog
  kaydıyla `{display_name:"smddnz", invite_count:1}` · D4b rol `Admin_PlatformAdmin` yapılınca
  entries `[]` · D4c `[PLACEHOLDER]` başlık → 0 · D4d **admin davetçi: kullanım `redeemed:true`
  ama listede YOK (0)** · D5 tiers `[3,10,25]` → ayar `[5,50]` yapılınca değişti · D6 anon
  liderliği OKUR (`array`), kod ÜRETEMEZ (`permission denied`) · rollback sonrası canlı temiz
  (0 invite, 0 redemption, katalog/ayarlar eski değerinde).
- **Kanıt:** sözleşme **10/10** (`user-invites-schema.test.ts`) · **mutasyon 6/6** (owner unique ·
  alfabe sızdırma · self-invite koşulu [M3 ilk koşuda metin kilidi yüzünden kaçtı → KOŞUL kilidi
  eklendi, 5. tekrar — tekil koşuda düştü] · admin filtresi · placeholder filtresi · anon grant) ·
  tam takım **432 dosya / 3560 test** · `tsc` 0 · lint 0 (32 problem tümü `corteqs-ekstre-motoru/`) ·
  `check:dead` 0/0 · `ingest` 59+0 · `verify:text` ✓ 1947.
- 📌 **M12'ye devir:** `/liderlik` sayfası `get_invite_leaderboard`'ı anon okur (grant + gövde-auth
  ölçümleri burada hazır); `InviteCard` kod + link + QR (`referral-qr.ts`); quick actions'a
  "Davet et" M12'de EKLENİR (community-quick-actions test kilidi bilinçli güncellenir);
  rozet etiketleri eşiklerden istemcide türetilir (DB'de uydurma metin yok). M13: kayıt akışında
  `redeem_invite_code` çağrısı + davet linki (`?kod=` taşıyıcısı M12'de tanımlanır).
- *(özgün kapsam)* davet tabloları + 3 RPC + rozet ayarları. **Kabul:** SQL smoke — leaderboard
  çıktısında admin/test/placeholder YOK ✓ (üçü de ayrı senaryoda ölçüldü).

**~~M12~~ — ✅ KAPANDI 03.10** · Kod: invites-api + LeaderboardPage + InviteCard

- **`/liderlik` herkese açık** (`LeaderboardPage`, `lazyWithReload`, **RequireFeature YOK** —
  M01 kilidi otomatik denetledi; RequireAuth da yok: anon liste + giriş yönlendirmesi, girişliye
  InviteCard). **Sitemap'e BİLEREK eklenmedi** (CLAUDE.md 3 kriterinden "thin content değil"
  bugün sağlanmıyor — kayıt birikince değerlendirilir; karar sayfa başlığında yazılı).
- **`src/lib/invites-api.ts`:** `fetchInviteLeaderboard` (anon RPC) · `getOrCreateMyInviteCode`
  (idempotent) · hata haritası M11'e karşı çift yönlü kilitli · **taşıyıcı `?davet=KOD`**
  (`buildInviteLink`/`readInviteCodeFromSearch` round-trip testli — M13 kayıt akışı bunu okuyacak;
  normalizasyon `referral-qr.normalizeReferralCode` — ikinci alfabe UYDURULMADI).
- **`src/lib/invites-badges.ts`:** eşik→rozet SAF hesap; modülde gömülü 3/10/25 YOK (kaynak
  kilidi: sayı literalleri taranıyor) — tiers M11 RPC yanıtından (`invites.badge_tiers`).
- **`src/components/invites/InviteCard.tsx`:** kod + link + kopyala + **QR (`referral-qr.ts`
  YENİDEN — plan notu)**; QR üretilemezse link çalışmaya devam eder (ikincil süs); kod
  alınamazsa GÖRÜNÜR hata + yeniden dene (KR08).
- **quick actions'a "Davet et" EKLENDİ** (`community-quick-actions.ts` 3 eylem; rota App.tsx'te
  kayıtlı olduğu için ölü-link kilidi bozulmadı — M08 testi BİLİNÇLİ güncellendi, her eylemin
  rotasının App.tsx'te varlığı artık ayrıca kilitli). "Tavsiye iste" M20'ye dek YOK (rotasız).
- ⚠️ Liderlik sayfası RPC çıktısını AYNEN çizer — **istemci tarafı filtre YOK** (sızıntı üçlüsü
  SQL'in işi, M11; kaynak kilidi: `.filter(`/`is_admin`/`PLACEHOLDER` sayfada geçemez).
- **Kabul (EKRANDA, gerçek veriyle — KR09 deseni: ölç, sonra temizle):** na1 kod `6ESL6F` +
  na2 kullanımı + admin kod `NEJVJS` + na3 kullanımı + iki katalog bağı CANLI yazıldı →
  **anon HTTP 200:** `entries:[{display_name:"smddnz",invite_count:1}]` — **admin kaydı
  KULLANIMINA + katalog bağına RAĞMEN listede YOK** (is_admin filtresi ekranda kanıtlandı) ·
  başlık `[PLACEHOLDER]` yapılınca entries `[]` · geri alınca title `smddnz` · temizlik sonrası
  canlı baseline (invites 0 · redemptions 0 · title geri; mevcut 3 manager satırı dokunulmamış).
- **Kanıt:** 26 yeni test (`invites-api` 10 · `LeaderboardPage`+`InviteCard` 10 · quick-actions
  güncel 6) · **mutasyon 6/6 İLK TURDA** (RequireFeature ekleme · istemci filtresi · QR kırma ·
  "Davet et" silme · `davet`→`ref` · `lazy()`) · tam takım: koşu#1 **434/435** (tek kızıl
  `internal-links` 15.9s TIMEOUT — tekil koşuda yeşil) + koşu#2 407 + 2 forks-worker yarışlı
  dosya tekil yeşil (G17/M04 sınıfı; makine bugün iki tam koşu + paralel oturumla doygun) ·
  `tsc` 0 · lint 0 (32 problem tümü `corteqs-ekstre-motoru/`) · `check:dead` **0/0/1001**
  (⚠️ oturum başında A15'in `CaddeBrandMark.tsx`'i bayraklıydı — paralel oturum bağladı,
  bu batch sonunda 0) · `check:migrations` 466/466 · `ingest:tools` **60** (+invites-api,
  +invites-badges) · `verify:text` ✓ 1955.
- 📌 **M13'e devir:** kayıt akışı `readInviteCodeFromSearch(location.search)` ile `?davet=`
  okuyup `redeem_invite_code` çağıracak — davet bonusu KAYDI BLOKLAMAZ (fire-and-forget +
  reportClientError). Kod OAuth dönüşünde kaybolmasın diye taşıyıcı localStorage'a da yazılmalı
  (OAuth redirect query'yi düşürüyor — `startGoogleAuth` redirectTo ölçülecek).
- *(özgün kapsam)* invites-api + badges + `/liderlik` + InviteCard + quick action. **Kabul:**
  /liderlik açılıyor ✓ (rota + bileşen) · quick action linki çalışıyor ✓ · sızıntı üçlüsü
  EKRANDA yok ✓ (anon HTTP çıktısı + placeholder düşüşü yukarıda).

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

**~~G03c~~ — ✅ KAPANDI 03.10** · Taban tablonun anon yetkisi daraltıldı (SIZINTI KAPANDI)

> Deploy 03.10'da gerçekleşti (U10 ✅); ziyaretçi turu (data + bundle) geçtikten sonra
> mig `20261003000000_g03c_close_anon_base_table` uygulandı (ledger **461/461**).
> **Kabul #5 dört yol 4/4 yeniden ölçüldü:** taban tablo anon → **42501 permission denied**
> (01.10'da link 10/10 sızıyordu) · view anon → 10 satır, link/contact/user_id **0** ·
> `catalog_items` → `whatsapp_link` kolonu ZATEN YOK (42703) · invite RPC anon → 401.
> EK (KALANLAR'ın "ayrı karar" notu → karar: dahil): anon'un INSERT/UPDATE/DELETE/**TRUNCATE**
> grant'ları da çekildi (RLS kapansa bile felaket sınıfı imkânsız); authenticated grant'ları
> DURUYOR — admin moderasyon ekranı (`updateLanding`) ve editör akışları bozulmadı.
> Geri alma SQL'i migration başlığında yazılı.

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
- 🔴 **G09'dan devredilen karar:** `groups.otp_rate_limits` satırı canlıda **ajan ihtiyatıyla**
  dolduruldu (günde 5 · saatte 3 · 60 sn bekleme · 5 doğrulama denemesi). Pakette sayı YOK;
  bu batch'te kullanıcıyla teyit edilir. Değiştirmek kod değil, tek satır SQL `update`'idir.

**G06 — Kurumsal doğrulama seviyesi: şema + belge yükleme** · 🔴 **K09 KARARI BEKLİYOR**

> ⚠️ **02.10 ölçümü bu batch'in öncülünü çürüttü — kod yazılmadan önce karar gerekiyor.**
> Ölçülenler (canlı):
>
> | Spec diyor | Canlı gerçek |
> |---|---|
> | `catalog_items`'a `verification_level` (0/1/2) ekle | ⚠️ Tabloda **ZATEN iki doğrulama kavramı var**: `verification_status` (5 değerli CHECK: `unverified` 452 · `claimed` 190 · `verified` 9) ve `is_verified` (bool). Üçüncüsünü eklemek **ikinci kaynak** yaratır — bu reponun defalarca belgelediği sınıf. İkisi de canlı kodda kullanılıyor (`admin-catalog.ts` filtre+görünüm, dizin rozetleri). |
> | `claim_type`/`status` CHECK'i önce ölç | ✅ Ölçüldü: **`claim_type` üzerinde CHECK YOK** → yeni değer serbest. (⚠️ `status` üzerinde **iki mükerrer** CHECK var: `catalog_claim_requests_status_check` + `catalog_item_claims_status_chk` — ayrı temizlik.) |
> | 267 kurumsal kayıt | **262** (`platform_role_key like 'Organization%'`) |
>
> 🔴 **Asıl sorun — gate yanlış yerde olabilir.** Politika §6 ve tasarım §190/§244
> Seviye 2'yi **grubu EKLEYEN kişi** için istiyor ("Ekleyen Seviye 2 doğrulanmış
> kuruluş değilse"), ama spec kolonu **`catalog_items`**'a (katalog kaydına)
> koyuyor. İkisi aynı şey değil: bir kullanıcı doğrulanmış bir kuruluşu temsil
> ediyor olabilir ama kendisi katalog kaydı değildir.
>
> Politika yalnız **Seviye 2**'yi tanımlıyor ("okul, dernek, veli birliği");
> **0 ve 1 hiçbir yerde tanımlı değil** — "0/1/2" ölçeği planın kendi eklemesi.
>
> **Önerim (onayına sunuluyor):** yeni kolon AÇMA.
> 1. Seviye 2 = `verification_status='verified'` (bugün 9 kayıt) olarak **türetilsin**;
>    gerekirse `verification_level` bir **generated column** olsun, böylece sürüklenemez.
> 2. Eksik olan tek gerçek bilgi **kanıt ve iz**: `verified_at` + `verified_by_user_id`
>    eklensin.
> 3. Talep akışı `catalog_item_claims` üzerinden (`claim_type='verification_level_2'`,
>    belgeler `evidence jsonb`) + private `org-verification-docs` kovası — bu kısım
>    spec'te doğru.
> 4. Grup eklemedeki kapı **kullanıcı** üzerinden sorulsun: "bu kullanıcı Seviye 2
>    bir kuruluşun yöneticisi mi" (`catalog_item_managers` + türetilmiş seviye).
>
> Onaylarsan G06 bu şekilde yazılır; farklı düşünüyorsan hangi kolonun tek kaynak
> olacağını söyle, ona göre yazarım.

*(özgün kapsam aşağıda)*

**G06 (özgün) — Kurumsal doğrulama seviyesi: şema + belge yükleme** · migration + kod
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

**~~G08~~ — ✅ KAPANDI 01.10** · M1 Spike: davet sayfasından grup adı okunabiliyor mu? · rapor

- **Rapor:** [`docs/dijital-gruplar/2026-10-01-g08-davet-sayfasi-spike.md`](../dijital-gruplar/2026-10-01-g08-davet-sayfasi-spike.md)
- **Sonuç:** üçünde de ad+görsel kimlik doğrulamasız okunuyor, ama **sahiplik kanıtı değil** →
  paketin "ekran görüntüsü + manuel onay" kararı **değişmiyor**. G13'e çıkan 8 kural raporda.
- 🔴 Kalan tek ölçüm: **gerçek bir `t.me/+…` özel davet linki** (elimizde yok; 10 kaydın 10'u
  WhatsApp). G13'ü bloke etmez.
- *(özgün kapsam)* WhatsApp / Telegram / Discord için sunucu tarafında ad+görsel okuma denenir; hız sınırı ve
  `unknown` davranışı ölçülür. Okunamıyorsa sahiplik **ekran görüntüsü + manuel onaya** döner.
- **Kabul:** üç platform için `ok`/`invalid`/`unknown` ölçümlü kısa rapor; istek sayısı ve yanıt
  kodları yazılı.

**~~G09~~ — ✅ KAPANDI 01.10** · `group_settings` anahtar-değer ayar tablosu · migration

- Migration `20261001120000_group_settings.sql` **canlıda** · **15 satır** · 3 okuma yardımcısı
  (`group_setting_bool` / `_int` / `_json`).
- ⚠️ **`group_setting_json` istemciye AÇILMADI** (kara listeyi okuyan onu atlatır); sayısal
  yardımcılar `authenticated`'a açık, tablo anon+authenticated'a tamamen kapalı.
- ⚠️ **TS'te ayna modül bilerek YOK** — tek kaynak migration. Ayna modül bugün erişilemez
  olurdu (`check:dead`, N01 tuzağı) ve "kodda 5 yazıyor → canlıda da 5" yanılgısını beslerdi
  (Cadde'de yaşandı). Eşiği TS'ten okuyan ilk kod (G12+) modülü **gerçek tüketicisiyle**
  ekler ve `group-settings.test.ts` içindeki `allowed` listesine yazar.
- 🔴 **G05'e devredilen karar:** `groups.otp_rate_limits` pakette sayı taşımıyor; konan değer
  (günde 5 · saatte 3 · 60 sn bekleme · 5 deneme) **ajan ihtiyatı**, kullanıcıyla teyit edilecek.
  SMS ücretli (bütçe 20–25 €, T21) olduğu için sıfır sınırla bırakılamazdı.
- *(özgün kapsam)* `cadde_settings` deseni. İlk satırlar: `fast_lane_enabled=false` · `daily_submit_limit=5` ·
  `report_threshold=3` · **`report_require_phone=true`** · `report_min_account_age_days=7` ·
  `blocklist_keywords[]` · `invite_open_daily_limit=20` · `claim_code_ttl_minutes=10` ·
  `otp_rate_limits`.
- **Kabul:** her sayı bu tablodan okunuyor; kodda eşik sabiti yok (sözleşme testi kaynak metnini
  denetler).

**~~G10~~ — ✅ KAPANDI 02.10** · `whatsapp_landings` şema genişletme · migration

- Migration `20261002020000_whatsapp_landings_group_schema.sql` **canlıda** (`applied/` +
  `schema_migrations` kaydı, `check:migrations` sapmasız). **20 yeni kolon** (hepsi
  `add column if not exists`), 4 CHECK kısıtı, `group_invite_code()` fonksiyonu + kısmi tekil
  indeks (`invite_code`), `listing_status` indeksi.
- ⚠️ **BİLİNÇLİ SAPMA — salt ekleme uygulandı.** Spec `member_approved`/`admin_approved`
  kolonlarını DÜŞÜRMEYİ söylüyordu; ama kolonlar repoda **9 dosyada** kullanılıyor ve canlı
  paket hâlâ eski kod (G03b deploy edilmedi). Düşürme **G10c'ye** bırakıldı (G03a/b/c deseni).
  Sözleşme testi düşürmeyi yasaklıyor (`drop column`/`drop table` → test düşer).
- `status`→`listing_status` eşlendi (`approved`→`published`), `group_score` yerinde kaldı,
  mekanik geri doldurma yapıldı: **`invite_code` 8/10 dolu** (2 boş link U07 kararı),
  `listing_status` 10/10 `published`, `ownership` 10/10 `unclaimed`. Ekip kararı alanlarına
  (kategori · ülke/şehir · `short_description`) **DOKUNULMADI** → G11/U07.
- K5: `catalog_sync_whatsapp_landing` eski kolonları okumaya devam ediyor (düşürme yok) →
  fonksiyon değişmedi ve **canlı kanıt:** geri alınan işlemde `catalog_sync_whatsapp_landing`
  **10/10 hatasız**; `source_records` eşleşmesi **10/10**; trigger `trg_catalog_sync_whatsapp_landing`
  yerinde; migration'ın kendi `update`'i sync'i tetikledi (`catalog_items.updated_at` = uygulama anı).
- **Kanıt:** types regen edildi (+113 satır, tek silinen satır boş `Relationships: []` → FK'larla
  doldu) · `tsc` 0 · 10 sözleşme testi (`whatsapp-landings-group-schema.test.ts`) ·
  **mutasyon 6/6 yakalandı** (kolon düşürme · uydurma durum/sahiplik adı · `cadde_*` kataloğu ·
  tekil indeks gevşetme · ekip kararı alanını doldurma).
- *(özgün kapsam)* Yeni: `platform` · `invite_code` · `listing_status` · `hidden_reason` · `ownership` ·
  `owner_user_id` · `submitted_by` · `submitted_as_admin` · `review_flags[]` · `is_global` ·
  `country_code` · `city_id`(→`geo_cities`) · `short_description(160)` · `rules` · `strike_count` ·
  `published_at` · `suspended_until` · `owner_renewal_due` · `link_fail_count` · `link_checked_at`.

**G10c — Eski kolonların düşürülmesi (G10'un ertelenen yarısı)** · migration · ⛔ **BLOKE**

> ⛔ **G03b canlıya deploy edilmeden UYGULANAMAZ** (G03c ile aynı kuyruk — canlı paket hâlâ
> `whatsapp_landings`'i `select("*")` ile okuyor; kolonlar düşerse yayındaki site kırılır).

- Düşürülecekler: `member_approved` · `admin_approved` · (spec'e göre `status`'ün kendisi —
  ama `catalog_sync_whatsapp_landing` ve view `v_landing` onu okuyor; önce onların
  `listing_status`'e geçirilmesi gerekir).
- Sıra: `catalog_sync_whatsapp_landing` + `v_landing` yeni kolonları okuyacak şekilde güncellenir
  (K5'in ertelenen yarısı) → repodaki **9 dosya** (`WhatsAppLandingsModeration.tsx`,
  `LandingApprovalBadges.tsx`, `WhatsAppLandingEditorPage.tsx`, `AddWhatsAppPage.tsx`,
  `whatsapp-landings.ts`, `whatsapp-landing-presentation.ts` + testleri) `listing_status`'e taşınır
  → deploy → **sonra** `drop column`.
- Sözleşme testi `whatsapp-landings-group-schema.test.ts` o gün **güncellenir** (şu an düşürmeyi
  yasaklayan test, düşürme batch'inde tersine çevrilir — G03b'de `rowToLanding`'de yapılanın aynısı).
- **Kabul:** canlı paket yeni kolonlardan okuyor (ölçüm: yayında `member_approved`'ı okuyan 0 chunk);
  drop migration'ı canlıda; `tsc` 0; moderasyon ekranı çalışıyor.

**G11 — Mevcut 10 grubun eşlemesi + veri göçü** · migration + CSV
- CSV üretilir, **ekibe gider** (U listesi). 4 karar: `diger`×3'ün kategorisi · 6 `Global/Genel`
  grubun hedef ülkesi (`almanya101→Almanya`) · **2 boş linkin** akıbeti · açıklamaların 160'a
  indirilmesi. Hepsi `published` + `unclaimed` başlar.
- **Kabul:** serbest metin konum kalmadı; `invite_code` 10/10 dolu (veya boş linkli 2 grup
  bilinçli `hidden`); CSV ekip onaylı.

### Faz D — iş kuralları

**~~G12~~ — ✅ KAPANDI 02.10** · Durum makinesi + moderasyon logu · migration

- Migration `20261002030000_group_status_machine.sql` **canlıda** (`applied/` + `schema_migrations`
  kaydı, `check:migrations` sapmasız). Salt ekleme: `group_moderation_log` (RLS: istemciye kapalı,
  admin select) · **tek kapı** `set_group_status_v1(...)` security-definer RPC · geçiş yasallığı
  `group_status_transition_allowed()` (tasarım §2 birebir: `removed` kalıcı, `rejected` terminal,
  `published→rejected` YOK) · `trg_guard_listing_status` (BEFORE UPDATE) · `groups.suspension_days=30`
  (G09 doktrini: eşik `group_settings`'ten, kodda sabit yok).
- **Kabul testi #12 canlı kanıt (geri alınan işlem, 13/13):** her geçiş loglanır · no-op log YAZMAZ ·
  illegal geçiş + geçersiz durum + sebepsiz `hidden` reddedilir · anon/sıradan kullanıcı `group_forbidden` ·
  admin→`actor_kind=moderator`, service_role→`system` · doğrudan `update...set listing_status`
  **trigger ile engellenir** · **legacy `status` update SERBEST** (eski paket kırılmaz, iki sistem
  G10c'ye dek paralel) · askı ~30 gün. Rollback sonrası canlı veri dokunulmamış (10 published, 0 committed log).
- 🔴 **Gerçek kusur bulundu ve onarıldı (canlı davranış testi yakaladı — kaynak testi GÖREMEZDİ):**
  SQL üç-değerli mantık tuzağı: `p_reason not in (...)` NULL reason'da **NULL** döner (TRUE değil) →
  `if NULL` raise'i atlar → `hidden` **sebepsiz kabul ediliyordu**. NULL-safe yapıldı
  (`p_reason is null or ...`), sözleşme testine kilitlendi.
- ⚠️ **types.ts regen BİLİNÇLİ ERTELENDİ:** G12 hiçbir TS-tüketimli tip eklemiyor (yeni tablo/fonksiyonları
  G18+/G24 tüketecek). db-url regen **kompakt format** (6923 satır) üretiyor, repodaki canonical dosya
  **verbose** (16634 satır) → ~9700 satır churn; canonical `--project-id` **login ister** (token yok).
  `tsc` regen olmadan **0**. 📌 **AYRI BORÇ:** CLI 2.119 (kompakt) ≠ committed types.ts (verbose) —
  gelecekteki HER regen dev diff üretir; canonical komut standardize edilmeli (kullanıcı login'i gerek).
- **Kanıt:** sözleşme testi **20/20** · **mutasyon 6/6 yakalandı** (log INSERT yönlendirme · guard raise
  kaldırma · NULL-safe geri alma · security definer kaldırma · kaçak `rejected→published` kenarı · ayar
  okuması silme) · `tsc` 0 · `check:dead` 0 · `check:migrations` sapmasız · 📌 **G09 bayatlama
  kapanı çalıştı:** tam takım `group-settings.test.ts`'i düşürdü (yeni test dosyası çıplak
  `groups.suspension_days` metni taşıyor) → `allowed` listesine eklendi (doktrin: anahtarı
  kullanan ilk dosya listeye kendini yazar).
- *(özgün kapsam)* `group_moderation_log` + **tek** `set_group_status_v1(...)`; doğrudan
  `update ... set listing_status` YASAK (trigger engeller). **Kabul:** #12 — her geçiş logda.

**~~G13~~ — ✅ KAPANDI 02.10** · Sahiplik doğrulama · migration + kod + edge function

- Migration `20261002040000_group_claims.sql` **canlıda** (`applied/` + kayıt, `check:migrations`
  sapmasız): `group_claims` (aktif TEK kod + kullanıcı başına TEK açık talep — kısmi tekil indeksler) ·
  `group_invite_reads` denetim tablosu (**link kolonu YOK**, G08 kural 8) · private kova
  `group-claim-screenshots` (10 MB, 4 MIME, kendi-klasör politika) · 4 RPC + 1 iç yardımcı ·
  `groups.claim_start_daily_limit=10` (⚠️ pakette sayı yok — ajan ihtiyatı, K10'la birlikte teyit).
- **Edge function `group-claim-verify` DEPLOY EDİLDİ** (`check:functions` **13/13** sapmasız):
  davet sayfasını SUNUCU TARAFINDA okur (G08 kural 1), platform-özel geçerlilik işaretleri
  (boş `og:title`=invalid · jenerik Telegram=invalid · Discord API 404=invalid), HTML varlık
  çözümü (`Mezunları` ✓), sonuç YALNIZ service_role'e açık `group_claim_record_verification`'a yazılır.
- 🔴 **Guard v2 — canlı güvenlik kusuru kapatıldı:** `Users can update own landings` politikasıyla
  kullanıcı kendi satırına `ownership='verified'` YAZABİLİYORDU (ölçüldü). Guard artık ownership +
  `owner_user_id` + 11 motor alanını (strike/link sayaçları, invite_code, platform…) engelliyor;
  legacy `status` + içerik alanları (tagline, group_name…) SERBEST (canlı paket kırılmaz — ölçüldü).
- 🔴 **K10'a giden ölçüm:** `auth.users` trigger'ı HER kullanıcıya otomatik `User_DiasporaMember`
  atıyor (**175/175 kullanıcının tam 1 rolü var**, PK=user_id). Ezme-yok kuralıyla
  `Community_*Admin` üretimde **hiç kimseye atanamaz** → G13 güvenli davranışı uyguluyor
  (rol yerinde kalır + `role_skipped_reason` yazılır), rol modeli kararı **K10**.
- **Kabul kanıtı (canlı, geri alınan işlem — 18/18):** kod yolu uçtan uca: CQ+4 hane · TTL 10 dk ·
  idempotent yeniden istek · 2 yanlış deneme `attempts_left` 2→1 · **invalid/unknown deneme SAYMAZ**
  (G08 kural 5) · 3.'de `rejected` + not · doğruda `verified`+`ownership`+rol ATANDI (rolsüz kullanıcıda) ·
  supersede (aktif tek kod) · günlük sınır `rate_limited` · RLS yalnız kendi talepler (5 satır) ·
  ekran görüntüsü yolu: başkasının klasörü `path_forbidden` · `is_contested=true` (verified grup) ·
  admin approve → ownership devri + default rol EZİLMEDİ · Admin_SuperAdmin EZİLMEDİ · aynı rol →
  `role_assigned=true` · grant matrisi: record=service_role ONLY, apply=iç, start=authenticated.
  Rollback sonrası canlı dokunulmamış (0 claim, 0 read, 10 unclaimed, 175 rol, limit 10).
- **Gerçek sayfa ölçümü:** 8/8 canlı davet linki `ok` + ad okundu (Türkçe çözülüyor), linkler
  loglanmadı/ekrana basılmadı. **Duman 4/4:** JWT'siz 401 (gateway) · anon 401 (`getUser` reddi —
  verify_jwt tek başına yetki değil) · kötü origin 403 · preflight 200.
- **Kanıt:** 30 sözleşme testi (`group-claims-schema.test.ts`) + 18 birim (`group-invite-read.test.ts`) ·
  **mutasyon 6/6** (grant sızdırma · guard raise silme · ezme koruması kırma · TTL sabitleme ·
  **reads'e link kolonu sızdırma** · verified'a kod yolu açma) · `tsc` 0 · `check:dead` 0 ·
  `ingest:tools` 56 araç (13 edge) · 📌 G09 kapanı önceden karşılandı (allowed listesi).
- ⏳ Kod yolunun TAM mutlu sonu (gerçek grup adına CQ kodu eklenip doğrulanması) ekip işi:
  Burak bir grubun adına geçici `· CQxxxx` eklediğinde 1 dakikalık canlı kabul (G08'in Telegram
  linki notuyla aynı sınıf). RPC/edge katmanı bu teste gerek kalmadan kanıtlı.
- *(özgün kapsam)* `group_claims`; `CQ`+4 hane, 10 dk, 3 deneme, 10 dakikada 3 deneme sınırı; yedek
  yol ekran görüntüsü. Doğrulanınca platforma göre `Community_WhatsApp/Telegram/DiscordAdmin` rolü.
  ⚠️ `user_role_assignments` PK'si **kullanıcı başına TEK rol** — mevcut rolü ezme. `verified` gruba
  yeni talep → **otomatik devir YOK**. **Kabul:** G08 sonucuna göre kod veya ekran görüntüsü yolu
  uçtan uca çalışıyor.

**G14 — Şikayet sistemi** · migration + kod · `group_reports`; eşik: girişli + **telefonu
doğrulanmış** (G04) + hesap ≥7 gün + farklı 3 hesap (hepsi `group_settings`'ten). Sebepler kırmızı
çizgilerle birebir + "Diğer (açıklama zorunlu)". Aynı kişi aynı gruba 30 günde 1.
**Kabul:** kabul testi **#6** — 3 uygun hesap gizler; 6 günlük hesabın **ve** telefonu
doğrulanmamış hesabın şikayeti sayılmaz. ⚠️ "0 geçerli şikayet" ile geçmiş sayma — eşiğin
**gerçekten tetiklendiği** ölçülür.

**~~G15~~ — ✅ KAPANDI 02.10** · Uyarı (strike) sistemi + ekleme yasağı · migration

- Migration `20261002050000_group_strikes.sql` **canlıda** (`applied/` + kayıt, `check:migrations`
  sapmasız): `group_strikes` (sebep · karar veren · tarih · outcome) · `group_submission_bans`
  (süresiz, `unique(user,landing,reason)`) · `admin_record_group_strike` (is_admin tek kapı) ·
  `group_submission_banned()` yardımcısı · **`trg_block_banned_submitter`** (BEFORE INSERT —
  bugünkü AddWhatsApp akışı dahil her ekleme yolunu kapsar, admin muaf).
- Merdiven tasarım §7 birebir: 1.=uyarı (durum değişmez) · 2.=30 gün `suspended`
  (`suspended_until`'da, G12 `groups.suspension_days`'ten) · 3.=`removed` + **ekleyen VE sahibe**
  yasak · kırmızı çizgi **2/4/6** (politika §4) İLK ihlalde `removed`+yasak. Eşikler
  `group_settings`'te (`strike_suspend_threshold=2` · `strike_remove_threshold=3` ·
  `terminal_redlines=[2,4,6]`) — kodda sabit yok.
- **Geçişler YALNIZ G12 tek kapısından** (`set_group_status_v1`) → her strike kaynaklı durum
  değişikliği `group_moderation_log`'da (kabul #12 zinciri korunur; canlı testte doğrulandı:
  `reason=strike_2`/`strike_3` log satırları).
- Karar (tasarımın boşluğu): 2. ihlal grup `published` değilse askı MATRİS GEREĞİ uygulanamaz →
  ihlal kaydedilir, `outcome='warning'` + "askı uygulanamadı" notu; merdiven 3.'te `removed`'la
  kapanır (canlı S6 ile ölçüldü). `removed` gruba ihlal işlenmez (`group_already_removed`).
  Yasak kaldırma moderatör işi → G24. Uyarı BİLDİRİMİ (tasarım §9) → G23.
- **Kabul kanıtı (canlı, geri alınan işlem — 13/13):** S0 yetkisiz red · S1 uyarı+yayında ·
  S2 askı ~30 gün + G12 logu · S3 removed + 2 yasak (ekleyen+sahip) + log · S4 kırmızı 2 ilk
  ihlalde terminal · S5 kırmızı 1 terminal DEĞİL · S6 hidden'da karar yolu · S7-S9 sınır hataları ·
  S10 yasaklı INSERT engellendi/temiz kullanıcı geçti/admin muaf · S11 yardımcı doğru.
  Rollback sonrası canlı **dokunulmamış** (0 strike, 0 ban, 0 log, 10 published, max_strike 0).
- **Kanıt:** sözleşme testi **16/16** · **mutasyon 6/6** (yasak yazımı saptırma · tek kapı atlama ·
  eşik sabitleme · trigger susturma · terminal liste daraltma [2] · strike_count senkron bozma) ·
  `tsc` 0 · `check:dead` 0 · `ingest:tools` güncel · G09 kapanı allowed listesine önceden işlendi.
- *(özgün kapsam)* `group_strikes`: uyarı → 30 gün `suspended` → `removed` + ekleme yasağı;
  kırmızı çizgi 2/4/6 doğrudan `removed`. **Kabul:** üç senaryo ayrı ölçüldü; askı süresi
  `suspended_until`'da.

**~~G16~~ — ✅ KAPANDI 02.10** · Grup sayfası gönderileri + moderasyon · migration

- Migration `20261002060000_group_posts.sql` **canlıda** (`applied/` + kayıt, `check:migrations`
  sapmasız). ⚠️ **Tasarım §4'ün ikinci çürüyen varsayımı:** "mevcut" denilen
  `whatsapp_landing_comments/_likes/_follows` tabloları canlıda **YOK** (to_regclass ölçümü) →
  `group_posts` SIFIRDAN (G09'daki `site_settings` çürümesiyle aynı ders).
- İlk durum tablosu **tasarım §3.D birebir** (canlı C1–C4 ile ölçüldü): doğrulanmış admin →
  `published` · güvenilir üye → `published` (sonradan denetlenir) · sahipli grupta diğer →
  `pending_group_admin` (+`escalate_at` 48 saat) · sahipsizde (unclaimed/claim_pending) →
  `pending_platform`. Güvenilir üye **grup bazlı**: ≥`trusted_member_min_approved_posts` (5,
  G09'dan) yayında gönderi.
- **Kabul #7 canlı ölçüldü:** `group_posts_escalate_due()` süresi dolanı `pending_platform`'a
  taşıdı, `escalate_at` temizlendi (cron bağlama G22'de; fonksiyon YALNIZ service_role'e açık).
- Yetki matrisi (uydurma yetki YOK): sahip yalnız kendi grubunun `pending_group_admin` kuyruğu
  (§11) · `pending_platform` + `published`→`remove` YALNIZ admin · istemciye yazma yolu YOK
  (grant yalnız select; insert/update/delete politika ve grant'ı yok — tek yol RPC).
  RLS görünürlük: published grubun published gönderisi herkese · yazar kendi gönderisini her
  durumda · admin her şey · sahip kendi grup kuyruğu.
- Kararlar: gönderi yalnız `published` gruba (`group_not_published`) · `post_max_chars=10000`
  ⚠️ AJAN İHTİYATI (pakette sayı yok, teknik tavan) · `post_escalation_hours=48` (§3.D) ·
  **güvenilir üyenin "onaylı şikayet yok" yarısı G14'te** — `group_reports` canlıda YOK
  (ölçüldü), şema uydurulmadı; sözleşme testi bugünü kilitler (helper `group_reports`'a
  BAKAMAZ — G14 genişletirken testi bilinçli güncelleyecek). Bildirim (§9) G23'te.
- **Kanıt:** kabul canlı **14/14** (C1–C14: 4 sınıf · #7 · sahip/admin/yetkisiz matrisi ·
  hidden gruba gönderi yok · sınır hataları · grant matrisi · RLS; geri alınan işlem, rollback
  sonrası 0 post/10 published/10 unclaimed) · sözleşme **25/25** · **mutasyon 6/6** (sınıf kaydı ·
  eskalasyon tersine · yazma grant'ı sızması · uydurma sahip-remove · saat sabitleme · escalate
  yetki sızması) · `tsc` 0 · `check:dead` 0 · `ingest:tools` güncel.
- *(özgün kapsam)* ⚠️ yorum tablosu YOK → `group_posts` sıfırdan (`post_status` + `escalate_at`).
  **Kabul:** #7 — 48 saat bekleyen gönderi platform kuyruğuna geçiyor.

**~~G17~~ — ✅ KAPANDI 02.10** · Grup Sağlık Skoru · migration

- Migration `20261002070000_group_health_score.sql` **canlıda** (`applied/` + kayıt, `check:migrations`
  sapmasız): `group_recommendations` (kullanıcı+grup TEKİL, istemciye yazma yolu YOK — tek kapı
  `group_recommendation_set`) · 3 yeni kolon (`has_approved_badge` · `group_score_computed_at` ·
  `group_score_breakdown`) · `group_health_score_compute` (tasarım §5 birebir: 15+15+15+15+20+20) ·
  `group_health_score_recompute` + `_all` (YALNIZ service_role — cron G22) · **guard v3** (skor
  kolonları motor alanı; `is_admin` muaf ↓) · 4 yeni eşik `group_settings`'te (70/65/10/90 — hepsi
  paket kaynaklı; 7 gün G09'da zaten vardı).
- 🔴 **ÖLÇÜM (batch ön şartı): ESKİ KOD group_score'A YAZIYORDU.** `updateLanding`
  (`src/lib/whatsapp-landings.ts`, `1a3310a1` 03.06 → canlı pakette) her admin moderasyon
  kaydında `group_score: null` gönderiyor (çağıran ekran alanı hiç geçmiyor). Canlı DB'de 10/10
  NULL, DB tarafında yazan yok (tek referans `catalog_sync`, o da OKUR). **İki sonuç:** (1) src
  clobber kaldırıldı (guard v3 + sözleşme testi kilitledi); (2) guard v3 admin'i **MUAF** tutuyor —
  aksi halde canlı moderasyon kaydı deploy'a kadar kırılırdı (legacy `status` doktrini). Sahip/anonim
  kendi skorunu YAZAMAZ (canlı ölçüldü: `group_score_direct_update_forbidden`).
- ⚠️ **KARAR — kalıcı skor yazılmadı:** canlı eski kart `groupScore / 10` çiziyor (0-10 ölçek dili);
  0-100 skor yazılsaydı kullanıcı "35 / 10" görürdü. Migration HİÇBİR landing satırını güncellemez;
  skorlar cron (G22 `health-score`) bağlanana kadar NULL. **🔴 G22 TUZAĞI:** health-score cron'u
  frontend deploy'undan (G19 yeni kart) ÖNCE bağlanırsa canlıda "X / 10" görünür.
- Kararlar (tasarımın boşlukları): "48 saati aşan kuyruk kaydı" = süresi dolmuş `pending_group_admin`
  VEYA eskale olmuş kararsız `pending_platform` (90 gün penceresi, kuyruk eriyince kalem geri
  kazanılır) · tavsiye yalnız `published` gruba (G16 deseni) · **link kalemi bugün `link_fail_count=0`**
  (tarihçe tablosu tasarımda YOK, uydurulmadı — "son 4 kontrol" gerçek sinyali G22 link-health'ta) ·
  **şikayet kalemi vacuous TRUE** (`group_reports` YOK — G16 deseni, compute BAKAMAZ, sözleşme
  kilitler; G14 genişletirken testi bilinçli günceller) · `whatsapp_landings_public` view'ına rozet
  EKLENMEDİ (drop/recreate salt-eklemeyi bozardı; teşhir G19/G20).
- **Kabul #11 canlı ölçüldü (geri alınan işlem, 16/16):** ilk 7 gün skor NULL + rozet false +
  computed_at NULL · 8 günlük grup 35 (link+reports) · kalem kalem 65→80→rozet TRUE · **histerezis:**
  65'e düşünce rozet KALDI, 50'de düştü, 65'te geri GELMEDİ, 80'de geldi · tavsiye: idempotent,
  geri alma, 3 tavsiye +6 puan, 12 tavsiye tavan +20 → skor 100 · sınır hataları (anon/hidden/yok) ·
  guard: sahip skor+rozet+breakdown YAZAMADI, içerik serbest, admin clobber muaf · `recompute_all`
  10/10 · RLS (kendi satırı 1, admin 2, anon 0) · recompute authenticated'a kapalı. Rollback sonrası
  canlı **dokunulmamış** (0 skor, 0 rozet, 0 tavsiye, 0 gönderi, alanlar eski değerinde).
- **Kanıt:** sözleşme testi **23/23** (`group-health-score-schema.test.ts`) · **mutasyon 6/6**
  (seed 70→75 · admin muafiyeti silme · tavsiye ağırlığı 20→10 · unique kısıtı silme · grace dalı
  kırma · src clobber'ı geri koyma) · `tsc` 0 · lint 0 (32 problem tümü `corteqs-ekstre-motoru/`) ·
  tam takım **399 dosya / 3211 test yeşil** (⚠️ ilk koşuda 3 ilgisiz dosyada geçici "forks worker"
  hatası — tekil ve tam yeniden koşuda yeşil) · `check:dead` 0/0/**982** · `ingest:tools` 56 araç
  (tools.json + generated +2 kayıt: bu test dosyası + `admin-updates/2026-10.ts` — önceki batch'ten
  bayat kalmış) · `verify:text` ✓ 1895 dosya · G09 kapanı: yeni test dosyası `group-settings.test.ts`
  allowed listesine eklendi.
- *(özgün kapsam)* `group_recommendations` + tasarım §5 formülü birebir; ilk 7 gün `null`; rozet
  70/65 histerezis. **Kabul:** #11 — ilk 7 gün `null` ve kartta görünmüyor (DB tarafı ölçüldü;
  kart tarafı G19'da — mevcut kart NULL skoru zaten "Skor bekleniyor" çiziyor, yeni tasarım o
  metni kaldırıyor).

### Faz E — sayfalar (paketin S1–S4'ü)

**~~G18~~ — ✅ KAPANDI 02.10** · S1 Form · migration + edge + kod

- Migration `20261002080000_group_submit.sql` **canlıda** (`applied/` + kayıt, `check:migrations`
  454/454 sapmasız): **tek gönderim kapısı** `submit_group_v1` (security definer, authenticated) —
  link normalize + platform türetme (ŞEMA-ÇIPALI: yalnız chat.whatsapp.com · t.me/telegram.me ·
  discord.gg/discord.com-invite) + dedup (`group_invite_code` — G10 tek kaynak, ikinci regex YOK) +
  kara liste ön taraması (`review_flags`'e yazar, REDDETMEZ — §8) + hızlı şerit (4 koşul: şerit açık
  AND admin AND claims_admin AND işaretsiz) + günlük sınır (`daily_submit_limit`, kayan 24h) + Grup
  Sözü kapısı + geo doğrulama. Kategori CHECK'i **genişletildi** (eski 10 + yeni 7 — politika §5,
  "Diğer" yok). `group_slugify` yardımcısı. Hızlı şerit yayını `group_moderation_log`'a `fast_lane`
  düşürür (kabul #12 zinciri).
- **Edge `group-preview` DEPLOY EDİLDİ** (`check:functions` **14/14** sapmasız): dedup (exists →
  DIŞ İSTEK ATILMADAN döner) + ad/görsel ön doldurma (`_shared/group-invite-read`'e `image` eklendi:
  og:image · Discord CDN — G13 semantiği değişmedi). Kural 8 kilitli: dedup select'i `whatsapp_link`
  OKUMAZ, log link taşımaz. Duman 4/4: preflight **200** · JWT'siz **401** (gateway — `verify_jwt`
  default true ÖLÇÜLDÜ) · kötü origin **401** (gateway önce kesiyor) · anon anahtar **401**
  (`getUser` reddi — verify_jwt tek başına yetki değil dersi).
- **Form yeniden yazıldı** (politika §2'nin 7 satırı): link (blur'da önizleme) · ad (otomatik dolar,
  elle düzeltilir — kullanıcı adı ezilmez) · 7 kategori tek seçim (**Aile & Çocuk disabled** ↓) ·
  `SearchableCountrySelect`/`SearchableCitySelect` + Global kutusu (şehir kapanır, ülke "Hedef
  Ülke") · 160 karakter sayaçlı · "admini misin" Evet/Hayır · **Grup Sözü BİREBİR** (politika §10
  metnine karşı test kilitli) işaretsiz gönderim kapalı. **Platform seçimi + serbest metin konum
  KALKTI.** Yasaklı kullanıcı (G15 `group_submission_banned`) form açılışında uyarı görür.
- ⚠️ **KARAR — kabul #10 bugünkü hâliyle kilitli:** `verification_level` sistemi YOK (K09/G06) →
  Aile & Çocuk **SUNUCUDA da kilitli** (`group_submit_category_locked`; bugün hiçbir hesap seviye-2
  DEĞİL, yani "seviye-2 olmayana kapalı" = herkese kapalı = doğru). G06 kilidi seviye kontrolüne
  çevirirken `group-submit-schema.test.ts` bilinçli güncellenecek (G14/G16 deseni).
- ⚠️ **KARAR — hızlı şerit admin özbeyanı:** "Ekleyen admin VE sahiplik verified" koşulu, admin
  `claims_admin=true` dediğinde verified sayılır (G12/G15 admin güven doktrini; claim kod/ekran
  akışı admin-OLMAYANLAR için — kabul #3 ancak böyle gönderim anında ölçülebilir).
- ⚠️ **PARALEL SİSTEM (deploy'a dek):** canlı eski paket hâlâ `submitLanding` (doğrudan insert +
  `Users can create own landings` RLS) kullanıyor → politika ve eski fonksiyon BİLEREK duruyor;
  yeni form deploy'dan sonra canlı olur. Deploy sonrası temizlik: `submitLanding` emekliliği +
  INSERT politikasının RPC'ye daraltılması (G10c/G19 kuyruğuyla aynı karar anı). Legacy köprü
  kolonları RPC'de doldurulur: `country/city` geo'dan (Global→'Genel'), `description` etiketleri
  (`[Platform:]`/`[Badge …]`), `status` approved/pending eşlemesi — canlı eski paket yeni kayıtları
  da doğru çizer.
- **Kabul kanıtı (canlı, geri alınan işlem — 14/14):** **#1** aynı kod → `already_listed` + INSERT
  YOK (10→10) · **#2** şerit AÇIK + admin değil → `pending_review` + `claim_pending` · **#3-karşılığı**
  şerit AÇIK + admin + claims → `published` + legacy `approved` + log `fast_lane/moderator` ·
  **#4** "vize ve oturum" → `review_flags={vize,oturum}` + şerit açıkken bile `pending_review`,
  log YOK · 8 sınır hatası (söz yok · aile-cocuk kilit · eski `diger` reddi · 161 karakter ·
  facebook linki · şehirsiz · uydurma ülke · ülke-dışı şehir) · günlük sınır 6.'da `rate_limited` ·
  yasaklı → `group_submission_banned` · Global → Almanya/Genel/city_id null/mode visual/hero ·
  anon `permission denied` · şerit KAPALI + admin → `pending_review`. Rollback sonrası canlı
  **dokunulmamış** (10 landing, fastlane false, 0 ban, 0 log, 0 test kaydı).
- 🔴 **İki gerçek kusur canlı testte yakalandı (kaynak testi GÖREMEZDİ):** (1) `v_country.code`
  select listesine alınmamıştı → her gönderim `record has no field "code"` ile düşerdi; (2) Global
  dalda `v_city.id` hiç atanmadan INSERT ifadesinde okunuyordu → `record "v_city" is not assigned
  yet` (SQL CASE kısa devresi plan-parametreyi kurtarmıyor). İkisi de onarıldı, canlı fonksiyon
  yamandı, kabul yeniden koştu.
- **Kanıt:** sözleşme+birim **67 test** (`group-submit-schema` 28 · `group-submit` 10 ·
  `AddCommunityFormSection` 14 · sayfa/insert-auth/settings regresyonları yeşil; `insert-auth-contract`
  çıpası `submitLanding`→`submitGroupV1`'e BİLİNÇLİ taşındı — G02 giriş kapısı iddiaları aynen) ·
  **mutasyon 6/6** (hızlı şerit koşulu düşürme · kara listeyi sabitleme · aile-cocuk kilidini açma ·
  edge dedup'a link sızdırma · client çıpa gevşetme [M5 ilk koşuda rapor yarışına takıldı, tekil
  yeniden koşuda 3 test düşürdüğü ÖLÇÜLDÜ] · söz olmadan gönderim) · `tsc` 0 · lint 0 (32 problem
  tümü `corteqs-ekstre-motoru/`) · tam takım **402 dosya / 3263 test yeşil** · `check:dead` 0/0/**983** ·
  `ingest:tools` **57 araç** (14 edge) · `verify:text` ✓ 1900 · types regen YOK (`as never` deseni —
  G12 borcu; regen gelince `group-submit.ts` tip kazanır).
- 📌 **G19/G20'ye devir:** `already_listed` uyarısı "Sahibi misin?" der ama claim akışı GİRİŞİ
  (kod iste/ekran görüntüsü UI) G20 detay sayfasında · public view rozet/skor kolonları G19'da ·
  "Yeni" etiketi 72 saat (#3'ün UI yarısı) G19'da.
- *(özgün kapsam)* link → otomatik ad/görsel/platform; 7 kategori; `geo_*` + Global; 160 karakter;
  "admini misin"; Grup Sözü. **Kabul:** **#1** · **#2** · **#4** · **#10** (bugünkü hâli: sunucu
  kilidi — seviye sistemi G06'da).

**~~G19~~ — ✅ KAPANDI 02.10** · S2 Dizin · migration + kod

- Migration `20261002090000_public_view_motor_badges.sql` **canlıda** (`applied/` + kayıt,
  `check:migrations` 455/455 sapmasız): `whatsapp_landings_public` **v2** — G03a PII masking'i
  (4 kolon null) AYNEN, sona motor kolonları (`platform · short_description · listing_status ·
  ownership · published_at · has_approved_badge · is_new`) · `groups.new_badge_hours=72` (politika
  §6 "Yeni: ilk 72 saat") · `group_listing_is_new()` (SECURITY DEFINER → `group_setting_int`
  anon'a AÇILMADI, G09 grant matrisi değişmedi; `coalesce(published_at, created_at)` — eski paket
  onay yolu da "Yeni" alır).
- 🔴 **GİZLİ KUSUR KAPATILDI (canlı ölçümle):** view filtresi yalnız legacy `status='approved'`
  idi; G12 `set_group_status_v1` legacy `status`'ü DEĞİŞTİRMİYOR → moderatörün `hidden/suspended/
  removed` yaptığı grup **dizinde görünmeye devam ederdi**. Yeni ÇİFT filtre: `status='approved'
  AND listing_status IN ('published','pending_review')` — motor kararı anında yansır, eski paketin
  onay yolu (status approved + listing pending_review) GÖRÜNÜR KALIR (canlı içerik bugün birebir
  aynı: 10/10). DROP VIEW tek istisna (create-or-replace kolon EKLEYEMEZ; bağımlı 0 ölçüldü,
  recreate aynı transaction'da).
- **Rozet dili (politika §6 birebir, metinler politika DOSYASINA karşı kilitli):** "Admin onaylı!"/
  "Üye onaylı!" KALKTI → `ownership='verified'` → **"Sahibi doğruladı"**, değilse **"Üye önerisi"**
  (eski tag'ler rozeti etkilemez — motor alanı tek kaynak) · `is_new` → **"Yeni"** ·
  `has_approved_badge` → **"Onaylı Grup"** (eşik İSTEMCİDE YOK — sunucu bayrağı, histerezis G17'de).
  Filtre "Sahibi doğruladı"ya geçti. Admin moderasyon ekranının eski dili G24'e kadar duruyor
  (bilinçli sınır — public yüzey değişti).
- **"Skor bekleniyor" HİÇBİR YERDE YOK** (politika §6: "Skor hesaplanana kadar kartta skor alanı
  gösterilmez") — kart + detay placeholder kutusu söküldü; skor 0-100 ölçeğiyle ("Grup Sağlık
  Skoru X / 100") yalnız sayı varsa render. Eski "/ 10" dili bitti.
- **Sıralama skora bağlandı** (politika §7): `listLandings` `group_score DESC NULLS LAST +
  created_at DESC`. **Filtre+kart tek liste:** `categoryOptions` artık `categoryMeta`'dan
  TÜRETİLİYOR (ikinci liste silindi). Türkçe arama `trIncludes` mevcut hâliyle korundu; sayfalama
  `fetchAllRows` (S07c) zaten vardı. ⚠️ Kategori taksonomisi (eski 10 → yeni 7) G11 veri
  eşlemesine bağlı — canlı 10 grup eski anahtarları taşırken filtre onları göstermek ZORUNDA
  (motor form zaten yeni 7'yi kullanıyor).
- **Kabul #3 canlı ölçüldü (geri alınan işlem — 8/8):** V1 anon view → 10 satır, motor kolonlar
  dolu, PII 0/0/0 · V2 `is_new`: şimdi → true · 73 saat → false · **eşik 100'e çekilince true'ya
  döndü** (72 sabit değil, ayarlardan) · V3 `published→hidden` → dizin 9 · `→suspended` → 9 ·
  `→published` → 10 (motor kararı yansıyor) · V4 legacy onay yolu görünür (10) · V5 skor 99 →
  ilk sırada · V6 `group_listing_is_new` anon'a açık, `group_setting_json/int` anon'a KAPALI ·
  rollback sonrası canlı dokunulmamış (10/0/0, eşik 72, log 0).
- **Kanıt:** sözleşme+birim **34 yeni test** (`group-index-view-schema` 15 · `whatsapp-landing-badges`
  9 · `LandingCard.badges` 10) + sayfa/G03b/G02 regresyonları yeşil (public-source çıpası
  `WhatsAppLandingPublicRow` cast'ine BİLİNÇLİ taşındı — iddialar aynı) · **mutasyon 6/6** (motor
  filtresi düşürme · eşiği sabitleme · link sızdırma · "Skor bekleniyor" geri koyma · sahiplik
  rozetini tersleme [M5 tekil koşuda 8 test düşürdüğü ÖLÇÜLDÜ — toplu koşu rapor yarışı] · ikinci
  kategori listesi) · tam takım **405 dosya / 3297 test yeşil** · `tsc` 0 · lint 0 (32 problem
  tümü `corteqs-ekstre-motoru/`) · `check:dead` 0/0/983 · `ingest:tools` 57 · `verify:text` ✓ 1903 ·
  types regen YOK (`WhatsAppLandingPublicRow` kesişim tipi — G12 borcu; regen gelince eritilir).
- 📌 **G20'ye devir:** "Bu grup sizin mi?" + claim UI girişi (G18 already_listed uyarısı oraya
  bağlanacak) · "Şikayet et" G14'e dek YOK · detail `getLanding` zaten view'dan okuyor (motor
  kolonlar detayda da mevcut). Frontend deploy kuyruğu: G18 form + G19 dizin birlikte canlanır.
- *(özgün kapsam)* "Admin onaylı!"/"Üye onaylı!" kalkar → "Sahibi doğruladı"/"Üye önerisi";
  "Skor bekleniyor" hiçbir yerde görünmez; filtreler kartlarla aynı listeyi kullanır; Türkçe
  arama `trIncludes`/`trCompare`; sayfalama. **Kabul:** **#3** ("Yeni" 72 saat sonra kalkıyor —
  DB tarafı canlı, UI tarafı bileşen testiyle kilitli).

**~~G20~~ — ✅ KAPANDI 02.10** · S3 Detay · kod (migration YOK — G13 backend hazırdı)

- **"Bu grup sizin mi?" UI'ı kuruldu** (`GroupOwnershipClaim` + `src/lib/group-claims.ts`,
  tasarım §3.B birebir): yalnız `ownership ≠ verified` gruplarda görünür · KOD yolu
  (`group_claim_start_code` → CQ+4 hane + talimat "Grup adının sonuna `· CQxxxx` ekle, sonra
  Kontrol et'e bas" → `group-claim-verify` edge, body YALNIZ `claim_id` — kural 8) · sonuçlar:
  verified (→ `onVerified` sayfa tazeler, rozet "Sahibi doğruladı" olur; mesaj tasarımın
  "Kodu artık silebilirsin" cümlesini TAŞIR) · not_found (kalan deneme yazılır) · exhausted →
  ekran görüntüsü formu OTOMATİK açılır · invalid_link/unknown "deneme sayılmadı" (kural 5) ·
  expired → yeni kod. EKRAN GÖRÜNTÜSÜ yolu: private kovaya `{uid}/screenshot-*` (RPC
  `split_part` + storage politikası deseni birebir) → moderatör kuyruğu · bekleyen talep sayfa
  açılışında geri yüklenir (RLS kendi satırı) · girişsiz tıklama OAuth'a düşer (`claim_group`
  intent'i, G02 kapı deseni — RPC'ye değil).
- ⚠️ **KARAR — "Şikayet et" ÇİZİLMEDİ:** `group_reports` canlıda YOK (G14 ⛔ G04/U06) —
  backend'i olmayan buton ölü düğümdür (dark pattern). G14 gelince bu bileşenin yanına
  eklenecek; yokluk sözleşme testiyle kilitli.
- Planın diğer kalemleri ÖLÇÜLDÜ: boş "Grup koşulları" GİZLİ (G03b'den beri — testle kilitlendi)
  · "Katıl" G03 RPC'sinden geçiyor (G03b — invite testleri aynen yeşil) · sahiplik yuvası
  `LandingDetailView`'a `ownershipClaim` prop'u olarak eklendi (veri/tazeleme sayfada, sunum
  bileşende).
- **Kabul (anonim ziyaretçide link hiçbir yerde yok — DOM düzeyinde):** signed_out detayının
  `container.innerHTML`'inde `chat.whatsapp.com|t.me/|discord.gg` izi YOK + http-href'ler
  platform dışı + "Giriş yap ve katıl" görünür · unavailable durumda da kaynak temiz + sebep
  yazılı · ready durumunda tek dış link RPC sonucu. **Canlı prob (geri alınan işlem, 5/5):**
  anon `group_claims` OKUYAMIYOR (`permission denied`) · view'da link 0 · authenticated
  `group_claim_start_code` → **CQ6991** + pending satır · RLS başka kullanıcıya 0 satır ·
  yabancı klasör yolu → `group_claim_path_forbidden`, kendi yolu → screenshot claim ·
  rollback sonrası `group_claims` 0 (canlıda artık yok).
- **Kanıt:** **28 yeni test** (`group-claims.test.ts` 6 — hata haritası G13 migration'ına karşı
  ÇİFT YÖNLÜ · verify body kilidi · §3.B mesaj dili · kova/pat deseni · `GroupOwnershipClaim.test.tsx`
  11 · `LandingDetailView.g20.test.tsx` 8 + G03b invite/sayfa/G02 regresyonları yeşil) ·
  **mutasyon 6/6** (verified guard · body'ye kod sızdırma · mesaj silme · boş koşullar ·
  Şikayet düğmesi · paylaşımlı klasör — ⚠️ M3/M5 ilk koşuda **konsol kodlaması** yüzünden
  uygulanmadı (Türkçe karakterler bozuldu), UTF-8 Node betiğiyle TEKİL koşuldu ve ikisi de
  YAKALANDI: kanıt mutasyon notunda) · tam takım **408 dosya / 3321 test yeşil** · `tsc` 0 ·
  lint 0 (32 problem tümü `corteqs-ekstre-motoru/`) · `check:dead` 0/0/**985** · `ingest:tools`
  57 + check 0 · `verify:text` ✓ 1908 · types regen YOK (`as never` deseni — G12 borcu).
- 📌 **Devir:** G14 şikayet butonunu bu bileşenin yanına ekleyecek · G21 sahip paneli
  `onVerified` sonrası görünür olan sahiplik alanlarını kullanır · deploy kuyruğu: G18+G19+G20
  birlikte canlanır.
- *(özgün kapsam)* boş "Grup koşulları" gizlenir; "Bu grup sizin mi?" + "Şikayet et"; "Katıl"
  G03 RPC'sinden geçer. **Kabul:** anonimde link sayfa kaynağı dahil hiçbir yerde görünmüyor
  ("Şikayet et" → G14'e ertelendi, gerekçesi yukarıda).

**~~G21~~ — ✅ KAPANDI 02.10** · S4 Sahip paneli · migration + kod

- Migration `20261002100000_group_owner_panel.sql` **canlıda** (`applied/` + kayıt, `check:migrations`
  **456/456** sapmasız): `group_owner_panel_state` (panelin TEK okuma kapısı — sahiplik kontrolü
  VERİDEN ÖNCE, sahip değilse/anonime `{"is_owner": false}` tek alan, **sızıntı yok**; skor
  kırılımı G17 `compute`'tan — ikinci formül UYDURULMADI; kuyruk yalnız `pending_group_admin`) +
  `group_owner_update_v1` (sahip düzenlemesi: motor form alanları + rules + tagline; UPDATE set
  listesi YALNIZ içerik — `group_score/ownership/listing_status/invite_code/link/platform`
  yazılamaz; `aile-cocuk` G18'le AYNI kilit; 160 · geo doğrulama; **legacy `description` etiket
  kuyruğu korunur** — `[Platform:]` regex ile ayrılır, canlı eski paket deploy'a dek okuyor).
  ⚠️ G18'in canlı dersi baştan uygulandı: ülke kodu **düz text değişkende** taşındı (atanmamış
  record alanı okuma hatası sınıfı kapatıldı).
- **Kaldırmada YENİ KAPI YOK** (tasarım §3.C): UI doğrudan G12 `set_group_status_v1(lid,'hidden',
  'owner_request')` çağırır — owner aktörü G12'de zaten yetkili, log otomatik, gerekçe SORULMAZ.
  Kuyruk kararları G16 `group_post_review`'dan (sahip `pending_group_admin`'de yetkili — yeni
  RPC uydurulmadı). Panel bileşeni `GroupOwnerPanel` detayda `ownershipClaim` yuvasında
  `GroupOwnershipClaim` ile birlikte (ownership durumuna göre birbirini dışlar).
- **Panel içeriği (tasarım §11):** skor + 6 kalem + eksik adım rehberi ("**Kurallarını ekle, +15**"
  tasarım ifadesi birebir; grace'te tek mesaj "7 gün") · "Sayfayı paylaş" (link kopyala) ·
  **"Onaylı Grup" rozet görseli** (politika §7: Instagram 1080x1080 SVG, grup adı KAÇIŞLI gömülür
  — XSS testi var, `has_approved_badge` yoksa buton çizilmez) · onay kuyruğu (48 saat devir notu
  §9'dan) · düzenleme formu (kısa açıklama 160 sayaçlı · rules · kategori yeni 7 · ülke/şehir
  autocomplete + Global · tagline · hero) · iki adımlı kaldırma onayı.
- **Kabul #9 canlı ölçüldü (geri alınan işlem — 9/9):** sahip `hidden(owner_request)` → **ANINDA**
  (listing hidden + suspended_until null + log `actor_kind=owner` + dizin 10→9) · sahip olmayan →
  `group_forbidden` · panel: sahip → veri, başkası → `{"is_owner": false}` TEK alan, anon →
  `permission denied` · düzenleme: desc/rules/kategori/tagline yazıldı + **etiket kuyruğu korundu**
  (`Yeni kisa aciklama [Platform: WhatsApp] [Badge member: false]`) · 161 → too_long · aile-cocuk →
  locked · eski `diger` → invalid_category · sahip-olmayan → `group_owner_forbidden` · kuyruk:
  na2 gönderi → `pending_group_admin` (+48h escalate) → sahip panelinde 2 → approve `published` /
  reject `rejected` (reviewed_by dolu). Rollback sonrası canlı **dokunulmamış** (unclaimed ·
  published · 0 log · 0 post · dizin 10).
- 🔴 **Mutasyon turu TEST AÇIĞI yakaladı:** M3 (aile-cocuk koşulunu `olmayan-xx`'e çevir) İLK
  turda YAKALANMADI — sözleşme testi yalnız `raise` metnini kilitliyordu, koşulu değil. Test
  güçlendirildi (`if p_category = 'aile-cocuk' then` kilidi eklendi), M3 tekil koşuda düşürüldü →
  **6/6**. Ders: kilit "hata var"ı değil "koşul + hata" ikilisini kapsamalı.
- **Kanıt:** **49 yeni test** (`group-owner-panel-schema` 14 · `group-owner-panel` 12 ·
  `GroupOwnerPanel.test` 12 + sayfa/detay regresyonları yeşil) · **mutasyon 6/6** (sahiplik
  kontrolü silme [sızıntı] · update'e group_score sızdırma · aile kilidi [güçlendirme sonrası] ·
  etiket kuyruğu silme · owner_request→reports · iki adım onayı atlama) · tam takım **411 dosya /
  3356 test yeşil** · `tsc` 0 · lint 0 (32 problem tümü `corteqs-ekstre-motoru/`) · `check:dead`
  0/0/**987** · `ingest:tools` 57 + check 0 · `verify:text` ✓ 1913 · types regen YOK (`as never` — G12 borcu).
- 📌 **Devir:** Faz E (S1-S4) TAMAM — deploy kuyruğu: G03b + G18 + G19 + G20 + G21 tek frontend
  deploy'la canlanacak. G23 bildirim metinleri hazır ("Skor kazanımı → rozet görseli" panel
  indirmesine bağlanır) · G24 moderatör paneli `group_moderation_log` + kuyrukları kullanır
  (şikayet kuyruğu G14'e dek boş) · G22 `health-score` cron'u panel skorlarını günlük tazeler
  (🔴 G17 tuzağı geçerli: cron'dan önce yeni kart deploy edilmiş olmalı).
- *(özgün kapsam)* düzenleme, onay kuyruğu, skor kalemleri ("Kurallarını ekle, +15"), rozet
  görseli, "Sayfayı paylaş", "Grubu listeden kaldır" — `whatsapp_landing_editors` + 5 RPC yerine
  MOTOR yolu kullanıldı (editors legacy'de kaldı; panel `ownership=verified` sahibe açık).
  **Kabul:** **#9** — kaldırma isteği grubu **anında** gizliyor (canlı ölçüldü).

### Faz F — otomasyon, bildirim, moderatör paneli, QA

**~~G22~~ — ✅ KAPANDI 02.10** · 6 zamanlanmış görev · migration + edge

- Migration `20261002110000_group_scheduled_tasks.sql` **canlıda** (`applied/` + kayıt,
  `check:migrations` **457/457** sapmasız) · **pg_cron'a 6 isimli iş** (M0 keşfi: pg_cron+pg_net
  hazırdı, 6 iş çalışıyordu → 12): `group_link_health` saatlik :23 (edge) · `group_queue_escalation`
  :17 (G16 fonksiyonu) · `group_health_score` 04:31 · `group_suspension_release` 04:37 ·
  `group_owner_renewal` 04:43 · `group_claim_expiry` */10. Tüm görev fonksiyonları YALNIZ
  service_role (canlı ölçüldü: authenticated `permission denied`).
- 🔴 **G17 TUZAĞI BAYRAKLA ÇÖZÜLDÜ:** `group_health_score_cron()` sarmalısı
  `groups.health_score_cron_enabled=false` iken **-1** döner (skor YAZILMAZ). Bayrak YALNIZ
  yeni kart (G19) deploy edildikten sonra **insan kararıyla** açılır (fast_lane doktrini).
  Canlı ölçüldü: kapalı → -1 · açık → 10/10 skor yazıldı (geri alınan işlemde).
- **Edge `group-link-health` DEPLOY** (`check:functions` **15/15**): cron `x-dispatch-secret`
  ile çağırır (dispatcher deseni, sabit-zamanlı karşılaştırma) · `verify_jwt=false` config'te
  + gerekçe yorumu (A99-R2 radar dersi) ve **ÖLÇÜLDÜ** (secretsiz POST → fonksiyonun kendi
  401'i, gateway'in değil) · parti + gecikme ayarlardan (`link_health_batch_limit=10` ⚠️,
  `link_health_request_delay_ms=5000` ⚠️ — "dakikada en fazla birkaç istek", Meta 200/W04) ·
  kural 8: log/yanıt yalnız sayılar, link YOK. ⚠️ **Secret yeniden kullanımı:** yeni vault
  secret'ı SQL'den YARATILAMIYOR (`_crypto_aead_det_noncegen` permission denied ÖLÇÜLDÜ) →
  cron header'ı vault `radar_news_cron_secret`'ı okuyor, aynı değer `supabase secrets set` ile
  edge env'e yazıldı (ekrana basılmadan). **Rotasyonda İKİ yer güncellenir.** Migration secret
  literalİ TAŞIMAZ (sözleşme testi 32+ karakterlik diziyi tarıyor).
- **Link sağlığı ÜÇ DEĞERLİ (kabul #8):** `group_link_health_due` (yayma: `mod(abs(hashtext(slug)),24)`
  saat yuvası · haftalık aralık · linki BOŞ 2 grup taranmaz [G11/U07 bekliyor] · **link_dead
  gizliler DAHİL** — geri açma yolu) + `group_link_health_record`: ok → sayaç 0 + `hidden(link_dead)`
  ise published · invalid → sayaç++ ve `link_fail_threshold=2` eşikte hidden(link_dead) ·
  **unknown → sayaca DOKUNMAZ** (G08 kural 5), yalnız `link_checked_at` tazelenir. Geçişler
  `set_group_status_v1` tek kapısından (log otomatik, actor `system`). 🔴 **Canlı test İKİ gerçek
  kusur yakaladı:** (1) security-definer zincirinde `auth.role()` JWT claim'i TAŞINMIYOR →
  record/suspension `group_forbidden` ile düşüyordu — geçici service claim'i + **geri yükleme**
  ile çözüldü (yamandı, yeniden ölçüldü); (2) T2 ilk iddialarım satır değil slot sayıyordu (test
  düzeltildi). **GERÇEK TUR KOŞTU:** slot-21 grubu kontrol edildi → `unknown` (sayaç 0 kaldı,
  checked_at tazelenmiş — canlı ayak izi doğrulandı).
- **Diğer görevler:** suspension-release (süresi dolan askı → published) · owner-renewal
  (çıpa: `claim.reviewed_at > published_at > now()` + 365 gün — ayarlardan; due+30 gün yanıtsız →
  `ownership=unclaimed` via_rpc; **`group_owner_renew_v1`** sahip RPC'si + panelde "Yenileme
  onayını ver" düğmesi; bildirim G23) · claim-expiry (pending code, süresi dolmuş → expired —
  "grup başına tek aktif kod" indeksi boşa işgal edilmez). 7 yeni ayar anahtarı (kaynaklılar:
  threshold 2 · interval 7d · renewal 365/30 · ⚠️ ajan ihtiyatları: batch 10 · delay 5000ms ·
  **bayrak false**).
- **Kabul #8 canlı ölçüldü (geri alınan işlem — 8/8):** invalid#1 → sayaç 1 published ·
  invalid#2 → **hidden(link_dead)** + log actor `system` · unknown → sayaç 2 KALDI + checked_at
  tazelendi · ok → **published'a geri açıldı** + sayaç 0 · due: yuva/slot/boş-link eleme ·
  health bayrak -1→10 · suspension 1 bırakıldı · renewal çıpa+düşürme+renew RPC · claim-expiry 1 ·
  grant matrisi authenticated'a kapalı · rollback sonrası canlı dokunulmamış (skor 0, log 0,
  bayrak false, published).
- **Kanıt:** sözleşme **21/21** (`group-scheduled-tasks-schema`) · **mutasyon 6/6** (unknown
  sayacı artırma · bayrak default true · yaymayı kaldırma · edge gecikmesini silme · cron programı
  kaydırma · renew sahip kontrolünü kaldırma) · tam takım **412 dosya / 3377 test yeşil** · `tsc` 0 ·
  lint 0 (30 problem tümü `corteqs-ekstre-motoru/`) · `check:dead` 0/0/987 · `ingest:tools` **58**
  (15 edge) + check 0 · `verify:text` ✓ 1915 · types regen YOK (`as never` — G12 borcu).
- 📌 **G23/G24'e devir:** yenileme hatırlatması + "link çalışmıyor" + "skor kazanımı" bildirimleri
  G23'te (outbox CHECK 7 değere kilitli — migration ister) · moderatör `link_dead` kuyruğu G24'te ·
  **health_score_cron_enabled bayrağı deploy sonrası insan kararıyla açılacak** (pano §K'da
  bekleyenler listesine eklendi).
- *(özgün kapsam)* 6 görev + üç değerli link kontrolü + unknown sayacı artırmaz. **Kabul:** **#8**
  — 2 başarısız gizler, 1 başarılı geri açar, `unknown` etkisiz (canlı ölçüldü).

**~~G23~~ — ✅ KAPANDI 02.10** · 8 bildirim metni · migration + edge

- Migration `20261002120000_group_notifications.sql` **canlıda** (`applied/` + kayıt,
  `check:migrations` **458/458**): outbox `event_type` CHECK'i **9→17** değere GENİŞLETİLDİ
  (KR09 dersi: TS birliği tek başına genişlerse satırlar 23514'le SESSİZCE kaybolur) · 8 genel
  anahtar `notification_settings`'te · `enqueue_group_notification` TEK kapı (alıcı maili
  `auth.users`'tan — **maili yoksa satır YAZILMAZ**, dedupe idempotent, yeni satırda dispatcher
  poke, `corteqs.skip_group_notify` bayrağı = G11/G10c toplu işlem güvencesi) · **5 trigger**
  (landing INSERT · moderation_log INSERT · claims UPDATE→verified · posts INSERT
  pending_group_admin · landings UPDATE badge false→true) — **fonksiyon redefine YOK** (kapalı
  batch fonksiyonları dokunulmadı).
- Çift/üçlü bildirim kilidi: hızlı şerit INSERT'te doğrudan `group_published` ("alındı" atlanır);
  `from_status IS NULL` log satırları (fast_lane) ATLANIR. `group_post_pending` **günde grup
  başına TEK mail** (gün damgalı dedupe, {n} güncel). hidden(link_dead)/suspended→published geri
  açılışları da `group_published` üretir (tek yayın metni — karar). Sahipsiz grupta alıcı
  `submitted_by`'a düşer (sessiz kayıp yok).
- **Edge `send-notification-emails` YENİDEN DEPLOY** (`check:functions` 15/15): `_shared/emails/
  group-notifications.ts` — 8 şablon, metinler tasarım §9 tablosuna karşı **testle birebir
  kilitli** · alıcı `payload.email` (transactional — admin aboneliğine bakmaz, member_welcome
  deseni) · 8 anahtar `SETTING_KEY_BY_EVENT`'te. 🔴 **Kural 8:** maile davet linki GİRMEZ —
  {link} alanları site sayfası (`/addcom?group={slug}`), rozet görseli panelden.
- **Kabul canlı ölçüldü (iki ayak):** (A) **geri alınan işlem — 8/8 olay tipi üretildi:**
  submit→received · hızlı şerit→published (received 0 — çift yok) · moderatör published/rejected
  (sebep notu taşındı: "Kusur sebebi G23") · link_dead→hidden maili · strike_2 log→"2. ihlal —
  30 gün askı" · claim verified→sahibe · 2 gönderi→**TEK** post_pending (n=1) · badge→score 85 ·
  skip bayrağı→0 satır · **kural 8 taraması: 0 sızıntı** (payload'larda link/invite/davet kodu yok)
  · rollback temiz (0 grup satırı, 5 admin_update özeti dokunulmamış). (B) **GERÇEK drenaj:**
  8 test satırı (admin adresi) → edge → **`processed:8, sent:8, failed:0`**, hepsi `status=sent` +
  `sent_at` dolu + `recipient_count=1` → satırlar silindi (KR09 ölçüm deseni). ⚠️ ilk deneme
  satır içi SQL'de Türkçe karakter konsol kodlamasında bozuldu (0x97) — SQL dosyadan verildi
  (PowerShell dersi: Türkçe metin `-c` ile DEĞİL `-f` ile).
- **Kanıt:** **43 yeni test** (şablon 15 — §9 metinleri dosyadan ayrıştırılıp birebir karşılaştırıldı,
  XSS kaçışı, bilinmeyen tip nötr · sözleşme 15 — CHECK 17 değer, 5 trigger+WHEN, dedupe/skip/kural 8,
  edge dörtlü kablolama · şema regresyonları yeşil) · **mutasyon 6/6** (CHECK'ten eski tip düşürme ·
  fast_lane atlama kaldırma · gün-dedupe kaldırma · payload'a link sızdırma [M4 ilk koşuda desen
  uyuşmadığı için uygulanamadı — tekil koşuda YAKALANDI] · edge anahtarı düşürme · "24 saat"→"48 saat"
  metin kaydırma) · tam takım **414 dosya / 3405 test** · `tsc` 0 · lint 0 (30 problem tümü
  `corteqs-ekstre-motoru/`) · `check:dead` 0/0/987 · `ingest:tools` 58 · `verify:text` ✓ 1918.
- 📌 **Devir:** G24 moderatör paneli "bildirim gönderildi" izlerini outbox'tan gösterebilir ·
  yıllık yenileme HATIRLATMA maili (`owner_renewal_due` yaklaşınca) bu batch'te YOK — G22
  yenileme döngüsü çalışıyor, hatırlatma istenirse yeni event_type + trigger (küçük iş).
- *(özgün kapsam)* tasarım §9'un 8 metni. **Kabul:** her bildirim için outbox satırı + drenaj
  sonrası `sent_at` dolu (8/8 ölçüldü).

**~~G24~~ — ✅ KAPANDI 02.10** · M5 Moderatör paneli · migration + kod

- Migration `20261002130000_group_moderator_panel.sql` **canlıda** (`applied/` + kayıt,
  `check:migrations` **459/459** sapmasız): `admin_set_group_setting` (is_admin + **beyaz liste
  TEK anahtar** `groups.fast_lane_enabled` + boolean tip kontrolü + `updated_by` izi —
  `set_notification_setting` deseni) · `group_moderator_summary` (4 kuyruk sayacı ·
  moderated_count/threshold · hızlı şerit bayrağı · **cron.job_run_details**'tan `group_%`
  işlerinin son koşuları — cron şeması grant'sız kaldı, security definer şarttı).
  **Karar kapısı UYDURULMADI:** panel mevcut tek kapıları çağırır (G12 status · G13 claim review ·
  G16 post review · G15 strike).
- **`/admin/gruplar` sayfası** (KR08 kablolama üçlüsü: rota + `ADMIN_ROUTE_PATTERNS` +
  `communities` nav — menü kataloğu **89→90**, korpus **90/90 gömülü, bekleyen 0**): dört kuyruk
  tek ekran (tabs) · **kısayollar A/R/J/K** (input odaklıyken devre dışı) · üst şerit (sayaçlar ·
  x/100 + eşik dolunca "hızlı şeridi aç" önerisi [§2: karar insanın] · Switch → ayar RPC'si ·
  görev koşuları + "succeeded ETKİ kanıtı değil" notu [Radar dersi]) · red akışı **hazır sebep
  listesi + not** → bildirim mailine "Sebep:" düşer (G23) · uyarı akışı G15 merdiveni (kırmızı
  çizgi 1-7 opsiyonel) · sahiplik kanıtı **createSignedUrl 5 dk** (getPublicUrl YASAK — KR08) ·
  çekişmeli talep rozeti (`is_contested`) · **yükleme hatası GÖRÜNÜR** (KR08: sessiz boş liste yok).
- ⚠️ **Şikayet sekmesi BİLİNÇLİ BOŞ:** `group_reports` YOK (G14 ⛔ G04/U06) — summary
  `pending_reports: 0` sabit döner (fonksiyon tabloya BAKAMAZ, sözleşme kilitler), sekme G14'ü
  açıklar. Red sebepleri listesi AJAN İHTİYATI (tasarım "hazır sebep listesi" der ama saymaz —
  başlıklar politika §4/§10 dilinden; tek kaynak `REJECT_REASON_PRESETS`).
- **Kabul canlı ölçüldü (geri alınan işlem — 4/4):** admin özeti doğru sayaçlar + **6 görev
  koşusu** (bonus kanıt: G22 cron'u gerçekten koşuyor — `group_claim_expiry` 22:30 `succeeded`) ·
  üye → `group_moderator_forbidden`, anon → `permission denied` · anahtarı admin yazdı
  (`updated_by` dolu), üye → `forbidden(42501)`, beyaz liste dışı → `unknown_setting_key`,
  boolean-dışı → `setting_value_must_be_boolean` · gerçek gönderi → `pending_platform` → sayaç
  0→1 · rollback temiz (fastlane false, post 0).
- **Kanıt:** **33 yeni test** (şema 9 — kapı/beyaz liste/cron/uydurma-şema-yok · api 8 — hata
  haritası BEŞ migration'a karşı çift yönlü + tek kapı çağrıları + signed URL · sayfa 16 — KR08
  üçlüsü + kuyruklar + kısayollar + anahtar + görünür hata) · **mutasyon 6/6** (admin kapısı ·
  beyaz listeye ikinci anahtar · security definer [M3 ilk koşuda DOSYA-GENELİ iddia yüzünden
  yakalanmadı → fonksiyon-kapsamına güçlendirildi, G21 dersi ikinci kez doğrulandı] ·
  pending_reports düşürme · red reason kaydırma · A kısayolu) · tam takım **417 dosya / 3437 test
  yeşil** · `tsc` 0 · lint 0 (30 problem tümü `corteqs-ekstre-motoru/`) · `check:dead` 0/0/**989** ·
  `ingest:tools` 58 + check 0 · `verify:text` ✓ 1923 · types regen YOK (`as never`).
- 📌 **Devir:** şikayet sekmesi G14'te dolacak (tablo + `pending_reports` gerçek sayaç — bu
  migration'ın summary fonksiyonu G14'te redefine edilecek, sözleşme testi bilinçli güncellenecek) ·
  eski `WhatsAppLandingsModeration` ekranı (`/admin/whatsapp-landings`) legacy dilde DURUYOR —
  iki panel deploy sonrası G25/G10c turunda tek dile iner.
- *(özgün kapsam)* tek ekran 4 kuyruk · A/R/J/K · üst şerit sayaç + x/100 + hızlı şerit anahtarı +
  görev son koşuları · nav satırı `communities.ts`'e. **Kabul:** 4 kuyruk canlı veriyle doluyor
  (3'ü dolu ölçüldü, şikayet G14'e dek 0); anahtar `group_settings`'i yazıyor (canlı ölçüldü).

**~~G25~~ — ✅ KAPANDI 02.10** · QA: 13 kabul testi · test + düzeltme migration'ı

- **`supabase/qa/group-motor-acceptance.sql`** — 13 kabulün 12'si TEK kendini-doğrulayan betikte
  (`assert` bazlı; exit≠0 = kabul düştü; tümü geri alınan işlemde, #5 işlem DIŞINDA gerçek anon
  rolüyle). Rapor: **`docs/dijital-gruplar/2026-10-02-g25-kabul-raporu.md`** (13/13 tablo +
  kanıt değerleri + mutasyon sonuçları). Ölçüldü: **exit 0 · 12 senaryo yeşil + #6 tripwire**.
- ⛔ **#6 TRIPWIRE:** `assert to_regclass('public.group_reports') IS NULL` — G14 tabloyu yarattığı
  an QA KIZARIR ve #6 senaryosunu (3 onaylı şikayet/30 gün → hidden · 2 → strike) yazmaya ZORLAR.
  Şema uydurulmadı; mutasyon sınavı da G14'le yapılacak.
- 🔴 **QA GERÇEK KUSUR YAKALADI (batch'te onarıldı):** #13 ilk koşuda kırmızı —
  `group_strike_warning` outbox'a hiç düşmüyordu. Kök neden: G23 kancası `group_moderation_log`
  satırlarındaydı; G15'in İLK basamağı (warning) geçiş yapmadığı için log satırı YAZILMIYOR
  (G12 no-op log yazmaz) → uyarı maili asla gitmezdi. Düzeltme mig
  **`20261002140000_group_strike_notification.sql`** (canlıda, `check:migrations` **460/460**):
  uyarının TEK kancası `group_strikes AFTER INSERT` (her ihlal=1 satır=1 mail; `outcome` →
  `{sebep}` alanına: "— grup 30 gün askıya alındı" / "— listeden kaldırıldı"; kırmızı çizgi
  öneki) · log trigger'ının strike dalı KALDIRILDI (strike_2/3 ÇİFT mail riski de kapandı) ·
  published/rejected/link_dead dalları birebir korundu. Düzeltme sonrası #13 yeşil.
- **Mutasyon sınavı 6/6 (tasarım §13: #5/#6 mutasyonla sınanır):** D1 `unknown` sayaç artırır →
  **#8 KIRMIZI** (canlı fonksiyon bozuldu, betik yakaladı, geri yüklendi) · D2 aile-cocuk kilidi
  açık → **#10 KIRMIZI** · D3 view link sızdırır → **#5 KIRMIZI** ("10 satır" — restore sonrası
  canlı 0 ölçüldü) · M1 strikes trigger sil → sözleşme kırmızı · M2 strike dalı log'a geri →
  kırmızı (çift mail kilidi) · M3 outcome işlemesi sil → kırmızı.
- **Kabul:** 13/13 (12 ölçüldü + #6 tripwire) · `npm run test` **417 dosya / 3440 test** ·
  `tsc` 0 · lint 0 (30 problem tümü `corteqs-ekstre-motoru/`) · `verify:text` ✓ 1924 ·
  `check:dead` 0/0 · `ingest:tools:check` 0. Sözleşme kilidi: fix migration
  `group-notifications-schema.test.ts`'te (31 test).
- 📌 QA betiği şema değiştikçe güncellenir (G11/G14/G06) — tripwire'lar bunu zorlar.
- *(özgün kapsam)* tasarım §13'ün tamamı otomatik + #6 için yazılı canlı ölçüm (rapor).
  ⚠️ #5 ve #6 mutasyonla sınanır — sınandı (yukarıda). **Kabul:** 13/13 + tam takım yeşil.

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

**~~KR01~~ — ✅ KAPANDI 01.10** · `src/lib/careers/` modülü + sözleşme testi

- `careers-types.ts` · `careers-data.ts` (**17 ilan + staj programı**) · `careers-data.test.ts` (6 test).
- Veri kaynak HTML'den **makineyle** çıkarıldı (25 KB Türkçe metin elle kopyalanmaz).
- ⚠️ **`check:dead` iki dosyayı erişilemez sayar** — ölü değiller, **tüketicilerinden
  öndeler** (sayfa KR04'te). Denetleyicinin kendi baseline'ına yazıldı.
  🔴 **KR04 o iki satırı `scripts/check-dead-code.mjs`'ten SİLMELİDİR**; silinmezse
  bayat baseline kaydı olarak rapor edilir ve `check:dead` yine kırmızıya döner.
- *(özgün kapsam)* küçük, UI ve migration yok

- Yeni: `careers-types.ts` · `careers-data.ts` · `careers-data.test.ts`.
- Kaynak HTML'in 405–406. satırlarındaki `JOBS` (17 kayıt) ve `INTERN` JSON'u TS'e taşınır.
  Alanlar: `id · area · tr · en · badges[] · intro · tasks[] · profile[] · plus · report · model`.
  `AREAS` (ops/biz/mkt/prd/tech) ayrı sabit.
- `careers-data.ts` başına **kadro modülünden neden ayrı olduğu** yorum olarak yazılır
  (sonraki oturum "kopya veri" sanıp birleştirmesin — gerekçe kaynak planda).
- **Kabul:** 17 ilan, `id`'ler benzersiz, `tasks`/`profile` boş değil, `area` geçerli;
  `tsc` + test yeşil. Sayfa henüz değişmedi.

### Faz 1 — altyapı

**~~KR02~~ — ✅ KAPANDI 01.10** · Migration: tablo + kova + `submit_career_application` RPC

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

**~~KR03~~ — ✅ KAPANDI 01.10** · `careers-api.ts` + `careers-schemas.ts` + hata haritası

- Zod şema → `z.infer`. `uploadCareerFiles(applicationId, files)`: `safeStorageFileName` +
  `validateFile` (CV pdf/doc/docx 10 MB · sunum pdf/ppt/pptx/key 25 MB), anahtar `{id}/cv-…`.
- `submitCareerApplication(input)` → RPC. Hata kodu ↔ Türkçe mesaj haritası + **çift yönlü**
  sözleşme testi (desen: `service-finder-format.test.ts`).
- **Kabul:** testler yeşil; bileşen katmanında doğrudan `supabase.from(...)` yok.

### Faz 2 — public sayfa

**~~KR04~~ — ✅ KAPANDI 02.10** · Sayfa iskeleti: hero · kurucu mektupları · saat bandı · katılım modelleri

- `src/pages/Career.tsx` yeniden yazılır; `src/components/career/` altına `CareerHero` ·
  `CareerClockBand` · `FounderLetters` · `ParticipationModels`.
- Kurucu fotoğrafları base64'ten çıkarılıp `public/career/` altına **gerçek dosya** olarak
  yazılır (HTML satır 257 ve 263). Base64'ü koda gömme.
- Saat bandı: 8 şehir, `Intl.DateTimeFormat("tr-TR", { timeZone })`, 15 sn;
  `prefers-reduced-motion` desteklenir.
- `useSeo(PAGE_SEO.career, [])` — opts sabit olduğu için **açık `[]`**
  (`use-seo-deps-contract.test.ts` zorunlu kılar). `PAGE_SEO.career.description` güncellenir.
- **Kabul:** sayfa mevcut tema/tipografiyle açılıyor; `tsc`/`lint`/`test` yeşil.

**~~KR05~~ — ✅ KAPANDI 02.10** · İlan listesi + alan filtresi + staj bloğu

- `CareerPositionList` · `CareerPositionCard` · `CareerInternProgram`.
  Alan çipleri (Tümü + 5 alan) + shadcn `Accordion`.
- Arama eklenirse `trIncludes` — çıplak `toLowerCase()` DEĞİL (Türkçe i/İ kuralı).
- "Bu pozisyona başvur" → form seçimini doldurur + forma kaydırır.
- **Kabul:** 17 ilan + staj görünüyor, filtre çalışıyor, derin bağlantı (`#ilan-<id>`) açılıyor.

**~~KR06~~ — ✅ KAPANDI 02.10** · Başvuru formu (3 dosya) · canlı kanıt alındı

- `CareerApplicationForm` + `CareerFileDrop`; `react-hook-form` + `zodResolver`,
  sürükle-bırak + tıkla. KVKK onayı zorunlu (`/legal/kvkk`, `/legal/privacy` — ikisi de mevcut).
- **Kabul (elle, canlıda):** uçtan uca bir başvuru oluşturulur → `career_applications`'ta
  satır + kovada dosyalar; anon `select` **0 satır/yetki hatası**; aynı e-postayla art arda
  gönderim hız sınırına takılıyor. Dört ölçümün sonucu kanıt satırında.

### Faz 3 — geçiş

**~~KR07~~ — ✅ KAPANDI 02.10** · Eski 4 ilanın korunması

- `global-local-contributor` · `content-creator` · `global-content-lead` ·
  `technical-core-team` **silinmez**; yeni 17'nin altında ayrı bölümde, her birinde
  "önceki dönem ilanı" ibaresiyle durur. Başvuru düğmeleri yeni forma bağlanır.
- Kaldırma koşulu bu master'a bir satır olarak yazılır (karar sonraya bırakıldı).
- **Kabul:** eski dört ilan sayfada ibareli görünüyor; başvuruları yeni tabloya düşüyor.

### Faz 4 — yönetim

**~~KR08~~ — ✅ KAPANDI 02.10** · Admin ekranı: `/admin/kadro/basvurular`

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

**~~KR09~~ — ✅ KAPANDI 02.10** · Yeni başvuruda e-posta bildirimi

- Mevcut bildirim altyapısı üzerinden kurucu ekibe uyarı.
- ⚠️ Edge function değiştiyse **elle deploy**: `supabase functions deploy <ad> --project-ref
  injprdrsklkxgnaiixzh` — **Coolify edge function deploy ETMEZ.**
- **Kabul:** gerçek bir test başvurusu sonrası mail kutusunda kanıt (gönderim kaydı + ekran görüntüsü değil, log satırı).

### Faz 5 — kapanış

**~~KR10~~ — ✅ KAPANDI 02.10** · SEO, sitemap, araç kataloğu, doküman

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

### ✅ A15 · Cadde logosu — **KAPANDI 03.10**

> **Yerleşim kararı (kullanıcı, 03.10): kapsam şeridinin SOL ucu.** `CaddeBrandMark`
> (24px) `CaddeFeedScopeBar`'ın mevcut çip satırının İÇİNDE durur; satır yüksekliği
> DEĞİŞMEZ (çip py-1.5 ≈ 30px). Y1 (m151) kimlik ŞERİDİNİ ve 05.08.2026'nın üç
> revizyonlu "akışın üstünde tam genişlik blok YOK" kararını bozmaz.
> `brandSlot` **isteğe bağlı** (`notificationsSlot` deseni) → /cadde/cafe ve
> /cadde/carsi'nin DOM'u birebir aynı kaldı.
>
> 🔴 **Kaynak dosyada ALFA KANALI YOKTU** (PNG color type 2, 2000×2000, 3.095 KB,
> zemini beyaz + basılı dama deseni). Olduğu gibi konsaydı **koyu modda beyaz bir
> kutu** olarak görünürdü ve bunu ne tsc, ne lint, ne de mevcut testler yakalardı.
> Üretilen varlık: `public/cadde-logo.png` — kenarlardan taşma dolgusuyla zemin
> gerçekten saydamlaştırıldı (%73,9 piksel), içerik kutusuna kırpıldı, 512×512,
> **220 KB**. Sözleşme testi PNG başlığını okuyup color type'ı 4/6'ya kilitler —
> biri opak bir sürümle değiştirirse test düşer.
>
> **Marka rengi kararı (kullanıcı, 03.10): ikisi de kalsın.** Logo çok renkli,
> arayüz kimliği bronz `#aa8c42` olarak DURUYOR; `cadde-brand-token.test.ts`
> değiştirilmedi.
>
> **Erişilebilirlik:** işaret DEKORATİF (`alt=""` + `aria-hidden`). Sayfanın tek
> h1'i zaten "Diaspora Cadde" diyor (Y1'de eklenen sr-only); metin verilseydi
> ekran okuyucu aynı adı iki kez okurdu.
>
> **Kanıt:** 9 sözleşme testi · **mutasyon 6/6** — ⚠️ M2 (işareti çip satırının
> DIŞINA, şeridin köküne taşı) **ilk turda GEÇTİ**: `querySelectorAll("button")`
> torunları da sayıyordu. `:scope > button` koşuluna çevrildi. "Metin kilidi değil
> koşul kilidi" dersi bu batch'te de doğrulandı. Diğer beşi ilk turda düştü
> (varsayılan prop · aria-hidden · h-6→h-12 · FeedView prop'u · opak PNG).
> Tam takım **435 dosya / 3589 test** yeşil · `tsc` 0 · lint 32 (tümü
> `corteqs-ekstre-motoru/`) · `check:dead` 0/0 · 1001 erişilebilir ·
> `verify:text` ✓ 1955.
>
> ⚠️ **Kökteki `caddelogo.png` (Burak'ın 3 MB'lık özgün dosyası) DURUYOR** —
> takipsiz, commit'e girmedi. CLAUDE.md kökte yalnız `CLAUDE.md` + `README.md`
> ister; kullanıcı kararı bekliyor (arşive mi, silinsin mi).

### ✅ U05 · Cadde logosu — DOSYA GELDİ 03.10 → A15 olarak kapandı

> ✅ Burak `caddelogo.png` dosyasını verdi (03.10). U maddesi KAPANDI; kalan iş ajanda.
> 🔴 **Dosya bugün DEPO KÖKÜNDE** (`./caddelogo.png`) — CLAUDE.md kuralı kökte yalnız
>   `CLAUDE.md` + `README.md` + yapı dosyası ister. İlk adım `public/` altına taşımak.
> 🔴 **Önce m151 kararını oku** — kimlik şeridi 09.09'da BİLEREK kaldırılmıştı; geri
>   eklemek o kararı ters çevirmek demek, gerekçesi commit mesajına yazılır.

- *(özgün not)* Dosya Burak'tan bekleniyor (T21). `CaddePage.tsx` başlığındaki kimlik şeridi 09.09'da
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

### Command Center arşiv dalgası — ✅ **KARAR: (C) 03.10**

> ✅ **Kullanıcı 03.10'da (C)'yi seçti** — ~1653 → **~150-200** kayıt. Bu artık bir
> karar maddesi değil, **ajan işidir**; batch'e bölünüp sıraya alınacak.
> 🔴 **İlk adım kod değil:** `docs/commandcenter/` gitignore'da ve 313 `[Denetim 28.09]`
> notu YALNIZ orada. Export yeniden üretilirse notlar SİLİNİR → önce notları
> repo-dışı bir yere kopyala, sonra arşivle.

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
| ~~K01~~ | ⏸️ **PARK EDİLDİ 03.10 (Burak)** → X bölümü | UBT + Burak | "Bunu parket, anlamadım." Soru yeniden ANLATILARAK sorulacak; şimdilik karar beklenmiyor. Çelişki kaydı: `CaddePage.tsx` yorumu (05.08) sağ kolon, T18 (27.08) akışın üstü |
| K02 | SMS sağlayıcısı | UBT | Bütçe 20–25 € KESİNLEŞTİ (T21); `sms_provider=twilio` tanımlı ama kapalı; uygulama (M95) başlamadı. **Uygulama tarafı artık G04–G05'te.** ⚠️ 30.09 ölçümü: `sms_provider=twilio` iddiası **yalnız bu dosyada** geçiyor — `supabase/config.toml`'da `[auth]` bölümü YOK ve `auth.users`'da **0 telefon / 0 onaylı**. Panelden teyit et (bkz. U06) |
| ~~K03~~ | ✅ **CEVAPLANDI 03.10: HAYIR** — özel alan adı alınmayacak | UBT + Burak | Pro plan + 10 $/ay eklenti. **Ön koşul karşılandı: Pro aktif (U02 kapandı)** — karar verilebilir. ⚠️ **03.10 ölçümü: özel alan adı YOK** — canlı `env-config.js` `injprdrsklkxgnaiixzh.supabase.co` veriyor, `auth/supabase/api/db.corteqs.net` 4/4 çözülmüyor. "Zaten var" sanma |
| ~~K04~~ | ⏸️ **PARK EDİLDİ 03.10 (Burak)** → X bölümü | Burak | "Bunu parket, anlamadım." ⚠️ Park, kusurun yok olduğu anlamına GELMEZ: ölçüldü (#1731) kullanıcının "kendi kodu" diye bir şey YOK, profildeki alan ters yönde çalışıyor — canlıda duruyor |
| ~~K05~~ | ⏸️ **PARK EDİLDİ 03.10 (Burak): "sonra yapacağız"** → X bölümü | Burak | Ödeme kodu SIFIR (yalnız `MockStripeCheckout`); abonelik 01.01.2027 · Kurucu 1000: 99 €. ⚠️ Takvim sabit, iş sıfır — 2027 yaklaşırken bu park kalkmalı |
| ~~K06~~ | ✅ **CEVAPLANDI 03.10: KALSIN** | UBT | `docs-admin` korpusu (4.214 iç doküman / 30 MB) silinmez; Pro ile bellek baskısı yok. Yeniden açma |
| K07 | 25 Eylül transkriptinin son 25 dk'sı | UBT | yalnız ilk ~55/80 dk işlendi |
| K08 | 5 grup karar mesajı | UBT → Burak | grup ekleme politikası · onay akışı · form alanları · şehir grupları · ekleme çağrısı. ✅ **CEVAPLANDI** — Dijital Gruplar politikası v1.1 (27.09) beşini de kapsıyor; kod karşılığı **G bölümü**. Kalan tek şey: G11 eşleme CSV'sindeki 4 veri kararı (U07) |

---

## P — Onay bekleyenler

- **P02–P07:** `.kilo/plans/1790537630793-tidy-cactus.md` (clean-code planının canlı
  DB/deploy/ürün kararı gerektiren maddeleri). **P01 uygulandı** (28.09 — bkz. Kapananlar).

---

## X — Büyük / ertelenen (batch'e bölmeden önce ayrı plan ister)

### ⏸️ 03.10'da Burak'ın PARK ETTİKLERİ — **listenin EN SONU**

> Bu üçü karar beklemiyor; sıraya girmeden önce **yeniden anlatılması** gerekiyor.
> Ajan bunları kendiliğinden açmaz, kullanıcı söyleyene kadar dokunmaz.

| Park | Burak'ın sözü | Ne gerekiyor |
|---|---|---|
| **K01** · Cadde ana sayfa sıralaması | "anlamadım" | Soru teknik yazılmış. Yeniden sorulurken iki seçeneğin EKRAN GÖRÜNTÜSÜ gösterilmeli |
| **K04** · Cadde davet kodu | "anlamadım" | Bu aslında bir soru değil, bir KUSUR raporu: profildeki alan ters yönde çalışıyor (#1731). Önce kusur sade dille anlatılmalı, sonra "düzeltelim mi / kaldıralım mı" sorulmalı |
| **K05** · Checkout / Stripe | "sonra yapacağız" | Takvim sabit (abonelik 01.01.2027, Kurucu 1000 = 99 €), kod SIFIR. Park kalkmazsa tarih kaçar |

### ⏸️ İçerik işleri — **"bunlara motor yazacağız" (Burak, 03.10)** · EN SONA

> Burak'ın kararı: bu içerikler elle yazılmayacak, **üreten bir motor** kurulacak.
> Yani bunlar artık "içerik bekleyen" madde değil, **ayrı bir ürün planı** konusu.
> ⚠️ Ölçülmüş gerçek: `/relocation`'daki **120 servisin 120'si demo** ve sayfa demo
> rozetli; Rehberler'de en yeni yazı **13 Haziran**. Motor yazılana dek bu iki yüzey
> kullanıcıya boş/bayat görünmeye devam eder — park bilinçlidir, unutulmuş değil.

- RAG ülke/şehir/konu içeriği · Rehberler içeriği · taşınma planlayıcısının RAG'e bağlanması

### Diğer ertelenenler

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
| G25 · QA: 13 kabul testi | **`supabase/qa/group-motor-acceptance.sql` exit 0 — 13/13** (12 senaryo assert'li canlı ölçüm geri alınan işlemde + #5 gerçek anon rolüyle işlem dışında + **#6 TRIPWIRE**: group_reports ortaya çıkınca QA kızarır, G14 senaryoyu yazmak zorunda) · rapor `docs/dijital-gruplar/2026-10-02-g25-kabul-raporu.md` · 🔴 **QA gerçek kusur yakaladı:** uyarı maili log kancasına bağlıydı ama warning geçiş üretmiyor → log satırı yok → mail HİÇ gitmiyordu; düzeltme mig `20261002140000` canlıda (**460/460**): tek kanca `group_strikes AFTER INSERT` (outcome {sebep}'e işlenir) + log trigger'ının strike dalı kaldırıldı (çift mail riski kapandı) · **mutasyon 6/6:** D1 unknown-sayaç / D2 aile kilidi / D3 view sızıntısı — üçü de CANLI fonksiyonda bozuldu, QA kızardı, geri yüklendi (restore sonrası canlı yeniden ölçüldü) + M1-M3 sözleşme · tam takım **417 dosya/3440 test** · `tsc` 0 · `verify:text` ✓1924 · 📌 G serisinde BLOKESİZ batch kalmadı (G04-G07 ⛔ K09/U06 · G11 ⛔ U07 · G14 ⛔ G04 · G10c/G03c ⛔ deploy) |
| G24 · M5 moderatör paneli (`/admin/gruplar`) | mig `20261002130000` canlıda + kayıt (**459/459**) · `admin_set_group_setting` (is_admin + **beyaz liste TEK anahtar** fast_lane_enabled + boolean tip + updated_by izi) · `group_moderator_summary` (4 sayaç + moderated x/threshold + cron.job_run_details'tan `group_%` son koşuları — cron şeması grant'sız) · karar kapısı UYDURULMADI (G12/G13/G15/G16 tek kapıları) · sayfa: KR08 üçlüsü (rota+meta+nav, menü **89→90**, korpus **90/90**) + A/R/J/K kısayolları (input'ta devre dışı) + red= hazır sebep+not→G23 mailine "Sebep:" + uyarı=G15 merdiveni (kırmızı çizgi 1-7) + kanıt signed URL 5dk + çekişmeli rozeti + GÖRÜNÜR yükleme hatası · ⚠️ şikayet sekmesi BİLİNÇLİ boş (pending_reports sabit 0 — fonksiyon group_reports'a BAKAMIYOR, kilitli) · **kabul canlı 4/4** (geri alınan işlem: üye/anon özeti okuyamıyor · anahtarı yalnız admin yazıyor · beyaz liste dışı/tip reddi · gerçek gönderiyle sayaç 0→1 · bonus: G22 cron'u gerçekten koşuyor — claim_expiry 22:30 succeeded) · 33 yeni test (hata haritası BEŞ migration'a çift yönlü) · **mutasyon 6/6** (M3 dosya-genel iddia yüzünden ilk koşuda kaçtı → fonksiyon-kapsamına güçlendirildi — G21 dersi 2. kez) · tam takım **417 dosya/3437 test** · `tsc` 0 · `check:dead` 0/0/989 · `ingest` 58 · 📌 şikayet sekmesi G14'te dolar · legacy `WhatsAppLandingsModeration` ekranı G25/G10c'de tek dile iner |
| G23 · 8 bildirim metni (tasarım §9) | mig `20261002120000` canlıda + kayıt (**458/458**) · outbox CHECK **9→17** (KR09 sessiz-kayıp dersi) · 8 anahtar `notification_settings` · `enqueue_group_notification` tek kapı (mail yoksa satır YOK · dedupe · poke · `corteqs.skip_group_notify`) · **5 trigger** (fonksiyon redefine YOK): landing INSERT (hızlı şeritte "alındı" ATLANIR — çift mail yok) · moderation_log (`from_status NULL` fast_lane satırı ATLANIR; published/rejected+sebep/link_dead/strike→insan metni) · claims→verified · posts pending_group_admin (**günde grup başına TEK mail**, n güncel) · badge false→true (skor payload'da) · sahipsiz grupta alıcı submitted_by (sessiz kayıp yok) · edge YENİDEN DEPLOY (15/15): `_shared/emails/group-notifications.ts` 8 şablon — **§9 metinleri dosyaya karşı birebir kilitli** · alıcı payload.email (transactional) · 🔴 kural 8: maile/payload'a davet linki GİRMEZ ({link}=site sayfası) · **kabul iki ayak:** (A) geri alınan işlem **8/8 olay tipi** + skip bayrağı + kural-8 taraması 0 sızıntı + rollback temiz · (B) **gerçek drenaj `processed:8, sent:8, failed:0`** — 8/8 `sent_at` dolu rc=1, satırlar silindi (KR09 deseni) · ⚠️ ders: Türkçe SQL `-c` ile bozuluyor (0x97) → `-f` dosyadan · 43 yeni test · **mutasyon 6/6** (M4 desen uyuşmazlığı tekil koşuda giderildi) · tam takım **414 dosya/3405 test** · `tsc` 0 · `check:dead` 0/0/987 · `ingest` 58 |
| G22 · 6 zamanlanmış görev + link-health edge | mig `20261002110000` canlıda + kayıt (**457/457**) · pg_cron 6 isimli iş (link-health :23 edge · queue :17 · health-score 04:31 · suspension 04:37 · renewal 04:43 · claim-expiry */10) · 🔴 **G17 tuzağı bayrakla kapalı:** `health_score_cron_enabled=false` → -1 (canlı ölçüldü; deploy sonrası İNSAN kararıyla açılacak — kullanıcıda bekleyenler listesinde) · edge DEPLOY (`check:functions` **15/15**) + `verify_jwt=false` ÖLÇÜLDÜ (fonksiyon 401'i, gateway değil — A99-R2 dersi) + sabit-zamanlı `x-dispatch-secret` · ⚠️ secret: vault'a SQL'den yazılamıyor (ölçüldü) → `radar_news_cron_secret` yeniden kullanıldı + `supabase secrets set` (rotasyonda İKİ yer) · **kabul #8 canlı 8/8** (geri alınan işlem: 2 invalid→hidden(link_dead)+log system · unknown sayaç 2 KALDI+checked_at tazelendi · ok→published+sayaç 0 · due yayma/boş-link eleme · suspension · renewal çıpa+düşürme+renew · claim-expiry · grant matrisi · rollback temiz) + **GERÇEK tur:** slot-21 grubu kontrol edildi → unknown, ayak izi doğru · 🔴 canlı test 2 gerçek kusur yakaladı: security-definer zincirinde `auth.role()` claim taşımıyor → record/suspension `group_forbidden` (geçici service claim + geri yükleme ile yamandı) · 7 yeni ayar anahtarı · sözleşme **21/21** · **mutasyon 6/6** · tam takım **412 dosya/3377 test** · `tsc` 0 · `check:dead` 0/0/987 · `ingest` 58 (15 edge) |
| G21 · S4 sahip paneli | mig `20261002100000` canlıda + kayıt (`check:migrations` **456/456**) · `group_owner_panel_state` (sahiplik kontrolü VERİDEN ÖNCE — sahip değilse/anon `{"is_owner":false}` TEK alan, skor G17 compute'tan, kuyruk pending_group_admin) + `group_owner_update_v1` (motor form alanları+rules+tagline; set listesi içerikle sınırlı — group_score/ownership/listing YAZILAMAZ; aile-cocuk G18 kilidi; legacy description ETİKET KUYRUĞU korunur) · kaldırmada YENİ KAPI YOK: UI → G12 `set_group_status_v1(hidden, owner_request)` · kuyruk → G16 `group_post_review` · panel: skor 6 kalem + "Kurallarını ekle, +15" rehberi + rozet SVG (1080², XSS kaçışlı) + paylaş + iki adım onaylı kaldırma · **kabul #9 canlı 9/9** (geri alınan işlem: ANINDA hidden + log actor_kind=owner + dizin 10→9 · sahip-olmayan forbidden · panel sızıntısız · düzenleme + etiket korundu + 161/aile/diger reddi · kuyruk approve/reject · rollback temiz) · 🔴 mutasyon turu TEST AÇIĞI yakaladı: M3 ilk turda geçildi (test yalnız raise'i kilitliyordu) → koşul kilidi eklendi, tekil koşuda düştü → **6/6** · 49 yeni test · tam takım **411 dosya/3356 test** · `tsc` 0 · `check:dead` 0/0/987 · `ingest` 57+0 · 📌 Faz E TAMAM — deploy kuyruğu G03b+G18–G21 |
| G20 · S3 detay — "Bu grup sizin mi?" claim UI | KOD (migration YOK — G13 backend hazırdı): `GroupOwnershipClaim` + `src/lib/group-claims.ts` — kod yolu (CQ+4, talimat §3.B.2 birebir, verify body YALNIZ `claim_id` [kural 8], verified→"Kodu artık silebilirsin"+sayfa tazelenir, exhausted→ekran görüntüsü formu açılır, invalid/unknown "deneme sayılmadı") + screenshot yolu (`{uid}/screenshot-*` private kova, RPC/policy deseni birebir) + bekleyen talep geri yükleme + `claim_group` OAuth intent'i · ⚠️ "Şikayet et" ÇİZİLMEDİ (group_reports YOK — G14 ⛔; ölü düğme yok, yokluk testle kilitli) · boş koşullar gizli + "Katıl" RPC'den (kilitlendi) · **kabul DOM'da:** signed_out innerHTML'de platform linki izi YOK · **canlı prob 5/5** (geri alınan işlem: anon claims okuyamıyor · view link 0 · start_code→CQ6991+pending · RLS başka kullanıcı 0 · yabancı path reddi · rollback temiz) · 28 yeni test (hata haritası G13'e karşı çift yönlü) · **mutasyon 6/6** (⚠️ M3/M5 konsol kodlaması yüzünden ilk koşuda uygulanamadı — UTF-8 Node betiğiyle tekil koşuldu, ikisi de yakalandı; PowerShell mutasyonlarında Türkçe karakter dersi) · tam takım **408 dosya/3321 test** · `tsc` 0 · `check:dead` 0/0/985 · `ingest` 57+check 0 · deploy kuyruğu G18+G19'la aynı |
| G19 · S2 dizin — view v2 + rozet dili | mig `20261002090000` canlıda + kayıt (`check:migrations` **455/455**) · `whatsapp_landings_public` v2: G03a masking AYNEN (4 kolon null) + motor kolonları sonda + `is_new` (`group_listing_is_new`, SECURITY DEFINER — G09 grant matrisi değişmedi, eşik `groups.new_badge_hours=72`) · 🔴 **gizli kusur kapatıldı:** tek filtre `status='approved'` idi, G12 legacy `status`'ü değiştirmediği için motor `hidden/suspended/removed` kararı dizine YANSIMIYORDU → ÇİFT filtre (canlıda 10/10 aynı kaldı, eski paket onay yolu da görünür) · rozet dili politika §6 birebir (dosyaya karşı kilitli): "Admin onaylı!/Üye onaylı!" KALKTI → "Sahibi doğruladı"/"Üye önerisi" + "Yeni" + "Onaylı Grup" (eşik istemcide YOK) · "Skor bekleniyor" HİÇBİR YERDE yok, skor 0-100 · sıralama `group_score DESC NULLS LAST` (politika §7) · `categoryOptions`=`categoryMeta` türevi (tek liste) · **kabul #3 canlı 8/8** (geri alınan işlem: is_new şimdi/73h/eşik-100 kanıtı · hidden→9 · suspended→9 · legacy yol→10 · skor→ilk sıra · anon grant matrisi · rollback temiz) · 34 yeni test · **mutasyon 6/6** (M5 tekil koşuda doğrulandı — toplu koşu rapor yarışı) · tam takım **405 dosya/3297 test** · `tsc` 0 · `check:dead` 0/0/983 · `ingest:tools` 57 · types regen YOK (`WhatsAppLandingPublicRow` kesişimi) · 📌 devir: claim UI girişi + şikayet G20'de · admin panel dili G24'te · deploy kuyruğu G18'le aynı |
| G18 · S1 form + `submit_group_v1` + `group-preview` edge | mig `20261002080000` canlıda + kayıt (`check:migrations` 454/454) · tek gönderim kapısı (dedup `group_invite_code` · kara liste→`review_flags` REDDETMEZ · hızlı şerit 4 koşul + `fast_lane` log · günlük 5 · Grup Sözü · geo doğrulama · kategori CHECK 10+7) · edge DEPLOY (`check:functions` **14/14**, duman 4/4: 200/401/401/401 — verify_jwt default ÖLÇÜLDÜ) · `_shared/group-invite-read`'e `image` (og:image + Discord CDN, G13 semantiği değişmedi) · form 7 satır (politika §2): platform seçimi + serbest metin konum KALKTI, Grup Sözü birebir kilitli, Aile & Çocuk disabled + **sunucuda kilitli** (kabul #10 bugünkü hâl — seviye sistemi G06/K09) · karar: admin `claims_admin` özbeyanı = verified (kabul #3 ölçülebilir) · ⚠️ paralel sistem: `submitLanding`+INSERT RLS deploy'a dek BİLİNÇLİ duruyor · **kabul canlı 14/14** (geri alınan işlem: #1 already_listed+INSERT yok · #2 şerit açıkken pending_review · #4 {vize,oturum} işaretli pending_review · #3-karşılığı published+log · 8 sınır hatası · limit · ban · Global · anon) · 🔴 iki gerçek kusur canlı testte yakalandı (`v_country.code` select eksik · Global dalda `v_city` atanmadan okunuyor) — kaynak testi göremezdi · sözleşme+birim 67 · **mutasyon 6/6** · tam takım **402 dosya/3263 test** · `tsc` 0 · `check:dead` 0/0/983 · `ingest:tools` 57 (14 edge) · 📌 devir: claim UI girişi G20 · rozet/skor view G19 · "Yeni" 72h G19 |
| G17 · grup sağlık skoru + tavsiyeler | mig `20261002070000` canlıda + kayıt (`check:migrations` 453/453 sapmasız) · `group_recommendations` (tekil, tek kapı RPC) + `group_health_score_compute` (§5 birebir 15+15+15+15+20+20) + `recompute`/`_all` (service_role ONLY, cron G22) + 4 eşik `group_settings`'te (70/65/10/90) + **guard v3** (skor kolonları motor alanı, `is_admin` muaf) · 🔴 **ölçüm:** eski kod group_score'a YAZIYORDU (`updateLanding` her admin kaydında null — `1a3310a1` 03.06, canlı pakette) → src clobber kaldırıldı, guard admin'i muaf tuttu (canlı moderasyon kırılmasın) · ⚠️ **kalıcı skor YAZILMADI:** canlı eski kart `X / 10` çiziyor → cron G22'ye dek NULL (🔴 G22 tuzağı panoda yazılı) · vacuous kalemler: şikayet (group_reports YOK → G14) + link (`link_fail_count=0`, tarihçe yok → G22) · **kabul #11 canlı 16/16** (geri alınan işlem: grace NULL · 35→65→80 · histerezis 65'te korudu/50'de düştü · tavsiye idempotent+cap→100 · guard sahip engelledi/admin geçti · RLS · rollback sonrası canlı dokunulmamış 0/0/0) · sözleşme **23/23** · **mutasyon 6/6** · tam takım **399 dosya/3211 test** yeşil · `tsc` 0 · `check:dead` 0/0/982 · `ingest:tools` 56 · types regen YOK (TS tüketici yok — G12 borcu aynı) |
| G16 · grup gönderileri + moderasyon | mig `20261002060000` canlıda + kayıt (`check:migrations` sapmasız) · ⚠️ tasarım §4 çürüdü (ölçüldü): `whatsapp_landing_comments/_likes/_follows` canlıda YOK → `group_posts` sıfırdan · ilk durum §3.D birebir 4 sınıf (verified admin→published · güvenilir üye→published · sahiplide diğer→pending_group_admin+48h `escalate_at` · sahipsizde→pending_platform) · **kabul #7 canlı:** `group_posts_escalate_due()` (service_role ONLY) süresi dolanı platform kuyruğuna taşıdı · yetki: sahip yalnız kendi kuyruğu, platform kuyruğu + remove YALNIZ admin (uydurma yetki yok) · istemciye yazma yolu YOK (grant select only) · kararlar: yalnız published gruba · `post_max_chars=10000` ajan ihtiyatı · trusted'ın "onaylı şikayet yok" yarısı G14'e (group_reports YOK, şema uydurulmadı — sözleşme kilitli) · **kabul canlı 14/14** (C1–C14, geri alınan işlem; rollback sonrası 0/10/10) · sözleşme **25/25** · **mutasyon 6/6** · `tsc` 0 · `check:dead` 0 · cron G22 · bildirim G23 · UI G20/G21 |
| G15 · uyarı (strike) sistemi + ekleme yasağı | mig `20261002050000` canlıda + kayıt (`check:migrations` sapmasız) · `group_strikes` + `group_submission_bans` + `admin_record_group_strike` (is_admin tek kapı) + `trg_block_banned_submitter` (BEFORE INSERT, admin muaf) · merdiven §7 birebir: 1.=uyarı · 2.=30 gün suspended (`suspended_until`) · 3.=removed+**ekleyen VE sahip** yasaklı · kırmızı çizgi **2/4/6 ilk ihlalde** removed+yasak · eşikler `group_settings`'te (2/3/[2,4,6]) · geçişler YALNIZ `set_group_status_v1` → hepsi `group_moderation_log`'da (reason=strike_N, canlı doğrulandı) · karar: published-olmayanda 2. ihlal warning+not (matris), 3.'te removed · **kabul canlı 13/13** (geri alınan işlem; rollback sonrası 0/0/0, 10 published, max_strike 0) · sözleşme **16/16** · **mutasyon 6/6** · `tsc` 0 · `check:dead` 0 · bildirim G23'e, yasak kaldırma G24'e |
| G13 · sahiplik doğrulama | mig `20261002040000` canlıda + kayıt (`check:migrations` sapmasız) · `group_claims` (aktif TEK kod + kullanıcı başına TEK talep, kısmi tekil indeks) + `group_invite_reads` (**link kolonu YOK**) + private kova `group-claim-screenshots` + 4 RPC · **edge `group-claim-verify` DEPLOY** (`check:functions` 13/13) · 🔴 **guard v2:** `Users can update own landings` ile `ownership='verified'` YAZILABİLİYORDU → ownership+11 motor alanı engellendi, legacy `status`/içerik SERBEST · 🔴 **K10 ölçümü:** 175/175 kullanıcının tek rolü var (signup trigger'ı `User_DiasporaMember`) → `Community_*Admin` atanamaz, güvenli skip + `role_skipped_reason` · **kabul canlı 18/18** (geri alınan işlem; rollback sonrası 0 claim/0 read/10 unclaimed/175 rol) · gerçek sayfa 8/8 `ok` (Türkçe çözüm ✓) · duman 4/4 (401/401/403/200) · sözleşme 30 + birim 18 · **mutasyon 6/6** · `tsc` 0 · `check:dead` 0 · `ingest:tools` 56 |
| G12 · durum makinesi + moderasyon logu | mig `20261002030000` canlıda + `schema_migrations` kaydı (`check:migrations` sapmasız) · **tek kapı** `set_group_status_v1` (security-definer) + `group_status_transition_allowed` (tasarım §2 birebir: removed kalıcı, rejected terminal) + `trg_guard_listing_status` (doğrudan `update...listing_status` YASAK) + `group_moderation_log` (istemciye kapalı, admin select) + `groups.suspension_days=30` · **kabul #12 canlı kanıt 13/13** (geri alınan işlem): her geçiş loglanır · no-op log yazmaz · illegal/geçersiz/sebepsiz-hidden reddedilir · anon `group_forbidden` · admin `moderator` · doğrudan update trigger ile engellenir · **legacy `status` SERBEST** (eski paket kırılmaz) · rollback sonrası canlı dokunulmamış (10 published, 0 log) · 🔴 **gerçek kusur onarıldı:** SQL üç-değerli mantık — `hidden` sebepsiz kabul ediliyordu (`NULL NOT IN`→NULL, `if NULL` atlar), NULL-safe'e çevrildi + sözleşmeye kilitlendi · sözleşme testi **20/20** · **mutasyon 6/6** · ⚠️ types regen ERTELENDİ (TS tüketici yok; db-url kompakt 6923 ≠ canonical verbose 16634 = ayrı format borcu) · `tsc` 0 · `check:dead` 0 |
| G10 · `whatsapp_landings` şema genişletme | mig `20261002020000` canlıda + `schema_migrations` kaydı (`check:migrations` sapmasız) · **20 kolon** salt ekleme (`if not exists`), 4 CHECK, `group_invite_code()` + kısmi tekil indeks · **BİLİNÇLİ SAPMA:** `member_approved`/`admin_approved` DÜŞÜRÜLMEDİ (9 dosya + canlı paket eski kod) → **G10c** (⛔ G03b deploy) · geri doldurma: `invite_code` **8/10** (2 boş link U07), `listing_status` 10/10 `published`, `ownership` 10/10 `unclaimed`; ekip kararı alanlarına dokunulmadı · K5 canlı kanıt: sync fonksiyonu **10/10 hatasız** (geri alınan işlem), `source_records` 10/10, trigger yerinde · types regen +113 satır · `tsc` 0 · 10 sözleşme testi · **mutasyon 6/6** |
| KR10 · SEO · sitemap · araç kataloğu · kök temizliği · doküman | `/kariyer` sitemap önceliği **0.4 → 0.7** (sözleşme testiyle kilitli — sessizce geri dönerse düşer) · `PAGE_SEO.career.description` 17 ilan + staj + uzaktan çalışmayı anlatacak şekilde yenilendi · sitemap üretildi: **413 URL**, `/kariyer` priority 0.7 ölçüldü · `ingest:tools:check` **temiz** · `check:drift` temiz · **kök temizlendi:** `EKİP WEB SAYFASI …` klasörü + zip kaldırıldı, içerik `docs/archive/2026-10-02-kariyer-kaynak-paketi/` altına alındı (zip birebir aynı 3 dosyaydı — ölçüldü) · kökte yalnız `CLAUDE.md` + `README.md` kaldı · **CLAUDE.md'ye kariyer modülü bölümü** (11 değişmez kural) · ⏳ tek kalan: deploy sonrası canlı kontrol (`curl -I /kariyer` + CSP) — kullanıcıda |
| KR09 · yeni başvuruda e-posta bildirimi | mig `20261002000000` canlıda + `send-notification-emails` **DEPLOY EDİLDİ** (94 kB) · **uçtan uca canlı kanıt:** gerçek başvuru satırı → trigger → kuyruk → `status=sent`, **recipient_count 2**, `last_error` boş, 3 saniyede (06:43:22 claimed → 06:43:25 sent) · payload'da `cv_path` **YOK** (ölçüldü: `payload ? 'cv_path'` = false) · ölçüm satırları silindi (başvuru 0 / kuyruk 0) · 8 şablon testi, mutasyonla sınandı · `check:functions` 12/12 sapmasız · 🔴 **YAN BULGU — canlıda sessiz kusur onarıldı:** `notification_email_outbox.event_type` CHECK listesi `radar_scan_digest`'i İÇERMİYORDU ama `radar-news-scan` (satır 440) tam o tiple kuyruğa yazıyor → insert her seferinde `23514` ile reddedilmiş, kuyrukta **0 radar satırı**, yani **radar özet maili 19 Eylül'den beri hiç gitmemiş**. Aynı kısıt zaten değiştirilmek zorundaydı, iki değer birlikte eklendi · **KR09b (kullanıcı isteği 02.10): mail TÜM yöneticilere gider.** Alıcılar abonelik tablosundan geliyordu, yani satırı olmayan yönetici sessizce mail ALMIYORDU; kariyer bildirimi opt-in'den **opt-out**'a çevrildi (mig `20261002010000`). Ölçüm: sistemde **2 yönetici**, ikisinin de satırı var — bugün davranış aynı, kusur gelecekte patlayacaktı. Kanıt (geri alınan işlem içinde): satırı silinen yönetici kariyer alıcılarında **KALDI**, aynı kişi `new_member`'da listeden **DÜŞTÜ** (eski kural korundu), açık `false` ile **ÇIKTI**. Kapı `is_admin` · diğer olay tipleri değişmedi · 10 sözleşme testi |
| KR08 · `/admin/kadro/basvurular` ekranı + `careers-admin-api.ts` | Kadro grubuna **5. madde** olarak girdi (yeni admin grubu açılmadı) · rota + navigasyon kaydı + `admin-route-meta` **üçü birlikte** · dosyalar **`createSignedUrl`** ile 5 dk'lık bağlantı, kova private KALIR · liste/pozisyon/durum filtresi + durum geçişi + not · arama `trIncludes` · **canlı ACL ölçümü:** `career_applications` üzerinde yalnız 2 politika (SELECT+UPDATE, ikisi de `is_admin(auth.uid())` koşullu, `authenticated` rolünde) · anon tablo grant'ı **YOK** (anon SELECT 42501) · kova `public=false`, 7 MIME, 25 MB · kova politikaları: INSERT `{anon,authenticated}` (başvuru girişsizdir), SELECT/DELETE yalnız admin · 7 sözleşme testi, **7/7 mutasyon yakalandı** (menü kaydı · route-meta · rota · public URL · çıplak `toLowerCase` · sessiz yutulan hata · menü rengi) · ⚠️ Yönetici OLMAYAN girişli kullanıcı hata almaz, RLS **0 satır** döndürür — ekranın kendisi AdminLayout kapısının arkasındadır · 📌 **N03 bayatlama kapanı çalıştı:** yeni menü maddesi `admin-menu-catalog.test.ts'i` düşürdü → `npm run ingest:admin-menu` (88→**89** öğe) + `ingest.mjs --source=admin-menu` + `embed.mjs` koşuldu, korpus **89/89 gömülü, bekleyen 0** |
| KR07 · önceki dönem 4 ilanı korundu, yeni başvuru akışına bağlandı | `careers-legacy.ts` tek kaynak · 4 ilan "önceki dönem ilanı" rozetiyle duruyor · başvuru düğmeleri yeni forma bağlandı, **eski `InterestForm` kariyer sayfasından kaldırıldı** · formun pozisyon kutusuna `optgroup` ile eklendiler (eksik olsa seçim SESSİZCE kaybolurdu) · 6+1 sözleşme testi, **5/5 mutasyon yakalandı** · 🔴 **İki mutasyon önce KAÇTI:** iddialar yalnız `"LEGACY_..."` metnini arıyordu ve IMPORT SATIRI o adı taşıdığı için kullanım boşaltılsa da yeşil kalıyorlardı → biri davranış testine (seçenekler gerçekten çiziliyor mu), diğeri gerçek JSX çıpasına (`{LEGACY_POSITION_NOTE}`) çevrildi · 📌 **Kaldırma koşulu:** yeni 17 ilan üzerinden en az bir tam başvuru döngüsü tamamlanıp ekip "artık başvuru gelmiyor" diyene kadar dururlar |
| KR06 · başvuru formu (3 dosya) + sürükle-bırak + KVKK onayı | **CANLI UÇTAN UCA KANIT (anon anahtarla, 5 çağrı):** doğru desenli anahtarla CV yükleme **200** · desen dışı anahtar **RLS reddi** · izinsiz MIME **415** · anon dosya okuma **reddedildi** · RPC başvuru **200** · ölçüm satırı + dosya silindi (canlı: 0 başvuru / 0 dosya) · 8 sözleşme testi, **7/7 mutasyon yakalandı** · 🔴 **Bir mutasyon KAÇTI ve testi düzeltti:** seçilen pozisyon testi mount anını ölçüyordu, oysa `defaultValues` zaten seçimi taşıyor — senkron eden `useEffect` silinse bile yeşil kalıyordu; gerçek senaryo form ekrandayken listeden seçim yapmak, test `rerender` ile ona çevrildi · ⚠️ KVKK onayı varsayılan **işaretsiz** (işaretli gelseydi kullanıcı onay vermeden göndermiş sayılırdı ve RPC de görmezdi) · `check:dead` **0 borç** — kariyer baseline'ı tamamen boşaldı |
| KR05 · 17 ilan listesi + alan filtresi + staj bloğu + derin bağlantı | `CareerPositionList` · `CareerPositionCard` · `CareerInternProgram` · `career-anchors.ts` · 8 sözleşme testi, **6/6 mutasyon yakalandı** · 🔴 **Bir mutasyon KAÇTI ve gerçek bir kusur çıkardı:** derin bağlantı yalnız mount'ta okunuyordu, yani SPA'da sayfadayken tıklanan `#ilan-…` bağlantısı SESSİZCE ölüyordu ve `setFilter(ALL)` satırı fiilen ölü koddu → `hashchange` dinleyicisi eklendi, test gerçek senaryoya (önce filtrele, sonra başka alandaki ilana git) çevrildi · ⚠️ `positionAnchorId` bileşen dosyasından çıkarıldı (bileşen dışı ihraç fast refresh'i kapatıyor, ESLint uyardı) · `check:dead` bayat baseline uyardı, 2 satır silindi |
| KR04 · kariyer sayfa iskeleti (hero · saat bandı · kurucu mektupları · katılım modelleri) | `src/components/career/` 5 dosya · kurucu fotoğrafları base64'ten çıkarılıp `public/career/` altına **gerçek dosya** (14,5 KB + 17,1 KB) · saat bandı 8 şehir, `Intl.DateTimeFormat("tr-TR", { timeZone })`, 15 sn · 7 sözleşme testi, **6/6 mutasyon yakalandı** (elle UTC kaydırması · yerelsiz biçimlendirme · şehir düşürüldü · base64 koda gömüldü · `useSeo` deps kaldırıldı · Türkçe harf kırpıldı) · ⚠️ sayfa YARIM BIRAKILMADI: eski içerik "önceki dönem" olarak altta duruyor, KR05/KR06 araya giriyor · ⚠️ `check:dead` baseline notu düzeltildi — 4 dosyayı KR04 değil **KR05 (veri) ve KR06 (API)** siler |
| KR03 · `careers-api.ts` + `careers-schemas.ts` + çift yönlü hata haritası | 11 sözleşme testi, **6/6 mutasyon yakalandı** (haritadan kod silindi · haritaya hayali kod · istemci sınırı kovayı aştı · ham dosya adı anahtarda · `.key` MIME silindi · `accept` ayrıştı) · ⚠️ **mevcut `validatePresentationFile` KULLANILMADI: 50 MB'a izin veriyor, kova 25 MB'da kesiyor** → 40 MB'lık sunum istemciden geçip kovadan dönerdi; kariyer kendi sınırlarını tanımlar (CV 10 MB · sunum 25 MB) ve test bunları migration'daki kova sınırına karşı denetler · ⚠️ MIME `file.type`'tan DEĞİL uzantıdan verilir: `.key` tarayıcıya göre boş/zip gelir ve dar kova listesinden dönerdi · `check:dead` 0 yeni / **4 bilinen borç** (🔴 KR04 hepsini siler) |
| KR02 · `career_applications` tablosu + private kova + `submit_career_application` RPC | mig `20261001130000` **canlıda** · anon smoke (10 çağrı): geçerli başvuru **200+uuid** · doğrudan PostgREST INSERT **401/42501** · anon SELECT **401/42501** · başka klasörün `cv_path`'i **400** · `consent=false` **400** · bozuk e-posta **400** · geçersiz model **400** · aynı e-posta 6. başvuru **53400** (5'e kadar geçti) · aynı id tekrar **409** · 6 ölçüm satırının 6'sında `status='yeni'` + `notes is null` **zorlandı**, hepsi silindi (tablo 0 satır) · types regen **+116/−0** (`graphql_public` yerinde) · 7 sözleşme testi, **5/5 mutasyon yakalandı** · ⚠️ gelen paketin 3 hatası düzeltildi (`has_role` yok → `is_admin(uid)`; anon INSERT → RPC; anahtar deseni denetimi eklendi) · ⚠️ `application/octet-stream` MIME listesinden ÇIKARILDI (tür sınırını fiilen kaldırıyordu) · RPC **`career_` önekli 12 snake_case kod** fırlatır (İngilizce cümle DEĞİL — KR03'ün çift yönlü haritası için), canlıda doğrulandı |
| KR01 · `src/lib/careers/` ilan verisi + sözleşme testi | **17 ilan + staj programı** · veri kaynak HTML'den **makineyle** çıkarıldı (25 KB Türkçe metin) · 6 test, **5/5 mutasyon yakalandı** (id tekrarı · boş `tasks` · geçersiz `area` · ilansız bölüm · Türkçe harf kırpma) · ⚠️ Türkçe iddiası ilk hâlinde KAÇIRMIŞTI (`toContain("Ürün")` başka ilan başlığından yeşil kalıyordu) → birebir etiket listesine çevrildi · ⚠️ `check:dead` 0 yeni / **2 bilinen borç**: iki dosya tüketicisinden önde, 🔴 **KR04 baseline satırlarını silmeli** |
| G09 · `group_settings` anahtar-değer ayar tablosu + 3 okuma yardımcısı | mig `20261001120000` **canlıda** — 15 satır · `group_setting_bool/int/json` çalışıyor (olmayan anahtar varsayılana düşüyor: 42) · tablo grant'ları yalnız `postgres`+`service_role`, **anon SELECT 42501**, **anon RPC 42501** · RLS açık/0 politika · `group_setting_json` `authenticated`'a **açılmadı** (kara liste gizli kalmalı) · 5 sözleşme testi, **3/3 mutasyon yakalandı** · ledger 444/444 sapmasız · ⚠️ TS ayna modülü bilerek YOK (`check:dead` 0 yeni/0 borç korundu) · 🔴 `otp_rate_limits` değeri ajan ihtiyatı → G05'te teyit |
| G08 · M1 spike: davet sayfasından grup adı okunabiliyor mu (rapor, üretim kodu yok) | **59 istek** ölçüldü (WA 27 · TG 13 · DC 34) — üçünde de ad+görsel kimlik doğrulamasız okunuyor · ⚠️ **HTTP 200 geçerlilik kanıtı DEĞİL**: WhatsApp uydurma 5 kodun 5'ine de 200 döndü, tek işaret `og:title`'ın **boş** olması · ⚠️ okunan ad kayıtlı addan farklı (2/2) → tam eşitlik karşılaştırması yazılamaz · ⚠️ başlık HTML varlık kodlu (`&#x131;`) → çözülmezse Türkçe bozulur · Discord resmî API `10006 Unknown Invite` (10/10) en temiz yol · hız sınırı bu hacimde görülmedi ama Discord `x-ratelimit-*` **yayınlamıyor** → "sınır yok" denemez · 🔴 `t.me/+…` geçerli hâli ÖLÇÜLEMEDİ (link yok) |
| N07 · canlı ingest + embed + getirme kanıtı · docs-admin vekil kusuru kökten onarıldı | `8a777afc` — 88 admin-menu belgesi canlıda gömülü · getirme: ADMIN 0.215–0.287 doğru kayıt en üstte, MEMBER **0 admin-menu** · docs-admin re-ingest 404 belge/4901 parça **0 hata** (640 bayat satır prune) · korpus 5639/5639 gömülü · 🔴 kusur kök neden: `chunkText` emojiyi (🔴 U+1F534) örtüşme sınırında bölüyordu → yalnız vekil `\uDD34` → PostgREST "Empty or invalid json" (93'te 1, deterministik) · 3 test + 2/2 mutasyon · ⏳ tek kalan: kullanıcı UI kabulü (frontend deploy sonrası) |
| N05 · yönetici menüsü prompt kuralı (`is_admin()` kapılı) + deploy | deploy `site-assistant` 88.19kB · canlı anon POST **401** · 5 yeni test, 3 mutasyon 3/3 · `check:functions` 12/12 sapmasız · ⚠️ Rancher Desktop motoru takılıydı (deploy Docker ister) — süreç+`wsl -t` ile yeniden başlatıldı · ℹ️ etki N07 embed'inden sonra görünür |
| N06 · bot yanıtında tıklanabilir link (beyaz liste: iç `/…` + `https://`) | `a506f92c` — 17 yeni test, 3 mutasyon 3/3 yakalandı · 381 dosya/2972 test yeşil · ⚠️ ilk desen parantezlu hedefleri (`javascript:alert(1)`) hiç eşleştirmiyordu — ham markdown sızıyordu, test yakaladı · ℹ️ canlıya yansıması frontend deploy'una bağlı |
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
