// Y2 (m153) — header daraltma anahtarının sözleşmesi.
//
// Kilitlenen davranışlar:
//   1. Öznitelik `documentElement`e yazılır (React state'e değil) — SiteHeader 61
//      rotanın paylaştığı bileşen, her scroll tikinde yeniden render edilemez.
//   2. HİSTEREZİS: açma ve kapama eşikleri AYRI. Tek eşik titreme üretirdi.
//   3. Unmount'ta öznitelik SİLİNİR — yoksa hook'u çağırmayan sayfada küçülme
//      takılı kalırdı.

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HEADER_COMPACT_OFF_SCROLL_Y,
  HEADER_COMPACT_ON_SCROLL_Y,
  useCompactHeaderOnScroll,
} from "./useCompactHeaderOnScroll";

/** jsdom'da rAF'ı senkron çalıştır — scroll tiki test içinde deterministik olsun. */
const runFramesSynchronously = () =>
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });

const scrollTo = (y: number) => {
  Object.defineProperty(window, "scrollY", { value: y, writable: true, configurable: true });
  window.dispatchEvent(new Event("scroll"));
};

describe("useCompactHeaderOnScroll", () => {
  beforeEach(() => {
    runFramesSynchronously();
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
    delete document.documentElement.dataset.headerCompact;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete document.documentElement.dataset.headerCompact;
  });

  it("mount'ta mevcut konuma göre yazar (kaydırılmış girişte yanlış boyda başlamaz)", () => {
    Object.defineProperty(window, "scrollY", { value: 400, writable: true, configurable: true });

    renderHook(() => useCompactHeaderOnScroll());

    expect(document.documentElement.dataset.headerCompact).toBe("on");
  });

  it("tepede idle, eşiği geçince on olur", () => {
    renderHook(() => useCompactHeaderOnScroll());
    expect(document.documentElement.dataset.headerCompact).toBe("idle");

    scrollTo(HEADER_COMPACT_ON_SCROLL_Y + 1);
    expect(document.documentElement.dataset.headerCompact).toBe("on");
  });

  // HİSTEREZİS — bu testin düşmesi titreme demektir.
  it("histerezis bandında durumu DEĞİŞTİRMEZ", () => {
    renderHook(() => useCompactHeaderOnScroll());

    scrollTo(HEADER_COMPACT_ON_SCROLL_Y + 50);
    expect(document.documentElement.dataset.headerCompact).toBe("on");

    // Banda geri dön: açma eşiğinin altında ama kapama eşiğinin üstünde.
    scrollTo(HEADER_COMPACT_OFF_SCROLL_Y + 1);
    expect(document.documentElement.dataset.headerCompact).toBe("on");

    // Ancak kapama eşiğinin ALTINA inince büyür.
    scrollTo(HEADER_COMPACT_OFF_SCROLL_Y - 1);
    expect(document.documentElement.dataset.headerCompact).toBe("idle");
  });

  it("iki eşik birbirinden ayrıdır (tek eşiğe indirilirse bu düşer)", () => {
    expect(HEADER_COMPACT_OFF_SCROLL_Y).toBeLessThan(HEADER_COMPACT_ON_SCROLL_Y);
  });

  it("unmount'ta özniteliği siler", () => {
    const { unmount } = renderHook(() => useCompactHeaderOnScroll());
    scrollTo(500);
    expect(document.documentElement.dataset.headerCompact).toBe("on");

    unmount();

    // Hook'u çağırmayan bir sayfaya geçilince küçülme takılı kalmamalı.
    expect(document.documentElement.dataset.headerCompact).toBeUndefined();
  });

  it("scroll dinleyicisini passive olarak bağlar ve unmount'ta çözer", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useCompactHeaderOnScroll());

    const scrollCall = add.mock.calls.find(([type]) => type === "scroll");
    expect(scrollCall?.[2]).toEqual({ passive: true });

    unmount();
    expect(remove.mock.calls.some(([type]) => type === "scroll")).toBe(true);
  });

  it("her scroll olayında rAF planlamaz (tick guard)", () => {
    // rAF'ı bu testte ASENKRON bırak: guard'ın gerçekten biriktirmeyi engellediğini
    // ancak çerçeve çalışmadan ölçebiliriz.
    vi.restoreAllMocks();
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);

    renderHook(() => useCompactHeaderOnScroll());
    raf.mockClear();

    scrollTo(300);
    scrollTo(320);
    scrollTo(340);

    // Üç olay, tek planlama — layout okuması çerçeve başına bir kez yapılır.
    expect(raf).toHaveBeenCalledTimes(1);
  });
});
