# Kalan işler — 10 dakikalık batch planı

**Yazıldı:** 6 Eylül 2026 · **Temel:** `docs/handover/2026-09-06-olu-kod-temizligi-ve-kalan-is-envanteri.md`
**Taban ölçüm:** 259 dosya / 1.817 test yeşil · ESLint 0 · `tsc` 9 · `main` = `origin/main` = `ca83d38`

## Bir batch'in anatomisi (neden 10 dakika)

Doğrulama maliyeti sabit ve batch'in yarısını yer:

| Adım | Süre |
|---|---|
| `npm run test` (tam suite) | ~60–120 sn |
| `npx tsc -p tsconfig.app.json --noEmit` | ~60 sn |
| `npm run lint` | ~30 sn |
| **Doğrulama toplamı** | **~3–4 dk** |

Yani bir batch'te **gerçek iş için ~6 dakika** kalır. Bu yüzden her batch **tek dosya
ya da tek kavram** ile sınırlı. Bir batch iki dosyaya yayılıyorsa yanlış bölünmüştür.

⚠️ **Çalışma dizini BÜYÜK harfli olmalı** (`C:\temp_private\...`). Küçük harfli `c:` ile
vitest 266 dosyanın 262'sini SAHTE kırar.
⚠️ Yeni bir `src/lib` export'u eklersen `npm run ingest:tools` çalıştır.

---

## A — Karar batch'leri (kod yok, ~10 dk toplam)

Bunlar **tek başına yapılamaz**, cevap gerektirir. Cevap gelmeden B/C batch'leri sırayı bekler.

- **A1 — Ajan yürütme katmanı ne olacak?** 7 modül + 9 test (`agent-client`,
  `tool-executor`, `tool-verifier`, `anonymize`, `injection-guard`, `telemetry-sink`,
  `resilience`). Erişilemez ama kazara ölü kod DEĞİL: testleri var, ikisi güvenlik
  amaçlı, merge edilmemiş PR'a bağlı. *Silinecekse → B0 batch'i (10 dk).*
- **A2 — `src/components/ui/*` 20 kullanılmayan shadcn primitifi silinsin mi?**
  Vendored kit; kullanılmayanları tutmak yaygın pratik. *Silinecekse → B0b (10 dk).*
- **A3 — Unvan yetki mi verir, yalnız görünür mü?** Batch C (rol/etiket mimarisi)
  bunsuz uygulanamaz. "Yalnız görünür" cevabı işin ~%80'ini kaldırır.
- **A4 — Ek hedef ücretli mi?** Kapı şu an kapalı, kayıp durmuş durumda.
- **A5 — m22 kapatılsın mı?** Kendisiyle çelişiyor, canlıda tersi uygulanmış.
- **A6 — `50362e2a` araç sonucunu profile kaydetme:** hangi nitelik + açık rıza metni.

---

## B — Teknik borç batch'leri (her biri ~10 dk, sırayla)

### B1 — `resource-links.ts` insert yükünü tiple *(tsc 9 → 7)*
İki `TS2345` (satır 207, 226). Yükü satır tipiyle açıkça tiple. Sınıf A'nın en temiz örneği.

### B2 — `turkish-missions` kalıntısı yok, sıradaki: `LinkManager.tsx` *(tsc 7 → 6)*
Tek `TS2345` (satır 299). Aynı desen, tek çağrı.

### B3 — `MvpManager.tsx` insert yükü *(tsc 6 → 5)*
Tek `TS2345` (satır 110). `{ [x: string]: string }` yerine gerçek satır tipi.

### B4 — İki test fixture'ı *(tsc 5 → 3)*
`marquee.test.ts:17` + `submissions.test.ts:82`. Fixture'lar üretilen satır tipine
uydurulur. İkisi aynı kavram olduğu için tek batch.

### B5 — `command-center-items.ts` özyinelemesi *(tsc 3 → 0)*
Üç `TS2589` (703, 750, 787) — "type instantiation excessively deep". Zinciri bölmek
veya ara tip vermek gerekir. **Sınıf C'nin tek kalemi ve en zoru**; 10 dk yetmezse
ikiye böl: önce 703, sonra 750+787.

> B1–B5 bittiğinde **`tsc` 0** olur. Bu, "relaxed strict mode"u sıkılaştırma
> tartışmasını ilk kez masaya koyabilecek durum demektir.

### B6 — Ölü kod analizörünü depoya al *(bağımsız, ~10 dk)*
Oturumluk scratchpad script'iydi. `scripts/check-dead-code.mjs` + `npm run check:dead`
olarak ekle. ⚠️ Kör noktası belgelenmeli: config **dizeleriyle** anılan dosyalar
(`src/test/setup.ts`, `src/vite-env.d.ts`) yanlış pozitif çıkar — bunlar bilinen istisna
listesine yazılmalı, yoksa script her koşuda gürültü üretir.

---

## C — T4: bileşen içi Supabase çağrıları (13 dosya, 18 çağrı)

Ölü kod temizliği bu işi **yarıya indirdi** (29 çağrı / 21 dosya → 18 / 13).
Hedef: `*-api.ts` + React Query. **Dosya başına bir batch**, en kolaydan zora:

| Batch | Dosya | Çağrı | Satır | Not |
|---|---|---|---|---|
| C1 | `profile/RequestNewProfileDialog.tsx` | 1 | 171 | en küçük, deseni burada kur |
| C2 | `dashboard/mvp/MvpManager.tsx` | 1 | 258 | B3 ile aynı dosya — **B3'ten sonra yap** |
| C3 | `admin/AdminWhatsAppLandingEditorsPage.tsx` | 1 | 260 | |
| C4 | `WelcomePackOrderForm.tsx` | 1 | 269 | |
| C5 | `admin/AdminDurumRaporuPage.tsx` | 1 | 316 | |
| C6 | `messaging/MessagesInbox.tsx` | 1 | 338 | |
| C7 | `InterestForm.tsx` | 1 | 377 | |
| C8 | `ServiceRequestForm.tsx` | 1 | 451 | |
| C9 | `admin/AdminReferralPage.tsx` | 1 | 587 | |
| C10 | `dashboard/links/LinkManager.tsx` | 1 | 994 | B2 ile aynı dosya — **B2'den sonra** |
| C11 | `ServiceRequestsList.tsx` | 2 | 333 | iki çağrı, tek modül |
| C12 | `admin/AdminRolesOverviewPage.tsx` | 4 | 263 | **en yoğun**; 10 dk yetmezse ikiye böl |
| C13 | `ProfilePage.tsx` | 2 | **2818** | ⚠️ dev dosya — tek batch'te yalnız çağrıları taşı, refactor'e girişme |

⚠️ **C1'i deseni kurmak için kullan.** Sonraki 12 batch o desenin tekrarıdır; deseni
yanlış kurarsan 12 batch'i birden yeniden yapmak gerekir.

---

## D — Operasyon batch'leri

- **D1 — Hoş geldin maili anahtarını aç (~10 dk, KRİTİK).**
  Canlı ölçüm: `email.member_welcome.enabled = false`. Anahtar kapalıyken kaydolan
  üye maili **hiç almıyor ve sonradan telafi edilmiyor** — geciktikçe mailsiz üye
  birikiyor. Önce kendine örnek gönder, sonra aç.
- **D2 — İki sahipsiz dosyayı karara bağla (~5 dk).** `public/sitemap.xml` (yalnız
  `lastmod`) ve `docs/status/mevcut-profil-yapisi-raporu-...html`. Üç oturumun da ilk
  `git status`'ünde vardılar; commit mi, geri mi alınacak?
- **D3 — `dispatch.secret` düz metin duruyor (~10 dk, GÜVENLİK).**
  `notification_settings` tablosunda düz metin bir gönderim sırrı var ve sıradan bir
  SELECT ile okunabiliyor. RLS'i admin ile sınırlıysa risk düşük ama sır bir ayar
  tablosunda durmamalı — Edge Function secret'ına taşınmalı.
- **D4 — Login'li QA turu (~45–60 dk, batch DEĞİL).** Kapsam Cadde redesign ile
  büyümüş; tek oturumda yapılmalı, bölünmemeli.
- **D5 — Revizyon panosunu "yapıldı"ya çevir.** D4'ten sonra.
- **D6 — Supabase custom domain.** Plan hazır, hiçbir adım başlamamış; add-on açılması
  gerekiyor (dış bağımlılık).

---

## Önerilen sıra

1. **A1 + A2** cevaplanır (2 dk) → gerekiyorsa **B0/B0b** silme batch'leri.
2. **D1** (kritik, her gün gecikmesi mailsiz üye demek).
3. **B1 → B5** sırayla → `tsc` 0.
4. **B6** (analizör depoya) — ölü kodun yeniden birikmesini durdurur.
5. **C1** ile desen kurulur, sonra C2–C13.
6. **D4** QA turu, ardından **D5**.
7. A3–A6 kararları geldikçe ilgili işler açılır.

## Her batch'in kapanış kontrolü

```
npm run test        # 259 dosya / 1.817 taban; DÜŞERSE dur
npm run lint        # 0 problem tabanı
npx tsc -p tsconfig.app.json --noEmit   # taban ARTMAMALI
```

Bir batch tabanı bozuyorsa **commit etme** — batch'i böl ya da geri al.
