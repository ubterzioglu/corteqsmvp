# Relocation Modülü Planı

> **Durum tazelendi 2026-09-21.** Bu dosyada daha önce 18 batch'in HEPSİ ✅
> işaretliydi ve bu YANLIŞTI: seed şablonu `6ab181e`'den beri hiç doldurulmamıştı,
> dört içerik tablosu da canlıda **0 satır**dı. İşaretler ölçümle değil, iyimserlikle
> konulmuş. Aşağıdaki her işaret 21 Eylül'de canlı DB'ye ya da kaynak dosyaya
> bakılarak konulmuştur.
>
> İşaret anlamları:
> **✅ kod/DB'de doğrulandı** · **🔎 tarayıcıda gözle doğrulanmayı bekliyor**

---

## Batch 0 — Rota, header, plan kimliği

### Batch 0a — Rota smoke testi (sayfa açılışı) ✅ 🔎
- `/relocation` rotası `src/App.tsx:168`'de tanımlı.

### Batch 0b — Header bağlantısı ✅
- `src/components/SiteHeader.tsx:38` → `{ key: "relocation", label: "Taşınma Planlayıcı", to: "/relocation" }`.

### Batch 0c — `?move=` oluşumu ✅ 🔎
- `RelocationHomePage.tsx:75-81` `moveId`'yi URL'den okur ve `setSearchParams` ile yazar.

## Batch 1 — Plan devamlılığı

### Batch 1a — Sayfa yenileme 🔎
- Kod doğru: dosya kimliği URL'de yaşar, bileşen state'inde değil. Tarayıcı testi yapılmadı.

### Batch 1b — Çoklu plan geçişi 🔎
- `MoveSelector` + `listMoves` bağlı. Tarayıcı testi yapılmadı.

## Batch 2 — Asistan

### Batch 2a-2d — Soru, yanıt, hata, CSP 🔎
- `supabase/functions/relocation-assistant` repoda ve canlıda (20 Eylül'de deploy edildi,
  duman testi geçti). Tarayıcı içinden uçtan uca test 21 Eylül'de YAPILMADI.
- ⚠️ Coolify edge function deploy ETMEZ. Fonksiyon değişirse
  `supabase functions deploy relocation-assistant` elle koşulmalıdır.

## Batch 3 — Seed provası ✅

### Batch 3a — Seed şablonu doldurma ✅
- Şablon (`2026-09-20-...-sablonu.sql`) "nasıl yapılır" dokümanı olarak DURUYOR.
- Gerçek içerik ayrı dosyada: **`docs/operations/2026-09-21-relocation-icerik-seed.sql`**.

### Batch 3b — UTF-8 kontrolü ✅
- Uygulama sonrası canlıda doğrulandı: Türkçe karakterler tam, mojibake taraması **0 satır**.

### Batch 3c — `BEGIN ... ROLLBACK` ✅
- Prova koşuldu: `INSERT 0 192` + `INSERT 0 156` + `INSERT 0 48`, hata yok, ROLLBACK temiz.

## Batch 4 — Seed uygulaması ✅

### Batch 4a — Seed uygulaması ✅
- Canlıya uygulandı. **12 ülke:** DE, NL, GB, US, CA, FR, AT, BE, CH, SE, AE, QA.
- **İdempotens kanıtlandı:** seed ikinci kez koşuldu, satır sayısı sabit kaldı.

### Batch 4b — Dört tablo doğrulama ✅
| Tablo | Satır |
|---|---|
| `relocation_living_costs` | **192** (12 ülke × hane 1/2/4) |
| `relocation_required_documents` | **204** (13 ortak × 12 ülke + 48 ülkeye özgü) |
| `relocation_move_progress` | 0 — kullanıcı kutucuk işaretledikçe dolar (doğru) |
| `relocation_move_documents` | 0 — kullanıcı döküman kaydettikçe dolar (doğru) |

- Her ülke TEK para birimi kullanır. `sumMonthlyCosts` karışık para biriminde toplamayı
  REDDEDER; kontrol sorgusu boş döndü.
- **Yan bulgu ve düzeltme:** `relocation_required_documents`'ta tekillik indeksi YOKTU.
  Seed ikinci kez koşsaydı satırları hatasız çoğaltır, kullanıcı aynı belgeyi iki kez
  görürdü. Migration yazıldı, uygulandı, ledger'a kaydedildi:
  `supabase/migrations/applied/20260921110000_relocation_required_documents_uniq.sql`.

### Batch 4c — Sekme görünürlüğü ✅ 🔎
- Kod `content.livingCosts.length > 0` / `requiredDocuments.length > 0` ile gateler;
  veri artık var, sekmeler çizilmeli. Tarayıcıda gözle doğrulanmadı.

## Batch 5 — Eksik sekmeler ✅ (karar DEĞİŞTİ)

> İlk karar "şimdilik yapılmasın"dı. Kullanıcı 21 Eylül'de değiştirdi: *"Sekmeleri ekle
> sen sembolik olarak demo datayla, zaten demo yazacağız bu toola son haline gelene kadar."*

### Batch 5a/5b/5c — Veri kaynağı ✅
- Üçü de **demo içerik** ile çizilir: `src/lib/relocation-demo-content.ts`.
- Yeni tablo AÇILMADI, `catalog_items`'a BAĞLANMADI — gerçek veri kaynağı kararı
  hâlâ açıktır ve araç son haline gelirken verilecektir.

### Batch 5d — Mock veri ekleme kararı ✅
- Eklendi, ama referansın kusuru taşınmadan:
  1. **Sayfa DEMO işaretli.** `/relocation` `src/lib/demo-pages.ts` → `DEMO_ROUTES`'a
     eklendi; bant `SiteHeader` tarafından rotadan türetilir, sayfaya elle uyarı yazılmadı.
  2. **Üç sekme `isDemoRoute("/relocation")` ile gatelidir.** `DEMO_ROUTES` satırı
     silindiğinde sekmeler kendiliğinden kaybolur — demo içerik canlıda unutulamaz.
  3. **Uydurma işletme/okul ADI yoktur.** Kayıtlar bilerek kategori kartlarıdır
     ("Türk Marketi", "Uluslararası Okul"). Gerçek görünen bir ad ziyaretçi tarafından
     aranır ve bulunamayınca güven kaybı yaratır; kategori kartı aranmaz.
  4. Her panel kendi uyarı satırını taşır — kullanıcı sekmeye kaydırarak gelince
     yukarıdaki bandı görmeyebilir.

---

## Doğrulama (21 Eylül, ölçüldü)

| Kontrol | Sonuç |
|---|---|
| `npx vitest run` (demo-pages + RelocationHomePage + content-format) | ✅ **41 test / 3 dosya yeşil** |
| `npx eslint` (değişen 4 dosya) | ✅ **0 problem** |
| `tsc` — benim dosyalarım | ✅ **0 hata** |
| Kodlama denetimi — benim dosyalarım | ✅ **bulgu yok** |
| `npm run ingest:tools` | ✅ tazelendi (45 araç) |

⚠️ **Depo genelinde üç kırmızı var ve ÜÇÜ DE BU İŞTEN DEĞİL** — paralel bir oturumun
yarım kalan işinden geliyor, ezberlenmemeli, yeniden ölçülmeli:
1. `tsc` → `src/lib/catalog-directory.test.ts` 5 hata (`DIRECTORY_PAGE_SIZE`,
   `getTotalDirectoryCount` kaynakta yok).
2. `npm run verify:text` → `scripts/ai-knowledge/text-extract.mjs` (`"&Auml;": "Ä"`).
   Bu `pretest`/`prelint` kancası olduğu için **`npm run test` ve `npm run lint` hiç
   koşamıyor** — bu yüzden yukarıdaki doğrulamalar `npx` ile doğrudan koşuldu.
3. `ingest:tools` diff'inin büyük kısmı `src/lib/kadro/*` — `bdf4916 feat(kadro)`
   commit'i katalogu tazelememiş. Benim eklediğim tek satır
   `src/lib/relocation-demo-content.ts`.

---

## Kalan

- [ ] **Tarayıcı QA** (🔎 işaretli maddeler): plan oluştur → sayfayı yenile → plan
      kaybolmamalı; maliyet/belge/demo sekmeleri çizilmeli; asistan yanıt vermeli;
      konsolda CSP ihlali olmamalı.
- [ ] **Commit + deploy.** 21 Eylül'de commit YAPILMADI: çalışma dizininde paralel bir
      oturumun değişiklikleri var (`catalog-directory`, `DirectoryPage`, `Associations`,
      `e2e/`, `scripts/ai-knowledge/`). Pathspec'siz commit onların yarım işini içeri alır.
- [ ] **Gerçek veri kaynağı kararı** — demo sekmeler gerçek içeriğe kavuşunca
      `DEMO_ROUTES`'tan `/relocation` satırını sil.
- [ ] Rakamların tazeliği: `freshness_at` dolduruldu. Aralıklar 2026 başı genel piyasa
      bilgisidir, resmî bir fiyat endeksinden TÜRETİLMEMİŞTİR.
