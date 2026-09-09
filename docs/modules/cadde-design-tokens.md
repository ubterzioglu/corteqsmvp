# Cadde tasarım token'ları

> **Durum:** T1 (m137) ile yazıldı, 9 Eylül 2026. Bu doküman **kuralı** koyar;
> bileşenlerin ona hizalanması T2–T8 batch'lerinde yapılır
> (`docs/plans/2026-09-09-cadde-ux-ui-batch-plani.md`).

## Neden var

27 Ağustos denetiminin (`docs/cadde-300/2026-08-27-ui-kritigi.md`) kök teşhisi şuydu:
sorunların hiçbiri tek başına büyük değil, hepsinin ortak kökü **tanımlı bir token
sistemi olmaması**. Renk, buton, rozet ve yüzey değerleri sayfa sayfa birikmiş; aynı
ekranda dört ayrı buton stili, altı ayrı rozet stili dolaşıyor.

Bu doküman tek tek düzeltme yapmaz — hangi değerin nerede kullanılacağını söyler.

## Marka sözlüğü — yeni ad UYDURMA

Marka renklerinin adları zaten var ve **`scripts/social-generate/config.mjs`** içinde
tanımlı (LinkedIn görsel üretimi bunları kullanıyor, yani adlar dışarıya da çıkıyor):

| Ad | Hex | Nerede |
|---|---|---|
| `navy` | `#191d28` | logo zemini, koyu yüzeyler |
| **`bronze`** | **`#aa8c42`** | **markanın imza rengi** |
| `teal` | `#28a693` | aksan |
| `orange` | `#e8703c` | aksan |
| `blue` | `#1a8fe3` | aksan |
| `indigo` | `#7861db` | aksan |
| `pink` | `#e33d94` | aksan |
| `yellow` | `#eeb821` | aksan |

⚠️ Kritik bu rengi "altın" diye anıyor; **kod tabanındaki adı `bronze`**. Yeni bir ad
(gold/altin) eklemeyin — aynı renge iki isim, üçüncü bir tutarsızlık kaynağı olur.

## 1. Renk — birincil eylem

**Kural: `bronze` "her yerde" değil, "birincil eylem neredeyse orada".**

Ölçüldü (07.09.2026, tekrar 09.09): `#aa8c42` `src/` ağacında **hiç geçmiyordu** —
yalnız `index.html` theme-color etiketinde. Markanın en değerli görsel varlığı boştaydı;
logo kaldırılsa arayüzün CorteQS'e ait olduğu anlaşılmıyordu.

| Token | Değer | Kullanım |
|---|---|---|
| `--cadde-brand` | `43 44% 46%` | primary buton zemini, aktif sekme, seçili filtre |
| `--cadde-brand-strong` | `43 46% 38%` | primary hover/active |
| `--cadde-brand-soft` | `43 52% 94%` | seçili satır zemini, hafif vurgu |
| `--cadde-brand-ink` | `43 60% 22%` | `brand-soft` üstündeki metin |

Sayfa başına **en fazla bir** primary. İkiden fazlaysa hiyerarşi yok demektir.

⚠️ `--cadde-accent` (turuncu, `24 92% 48%`) DURUYOR ve silinmeyecek: dekoratif
aksan olarak (ikonlar, kart parıltısı) kullanılıyor. `brand` onun yerine geçmez,
**yanına** gelir — biri kimlik, diğeri vurgu.

## 2. Buton — üç seviye, başka yok

| Seviye | Görünüm | Ne zaman |
|---|---|---|
| **primary** | `bronze` dolu, beyaz metin | Sayfanın tek asıl eylemi |
| **secondary** | nötr outline, beyaz zemin | Yan eylemler |
| **tertiary** | metin link, zemin yok | Üçüncül / geri alınabilir |

Yıkıcı eylemler bu üçlünün dışındadır: kırmızı **metin**, ve mümkünse bir kebab (⋯)
menüsünün arkasında (bkz. C2 — "Cafe'yi Arşivle").

## 3. Rozet — üç tip, her tipin tek stili

| Tip | Anlam | Stil | Örnek |
|---|---|---|---|
| **durum** | dinamik, değişir | dolu renk | Canlı, Sabit, Arşiv |
| **kimlik** | kim olduğunu söyler | tek ikon + nötr | Onaylı, Resmî hesap |
| **kategori** | sınıflandırır | outline, nötr | Startup, Hukuk, Emlak |

⚠️ Bugün altı ayrı stil dolaşımda ve hiçbirinin görsel ağırlığı anlamsal önemiyle
örtüşmüyor (T6 bunu kapatacak).

## 4. Yüzey — tek yarıçap, iki gölge, bir kontrast tabanı

- **Köşe yarıçapı:** tek değer, **12px**. İstisna yalnız pill butonlar ve avatarlar
  (`rounded-full`). Bugün `rounded-md/xl/2xl/[24px]` karışık kullanılıyor.
- **Gölge:** iki seviye — `kart` (hafif) ve `yükseltilmiş` (modal/popover). Üçüncü bir
  ara gölge eklemeyin; derinlik hiyerarşisi ancak seviyeler AZ olduğunda okunur.
- **Metin grisi:** `#6b7280`'den daha açık gri **kullanılmaz** (AA kontrast tabanı).

## 5. Dil

Arayüz **Türkçe**. İngilizce kalıntı bırakılmaz (H3'te Pinned→Sabit, Feedback
Ver→Geri Bildirim, Host→Ev Sahibi düzeltildi).

Büyük/küçük harf dönüşümü gerekiyorsa `src/lib/text-normalization.ts`
(`trUpper`/`trLower`/`trIncludes`) kullanılır — bare `toUpperCase()` Türkçe'de yanlıştır
(`"İstanbul".toLowerCase()` sade "istanbul" ile eşleşmez).

## Uygulama kuralı — sözleşme testi

`src/lib/cadde-style-contract.test.ts` 7 Cadde yüzey dosyasında şunları **yasaklar**:
`bg-[#...]`, `text-[#...]`, `border-[#...]`, `bg-[linear-gradient...]`,
`shadow-[...rgba...]`.

Yani renk **token'dan** gelmek zorunda. Yeni bir renge ihtiyaç duyarsanız testi
gevşetmeyin — buraya bir token ekleyin ve `src/index.css`'te tanımlayın.
