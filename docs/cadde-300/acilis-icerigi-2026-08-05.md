# Cadde açılış içeriği — 2026-08-05 (ONAY BEKLİYOR)

K2 kararı (05.08): seed fixture'lar silinir, akış **gerçek bir hesaptan editöryel
içerikle** doldurulur. Uydurma kişi kimliği ÜRETİLMEZ.

## Kural

| | |
|---|---|
| Yazar | Gerçek ekip hesabı (`author_user_id` dolu) — varsayılan `ubterzioglu@gmail.com` |
| Rozet | `author_role = "CorteQS Ekibi"` — akış kartı bunu rozet olarak çizer, kimse bunu bireysel bir üye sanmaz |
| Kimlik uydurma | **Yok.** Cevap gelirse cevaplayacak gerçek biri var |
| Tavsiye/mevzuat | **Yok.** Ekip bilmediği bir şeyi bilir gibi yazmaz — bürokrasi soruları topluluğa SORU olarak gider |
| Sıra | **Önce K1** (çöp veri silme), sonra bu içerik. K1 `author_user_id IS NOT NULL` olan her postu siler — önce eklenirse birlikte silinir |

**Neden ağırlıklı soru:** akışın işi bilgi vermek değil, konuşma başlatmak. 12 how-to
yazısı yardım merkezi gibi okunur; 9 iyi soru topluluk gibi okunur. Sorular ayrıca
sıfır sorumluluk taşır — cevabı bilen üye yazar, ekip yanlış bilgi yaymaz.

---

## A. Yönlendirme postları (3) — ekibin gerçekten bildiği şeyler

### A1 · Global · `text` · pinned
**Başlık:** Cadde açıldı
**Gövde:**
> Burası şehrindeki Türklerle tanışıp soru sorabileceğin, deneyimini paylaşabileceğin
> ortak akış. Bir soru, bir tavsiye ya da şehrinden kısa bir not — hepsi buraya yazılır.
> Akış şehrine göre süzülür, ama istersen ülke geneline ve globale de bakabilirsin.

### A2 · Global · `text`
**Başlık:** Cafe nedir, ne zaman açılır
**Gövde:**
> Cafe, kendi teması olan süreli bir sohbet odası — süreli bir WhatsApp grubu gibi
> düşünebilirsin. İstersen herkese açık, istersen onaylı ya da davetli olur.
> "Berlin'de yeni başlayanlar" ya da "Hollanda'da freelance çalışma" gibi bir başlık
> aklına geldiyse odayı sen açabilirsin.

### A3 · Global · `text`
**Başlık:** Köprü modu ne işe yarar
**Gövde:**
> Köprü, Türkiye ile diaspora arasındaki akış: taşınma, iş ve mentorluk konuları.
> Türkiye'den taşınmayı düşünen biriyle o şehirde yaşayan birini aynı başlıkta
> buluşturur. Sol kolondaki anahtarla açıp kapatabilirsin.

---

## B. Şehir bazlı açık sorular (9) — cevaplaması bir satır sürer

### B1 · Almanya / Berlin · `question`
> Berlin'de Anmeldung randevusu bulmak hâlâ bu kadar zor mu? Son randevunu ne kadar
> beklediğini ve hangi Bürgeramt'ı denediğini yazar mısın — yeni gelenler için
> gerçek bir tablo çıkarmak istiyoruz.

### B2 · Almanya / Dortmund · `question`
> Dortmund'da Türkçe konuşan bir aile hekimi arayan çok. Kendi doktorundan memnunsan
> adını buraya bırakır mısın?

### B3 · Almanya / Köln · `question`
> Köln'de çocuğunu okula kaydettirenler: süreci ne zaman başlattınız ve geriye dönüp
> bakınca neyi daha erken yapardınız?

### B4 · Almanya / München · `question`
> Münih'te ilk iş görüşmesine giderken Almanca seviyeniz neydi? "B1 yeter mi"
> sorusunun gerçek cevabını sektöre göre merak ediyoruz.

### B5 · Almanya · `question`
> Diploma denkliği (Anerkennung) sürecinden geçen var mı? Hangi meslek, ne kadar
> sürdü? Bu başlıkta herkesin duyduğu şey birbirini tutmuyor.

### B6 · Hollanda / Amsterdam · `question`
> Amsterdam'da BSN aldıktan sonraki ilk hafta: sırasıyla ne yaptınız? Yeni
> taşınanların en çok takıldığı yer burası.

### B7 · Birleşik Krallık / Londra · `question`
> Londra'da GP kaydı yaptıranlar — adres kanıtı olarak neyi kabul ettiler?
> Kiracıların en çok zorlandığı adım bu.

### B8 · Almanya / Berlin · `question`
> Berlin'de Schufa geçmişi olmadan ev tutabilen oldu mu? Ev sahibini neyle ikna
> ettiniz?

### B9 · Global · `question`
> Yaşadığın şehirde Türkçe hizmet veren, gerçekten memnun kaldığın bir esnaf,
> danışman ya da usta var mı? Şehir adıyla birlikte yaz — dizine ilk kayıtlar
> buradan çıksın.

---

## Onay sonrası uygulama

1. **K1 çalıştırılır** (çöp veri + kullanıcı postları silinir).
2. Seed fixture'lar silinir (K2): `DELETE FROM cadde_posts WHERE author_user_id IS NULL`
   ve `DELETE FROM cadde_cafes WHERE host_user_id IS NULL`.
3. Bu 12 post UTF-8 SQL dosyası olarak `psql -f` ile eklenir — **komut satırından
   Türkçe metin geçirilmez** (CLAUDE.md Türkçe metin kuralı md.4: PowerShell'den
   psql'e geçen `ı` karakteri bozulur).
4. Şehir/ülke `geo_countries`/`geo_cities` üzerinden ADA göre çözülür, UUID
   gömülmez.
5. `cadde_post_targets` satırları da yazılır — yoksa post şehir akışında görünmez.
6. B6 doğrulaması: public akışta kaç post kaldı, hepsi `CorteQS Ekibi` rozetli mi.

## Bu içerik eklenince soğuk başlangıç yüzeyi ne olur

12 post girince `isColdStart` yine `false` olur ve B1/B2/B10 canlıda çizilmez.
Bu bir kayıp değil, doğru sonuç: o yüzey **gerçekten boş** durumun dürüst davranışı
olarak duruyor (yeni bir diaspora anahtarı açıldığında ilk kullanıcılar onu görecek).
Ama bugünkü canlı ekranda görünmeyeceğini bilerek ilerliyoruz.
