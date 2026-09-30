# Burak'a toplu soru maili — 14 Eylül 2026

> Bu dosya **gönderilecek mailin metnidir**. Aşağıdaki bölümü olduğu gibi kopyalayıp
> gönderebilirsin. Soruların hepsi şıklı; Burak sadece harfleri yazarak cevaplayabilir.
>
> Kaynaklar: Komuta Merkezi acil listesi (Top 10 Hot Fix), Perşembe toplantısı hazırlık
> notu (`2026-09-17-persembe-burak-toplantisi.md`) ve 14 Eylül'de canlı veritabanından
> yapılan ölçümler.

---

**Konu: 9 karar bekliyor — çoğu tek harfle cevaplanabilir**

Selam Burak,

Aşağıda senden karar bekleyen her şeyi tek yere topladım. Hepsi şıklı — okuyup
**"1-B, 2-A, 3-C…"** diye cevap yazman yeterli. Açıklama eklemek istersen tabii ki daha
iyi ama şart değil.

**Acil olanlar 1, 2 ve 5.** Diğerleri bekleyebilir.

---

## 1) Google ile giriş ekranındaki çirkin adres — AYLIK EK ÜCRET ONAYI ⚠️ acil

Şu an Google ile giriş yapan üye şunu görüyor: *"injprdrsklkxgnaiixzh.supabase.co
uygulamasında oturum açın"*. Güven vermiyor. Düzeltmek için Supabase'de ücretli bir
eklenti (Custom Domain) açmamız gerekiyor. **Tam tutara henüz bakmadık**, onayın olursa
önce fiyatı öğrenip sana söyleyeceğiz.

**1a. Aylık ek maliyeti prensipte onaylıyor musun?**
- **A)** Evet, fiyatı öğrenin ve uygunsa açın
- **B)** Evet ama önce tutarı bana söyleyin, ondan sonra karar veririm
- **C)** Hayır, şimdilik böyle kalsın

**1b. Adres ismi ne olsun?**
- **A)** `auth.corteqs.net`
- **B)** `login.corteqs.net`
- **C)** `giris.corteqs.net`

---

## 2) "Etkinlikler" özelliği — tam olarak ne demek istedin? ⚠️ acil

Bu senin önerindi ("kolayca ekleyebileceğimiz, kullanıcı çekecek bir fonksiyon") ama
aklındaki şeyin ne olduğu netleşmedi ve o yüzden iş tanımlanamıyor. Hangisi?

- **A)** Cadde'de normal paylaşım gibi, ama tarihi ve yeri olan bir paylaşım
- **B)** Etkinliklerin takvim/liste hâlinde göründüğü ayrı bir sayfa
- **C)** Zaten var olan Cafe'nin "şu gün şu saatte" versiyonu
- **D)** Başka bir şey → bir iki cümleyle anlat

*Not: diğer üç karar zaten verildi — etkinliği onaylı kişiler (şehir elçileri,
katkıcılar) oluşturabilecek, kullanıcı "geleceğim" diyebilecek, Cadde'deki Etkinlikler
süzgeci içerik üretilmeye başlayınca geri gelecek. Senden sadece yukarıdaki vizyon lazım.*

---

## 3) Profil sayfasındaki menü

Sağdaki sabit kolonu sola alıp içine "Kişisel Bilgiler / İletişim / İlgi Alanları" gibi
tıklanınca o bölüme atlayan bir liste koymayı düşünüyoruz. Amaç: kullanıcı profili baştan
sona kaydırmak zorunda kalmasın.

**3a. Telefonda ne olsun?** (dar ekranda sabit kolona yer yok)
- **A)** Küçük bir "Bölümler ▾" açılır şeridi koyalım
- **B)** Telefonda hiç göstermeyelim

**3b. Sol kolona geçince sayfanın geri kalanı sağa kayacak. Senin tasarımında sorun olur mu?**
- **A)** Sorun değil, geçin
- **B)** Sorun olur, sağda kalsın

**3c. Nerede uygulayalım?**
- **A)** Sadece kendi profilini düzenleme ekranında
- **B)** Başkasının profilini görüntülerken de

*Bizim tavsiyemiz: 3a-A, 3b-A, 3c-A.*

---

## 4) WhatsApp grupları — ÖNCE BİR DÜZELTME

**Özellik zaten canlı ve çalışıyor.** Acil listede "yapılacak" gibi duruyordu ama
ölçtük: şu an sistemde **10 onaylı grup** var, üye ekleyebiliyor, yönetici onaylıyor.
Yani sıfırdan kurulacak bir şey yok — sadece kuralları netleştirmemiz lazım.

Ama ölçüm iki tane gerçek sorun gösterdi:

**Sorun 1 — şehir bilgisi hiç çalışmıyor.** 10 grubun **10'unda da** şehir alanı "Genel"
yazıyor. Yani şehir bazlı arama/filtreleme fiilen ölü.

**4a. Ne yapalım?**
- **A)** Şehir alanı zorunlu olsun, grup eklerken listeden seçilsin
- **B)** Şehir alanını tamamen kaldıralım, sadece ülke kalsın
- **C)** Olduğu gibi kalsın, sorun değil

**Sorun 2 — ülke alanı karışık.** Şu an içinde şunlar var: "GCC", "Global", "KATAR",
"İstanbul" (bu bir şehir), "EU+MENA", "GCC-Global". Herkes aklına geleni yazmış.

**4b. Ne yapalım?**
- **A)** Sabit ülke listesinden seçilsin (serbest yazı kalksın)
- **B)** Ülke + "bölge" diye iki ayrı alan olsun (GCC, EU+MENA gibi şeyler bölgeye gitsin)
- **C)** Olduğu gibi kalsın

---

## 5) WhatsApp grup ekleme politikası ⚠️ acil — bu olmadan moderasyon keyfî ilerliyor

Şu an grup ekleyen kişinin o grubun yöneticisi olup olmadığını sormuyoruz, kontrol de
etmiyoruz. Kural yazılı değil.

**5a. Grubun yöneticisi olmayan biri o grubu ekleyebilsin mi?**
- **A)** Evet, ekleyebilsin — biz moderasyonda bakarız
- **B)** Evet ama "bu grubun yöneticisi değilim" diye işaretlensin, öyle yayınlansın
- **C)** Hayır, sadece grup yöneticisi ekleyebilsin

**5b. Davet linki herkese açık olan gruplar için onay akışı?**
- **A)** Otomatik yayınlansın, sonradan şikâyet gelirse bakarız
- **B)** Yönetici onayından geçsin (bugünkü davranış)

**5c. Kapalı gruplar (linki herkese açık olmayan) için?**
- **A)** Hiç kabul etmeyelim
- **B)** Kabul edelim ama grup yöneticisiyle elle iletişim kurulsun
- **C)** Kabul edelim, link olmadan sadece tanıtım kartı olarak dursun

**5d. Bir grubu reddetme sebebimiz ne olabilir?** (birden fazla seçebilirsin)
- **A)** Siyasi/dini propaganda
- **B)** Ticari spam / sadece satış amaçlı
- **C)** Diaspora ile ilgisiz
- **D)** Üye sayısı çok düşük
- **E)** Yönetici bilgisi yok / doğrulanamıyor

---

## 6) Contributor toplantısı — tarih

Toplantı hazırlığındaki işler (gündem, vizyon anlatımı, tanışma soruları, moderasyon)
sende görünüyor ama tarih belli değil, o yüzden hiçbiri başlamıyor.

**6a. Toplantıyı ne zaman yapalım?**
- **A)** Bu hafta
- **B)** Önümüzdeki hafta
- **C)** 19 Mayıs işleri bitsin, sonra

---

## 7) Bunlar iptal edildi — itirazın var mı?

13 Eylül'de yapılacaklar panosunu baştan sona temizledik. Aşağıdakiler "artık geçerli
değil" denip kapatıldı. **Silinmediler**, istersen geri açarız:

Clemta CEO'su ile affiliate toplantısı · Ambassador bulma süreci · Seren Uzluer marketing
paketi · gerilla paylaşım planı · sosyal medya hesaplarının tamamlanması · sosyal medya
içerik yöneticisi rolü · Dubai HR grubu postu · Tahsin grubu lansman postları · 19 Mayıs
faaliyet postları · Almanya'daki dernek üyeleriyle yazışma · Cihan ile görüşme · aday
araştırması · stajyer desteği · pilot ülkelerin netleştirilmesi · veri stratejisi ·
umbrella company araştırması · Drive yapısının yeniden organizasyonu · AR-GE klasörü ·
vlogger verileri entegrasyonu · çok dilli bot tasarımı · platform giriş güvenliği araştırması

**7a.**
- **A)** Hepsi tamam, itirazım yok
- **B)** Şunlar geri açılsın: … (yaz)

---

## 8) Sana atanmış ama duran işler

Şu an sende görünen ve beklemede olan işler: contributor toplantı gündemi, CorteQS vizyon
anlatımı, Burak & Barış tanıtımı, contributor tanışma soruları, çalışma modeli mesajının
sadeleştirilmesi, toplantı moderasyonu, 19 Mayıs sosyal medya planı.

**8a. Bunlar hâlâ sende mi kalsın?**
- **A)** Evet, ben hallederim
- **B)** Bazılarını devredelim: … (yaz)
- **C)** Bir kısmı artık gereksiz, kapatalım: … (yaz)

---

## 9) Ücretli olabilecek tek konu bir kez daha

Bu mailde para gerektiren tek şey **1. maddedeki Google giriş ekranı düzeltmesi**.
Diğer hiçbir soru ek maliyet getirmiyor.

---

Kolay gelsin,
Barış

---

## (Gönderilmeyecek — bizim notumuz)

- Soru 4 ve 5'in cevapları doğrudan koda dönüşecek: form alanları, onay akışı ve
  reddetme sebepleri şu an yazılı bir kurala bağlı değil.
- Soru 2 cevaplanmadan "Etkinlikler" işi tanımlanamaz; Cadde'deki süzgeç de geri gelemez.
- Soru 1 onaylanmadan Google giriş ekranı olduğu gibi kalır.
- Acil listede bu maddeler günlerdir cevap bekliyor; mail tek seferde hepsini kapatmayı
  hedefliyor.
