# Orphan (linki olmayan) sayfa denetimi — 2026-09-20

> **Ne bu:** Rota ağacında tanımlı olduğu hâlde uygulamanın hiçbir yerinden **link almayan**
> sayfaların ölçülmüş listesi. Ters yön de tarandı: link verilmiş ama **rotası olmayan**
> adresler (kırık link).
>
> **Durum:** Denetim tamamlandı, **hiçbir düzeltme uygulanmadı**. Aşağıdaki maddeler açık iş.
>
> **Yeniden ölçüm:** `node docs/audits/orphan-route-scan.mjs` (bkz. [Yöntem](#yöntem-ve-yeniden-ölçüm)).
> Ham çıktıya **doğrudan güvenme** — 15 adayın 4'ü yanlış pozitif, 1'i yanlış negatifti;
> her madde tek tek elle doğrulandı.

**Ölçüm anı:** `HEAD a21f7c1` + **kirli çalışma ağacı** (16 değişmiş + ~30 yeni dosya).
176 `<Route>` düğümü · **145 gerçek sayfa rotası** (redirect/index/layout hariç) ·
8 rota dosyası (`src/App.tsx` 329 satır + 7 modül `routes.tsx`).

> ⚠️ **Bu denetim sırasında aynı depoda paralel bir oturum çalışıyordu** (relocation motoru,
> `city-ambassadors` / `consultants` / `businesses` sayfaları, `SiteHeader` değişikliği).
> İlk ölçüm `HEAD 99f4f38` / App.tsx 319 satır / 172 düğüm üzerindeydi ve **denetim
> bitmeden bayatladı**: `/campaign` o arada kapandı, `/isletme/:slug` eklendi. Aşağıdaki
> tablo ikinci ölçümdür. Rotaya dokunan bir çalışmanın ardından **yeniden ölçün** —
> sayıları ezberlemeyin.

---

## Özet tablo

| Sınıf | Adet | Aciliyet |
|---|---|---|
| [A. Public orphan — sitemap'te var, iç link 0](#a-public-orphan--sitemapte-var-iç-link-0) | 2 | **Yüksek (SEO)** |
| [B. Üye sayfası — UI'dan hiç ulaşılamıyor](#b-üye-sayfası--uidan-hiç-ulaşılamıyor) | 1 | **Yüksek (UX)** |
| [C. Admin — menü kaydı eksik](#c-admin--menü-kaydı-eksik) | 4 | Orta |
| [D. Ters yön — canlı kırık link](#d-ters-yön--canlı-kırık-link) | 1 | **Yüksek (404)** |
| [E. Kasıtlı linksiz — dokunma](#e-kasıtlı-linksiz--dokunma) | 5 | — |
| [F. Yanlış pozitif — analizin sınırı](#f-yanlış-pozitif--analizin-sınırı) | 4 | — |
| [G. Ölü referans — duyuru metinlerinde](#g-ölü-referans--duyuru-metinlerinde) | 2 | Düşük |

Script'in ham "ORPHAN" sayısı **15**'tir; bu, A (2) + B (1) + C (4) + E (4, `/auth` hariç —
aşağıya bak) + F (4) toplamıdır. D ve G ters yön bulgusudur, orphan listesinde çıkmazlar.
**Yalnız A/B/C/D açık iş**; E ve F kapatılmayacak maddelerdir.

---

## A. Public orphan — sitemap'te var, iç link 0

İkisi de `public/sitemap.xml`'de kayıtlı ve `scripts/generate-sitemap.mjs` `STATIC_ROUTES`
listesinde. **Sitemap keşif sağlar ama iç link ağırlığı taşımaz** — klasik orphan page tablosu.
2026-09-20 SEO çalışması (bkz. `docs/audits/2026-08-04-seo-geo-audit.md` ve o günün commit'leri)
canonical/prerender tarafını kapattı, **bu sınıfa dokunmadı**.

| Rota | Tanım | Bulgu |
|---|---|---|
| `/lansman` | `src/App.tsx:132` | Kaynak ağacında **tek geçişi** rota tanımı + `src/lib/page-seo.ts:150` canonical. Hiçbir menü/sayfa/kart link vermiyor. ⚠️ SEO-kilitli URL (`CLAUDE.md` → "SEO-locked URLs") — **URL değiştirilmez**, link eklenir. |
| `/19051919/harita` | `src/App.tsx:138` | Tek yön çalışıyor: harita → `/19051919` (`src/pages/May19MapPage.tsx:21` `secondaryCta`). Ters yön (`/19051919` → harita) **yok**. |

### ✅ Denetim sırasında kapandı: `/campaign`

İlk ölçümde bu sınıftaydı — hub sayfasının alt sayfaları (`/campaign/blogger`,
`/campaign/vlogger`) linkliydi ama hub'ın kendisine hiçbir yerden link yoktu. Paralel oturum
aynı gün kapattı: `src/components/SiteHeader.tsx:44,45,56,57` ("Kampanyalar" + "Yarışmalar"
menü girişleri, hem girişli hem misafir menüsü) ve
`src/components/home-trial/action-buttons-data.ts:92,99`. **Yeniden açma gereği yok.**

**Kontrol edildi, link bulunamadı:** `src/` ağacı (tüm `.ts`/`.tsx`), `src/content/` HTML
parçaları, `public/`, `index.html`. `public/llms.txt` ve `public/sitemap.xml`'deki geçişler
keşif dosyasıdır, iç link değildir.

### Öneri
`/lansman` için `SiteHeader`/`SiteFooter` ya da ana sayfa kart bloklarından en az bir kalıcı
iç link — `/campaign`'de işleyen çözüm aynen uygulanabilir. `/19051919/harita` için
`May19CampaignPage` içine harita bağlantısı (zaten `#modules` çapası var, karşılıklı
bağlantı doğal).

---

## B. Üye sayfası — UI'dan hiç ulaşılamıyor

| Rota | Tanım | Bulgu |
|---|---|---|
| `/settings/notifications` | `src/App.tsx:278` (`NotificationPreferencesPage`) | `grep -rn 'settings/notifications' src` → **tek satır: kendi rota tanımı.** Hiçbir menüde, profil sayfasında, ayarlar bağlantısında ya da e-posta altbilgisinde yok. |

Sayfa `RequireAuth` arkasında ve çalışıyor; kullanıcı **yalnızca adresi elle yazarak** bildirim
tercihlerini değiştirebiliyor. Bildirim e-postaları canlıda (`docs/` → bildirim e-postaları
notları), yani "abonelikten çık / tercihleri yönet" akışının hedefi olması beklenir.

### Öneri
Profil menüsüne (`ProfileSwitcherMenu` veya kullanıcı açılır menüsü) bir giriş + bildirim
e-postalarının altbilgisine bağlantı.

---

## C. Admin — menü kaydı eksik

Dördünün de `src/lib/admin-shell/admin-route-meta.ts` içinde **breadcrumb kaydı var**
(`ADMIN_ROUTE_PATTERNS` + `pattern:` satırları), ama
`src/lib/admin-shell/admin-navigation-registry/` altında **menü öğesi (`to:`) yok** →
admin menüsünde görünmüyorlar.

| Rota | Tanım | Not |
|---|---|---|
| `/admin/events` | `src/pages/admin/routes.tsx:142` | ⚠️ `src/lib/admin-shell/admin-updates/2026-09.ts:62` duyurusunda tanıtıldı. **Aynı duyuru** Radar için *"Menüde Radar linki yoktu, kullanıcılar sayfaya ulaşamıyordu → düzeltildi"* diyor — events'te **aynı hata tekrarlanmış**. |
| `/admin/cadde/markalar` | `src/pages/admin/cadde/routes.tsx:21` | `AdminCaddeBrandsPage`. Menüde yok. |
| `/admin/workspace/todos` | `src/pages/admin/routes.tsx:155` | Menüde yok **ve** `AdminWorkspaceHomePage` kart listesinde de yok — orada 4 kart var: `/admin/workspace`, `/workspace/command-center`, `/workspace/resources`, `/workspace/mvp`. |
| `/admin/workspace/meeting-notes` | `src/pages/admin/routes.tsx:156` | Aynı durum. |

`admin-route-meta.ts:125-126` bu ikisini `parentId: "workspace-home"` ile tanımlıyor, yani
**workspace ana sayfasından linklenmeleri tasarlanmış** ama kart eklenmemiş.

### Öneri
`admin-navigation-registry/` ilgili gruba 4 madde, ya da `todos`/`meeting-notes` için
`AdminWorkspaceHomePage` kart listesine 2 kart (meta'daki `parentId` niyetine uygun olan bu).

> `src/pages/admin/routes.tsx` başlığındaki kural bunu zaten söylüyor:
> *"Yeni admin route eklerken: (1) buraya, (2) `admin-route-meta.ts` `ADMIN_ROUTE_PATTERNS`'a,
> (3) görünürse `admin-navigation-registry.ts`'e ekle — testler tutarsızlığı yakalar."*
> **(3) adımı bu dört rotada atlanmış ve testler yakalamamış** — bkz. [Kalıcılaştırma önerisi](#kalıcılaştırma-önerisi).

---

## D. Ters yön — canlı kırık link

**`/radio/:id/song-request` rotası YOK, ama link render ediliyor → kullanıcı 404 görüyor.**

| Yer | Kod |
|---|---|
| `src/pages/Associations.tsx:195` | `<Link to={`/radio/${a.id}/song-request`}>` — "İstek Parça" butonu |
| `src/pages/AssociationDetail.tsx:174` | `<Link to={`/radio/${assoc.id}/song-request`}>` — "İstek Parça Gönder" butonu |

Koşul: `a.type === "Radyo"`. `src/data/mock.ts:214-216`'da **3 radyo kaydı var**
(Radyo Metropol FM, Bizim Radyo, Radyo Türkü). `/associations` sayfası ana sayfadan linkli
(`src/components/home-trial/home-trial.data.ts:98`), yani **yol canlıda açık ve buton
çiziliyor.** `src/App.tsx` ve `src/lib/redirects.ts`'te `radio` geçmiyor → `NotFound`'a düşüyor.

### Öneri
İki seçenek: (a) butonu kaldır/gizle, (b) `/radio/:id/song-request` rotasını ve sayfasını ekle.
`/associations` ve `/association/:id` sayfaları `DemoPageBanner` taşıyor (demo veri uyarısı),
yani (a) daha tutarlı görünüyor — ama bu bir ürün kararı.

---

## E. Kasıtlı linksiz — dokunma

Bunlar **dış giriş noktası**; iç link olmaması doğru davranıştır. Orphan sayılmazlar.

| Rota | Giriş yolu |
|---|---|
| `/reset-password` | Supabase şifre sıfırlama e-postası — `src/hooks/admin/useAdminAccess.ts:79` `redirectTo` |
| `/welcome/activate` | Magic link (OTP) — `src/lib/pending-onboarding-api.ts:263` `emailRedirectTo` |
| `/vip/:token` | Davet bağlantısı (token taşır) |
| `/auth` | `AuthRouteRedirect` — legacy giriş yolu, `src/lib/redirects.ts:59`'da kayıtlı |
| `/whatsapp-groups/:id` | `DYNAMIC_LEGACY_REDIRECTS` — dinamik legacy 301 |

⚠️ **`/auth` ikinci ölçümde script'in orphan listesinden DÜŞTÜ, ama gerçekten link kazanmadı.**
Tek "hit" `src/components/ambassadors/AmbassadorApplicationForm.tsx:7` — bir **yorum satırı**
içindeki `navigate("/auth")`. Link tarayıcısı yorumları temizlemiyor (rota parser'ı temizliyor,
link tarayıcısı hayır — bkz. [kapsam sınırları](#bilinen-kapsam-sınırları)). `/auth` bu sınıfta
kalır; script çıktısında görünmemesi bir **yanlış negatif**tir.

---

## F. Yanlış pozitif — analizin sınırı

Statik analiz bunları orphan sandı; **elle doğrulandı, linkli çıktılar.** Script'i tekrar
çalıştıran oturumlar için buraya yazıldı — listeyi yeniden "bulgu" sanma.

| Rota | Neden kaçtı |
|---|---|
| `/profile/catalog/:itemId` | Link bir **fonksiyon dönüşünden** üretiliyor: `src/lib/profile-routing.ts:12` `profileEditorPathFor()`. Statik tarama dönüş değerini izleyemez. |
| `/tools/:toolSlug/session/:sessionId` | `window.history.replaceState` ile yazılıyor — `src/pages/relocation/tools/RelocationToolPage.tsx:130`. `<Link>`/`navigate()` değil. |
| `/tools/:toolSlug/result/:resultId` | Aynı — `RelocationToolPage.tsx:137`. Derin bağlantı kasıtlı. |
| `/isletme/:slug` | Fonksiyon dönüşü: `src/lib/business-demo-rows.ts:57` `businessDemoHref()`. **Ayrıca `src/lib/demo-pages.ts:47` yorumu bunu açıkça belgeliyor:** *"⚠️ `/isletme/:slug` buraya EKLENMEZ: `findDemoRoute` literal yol eşitliği arar, dinamik yol asla eşleşmez. O sayfa `DemoPageBanner` kullanır."* Bilinçli tasarım. |

---

## G. Ölü referans — duyuru metinlerinde

Admin duyuru **metni** içinde geçen, artık var olmayan adresler. `<Link>` değil, düz metin —
ama panelde okuyan biri deneyip 404 alır.

| Adres | Yer | Durum |
|---|---|---|
| `/statusreport3006` | `admin-updates/2026-06.ts:12`, `admin-updates/2026-07.ts:664` | Rota da, redirect de yok. |
| `/burak-stripe-rehberi` | `admin-updates/2026-06.ts:45` | `public/burak-stripe-rehberi.html` silinmiş (`CLAUDE.md` → "OBSOLETE. Dosya artık yok"). |

---

## Yöntem ve yeniden ölçüm

Script: [`orphan-route-scan.mjs`](orphan-route-scan.mjs) (bu klasörde). Çalıştırma:

```bash
node docs/audits/orphan-route-scan.mjs
```

Ne yapar:

1. **Rota ağacını nesting-aware parse eder.** `<Route>` açılış etiketinin sonunu süslü
   parantez + quote durumu izleyerek bulur, self-closing/child ayrımı yapar, `path`
   segmentlerini ebeveynden devralarak birleştirir. Kaynak: `src/App.tsx` +
   `src/pages/admin/routes.tsx` + 6 alt modül `routes.tsx` (hepsi `/admin` prefix'i altında).
2. **Yorumları temizler** (satır içi + blok), pozisyon/satır numarasını bozmadan. Bu şart:
   `muhasebe/routes.tsx` başında örnek kullanım olarak yorumlanmış `<Route>` blokları var.
3. **İç bağlantı hedeflerini toplar:** `to=`, `to:`, `href=`, `href:`, `path:`, `match:`,
   `navigate()`, `location.href`, `location.assign`, `window.open`, `corteqs.net/...` —
   çift tırnak **ve** template literal varyantlarıyla. `${...}` içeren segmentleri jokere çevirir.
4. **Parametreli rotaları desen olarak eşler** (`:slug` → `[^/]+`), joker rotaları
   (`*`, `/*`) kırık-link eşleşmesinden çıkarır.
5. Her orphan için **"zayıf değinme"** de raporlar: yol string'i rota tanımı/meta/SEO/sitemap
   dışında herhangi bir dosyada geçiyor mu? Bu, "hiç bilinmiyor" ile "biliniyor ama link yok"
   ayrımını yapar ve elle doğrulamayı hızlandırır.

JSON çıktı: script `OUT` sabitindeki dizine `orphan-report.json` yazar (tam hit listesi,
dosya:satır ile). **Depo köküne dosya bırakmaz.**

### Bilinen kapsam sınırları

| Sınır | Etki |
|---|---|
| **DB içeriği taranmadı** | Blog gövdeleri, marquee kayıtları, admin duyuru satırları, WhatsApp landing metinleri veritabanında. Oradan link gelmesi teorik olarak mümkün — A sınıfı için düşük olasılıklı ama kanıtlanmadı. |
| Fonksiyon dönüşlü linkler | Bkz. F sınıfı. 3 vaka elle ayrıldı; yeni benzerleri çıkabilir. |
| `history.pushState`/`replaceState` | Pattern listesinde yok (F sınıfının ikinci nedeni). |
| **Link tarayıcısında yorum temizliği yok** | `stripComments` yalnız rota parser'ında çalışır. Yorum içindeki `navigate("/x")` **link sayılır** → yanlış negatif. `/auth` tam bu yüzden ikinci ölçümde listeden düştü. |
| Test dosyaları hariç | Kasıtlı: testteki link gerçek link değil. |
| Harici linkler | Kapsam dışı — bu denetim yalnız iç bağlantı grafiğidir. |
| nginx katmanı | `nginx.conf.template` 301'leri ayrı katman; `src/lib/redirects.ts` üzerinden dolaylı kapsandı. |

---

## Kalıcılaştırma önerisi

Bu, `CLAUDE.md`'nin **"Değişmez sözleşmeler"** bölümündeki kalıba tam oturuyor: yeni rota
eklerken menü/link eklemeyi unutmak **ne `npm run lint` ne `npm run test` tarafından
yakalanıyor** — sayfa çalışır, test yeşil, kullanıcı ulaşamaz. C sınıfındaki 4 rota tam
olarak böyle oluştu ve `routes.tsx` başlığındaki "testler tutarsızlığı yakalar" iddiası
bu durumda **tutmadı**.

Öneri: script'i `scripts/check-orphan-routes.mjs` olarak taşı + bir sözleşme testi
(`src/lib/orphan-routes.test.ts`) ile bilinen kabul listesi (E ve F sınıfları) dışında
orphan çıkarsa düşür. `prelint`'e bağlanabilir.

⚠️ Böyle bir test yazılırsa kabul listesi **E ve F sınıflarını** içermeli; A/B/C/D
düzeltilmeden eklenirse test baştan kırmızı başlar.
