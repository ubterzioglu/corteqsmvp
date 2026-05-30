import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import App from "@/App";

vi.mock("@/pages/May19CampaignPage.tsx", async () => {
  const { default: May19CampaignShell } = await import("@/components/may19/May19CampaignShell");

  return {
    default: () => (
      <May19CampaignShell eyebrow="Mock Eyebrow" title="Mock Campaign Title" description="Mock campaign description">
        <div>May19 Campaign Route</div>
      </May19CampaignShell>
    ),
  };
});

vi.mock("@/pages/May19MapPage.tsx", async () => {
  const { default: May19CampaignShell } = await import("@/components/may19/May19CampaignShell");

  return {
    default: () => (
      <May19CampaignShell eyebrow="Mock Eyebrow" title="Mock Map Title" description="Mock map description">
        <div>May19 Map Route</div>
      </May19CampaignShell>
    ),
  };
});

vi.mock("@/pages/May19IdeaPage.tsx", async () => {
  const { default: May19CampaignShell } = await import("@/components/may19/May19CampaignShell");

  return {
    default: () => (
      <May19CampaignShell eyebrow="Mock Eyebrow" title="Mock Idea Title" description="Mock idea description">
        <div>May19 Idea Route</div>
      </May19CampaignShell>
    ),
  };
});

vi.mock("@/pages/May19MomentPage.tsx", async () => {
  const { default: May19CampaignShell } = await import("@/components/may19/May19CampaignShell");

  return {
    default: () => (
      <May19CampaignShell eyebrow="Mock Eyebrow" title="Mock Moment Title" description="Mock moment description">
        <div>May19 Moment Route</div>
      </May19CampaignShell>
    ),
  };
});

describe("App 19 Mayıs routing", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the public 19051919 route", () => {
    window.history.pushState({}, "", "/19051919");

    render(<App />);

    expect(screen.getByText("May19 Campaign Route")).toBeInTheDocument();
  });

  it("renders the public 19051919 harita route", () => {
    window.history.pushState({}, "", "/19051919/harita");

    render(<App />);

    expect(screen.getByText("May19 Map Route")).toBeInTheDocument();
  });

  it("renders the public 190519idea route", () => {
    window.history.pushState({}, "", "/190519idea");

    render(<App />);

    expect(screen.getByText("May19 Idea Route")).toBeInTheDocument();
  });

  it("renders the public 190519memory route", () => {
    window.history.pushState({}, "", "/190519memory");

    render(<App />);

    expect(screen.getByText("May19 Moment Route")).toBeInTheDocument();
  });
});
