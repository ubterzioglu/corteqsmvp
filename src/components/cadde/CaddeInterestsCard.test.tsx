import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import CaddeInterestsCard from "@/components/cadde/CaddeInterestsCard";

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "u-1", email: "u@example.com" } }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/member-profile-api", () => ({
  updateProfileAttribute: vi.fn().mockResolvedValue({ status: "approved" }),
}));

vi.mock("@/lib/cadde-api", () => ({
  listCaddeInterestCatalog: vi.fn().mockResolvedValue([
    { key: "kariyer", labelTr: "Kariyer", sortOrder: 1 },
    { key: "mentorluk", labelTr: "Mentörlük", sortOrder: 2 },
  ]),
  listMyCaddeInterests: vi.fn().mockResolvedValue(["kariyer"]),
  saveMyCaddeInterests: vi.fn().mockResolvedValue(undefined),
}));

function renderCard(props: { canHide: boolean }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CaddeInterestsCard visibility="public" canHide={props.canHide} />
    </QueryClientProvider>,
  );
}

describe("CaddeInterestsCard — WS1 madde 5 (ilgi alanları herkese açık)", () => {
  it("gizlenemez kuralda görünürlük anahtarı yerine 'Herkese açık' rozeti ve gerekçe gösterir", async () => {
    renderCard({ canHide: false });

    expect(await screen.findByRole("button", { name: "Kariyer" })).toBeInTheDocument();
    expect(screen.getByText("Herkese açık")).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: /İlgi alanları görünürlük/i })).not.toBeInTheDocument();
    expect(screen.getByText(/eşleştirme ve ağ önerileri bunlarla çalışır/i)).toBeInTheDocument();
  });

  it("gizlenebilir kuralda anahtar çizilir (eski davranış korunur)", async () => {
    renderCard({ canHide: true });

    expect(await screen.findByRole("button", { name: "Kariyer" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /İlgi alanları görünürlük/i })).toBeInTheDocument();
    expect(screen.queryByText("Herkese açık")).not.toBeInTheDocument();
  });
});
