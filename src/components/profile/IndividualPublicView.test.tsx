import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { type ReactNode } from "react";
import IndividualPublicView from "./IndividualPublicView";
import { buildFallbackIndividualProfileDetails } from "@/lib/individual-profile";

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "viewer-999" }, isLoading: false }),
}));

vi.mock("@/integrations/supabase/client", () => {
  const resolved = Promise.resolve({ data: [], error: null, count: 0 });
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnValue(resolved),
    maybeSingle: vi.fn().mockReturnValue(resolved),
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnValue(resolved),
  };
  return { supabase: { from: vi.fn().mockReturnValue(chain) } };
});

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const makeDetails = (overrides: object = {}) => ({
  ...buildFallbackIndividualProfileDetails({
    userId: "target-123",
    displayName: "Kemal Aydın",
    email: "kemal@example.com",
  }),
  ...overrides,
});

describe("IndividualPublicView", () => {
  it("renders the display name", () => {
    render(<IndividualPublicView details={makeDetails()} />, { wrapper });
    expect(screen.getByRole("heading", { name: "Kemal Aydın" })).toBeInTheDocument();
  });

  it("shows İş Arıyorum badge when jobSeeking is true", () => {
    render(<IndividualPublicView details={makeDetails({ jobSeeking: true })} />, { wrapper });
    expect(screen.getByText(/İş Arıyorum/)).toBeInTheDocument();
  });

  it("does not show İş Arıyorum badge when jobSeeking is false", () => {
    render(<IndividualPublicView details={makeDetails({ jobSeeking: false })} />, { wrapper });
    expect(screen.queryByText(/İş Arıyorum/)).not.toBeInTheDocument();
  });

  it("shows CorteQS Pasaportu badge when corteqsPassport is true", () => {
    const details = makeDetails();
    details.frontCard.corteqsPassport = true;
    render(<IndividualPublicView details={details} />, { wrapper });
    expect(screen.getByText(/CorteQS Pasaportu/)).toBeInTheDocument();
  });

  it("shows follow button for other users (viewer != target)", () => {
    render(<IndividualPublicView details={makeDetails()} />, { wrapper });
    expect(screen.getByRole("button", { name: /Takip Et/ })).toBeInTheDocument();
  });

  it("renders Son 2 ayda etkinlikler section header", () => {
    render(<IndividualPublicView details={makeDetails()} />, { wrapper });
    expect(screen.getByText("Son 2 ayda etkinlikler")).toBeInTheDocument();
  });

  it("renders Cadde'de Takılıyor section header", () => {
    render(<IndividualPublicView details={makeDetails()} />, { wrapper });
    expect(screen.getByText("Cadde'de Takılıyor")).toBeInTheDocument();
  });

  it("shows world message when present", () => {
    const details = makeDetails();
    details.frontCard.worldMessage = "Merhaba dünya!";
    render(<IndividualPublicView details={details} />, { wrapper });
    expect(screen.getByText("Merhaba dünya!")).toBeInTheDocument();
  });

  it("shows LinkedIn link when linkedinUrl is set and visible", () => {
    const details = makeDetails();
    details.frontCard.linkedinUrl = "https://linkedin.com/in/kemal";
    details.frontCard.linkedinVisible = true;
    render(<IndividualPublicView details={details} />, { wrapper });
    expect(screen.getByRole("link", { name: /LinkedIn/ })).toBeInTheDocument();
  });
});
