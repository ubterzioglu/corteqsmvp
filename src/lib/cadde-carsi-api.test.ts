// Kategori rozeti -> liste sayfası bağlantısının sözleşmesi (revizyon 8d3aeb2a).
// Rozetin ürettiği adres ile CaddeCarsiPage'in okuduğu parametre adı AYNI sabitten
// gelmelidir; ayrışırlarsa link "görünür ama işe yaramaz" duruma düşer. Bu dosya
// tam da o ayrışmayı yakalar.
import { describe, expect, it } from "vitest";

import { CARSI_CATEGORY_PARAM, carsiCategoryHref, formatCarsiPrice } from "@/lib/cadde-carsi-api";

describe("carsiCategoryHref", () => {
  it("kategori anahtarını /cadde/carsi'ye query parametresi olarak ekler", () => {
    expect(carsiCategoryHref("second_hand")).toBe("/cadde/carsi?kategori=second_hand");
  });

  it("parametre adını tek sabitten üretir", () => {
    expect(CARSI_CATEGORY_PARAM).toBe("kategori");
    expect(carsiCategoryHref("service")).toContain(`?${CARSI_CATEGORY_PARAM}=`);
  });

  it("boş/eksik anahtarda filtresiz listeye düşer, kırık link üretmez", () => {
    expect(carsiCategoryHref("")).toBe("/cadde/carsi");
    expect(carsiCategoryHref("   ")).toBe("/cadde/carsi");
    expect(carsiCategoryHref(null)).toBe("/cadde/carsi");
    expect(carsiCategoryHref(undefined)).toBe("/cadde/carsi");
  });

  it("URL'de anlam taşıyan karakterleri kaçırır", () => {
    expect(carsiCategoryHref("ev & bahçe")).toBe("/cadde/carsi?kategori=ev%20%26%20bah%C3%A7e");
  });
});

describe("formatCarsiPrice", () => {
  it("fiyatsız ve ücretsiz ilanları ayırır", () => {
    expect(formatCarsiPrice({ priceAmount: null, priceCurrency: null })).toBe("Fiyat belirtilmedi");
    expect(formatCarsiPrice({ priceAmount: 0, priceCurrency: "EUR" })).toBe("Ücretsiz");
  });
});
