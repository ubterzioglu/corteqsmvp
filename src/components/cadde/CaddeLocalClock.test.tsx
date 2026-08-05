// m133 — yerel saat rozetinin çizimi. Saf mantığın testi: src/lib/cadde-local-clock.test.ts
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import CaddeLocalClock from "@/components/cadde/CaddeLocalClock";

const BERLIN = { cityName: "Berlin", timeZone: "Europe/Berlin" };

describe("CaddeLocalClock", () => {
  it("saati hedef şehrin diliminde yazar", () => {
    // 12:00Z, Europe/Berlin yazın UTC+2 → 14:00
    render(<CaddeLocalClock target={BERLIN} now={new Date("2026-08-05T12:00:00Z")} />);
    const badge = screen.getByTestId("cadde-local-clock");
    expect(badge).toHaveTextContent("14:00");
    expect(badge).toHaveTextContent("Berlin");
  });

  it("gündüz güneş, gece ay ikonu gösterir", () => {
    const { unmount } = render(
      <CaddeLocalClock target={BERLIN} now={new Date("2026-08-05T10:00:00Z")} />,
    );
    // lucide ikonları class üzerinden ayırt ediliyor; renk gün/gece ayrımının taşıyıcısı.
    expect(screen.getByTestId("cadde-local-clock").querySelector(".text-amber-500")).not.toBeNull();
    unmount();

    render(<CaddeLocalClock target={BERLIN} now={new Date("2026-08-05T23:30:00Z")} />);
    expect(screen.getByTestId("cadde-local-clock").querySelector(".text-indigo-400")).not.toBeNull();
  });

  it("erişilebilir ad şehri ve saati birlikte söyler", () => {
    render(<CaddeLocalClock target={BERLIN} now={new Date("2026-08-05T12:00:00Z")} />);
    expect(screen.getByLabelText("Berlin yerel saati 14:00")).toBeInTheDocument();
  });

  // Saat dilimi veritabanından geliyor; bozuk tek satır sayfayı düşürmemeli.
  it("geçersiz saat diliminde hiç çizilmez, çökmez", () => {
    const { container } = render(
      <CaddeLocalClock
        target={{ cityName: "Bozuk", timeZone: "Mars/Olympus" }}
        now={new Date("2026-08-05T12:00:00Z")}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
