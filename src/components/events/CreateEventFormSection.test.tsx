/**
 * EV01 · etkinlik formunda bitiş saati uyarıları ("önce" ve "eşit").
 *
 * Kilitler: ters girilen saat (22:00 → 01:00) formda GÖRÜNÜR bir uyarı üretir ·
 * uyarı yalnız bitiş başlangıçtan önceyken ya da ona eşitken çizilir · uyarı
 * gönderimi ENGELLEMEZ ve saatleri DEĞİŞTİRMEZ (gece yarısını aşan etkinlik
 * meşrudur; hesap `eventInstantRange` içinde zaten ertesi güne taşır) · uyarı,
 * uyarıdan ÖNCE de DOM'da duran tek bir canlı bölgede (role="status") çizilir —
 * metniyle birlikte mount edilen bir canlı bölge ekran okuyucuda çoğu zaman
 * okunmaz.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateEventFormSection } from "@/components/events/CreateEventFormSection";
import { forgetEventFormDraft, rememberEventFormDraft } from "@/lib/event-form-draft";
import { DEFAULT_EVENT_TYPE, EVENT_CATEGORY_OPTIONS } from "@/lib/events-vocabulary";

const mutateAsyncSpy = vi.fn();
const toastSpy = vi.fn();

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "u-1" }, profile: null }),
}));

vi.mock("@/hooks/use-events", () => ({
  useCreateEvent: () => ({ mutateAsync: mutateAsyncSpy, isPending: false }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signInWithOAuth: vi.fn() } },
}));

// Kapak yükleyici bu testin konusu değil; depolama katmanını çekmesin.
vi.mock("@/components/events/EventCoverUpload", () => ({
  EventCoverUpload: () => null,
}));

const WARNING_TEST_ID = "event-end-before-start-warning";
const EQUAL_WARNING_TEST_ID = "event-end-equals-start-warning";
const BEFORE_TEXT = /Bitiş saati başlangıçtan önce/;
const EQUAL_TEXT = /Başlangıç ve bitiş saati aynı/;

const renderForm = () => render(<CreateEventFormSection open onOpenChange={vi.fn()} />);

const setTime = (label: string, value: string) => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

const getEndTimeInput = () => screen.getByLabelText("Bitiş Saati");

// Formdaki TEK status bölgesi: toast mock'lu, kapak yükleyici `null` çiziyor.
// İkinci bir status bölgesi eklenirse `getByRole` gürültüyle düşer — sessizce
// yanlış öğeyi seçmez.
const getLiveRegion = () => screen.getByRole("status");

/** İKİ uyarının da ne test kimliği ne metni var; canlı bölge boş, bitiş alanı ona bağlı değil. */
const expectNoEndTimeWarning = () => {
  expect(screen.queryByTestId(WARNING_TEST_ID)).not.toBeInTheDocument();
  expect(screen.queryByTestId(EQUAL_WARNING_TEST_ID)).not.toBeInTheDocument();
  expect(screen.queryByText(BEFORE_TEXT)).not.toBeInTheDocument();
  expect(screen.queryByText(EQUAL_TEXT)).not.toBeInTheDocument();
  expect(getLiveRegion()).toBeEmptyDOMElement();
  expect(getEndTimeInput()).not.toHaveAttribute("aria-describedby");
};

const rememberDraftWithTimes = (startTime: string, endTime: string) => {
  // Zorunlu alanları (kategori bir Radix Select'tir) taslak yoluyla doldur —
  // form, OAuth dönüşünde olduğu gibi taslağı mount'ta geri yükler.
  rememberEventFormDraft({
    title: "Gece buluşması",
    description: "Saat uyarısı testi",
    category: EVENT_CATEGORY_OPTIONS[0].value,
    type: DEFAULT_EVENT_TYPE,
    eventDate: "2026-10-05",
    startTime,
    endTime,
    timezone: "Europe/Berlin",
    country: "",
    city: "",
    location: "",
    onlineUrl: "",
    price: "",
    maxAttendees: "",
    coverImage: "",
    tags: [],
    organizerName: "",
    registrationUrl: "",
  });
};

const submitAndExpectTimes = async (startTime: string, endTime: string) => {
  fireEvent.click(screen.getByRole("button", { name: "Etkinliği Gönder" }));
  await waitFor(() => expect(mutateAsyncSpy).toHaveBeenCalledTimes(1));
  expect(mutateAsyncSpy).toHaveBeenCalledWith(
    expect.objectContaining({ startTime, endTime, timezone: "Europe/Berlin" }),
  );
  expect(toastSpy).not.toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }));
};

beforeEach(() => {
  vi.clearAllMocks();
  forgetEventFormDraft();
  mutateAsyncSpy.mockResolvedValue({ status: "pending", eventId: "ev-1" });
});

describe("CreateEventFormSection · bitiş < başlangıç uyarısı", () => {
  it("saat girilmemişken hiçbir uyarı yok", () => {
    renderForm();
    expectNoEndTimeWarning();
  });

  it("bitiş başlangıçtan önceyse Türkçe uyarı canlı bölgede çizilir ve bitiş alanı bölgeye bağlanır", () => {
    renderForm();
    setTime("Başlangıç Saati", "22:00");
    setTime("Bitiş Saati", "01:00");

    const region = getLiveRegion();
    const warning = screen.getByTestId(WARNING_TEST_ID);
    expect(region).toContainElement(warning);
    expect(warning).toHaveTextContent("Bitiş saati başlangıçtan önce");
    expect(warning).toHaveTextContent("ertesi gün bitecek");
    expect(region.id).not.toBe("");
    expect(getEndTimeInput()).toHaveAttribute("aria-describedby", region.id);
    expect(screen.queryByTestId(EQUAL_WARNING_TEST_ID)).not.toBeInTheDocument();
    expect(screen.queryByText(EQUAL_TEXT)).not.toBeInTheDocument();
  });

  it("bitiş düzeltilince uyarı kalkar", () => {
    renderForm();
    setTime("Başlangıç Saati", "22:00");
    setTime("Bitiş Saati", "01:00");
    expect(screen.getByTestId(WARNING_TEST_ID)).toBeInTheDocument();

    setTime("Bitiş Saati", "23:30");
    expectNoEndTimeWarning();
  });

  it("yalnız bitiş girilince hiçbir uyarı yok", () => {
    renderForm();
    setTime("Bitiş Saati", "01:00");
    expectNoEndTimeWarning();
  });

  it("uyarı gönderimi ENGELLEMEZ ve saatleri değiştirmez", async () => {
    rememberDraftWithTimes("22:00", "01:00");
    renderForm();

    expect(await screen.findByTestId(WARNING_TEST_ID)).toBeInTheDocument();
    await submitAndExpectTimes("22:00", "01:00");
  });
});

describe("CreateEventFormSection · başlangıç = bitiş uyarısı", () => {
  // `eventInstantRange` eşit saatte de bitişi ertesi güne taşır: "19:00 – 19:00"
  // sessizce 24 saatlik etkinlik olur. "Önce" metni buna uymaz — ayrı uyarı.
  it("saatler eşitse KENDİ uyarısı çizilir ('önce' uyarısı çizilmez) ve bitiş alanı bölgeye bağlanır", () => {
    renderForm();
    setTime("Başlangıç Saati", "19:00");
    setTime("Bitiş Saati", "19:00");

    const region = getLiveRegion();
    const warning = screen.getByTestId(EQUAL_WARNING_TEST_ID);
    expect(region).toContainElement(warning);
    expect(warning).toHaveTextContent("Başlangıç ve bitiş saati aynı");
    expect(warning).toHaveTextContent("24 saat sürecek");
    expect(getEndTimeInput()).toHaveAttribute("aria-describedby", region.id);
    expect(screen.queryByTestId(WARNING_TEST_ID)).not.toBeInTheDocument();
    expect(screen.queryByText(BEFORE_TEXT)).not.toBeInTheDocument();
  });

  it("bitiş düzeltilince uyarı kalkar; öne alınırsa 'önce' uyarısına döner", () => {
    renderForm();
    setTime("Başlangıç Saati", "19:00");
    setTime("Bitiş Saati", "19:00");
    expect(screen.getByTestId(EQUAL_WARNING_TEST_ID)).toBeInTheDocument();

    setTime("Bitiş Saati", "21:00");
    expectNoEndTimeWarning();

    setTime("Bitiş Saati", "18:00");
    expect(screen.queryByTestId(EQUAL_WARNING_TEST_ID)).not.toBeInTheDocument();
    expect(screen.getByTestId(WARNING_TEST_ID)).toBeInTheDocument();
  });

  it("uyarı gönderimi ENGELLEMEZ ve saatleri değiştirmez", async () => {
    rememberDraftWithTimes("19:00", "19:00");
    renderForm();

    expect(await screen.findByTestId(EQUAL_WARNING_TEST_ID)).toBeInTheDocument();
    await submitAndExpectTimes("19:00", "19:00");
  });
});

describe("CreateEventFormSection · uyarının canlı bölgesi (ekran okuyucu)", () => {
  it("bölge uyarıdan ÖNCE de DOM'dadır; uyarı gelip değişip gidince AYNI düğüm kalır, yalnız içeriği değişir", () => {
    renderForm();
    const region = getLiveRegion();
    expect(region).toBeEmptyDOMElement();

    setTime("Başlangıç Saati", "22:00");
    setTime("Bitiş Saati", "01:00");
    expect(getLiveRegion()).toBe(region);
    expect(region).toHaveTextContent(BEFORE_TEXT);
    expect(getEndTimeInput()).toHaveAttribute("aria-describedby", region.id);

    setTime("Bitiş Saati", "22:00");
    expect(getLiveRegion()).toBe(region);
    expect(region).toHaveTextContent(EQUAL_TEXT);
    expect(region).not.toHaveTextContent(BEFORE_TEXT);

    setTime("Bitiş Saati", "23:30");
    expect(getLiveRegion()).toBe(region);
    expect(region).toBeEmptyDOMElement();
    expect(getEndTimeInput()).not.toHaveAttribute("aria-describedby");
  });
});
