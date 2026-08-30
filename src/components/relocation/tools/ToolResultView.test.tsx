// ToolResultView — 10 aracın PAYLAŞILAN sonuç görünümü (RelocationToolPage +
// RelocationToolResultPage). Buradaki "Araçlar Sayfasına Dön" bağlantısı tek noktadan
// tüm araçları kapsar; testi o sözleşmeyi kilitler.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToolResultView } from "@/components/relocation/tools/ToolResultView";
import { BUCKET_DESCRIPTIONS, TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import {
  READINESS_DIMENSION_ACTIONS,
  READINESS_DIMENSION_DESCRIPTIONS,
} from "@/lib/relocation-tools-readiness";
import type { RelocationToolResultPayload } from "@/lib/relocation-tools-types";

// Canlı bir sonuç kaydından alındı (relocation_tool_results, 2026-08-07).
// `detail` alanı DB'nin ürettiği şablon cümledir — copy metni onu ezmelidir.
const WEAKEST3 = [
  {
    key: "support_adaptability",
    title: "Destek & Uyum",
    score: 0.425,
    detail: "Bu alanı bu hafta güçlendir: Destek & Uyum.",
  },
  {
    key: "financial_readiness",
    title: "Finansal Hazırlık",
    score: 0.5,
    detail: "Bu alanı bu hafta güçlendir: Finansal Hazırlık.",
  },
  {
    key: "legal_document_readiness",
    title: "Evrak & Yasal",
    score: 0.5,
    detail: "Bu alanı bu hafta güçlendir: Evrak & Yasal.",
  },
];

const RESULT: RelocationToolResultPayload = {
  result_id: "r1",
  tool_key: "relocation_readiness",
  result_kind: "score",
  total_score: 56.75,
  score_bucket: "prepare",
  primary_result: { score: 56.75 },
  sub_scores: { financial_readiness: 0.5, language_readiness: 0.8 },
  recommendations: [],
  explanations: ["Hazırlık skorun: 56.75/100."],
  ctas: [{ key: "find_mentor", label: "Mentor/Topluluk Desteği Bul", href: "/directory" }],
  location_snapshot: { country: "Almanya", city: "Berlin", source: "approved_attributes" },
};

function renderView(overrides: Partial<RelocationToolResultPayload> = {}, onRetake?: () => void) {
  return render(
    <MemoryRouter>
      <ToolResultView result={{ ...RESULT, ...overrides }} onRetake={onRetake} />
    </MemoryRouter>,
  );
}

describe("ToolResultView", () => {
  it("araç hub'ına giden tam genişlikte bir bağlantı gösterir", () => {
    renderView({}, vi.fn());

    const link = screen.getByRole("link", { name: new RegExp(TOOLS_UI_COPY.backToHub) });
    expect(link).toHaveAttribute("href", "/tools");
    expect(link.className).toContain("w-full");
  });

  it("dönüş bağlantısı CTA ızgarasının ALTINDA, gizlilik notunun ÜSTÜNDE durur", () => {
    const { container } = renderView({}, vi.fn());

    const root = container.firstElementChild as HTMLElement;
    const children = Array.from(root.children);
    const gridIndex = children.findIndex((el) => el.className.includes("grid"));
    // `Button asChild` <a>'yı doğrudan çocuk olarak basar — querySelector elemanın
    // KENDİSİNİ eşlemez, o yüzden matches() ile birlikte bakılır.
    const linkIndex = children.findIndex(
      (el) => el.matches('a[href="/tools"]') || el.querySelector('a[href="/tools"]') !== null,
    );
    const noteIndex = children.findIndex((el) => el.textContent === TOOLS_UI_COPY.privacyNote);

    expect(gridIndex).toBeGreaterThanOrEqual(0);
    expect(linkIndex).toBeGreaterThan(gridIndex);
    expect(noteIndex).toBeGreaterThan(linkIndex);
  });

  it("CTA ve Tekrar Çöz hiç yokken bile dönüş bağlantısı kalır — çıkışsız sonuç ekranı olmaz", () => {
    renderView({ ctas: [] });

    expect(screen.queryByRole("button", { name: TOOLS_UI_COPY.retake })).toBeNull();
    expect(screen.getByRole("link", { name: new RegExp(TOOLS_UI_COPY.backToHub) })).toBeInTheDocument();
  });

  it("sonucun oluşturma anı konumunu rapor kartında gösterir", () => {
    renderView();

    expect(screen.getByText(/Berlin, Almanya/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Raporu gönder" })).toBeEnabled();
  });

  it("konum snapshot'ı yoksa gönderim yerine profil yönlendirmesi gösterir", () => {
    renderView({ location_snapshot: null });

    expect(screen.queryByRole("button", { name: "Raporu gönder" })).toBeNull();
    expect(screen.getByRole("link", { name: "Profili aç" })).toHaveAttribute("href", "/profile");
  });
});

describe("ToolResultView — sonuç açıklamaları", () => {
  it("primary_result.weakest3'ü çizer — bu veri üretiliyordu ama gösterilmiyordu", () => {
    renderView({ primary_result: { score: 56.75, weakest3: WEAKEST3 } });

    expect(screen.getByText(TOOLS_UI_COPY.weakestTitle)).toBeInTheDocument();
    // support_adaptability sub_scores'ta YOK → yalnız zayıf alanlar kartında çıkar.
    expect(screen.getAllByText("Destek & Uyum")).toHaveLength(1);
    // financial_readiness ikisinde de var: puan dağılımı barı + zayıf alanlar kartı.
    expect(screen.getAllByText("Finansal Hazırlık")).toHaveLength(2);
  });

  it("weakest3'te DB'nin şablon detail'i yerine somut aksiyon metnini gösterir", () => {
    renderView({ primary_result: { score: 56.75, weakest3: WEAKEST3 } });

    expect(
      screen.getByText(READINESS_DIMENSION_ACTIONS.financial_readiness),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Bu alanı bu hafta güçlendir/)).toBeNull();
  });

  it("copy tanımlı olmayan boyutta DB'den gelen detail'e düşer", () => {
    renderView({
      primary_result: {
        weakest3: [{ key: "bilinmeyen_boyut", title: "Bilinmeyen", score: 0.2, detail: "DB metni" }],
      },
    });

    expect(screen.getByText("DB metni")).toBeInTheDocument();
  });

  it("puan dağılımında boyut açıklaması ve ağırlık yüzdesi gösterir", () => {
    renderView();

    expect(
      screen.getByText(READINESS_DIMENSION_DESCRIPTIONS.financial_readiness),
    ).toBeInTheDocument();
    // financial_readiness ağırlığı 0.25 → "skorun %25'i"
    expect(screen.getByText("skorun %25'i")).toBeInTheDocument();
  });

  it("bucket rozetinin altına ne anlama geldiğini yazar", () => {
    renderView();
    expect(screen.getByText(BUCKET_DESCRIPTIONS.prepare)).toBeInTheDocument();
  });

  it("copy'si olmayan araçta açıklama/ağırlık çizilmez, kart bozulmaz", () => {
    renderView({ tool_key: "baska_arac", score_bucket: null, primary_result: {} });

    expect(screen.getByText(TOOLS_UI_COPY.breakdownTitle)).toBeInTheDocument();
    expect(screen.queryByText(TOOLS_UI_COPY.breakdownHint)).toBeNull();
    expect(screen.queryByText(TOOLS_UI_COPY.weakestTitle)).toBeNull();
    expect(screen.queryByText(/skorun %/)).toBeNull();
  });
});
