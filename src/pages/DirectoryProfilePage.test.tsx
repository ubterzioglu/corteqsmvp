import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import DirectoryProfilePage from "@/pages/DirectoryProfilePage";

const maybeSingleMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: (...args: unknown[]) => maybeSingleMock(...args),
              })),
            })),
          })),
        })),
      })),
    })),
  },
}));

describe("DirectoryProfilePage", () => {
  it("redirects legacy profile routes to the canonical catalog slug", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { slug: "corteqs-business" },
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/directory/profile/user-1"]}>
        <Routes>
          <Route path="/directory/profile/:userId" element={<DirectoryProfilePage />} />
          <Route path="/directory/catalog/:slug" element={<div>Canonical Catalog Profile</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Canonical Catalog Profile")).toBeInTheDocument();
    });
  });
});
