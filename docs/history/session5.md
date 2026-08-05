# Session 5 — Cadde yerleşimi: üç kart başlık altına indi (05.08.2026)

**Kapsam:** tek bir istek — `/cadde` sayfasındaki üç sol-kolon kartının konumu.
**Sonuç:** CANLIDA DEĞİL — main'e push'landı (`390f137`), Coolify deploy bekliyor.

---

## 1. İstek ve netleştirme

Kullanıcı ekran görüntüsüyle: *"Bu üç kartı Diaspora Cadde kartının altına al üç satır
şeklinde."* — Konum, Aktif Cafeler, İnsanları Keşfet kartları.

"Üç satır" ifadesi iki farklı düzene işaret ettiği için **uygulamadan önce soruldu**
(yan yana tek şerit / alt alta üç şerit). Kullanıcı **alt alta üç şerit (3 satır)**
seçti. Bu, reddedilen alternatifle birlikte commit gövdesine `Rejected:` trailer'ı
olarak yazıldı.

## 2. Yapılan değişiklik

Tek dosya: `src/pages/cadde/CaddePage.tsx` (+60 / −42).

| Ne | Önce | Sonra |
|----|------|-------|
| Üç kartın yeri | sol `<aside>` (290px kolon, `order-2`) | başlık kartının altında tam genişlikte üç satır (`CaddePage.tsx:597-751`) |
| Izgara | `lg:grid-cols-[290px_minmax(0,1fr)_320px]` | `lg:grid-cols-[minmax(0,1fr)_320px]` — akış + tanıtım (`CaddePage.tsx:755`) |

Kartların iç düzeni 290px'lik kolona göre kurulmuştu; tam genişlikte gerilmiş
görünmemeleri için `lg`'de yatay okunur hale getirildi:

- **Konum:** ikon + başlık solda, `Caddeye Çık` butonu satırın sağ ucunda (mobilde tam
  genişlik). Ülke/Şehir filtresi ile Köprü anahtarı `lg`'de yan yana iki sütun.
- **Aktif Cafeler:** `CaddeCafesPanel.tsx` bileşenine **dokunulmadı** — başlık satırı
  zaten yatay ("+ Cafe Aç" sağda), kafe satırları esnek.
- **İnsanları Keşfet:** `Kişileri Keşfet` butonu başlık satırının sağına alındı, arama
  kutusu + sonuç listesi `max-w-2xl` ile sınırlandı.

### Bilinçli korunanlar
- `İnsanları Keşfet` kartındaki **`hidden lg:block` korundu** — kart mobilde eskiden de
  çizilmiyordu, taşıma bunu değiştirmemeli.
- Soğuk başlangıç ritmi (`asideRhythm`, `space-y-3` / `space-y-5`) ve akordeonların
  kapalı-açık mantığı (`geoFilterOpen`, `cafesOpen`) aynen taşındı.
- Sağ kolon (`cadde-right-rail`) ve mobil katlama davranışı (B10) değişmedi.

### Yan etki — mobil sıralama
Kartlar eskiden `aside order-2` ile mobilde **akıştan sonra** geliyordu; artık başlık
kartının altında, yani **akıştan önce**. Mobilde composer/akış iki kart aşağı iniyor
(İnsanları Keşfet mobilde gizli olduğu için üç değil iki kart). Kullanıcıya bildirildi;
istenirse mobilde eski sıra geri getirilebilir (blok ızgara içine `col-span-2` +
`order-2` ile alınır).

## 3. Doğrulama

| Kontrol | Sonuç |
|---------|-------|
| `npx vitest run src/pages/cadde/CaddePage.test.tsx` | **36/36 geçti** |
| `npx eslint src/pages/cadde/CaddePage.tsx` | temiz (0 bulgu) |
| `npx tsc -p tsconfig.app.json --noEmit` | CaddePage.tsx'te **0 hata** (çıkan 3 hata başka dosyalarda, bilinen 98 hatanın parçası) |
| Gerçek tarayıcıda görsel kontrol | **YAPILMADI** — jsdom testleri DOM'u doğrular, yerleşimi değil |

## 4. Git

- Commit `390f137` — `feat(cadde): Konum/Cafeler/Kisiler kartlari baslik altina uc satir oldu`
- Push: `78fe9e1..390f137 main -> main` (github.com/ubterzioglu/corteqsmvp)
- Commit gövdesinde `Constraint:` / `Rejected:` (2) / `Directive:` / `Not-tested:` trailer'ları var.

## 5. Kalan iş

1. **Coolify deploy** — değişiklik canlıda değil.
2. **Deploy sonrası masaüstünde `/cadde` görsel kontrolü** (üç satırın hizası, Konum
   kartındaki iki sütunun `lg` kırılımı).
3. Karar bekleyen: mobilde kartların akıştan önce mi sonra mı geleceği.

## 6. Sonraki oturum için not

`CaddePage.tsx` içinde ızgaraya **geri 290px'lik sol kolon eklemeden önce** baştaki üç
satırlık şeride bak — kartların tek kaynağı orası. Bu uyarı hem kodda yorum olarak hem
commit'te `Directive:` trailer'ı olarak duruyor.
