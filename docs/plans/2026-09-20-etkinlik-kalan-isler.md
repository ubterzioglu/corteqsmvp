# Etkinlik modülü — kalan işler (20 Eylül 2026)

Burak'ın 20.09 tarihli **"Ö9 ETKİNLİK"** geri bildirimi üzerine yapılan çalışmanın
devir notu. Kod ve migration canlıya/uzağa gitti; bu dosya **geriye ne kaldığını**
ve **neyin doğrulanmadığını** söyler.

**Commit'ler:** `85c6d1e` (kod, 23 dosya) · `4e65a01` (migration taşıma) — ikisi de
`origin/main`'de.

---

## Durum özeti

| Adım | Durum |
|---|---|
| Kod yazıldı, test edildi | ✅ `tsc` 0 · `lint` 0 · `vitest` 291 dosya / 2.171 test |
| Bağımsız inceleme (9 bulgu) | ✅ hepsi kapatıldı |
| `main`'e push | ✅ `4e65a01` |
| Migration canlıya uygulandı | ✅ DB'ye sorarak doğrulandı (aşağıda) |
| **Coolify deploy** | ❌ **YAPILMADI** |
| **Gerçek tarayıcıda gözle QA** | ❌ **YAPILMADI** |
| Burak'a geri bildirim yanıtı | ❌ yazılmadı |

---

## 1. Coolify deploy — sıradaki iş

Kod `origin/main`'de ama canlıda değil. Migration zaten uygulandığı için sıra
riski YOK; artık güvenle deploy edilebilir.

Deploy sonrası CLAUDE.md'nin zorunlu kontrolü:

```bash
BASE_URL=https://corteqs.net npm run verify:release
curl -I https://corteqs.net/          # güvenlik başlıkları / adresinde de gelmeli
```

Tarayıcı konsolunda **CSP ihlali** olup olmadığına bak (nginx başlıkları yalnız
template metninden test ediliyor, çalışan nginx'ten değil).

---

## 2. Gözle QA — test edilemeyen kısım

Aşağıdakilerin hiçbiri otomatik testle doğrulanamaz; hepsi gerçek tarayıcı ister.
Sırayla geçilecek liste:

### Etkinlik oluşturma formu (`/events`)
- [ ] **Saat dilimi kutusu çiziliyor mu**, gruplar (Türkiye · Avrupa · Orta Doğu &
      Körfez · Asya · Amerika · Afrika · Okyanusya) görünüyor mu.
- [ ] Tarayıcı dilimi listedeyse **önceden seçili** geliyor mu (Berlin'de test
      edersen "Almanya (Berlin)" olmalı).
- [ ] **Saat gir, saat dilimini seçme → Gönder.** "Saat dilimi seçin" uyarısı
      çıkmalı ve gönderim durmalı. *Bu, çalışmanın en kritik davranışı.*
- [ ] Saat girmeden gönderince saat dilimi sorulmamalı (o durumda `null` yazılır).
- [ ] **Online** etkinlik seçince saat dilimi alanı yine görünmeli (eskiden ülke
      alanı yalnız fiziksel/hibritte çiziliyordu — bu kusurun özü buydu).

### Etkinlik detayı (`/events/:id`)
- [ ] Saat satırı `19:00 – 21:00 · Almanya (Berlin) saatiyle` biçiminde mi.
- [ ] Farklı saat dilimindeki bir tarayıcıdan bak: **"Senin saatinle …"** ikinci
      satırı çiziliyor mu. (VPN gerekmez — işletim sisteminin saat dilimini
      geçici değiştirmek yeterli.)
- [ ] Aynı saat dilimindeyken o ikinci satır **çizilmemeli**.
- [ ] Gün kayan bir etkinlikte (ör. Sidney etkinliği + Amerika saati) "— senin
      takviminde 4 Ekim Pazar" gibi **gün adı** yazıyor mu.
- [ ] **Onay bekleyen** kendi etkinliğini aç: paylaş düğmeleri yerine
      "yönetici onayından sonra paylaşılabilir" notu çıkmalı.

### Etkinlik listesi (`/events`)
- [ ] Kartın sağ üstündeki **paylaş ikonu**: tıklayınca menü açılmalı ve
      **etkinlik detayına GİTMEMELİ**. (Bu, düzeltilen bir kusurdu; regresyona
      en açık nokta burası.)
- [ ] Kapak görseli olan kartta ikon görünüyor mu (yarı saydam zemin var).
- [ ] Kart üzerindeki saat `19:00 (Berlin)` gibi kısa etiket gösteriyor mu.
- [ ] Arama kutusuna **virgüllü** bir şey yaz (`kültür, sanat`) — liste
      düşmemeli. (Eskiden PostgREST 400 dönüp "Etkinlikler yüklenemedi" oluyordu.)

### Profil — "Etkinliklerim"
- [ ] **Normal üye** hesabıyla `/profile` → sol menüde "Etkinliklerim" var mı,
      panel çiziliyor mu.
- [ ] **Premium pilot (Experimental_2)** hesabıyla `/profile` → sekme çubuğundaki
      "Etkinliklerim" artık "yakında" yazmıyor, gerçek veri gösteriyor mu.
      *İkisi ayrı düzendir; birini test edip diğerini varsayma.*
- [ ] Hiç etkinliği olmayan üyede boş durum + "Etkinlik Oluştur" düğmesi.
- [ ] Etkinlik gönderdikten sonra panelde **"Onay Bekliyor"** rozetiyle görünüyor
      mu ve altındaki açıklama doğru mu.

### Admin (`/admin/events`)
- [ ] Tarih sütunu doğru günü gösteriyor mu. (UTC'nin batısındaki bir yöneticide
      eskiden bir gün geri görünüyordu.)
- [ ] Durum rozetleri (Yayında / Onay Bekliyor / Taslak / Reddedildi) bozulmadı mı
      — etiketler `events-vocabulary.ts`'e taşındı.

---

## 3. Test edilmeyen uç durumlar (bilerek bırakıldı)

- **Yaz saatinin "olmayan saat" aralığı.** 29 Mart 2026, 02:00–03:00 arası Avrupa'da
  yerel saat olarak var olmaz. `eventInstant` çökmüyor ve saati ileri itiyor, ama bu
  davranış ürün kararı olarak gözden geçirilmedi. Bir üye 02:30 girerse etkinlik
  03:30'a kayar ve kimse uyarılmaz.
- **Sonbahar geri dönüşünde iki kez yaşanan saat** (25 Ekim 02:00–03:00): ikinci
  oluşum seçiliyor. Yine sessiz.
- **Bitiş < başlangıç durumunda formda uyarı yok.** Hesap düzeltildi (bitiş ertesi
  güne taşınıyor) ama kullanıcıya "bu etkinlik gece yarısını aşıyor" denmiyor.
  Yanlışlıkla ters girilen saat sessizce 23 saatlik etkinliğe dönüşür.

---

## 4. Açık kalan borçlar (bu çalışmanın kapsamı dışında ama aynı dosyalarda)

- **`events.type` ve `events.status` üzerinde CHECK kısıtı YOK.** 19 Eylül'deki
  ASCII'ye düşmüş kategori kusurunun kök nedeni buydu ve hâlâ açık. Yeni
  `timezone` sütununa biçim CHECK'i konuldu; diğer ikisine konmadı.
- **`AdminEventsPage` arama filtresi `toLowerCase()` kullanıyor.** CLAUDE.md
  Türkçe metin kuralı `trIncludes` diyor ("İstanbul" aramasında bozulur). Bu
  çalışmadan gelmiyor, dokunulmadı.
- **Saat dilimi listesi 65 satır**, dünyadaki 400+ dilimin tamamı değil. Listede
  olmayan bir ülke çıkarsa `src/lib/events-timezone.ts` içindeki
  `EVENT_TIMEZONE_OPTIONS` dizisine bir satır eklenir — başka hiçbir yere
  dokunmak gerekmez. Bilinen eksikler: Balkanlar (Belgrad, Üsküp, Saraybosna,
  Zagreb, Tiran), Baltıklar, Lüksemburg, Malta, `America/Detroit`,
  `America/Phoenix`, `Australia/Melbourne`.

---

## 5. ⚠️ Git / çalışma dizini uyarısı

Bu repoda **index paylaşılıyor** — başka bir oturum kendi dosyalarını `git add`
ile sahnelemiş durumda. Çalışma dizininde şu an commit'lenmemiş **relocation
motoru** işi duruyor (`src/lib/relocation-*`, `src/components/relocation/`,
`supabase/functions/relocation-assistant/`, `SiteHeader.tsx`, `eslint.config.js`,
`docs/audits/`).

**Kural:** `git commit` yaparken pathspec **dizin değil, tam dosya yolu** olmalı.
Bu çalışmada `-- supabase/migrations/` (dizin) kullanmak diğer oturumun
migration dosyasını commit'e aldı; fark edilip geri alındı. Commit öncesi
`git diff --cached --name-status` ile index'i kontrol et.

Ayrıca **araç kataloğu** (`docs/agent/tools.json`,
`src/lib/agent/tools-catalog.generated.ts`, `docs/agent/openapi.yaml`) bilerek
commit'e dahil edildi ve içinde diğer oturumun `relocation-chat-api`,
`relocation-content-api`, `public-catalog-api`, `relocation-assistant` araçları
da var. Katalog kaynaktan üretilen türetilmiş bir dosyadır;
`npm run ingest:tools:check` yeşil kalsın diye böyle yapıldı.

---

## 6. CLAUDE.md'de tazelenecek rakamlar

Bu çalışma sonrası bayatladılar. Ölçülmüş yeni değerler:

| CLAUDE.md'deki iddia | Satır | Gerçek (20.09 ölçümü) |
|---|---|---|
| "397 Supabase migrations — 145 in `applied/`" | 13 | **399** — **147** applied + 252 archive |
| "397 migrations total" | 522 | **399** |
| "279 dosya / 1.981 test" | 16 | **291 dosya / 2.171 test** |

`check:migrations` 399/399 canlı kayıt doğruladı, parent dizin temiz.

---

## Doğrulanmış canlı durum (referans)

Migration `20260920140000_events_timezone.sql` — **dosyadan değil, veritabanına
sorularak** doğrulandı:

- `events.timezone` → `text`, nullable
- `CHECK events_timezone_format` aktif: `'Europe/Berlin'` geçerli, `'Almanya'`
  **reddediliyor**
- `supabase_migrations.schema_migrations` içinde `20260920140000` kayıtlı
- Uygulama anında `public.events` **0 satır** idi → geri dolum gerekmedi

---

## Burak'a verilecek yanıt (Ö9 maddesi)

> Saat için artık saat dilimi soruyoruz — online etkinliklerde de. Herkes
> etkinliği hem düzenleyenin saatiyle hem kendi saatiyle görüyor.
> Sosyal medya paylaşımı zaten vardı; şimdi etkinlik listesinde ve profilinde de
> var. "Etkinliklerim" profiline eklendi: gönderdiğin etkinliğin onay durumunu
> oradan takip ediyorsun.
