import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LivingCostsPanel } from "./LivingCostsPanel";
import type { RelocationLivingCostRow } from "@/lib/relocation-content-types";

const costRow = (patch: Partial<RelocationLivingCostRow> = {}): RelocationLivingCostRow => ({
  id: patch.id ?? "c1",
  country_code: "DE",
  city_code: null,
  item_key: "rent",
  amount_min: 800,
  amount_max: 1500,
  currency: "EUR",
  household_size: 1,
  period: "monthly",
  note: null,
  is_active: true,
  ...patch,
});

describe("LivingCostsPanel — rakamların niteliği (B28)", () => {
  it("tutarların tipik aralık olduğunu ve resmî endeks OLMADIĞINI yazar", () => {
    render(<LivingCostsPanel rows={[costRow()]} householdSize={1} />);

    expect(screen.getByText(/tipik aylık aralıklardır/i)).toBeInTheDocument();
    expect(screen.getByText(/resmî bir fiyat endeksinden türetilmemiştir/i)).toBeInTheDocument();
  });

  it("veri yokken açıklama da çizilmez — uyarı, olmayan rakamı anlatmaz", () => {
    render(<LivingCostsPanel rows={[]} householdSize={1} />);

    expect(screen.queryByText(/tipik aylık aralıklardır/i)).not.toBeInTheDocument();
    // Boş durum metni `<br />` ile bölündüğü için tam cümle aranmaz.
    expect(screen.getByText(/yaşam masrafı verisi henüz girilmedi/i)).toBeInTheDocument();
  });
});

describe("LivingCostsPanel — kapsam ayrımı (B29)", () => {
  it("ülke geneli ile şehir kartını AYRI çizer ve etiketler", () => {
    render(
      <LivingCostsPanel
        rows={[
          costRow({ id: "de", city_code: null, amount_min: 800, amount_max: 800 }),
          costRow({ id: "ber", city_code: "BER", amount_min: 1400, amount_max: 1400 }),
        ]}
        householdSize={1}
      />,
    );

    expect(screen.getByText(/ülke geneli/i)).toBeInTheDocument();
    expect(screen.getByText(/BER/)).toBeInTheDocument();
    // İki ayrı rakam da görünmeli; biri diğerini yutarsa kapsam ayrımı kaybolmuş demektir.
    expect(screen.getAllByText(/800/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1\.400/).length).toBeGreaterThan(0);
  });
});
