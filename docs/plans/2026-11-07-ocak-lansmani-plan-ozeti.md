# 1 Ocak Lansman Planı — Özet (Barış için)

7 Kasım 2026 · Ayrıntılı plan: `sharded-bubbling-tower.md` (repoda yok)

## Bir paragrafta

Burak'ın 4 Kasım planı (B0–B7) yerinde incelendi: canlı veritabanı, Lovable kodu, Drive ekleri
ve depodaki Ekim planları okundu. Plan sağlam bir iskelet. Ancak Ekim'de alınmış kararları ve
zaten yapılmış işleri görmüyor; birkaç yerde de kendi kurallarımızla çelişiyor. Önerim: işi
**22 küçük batch**e (L0–L21) bölmek. Her batch bittiğinde yapılanlar Güncellemeler'e yazılır ve
18:00 özet mailiyle sana ve Burak'a gider. **Başlangıç, clean-code planı bitince.**

## İncelemede en önemli 10 bulgu

1. **Fiyat modeli üç yerde farklı.** 5 Ekim kararı "Kurucu 1000 = 99 € değil, Pro 25/50/75 €"
   diyor. 4 Kasım planı "Standart €1, Premium €9,50, Kurucu €99" diyor. Gelir Modeli Matrisi
   ise üçüncü bir model gösteriyor.
2. **Rol değişikliği (REV-100) sanıldığı kadar büyük değil.** 180 üyenin 152'si bireysel; rol
   değişikliği yalnız 22 kişiyi etkiliyor. 5 Ekim kararı "toplu göç yok" diyor. 3 adımlı rol seçici
   zaten yazılmış ama hiçbir yere bağlanmamış.
3. **Telefon doğrulama yazılmış ama kapalı.** WhatsApp ile kod gönderme kodu Ekim'de hazırlandı.
   Canlıda kanca kapalı ve fonksiyon deploy edilmemiş; doğrulanmış telefon sayısı 0. Meta işletme
   doğrulaması bekleniyor.
4. **Pasaport'un "+90 alamaz" kuralı mevcut bir kuralla çelişiyor.** Kural "telefon kodundan ülke
   çıkarılmaz" diyor ve bir test bunu kilitliyor. Puanlama Matrisi ise Pasaport'u "admin onayı"
   diye tanımlıyor.
5. **"Canlı" sayılan iki sekme aslında boş ya da demo.** İş İlanlarındaki 6 ilanın hepsi demo.
   Etkinlikler'de toplam 1 kayıt var.
6. **Plandaki bazı işler zaten yapılmış.** 24 saat cafe canlıda varsayılan ayar. Çarşı'nın 5
   ilan sınırı veritabanında zaten var. Arama, kilitler, bot ve toplu içe aktarma da mevcut;
   plan bunları sıfırdan yapılacakmış gibi anlatıyor.
7. **Etkinlik onayı.** 6 Ekim'de "herkes için otomatik yayın" kararı verilmiş; REV-103 ise "ilk
   etkinlik onaya düşer" diyor.
8. **Canlıda demo ödeme ekranı var.** Hizmet talebi formunda sahte bir Stripe ekranı (€19)
   duruyor.
9. **Kurucu 1000 butonu 404 verir.** Önizlemedeki buton `/founders-1000`'e gidiyor; bu adres
   sitede yok.
10. **Lovable'dan taşınmaması gerekenler.**
    - Reklam ödemesinde tutar tarayıcıdan geliyor (güvenlik açığı).
    - Ana sayfa araması sonuç uyduruyor.
    - Demo telefon kodu var.
    - Ünlü fotoğrafları var.
    - Hero animasyonu performansı bozabilir.

## Verdiğin kararlar (7 Kasım)

- Senin sürümün **Claude Docs** dokümanı olacak. Burak'ın dokümanına dokunulmayacak.
- Fiyatlar **tek bir ayar dosyasından** okunacak. Hangi model geçerli, 9 Kasım'da belli olacak.
- **Clean-code planıyla çakışmalar:**
  - Rol seçici silinmeyecek; yalnız statik veri silinecek.
  - `plans.ts` kalacak.
  - Profil, Cadde ve etkinlik formunun büyük ayrıştırması Ocak'a kalacak.
  - Prettier toplu biçimlendirme commit'i lansman kodundan önce atılacak.

## 9 Kasım'da kapanması gereken 14 karar

| # | Karar | Önerim |
|---|---|---|
| 1 | Fiyat modeli | 4 Kasım önizlemesi, ayar dosyasından |
| 2 | "İlk 12 ay" ne zaman başlar | 1 Ocak 2027 |
| 3 | Kilitler ne zaman | Ödeme 1 Ocak, kilitler 1 Şubat |
| 4 | Pasaport ve +90 kuralı | Telefon kodu; +90 kuralı kalkar |
| 5 | Etkinlik onayı | Otomatik yayın kalır |
| 6 | Rol göçü + 19 öneri satırı | Göç yok; 19 satır onaylı |
| 7 | Cafe süre/kapasite | 24 saat herkese 19 Mayıs'a kadar; 100/1000 kişi |
| 8 | Çarşı açılışı, ücretli öne çıkarma | Açılır; öne çıkarma lansmanda kapalı |
| 9 | Evim-Evin'e depo/garaj | Tek ek adım |
| 10 | İş İlanları demo verisi | Silinir, "Yakında" |
| 11 | Kurucu 1000 adresi | `/founding-1000` kalır, eski adres yönlenir |
| 12 | vision.corteqs.net hangi proje | CORTEQS+; admin sayfaları kapatılır |
| 13 | URL'ler | Mevcut adresler korunur |
| 14 | Venture Hub ve /creator | Yalnız "Yakında" + bekleme listesi |

## Batch yol haritası

| Ne zaman | Batch | Ne yapılır |
|---|---|---|
| Hemen (kod yok) | **L0** | Tutarsızlık raporu, ajan planı, senin Docs sürümün, ilk Güncellemeler kaydı |
| 9–10 Kas | **L1** | 9 Kasım kararlarının kaydı, REV listesinin güncellenmesi |
| — | **Kapı** | Clean-code'un Prettier commit'i beklenir |
| Sprint 1 (10–22 Kas) | **L2** | Demo sızıntıları: sahte ödeme ekranı, demo ilanlar, Kurucu 1000 linki |
| | **L3** | Güvence testleri: regresyon, performans bütçesi, "Lovable'dan gelmesin" listesi |
| | **L4** | Yeni 7 başlıklı menü + "Yakında" sayfa kabukları |
| | **L5** | Ana sayfa hero'su ve arama çubuğu (performansı bozmadan) |
| | **L6** | Rol Talepleri (REV-100): hazır seçicinin bağlanması |
| | **L7** | Yeni fiyat sayfası (ödemesiz, "ön kayıt") |
| | **L8** | staging ve vision alt alan adları için nginx |
| | **L9** | Diaspora Pasaportu (Meta onayı gelince) |
| Sprint 2 (23 Kas – 6 Ara) | **L10** | Profil tamamlama maili + profilde geri bildirim sekmesi |
| | **L11** | Cadde yeni görünüm + cafe kuralları sunucuda |
| | **L12** | Çarşı: 14 kategori, açılış |
| | **L13** | Evim-Evin anketi |
| | **L14** | Stripe abonelik (başlangıç) |
| | **L16** | CorBot: site haritası ve kılavuz (başlangıç) |
| Sprint 3 (7–20 Ara) | **L14–L16** | Stripe bitiş, reklam + kilitler, bot bitiş |
| | **L17** | Venture Hub / Transfer / Creator "Yakında" sayfaları + bekleme listesi |
| | **L18** | Menü taşımaları, dizin düzenleri, küçük REV'ler |
| | **L19** | Araştırma kayıtlarını içe aktarma + araştırma skill'i |
| 21–31 Ara | **L20** | Kod dondurma, tam test, 30 Aralık son karar, 1 Ocak yayın |
| Ocak | **L21** | Ertelenenler (büyük dosya ayrıştırmaları, "olursa iyi" işler) |

**Burak'ın takviminden iki fark:**
- Fiyat sayfası ödemesiz çalışabildiği için Sprint 1'e çekildi.
- Stripe, en riskli iş olduğu için Sprint 2'de başlıyor; son iki haftaya sıkışmıyor.

## Her batch'te ne olur

1. Önce ölçülür: rakamlar ezberden yazılmaz.
2. Geri dönüş için bir git etiketi (tag) atılır.
3. Önce test, sonra kod yazılır.
4. Kodu başka bir ajan "çürütmeye çalışarak" inceler.
5. Bütün kontroller yeşil olmadan commit yapılmaz.
6. **Güncellemeler kaydı** yazılır: Kısaca / Ne yapıldı / Sizden beklenen / Bilmeniz gereken. Kayıt 18:00 mailiyle sana ve Burak'a gider.
7. Commit yalnız ilgili dosyalarla yapılır. Push senin onayınla olur.

## Senden beklenenler (Claude'un yapamadıkları)

- **Deploy ve DNS:** her batch'in deploy'u (Coolify); staging ve vision alt alan adları.
- **Stripe:** hesap ve doğrulama, vergi (Stripe Tax).
- **Meta:** işletme doğrulaması. Telefon doğrulama ve WhatsApp buna bağlı.
- **Canlıda açma:** telefon kancası, Çarşı görünürlüğü, migration'lar.
- **Burak ve ekipten gelecekler:** kullanım kılavuzu, e-posta metinleri, Transfer görseli, 30 soruluk bot test seti.
- **Hukuk:** Çarşı metni, aday profiller, ücretli dönem şartları.

## Riskler

- **Ödeme:** Stripe hesabı ve vergi kaydı gecikirse 1 Ocak'ta ödeme açılamaz.
- **Telefon doğrulama:** Meta onayı gecikirse Pasaport ve ona bağlı her şey kayar.
- **Clean-code çakışması:** iki oturum aynı dosyalara dokunuyor; dört karar bunu bölüyor. Clean-code bitmeden lansman kodu başlamaz.
- **Performans:** Lovable görünümü sayfayı ağırlaştırabilir. Her batch performans bütçesiyle kontrol edilir.

## Sıradaki adım

1. Clean-code planı bitince haber ver.
2. Önce depoyu ve canlıyı yeniden ölçerim. Dosya yerleri ve rakamlar değişmiş olacak.
3. Planı buna göre güncellerim.
4. Senin onayınla L0 başlar.
