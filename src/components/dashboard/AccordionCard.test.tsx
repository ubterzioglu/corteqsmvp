// AccordionCard'ın "varsayılan kapalı" sözleşmesi.
//
// Komuta Merkezi'ndeki iki blok bu davranışa güveniyor: Güncellemeler kartı
// (T19 kararı) ve Hot Fix listesi (27.09 kararı). İkisi de `defaultOpenId`
// VERMEZ ve açılışta kapalı gelmelidir. Bileşen bir gün "ilk maddeyi aç"
// varsayılanına dönerse iki ekran birden bozulur — bu test onu yakalar.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import AccordionCard from "./AccordionCard";

const ITEMS = [
  { id: "bir", title: "Birinci Bölüm", children: <p>birinci içerik</p> },
  { id: "iki", title: "İkinci Bölüm", children: <p>ikinci içerik</p> },
];

describe("AccordionCard", () => {
  it("defaultOpenId verilmezse HİÇBİR bölüm açık gelmez", () => {
    render(<AccordionCard items={ITEMS} />);

    expect(screen.queryByText("birinci içerik")).not.toBeInTheDocument();
    expect(screen.queryByText("ikinci içerik")).not.toBeInTheDocument();
    // Başlıklar görünür kalır; kapalı olan yalnız içeriktir.
    expect(screen.getByRole("button", { name: /Birinci Bölüm/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("defaultOpenId verilirse yalnız o bölüm açılır", () => {
    render(<AccordionCard items={ITEMS} defaultOpenId="iki" />);

    expect(screen.getByText("ikinci içerik")).toBeInTheDocument();
    expect(screen.queryByText("birinci içerik")).not.toBeInTheDocument();
  });

  it("tıklayınca açar, tekrar tıklayınca kapatır", async () => {
    const user = userEvent.setup();
    render(<AccordionCard items={ITEMS} />);

    const tetik = screen.getByRole("button", { name: /Birinci Bölüm/ });

    await user.click(tetik);
    expect(screen.getByText("birinci içerik")).toBeInTheDocument();
    expect(tetik).toHaveAttribute("aria-expanded", "true");

    await user.click(tetik);
    expect(screen.queryByText("birinci içerik")).not.toBeInTheDocument();
  });

  it("aynı anda tek bölüm açık kalır", async () => {
    const user = userEvent.setup();
    render(<AccordionCard items={ITEMS} />);

    await user.click(screen.getByRole("button", { name: /Birinci Bölüm/ }));
    await user.click(screen.getByRole("button", { name: /İkinci Bölüm/ }));

    expect(screen.getByText("ikinci içerik")).toBeInTheDocument();
    expect(screen.queryByText("birinci içerik")).not.toBeInTheDocument();
  });

  it("rozet verilirse başlıkla birlikte gösterilir", () => {
    render(<AccordionCard items={[{ ...ITEMS[0], badge: "7 madde" }]} />);

    expect(screen.getByText("7 madde")).toBeInTheDocument();
  });
});
