import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CatalogItemRuleManager from "@/components/admin/catalog/CatalogItemRuleManager";
import type { CatalogItemRules } from "@/lib/catalog-types";

const getCatalogItemRulesMock = vi.fn();
const setCatalogItemAttributeOverrideMock = vi.fn();
const removeCatalogItemAttributeOverrideMock = vi.fn();
const setCatalogItemFeatureOverrideMock = vi.fn();
const removeCatalogItemFeatureOverrideMock = vi.fn();
const setCatalogItemSectionOverrideMock = vi.fn();
const removeCatalogItemSectionOverrideMock = vi.fn();

vi.mock("@/lib/admin-catalog", () => ({
  getCatalogItemRules: (...args: unknown[]) => getCatalogItemRulesMock(...args),
  setCatalogItemAttributeOverride: (...args: unknown[]) => setCatalogItemAttributeOverrideMock(...args),
  removeCatalogItemAttributeOverride: (...args: unknown[]) => removeCatalogItemAttributeOverrideMock(...args),
  setCatalogItemFeatureOverride: (...args: unknown[]) => setCatalogItemFeatureOverrideMock(...args),
  removeCatalogItemFeatureOverride: (...args: unknown[]) => removeCatalogItemFeatureOverrideMock(...args),
  setCatalogItemSectionOverride: (...args: unknown[]) => setCatalogItemSectionOverrideMock(...args),
  removeCatalogItemSectionOverride: (...args: unknown[]) => removeCatalogItemSectionOverrideMock(...args),
}));

const rules: CatalogItemRules = {
  platformRoleKey: "Organization_Association",
  attributes: [
    {
      key: "full_name",
      label: "Görünen İsim",
      dataType: "text",
      visibility: "public",
      isRequired: true,
      displayOrder: 10,
      isOverride: false,
      isEnabled: true,
    },
    {
      key: "bio_short",
      label: "Özel Bio",
      dataType: "text",
      visibility: "public",
      isRequired: false,
      displayOrder: 20,
      isOverride: true,
      isEnabled: false,
    },
  ],
  features: [{ key: "directory.visible", label: "Directory Visible", isEnabled: true, isOverride: false }],
  sections: [{ key: "about", label: "Hakkında", isVisible: true, displayOrder: 5, isOverride: true }],
  overrides: {
    attributes: [],
    features: [],
    sections: [],
  },
};

describe("CatalogItemRuleManager", () => {
  beforeEach(() => {
    getCatalogItemRulesMock.mockReset();
    setCatalogItemAttributeOverrideMock.mockReset();
    removeCatalogItemAttributeOverrideMock.mockReset();
    setCatalogItemFeatureOverrideMock.mockReset();
    removeCatalogItemFeatureOverrideMock.mockReset();
    setCatalogItemSectionOverrideMock.mockReset();
    removeCatalogItemSectionOverrideMock.mockReset();

    getCatalogItemRulesMock.mockResolvedValue(rules);
    setCatalogItemAttributeOverrideMock.mockResolvedValue(undefined);
    removeCatalogItemAttributeOverrideMock.mockResolvedValue(undefined);
    setCatalogItemFeatureOverrideMock.mockResolvedValue(undefined);
    removeCatalogItemFeatureOverrideMock.mockResolvedValue(undefined);
    setCatalogItemSectionOverrideMock.mockResolvedValue(undefined);
    removeCatalogItemSectionOverrideMock.mockResolvedValue(undefined);
  });

  it("renders inherited and override rows", () => {
    render(<CatalogItemRuleManager itemId="item-1" rules={rules} onRulesChanged={vi.fn()} />);

    expect(screen.getByText("Görünen İsim")).toBeInTheDocument();
    expect(screen.getByText("Özel Bio")).toBeInTheDocument();
    expect(screen.getAllByText("Inherited").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Override").length).toBeGreaterThan(0);
    expect(screen.getByText("Directory Visible")).toBeInTheDocument();
    expect(screen.getByText("Hakkında")).toBeInTheDocument();
  });

  it("creates attribute overrides from inherited rows", async () => {
    render(<CatalogItemRuleManager itemId="item-1" rules={rules} onRulesChanged={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("full_name label override"), { target: { value: "Yeni İsim" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Kaydet" })[0]);

    await waitFor(() => {
      expect(setCatalogItemAttributeOverrideMock).toHaveBeenCalledWith("item-1", "full_name", {
        isEnabled: true,
        displayOrder: 10,
        overrideLabel: "Yeni İsim",
      });
    });
  });

  it("resets override rows", async () => {
    render(<CatalogItemRuleManager itemId="item-1" rules={rules} onRulesChanged={vi.fn()} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Varsayılana Dön" })[0]);

    await waitFor(() => {
      expect(removeCatalogItemAttributeOverrideMock).toHaveBeenCalledWith("item-1", "bio_short");
    });
  });

  it("saves feature and section overrides", async () => {
    render(<CatalogItemRuleManager itemId="item-1" rules={rules} onRulesChanged={vi.fn()} />);

    fireEvent.click(screen.getByRole("switch", { name: "directory.visible aktif" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Kaydet" })[2]);

    await waitFor(() => {
      expect(setCatalogItemFeatureOverrideMock).toHaveBeenCalledWith("item-1", "directory.visible", false);
    });

    fireEvent.click(screen.getByRole("switch", { name: "about görünür" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Kaydet" })[3]);

    await waitFor(() => {
      expect(setCatalogItemSectionOverrideMock).toHaveBeenCalledWith("item-1", "about", {
        isVisible: false,
        displayOrder: 5,
      });
    });
  });
});
