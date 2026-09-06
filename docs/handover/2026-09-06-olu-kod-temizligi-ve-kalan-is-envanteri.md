# Ölü kod temizliği + kalan iş envanteri — devir notu

**Devir tarihi:** 6 Eylül 2026 (gece)
**Öncül:** `docs/handover/2026-09-05-batch-cef-ve-canli-kusurlar.md`
**Dal:** `main` · `9eb9317` … `c655922`
**Push durumu:** `d5f7d4f..22c360e` (15 commit) **push edildi**; **4 commit BEKLİYOR**
(`73fe373`, `e5083a1`, `b4cb544`, `c655922`). Ayrıntı için aşağıdaki EK bölümüne bak.

## Kısa sonuç

Bu tur iki işten oluştu: (1) devredilen iki revizyon maddesi kapatıldı, (2) **kalan iş
envanteri** çıkarıldı ve envanterin ilk üç maddesi uygulandı. Net etki:
**+1.317 / −4.934 satır** — yani tur ağırlıklı olarak SİLME turuydu.

En önemli bulgu koda değil **belgeye** dairdi: CLAUDE.md'nin teknik borç bölümü büyük
ölçüde bayattı ve gelecek oturumları çoktan ödenmiş borcu yeniden ödemeye
yönlendiriyordu. Ölçüldü ve düzeltildi.

---

## 1) Ölçülen durum (tur sonu)

| Ölçü | Tur başı | Tur sonu |
|---|---|---|
| Test | 271 dosya / 1.881 | **270 dosya / 1.878** yeşil |
| ESLint | 0 | **0** |
| `tsc` | 22 | **16** |
| Kaynak dosya (`src`) | 1.092 | **1.073** |
| `as any` | 15 | **9** |
| 300+ satır dosya | 126 | **119** (ilk kez geriledi) |
| Migration | 383/383 sapmasız | değişmedi |

⚠️ **Doğrulama komutlarını BÜYÜK harfli dizinden çalıştır** (`C:\temp_private\...`).
Küçük harfli `c:` ile vitest 266 dosyanın 262'sini SAHTE kırar — ayrıntı öncül devir
notunda, bağımlılık düşürme.

## 2) CLAUDE.md bayattı — düzeltildi (`dabee64`, `93c693b`, `b67ebf6`)

| İddia (eski) | Gerçek |
|---|---|
| ESLint 1280 problem | **0** |
| 89 `as any` | **9** |
| 83 `from(` + 42 `rpc(` bileşende | **32** + **4** |
| 21 auth shim import'u | **16** (sonra 0) |
| 98 `tsc` hatası | **16** |
| ~78 MB video | **16,4 MB** |
| `public/burak-stripe-rehberi.html` yayında | dosya **yok** |

Bayat maddeler silinmedi, **CLOSED listesi** olarak bırakıldı — yoksa eski notlardan
tekrar açılır. Kalan 16 `tsc` hatası da artık "karar bekliyor" değil, üç sınıf hâlinde
belgeli (A: insert yükü 7 · B: `Json` sütunu 5 · C: sorgu kurucusu özyinelemesi 4).

## 3) Silinen ölü kod

**`cf5ed73` — düşürülmüş `role_taxonomy_rules`'a bağlı 3 ekran (~1.350 satır).**
`AdminTaxonomyPage`, `AdminLoginUsersRolesPage`, `ProfileCompletePopup`. Hiçbirinin
rotası yoktu. `AdminTaxonomyPage` bu tabloyu KOŞULSUZ yüklüyordu — rotaya bağlansaydı
hiç veri yüklemeyecekti. Silinen testlerden biri düşürülmüş tabloyu mock'layarak bozuk
davranışı kilitliyordu.

**`b3752d8` — auth shim'i import eden 14 ölü bileşen (−3.148 satır).** 16 dosyanın
erişilebilirliği `App.tsx` köklerinden izlendi; her "ölü" kararı **iki bağımsız
çürütücüye** verildi (rota/lazy açısından ve barrel/dinamik import açısından). Sonuç:
14 ölü, 0 belirsiz. Erişilebilir çıkan 2 dosyaya (`MessagesInbox`,
`WelcomePackOrderForm`) DOKUNULMADI.

⚠️ **Bu turda öğrenilen en değerli tuzak:** `docs/reference/global-network-bridge/` ve
`docs/reference-clones/` altında AYRI referans klonları var ve bu bileşenleri
**gerçekten import ediyorlar**. Ama `@/` alias'ı yalnız `src/`'ye çözülür ve o ağaçlar
build'e girmez. Naif bir grep bunları "kullanılıyor" sayar. Bir bileşeni kullanılıyor
saymadan önce import zincirini `App.tsx`'e kadar takip et.

## 4) Auth shim kaldırıldı — B5 kapandı (`7d76155`)

16 dosya kanonik `@/components/auth/useAuth`'a geçirildi, `src/contexts/AuthContext.tsx`
silindi. Belgelerin aylardır uyardığı `loading`→`isLoading` tip çakışması **hiç
yaşanmadı**: shim'in kattığı tek şey `loading` alias'ıydı ve ölçüldüğünde hiçbir dosya
onu kullanmıyordu (hepsi yalnız `{ user }`, biri ayrıca `refreshProfile`).

⚠️ **Test tuzağı:** `vi.mock` yolu bileşenin GERÇEKTEN import ettiği yol olmalı. Yanlış
yolu mock'lamak sessizce hiçbir şeyi değiştirmez ve test
`"useAuth must be used within AuthProvider"` ile patlar. `MessagesInbox.test.tsx` tam
bu yüzden güncellendi.

## 5) Kapatılan revizyon maddeleri

- **`0838da0b`** (`4223eb6`) — CTA ile ayrılan kullanıcıya "Test sonucuna dön" şeridi.
  `sessionStorage` izi + `PublicLayout`'ta tek noktadan bağlanan şerit. Sorgu
  parametresi bilinçli REDDEDİLDİ: kullanıcı hedefte derinleşince düşerdi.
  Adres `window.location`'dan okunur, `useLocation`'dan değil — sonuç adresini
  `replaceState` yazıyor ve o router'ı güncellemiyor.
- **`a275f131`** (`4f5a256`) — Sonuç barları puan bandına göre renklendi. Renk gözle
  değil **ölçülerek** seçildi (renk körlüğü + kontrast denetimi). Kabul edilen rampa
  `emerald-600 / sky-600 / amber-600 / rose-600` hem açık hem koyu yüzeyde geçiyor.
  ⚠️ Elenen aday: `emerald→lime→amber→rose` — iki yeşil komşu olunca normal görüde
  ΔE 10,8 (taban 15). **Yeşilin yanına ikinci yeşil koyma.**

## 6) Burak için üretilenler

- **Test kılavuzu** (`31a21c2`): `docs/guides/2026-09-05-burak-gui-test-rehberi.html`
  — 12 adımlık elle GUI testi. Maddeler **A (şimdi test edilebilir)** / **B (yayın
  sonrası)** diye ayrıldı ve başta tek adımlık bir **kanarya** var: `/cadde/carsi`'de
  kategori rozetine tıkla — gidiyorsa yeni sürüm yayında.
- **Admin panel duyurusu** (`046ba4d`): günün ikinci partisi günlük dille, 14 madde.
  18:00 Berlin günlük özetine kuyruklandı.

---

---

## EK — Temizlik kampanyası (aynı gün, `b1586a5` … `b4cb544`)

Yukarıdaki bölüm yazıldıktan SONRA devam edildi. Bu ek, o turu anlatır.

## Yöntem değişti: ajan yerine statik grafik

İlk iki parti (`cf5ed73`, `b3752d8`, `22c360e`) ajanlarla **dosya başına** doğrulanmıştı.
Sonrası için statik import grafiği yazıldı — bu iş için **kesin**, ajan örneklemesi
olasılıksal. Grafiğin geçerli olması üç koşula bağlıydı ve üçü de doğrulandı:

- tek giriş noktası (`index.html` → `src/main.tsx`),
- değişken yollu dinamik `import()` **yok**,
- tek `import.meta.glob` kod değil HTML hedefliyor.

Ayrıca `scripts/` ve `workers/` `src`'den **hiç import etmiyor** — yani ikinci bir kök yok.

**Çapraz doğrulama:** ajanların bağımsız olarak "erişilebilir" dediği 6 dosyanın altısı
da grafikte erişilebilir çıktı. İki bağımsız yöntem uyuştu.

⚠️ **Analizörün bilinen kör noktası:** config **dizeleriyle** anılan dosyaları göremez.
`src/test/setup.ts` (vitest.config içinde dize) ve `src/vite-env.d.ts` (ambient bildirim)
yanlış pozitif çıktı. Bu yüzden her partiden önce `src` dışı ayrıca tarandı.

## Sonuç: 820 dosyanın 134'ü erişilemezdi

Üç partide silindi (her partiden sonra test + tsc + lint, 1. partide ayrıca build):

| Parti | Ne | Dosya |
|---|---|---|
| 1 (`73fe373`) | hiç import edeni yok, testi yok, `ui/` dışı | 82 |
| 2 (`e5083a1`) | 1. partinin açtığı kaskad + öksüz kalan üreteç script'i | 15 |
| 3 (`b4cb544`) | testi olan ölü modüller, **testleriyle birlikte** | 18 |

Öne çıkanlar: `home-trial` atlas dalı tamamen ölüymüş (`GlobalAtlasSection` →
`WorldAtlasMap` → `world-geojson` + üreteci `scripts/generate-world-geojson.mjs`,
npm script'i bile yoktu) · rota birleştirmesinde arkada kalan üç admin ekranı ·
`Consultants`, `Bloggers`, `Businesses`, `EventDetail`, `JobBoard`, `AITwin` gibi
menüden çıkarılmış eski ürün sayfaları.

## ⚠️ Bu turda yapılan hata — tekrarlanmaması için

**Partileri "testi var / yok" diye bölmek bir bağımlılık kenarını ortadan kesti.**
`individual-profile.ts` (testsiz) silindi; onu import eden `usePublicIndividualProfile.ts`
— kendisi de ölü ama *testli* olduğu için sonraki partiye bırakılmıştı — yerinde kaldı ve
testi `Failed to resolve import` ile kırıldı. İkisi de ölü olduğu için çift birlikte
silinerek düzeltildi.

**Kural: ölü kodu test varlığına göre değil, TAM ALT GRAFİK olarak parçala.**

İkinci ders: doğrulamada `grep -rn "<ad>"` yanıltıcıdır. `profile-view-model` "10 canlı
referans" gösterdi; hepsi `public-catalog-profile-view-model` adlı **başka** bir modüldü
(alt dize eşleşmesi). Tam import yolunu ara.

## Dokunulmayanlar ve nedenleri

- **Ajan yürütme katmanı** (7 modül + 9 test: `agent-client`, `tool-executor`,
  `tool-verifier`, `anonymize`, `injection-guard`, `telemetry-sink`, `resilience`).
  Erişilemez ama **kazara ölü kod değil**: testleri var, ikisi güvenlik amaçlı, henüz
  merge edilmemiş bir PR'a bağlı tamamlanmamış altyapı. Aynı ailenin canlı iki parçası
  (`tool-router`, `tools-catalog.generated`) admin sayfalarından kullanılıyor.
  **Silinmesi ürün kararıdır, temizlik işlemi değil.**
- **`src/components/ui/*`** — 20 kullanılmayan shadcn primitifi. Vendored kit; ayrı karar.
- **`admin/shell/index.ts`** — kullanılmıyor ama `AdminLayout.tsx` yorumu onu "yeni kodda
  tercih edilen giriş" diye gösteriyor; silmek belgelenmiş niyetle çelişirdi.

## Ayrıca bu turda

- **tsc B sınıfı kapandı** (`b1586a5`): `src/lib/supabase-json.ts` → `toJson` / `fromJson`.
  Yol boyunca gerçek bir yanlışlık bulundu: `muhasebe-butce-api` satırın tamamını, `state`
  alanını `ButceYearState` diye tarif eden **sahte** bir arayüze çeviriyordu; oysa sütun
  `jsonb`. TypeScript haklıydı, belge yanlıştı. ⚠️ `fromJson` bir **doğrulama değildir**.
- **15 commit push edildi** (`d5f7d4f..22c360e`), `git ls-remote` ile doğrulandı.

## Kapanış ölçümü (tur sonu)

| Ölçü | Tur başı | Tur sonu |
|---|---|---|
| Test | 271 dosya / 1.881 | **259 dosya / 1.816** yeşil |
| ESLint | 0 | **0** |
| `tsc` | 22 | **9** |
| Kaynak dosya | 1.092 | **950** |
| 300+ satır dosya | 126 | **92** |
| Erişilemez dosya | 134 | **30** |

Oturumun tamamı (`0771f13..HEAD`): **203 dosya, +3.591 / −29.210 satır.**

⚠️ Bu ek yazıldığında **3 commit push edilmemişti** (`73fe373`, `e5083a1`, `b4cb544`).

---

## Sıradaki adımlar — YARIN BURADAN BAŞLA

1. **4 commit'i push et** (`73fe373`, `e5083a1`, `b4cb544`, `c655922`). Bunlar
   temizliğin 1–3. partileri ve belge kapanışı. Push öncesi `git fetch` + `git log
   HEAD..origin/main` ile uzakta yeni iş var mı bak.
2. **Dağıtımı doğrula** — Burak test kılavuzundaki kanarya adımı: `/cadde/carsi`'de
   kategori rozetine tıkla, gidiyorsa yeni sürüm yayında.
3. **İki ürün kararı bekliyor** (kod işi değil, karar işi):
   - **Ajan yürütme katmanı** (7 modül + 9 test: `agent-client`, `tool-executor`,
     `tool-verifier`, `anonymize`, `injection-guard`, `telemetry-sink`, `resilience`)
     silinsin mi, yoksa tamamlanacak iş olarak mı dursun? Erişilemez ama kazara ölü
     kod DEĞİL — testleri var, ikisi güvenlik amaçlı, merge edilmemiş bir PR'a bağlı.
   - **`src/components/ui/*`** — 20 kullanılmayan shadcn primitifi temizlensin mi?
     Vendored kit; kullanılmayanları tutmak yaygın pratiktir.
4. **T4 — bileşen içi Supabase çağrıları.** Temizlik sayesinde **yarıya indi**:
   29 çağrı / 21 dosya → **18 çağrı (15 `from(` + 3 `rpc(`) / 13 dosya**.
   `*-api.ts` + React Query desenine taşınacak. Sıradaki en büyük kod işi.
5. **Kalan `tsc` hataları: 9.** İki sınıf, ikisi de belgeli (CLAUDE.md "Known
   Limitations" md.5): A — Supabase insert/update yükü (mekanik), C — sorgu kurucusu
   özyinelemesi (`command-center-items`, `diasporaSearch`).
6. **Üç eski ürün kararı** — (a) unvan yetki mi verir *(Batch C bunsuz uygulanamaz)*,
   (b) ek hedef ücretli mi, (c) m22 kapatılsın mı. Ayrıca `50362e2a` (araç sonucunu
   profile kaydetme) hangi nitelik + açık rıza metni kararını bekliyor.
7. **WS1-7** (SMTP → e-posta doğrulaması) ve **WS1-8/11** (OTP sağlayıcı) dış karar.
8. **Operasyon:** hoş geldin maili anahtarı (**kritik** — kapalıyken kaydolan üye
   maili hiç almıyor ve telafi edilmiyor), login'li QA turu, revizyon panosunu
   "yapıldı"ya çevirme, Supabase custom domain.

**Tam envanter** (K1–K5 kararlar · T4–T6 teknik borç · O1–O9 operasyon):
`~/.claude/plans/yap-lacak-kalanlarla-ilgili-yeni-zazzy-canyon.md`

**Ölü kod analizörü** oturumluk bir scratchpad script'iydi, depoya alınmadı. Tekrar
gerekirse: `src/main.tsx` kökünden BFS, `@/`→`src/` çözümlemesi, test dosyaları hariç.
Kör noktası: config **dizeleriyle** anılan dosyalar (bkz. EK bölümü).

⚠️ `public/sitemap.xml` (yalnız `lastmod`) ve
`docs/status/mevcut-profil-yapisi-raporu-2026-08-20-sade-anlatim.html` hâlâ commit
edilmemiş. Üç oturumun da ilk `git status`'ünde vardılar; kimse dokunmadı. Karar sizde.

## Bu turda öğrenilen üç şey

1. **Belge de bayatlar ve bayat belge aktif zarar verir.** "1280 lint problemi" notu
   bir sonraki oturumu var olmayan bir borcu ödemeye yollardı. Rakam yazan her satır
   ölçüm tutanağıdır; değiştirmeden önce komutu tekrar çalıştır.
2. **`tsc`'nin "karar bekliyor" listesi aslında ölü kod ihbarıydı.** 22 hatanın 6'sı,
   düşürülmüş bir tabloya bağlı üç erişilemez ekrandan geliyordu. Liste okunmadığı
   için aylarca "tip borcu" sanıldı.
3. **Erişilebilirlik grep'le ölçülmez, zincirle ölçülür.** `docs/` altındaki referans
   klonları gerçek `import` satırları taşıyor ama build'e girmiyor; tersi de mümkün
   (bir dosyayı yalnız başka ölü dosyalar import ediyor olabilir).
