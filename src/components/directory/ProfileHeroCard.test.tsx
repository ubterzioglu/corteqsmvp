import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ProfileHeroCard from "@/components/directory/ProfileHeroCard";

describe("ProfileHeroCard", () => {
  it("renders title, subtitle and badges", () => {
    render(
      <MemoryRouter>
        <ProfileHeroCard
          title="Ornek Danismanlik"
          subtitle="Gocmenlik Hukuku"
          roleLabel="Danisman"
          locationLabel="Berlin • Almanya"
          imageUrl={null}
          badges={[{ label: "Onayli", variant: "outline" }]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Ornek Danismanlik")).toBeInTheDocument();
    expect(screen.getByText("Gocmenlik Hukuku")).toBeInTheDocument();
    expect(screen.getByText("Danisman")).toBeInTheDocument();
    expect(screen.getByText("Onayli")).toBeInTheDocument();
  });

  it("renders initials when image is missing", () => {
    render(
      <MemoryRouter>
        <ProfileHeroCard
          title="Ahmet Test"
          subtitle={null}
          roleLabel={null}
          locationLabel={null}
          imageUrl={null}
          badges={[]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("AH")).toBeInTheDocument();
  });
});
