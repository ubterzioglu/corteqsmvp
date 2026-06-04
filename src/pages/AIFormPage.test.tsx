import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import AIFormPage from "@/pages/AIFormPage";

describe("AIFormPage", () => {
  it("redirects legacy AI registration traffic to /login", async () => {
    render(
      <MemoryRouter initialEntries={["/aiform"]}>
        <Routes>
          <Route path="/aiform" element={<AIFormPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });
});
