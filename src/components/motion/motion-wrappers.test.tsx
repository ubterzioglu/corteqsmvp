import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CountUp from "./CountUp";
import Reveal from "./Reveal";

// Kontrol edilebilir IntersectionObserver: testte "görünüme girdi" anını biz tetikleriz.
type Callback = (entries: Array<{ isIntersecting: boolean }>) => void;
const observers: Array<{ callback: Callback; options?: IntersectionObserverInit }> = [];

class ControlledObserver {
  constructor(callback: Callback, options?: IntersectionObserverInit) {
    observers.push({ callback, options });
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

const enterViewport = () =>
  act(() => {
    observers.forEach(({ callback }) => callback([{ isIntersecting: true }]));
  });

const originalObserver = globalThis.IntersectionObserver;
const originalMatchMedia = window.matchMedia;
const originalUserAgent = navigator.userAgent;

const setUserAgent = (value: string) =>
  Object.defineProperty(window.navigator, "userAgent", { value, configurable: true });

const setReducedMotion = (reduce: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
};

beforeEach(() => {
  observers.length = 0;
  globalThis.IntersectionObserver = ControlledObserver as unknown as typeof IntersectionObserver;
  setReducedMotion(false);
});

afterEach(() => {
  globalThis.IntersectionObserver = originalObserver;
  window.matchMedia = originalMatchMedia;
  setUserAgent(originalUserAgent);
  vi.useRealTimers();
});

describe("Reveal", () => {
  it("görünüme girene kadar gizli, girince görünür olur (eski framer eşikleriyle)", () => {
    render(<Reveal className="kutu">İçerik</Reveal>);
    const wrapper = screen.getByText("İçerik");

    expect(wrapper).toHaveStyle({ opacity: "0" });
    expect(wrapper).toHaveAttribute("data-reveal", "pending");
    expect(observers[0].options).toMatchObject({ threshold: 0.2, rootMargin: "0px 0px -10% 0px" });

    enterViewport();

    expect(wrapper).toHaveStyle({ opacity: "1" });
    expect(wrapper).toHaveAttribute("data-reveal", "in");
    expect(wrapper).toHaveClass("kutu");
  });

  it("gecikmeyi transition-delay'e ve `as` etiketini DOM'a yansıtır", () => {
    render(
      <ul>
        <Reveal as="li" delay={0.1}>
          Madde
        </Reveal>
      </ul>,
    );
    const item = screen.getByText("Madde");
    expect(item.tagName).toBe("LI");
    expect(item.style.transition).toContain("0.1s");
  });

  it("prerender'da animasyonsuz ve görünür çizilir (bota opacity:0 gitmez)", () => {
    setUserAgent("Mozilla/5.0 HeadlessChrome/120 Prerender (+https://github.com/prerender/prerender)");
    render(<Reveal>Bot içeriği</Reveal>);
    const wrapper = screen.getByText("Bot içeriği");

    expect(wrapper.getAttribute("style")).toBeNull();
    expect(observers).toHaveLength(0);
  });

  it("reduced-motion'da animasyonsuz çizilir", () => {
    setReducedMotion(true);
    render(<Reveal>Sakin içerik</Reveal>);
    expect(screen.getByText("Sakin içerik").getAttribute("style")).toBeNull();
  });

  it("IntersectionObserver yoksa içerik gizli kalmaz", () => {
    // Eski tarayıcı benzetimi.
    globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver;
    render(<Reveal>Eski tarayıcı</Reveal>);
    expect(screen.getByText("Eski tarayıcı")).toHaveStyle({ opacity: "1" });
  });
});

describe("CountUp", () => {
  it("görünüme girmeden 0 gösterir, girince hedefe sayar", async () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    render(<CountUp to={1250} duration={0.5} />);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(observers[0].options).toMatchObject({ threshold: 0.6 });

    enterViewport();
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("1.250")).toBeInTheDocument();
  });

  it("prerender'da doğrudan son değeri yazar (bot '0' görmez)", () => {
    setUserAgent("Mozilla/5.0 Prerender (+https://github.com/prerender/prerender)");
    render(<CountUp to={8800000} />);
    expect(screen.getByText("8.800.000")).toBeInTheDocument();
  });

  it("reduced-motion'da doğrudan son değeri yazar", () => {
    setReducedMotion(true);
    render(<CountUp to={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(observers).toHaveLength(0);
  });
});
