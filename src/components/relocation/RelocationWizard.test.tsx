// Revizyon 2b1c1960: sihirbaz hedef ülkeleri HAM ISO KODU olarak listeliyordu
// ("DE", "GB", "US"). Bu testler görünen etiketin ülke ADI olduğunu, gönderilen
// değerin ise hâlâ ISO alpha-2 kodu (createMove kontratı) olduğunu kilitler.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RelocationWizard, type CountryOption } from "@/components/relocation/RelocationWizard";

const LABELS = {
  targets: "Hedef ülkeler",
  window: "Taşınma penceresi",
  budget: "Aylık bütçe",
  household: "Hane",
  adults: "Yetişkin",
  children: "Çocuk",
  mustHaves: "Olmazsa olmazlar",
  submit: "Planı oluştur",
};

const OPTIONS: CountryOption[] = [
  { code: "DE", label: "Almanya" },
  { code: "NL", label: "Hollanda" },
  { code: "XX", label: "XX" },
];

function renderWizard(onSubmit = vi.fn()) {
  render(
    <RelocationWizard
      countryOptions={OPTIONS}
      labels={LABELS}
      onSubmit={onSubmit}
      isSubmitting={false}
    />,
  );
  return onSubmit;
}

describe("RelocationWizard", () => {
  it("ülkeleri ISO kodu yerine adıyla gösterir, kodu ikincil rozet olarak basar", () => {
    renderWizard();

    expect(screen.getByText("Almanya")).toBeInTheDocument();
    expect(screen.getByText("Hollanda")).toBeInTheDocument();
    // Kod tamamen kaybolmaz — ad'ın yanında ikincil bilgi olarak durur.
    expect(screen.getByText("DE")).toBeInTheDocument();
    expect(screen.getByText("NL")).toBeInTheDocument();
  });

  it("katalogda adı olmayan kod için kodu iki kez basmaz", () => {
    renderWizard();

    // label === code olan seçenek: yalnız tek bir "XX" metni olmalı.
    expect(screen.getAllByText("XX")).toHaveLength(1);
  });

  it("seçilen ülkeyi ada değil ISO koduna çevirerek gönderir", async () => {
    const user = userEvent.setup();
    const onSubmit = renderWizard();

    await user.click(screen.getByRole("checkbox", { name: /Almanya/ }));
    await user.click(screen.getByRole("button", { name: LABELS.submit }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ target_country_codes: ["DE"] });
  });

  it("hiç ülke seçilmeden gönderilemez", () => {
    renderWizard();
    expect(screen.getByRole("button", { name: LABELS.submit })).toBeDisabled();
  });
});
