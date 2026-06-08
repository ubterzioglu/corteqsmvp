import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

  it("renders the public 19051919 route", async () => {
    window.history.pushState({}, "", "/19051919");
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText("May19 Campaign Route")).toBeInTheDocument());
  });

  it("renders the public 19051919 harita route", async () => {
    window.history.pushState({}, "", "/19051919/harita");
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText("May19 Map Route")).toBeInTheDocument());
  });

  it("renders the public 190519idea route", async () => {
    window.history.pushState({}, "", "/190519idea");
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText("May19 Idea Route")).toBeInTheDocument());
  });

  it("renders the public 190519memory route", async () => {
    window.history.pushState({}, "", "/190519memory");
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText("May19 Moment Route")).toBeInTheDocument());
  });
});
