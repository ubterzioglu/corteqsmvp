/**
 * M06 · katılım düğmesi sözleşmesi (EventAttendeeButton).
 *
 * Kilitler: yalnız published'de çizilir (ölü düğme yok) · anon → login ·
 * katıl/ayrıl mutation'ları M04 RPC'lerine gider · kontenjan dolu → pasif ·
 * sayaç null (ikincil yüzey hatası) düğmeyi DÜŞÜRMEZ.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventAttendeeButton } from "@/components/events/EventAttendeeButton";

const fetchCountSpy = vi.fn();
const joinSpy = vi.fn();
const leaveSpy = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/lib/events-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/events-api")>();
  return {
    ...actual,
    fetchEventAttendeeCount: (...args: unknown[]) => fetchCountSpy(...args),
    joinEvent: (...args: unknown[]) => joinSpy(...args),
    leaveEvent: (...args: unknown[]) => leaveSpy(...args),
  };
});

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

const renderButton = (props: Partial<Parameters<typeof EventAttendeeButton>[0]> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EventAttendeeButton eventId="ev-1" eventStatus="published" {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthMock.mockReturnValue({ user: { id: "u-1" } });
  fetchCountSpy.mockResolvedValue({ goingCount: 1, maxAttendees: 5, isFull: false, viewerStatus: null });
  joinSpy.mockResolvedValue({ goingCount: 2, maxAttendees: 5, isFull: false, viewerStatus: "going" });
  leaveSpy.mockResolvedValue({ goingCount: 0, maxAttendees: 5, isFull: false, viewerStatus: "cancelled" });
});

describe("EventAttendeeButton · görünürlük", () => {
  it("published olmayan etkinlikte HİÇ çizilmez (ölü düğme yok)", () => {
    const { container } = renderButton({ eventStatus: "pending" });

    expect(container.innerHTML).toBe("");
    expect(fetchCountSpy).not.toHaveBeenCalled();
  });

  it("anonim ziyaretçi → giriş yönlendirmesi, katıl düğmesi YOK", async () => {
    useAuthMock.mockReturnValue({ user: null });
    renderButton();

    expect(await screen.findByTestId("event-attendee-anon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Giriş yap/i })).toHaveAttribute("href", "/login");
    expect(screen.queryByTestId("event-join-button")).not.toBeInTheDocument();
  });
});

describe("EventAttendeeButton · katılım akışı", () => {
  it("katılmamış üye → 'Etkinliğe katıl' → joinEvent(evId) + sayaç", async () => {
    renderButton();

    const join = await screen.findByTestId("event-join-button");
    // Sayaç query'si asenkron çözülür — findBy ile bekle.
    const count = await screen.findByTestId("event-attendee-count");
    expect(count).toHaveTextContent("1 kişi katılıyor");
    expect(count).toHaveTextContent("kapasite 5");

    fireEvent.click(join);
    await waitFor(() => expect(joinSpy).toHaveBeenCalledWith("ev-1"));
  });

  it("katılmış üye → 'Katılımdan ayrıl' → leaveEvent(evId)", async () => {
    fetchCountSpy.mockResolvedValue({ goingCount: 3, maxAttendees: 5, isFull: false, viewerStatus: "going" });
    renderButton();

    const leave = await screen.findByTestId("event-leave-button");
    expect(screen.getByText(/Katılımcı listesinde görünüyorsun/)).toBeInTheDocument();

    fireEvent.click(leave);
    await waitFor(() => expect(leaveSpy).toHaveBeenCalledWith("ev-1"));
  });

  it("kontenjan dolu → pasif 'Kontenjan dolu', join çağrılamaz", async () => {
    fetchCountSpy.mockResolvedValue({ goingCount: 5, maxAttendees: 5, isFull: true, viewerStatus: null });
    renderButton();

    const full = await screen.findByTestId("event-full-badge");
    expect(full).toBeDisabled();
    expect(screen.queryByTestId("event-join-button")).not.toBeInTheDocument();
    expect(joinSpy).not.toHaveBeenCalled();
  });

  it("sayaç okunamazsa (null) düğme ÇALIŞMAYA DEVAM EDER — ikincil yüzey", async () => {
    fetchCountSpy.mockResolvedValue(null);
    renderButton();

    expect(await screen.findByTestId("event-join-button")).toBeEnabled();
    expect(screen.queryByTestId("event-attendee-count")).not.toBeInTheDocument();
  });
});

describe("MyEventsPanel · M06 kural notu (kaynak sözleşmesi)", () => {
  const source = readFileSync("src/components/events/MyEventsPanel.tsx", "utf8");

  it("limit + ilk-onay kuralı kullanıcıya AÇIKÇA anlatılır ve TEK kaynaktan gelir", () => {
    expect(source).toContain('import { EVENTS_ACTIVE_LIMIT } from "@/lib/events-rules"');
    expect(source).toContain('data-testid="my-events-rule-note"');
    expect(source).toContain("ilk etkinliğin yönetici onayından geçer, sonrakiler otomatik yayınlanır");
    // Elle yazılmış ikinci bir "2" sabiti YOK — limit events-rules'tan:
    expect(source).toContain("{EVENTS_ACTIVE_LIMIT}");
    // Eski "her etkinlik onaydan geçer" yanılgısı metinden kalktı:
    expect(source).not.toContain("Gönderdiğin etkinlik yönetici onayından sonra listede yayınlanır");
  });
});
