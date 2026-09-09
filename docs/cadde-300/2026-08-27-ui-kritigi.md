# Cadde & Cafe — UI Kritiği

**Tarih:** 27 Ağustos 2026
**Kapsam:** Görsel tasarım katmanı — renk, tipografi hiyerarşisi, buton dili, rozetler, kart sistemi
**Not:** UX/içerik değerlendirmesi ayrı dosyada (`cadde-ux-degerlendirme.md`). Bu doküman yalnızca arayüzün görsel diliyle ilgilenir.

---

## Özet

Arayüz temiz ama kimliksiz. Sorunların hiçbiri tek başına büyük değil; hepsinin ortak kökü aynı: **tanımlı bir design-token sistemi yok.** Renkler, butonlar, rozetler ve köşe/gölge değerleri sayfa sayfa, muhtemelen prompt prompt birikmiş. Çözüm tek tek düzeltme değil, önce token dokümanını yazıp Lovable Knowledge'a koymak, sonra her bileşeni o dokümana göre hizalamak.

---

## 1. Marka rengi arayüzde kullanılmıyor

**Gözlem:** Altın (#aa8c42) yalnızca "CorteQS Cadde" rozetinde ve beta bandında görünüyor. Arayüzün geri kalanı nötr gri + rastgele aksan renkleri.

**Sorun:** Markanın en değerli görsel varlığı boşta duruyor. Logo kaldırılsa arayüzün CorteQS'e ait olduğu anlaşılmaz.

**Öneri:**
- Primary buton rengi = altın
- Aktif sekme, seçili filtre, link hover = altın
- Altını "her yerde" değil, "birincil eylem nerede ise orada" kullan — böylece hem kimlik hem yönlendirme işlevi görür

---

## 2. Buton dili dört parçaya bölünmüş

**Gözlem:** Aynı ekran setinde dört farklı buton stili:

| Buton | Stil |
|---|---|
| Caddeye Çık | Siyah dolu pill |
| Paylaş | Turkuaz dolu |
| Odaya Gir | Gri dolu |
| Cafe Aç | Beyaz outline |

**Sorun:** Kullanıcı birincil eylemi renkten okuyamıyor. Siyah mı önemli, turkuaz mı?

**Öneri:** Üç seviyeli tek hiyerarşi:
- **Primary:** altın dolu — sayfa başına en fazla bir tane
- **Secondary:** outline (nötr çerçeve)
- **Tertiary:** düz metin link

Turkuaz tamamen kaldırılabilir; palette karşılığı olmayan tek renk.

---

## 3. Üst nav — link salatası

**Gözlem:** Araçlar mavi, Feedback Ver turuncu, Profilim yeşil, Çıkış siyah. Dört link, dört renk.

**Sorun:** Stillenmemiş / varsayılan bırakılmış gibi okunuyor; göz nereye bakacağını bilemiyor.

**Öneri:** Tüm nav linkleri tek nötr renk (koyu gri). Vurgu gerekiyorsa yalnızca bir öğeye — o da muhtemelen "Geri Bildirim" (beta döneminde en çok istediğin eylem).

---

## 4. Gökkuşağı şeritler → pillar renk kodlaması

**Gözlem:** Her gönderi kartının üst kenarında gökkuşağı gradient şerit. Logodaki çok renkliliğe gönderme.

**Sorun:** Niyet anlaşılıyor ama her kartta tekrarlanınca gürültüye dönüşüyor ve kartlar arası hiyerarşiyi siliyor. Dekorasyon, bilgi taşımıyor.

**Öneri:** Gökkuşağı logoda kalsın. Kart şeritleri **pillar renk kodlamasına** dönüşsün:

| Pillar | Şerit rengi (öneri) |
|---|---|
| Cadde | Altın #aa8c42 |
| Cafe | Yeşil |
| Çarşı | Terracotta |

Böylece şerit anlam kazanır: kullanıcı hangi bağlamdaki karta baktığını renkten anlar. Bildirimler ve karışık akışlarda özellikle işe yarar.

---

## 5. Rozet envanteri kontrolsüz

**Gözlem:** Altı farklı rozet stili aynı anda dolaşımda: Canlı (yeşil), Onaylı, Resmî hesap (gri), Pinned (siyah), Startup, AÇIK BETA (altın çerçeve).

**Sorun:** Her rozet kendi kuralını icat etmiş; hiçbirinin görsel ağırlığı anlamsal önemiyle örtüşmüyor.

**Öneri:** Üç rozet tipi, üç sabit kural:

| Tip | Örnekler | Stil kuralı |
|---|---|---|
| Durum | Canlı, Sabit | Dolu renk, dinamik anlam |
| Kimlik | Onaylı, Resmî hesap | Tek ikon + nötr renk, güven anlamı |
| Kategori | Startup, Hukuk, Emlak | Outline, nötr, bilgi anlamı |

---

## 6. Dil karışıklığı

**Gözlem:** Türkçe arayüzde İngilizce kalıntılar.

| Mevcut | Önerilen |
|---|---|
| Pinned | Sabit |
| Feedback Ver | Geri Bildirim |
| Host | Ev Sahibi |

"Ev Sahibi" özellikle iyi oturuyor — Cafe metaforunun doğal uzantısı.

---

## 7. Derinlik hiyerarşisi yok

**Gözlem:** Çok yumuşak gölgeler + çok yuvarlak köşeler + açık gri zemin. Her kart aynı seviyede yüzüyor.

**Öneri:**
- Köşe yarıçapını tek değere sabitle (örn. 12px; buton pill'leri hariç)
- Gölgeyi iki seviyeye indir: kart (hafif) / yükseltilmiş kart-modal (belirgin)
- Gövde metni grisi için alt sınır: #6b7280 — daha açığa inme, kontrast AA sınırına dayanıyor

---

## 8. Cafe kartı — çelişen sinyaller

**Gözlem:** Oda kartında turuncu/amber border, içinde yeşil "Canlı" rozeti.

**Sorun:** Border'ın anlamı belirsiz ve rozetin rengiyle çelişiyor.

**Öneri:** Border'ı ya kaldır ya duruma bağla: oda canlıyken yeşil border + yeşil rozet, arşivlenince nötr. Tek sinyal, tek renk.

---

## İyi çalışanlar

- Reaksiyon ikon seti tutarlı outline ağırlığında
- Composer sade ve temiz
- Kart içi bilgi hiyerarşisi doğru: isim → konum → tarih
- Sayfa başlığındaki tek satır açıklama ("Şehrindeki Türklerle tanış…") işlevsel

---

## Uygulama: design-token dokümanı

Yukarıdaki her madde tek bir dokümana iner. Lovable Knowledge'a eklenecek içerik iskeleti:

```
## Renk
- primary: #aa8c42 (altın)
- pillar-cadde: #aa8c42 / pillar-cafe: [yeşil] / pillar-carsi: [terracotta]
- nötr skala: 50–900 arası tek gri ailesi
- metin alt sınırı: #6b7280

## Buton
- primary: altın dolu, sayfa başına 1
- secondary: nötr outline
- tertiary: metin link
- turkuaz kullanılmaz

## Rozet
- durum / kimlik / kategori — üç tip, üç sabit stil

## Yüzey
- radius: 12px (pill butonlar hariç)
- gölge: 2 seviye

## Dil
- Arayüz %100 Türkçe: Sabit, Geri Bildirim, Ev Sahibi
```

**Lovable notu:** Bu dokümanı Knowledge'a koyduktan sonra düzeltmeleri tek prompt'ta isteme. Sıra: (1) buton componenti, (2) rozet componenti, (3) nav, (4) kart şeritleri — her biri ayrı prompt, her prompt'ta "Knowledge'daki token dokümanına uy, başka dosyaya dokunma" kısıtı.
