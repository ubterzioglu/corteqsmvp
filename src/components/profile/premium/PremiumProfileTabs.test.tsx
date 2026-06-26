import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PremiumProfileTabs, { PREMIUM_TAB_KEYS } from "./PremiumProfileTabs";

// Project pattern (see muhasebe/MuhasebeDashboard.test.tsx): mock the shadcn
// Tabs primitives so value-controlled switching is deterministic under jsdom —
// real Radix Tabs do not activate on a bare fireEvent.click.
vi.mock("@/components/ui/tabs", async () => {
  const React = await import("react");
  const TabsContext = React.createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
  }>({});

  return {
    Tabs: ({
      value,
      onValueChange,
      children,
    }: React.PropsWithChildren<{
      value?: string;
      onValueChange?: (value: string) => void;
    }>) => (
      <TabsContext.Provider value={{ value, onValueChange }}>
        <div data-value={value}>{children}</div>
      </TabsContext.Provider>
    ),
    TabsList: ({ children }: React.PropsWithChildren) => <div role="tablist">{children}</div>,
    TabsTrigger: ({
      value,
      children,
    }: React.PropsWithChildren<{ value: string }>) => {
      const context = React.useContext(TabsContext);
      return (
        <button
          role="tab"
          type="button"
          data-state={context.value === value ? "active" : "inactive"}
          onClick={() => context.onValueChange?.(value)}
        >
          {children}
        </button>
      );
    },
    TabsContent: ({
      value,
      children,
    }: React.PropsWithChildren<{ value: string }>) => {
      const context = React.useContext(TabsContext);
      if (context.value !== value) return null;
      return <div role="tabpanel">{children}</div>;
    },
  };
});

// MessagesInbox is data-heavy (own auth + supabase fetching); the tab behavior
// under test only needs to know it renders when its tab is active.
vi.mock("@/components/messaging/MessagesInbox", () => ({
  default: () => <div data-testid="messages-inbox">Mesaj Kutusu içeriği</div>,
}));

// The component is now controlled (active tab owned by ProfilePage). This
// wrapper holds the state locally so tab clicks still switch panels in tests.
const ControlledTabs = ({ initialTab = PREMIUM_TAB_KEYS.settings }: { initialTab?: string }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  return (
    <PremiumProfileTabs
      settingsContent={<div data-testid="settings-content">Profil Ayarları içeriği</div>}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
    />
  );
};

const renderTabs = (initialTab?: string) => render(<ControlledTabs initialTab={initialTab} />);

describe("PremiumProfileTabs", () => {
  it("renders the visible dashboard tabs", () => {
    renderTabs();

    expect(screen.getByRole("tab", { name: /Mesaj Kutusu/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Hizmet Talepleri/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Taşınma Yönetimi/ })).toBeInTheDocument();
  });

  it("does not render Profil Ayarları or Bildirimler as tabs (driven by hero buttons)", () => {
    renderTabs();

    expect(screen.queryByRole("tab", { name: /Profil Ayarları/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Bildirimler/ })).not.toBeInTheDocument();
  });

  it("shows the settings content when the settings tab is active", () => {
    renderTabs(PREMIUM_TAB_KEYS.settings);

    expect(screen.getByTestId("settings-content")).toBeInTheDocument();
  });

  it("shows the Bildirimler placeholder panel when its tab is active", () => {
    renderTabs(PREMIUM_TAB_KEYS.notifications);

    expect(screen.getByText("Yakında")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bildirimler" })).toBeInTheDocument();
  });

  it("renders MessagesInbox when the Mesaj Kutusu tab is selected", () => {
    renderTabs();

    fireEvent.click(screen.getByRole("tab", { name: /Mesaj Kutusu/ }));

    expect(screen.getByTestId("messages-inbox")).toBeInTheDocument();
  });

  it("shows a 'Yakında' placeholder panel for an unwired tab", () => {
    renderTabs();

    fireEvent.click(screen.getByRole("tab", { name: /Taşınma Yönetimi/ }));

    expect(screen.getByText("Yakında")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Taşınma Yönetimi" })).toBeInTheDocument();
  });
});
