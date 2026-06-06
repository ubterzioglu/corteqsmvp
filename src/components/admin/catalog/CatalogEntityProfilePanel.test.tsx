import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CatalogEntityProfilePanel from "@/components/admin/catalog/CatalogEntityProfilePanel";
import type { CatalogEntityProfile } from "@/lib/catalog-entity-api";

// jsdom does not implement scrollIntoView — Radix Select requires it
Element.prototype.scrollIntoView = vi.fn();

const getCatalogItemProfileMock = vi.fn();
const adminSetCatalogItemAttributeMock = vi.fn();

vi.mock("@/lib/catalog-entity-api", () => ({
  getCatalogItemProfile: (...args: unknown[]) => getCatalogItemProfileMock(...args),
  adminSetCatalogItemAttribute: (...args: unknown[]) => adminSetCatalogItemAttributeMock(...args),
}));

const baseProfile: CatalogEntityProfile = {
  id: "item-abc",
  item_type: "member",
  slug: "member-abc",
  title: "Umut Baris Terzioglu",
  status: "published",
  visibility: "private",
  linked_user_id: "user-uuid-123",
  attributes: [
    {
      attribute_key: "full_name",
      label: "Gorunen Isim",
      data_type: "text",
      is_system: false,
      sort_order: 1,
      is_required: true,
      is_public_default: true,
      editor_can_edit: true,
      editor_can_hide: false,
      requires_admin_approval_on_change: false,
      visibility: "public",
      approval_status: "approved",
      value_text: "Umut Baris Terzioglu",
      value_json: null,
    },
    {
      attribute_key: "country",
      label: "Ulke",
      data_type: "text",
      is_system: false,
      sort_order: 2,
      is_required: false,
      is_public_default: true,
      editor_can_edit: true,
      editor_can_hide: true,
      requires_admin_approval_on_change: false,
      visibility: "public",
      approval_status: "approved",
      value_text: "Türkiye",
      value_json: null,
    },
  ],
  features: [],
};

describe("CatalogEntityProfilePanel", () => {
  beforeEach(() => {
    getCatalogItemProfileMock.mockReset();
    adminSetCatalogItemAttributeMock.mockReset();
    getCatalogItemProfileMock.mockResolvedValue(baseProfile);
    adminSetCatalogItemAttributeMock.mockResolvedValue(undefined);
  });

  it("loads and renders all attribute fields with their current values", async () => {
    render(<CatalogEntityProfilePanel itemId="item-abc" />);

    await waitFor(() => {
      expect(screen.getByText("Gorunen Isim")).toBeInTheDocument();
    });

    expect(screen.getByText("Ulke")).toBeInTheDocument();

    const fullNameInput = screen.getAllByRole("textbox").find(
      (el) => (el as HTMLInputElement).value === "Umut Baris Terzioglu",
    );
    expect(fullNameInput).toBeInTheDocument();

    const countryInput = screen.getAllByRole("textbox").find(
      (el) => (el as HTMLInputElement).value === "Türkiye",
    );
    expect(countryInput).toBeInTheDocument();

    expect(getCatalogItemProfileMock).toHaveBeenCalledWith("item-abc");
  });

  it("renders catalog profile metadata correctly", async () => {
    render(<CatalogEntityProfilePanel itemId="item-abc" />);

    await waitFor(() => {
      expect(screen.getByText("Umut Baris Terzioglu")).toBeInTheDocument();
    });

    expect(screen.getByText("member")).toBeInTheDocument();
    expect(screen.getByText("member-abc")).toBeInTheDocument();
    expect(screen.getByText("published")).toBeInTheDocument();
    expect(screen.getByText("private")).toBeInTheDocument();
    expect(screen.getByText("user-uuid-123")).toBeInTheDocument();
  });

  it("allows editing an attribute value in the input field", async () => {
    render(<CatalogEntityProfilePanel itemId="item-abc" />);

    await waitFor(() => {
      expect(screen.getByText("Gorunen Isim")).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole("textbox");
    const fullNameInput = inputs.find(
      (el) => (el as HTMLInputElement).value === "Umut Baris Terzioglu",
    ) as HTMLInputElement;

    fireEvent.change(fullNameInput, { target: { value: "Yeni İsim" } });

    expect(fullNameInput.value).toBe("Yeni İsim");
  });

  it("calls adminSetCatalogItemAttribute with correct args when save is clicked", async () => {
    render(<CatalogEntityProfilePanel itemId="item-abc" />);

    await waitFor(() => {
      expect(screen.getByText("Gorunen Isim")).toBeInTheDocument();
    });

    const saveButtons = screen.getAllByRole("button", { name: "Attribute Kaydet" });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(adminSetCatalogItemAttributeMock).toHaveBeenCalledWith(
        "item-abc",
        "full_name",
        "Umut Baris Terzioglu",
        "public",
      );
    });
  });

  it("re-fetches profile after a successful save so new override value appears", async () => {
    const updatedProfile: CatalogEntityProfile = {
      ...baseProfile,
      attributes: [
        {
          ...baseProfile.attributes[0],
          value_text: "Override Isim",
        },
        baseProfile.attributes[1],
      ],
    };

    getCatalogItemProfileMock
      .mockResolvedValueOnce(baseProfile)
      .mockResolvedValueOnce(updatedProfile);

    render(<CatalogEntityProfilePanel itemId="item-abc" />);

    await waitFor(() => {
      expect(screen.getByText("Gorunen Isim")).toBeInTheDocument();
    });

    const saveButtons = screen.getAllByRole("button", { name: "Attribute Kaydet" });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      const inputs = screen.getAllByRole("textbox");
      const overrideInput = inputs.find(
        (el) => (el as HTMLInputElement).value === "Override Isim",
      );
      expect(overrideInput).toBeInTheDocument();
    });

    expect(getCatalogItemProfileMock).toHaveBeenCalledTimes(2);
  });

  it("shows error message when API save fails", async () => {
    adminSetCatalogItemAttributeMock.mockRejectedValueOnce(new Error("RPC hatası"));

    render(<CatalogEntityProfilePanel itemId="item-abc" />);

    await waitFor(() => {
      expect(screen.getByText("Gorunen Isim")).toBeInTheDocument();
    });

    const saveButtons = screen.getAllByRole("button", { name: "Attribute Kaydet" });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("RPC hatası")).toBeInTheDocument();
    });
  });

  it("shows error message when profile load fails", async () => {
    getCatalogItemProfileMock.mockRejectedValueOnce(new Error("Yükleme başarısız"));

    render(<CatalogEntityProfilePanel itemId="item-abc" />);

    await waitFor(() => {
      expect(screen.getByText("Yükleme başarısız")).toBeInTheDocument();
    });
  });

  it("changes visibility draft and sends updated visibility to API on save", async () => {
    render(<CatalogEntityProfilePanel itemId="item-abc" />);

    await waitFor(() => {
      expect(screen.getByText("Gorunen Isim")).toBeInTheDocument();
    });

    const visibilityTriggers = screen.getAllByRole("combobox");
    fireEvent.click(visibilityTriggers[0]);

    fireEvent.click(await screen.findByRole("option", { name: "Private" }));

    fireEvent.click(screen.getAllByRole("button", { name: "Attribute Kaydet" })[0]);

    await waitFor(() => {
      expect(adminSetCatalogItemAttributeMock).toHaveBeenCalledWith(
        "item-abc",
        "full_name",
        "Umut Baris Terzioglu",
        "private",
      );
    });
  });

  it("shows empty-state message when item has no attributes", async () => {
    getCatalogItemProfileMock.mockResolvedValueOnce({
      ...baseProfile,
      attributes: [],
    });

    render(<CatalogEntityProfilePanel itemId="item-abc" />);

    await waitFor(() => {
      expect(
        screen.getByText("Bu kayıt için attribute kuralı bulunmuyor."),
      ).toBeInTheDocument();
    });
  });

  it("disables inputs and save button while a save is in progress", async () => {
    let resolveSetAttribute: () => void;
    adminSetCatalogItemAttributeMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSetAttribute = resolve;
        }),
    );

    render(<CatalogEntityProfilePanel itemId="item-abc" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Umut Baris Terzioglu")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Attribute Kaydet" })[0]);

    await waitFor(() => {
      expect(screen.getByText("Kaydediliyor...")).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("Umut Baris Terzioglu")).toBeDisabled();

    resolveSetAttribute!();
  });
});
