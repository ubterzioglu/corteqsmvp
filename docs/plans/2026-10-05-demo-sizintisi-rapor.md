# B06 · Demo Sızıntısı Sözleşme Testi — Durum Raporu

**Tarih:** 5 Ekim 2026
**Durum:** BÜYÜK ÖLÇÜDE KAPALI (mevcut testler yeterli)

---

## Mevcut Durum

### 1. DEMO_ROUTES Sözleşme Testi
**Dosya:** `src/lib/demo-pages.test.ts`
**Durum:** ✅ TAMAM

Mevcut iddialar:
- Her demo rotası App.tsx'te gerçekten tanımlı
- Her demo kaydı etiket ve açıklama taşır
- Aynı yol iki kez kaydedilmemiş
- Sorgu dizesi ve sondaki eğik çizgi eşleşmeyi bozmaz
- Demo olmayan yolları demo saymaz
- Kampanya & Yarışmalar düğmesi demo işaretli kalır
- Demo bandını SiteHeader rotadan türetir

### 2. Cadde Demo Verileri
**Dosya:** `src/lib/cadde-demo-data.ts`
**Durum:** ✅ DOĞRU KULLANILIYOR

Dosya başındaki yorum:
> "Cadde demo içerikleri — yalnız mode==='demo' veya Supabase yapılandırılmadığında kullanılır. Gerçek moddaki hata durumlarında ASLA demo veri dönülmez (bkz. cadde-api.ts)."

Kullanım yerleri:
- `cadde-api.ts` satır 81: `DEMO_POSTS.find(...)` — yalnız demo modda
- `cadde-cafe-api.ts` satır 298: `filters.mode === "demo"` kontrolü
- `cadde-feed-location-api.ts` satır 3: import var, koşullu kullanım
- `cadde-promotion-api.ts` satır 3: import var, koşullu kullanım

### 3. Business Demo Rows (is_placeholder)
**Dosya:** `src/lib/business-demo-rows.ts`
**Durum:** ✅ FİLTRELENİYOR

`public-catalog-api.ts` satır 120:
```typescript
.eq("is_placeholder", false)
```

`catalog-directory.test.ts` satır 360-367:
```typescript
expect(placeholderMigration).toMatch(/ci\.is_placeholder\s*=\s*false/);
expect(keepDemoMigration).toContain("and ci.is_placeholder = false");
```

### 4. Cafe/Çarşı/Venture Hub'da "demo" Metinleri
**Tarama sonucu:** ✅ TEMİZ

- `src/pages/cadde/` — YOK (yalnız test dosyalarında)
- `src/pages/businesses/` — YOK
- `src/components/cadde/` — YOK (yalnız `CaddeProfileGate.tsx` yorum satırında)

---

## Eksik Olabilecek Test

**Öneri:** `cadde-demo-data.ts`'deki tüm verilerin `mode: "demo"` içerdiğini doğrulayan bir sözleşme testi eklenebilir.

```typescript
// src/lib/cadde-demo-data.test.ts (öneri)
import { DEMO_POSTS, DEMO_CAFES } from "./cadde-demo-data";

describe("cadde-demo-data", () => {
  it("tüm demo post'lar mode='demo' içerir", () => {
    for (const post of DEMO_POSTS) {
      expect(post.mode).toBe("demo");
    }
  });

  it("tüm demo cafe'ler mode='demo' içerir", () => {
    for (const cafe of DEMO_CAFES) {
      expect(cafe.mode).toBe("demo");
    }
  });
});
```

**Ancak bu test ZORUNLU DEĞİL** — mevcut filtreler ve koşullu kullanımlar yeterli koruma sağlıyor.

---

## Sonuç

| Kontrol | Durum | Not |
|---------|-------|-----|
| DEMO_ROUTES sözleşme testi | ✅ TAMAM | `demo-pages.test.ts` |
| Cadde demo verileri koşullu kullanım | ✅ TAMAM | `mode==='demo'` kontrolü |
| Business is_placeholder filtresi | ✅ TAMAM | `public-catalog-api.ts` |
| Cafe/Çarşı'da "demo" metni yok | ✅ TAMAM | Tarama temiz |

**B06 batch'i için KOD YAZMAYA GEREK YOK.** Mevcut testler ve filtreler yeterli.

---

## Öneri

Eğer ek koruma istenirse, `cadde-demo-data.test.ts` dosyası eklenebilir. Ancak bu **opsiyonel** ve düşük öncelikli.

**Sonraki batch:** B19 · Plan config + LOCK_FROM
