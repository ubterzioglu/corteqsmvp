import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import DirectoryResultRow from "@/components/directory/DirectoryResultRow";
import type { UnifiedDirectoryRow } from "@/lib/catalog-directory";

const mockRow: UnifiedDirectoryRow = {
  recordType: "user_profile",
  id: "user-123",
  href: "/directory/profile/user-123",
  title: "Ahmet Yilmaz",
  roleKey: "danisman",
  roleLabel: "Danisman",
  description: "Gocmenlik hukuku uzmani",
  country: "Almanya",
  city: "Berlin",
  imageUrl: null,
  specialLabel: null,
  specialValue: null,
  isFeatured: true,
  isVerified: false,
  isClaimable: false,
};

describe("DirectoryResultRow", () => {
  it("renders title, role and location", () => {
    render(
      <MemoryRouter>
        <DirectoryResultRow row={mockRow} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Ahmet Yilmaz")).toBeInTheDocument();
    expect(screen.getByText("Danisman")).toBeInTheDocument();
    expect(screen.getByText(/Berlin/)).toBeInTheDocument();
  });

  it("renders the correct link", () => {
    render(
      <MemoryRouter>
        <DirectoryResultRow row={mockRow} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", "/directory/profile/user-123");
  });
});
