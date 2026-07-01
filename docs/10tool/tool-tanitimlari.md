# Taşınma Araçları — Tanıtım Kılavuzu

`/relocation/tools` sayfasındaki tüm araçların kullanıcıya dönük tanıtımı. Teknik soru bankası
detayları için bkz. [relocation-tool-questions.md](./relocation-tool-questions.md).

**Toplam 17 araç:** 10 genel taşınma aracı + 7 Almanya'ya özel araç (2 DB-tabanlı soru motoru + 5
standalone hesaplayıcı/karar ağacı). Hepsi giriş yapmış kullanıcılara açık (`requires_auth: true`),
tek istisna Vatandaşlık Testi (herkese açık soru havuzu).

---

## Genel Taşınma Araçları (10)

Kategori: `relocation_assessment`. Ortak motor: soru → cevap → RPC skorlama → sonuç kartı.

### 1. Ülke Seçimi
**"Hangi Ülke Sana Uygun? — Ülke Seçimi Aracı"**
Bütçe, kariyer, dil, vize, yaşam tarzı ve topluluk önceliklerine göre taşınabileceğin ülkeleri
sıralar. 12 ülke (Almanya, Hollanda, İsveç, Kanada, İngiltere, ABD, Avustralya, Avusturya, İspanya,
Portekiz, Polonya, BAE) arasından sana en uygun olanları listeler.
- **Sonuç tipi:** Sıralı liste (ranked_list) · **Soru sayısı:** 7 hızlı / +11 detaylı (18 toplam)
- Slug: `/relocation/tools/ulke-secimi`

### 2. Meslek/Maaş Karşılaştırma
**"Mesleğiniz Dünyada Ne Kazandırıyor? — Maaş Karşılaştırma Aracı"**
Mesleğin ve hedef ülkelerine göre brüt/net maaş bandını, maliyet ayarlı alım gücünü ve iş piyasası
talep sinyalini karşılaştırır. 5 örnek meslek (Yazılım Mühendisi, İnşaat Mühendisi, Hemşire,
Muhasebeci, Öğretmen) × 8 ülke.
- **Sonuç tipi:** Karşılaştırma (comparison) · **Soru sayısı:** 5 hızlı / +7 detaylı (12 toplam)
- Slug: `/relocation/tools/meslek-maas-karsilastirma`

### 3. Taşınma Hazırlık Skoru
**"Yurt Dışına Taşınmaya Hazır mısınız? — Hazırlık Skoru"**
Finans, evrak, dil, iş, konaklama ve destek ağı boyutlarına göre taşınma hazırlığını ölçer ve
somut aksiyon listesi verir.
- **Sonuç tipi:** Skor (score, 6 ağırlıklı boyut) · **Soru sayısı:** 6 hızlı / +9 detaylı (15 toplam)
- Slug: `/relocation/tools/tasinma-hazirlik-skoru`

### 4. Şehir Eşleştirme
**"Hangi Şehir Sana Daha Uygun? — Şehir Eşleştirme Aracı"**
Hedef ülkelerdeki şehirleri bütçe, iş imkânı, yaşam tarzı, topluluk yoğunluğu ve ulaşım
tercihlerine göre sıralar.
- **Sonuç tipi:** Sıralı liste (ranked_list) · **Soru sayısı:** 7 hızlı / +9 detaylı (16 toplam)
- Slug: `/relocation/tools/sehir-eslestirme`

### 5. Diaspora Ağı Eşleştirme
**"CorteQS Diaspora Ağı Eşleştirme — Mentor ve Topluluk Matchmaker"**
İhtiyaç/teklif, şehir, meslek ve dil üzerinden seni opt-in diaspora üyeleriyle güvenli kartlarla
eşleştirir. İsim/iletişim asla otomatik paylaşılmaz — karşılıklı onaydan sonra açılır.
- **Sonuç tipi:** Eşleşme listesi (match_list) · **Soru sayısı:** 8 hızlı / +8 detaylı (16 toplam)
- **Gizlilik notu:** Rıza (consent) vermezsen havuza hiç girmezsin, hiçbir veri kaydedilmez.
- Slug: `/relocation/tools/diaspora-ag-eslestirme`

### 6. Yurtdışı Kariyer Yolu
**"Yurt Dışında Hangi Kariyer Sana Uygun? — Kariyer Yolu Aracı"**
Beceri, ilgi alanları, eğitim/sertifika alma isteği ve risk toleransına göre sana uygun yurt dışı
kariyer patikalarını (persona) önerir.
- **Sonuç tipi:** Persona · **Soru sayısı:** 7 hızlı / +8 detaylı (15 toplam)
- Slug: `/relocation/tools/yurtdisi-kariyer-yolu`

### 7. Expat Yaşam Tarzı Persona
**"Sizin Yurt Dışı Yaşam Tarzınız? — Expat Persona Quiz"**
Birkaç hafif soruyla yurt dışı yaşam tarzı personanı keşfet (network odaklı / kâşif / aile odaklı
/ sakin yaşam vb.) ve sana uygun CorteQS adımlarını gör. En kısa ve en "eğlenceli" araç.
- **Sonuç tipi:** Persona · **Soru sayısı:** 8 hızlı / +2 detaylı (10 toplam)
- Slug: `/relocation/tools/expat-yasam-tarzi-persona`

### 8. İlk 90 Gün Planlayıcı
**"İlk 90 Gün Planlayıcı — Taşınma Sonrası Görev Motoru"**
Skor yerine somut görev üretir: varış öncesi ve sonrası ilk 90 gün için öncelik sıralı, kişisel
bir görev takvimi (vize, konut, sağlık sigortası, banka, okul, dil kursu vb.).
- **Sonuç tipi:** Kontrol listesi (checklist) · **Soru sayısı:** 12 hızlı / +8 detaylı (20 toplam)
- Slug: `/relocation/tools/ilk-90-gun-planlayici`

### 9. Öncelikli Taşınma Sorunu
**"Hangi Soruna Önce Odaklanmalısın? — Öncelikli Engel Aracı"**
En çok seni zorlayan taşınma engelini (vize, iş/gelir, dil, konut, finans, evrak, yalnızlık,
diploma denkliği, sağlık gibi 9 kategoriden) bulur ve bu hafta atılacak ilk adımları gösterir.
- **Sonuç tipi:** Skor (score, 8 kategori sıralı) · **Soru sayısı:** 5 hızlı / +4 detaylı (9 toplam)
- Slug: `/relocation/tools/oncelikli-tasinma-sorunu`

### 10. İş Bulma Olasılığı
**"Yurt Dışında İş Bulma Şansınız? — İş Bulma Olasılığı"**
Meslek, hedef ülke, dil, deneyim, denklik durumu ve network sinyallerine göre açıklanabilir bir iş
bulma skoru üretir. Garanti değil, karar destek skoru olarak sunulur.
- **Sonuç tipi:** Skor (score, tek ülke odaklı) · **Soru sayısı:** 7 hızlı / +9 detaylı (16 toplam)
- Slug: `/relocation/tools/is-bulma-olasiligi`

---

## Almanya'ya Özel Araçlar (7)

Kategori: `germany_tools`. Kart üzerinde **"(Almanya)"** etiketiyle işaretlenir. Almanya'ya taşınma
sürecinde son derece pratik, ülkeye özgü finansal/hukuki araçlardır.

### 11. Banka Seçimi (Almanya)
**"Banka Seçimi (Almanya)"**
20 kısa soruyla bankacılık profilini çıkarır (dijital-mobil mi, şubeli-klasik mi, yatırım/kripto
ilgisi var mı vb.); dijital, direkt, yerel/şubeli ve yatırım odaklı 19 banka arasından
(N26, Revolut, ING, DKB, Sparkasse, Commerzbank, Deutsche Bank, Trade Republic, comdirect, bunq,
Wise ve diğerleri) sana en uygun 3 bankayı somut gerekçelerle önerir.
- **Sonuç tipi:** Sıralı liste (ranked_list, top-3) · **Soru sayısı:** 20 (tek modlu)
- Slug: `/relocation/tools/banka-secim-almanya`

### 12. Sigorta Seçimi (Almanya)
**"Sigorta Seçimi (Almanya)"**
20 soruyla 12 sigorta tipini (Sağlık, Özel Sorumluluk, Araç, Ev Eşyası, Hukuk Koruma, Gelir Koruma,
Risk Hayat, Diş, Kaza, Seyahat Sağlık, Konut Bina, Evcil Hayvan Sorumluluk) önceliklendirir:
hangisi "önce al", hangisi güçlü öneri, hangisi opsiyonel?
- **Sonuç tipi:** Sıralı liste (ranked_list, öncelik bandı) · **Soru sayısı:** 20 (tek modlu)
- Slug: `/relocation/tools/sigorta-secim-almanya`

### 13. Maaş Hesaplama (Almanya)
**"Maaş Hesaplama (Almanya)"**
Brütten nete ve netten brüte hesaplama: vergi sınıfı (Steuerklasse 1-6), eyalet, kilise vergisi,
çocuk sayısı ve sağlık sigortası türüne göre 2026 tahmini net/brüt maaş.
- **Sonuç tipi:** Deterministik hesaplayıcı (soru bankası yok, anlık hesap)
- Slug: `/relocation/tools/maas-hesaplama-almanya`

### 14. Vize Seçimi (Almanya)
**"Vize Seçimi (Almanya)"**
Birkaç soruda sana en uygun Almanya vize/oturum yolunu bulur: EU Mavi Kart, Fachkräftevisa,
Chancenkarte, BT Uzmanı vizesi, Ausbildung (meslek eğitimi), aile birleşimi ve daha fazlası —
gereken belgeler ve adımlarla birlikte.
- **Sonuç tipi:** Dallanmalı karar ağacı (soru bankası DB'de tutulmaz, sayfa içi mantık)
- Slug: `/relocation/tools/vize-secim-almanya`

### 15. Vatandaşlık Testi (Almanya)
**"Vatandaşlık Testi (Almanya)"**
Resmi BAMF Einbürgerungstest soru havuzunun tamamıyla (656 soru — Almanca + Türkçe, 16 eyalet +
genel havuz) pratik yapma imkânı. Genel havuzda pratik veya eyalete özel sorularla 33 soru/60
dakikalık gerçek sınav simülasyonu sunar.
- **Sonuç tipi:** Soru havuzu + sınav simülatörü · **Giriş şartı yok** (herkese açık)
- Slug: `/relocation/tools/vatandaslik-testi-almanya`

### 16. Para Transferi (Almanya)
**"Para Transferi (Almanya)"**
Almanya'dan Türkiye'ye para gönderirken en avantajlı yöntemi bulur: tutarını girersin, her
sağlayıcının (banka, Wise, Revolut vb.) ücreti ve kur marjı sonrası eline geçecek net TL'ye göre
sıralı karşılaştırma alırsın.
- **Sonuç tipi:** Karşılaştırma (comparison, deterministik hesaplayıcı)
- Slug: `/relocation/tools/para-transferi-almanya`

### 17. StepStone Maaş Karşılaştırma (Almanya)
**"StepStone Maaş Karşılaştırma (Almanya)"**
StepStone Gehaltsreport 2026 verilerine göre maaşını sektör, deneyim, şehir ve şirket büyüklüğü
medyanlarıyla karşılaştırır. Pazar değerini görüp maaş pazarlığına somut veriyle girmeni sağlar.
- **Sonuç tipi:** Karşılaştırma (comparison, deterministik veri karşılaştırması)
- Slug: `/relocation/tools/stepstone-karsilastirma-almanya`

---

## Sonuç Tipi (result_kind) Sözlüğü

| Tip | Kullanıcı için anlamı |
|---|---|
| `ranked_list` | Adayları (ülke/şehir/banka) puanlayıp en iyiden en kötüye sıralı liste döner |
| `score` | Tek bir yüzde/skor + bunu oluşturan boyutların dökümü |
| `comparison` | İki veya daha fazla seçeneği yan yana karşılaştırır (maaş, transfer ücreti vb.) |
| `persona` | Cevaplara göre en uygun "profil/patika" etiketini atar (hibrit sonuç da olabilir) |
| `checklist` | Skor değil, önceliklendirilmiş somut görev/adım listesi üretir |
| `match_list` | Diğer kullanıcılarla (opt-in, rızaya dayalı) eşleşme kartları döner |

## Hızlı / Detaylı Mod

Çoğu genel araç iki modludur: **hızlı** (quick) mod az soruyla kaba bir sonuç verir, **detaylı**
modda ek sorularla sonuç netleşir. Almanya'nın Banka ve Sigorta araçları tek modludur (quick =
detailed = 20 soru). 5 standalone Almanya aracının soru bankası yoktur — deterministik hesaplayıcı
veya karar ağacıdır.
