# Burak onay kuyruğu — kanıt raporu (73 madde)

**Tarih:** 5 Eylül 2026 · **Kapsam:** panoda "UBT tamamladı, Burak onayı bekliyor" durumundaki
tüm maddeler (Cadde 65 + Profil 8).

Panodaki UBT işareti bir **iddiadır**. Bu rapor her iddiayı kod ve canlı veri kanıtıyla sınadı;
ardından "kanıtlı" denen her iddia ikinci bir turda **çürütülmeye çalışıldı**. Bu ikinci tur
şart: bu depoda daha önce erişilemeyen 11 bileşen bulunmuştu, yani "kod var" ile
"kullanıcı görüyor" aynı şey değil.

## Sonuç

| Durum | Adet | Anlamı |
|---|---|---|
| ✅ Kanıtlı | **45** | Kod kanıtı var, kullanıcı canlıda görür — **Burak onayına hazır** |
| ⚠️ Kısmen | **21** | Bir kısmı yapılmış, eksiği aşağıda madde madde yazılı |
| ❌ Kanıt yok | 1 | m22 — aşağıya bak, madde kendisi geçersiz |
| 📄 Kod dışı | 6 | Pazarlama/meta madde; çıktısı belgede duruyor |

Denetim turu **8 iddiayı çürüttü** (hepsi "kanıtlı" → "kısmen").

---

## Onaya hazır 45 madde

m2, m3, m4, m5, m6, m12, m15, m18, m23, m24, m25, m26, m42, m49, m51, m52, m53, m65, m67,
m69, m72, m73, m78, m79, m80, m81, m82, m83, m84, m85, m86, m87, m88, m91, m92, m93, m98,
m102, m133 (Cadde) + profil WS1 1, 2, 3, 4, 5, 6.

---

## Çürütülen 8 iddia — neyin eksik olduğu

### m9 · Konum drill-down · **EN CİDDİ — üye paylaşımını kaybediyor**

Arayüz gerçek: paylaşım kutusunda "Ek hedef" düğmesi var ve çalışıyor. Ama sunucu tarafı
ek hedefi **reddediyor**: gereken yetki anahtarı (`cadde.post.multi_target`) yetki sözlüğüne
(`afs_features`) hiç eklenmemiş. Yetki sorgusu satır bulamayınca "yok" döner, paylaşım
`cadde_multi_target_premium_required` hatasıyla düşer.

**Neden fark edilmedi:** kontrol yöneticileri muaf tutuyor. UBT ve Burak'ın ikisi de
SuperAdmin olduğu için onlarda çalışıyor, normal üyede bozuk. Klasik "testçide çalışıyor,
üyede bozuk" tuzağı.

**Karar gerekiyor:** ek hedef ücretli özellik mi kalacak (o zaman arayüzde ücretli rozetiyle
kilitlenmeli), yoksa herkese mi açılacak (o zaman anahtar sözlüğe eklenmeli)? Şu anki hâli
ikisi de değil: kullanıcıya açık görünen ama gönderimde patlayan bir düğme.

### m11 · "Globale çıkış performans eşiğine bağlı kalacak (10 beğeni / 10 paylaşım)"

İlk yarısı ayakta: kullanıcı serbestçe "Global" seçemiyor. İkinci yarısı **canlıda ölü**:
global eşikler 10 Ağustos'ta 0/0/0 yapıldı, yani her paylaşım global katmandan geçiyor —
"performans eşiği" diye bir kapı kalmadı. Madde ya eşikler tekrar sıfırdan büyük yapılarak
ya da metni bugünkü karara göre güncellenerek kapanabilir.

### m16 · "Yeni paylaşım — yenile" bildirimi sıfırlansın

Düğme tıklayınca **anında sönüyor** (bu kısım doğru), ama **kalıcı olarak geri geliyor**:
sayım sorgusu kullanıcının şehir/ülke/etiket filtresini hiç dikkate almıyor, akış ise
dikkate alıyor. Dortmund seçili bir üye Berlin'den atılan bir paylaşımı sayımda görür,
tıklar, akışa o paylaşım girmez, sayaç yeniden dolar. Bunu yakalayan test de yok.

### m71 · "Paylaşım profilde kayıtlı ülkenin akışında gösterilecek" — **bugün düzeltildi**

Mekanizma gerçekti ama 129 üyeden 22'sinin ülkesi Cadde kataloğunda karşılık bulmuyordu.
Bugün köprü eklendi (migration `20260905120000`): çözülen üye **107 → 113**. Kalan 16 kayıt
gerçek ülke değil ("Belirtilmedi" 14 eski WhatsApp-bot kaydı, artı "a" ve "De").

### m75 · "Paylaşım gönderilemedi hatası çözülecek" — **kısmen, bugün ilerledi**

Gösterilen kanıt hatanın **mesajını** düzeltiyordu, kendisini değil. Kök neden (profil konumu
ile Cadde kataloğunun uyuşmaması) bugüne kadar açıktı; m71 ile aynı köprü bunu 6 üye için
kapattı. Kalan: konumu hiç çözülemeyen 16 üye ve konum seçmeden gönderim denemeleri.

### m66 · Kafe kartları yeni tasarıma göre düzenlenecek

Kod doğru, ama iddianın Burak'a verdiği tarif yanlış: panel **sağ rayda**, "sol kolon" diye
bir şey yok. Burak sol tarafa bakıp "yapılmamış" diyecekti. Ayrıca "N kafe daha göster"
davranışı bugün gözle doğrulanamıyor, çünkü canlıda tek kafe kaydı var.

### m99 · Reklam alanındaki "Talep bırak" ifadeleri kalksın

Çekirdeği doğru, dil değişmiş. Eksik kalan kısım rapora göre metnin bazı yüzeylerde
kalması. Düşük öncelik.

### m1010 · "Ülke telefon alan kodundan türetilmeyecek"

Sözleşme testi eklendi ama yalnız `src/` ağacını tarıyor. Yasak ürün geneli olduğu için
kenar fonksiyonlar ve veritabanı tarafı kapsam dışı kalıyor. Kural bugün çiğnenmiyor;
koruma dar.

---

## Kanıt bulunamayan 1 madde

**m22 · "Yorum kutusunda Enter ile gönderme çalışacak"** — kod kasıtlı olarak bunun
**tersini** yapıyor: Enter yeni satıra geçiyor, gönderim yalnız düğmede. Çünkü daha yeni
olan WS2-80 ve WS2-81 maddeleri tam tersini söylüyor ve canlıda onlar uygulanmış.

**m22 geçersiz bir maddedir; onaylanmamalı, kapatılmalı.** İki madde birbiriyle çelişiyor
ve sözleşme WS2 olmalı (daha yeni karar).

---

## Kod dışı 6 madde — çıktıları belgede duruyor

m106, m107, m113, m115 (pazarlama metinleri, video ve görsel brief'leri) →
`docs/marketing/2026-08-30-tools-campaign-kit.md` içinde yazılı. m74 ve m100 zaten
"sonraki fazda" / "görev açılacak" diyen erteleme kararları.

Bunlar kod işi olmadığı için "yapıldı mı" sorusunun cevabı belgenin varlığıdır; Burak
metinleri okuyup onaylayabilir.

---

## Öneri

1. **45 maddeyi tek turda onaya sun.** Bunların hepsi kanıtlı ve canlıda görünür.
2. **m22'yi kapat** (çelişkili madde, WS2 sözleşmesi geçerli).
3. **m9 için karar al** — ek hedef ücretli mi, ücretsiz mi? Bu, üye paylaşımını kaybettiren
   tek açık kusur.
4. **m11'in metnini güncelle** ya da eşikleri geri aç.
5. Kalan kısmen maddeleri (m16, m66, m75, m99, m1010) ikinci turda ele al.
