import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminLansmanTable from "@/components/AdminLansmanTable";

const getAllRegistrationsMock = vi.fn();
const updateRegistrationStatusMock = vi.fn();

vi.mock("@/lib/lansman", () => ({
  getAllRegistrations: () => getAllRegistrationsMock(),
  updateRegistrationStatus: (...args: unknown[]) =>
    updateRegistrationStatusMock(...args),
  buildLansmanSocialHref: (
    platform: "linkedin" | "instagram" | "youtube" | "website",
    value: string | null,
  ) => {
    if (!value) return null;
    if (platform === "linkedin") return `https://www.linkedin.com/in/${value}`;
    if (platform === "instagram") return `https://www.instagram.com/${value}`;
    if (platform === "youtube") return `https://www.youtube.com/@${value}`;
    return `https://${value.replace(/^https?:\/\//, "")}`;
  },
}));

describe("AdminLansmanTable", () => {
  it("renders registrations and approves a row", async () => {
    getAllRegistrationsMock.mockResolvedValue([
      {
        id: "1",
        first_name: "Ada",
        last_name: "Lovelace",
        initials: "AL",
        phone: "+491701234567",
        linkedin: "ada",
        instagram: "ada",
        youtube: null,
        website: null,
        description: "Kurucu topluluk üyesi",
        status: "pending",
        created_at: "2026-05-03T10:00:00.000Z",
      },
    ]);
    updateRegistrationStatusMock.mockResolvedValue({
      id: "1",
      first_name: "Ada",
      last_name: "Lovelace",
      initials: "AL",
      phone: "+491701234567",
      linkedin: "ada",
      instagram: "ada",
      youtube: null,
      website: null,
      description: "Kurucu topluluk üyesi",
      status: "approved",
      created_at: "2026-05-03T10:00:00.000Z",
    });

    render(<AdminLansmanTable />);

    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", "https://www.linkedin.com/in/ada");
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://www.instagram.com/ada");
    expect(screen.getByLabelText("YouTube yok")).toBeInTheDocument();
    expect(screen.queryByText("X / Twitter")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Onayla" }));

    await waitFor(() => {
      expect(updateRegistrationStatusMock).toHaveBeenCalledWith("1", "approved");
    });

    expect(screen.getByText("Onaylandı")).toBeInTheDocument();
  });

  it("rejects a row from the admin table", async () => {
    getAllRegistrationsMock.mockResolvedValue([
      {
        id: "2",
        first_name: "Ugur",
        last_name: "Bulut",
        initials: "UB",
        phone: "+905551112233",
        linkedin: null,
        instagram: null,
        youtube: null,
        website: null,
        description: null,
        status: "pending",
        created_at: "2026-05-03T10:00:00.000Z",
      },
    ]);
    updateRegistrationStatusMock.mockResolvedValue({
      id: "2",
      first_name: "Ugur",
      last_name: "Bulut",
      initials: "UB",
      phone: "+905551112233",
      linkedin: null,
      instagram: null,
      youtube: null,
      website: null,
      description: null,
      status: "rejected",
      created_at: "2026-05-03T10:00:00.000Z",
    });

    render(<AdminLansmanTable />);

    await waitFor(() => {
      expect(screen.getByText("Ugur Bulut")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Reddet" }));

    await waitFor(() => {
      expect(updateRegistrationStatusMock).toHaveBeenCalledWith("2", "rejected");
    });

    expect(screen.getByText("Reddedildi")).toBeInTheDocument();
  });
});
