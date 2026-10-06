# CorteQS — Lansmana Hazırlık Planı

`Revizyon kaydı: #REV-___ · Hazırlayan: Burak · Uygulayıcı: Barış · Sürüm: v2 — 04.10.2026`

---

## v2'de ne değişti

- Admin → Revizyon İstekleri panosu okundu: 74 açık/incelenen ve 31 tamamlanan kayıt.
- Plandaki `?` REV sütunları panodaki numaralarla dolduruldu. Panoda karşılığı olmayan işler `YENİ REV` olarak işaretlendi.
- Panodaki lansmanla ilgili 14 iş plana eklendi. Bunlar L0.6–L0.8, L1.10–L1.14, L2.10–L2.12, L3.5, L4.5 ve L5.8.
- Lansman dışı kalan revizyonlar gerekçeleriyle Bölüm 9'a taşındı.
- Panodaki öncelik puanıyla (Ö1–Ö10) planın yapım sırası arasındaki çelişkiler Bölüm 10'a yeni kararlar (K8–K13) olarak eklendi.
- v1'deki küçük hata düzeltildi: panoda olup planda olmayan işler Bölüm 8'e değil, Bölüm 9'a yazılır.

---

## 0. Bu belge nasıl okunur

Bu plan son iki haftanın (20.09–04.10.2026) revizyonlarını ve kararlarını lansman açısından sıraya koyar. Gerektiği yerde Temmuz–Ağustos'tan kalan açık revizyonlar da plana alındı. Her satır **tek bir iş = tek bir Claude Code prompt'u** olacak şekilde yazıldı. Barış her işi Bölüm 11'deki şablonla prompt'a çevirir, bitince durumunu işaretler.

**Kaynaklar:** Admin Revizyon İstekleri panosu (04.10.2026 okuması), CorteQS İnşa Notları, Rol Temel Modeli (26–27.09), Çarşı v2 (REV-092), Evim-Evin (REV-094), CorBot protokolü (28.09), Juke Box/İthaf sohbeti (27.09), Cadde kademeli açılış notu (29.09), Lovable CORTEQS+ kodu (`CafeAmbiance.tsx` incelendi).

**REV sütunu:**

- `REV-0xx`: panoda karşılığı var. İş bitince bu REV kapatılır.
- `YENİ REV`: panoda karşılığı yok. Barış işe başlarken panoda bir kayıt açar.
- `(kısmi)`: REV işin bir bölümünü kapsıyor.

Durum işaretleri: `[ ]` açık · `[~]` yapılıyor/panoda "İnceleniyor" · `[x]` canlıda/panoda "Yapıldı"

---

## 1. Lansman tezi (tek paragraf)

İnsanlar platforma gelmez, **masaya** gelir. Cadde kapıdır, Cafe masadır, Juke Box masadaki ilk cümledir. Profil kartı karşındakinin kim olduğunu söyler, CorBot yolu gösterir, Çarşı ihtiyacı çözer. Lansmanda her şeyi değil, **bu tek deneyimin kesintisiz çalışmasını** satıyoruz. Bu yüzden yapım sırası önceliğe göre değil, bağımlılığa göre kuruldu.

---

## 2. Öncelik ve yapım sırası

| Öncelik (lansman değeri) | Yapım sırası (bağımlılık) | Neden farklı |
|---|---|---|
| 1. Cadde + Cafe | Faz 0 — Lansman engelleri | Güvenlik, giriş ve demo temizliği olmadan hiçbir şey açılmaz |
| 2. Paneller + profil kartları | Faz 1 — Kartlar ve paneller | Cadde, Arama ve Çarşı aynı ön kartı gösterir; önce kart |
| 3. CorBot | Faz 2 — Cadde + Cafe | Kart hazır olunca akış ve masa üzerine kurulur |
| 4. Arama | Faz 3 — Arama | Kart + veri hazırsa arama sadece bir görünümdür |
| 5. Çarşı (mümkünse) | Faz 4 — CorBot | Bot, sayfalar oturduktan sonra yazılan kılavuzlarla öğrenir |
| | Faz 5 — Çarşı (koşullu) | Yasal kapı geçilirse girer, geçilmezse "Yakında" |
| | Paralel hat (P) | Lansmanı beklemeyen, ayrı yürüyen işler (Bölüm 9.1) |

**Önerilen takvim (Burak onayı gerekir, K1):**

| Hafta | Tarih | Odak |
|---|---|---|
| H0 | 05–11 Ekim | Faz 0 tamam + Faz 1 ilk üç iş |
| H1 | 12–18 Ekim | Faz 1 bitiş + Cafe veritabanına taşınır |
| H2 | 19–25 Ekim | Faz 2 bitiş + Faz 3 + CorBot temel |
| H3 | 26 Ekim–1 Kasım | CorBot RAG, Çarşı kapısı, uçtan uca test, kod dondurma |
| Lansman | **1 Kasım 2026** | Puanlama Sezon 1 başlangıcıyla aynı gün |

**Yük notu (v2):** Panodan gelen işlerle Faz 0 üç, Faz 1 beş iş büyüdü. H0–H1'in tutması için Faz 1'deki yeni işlerin "lansman çekirdeği" ile sınırlı kalması gerekiyor. Hangi kısmın lansman sonrasına kaldığı her satırda yazıyor.

**Kesme çizgisi:** H2 sonunda gecikme varsa işler şu sırayla düşer, tarih kaymaz:

1. Çarşı → "Yakında"
2. AI Arama'nın konuşmalı modu → klasik arama
3. Juke Box'ta jeton/kalp → yalnızca ithaflı sıra
4. Işık hüzmesi göstergesi (L1.14) → yalnızca ince bar
5. Etkinlik paylaşım e-postası (L1.13) → lansman sonrası

---

## 3. Faz 0 — Lansman engelleri (H0)

| ID | İş (tek cümle) | Kaynak · REV | Durum |
|---|---|---|---|
| L0.1 | Sızan anahtarların kalan üçünü değiştir, eski sunucu portunu ve `cv-files` kovasını kapat; bunlar açıkken lansman yapılmaz. | Rol Modeli §Barış #1 · YENİ REV | [ ] |
| L0.2 | E-posta doğrulamasını aç, SMS telefon doğrulamasını devreye al; doğrulama sonrası karşılama ekranı "Profilini iki dakikada dolduralım, sonra Cadde'ye çık" desin. | 03.09 + 25.09 kararları · REV-082 | [ ] |
| L0.3 | Tek bir `DEMO_MODE` bayrağıyla tüm demo/mock içeriği kapat (Cadde test gönderileri, Cafe demo post-it/anket/parçaları, Çarşı demo tekrarı, Venture Hub DEMO kartları). | Audit + REV-092 B13 · REV-092 (kısmi) | [ ] |
| L0.4 | Canlıda global `noindex` ve tüm sayfaları ana sayfaya bağlayan `canonical` hatasının giderildiğini doğrula. | 27.08 SEO audit · YENİ REV | [ ] |
| L0.5 | Tek puan defteri kur: `point_rules` + `points_ledger`. Çarşı ilan puanı, Evim-Evin +20 ve Puanlama Matrisi'nin tüm `action_key`'leri buraya yazar. | Puanlama Matrisi · REV-092 B9 + REV-094 + REV-095 | [ ] |
| **L0.6** | Login'e "Şifremi unuttum" akışını ekle: süreli ve tek kullanımlık link, kayıtlı olmayan adreste de aynı genel mesaj, başarıda login'e dönüş. | **REV-096** (Ö10) | [~] |
| **L0.7** | Sayfa geçişlerinde anlık beliren hata ekranını gider; Taşınma sayfası düzelmiyorsa lansmanda "Yakında" bandıyla kapat, geri tuşu önceki ekrana dönsün. | **REV-079** (Ö10) + REV-044 | [~] |
| **L0.8** | Arama ve dizin sonuçlarından super admin/yönetici hesaplarını çıkar; admin rolündeki hiçbir hesap herkese açık listede görünmesin. | **REV-023** | [~] |

**Kabul:**

- Eski anahtarlar geçersiz.
- Yeni kayıt doğrulamasız Cadde'ye çıkamaz.
- `DEMO_MODE=false` iken hiçbir sayfada sahte veri yok.
- Puan yazımı `reference_id` ile tekrarsız.
- Şifresini unutan kullanıcı tek başına hesabına dönebiliyor.
- Hiçbir sayfa geçişinde hata ekranı görünmüyor.
- Aramada admin hesabı çıkmıyor.

---

## 4. Faz 1 — Profil kartları ve kullanıcı panelleri (H0–H1)

Kural: Her aile **tek panel, tek ön kart, tek detay kart** kullanır; role göre sadece modül blokları eklenir. Panelde yönetilen her alan kartta görünür, kartta görünen her alan panelden yönetilir (parity).

| ID | İş (tek cümle) | Kaynak · REV | Durum |
|---|---|---|---|
| L1.1 | Tek `PublicCard` bileşeni yap; arama, Cadde, harita, kategori sayfaları ve Çarşı satıcı kartı aynı bileşeni ailesine göre alan değiştirerek kullansın. Kişiler satır satır, kuruluşlar kart görünümünde olsun. | 06.07 + 25.09 kart envanteri · REV-008 (REV-057 ön kart ✅ temel alınır) | [ ] |
| L1.2 | Detay kartı 7 bölümle kur (başlık, hakkında, modüller, etkinlikler, konum, belgeler, künye), gönderi ızgarası olmasın ve `/profile/:id` 404'ü kapansın. | Rol Modeli §5 + REV-092 B13 · YENİ REV | [ ] |
| L1.3 | Panel iskeletini sekme tablosuna göre kur, en üste "Ziyaretçi gözüyle gör" önizleme düğmesini koy. İlk ekranda "Etkinlik oluştur · Tavsiye iste · Davet et" tek tık kısayolları olsun. | Rol Modeli §5 · REV-045 + REV-103 (panel bölümü) | [ ] |
| L1.4 | "Erişim & Talepler" sekmesini **"Rol Talepleri"** yap. 77 maddelik listeyi 3 adımlı seçiciyle değiştir (Ana Rol → Alt Rol → Uzmanlık; 6 ana rol, 52 alt rol) ve kayıtlı rolleri yeni kodlara göç ettir (`consultant.ambassador.*` → `ambassador.*`). Lansmanda kural: 1 bireysel profil + 1 ticari etiket. | 21.09 Pro Rol Yönetimi + 25.09 · **REV-100** (Ö10) + REV-073 | [ ] |
| L1.5 | Belgeler sekmesine ruhsat/meslek lisansı alanı ekle; Approval Queue'da onayla/reddet/ek belge iste akışını aç. | 19.09 · REV-058 | [ ] |
| L1.6 | Panel küçükleri: menüde "Profilim" yerine kullanıcının adı, bireysel profile 3 LinkedIn + 3 web linki, Ayarlar'da kalıcı profil silme (danger zone). | REV-068 + REV-070 + REV-054 | [ ] |
| L1.7 | Paket haklarını panelde görünür yap (kalan tanıtım alanı, "Bu ay 3 teklif hakkınız kaldı"). Sayaçlar şimdi görünür, kilit `LOCK_FROM=2027-01-01` bayrağıyla açılır. | İnşa Notları 27.09 · REV-102 (kısmi) | [ ] |
| L1.8 | Evim-Evin kalanları: misafir girişten sonra `/profile?tab=evim-evin`'e dönüş, ön kayda +20 puan (L0.5'e yazar), admin "Evim-Evin Havuzu" panosu + CSV. | REV-094 "AÇIK" listesi | [ ] |
| L1.9 | Canlı `/pricing` sayfasını v2 önizlemesiyle değiştir. Ücretsiz profil + ücretli yanıtlama, Kuruluş 3 ay ücretsiz, etkinlik herkese ücretsiz, Çarşı/WhatsApp bot/AI eşleştirme "Yakında", iletişim `info@corteqs.net`. Fiyatlar tek plan config'inden okunsun. | Prompt A · **REV-093** (Ö10) + REV-101 | [ ] |
| **L1.10** | Rol onayı sonrası "Profilin yayında" ekranını ve 3 adımlık başlangıç listesini kur. Panelde "1 Ocak'tan itibaren Standart gerekir, lansman fiyatını şimdi kilitle" bandı ve "Ön kayıt / fiyatı kilitle" butonu olsun. Kilitli gelen kutusu ve hatırlatmalar 1 Ocak 2027'ye kalır. | **REV-102** (lansman kısmı) | [ ] |
| **L1.11** | CV ve iş ilanı detayı için yetkiyi AFS/Feature Override matrisine tanımla, `/pricing` tablosuna iki satır ekle. Paywall (Free: toplam 5 ilan, CV yalnız Premium) K8 kararına göre ya lansmanda ya `LOCK_FROM` ile açılır. | **REV-106** (Ö10) | [ ] |
| **L1.12** | Topluluk çekirdeği ücretsiz ve varsayılan açık kalsın: etkinlik, tavsiye iste, Cadde, dijital grup ekleme, davet linki. Haftalık şehir özeti ve admin traction metrikleri lansman sonrası H+2'ye kalır. | **REV-103** | [ ] |
| **L1.13** | Etkinlik akışını tamamla: gönderim sonrası "Onaya gönderildi" ekranı, bireyselin ilk etkinliği Approval Queue'ya düşsün, saat diliminde bulunulan ülke esas alınsın, onaylanınca panelde ve ön kartta "Etkinliği var · tarih · başlık" görünsün, paylaş butonu eklensin. | **REV-069 + REV-066** + REV-103 §1 | [ ] |
| **L1.14** | Büyük `PointsCard` yerine panelde ince puan barını koy (`PointsBar` compact). Puan alınabilen 3 sayfada (Cadde paylaşım, Çarşı ilan, Evim-Evin) "+N CQ" göstergesi çıksın; puanlar `point_rules`'tan okunsun. | **REV-095** (L0.5'e bağlı) | [ ] |

**Kabul:**

- Aynı kişi aramada, Cadde'de ve haritada piksel olarak aynı kartla görünür.
- Kullanıcı kendi kartını ziyaretçi gözüyle görebilir.
- Ticari etiket ekleyen kullanıcı ikinci etiket ekleyemez.
- Rol seçicide tekrar eden, experimental ya da tabloda olmayan rol yok.
- Başvuru yeni rol koduyla onaya düşüyor.
- Etkinlik gönderen kullanıcı ne olacağını görüyor.
- Ücretsiz hesap topluluk çekirdeğindeki her işlevi kullanabiliyor.

**Bağımlılıklar:**

- L1.4 öncesinde Burak'ın rol matrisi onayı gerekir (K5). Tablodaki sarı (ÖNERİ) uzmanlıklar onaylanana kadar yayına alınmaz.
- L1.14, L0.5 olmadan başlamaz.

---

## 5. Faz 2 — Cadde + Cafe (H1–H2)

### 5.1 Tespit (kod incelemesi)

`CafeAmbiance.tsx` içinde post-it'ler, anketler, Juke Box listesi ve cafe teması **localStorage'da** tutuluyor. Yani her kullanıcı kendi tarayıcısında farklı bir cafe görüyor ve oylar hiçbir yerde birikmiyor. Juke Box sağlayıcı olarak Spotify'ı listeliyor; Spotify'ın geliştirici politikası çok kişilik eşzamanlı dinlemeyi yasaklıyor. Sponsor kahve dialogunda sahte QR ve izinsiz bir marka adı (görsel alt metninde) var. Bu üçü lansmandan önce kapanmalı.

**Panodan gelen bağlam:** Cafe dekorasyonu (yuvarlak saat, Juke Box, "tahtaya yaz") REV-085'te istenmiş; Lovable'daki tasarım referans gösterilmiş. Bu faz REV-085'i kapatır.

### 5.2 İşler

| ID | İş (tek cümle) | Kaynak · REV | Durum |
|---|---|---|---|
| L2.1 | Cafe Köşesi'ni veritabanına taşı (`cafe_notes`, `cafe_polls`, `cafe_poll_votes`, `cafe_tracks`, `cafe_jukebox_state`). Supabase Realtime ile herkes aynı masayı görsün; üye yazar, sahip onaylar. | Kod incelemesi · REV-085 (kısmi) | [ ] |
| L2.2 | Juke Box'ı **İthaf Makinesi** olarak aç: yalnız YouTube embed, sıraya şarkı koyan bir satırlık ithaf yazmak zorunda, çalarken ithaf ekranda görünür. | 27.09 Juke Box sohbeti · REV-085 (kısmi) | [ ] |
| L2.3 | Juke Box sıra mekaniği: oturum başına 3 jeton, sıradaki şarkıya kalp atılır, en çok kalp alan bir basamak öne geçer, kendi şarkına kalp yok; cafe sahibi veto ve tema kilidi koyabilir. | 27.09 · YENİ REV | [ ] |
| L2.4 | Senkron: sunucu sadece "şu an çalan + başlangıç zamanı" tutar, her şarkı başında yeniden hizalanır. Odaya girişte "Kutuyu aç" dokunuşu tarayıcı oynatma iznini alır. | 27.09 · YENİ REV | [ ] |
| L2.5 | Cafe Tahtası: sahibin pin/vurgula yetkisi kalır, gecenin en çok kalp alan ithafı tahtaya otomatik iğnelenir. | 27.09 + mevcut kod · REV-085 (kısmi) | [ ] |
| L2.6 | Sponsorlu Kahve'yi **"Yakında"** etiketiyle göster. Sahte QR ve marka adı kalkar; tıklayınca "Kahvemi ayır" butonu şehir bazlı talep sayacına yazar. | Burak 04.10 · YENİ REV | [ ] |
| L2.7 | Cafe limitlerini tek config'den oku (Standart 3 saat, Premium 24 saat, günde 3 cafe; kapasite K9'a göre) ve rol bazlı `PRO_ROLES` hakkını kaldır. | İnşa Notları + Audit #3–4 · REV-004 ✅ ile çelişki (K9) | [ ] |
| L2.8 | Lovable'daki Cadde düzenini canlıya taşı: üstte tek sıra Kişiler story bandı (şehir + yerel saat, gündüz/gece işareti; saat sayısı 3'e iner), sağ kolonda 4–6 yuvarlak aktif Cafe ikonu ("Cafe'ler (seçilen filtre dahilinde)" başlığıyla). | Lovable plan 26.09 · REV-013 + REV-006 + REV-038 | [ ] |
| L2.9 | Cadde'nin ilk gün boş görünmemesi için Radar sinyallerini resmi CorteQS hesabından akışa düşür. Persona/bot hesaplar yalnız K4 kararıyla ve görünür "CorteQS ekibi" etiketiyle açılır. | Ö9 + Radar · **REV-086** + REV-032 | [ ] |
| **L2.10** | Cadde hatalarını kapat: yenilemede sayfanın footer'a kayması ve ülke/şehir filtresinin daralması (ABD'de yalnız New York). Filtre K3 kıta kararıyla aynı işte kurulur. | **REV-026 + REV-050** | [~] |
| **L2.11** | Cafe açış formunda "tema" listesini kategori değil tema olarak düzelt; bilinen marka adlarını (Starbucks, Big Chefs vb.) rezerve listeye al, yalnız belgeli profil kullanabilsin. | **REV-002 + REV-029 + REV-012** | [~] |
| **L2.12** | Paylaşımda etiketleme kuralını netleştir ve beğeni/destek etkileşimini hover popover'a çevir. | **REV-016 + REV-015** | [ ] |

**L2.6 neden böyle (pazarlama notu):** "Yakında" etiketi boş bir vaat olarak durmasın, **sponsora satılacak bir kanıta** dönüşsün. Sayaç "Köln'de 340 kişi kahvesini ayırttı" der; bu rakam ilk sponsor görüşmesinin tek slaytıdır. Teknik maliyeti bir buton ve bir sayaç tablosu.

**L2.9 / REV-086 notu:** Gerçek kullanıcı gibi davranan, etiketsiz bot hesaplar güveni zedeler. AB'de yanıltıcı ticari uygulama riski de taşır. REV-086'daki "10–20 karakterle hareketli akış" fikri, bot olduğu açıkça görünen persona hesaplarla (Muhtar, İK Masası vb.) aynı etkiyi verir.

**Lansman sonrası (bu fazdan çıkarıldı):**

- Dart haritası ve düello
- Paylaşılabilir ithaf kartı
- Şehir bazlı "Gurbet Top 20"
- Billboard talep formu (REV-042, REV-021)
- Cadde görsel dil önerisi (REV-030)
- "Cadde İçinde Görünür Ol" tagline (REV-048)

**Kabul:**

- İki farklı tarayıcıda aynı cafe'ye giren iki kullanıcı aynı post-it'i, aynı anketi ve aynı saniyede aynı şarkıyı görür.
- Spotify seçeneği arayüzde yok.
- Sponsor kahve hiçbir yerde QR veya marka adı göstermez.
- Cadde yenilenince kullanıcı aynı yerde kalır.
- ABD seçildiğinde birden fazla şehir gelir.

---

## 6. Faz 3 — Arama (H2)

| ID | İş (tek cümle) | Kaynak · REV | Durum |
|---|---|---|---|
| L3.1 | Ana sayfa aramasını site içi tüm verilere bağla (şu an boş dönüyor) ve sonuçları L1.1 `PublicCard` ile tek formatta göster. Premium ve Kurucu profiller önce listelensin, kart değişmesin. | 06.07 + Rol Modeli §5 · **REV-061** (arama kısmı) | [ ] |
| L3.2 | Ülke → şehir kademeli filtreyi ve "Diaspora / Türkiye" ayrımını arama kutusuna bağla; Haberler ve Rehberler aynı filtreyi kullansın. | **REV-052** + REV-019 | [ ] |
| L3.3 | Sonuç bulunamayınca ham "bilgi bulunmamaktadır" metni yerine CorBot'a devret, "Bu kişiyi/işletmeyi öner" butonu göster ve `results_count=0` olayını logla. | Rol Modeli §7 · REV-088 (Talep Yakalayıcı) | [ ] |
| L3.4 | AI Arama'ya hibrit katman ekle (RAG + LLM): sonuçların üstüne kısa bir özet ve ilgili rehber makale önerisi. Netleştirici soru lansman sonrası. | 21.09 + 25.09 · **REV-061** (AI kısmı) | [ ] |
| **L3.5** | AI arama barından filtre ekranına geçince filtreleri uygulayıp aramayı tetikleyen "Ara" butonu ekle. | **REV-024** | [ ] |

Aramada admin hesaplarının görünmesi (REV-023) güvenlik konusu olduğu için Faz 0'a, L0.8'e taşındı.

**Kabul:**

- "Berlin avukat" araması kart listesi + 2 cümlelik özet + 1 rehber linki döner.
- Boş sonuç asla çıkmaz sokak değildir.
- Filtre ekranından arama tetiklenebilir.

---

## 7. Faz 4 — CorBot (H2–H3)

Referans: `corteqs-corbot-protokolu-v1.md` ve `corbot-is-talebi-baris.md` (28.09). **Bu iki dosyanın panoda REV kaydı yok**; REV-061'in (Search ve AI Bot) altına bağlanmalı ya da yeni REV açılmalı.

| ID | İş (tek cümle) | Kaynak · REV | Durum |
|---|---|---|---|
| L4.1 | CorBot widget'ı her sayfada açılsın ve hangi sayfada olduğunu (route) sunucuya iletsin. | Rol Modeli §7 + protokol · REV-061 | [ ] |
| L4.2 | RAG içeriğini yükle: paket/fiyat metni (İnşa Notları tek kaynak), 6 aile kılavuzu, rol kartları, Dijital Gruplar politikası ve Rehber Motoru'nun 20 makalesi (`match_guide_chunks()`). | Protokol · **REV-088** + REV-090 (01_politika) | [ ] |
| L4.3 | Onboarding akışı: kayıt sonrası "Profilini iki dakikada dolduralım, sonra Cadde'ye çık"; rol başvurusunda hangi belgenin gerektiğini söylesin. | 23.09 + 21.09 · REV-082 + REV-058 | [ ] |
| L4.4 | Maliyet ve güvenlik: kullanıcı başına günlük soru limiti, cevapsız oranı ölçümü, cevap veremeyince insan desteğine devir. | Protokol · YENİ REV | [ ] |
| **L4.5** | Yeni ziyaretçiye asistan ikonunun yanında ~2 sn'lik karşılama balonu göster: oturum başına bir kez, tıklanınca sohbet açılır, mobilde içeriği kapatmaz. | **REV-099** | [ ] |

**Lansman dışı:**

- WhatsApp "CorBot Personal" katmanı (günlük özet, bildirimler).
- REV-098 (WhatsApp bot API key + test) paralel hatta test olarak sürer, lansmanı beklemez. Pricing'de "Yakında" kalır (REV-101).
- Meta 1 Ekim 2026'dan itibaren servis penceresi ve utility şablon mesajlarını ücretlendiriyor. Bu yüzden WhatsApp katmanı tek mesajlık özet mimarisiyle ayrı fazda açılır.
- REV-097 (admin menü numarası + bot) iç araç; paralel hat.

**Kabul:**

- Pricing sayfasında "Standart ile Premium farkı ne?" sorusuna İnşa Notları ile birebir aynı cevap verir.
- Bilmediği soruda uydurmak yerine devreder.
- Karşılama balonu her sayfa geçişinde tekrar çıkmaz.

---

## 8. Faz 5 — Çarşı (koşullu, H3)

27 Ağustos kararıyla Çarşı lansman dışıydı (yasal ve dolandırıcılık riski). **Üç koşul birlikte sağlanırsa** lansmana girer, biri bile eksikse "Yakında" + ön kayıt ile açılır:

1. İlk yazışmadaki yasal ve etik uyarı metni hukukçudan geçmiş olmalı.
2. İlan limiti istemcide değil sunucuda uygulanmalı.
3. Her ilanda "Şikâyet et" butonu ve admin moderasyon kuyruğu çalışmalı.

| ID | İş (tek cümle) | Kaynak · REV | Durum |
|---|---|---|---|
| — | Yeni kategoriler (Pet Bakıcısı, Depo, Garaj/Otopark, Son Dakika Ücretsiz) ve Evim-Evin bandı. | REV-094 P1–P3 | [x] |
| L5.1 | Mevcut hataları kapat: hero video Lovable'a özel yol, kartlar 404, sabit 2 sütun liste, demo tekrarı, 5 ilan limitinin yalnız istemcide olması, yönetimin yalnız bireysel profilde olması. | REV-092 "Mevcut hatalar" (F0) | [ ] |
| L5.2 | İlan oluşturma (6 foto + 1 video + açıklama + fiyat), ön kart ve `/carsi/ilan/:id` detay sayfası; tüm kullanıcı tipleri ilan verebilsin. | REV-092 F1 + REV-036 + REV-020 | [ ] |
| L5.3 | Misafir liste ve ön kartları gezsin; detaya veya mesaja tıklayınca kayıt modali açılsın. | REV-092 B3 | [ ] |
| L5.4 | Detaydan tek tıkla platform içi yazışma; ilk yazışmada kapatılabilir yasal uyarı kartı; her mesaj `carsi_message` bildirimi üretsin. | REV-092 F2 | [ ] |
| L5.5 | Panelde "🛍 Çarşı · İlan ver · Puan kazan" sekmesi ve detay kartta onaylı "Çarşı'da eşyalarım var" işareti. | REV-092 F3 (REV-071 ✅ panel sekmesi temel alınır) | [ ] |
| L5.6 | İlan başına bir kez 15 puan yazılsın (L0.5 defterine); 24 saatte silinen ilanın puanı geri alınsın. | REV-092 F3 | [ ] |
| L5.7 | Ücretli öne çıkarma (2/4/10 €) lansmanda kapalı kalsın; öne çıkarma yalnızca ödül olarak (görev/puan karşılığı) verilsin. | REV-092 F4 + 29.09 ödül kararı | [ ] |
| **L5.8** | Koşul 3 için: şikâyet + otomatik askıya alma, admin Çarşı moderasyon kuyruğu ve yasaklı kelime listesi. Çarşı'daki etiketler ilgili kategoriye götürsün. | **REV-092 F5** + REV-027 | [ ] |

---

## 9. Lansman dışı ve paralel hat

### 9.1 Paralel hat (lansmanı beklemez, Faz sırasını bozmaz)

| REV | Ö | İş | Neden paralel |
|---|---|---|---|
| REV-091 | 10 | Ekip/Kariyer sayfası + admin KADRO → EKİP | Ürün deneyimine dokunmuyor; kendi SQL ve HTML'i hazır. **Puan çakışması: K10** |
| REV-105 | 9 | Footer'a CorteQS Global linki | 15 dakikalık iş; herhangi bir boşlukta girer |
| REV-077 | 9 | Biz Kimiz metin düzeltme + Katılım Çağrısı | İçerik işi; lansman öncesi girmesi iyi olur |
| REV-090 | 9 | Dijital Gruplar motoru (M0–M5, S1–S4) | Kendi sırası var; S1–S2 hazırsa lansmana girer, değilse REV-055 ✅ sürümüyle devam edilir |
| REV-098 | 9 | WhatsApp bot test | Test ortamında sürer; pricing'de "Yakında" |
| REV-089 | 9 | Muhasebe ekstre motoru | İç araç |
| REV-076 | 7 | Üye veritabanı filtresi + "Diaspora Üyesi" etiketi | Admin iç araç |
| REV-097 | 7 | Admin menü numaraları | Admin iç araç |
| REV-067, REV-078 | 9 / 7 | Revizyon panosuna dosya yükleme, sekme değişince editörün kapanmaması | Ekibin kendi aracı; Barış'ın hızını artırır, erken girmesi faydalı |
| REV-007 | 5 | Profil açıklamalarındaki yazım hataları | Kod dondurma öncesi metin taraması |

### 9.2 Lansman dışı (bilinçli olarak park edildi)

| REV | Ö | İş | Gerekçe |
|---|---|---|---|
| REV-104 | 8 | Creator Studio / Influencer paneli | Ayrı ürün. Lansmanda yalnız pricing'deki Influencer şeridi e-postaya gider; `/creator` Faz 0 landing'i Kasım'da |
| REV-087 | 7 | Venture Hub sayfası | Lansman kapsamı dışı; pricing'de "Start-up'lar ücretsiz" notu yeterli |
| REV-083 | 7 | Taşınma Motoru (özet, indirme, "Taşınma Planlarım" sekmesi) | Önce REV-079 hatası; motor lansman sonrası |
| REV-044 | 5 | Relokasyon motoru "Yakında" bandı | L0.7 ile birlikte uygulanır |
| REV-042, REV-021 | 5 | Billboard / sponsorlu talep, ilan verme | Stripe sonrası; K6 kararına bağlı |
| REV-039, REV-040 | 5 | Radar experimental, haritada daha çok nod | Görsel iyileştirme |
| REV-001, 003, 005, 014, 034 | 5 | Araçlar ("Hangi Ülke Sana Uygun") iyileştirmeleri | Lansmanın ana akışı değil |
| REV-030, REV-048 | 5 | Cadde görsel dili, tagline | Tasarım tartışması; lansmanı bloklamaz |

Diğer park edilenler: Dart haritası, Evim-Evin ev kiralama, çoklu ticari rol, değerlendirme ve yorumlar, WhatsApp CorBot Personal, DLT turnuvası. Stripe abonelik çekirdeği (Kurucu 1000 → Standart → Premium; REV-093 Prompt B) Kasım–Aralık'ta ayrı hat olarak yürür ve 1 Ocak 2027'den önce bitmeli. REV-102'nin kilit ve hatırlatma kısmı da bu hatta.

### 9.3 İptal edilenler (panoda "İptal")

REV-011 (hero klişe), REV-018 (8 kıta), REV-025 (Şehir elçisi araması), REV-028 (Taşınma linki). Plana alınmadı.

---

## 10. Burak'ın kararı gerekenler

| # | Karar | Etkilediği iş |
|---|---|---|
| K1 | Lansman tarihi 1 Kasım 2026 mı (Sezon 1 ile aynı gün)? | Takvimin tamamı |
| K2 | Çarşı üç koşulu geçemezse "Yakında" ile açılmayı kabul ediyor musun? | Faz 5 |
| K3 | Cadde lansmanda kıta bazında mı açılıyor (kıta → ülke 1000 kullanıcıda → şehir etiketi)? 29.09'da "olgunlaşınca hatırlat" demiştin. Akış filtresini ve REV-050 hatasının çözümünü değiştirdiği için şimdi karar gerekiyor. | L2.8, L2.10, L3.2 |
| K4 | Persona hesaplar (Muhtar, İK Masası) lansmanda olacak mı, yoksa yalnız resmi CorteQS hesabı mı? REV-086'daki bot kullanıcılar bu kararla birleşir; öneri: etiketli persona. | L2.9 |
| K5 | Rol Temel Modeli Bölüm 4 (aile, modül, doğrulama seviyesi) ve REV-100 tablosundaki sarı (ÖNERİ) uzmanlıkların onayı. | L1.4, L1.5 |
| K6 | Lovable planındaki sağ kolon "Billboard", 27.08 "sağ kolonda banner yok" kararıyla çelişiyor mu? Billboard içerikse kalır, reklamsa kalkar. | L2.8, REV-042 |
| K7 | Sponsor kahve için ilk pilot şehir/ülke hangisi? Sayaç o şehirde öne çıkar. | L2.6 |
| **K8** | **REV-106 paywall'u lansmanda mı açılıyor?** REV-101/102'de tüm kilitler 1 Ocak 2027'de başlıyor; REV-103 ise ilk 6–12 ay traction öncelikli. Lansman günü iş arayan bireysele 5 ilan sınırı koymak bu iki kararla çelişiyor. Öneri: yetki ve sayaç şimdi kurulsun, kilit `LOCK_FROM=2027-01-01` ile açılsın. | L1.11, L1.9 |
| **K9** | **Cafe kapasitesi:** REV-004 ✅ ile canlıda 50–100–250–500–999 seçenekleri var. İnşa Notları ise Standart 100 / Premium 1000 diyor. Hangisi geçerli? | L2.7 |
| **K10** | **Panodaki puan ile lansman sırası çakışmaları.** REV-091 Kariyer (Ö10) paralel hatta. REV-104 Creator (Ö8) ve REV-087 Venture Hub (Ö7) lansman dışında. Buna karşılık Ö5 olan REV-052 (arama), REV-054 (profil silme), REV-023 (aramada admin), REV-026/050 (Cadde hataları) ve REV-012 (marka adı) lansman çekirdeğinde. Öneri: bu altı kaydın puanı Ö9'a çıkarılsın. Profil silme AB'de KVKK/GDPR silme hakkı için de gerekli. | Pano önceliği |
| **K11** | **Rol sekmesi adı:** v1 "Rol ve Paket" diyordu, REV-100 "Rol Talepleri" diyor. Plan REV-100'e göre güncellendi. Paket bilgisi ayrı bir "Paketim" sekmesinde mi durur? | L1.4, L1.7 |
| **K12** | **REV-093'teki "ilk 12 ay" başlangıcı:** kayıt tarihinden mi, 1 Ocak 2027'den mi? Barış'ın notunda öneri 1 Ocak 2027; karar verilmeden faturalama kurulmaz. | L1.9, Stripe hattı |
| **K13** | **Dijital Gruplar lansmana hangi sürümle giriyor?** REV-103 bunu çekirdek ücretsiz işlev sayıyor; REV-090 motoru ise M0–M5 + S1–S4 ile uzun bir sıra. | L1.12, 9.1 |

---

## 11. Prompt şablonu (Barış için)

Her `L` satırı aşağıdaki kalıba tek prompt olarak girer. Bir prompt'ta birden fazla L işi birleştirilmez. Bağlı REV'in açıklaması ve Drive dosyaları prompt'a referans olarak eklenir; REV'deki kabul kriteri plandakiyle çelişirse REV'e yorum yazılır.

```
# [L-ID] [İş başlığı]
Bağlam: CorteQS canlı site (corteqs.net). Referans: CORTEQS_LANSMAN_HAZIRLIK_PLANI_v2.md, [REV-0xx açıklaması], [Drive dosyası].
Görev: [plandaki tek cümle, aynen]
Dokunma: [bu işle ilgisi olmayan tablolar/bileşenler; çalışan auth, RLS, edge function'lar]
Veri: [yeni tablo/kolon varsa adı ve RLS kuralı]
Kabul kriterleri:
- [ilgili fazın Kabul satırından]
- [REV'deki KABUL KRİTERİ satırından]
Test: [iki tarayıcı / misafir + üye / mobil 380px]
Bitince: İnşa Notları'nda ilgili satırı [x] yap, Revizyon İstekleri'nde REV'i "Yapıldı" yap; YENİ REV ise önce kaydı aç.
```

---

## Ek A — REV → L eşleme dizini

| REV | Ö | Durum (pano) | Plandaki yeri |
|---|---|---|---|
| REV-106 | 10 | Açık | L1.11 · K8 |
| REV-105 | 9 | Açık | 9.1 |
| REV-104 | 8 | Açık | 9.2 |
| REV-103 | 8 | Açık | L1.3, L1.12, L1.13 |
| REV-102 | 9 | Açık | L1.7, L1.10 (kilit: Stripe hattı) |
| REV-101 | 9 | Açık | L1.9 |
| REV-100 | 10 | Açık | L1.4 |
| REV-099 | 5 | Açık | L4.5 |
| REV-098 | 9 | İnceleniyor | 9.1 |
| REV-097 | 7 | Açık | 9.1 |
| REV-096 | 10 | İnceleniyor | L0.6 |
| REV-095 | 8 | Açık | L0.5, L1.14 |
| REV-094 | 9 | Açık | L0.5, L1.8, Faz 5 [x] |
| REV-093 | 10 | Açık | L1.9 · K12 |
| REV-092 | 9 | Açık | L0.3, L0.5, L5.1–L5.8 |
| REV-091 | 10 | İnceleniyor | 9.1 · K10 |
| REV-090 | 9 | İnceleniyor | L4.2, 9.1 · K13 |
| REV-089 | 9 | İnceleniyor | 9.1 |
| REV-088 | 9 | Açık | L3.3, L4.2 |
| REV-087 | 7 | Açık | 9.2 |
| REV-086 | 9 | Açık | L2.9 · K4 |
| REV-085 | 9 | Açık | L2.1, L2.2, L2.5 |
| REV-083 | 7 | Açık | 9.2 |
| REV-082 | 8 | Açık | L0.2, L4.3 |
| REV-079 | 10 | İnceleniyor | L0.7 |
| REV-078 | 7 | Açık | 9.1 |
| REV-077 | 9 | Açık | 9.1 |
| REV-076 | 7 | Açık | 9.1 |
| REV-073 | 8 | Açık | L1.4 |
| REV-070 | 8 | Açık | L1.6 |
| REV-069 | 9 | Açık | L1.13 |
| REV-068 | 8 | Açık | L1.6 |
| REV-067 | 9 | Açık | 9.1 |
| REV-066 | 9 | Açık | L1.13 |
| REV-061 | 9 | Açık | L3.1, L3.4, L4.1 |
| REV-058 | 9 | Açık | L1.5, L4.3 |
| REV-054 | 5 | Açık | L1.6 · K10 |
| REV-052 | 5 | Açık | L3.2 · K10 |
| REV-050 | 5 | İnceleniyor | L2.10 · K3 |
| REV-045 | 5 | Açık | L1.3 |
| REV-044 | 5 | Açık | L0.7 |
| REV-036 | 5 | İnceleniyor | L5.2 |
| REV-032 | 5 | Açık | L2.9 |
| REV-029, REV-002 | 5 | İnceleniyor | L2.11 |
| REV-027 | 5 | Açık | L5.8 |
| REV-026 | 5 | İnceleniyor | L2.10 |
| REV-024 | 5 | Açık | L3.5 |
| REV-023 | 5 | İnceleniyor | L0.8 |
| REV-020 | 5 | Açık | L5.2 |
| REV-019 | 5 | Açık | L3.2 |
| REV-016 | 5 | İnceleniyor | L2.12 |
| REV-015 | 5 | Açık | L2.12 |
| REV-013 | 5 | İnceleniyor | L2.8 |
| REV-012 | 5 | İnceleniyor | L2.11 |
| REV-008 | 5 | Açık | L1.1 |
| REV-007 | 5 | Açık | 9.1 |
| REV-006 | 5 | İnceleniyor | L2.8 |
| Diğer Ö5 (Temmuz) | 5 | Açık | 9.2 |

**Tamamlananlardan plana temel olanlar:** REV-057 Profil ön kart (L1.1), REV-071 Panelde Çarşı sekmesi (L5.5), REV-055 Dijital grup ekleme (9.1), REV-004 Cafe kapasitesi (K9), REV-084 Cadde hata, REV-064/080 Founders 1000.
