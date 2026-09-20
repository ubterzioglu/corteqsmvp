import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import App from "@/App";

describe("App /aiform routing", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("redirects the legacy /aiform route to /login", async () => {
    window.history.pushState({}, "", "/aiform");

    render(<App />);

    // Süre AÇIKÇA verildi: bu test TÜM App'i çizer ve giriş sayfası `lazy()` ile
    // gelir. Yüklü test paketinde bu parçanın çözülmesi varsayılan 1 sn'yi
    // aşabiliyor ve sahte kırılma üretiyordu (App.tsx'e her yeni `lazy()` rota
    // eklendiğinde payı biraz daha artar). Doğrulanan davranış AYNI.
    expect(await screen.findByText("ağına giriş yap", {}, { timeout: 15_000 })).toBeInTheDocument();
  });

  it("redirects the legacy /form route to /login", async () => {
    window.history.pushState({}, "", "/form");

    render(<App />);

    // Süre AÇIKÇA verildi: bu test TÜM App'i çizer ve giriş sayfası `lazy()` ile
    // gelir. Yüklü test paketinde bu parçanın çözülmesi varsayılan 1 sn'yi
    // aşabiliyor ve sahte kırılma üretiyordu (App.tsx'e her yeni `lazy()` rota
    // eklendiğinde payı biraz daha artar). Doğrulanan davranış AYNI.
    expect(await screen.findByText("ağına giriş yap", {}, { timeout: 15_000 })).toBeInTheDocument();
  });

  it("redirects the legacy /auth route to /login", async () => {
    window.history.pushState({}, "", "/auth");

    render(<App />);

    // Süre AÇIKÇA verildi: bu test TÜM App'i çizer ve giriş sayfası `lazy()` ile
    // gelir. Yüklü test paketinde bu parçanın çözülmesi varsayılan 1 sn'yi
    // aşabiliyor ve sahte kırılma üretiyordu (App.tsx'e her yeni `lazy()` rota
    // eklendiğinde payı biraz daha artar). Doğrulanan davranış AYNI.
    expect(await screen.findByText("ağına giriş yap", {}, { timeout: 15_000 })).toBeInTheDocument();
  });
});
