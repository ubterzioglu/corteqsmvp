import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import RoleListPanel from "./RoleListPanel";
import type { RoleListItem } from "./types";

const roles: RoleListItem[] = [
  { id: "1", key: "bireysel", label: "Bireysel", is_active: true, sort_order: 10 },
  { id: "2", key: "danisman", label: "Danışman", is_active: true, sort_order: 20 },
];

test("renders role list", () => {
  render(<RoleListPanel roles={roles} selectedRoleKey={null} onSelectRole={vi.fn()} />);
  expect(screen.getByText("Bireysel")).toBeInTheDocument();
  expect(screen.getByText("Danışman")).toBeInTheDocument();
});

test("calls onSelectRole when row clicked", () => {
  const onSelect = vi.fn();
  render(<RoleListPanel roles={roles} selectedRoleKey={null} onSelectRole={onSelect} />);
  fireEvent.click(screen.getByText("Bireysel"));
  expect(onSelect).toHaveBeenCalledWith("bireysel");
});

test("highlights selected role", () => {
  render(<RoleListPanel roles={roles} selectedRoleKey="bireysel" onSelectRole={vi.fn()} />);
  const row = screen.getByText("Bireysel").closest("tr");
  expect(row?.className).toMatch(/bg-/);
});
