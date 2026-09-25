import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BureaucracyTimeline } from "./BureaucracyTimeline";
import { CityComparisonTable } from "./CityComparisonTable";
import { EmergencyContactsPanel } from "./EmergencyContactsPanel";
import { ServiceRecommendationCard } from "./ServiceRecommendationCard";
import { normalizeLocationRecommendation } from "@/lib/relocation-normalize";
import type {
  RelocationLocationRecommendation,
  RelocationServiceRow,
  RelocationStepRow,
} from "@/lib/relocation-types";

/**
 * `relocation_rank_locations_v1`'in canlı çıktısıyla AYNI anahtarlar — `explanations` yok.
 * Bu şekil 20–23 Eylül 2026'da /relocation'ı "reading 'length'" ile düşürdü.
 */
const liveRankRow = {
  entity_id: "l1",
  country_code: "DE",
  city_code: "BER",
  title: "Berlin",
  hard_filter_pass: true,
  rule_score: 0.6125,
  final_score: 0.6125,
  score_breakdown: {
    budget_fit: 0.5,
    bureaucracy_ease: 0.4,
    healthcare_access: 0.8,
    gsm_coverage: 0.9,
    community_fit: 0.7,
    flight_access: 0.6,
  },
  source_quality: { official_sources_ratio: 0, freshness_hours: null },
};

const TRIGGER_LABELS = {
  before_departure: "Gitmeden önce",
  after_arrival: "Vardıktan sonra",
  ongoing: "Sürekli",
} as const;

describe("CityComparisonTable — explanations olmadan gelen veri", () => {
  it("ham canlı RPC satırıyla (normalize edilmeden) çökmeden çizer", () => {
    render(
      <CityComparisonTable
        recommendations={[liveRankRow as unknown as RelocationLocationRecommendation]}
        emptyLabel="Öneri yok"
        whyLabel="Neden?"
      />,
    );
    expect(screen.getByText("Berlin")).toBeInTheDocument();
    expect(screen.getByText("61%")).toBeInTheDocument();
    expect(screen.queryByText("Neden?")).not.toBeInTheDocument();
  });

  it("normalize edilmiş satırla çizer; score_breakdown eksikse de düşmez", () => {
    const rec = normalizeLocationRecommendation({ entity_id: "l2", title: "Münih" });
    render(<CityComparisonTable recommendations={[rec]} emptyLabel="Öneri yok" whyLabel="Neden?" />);
    expect(screen.getByText("Münih")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("explanations doluysa 'Neden?' bölümünü gösterir", () => {
    const rec = normalizeLocationRecommendation({
      ...liveRankRow,
      explanations: ["Sağlık erişimi yüksek"],
    });
    render(<CityComparisonTable recommendations={[rec]} emptyLabel="Öneri yok" whyLabel="Neden?" />);
    expect(screen.getByText("Neden?")).toBeInTheDocument();
    expect(screen.getByText(/Sağlık erişimi yüksek/)).toBeInTheDocument();
  });

  it("liste undefined gelirse boş durum metnini gösterir", () => {
    render(
      <CityComparisonTable
        recommendations={undefined as unknown as RelocationLocationRecommendation[]}
        emptyLabel="Öneri yok"
        whyLabel="Neden?"
      />,
    );
    expect(screen.getByText("Öneri yok")).toBeInTheDocument();
  });
});

describe("ServiceRecommendationCard — eksik alanlar", () => {
  it("languages ve trust_score yokken çökmez", () => {
    const service = { id: "s1", provider_name: "Vodafone" } as unknown as RelocationServiceRow;
    render(<ServiceRecommendationCard service={service} />);
    expect(screen.getByText("Vodafone")).toBeInTheDocument();
    expect(screen.getByText("0% güven")).toBeInTheDocument();
  });
});

describe("BureaucracyTimeline — eksik belge listesi", () => {
  it("required_documents yokken adımı çizer, belge satırını atlar", () => {
    const step = {
      id: "b1",
      name: "Anmeldung",
      trigger: "after_arrival",
      sort_order: 1,
    } as unknown as RelocationStepRow;
    render(
      <BureaucracyTimeline
        steps={[step]}
        triggerLabels={TRIGGER_LABELS}
        documentsLabel="Belgeler"
        deadlineLabel="Süre"
        emptyLabel="Adım yok"
      />,
    );
    expect(screen.getByText("Anmeldung")).toBeInTheDocument();
    expect(screen.queryByText(/Belgeler/)).not.toBeInTheDocument();
  });

  it("steps undefined gelirse boş durum metnini gösterir", () => {
    render(
      <BureaucracyTimeline
        steps={undefined as unknown as RelocationStepRow[]}
        triggerLabels={TRIGGER_LABELS}
        documentsLabel="Belgeler"
        deadlineLabel="Süre"
        emptyLabel="Adım yok"
      />,
    );
    expect(screen.getByText("Adım yok")).toBeInTheDocument();
  });
});

describe("EmergencyContactsPanel — boş veri", () => {
  it("contacts undefined gelirse boş durum metnini gösterir", () => {
    render(<EmergencyContactsPanel contacts={undefined as never} emptyLabel="Kayıt yok" />);
    expect(screen.getByText("Kayıt yok")).toBeInTheDocument();
  });
});
