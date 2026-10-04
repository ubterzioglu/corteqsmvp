/**
 * M20 · RecommendationDetailPage (/tavsiye/:id) davranış testleri.
 * Kilitler: talep + yanıtlar çizilir · eşleşen profesyoneller İLETİŞİMSİZ (M18) ·
 * yanıt formu (girişli) · kapalı talepte yanıt kapalı.
 */
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const detailMock = vi.fn();
const matchMock = vi.fn();
const answerMutate = vi.fn();
let mockUser: { id: string } | null = { id: "u1" };

vi.mock("@/lib/seo", () => ({ useSeo: () => undefined }));
vi.mock("@/components/auth/useAuth", () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock("@/hooks/use-recommendations", () => ({
  useRecommendationDetail: () => detailMock(),
  useMatchedProfessionals: () => matchMock(),
  useAnswerRecommendation: () => ({ mutate: answerMutate, isPending: false }),
}));
// M22: kilitli kart kendi test dosyasında ölçülür; burada YALNIZ yerleşim kilidi
// (girişli + talep sahibi DEĞİL → görünür; anonim/sahip → görünmez).
vi.mock("@/components/recommendations/ProLockedInboxCard", () => ({
  default: () => <div data-testid="pro-locked-inbox-card-stub" />,
}));

import RecommendationDetailPage from "./RecommendationDetailPage";

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/tavsiye/r1"]}>
      <Routes>
        <Route path="/tavsiye/:id" element={<RecommendationDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

const request = (over: Partial<Record<string, unknown>> = {}) => ({
  id: "r1",
  user_id: "u9",
  title: "Dortmund'da güvenilir terzi",
  body: "Öneri var mı?",
  category_slug: "terzi",
  country: "DE",
  city: "Dortmund",
  status: "open",
  diaspora_key: "tr",
  created_at: "2026-10-03T10:00:00Z",
  updated_at: "2026-10-03T10:00:00Z",
  ...over,
});

describe("RecommendationDetailPage (/tavsiye/:id)", () => {
  beforeEach(() => {
    detailMock.mockReset();
    matchMock.mockReset();
    answerMutate.mockReset();
    mockUser = { id: "u1" };
  });

  it("talep + yanıtları çizer", async () => {
    detailMock.mockReturnValue({
      data: {
        request: request(),
        answers: [
          { id: "a1", request_id: "r1", user_id: "u2", body: "Şu terzi iyi.", is_professional: true, created_at: "2026-10-03T11:00:00Z" },
        ],
      },
      isLoading: false,
    });
    matchMock.mockReturnValue({ data: [] });
    renderPage();

    expect(await screen.findByText("Dortmund'da güvenilir terzi")).toBeInTheDocument();
    expect(screen.getByText("Şu terzi iyi.")).toBeInTheDocument();
    expect(screen.getByText(/Profesyonel/i)).toBeInTheDocument();
  });

  it("eşleşen profesyoneller İLETİŞİMSİZ çizilir (ad + şehir, email/telefon YOK)", async () => {
    detailMock.mockReturnValue({ data: { request: request(), answers: [] }, isLoading: false });
    matchMock.mockReturnValue({
      data: [
        { item_id: "p1", title: "Terzi Ayşe", slug: "terzi-ayse", country_code: "DE", city: "Dortmund", category_slugs: ["terzi"], match_score: 145, match_reason: "kategori, şehir, ülke" },
      ],
    });
    renderPage();

    expect(await screen.findByText("Eşleşen profesyoneller")).toBeInTheDocument();
    expect(screen.getByText("Terzi Ayşe")).toBeInTheDocument();
    expect(screen.getByText(/Dortmund, DE · kategori, şehir, ülke/)).toBeInTheDocument();
    // İletişim sızıntısı yok (M18 search_text okumaz):
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it("girişli kullanıcıda yanıt formu; Yanıtla → answer mutate", async () => {
    detailMock.mockReturnValue({ data: { request: request(), answers: [] }, isLoading: false });
    matchMock.mockReturnValue({ data: [] });
    renderPage();

    const box = await screen.findByPlaceholderText(/Bir tavsiye ver/i);
    fireEvent.change(box, { target: { value: "Ben memnunum." } });
    fireEvent.click(screen.getByRole("button", { name: /Yanıtla/i }));
    expect(answerMutate).toHaveBeenCalled();
  });

  it("kapalı talepte yanıt formu YOK (status=closed)", async () => {
    detailMock.mockReturnValue({ data: { request: request({ status: "closed" }), answers: [] }, isLoading: false });
    matchMock.mockReturnValue({ data: [] });
    renderPage();

    expect(await screen.findByText(/Bu talep kapatılmış/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Bir tavsiye ver/i)).not.toBeInTheDocument();
  });

  it("talep yoksa 'bulunamadı' + dönüş linki", async () => {
    detailMock.mockReturnValue({ data: { request: null, answers: [] }, isLoading: false });
    matchMock.mockReturnValue({ data: [] });
    renderPage();

    expect(await screen.findByText(/Tavsiye talebi bulunamadı/i)).toBeInTheDocument();
  });

  it("M22 yerleşim: kilitli kart girişli + talep sahibi OLMAYANA görünür", async () => {
    detailMock.mockReturnValue({ data: { request: request(), answers: [] }, isLoading: false });
    matchMock.mockReturnValue({ data: [] });
    renderPage();

    // mockUser u1, request.user_id u9 → kart görünür
    expect(await screen.findByTestId("pro-locked-inbox-card-stub")).toBeInTheDocument();
  });

  it("M22 yerleşim: kilitli kart ANONİME ve talep SAHİBİNE görünmez", async () => {
    // Anonim
    mockUser = null;
    detailMock.mockReturnValue({ data: { request: request(), answers: [] }, isLoading: false });
    matchMock.mockReturnValue({ data: [] });
    renderPage();
    expect(await screen.findByText(/Yanıtlamak için giriş yap/i)).toBeInTheDocument();
    expect(screen.queryByTestId("pro-locked-inbox-card-stub")).not.toBeInTheDocument();

    // Talep sahibi (user.id === request.user_id) — kilitli kart GÖRÜNMEZ
    // (kendi iletişim kartı anlamsız). F3 sonrası sahip yanıt formu da görmez;
    // onun kilidi ayrı testte ("F3 UI: SAHİP yanıt formu GÖRMEZ").
    mockUser = { id: "u9" };
    renderPage();
    expect(await screen.findByText(/Bu senin talebin/i)).toBeInTheDocument();
    expect(screen.queryByTestId("pro-locked-inbox-card-stub")).not.toBeInTheDocument();
  });

  it("F3 UI: SAHİP yanıt formu GÖRMEZ (SQL self_answer kuralıyla aynı)", async () => {
    mockUser = { id: "u9" }; // request.user_id ile aynı — sahip
    detailMock.mockReturnValue({ data: { request: request(), answers: [] }, isLoading: false });
    matchMock.mockReturnValue({ data: [] });
    renderPage();

    expect(await screen.findByText(/Bu senin talebin — kendi talebine yanıt yazamazsın/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Bir tavsiye ver/i)).not.toBeInTheDocument();
  });

  it("F2: api'den gelen Türkçe hata AYNEN gösterilir (genel mesaja düşmez)", async () => {
    detailMock.mockReturnValue({ data: { request: request(), answers: [] }, isLoading: false });
    matchMock.mockReturnValue({ data: [] });
    answerMutate.mockImplementation((_body: string, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(new Error("Bu talep kapatılmış; yeni yanıt kabul etmiyor."));
    });
    renderPage();

    fireEvent.change(await screen.findByPlaceholderText(/Bir tavsiye ver/i), {
      target: { value: "Deneme yanıtı" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Yanıtla/i }));

    expect(await screen.findByText("Bu talep kapatılmış; yeni yanıt kabul etmiyor.")).toBeInTheDocument();
  });
});
