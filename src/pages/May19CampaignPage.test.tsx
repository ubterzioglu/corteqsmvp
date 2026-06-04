import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import May19CampaignPage from "@/pages/May19CampaignPage";

describe("May19CampaignPage", () => {
  it("renders simplified hero and vertical module links", () => {
    render(
      <MemoryRouter>
        <May19CampaignPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /19 Mayıs Coşkusunu Birlikte Yaşayalım!/i })).toBeInTheDocument();

    expect(
      screen.getByText(/1\. Dünya üzerindeki yerini işaretleyerek diaspora haritasında görünür ol\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2\. 19 kelimelik fikrini paylaşarak topluluğa yeni bir katkı sun\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/3\. 19 Mayıs anını göndererek bayram coşkusunu birlikte büyüt\./i),
    ).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: /Modüllere İn/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Global Harita/i })).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Dünya Üzerinde Yerini İşaretle/i })).toHaveAttribute(
      "href",
      "https://globe.corteqs.net",
    );
    expect(screen.getByRole("link", { name: /19 Kelimelik Fikrini Gönder/i })).toHaveAttribute(
      "href",
      "/190519idea",
    );
    expect(screen.getByRole("link", { name: /19 Mayıs Anını Paylaş/i })).toHaveAttribute(
      "href",
      "/190519memory",
    );
  });
});
