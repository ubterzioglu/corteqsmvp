# DEVİR — /tools Görsel Yenileme + Uzay Banner'ı — 2026-08-03 00:28

> Bu dosya bu oturumda `/tools` üzerinde yapılan HER ŞEYİN tek özetidir. Önceki
> ara not [2026-08-02-tools-hub-redesign-devir.md](2026-08-02-tools-hub-redesign-devir.md)
> bu dosyayla birleşti/güncellendi — kök temizliği görevi orada "Sonuç" bölümüyle
> zaten kapatılmıştı, burada tekrar özetleniyor.

## Neden

Kullanıcı `/tools` menüsünü "biraz daha etkileyici" bulmak istedi; ilk cila
sonrası "kartları biraz alengirli yap" ve son olarak "tollara girince uzay
havası yaşat" geri bildirimleriyle iş üç aşamada büyüdü.

## Ne yapıldı (kronolojik)

1. **Hub hero + kart cilası (Plan A)** — `RelocationToolsHub.tsx` üst başlığına
   markanın `tech-aurora`/`tech-grid`/`text-gradient-tech` dili eklendi;
   `ToolLandingCard.tsx`/`ToolAccordionCard.tsx` kartlarına görsel üstü gradyan +
   üstte başlık, hover'da glow-gölge + zoom, `result_kind`'e göre değişen rozet
   (Skor/Sıralama/Persona/...) + soru sayısı bilgisi.
2. **Renkli ikon/halka/şerit (2. geçiş)** — yeni `src/lib/relocation-tools-result-style.ts`:
   her `result_kind` logonun 6 renginden birine (teal/mavi/indigo/pembe/turuncu/sarı)
   + bir lucide ikonuna eşleniyor. Kart artık ikonlu renkli rozet, renkli ince halka,
   üstte ombré şerit (masaüstü) / sol kenar çizgisi (mobil) taşıyor.
3. **Kök dizin temizliği (görev + uygulama)** — `1readme.md` ve `tab_of.json`
   `docs/archive/root-2026-08-03/`'e taşındı (`git mv`, geçmiş korundu).
   `.secretdb` (canlı Supabase/API sırları) ve `walast.txt` (ham WhatsApp dökümü,
   telefon numaralı) **bilinçli olarak taşınmadı** — ikisi de zaten `.gitignore`'da,
   `docs/` git'e commit'lendiği için taşımak sırrı repo geçmişine sokardı.
4. **Admin paneli duyurusu** — `src/lib/admin-shell/admin-updates.ts`'e
   `20260802-araclar-hub-gorsel-yenileme` kaydı eklendi (18:00 Berlin günlük özet
   mailine otomatik kuyruğa alındı).
5. **Uzay banner'ı (`/tools/:slug` girişi)** — `RelocationToolPage.tsx`'teki üst
   tanıtım bandı (başlık + hero görsel) artık koyu nebula gradyanlı bir "uzay
   kabuğu": tiled radial-gradient yıldızlar (5sn twinkle), üç yüzen ikon
   (✨🪐⭐, mevcut `.profile-globe` animasyonu yeniden kullanıldı), beyaz
   gradyanlı başlık. Yeni CSS: `src/index.css` → `.tools-space-shell`,
   `.tools-space-stars`, `@keyframes tools-space-twinkle` (+ reduced-motion guard).
   **Kapsam bilinçli dar:** yalnız bu üst bant değişti; `QuestionStepper` ve
   `ToolResultView` (kendi Card yüzeylerinde, tema tokenlarına bağımlı)
   dokunulmadı. Almanya standalone araçları (banka/sigorta/vize/maaş/vatandaşlık/
   para-transferi/StepStone) bu sayfayı hiç kullanmıyor — kendi bileşenleri var,
   kapsam dışı kaldı.

## Değişen dosyalar

| Dosya | Değişiklik |
|---|---|
| `src/components/relocation/tools/RelocationToolsHub.tsx` | Hero aurora + gradyan başlık |
| `src/components/relocation/tools/ToolLandingCard.tsx` | Görsel gradyan, hover glow, renkli ikon rozeti, halka, üst şerit |
| `src/components/relocation/tools/ToolAccordionCard.tsx` | Mobil eşdeğeri (sol kenar çizgisi) |
| `src/lib/relocation-tools-copy.ts` | `RESULT_KIND_BADGE_LABELS` |
| `src/lib/relocation-tools-result-style.ts` (yeni) | `resultKindStyle()` — ikon+renk haritası |
| `src/pages/relocation/tools/RelocationToolPage.tsx` | Uzay banner'ı (hero+başlık bandı) |
| `src/index.css` | `.tools-space-shell`, `.tools-space-stars`, twinkle keyframe |
| `src/lib/admin-shell/admin-updates.ts` | Duyuru kaydı |
| `docs/archive/root-2026-08-03/1readme.md`, `tab_of.json` | Taşınan dosyalar |
| `docs/README.md` | Kök temizliği güncelleme notu + arşiv tablosu satırı |

## Doğrulama

- `npm run lint` her değişiklikte temiz.
- Hub redesign: gerçek dev server + Playwright, mock veriyle masaüstü/mobil/hover
  ekran görüntüsü alındı (sayfa login gerektirmiyor).
- Uzay banner'ı: sayfa `RequireAuth` arkasında olduğu için gerçek app'te ekran
  görüntüsü alınamadı — aynı CSS izole bir statik HTML kopyasında görsel olarak
  doğrulandı (aynı teknik `.cadde-shell`/`.profile-globe` ile önceden kanıtlı).
  **Gerçek oturumla kısa bir göz kontrolü deploy sonrası yapılmalı.**

## Durum ve kalan işler

- **Kod main'de + push'landı** (son commit `60b4b11`, sırasıyla `384248e` →
  `8b186b1` (merge) → `5e5710d` → `f3710be` → `a1c62a4` → `60b4b11`).
- **Coolify'a HENÜZ deploy edilmedi** — corteqs.net/tools'ta hiçbir değişiklik
  görünmüyor, deploy tetiklenmeli.
- Kullanıcı "tek tek toollardan geçeceğiz" dedi — bu oturumda yalnız **hub**
  (`/tools`) ve **araç girişi banner'ı** (`/tools/:slug` üst bandı) işlendi.
  Soru akışı, sonuç ekranı ve tek tek her aracın kendi içeriği henüz ele
  alınmadı — sıradaki oturumda kullanıcının vereceği araç sırasını bekliyor.
- **Yan bulgu (aksiyon alınmadı):** `.env.local`'de `VITE_SUPABASE_URL` iki kez
  tanımlı — biri gerçek proje URL'i, altında bir placeholder (`YOUR_PROJECT_ID`)
  satırı var ve etkili olan bu placeholder gibi görünüyor. Yerel dev sunucusu bu
  yüzden gerçek Supabase'e bağlanamıyor olabilir; kullanıcıya bildirildi, dosyaya
  dokunulmadı.
