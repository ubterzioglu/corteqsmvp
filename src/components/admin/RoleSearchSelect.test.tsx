import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoleSearchSelect from "@/components/admin/RoleSearchSelect";

// cmdk uses scrollIntoView internally; jsdom does not implement it
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const roles = [
  { key: "User_Standard", label: "Standart Kullanıcı" },
  { key: "Consultant_RealEstate", label: "Gayrimenkul Danışmanı" },
  { key: "Business_RestaurantCafe", label: "Restoran / Cafe" },
  { key: "Healthcare_Doctor", label: "Doktor" },
];

describe("RoleSearchSelect", () => {
  it("renders placeholder when no value selected", () => {
    render(<RoleSearchSelect roles={roles} value="" onValueChange={vi.fn()} />);
    expect(screen.getByText("Rol seç...")).toBeInTheDocument();
  });

  it("renders selected role label", () => {
    render(
      <RoleSearchSelect
        roles={roles}
        value="Consultant_RealEstate"
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Gayrimenkul Danışmanı")).toBeInTheDocument();
  });

  it("renders a combobox button", () => {
    render(<RoleSearchSelect roles={roles} value="" onValueChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("opens popover with search input on click", () => {
    render(<RoleSearchSelect roles={roles} value="" onValueChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByPlaceholderText("Rol ara...")).toBeInTheDocument();
  });

  it("shows all roles after opening", () => {
    render(<RoleSearchSelect roles={roles} value="" onValueChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Standart Kullanıcı")).toBeInTheDocument();
    expect(screen.getByText("Gayrimenkul Danışmanı")).toBeInTheDocument();
  });

  it("calls onValueChange when a role is selected", () => {
    const onValueChange = vi.fn();
    render(<RoleSearchSelect roles={roles} value="" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Standart Kullanıcı"));
    expect(onValueChange).toHaveBeenCalledWith("User_Standard");
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <RoleSearchSelect roles={roles} value="" onValueChange={vi.fn()} disabled />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("renders custom placeholder", () => {
    render(
      <RoleSearchSelect
        roles={roles}
        value=""
        onValueChange={vi.fn()}
        placeholder="Bir rol seçiniz..."
      />,
    );
    expect(screen.getByText("Bir rol seçiniz...")).toBeInTheDocument();
  });
});
