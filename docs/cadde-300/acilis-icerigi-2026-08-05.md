# Cadde açılış içeriği — 2026-08-05

K2 kararı (05.08): seed fixture'lar silinir, akış **gerçek bir hesaptan editöryel
içerikle** doldurulur. Uydurma kişi kimliği ÜRETİLMEZ.

Uygulama script'i: [`docs/operations/2026-08-05-cadde-acilis.sql`](../operations/2026-08-05-cadde-acilis.sql)
— K1 + K2 + içerik **tek transaction**. Sıra kritik olduğu için birleştirildi:
K1 `author_user_id IS NOT NULL` olan her postu siler, içerik önce eklenirse
birlikte silinirdi.

## Kural

| | |
|---|---|
| Yazar | `ubterzioglu@gmail.com` (`bdb66bc1-…`, canlıda doğrulandı) |
| Görünen ad | `author_name_override = "CorteQS"` |
| Rozet | `author_role = "Resmî hesap"` — akış kartı bu alanı zaten rozet olarak çiziyor |
| Kimlik uydurma | **Yok.** Cevap gelirse cevaplayacak gerçek biri var |
| Tavsiye/mevzuat | **Yok.** Bürokrasi konuları topluluğa SORU olarak gider; cevabı bilen üye yazar |

**Neden ağırlıklı soru:** akışın işi bilgi vermek değil konuşma başlatmak. 14 how-to
yazısı yardım merkezi gibi okunur; iyi bir soru topluluk gibi okunur. Sorular ayrıca
sıfır sorumluluk taşır.

---

## Ölçüm içeriği değiştirdi (05.08, canlı)

İlk taslak Almanya/Hollanda/İngiltere diasporasına yazılmıştı. Canlı üye dağılımı
bunu çürüttü — **üye tabanı ağırlıkla Türkiye'de**:

| Şehir | Üye | | Şehir | Üye |
|---|---|---|---|---|
| İstanbul | 14 | | Berlin | 5+ |
| **Doha (Katar)** | **12** | | İzmir | 5 |
| Ankara | 7 | | Dortmund / Frankfurt / Magdeburg | 2'şer |

Sonuçlar:
- **Türkiye tarafı için 4 post eklendi** ve hepsi `is_bridge = true` — bu kitle
  taşınmayı düşünenler, yani tam olarak Köprü'nün hedefi. (Köprü filtresi KAPALIYKEN
  de görünürler; `not v_bridge or p.is_bridge` sadece filtre açıkken daraltır.)
- **Doha eklendi** — üye sayısında üçüncü sırada ve ilk taslakta hiç yoktu.
- **Köln ve München çıkarıldı** — `cadde_cities` içinde YOKLAR. ("Münih" var ama
  üyenin profilinde yazan "München" ona fold ile eşleşmiyor.)
- Ülke adları canlıda **aksansız**: `Turkiye`, `Birlesik Krallik`. Şehirler karışık:
  `Istanbul` büyük, `ankara`/`izmir` küçük harf. Script birebir eşleşme kullanır ve
  çözülmeyen ad olursa transaction'ı düşürür (14/14 çözüldüğü doğrulandı).

## Hedefleme neden zorunlu

`list_cadde_feed_v1` varsayılan akışta bir postu **yalnız izleyicinin şehri ya da
ülkesi eşleşirse** gösterir; tek kaçış yolu global eşik
(`cadde.global.min_reactions = 10`, canlıda doğrulandı). Yeni bir post o eşiği
karşılayamaz, dolayısıyla **hedefsiz "global" bir post hiç kimseye görünmez.**

Bu yüzden yönlendirme postları (1-3) ve dizin sorusu (14) `cadde_post_targets`'a
**18 aktif ülkenin tamamı** için satır yazar; şehir postları kendi ülke+şehir hedefini alır.

---

## İçerik (14 post)

| # | Tip | Hedef | Konu |
|---|---|---|---|
| 1 | text · **pinned** | tüm ülkeler | Cadde açıldı — ne işe yarar, şehir nasıl seçilir |
| 2 | text | tüm ülkeler | Cafe nedir, ne zaman açılır |
| 3 | text · köprü | tüm ülkeler | Köprü modu ne işe yarar |
| 4 | question · köprü | Türkiye / İstanbul | Hangi ülke, seni en çok ne tutuyor? |
| 5 | question · köprü | Türkiye / Ankara | Karar aşamasında nerede tıkandınız? |
| 6 | question · köprü | Türkiye / İzmir | Yurt dışındakine soracağın tek soru? |
| 7 | question · köprü | Türkiye geneli | Hangi konuda mentor arıyorsun? |
| 8 | question | Almanya / Berlin | Anmeldung randevusu ne kadar bekledi? |
| 9 | question | Almanya / Dortmund | Türkçe konuşan aile hekimi tavsiyesi |
| 10 | question | Almanya / Frankfurt | İlk iş görüşmesinde Almanca seviyesi |
| 11 | question | Katar / Doha | Yeni taşınana ilk hafta tavsiyesi |
| 12 | question | Hollanda / Amsterdam | BSN sonrası ilk hafta sırası |
| 13 | question | B. Krallık / Londra | GP kaydında adres kanıtı |
| 14 | question | tüm ülkeler | Şehrinde memnun kaldığın esnaf/danışman kim? |

Tam metinler script'in içinde (`cadde_acilis_spec` INSERT bloğu).

---

## ⚠️ İçerikle ÇÖZÜLMEYEN sorun: 156 üyenin 68'i hiçbir şey göremiyor

Ölçüm (05.08): üyelerin profilindeki ülke değeri `cadde_countries.name` ile
eşleşenler **88**, eşleşmeyenler **68**. Eşleşmeyen üye için `v_viewer_country_id`
ve `v_viewer_city_id` NULL kalır; filtre de seçmemişse akış görünürlük kapısının
hiçbir dalı açılmaz ve **akış boş gelir — ne kadar içerik girersek girelim.**

Eşleşmeyen değerlere örnek: `Belirtilmedi` (13 üye), `Qatar` (Katar yerine),
`Deutschland` / `Germany` (Almanya yerine), `İngiltere` (Birlesik Krallik yerine),
`ABD` / `United States`, `Italy`, `France`, `South Africa`, `Moldova`, `vancouver`,
`a`, `De`.

Profil kapısı (`CaddeProfileGate`) bunu yakalamıyor çünkü `Belirtilmedi` **boş değil**,
sadece geçersiz — kapı yalnız boşluğa bakıyor.

İki yön (karar gerekiyor, ikisi de bu batch'in dışında):
1. **Kök neden — profil ülke değerlerini normalize et.** Çoğu mekanik eşleme
   (`Qatar→Katar`, `Deutschland/Germany→Almanya`, `İngiltere→Birlesik Krallik`).
   Kalıcı çözüm için kayıt formunda serbest metin yerine `cadde_countries` seçici.
2. **Kapıyı gevşet.** Konumu çözülemeyen izleyiciye boş akış yerine global/yeni
   içerik göster (`list_cadde_feed_v1` içinde yeni bir dal).

**B1 ile etkileşimi:** bu üyelerde `isColdStart` true olur ve konum kutusu kapalı
açılır — oysa akışlarını dolduracak tek kontrol tam olarak o kutu. Kutu başlığı ve
tetiği görünür kaldığı için kurtarma bir tık uzakta, ama (1) veya (2) yapılırsa
bu kenar durum tamamen kalkar.

---

## Çalıştırma ve sonrası

```powershell
$pw = (Select-String -Path .env.local -Pattern '^SUPABASE_DB_PASSWORD=(.*)$').Matches[0].Groups[1].Value.Trim().Trim('"')
$env:PGPASSWORD = $pw
psql "host=aws-1-eu-west-2.pooler.supabase.com port=5432 dbname=postgres user=postgres.injprdrsklkxgnaiixzh sslmode=require" `
  -f docs/operations/2026-08-05-cadde-acilis.sql
```

Script öncesi/sonrası sayımları ve son durumu kendi basar — çıktı B6 doğrulamasının
kendisidir. Hata olursa **tamamı geri sarar**; yedek `C:\tmp\cadde-yedek-2026-08-04\*.csv`.

**Bu içerik girince `isColdStart` yine `false` olur** ve B1/B2/B10 canlıda çizilmez.
Bu bilinçli: o yüzey gerçekten boş durumun dürüst davranışıdır (yeni bir diaspora
anahtarı açıldığında ilk kullanıcılar onu görecek).
