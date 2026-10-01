# G08 · M1 Spike — davet sayfasından grup adı okunabiliyor mu?

> **Ölçüm tarihi:** 1 Ekim 2026 · **Üretim kodu yazılmadı** (batch'in kapsamı rapor).
> Kaynak batch: [`KALANLAR.md`](../kalanlar/KALANLAR.md) → **G08** ·
> Plan: [`2026-09-30-dijital-gruplar-plani.md`](../plans/2026-09-30-dijital-gruplar-plani.md) → Faz C.
>
> ⚠️ **Bu dosyaya davet kodu yazılmaz.** Ölçümde canlı `whatsapp_landings` kayıtlarının
> gerçek linkleri kullanıldı; kodlar bilerek dışarıda bırakıldı (G03 serisi tam olarak bu
> linkleri anonimden gizlemek için açıldı).

## 1 · Tek cümlelik sonuç

**Üç platformda da grup adı ve görseli sunucu tarafında, kimlik doğrulamasız okunabiliyor** —
ama **okunabilmesi sahiplik kanıtı değildir** ve **HTTP durum kodu tek başına linkin geçerli
olduğunu söylemez**. Paketin "sahiplik ekran görüntüsü + manuel onay" kararı **geçerliliğini
koruyor**; okunan ad yalnızca **ön doldurma ve moderatöre yardım** için kullanılmalı.

## 2 · Ölçüm yöntemi

- Node 24 `fetch`, sunucu tarafı, çerezsiz, oturumsuz. Tarayıcı ve bot `User-Agent`'ı ayrı denendi.
- **Toplam 59 istek** atıldı: WhatsApp 27 · Telegram 13 · Discord 34 (ayrıntı ↓ §4).
- Geçerli linkler canlı kayıtlardan; geçersizler rastgele üretilmiş kodlardan.

## 3 · Platform platform sonuç

| Platform | Ad okunuyor mu | Görsel | `ok` sinyali | `invalid` sinyali | `unknown` |
|---|---|---|---|---|---|
| **WhatsApp** (`chat.whatsapp.com`) | ✅ `og:title` | ✅ `og:image` | 200 + **dolu** `og:title` | 200 + **boş** `og:title` | ağ hatası / `og` hiç yok |
| **Telegram** (`t.me`) | ✅ `og:title` | ✅ | 200 + gruba özel başlık | 200 + jenerik `Join group chat on Telegram` | ⚠️ **özel davet (`t.me/+…`) geçerli hâli ÖLÇÜLEMEDİ** |
| **Discord** (`discord.gg`) | ✅ resmî API, JSON | ✅ `icon` | **200** + `guild.name` | **404** + `{"code":10006,"message":"Unknown Invite"}` | 5xx / zaman aşımı |

### WhatsApp — dört önemli ayrıntı

1. **HTTP durumu işe yaramaz.** Uydurma 5 kodun **beşi de 200** döndü. Tek ayırt edici işaret
   `og:title`'ın **boş string** olması (5/5 ölçüldü, `og:description` her iki hâlde de sabit
   `WhatsApp Group Invite`). "200 geldi → link geçerli" kuralı **yanlıştır**.
2. **Başlık HTML varlık kodlu geliyor ve Türkçe harfler bundan etkileniyor.** Ham değer
   `OIG- ODTU Mezunlar&#x131; InnoVenture Grup`; çözülünce `…Mezunları…`. Çözme adımı
   atlanırsa kullanıcıya bozuk ad gösterilir (repo kuralı: Türkçe metin bozulmaz).
3. **Okunan ad, kayıtlı adla aynı değil** — ölçülen 2 kaydın **2'si de** farklı:
   kayıt `OIG- ODTU InnoVenture Grup` ↔ okunan `OIG- ODTU Mezunları InnoVenture Grup`;
   kayıt `almanya101` ↔ okunan `almanya101.de & nexrise cooperation`.
   ⇒ **Tam eşitlik karşılaştırması yapılamaz.** Karşılaştırma gerekiyorsa `trIncludes`
   (aksan/İ-ı toleranslı) ile **yumuşak** yapılır ve eşleşmemek **otomatik ret sebebi olamaz**.
4. **Sayfa ~220 KB.** Edge function'da her istekte indirilmesi pahalı; önbellek şart (↓ §5).

### Telegram — ölçülen ve ölçülemeyen

- Genel kullanıcı adlı bağlantı (`t.me/<ad>`) adı ve açıklamayı **veriyor** (tarayıcı ve bot
  kimliğiyle aynı sonuç, ~11 KB, 26–191 ms).
- Geçersiz özel davet (`t.me/+<rastgele>`) → 200 + **jenerik** `Join group chat on Telegram`.
- 🔴 **Kapanmayan boşluk:** elimizde **gerçek bir özel Telegram davet linki yok** (canlı 10
  kaydın 10'u WhatsApp). Geçerli bir `t.me/+…` bağlantısının adı gösterip göstermediği
  **ölçülmedi** — tahmin yazılmadı. Kapatması ~1 dakika: Barış'tan tek bir gerçek Telegram
  grup davet linki alınıp aynı betik çalıştırılır.

### Discord — en temiz yol

Resmî, **kimlik doğrulamasız** uç nokta tek çağrıda yapılandırılmış veri veriyor:
`GET https://discord.com/api/v10/invites/<kod>?with_counts=true` → `guild.name` · `guild.icon` ·
`approximate_member_count` (ölçüm: `Python` sunucusu, 432.101 üye, 2,5 KB, 26–221 ms).
Geçersiz kod **404 + `10006 Unknown Invite`** (10/10). HTML sayfası (`discord.gg/<kod>`) da
`og:title` veriyor ama 24 KB; **API tercih edilmeli**.

## 4 · Hız sınırı — ölçülen ve ölçülemeyen

| Deneme | İstek | Sonuç |
|---|---|---|
| WhatsApp, aynı link, beklemesiz | 10 | 10/10 **200**, 429 yok, `Retry-After` yok (599–2844 ms) |
| WhatsApp, 5 farklı geçersiz kod | 5 | 5/5 200, engelleme yok |
| Telegram, aynı sayfa, beklemesiz | 10 | 10/10 200, 429 yok (32–191 ms) |
| Discord API, aynı kod | 12 | 12/12 200 — ⚠️ **CDN önbelleğinden** (`cf-cache-status`), sınır fiilen denenmedi |
| Discord API, 10 **benzersiz** geçersiz kod (önbellek atlanır) | 10 | 10/10 404, 429 yok |

⚠️ **"Sınır yok" sonucuna varılmadı.** Üç platform da bu hacimde sınır göstermedi, ama
Discord `x-ratelimit-*` başlıklarını bu uçta **hiç yayınlamıyor** — yani sınıra ne kadar
yaklaşıldığı dışarıdan görünmez ve ilk işaret doğrudan engel olabilir. Üretimde kendi
sınırımızı koymak zorunludur.

## 5 · G13 ve sahiplik için çıkan kurallar

1. **Okuma sunucu tarafında yapılır** (edge function), tarayıcıdan **asla**: CORS'u geçse bile
   ziyaretçinin IP'siyle istek atmak ve davet linkini istemciye vermek G03'ün kapattığı
   sızıntıyı geri açar.
2. **Geçerlilik kontrolü platforma özeldir**, tek bir "HTTP 200 mü" kuralı yazılamaz
   (WhatsApp ve Telegram her hâlükârda 200 döner). Her platform için ayrı ayırt edici işaret
   yukarıdaki tabloda.
3. **Ad okumak sahiplik kanıtlamaz.** Linki olan herkes aynı veriyi okur. Paketin kararı
   (**ekran görüntüsü + manuel onay**) bu ölçümle **doğrulandı**, değiştirilmiyor.
4. **Okunan ad "öneri"dir:** form ön doldurma ve moderatör ekranında "platformdaki ad" satırı.
   Kayıtlı addan farklı olması **normaldir** (2/2 ölçüldü) ve tek başına şikayet/ret sebebi değil.
5. **Tek başarısızlık kayıt durumunu değiştirmez.** `unknown` (ağ hatası, zaman aşımı, biçim
   değişikliği) ayrı bir durumdur; G10'daki `link_fail_count` eşiğe ulaşmadan listeleme
   düşürülmez.
6. **HTML'den okuma kırılgandır** — WhatsApp/Telegram istedikleri an işaretlemeyi değiştirir ve
   bu **sessizce** olur (hata fırlatmaz, yalnız boş ad döner). Bu yüzden: Discord'da API, ötekilerde
   HTML; ve boş ad oranı artarsa uyaran bir ölçüm (G22 zamanlanmış görevlerine aday).
7. **Önbellek şart:** WhatsApp sayfası ~220 KB. Aynı davet için sonuç saklanmalı
   (süre `group_settings`'ten, G09).
8. **Davet linki log'a yazılmaz** — ne istek log'una, ne hata kaydına (`client_error_reports`
   sözleşmesi zaten payload yasaklıyor).

## 6 · Kalan tek iş

🔴 **Gerçek bir Telegram özel davet linki (`t.me/+…`)** — geçerli hâlde ad dönüyor mu? Ölçüm
betiği hazır, link gelince 1 istekle kapanır. G13'ü bloke etmez: Telegram desteği ilk sürümde
"ad okunamazsa manuel" yoluna düşer (zaten tüm platformlar için seçilen yol).
