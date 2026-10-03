/**
 * M01 · Ücretsiz topluluk işlevleri — Faz 0 sözleşme kilidi.
 *
 * AMAÇ: bugün ücretsiz olanın KAZA İLE kapanmasını imkânsız kılmak. Ölçüm
 * (30.09, plan §"İki kritik tuzak"): `events.create` ve `offers.create`
 * feature anahtarlarının `role_features`'ta HİÇ KURALI YOK (0 satır) —
 * kuralı olmayan feature SESSİZCE herkese kapalıdır (telefon alanı vakasıyla
 * aynı sınıf, T2). Bu yüzden aşağıdaki rotalara `RequireFeature` EKLENEMEZ;
 * eklenirse bu test düşer ve ürün kararı sorgulanır.
 *
 * Kapsamdaki ücretsiz rotalar (plan Faz 0):
 *   /events · /events/create · /addcom · /tavsiye · /liderlik
 * ⚠️ /tavsiye ve /liderlik HENÜZ YOK (M20/M12'de eklenecek) — test rota
 * yokken de yeşil kalır; rota EKLENDİĞİ anda guard'sız olmak zorunda
 * ("rota varsa guard'sız olmalı" biçimi).
 *
 * Bilinçli istisna: `cadde.access` KORUNUR (Cadde rotaları flag arkasında —
 * bu bir ürün kararı, ücretsizlik kapsamı DIŞINDA). Aşağıda ayrıca kilitli.
 *
 * Desen: redirects.test.ts (kaynak metni denetleyen sözleşme testi).
 * ⚠️ Çıplak indexOf+slice YASAK — @/test/source-slice zorunlu.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const appSource = readFileSync("src/App.tsx", "utf8");

/** Ücretsiz kalması ürün kararıyla sabit rotalar (topluluk motoru planı Faz 0). */
const FREE_ROUTES = ["/events", "/events/create", "/addcom", "/tavsiye", "/liderlik"] as const;

/**
 * Rota elemanını dilimler: `path="X"` çıpasından ilk `/>` kapanışına.
 * RequireFeature sarmalı varsa ilk `/>`'ten ÖNCE görünür (element attribute'u
 * içinde sarmalar) — tespit için yeter; tek satırlık rota sözleşmesi App.tsx'te
 * zaten geçerli (çok satırlı tek örnek cadde blokları, onlar ayrı testte).
 */
const routeElement = (path: string): string | null => {
  const anchor = `path="${path}"`;
  if (!appSource.includes(anchor)) return null;
  return sliceBetween(appSource, anchor, "/>", `rota ${path}`);
};

describe("M01 · ücretsiz topluluk rotaları RequireFeature ALAMAZ (T2 kilidi)", () => {
  it.each(FREE_ROUTES)("%s rotası guard'sızdır (yoksa yeşil — eklendiğinde de guard'sız olmalı)", (path) => {
    const element = routeElement(path);

    if (element === null) {
      // /tavsiye ve /liderlik henüz yok (M20/M12) — yokluk ücretsizliğin
      // ihlali değil; rota eklendiğinde bu test otomatik olarak denetler.
      return;
    }
    expect(element, `${path} rotası RequireFeature ile SARILAMAZ (role_features'ta kuralı yok — sessizce herkese kapanır)`).not.toContain("RequireFeature");
  });

  it("bugün var olan üç rota gerçekten mevcut (test boşta dönmesin)", () => {
    // /tavsiye ve /liderlik M12/M20'de eklenecek — bu test o gün DEĞİŞMEDEN
    // yeşil kalmalı (kabul): var olanlar "içerme" ile denetlenir, birebir liste
    // ile DEĞİL. Üç temel rota düşerse (ör. App.tsx refactor kazası) yine kızarır.
    const existing = FREE_ROUTES.filter((path) => routeElement(path) !== null);
    expect(existing).toContain("/events");
    expect(existing).toContain("/events/create");
    expect(existing).toContain("/addcom");
  });

  it("RequireAuth SERBEST (giriş kapısı başka şey, feature bayrağı başka)", () => {
    const create = routeElement("/events/create");
    expect(create).not.toBeNull();
    expect(create).toContain("RequireAuth");
    expect(create).not.toContain("RequireFeature");
  });
});

describe("M01 · cadde.access BİLİNÇLİ istisna — korunur", () => {
  it("cadde rotaları RequireFeature(caddeAccess) arkasında KALIR", () => {
    // Cadde'nin ücretsizliği ürün kararı DEĞİL; flag'i kaldırmak da bu serinin
    // işi değil. Kilit: en az bir cadde rotası guard'lı olmaya devam eder.
    const guarded = appSource.includes("RequireFeature feature={GENERIC_FEATURE_KEYS.caddeAccess}");
    expect(guarded).toBe(true);
  });
});
