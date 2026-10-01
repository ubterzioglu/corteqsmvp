/**
 * KR08 sözleşmeleri: kariyer başvuruları yönetici ekranı.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Ekranın menüde/breadcrumb'da görünmemesi.** Rota eklenip navigasyon
 *      kaydı veya `admin-route-meta` listesi unutulursa sayfa yalnız URL'yi
 *      elle yazanlara görünür; hiçbir test/derleme bunu söylemez.
 *   2. Dosyanın imzalı bağlantı yerine public URL ile açılması — başvuranın
 *      CV'si herkese açılır.
 *   3. Aramada çıplak `toLowerCase()` (Türkçe "İ" bozulur).
 *   4. Yükleme hatasının sessizce yutulması — yetkisiz oturumda boş liste
 *      "başvuru yok" gibi görünür.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { kadroNavGroup } from "@/lib/admin-shell/admin-navigation-registry/kadro";

const read = (path: string) => readFileSync(path, "utf8");
const pageSource = () => read("src/pages/admin/kadro/AdminKadroBasvurularPage.tsx");
const apiSource = () => read("src/lib/careers/careers-admin-api.ts");

const ROUTE = "/admin/kadro/basvurular";

describe("kariyer başvuruları yönetici ekranı", () => {
  it("rota · navigasyon · route-meta ÜÇÜ birden kayıtlı", () => {
    expect(read("src/pages/admin/kadro/routes.tsx")).toContain('path="basvurular"');
    expect(kadroNavGroup.items.some((item) => item.to === ROUTE)).toBe(true);
    expect(read("src/lib/admin-shell/admin-route-meta.ts")).toContain(`"${ROUTE}"`);
  });

  it("menü kaydı kadro grubunun rengini kullanır", () => {
    const item = kadroNavGroup.items.find((entry) => entry.to === ROUTE);

    expect(item?.accent).toBe("amber");
    expect(item?.label.trim()).not.toBe("");
    expect(item?.aliases?.length ?? 0).toBeGreaterThan(0);
  });

  it("dosyalar imzalı bağlantıyla açılır, public URL ile DEĞİL", () => {
    const api = apiSource();

    expect(api).toContain("createSignedUrl");
    expect(api).not.toContain("getPublicUrl");
    // Süre sonlu olmalı: süresiz bağlantı pratikte public demektir.
    expect(api).toContain("CAREER_SIGNED_URL_TTL_SECONDS");
  });

  it("arama Türkçe uyumlu yardımcıyı kullanır", () => {
    const page = pageSource();

    expect(page).toContain("trIncludes(");
    expect(page).not.toMatch(/\.toLowerCase\(\)/);
  });

  it("yükleme hatası sessizce yutulmaz", () => {
    // Yetkisiz oturumda RLS boş liste değil HATA döndürür; yutulursa ekran
    // "Henüz başvuru yok" der ve yetki sorunu gizlenir.
    const page = pageSource();

    // Liste yükleme zincirinin `.catch` kolu kullanıcıya görünür bir mesaj
    // üretmeli; boş `catch` bırakılırsa yetki hatası "başvuru yok"a dönüşür.
    expect(page).toMatch(/\.catch\(\(\) => \{[\s\S]{0,260}toast\.error\(/);
    expect(page).toContain("Yönetici yetkisi gerekli");
  });

  it("durum seçenekleri şemadaki altı durumla aynı kaynaktan gelir", () => {
    const page = pageSource();

    expect(page).toContain("CAREER_APPLICATION_STATUSES.map");
    expect(page).toContain("CAREER_STATUS_LABELS[status]");
  });

  it("eski dönem ilanları da okunabilir etiketle gösterilir", () => {
    // Başvuru `position` olarak eski bir kimlik taşıyabilir; ham kimlik
    // gösterilirse yönetici neye başvurulduğunu anlayamaz.
    const page = pageSource();

    expect(page).toContain("LEGACY_CAREER_POSITIONS.find");
  });
});
