import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ItemListPanel from "./ItemListPanel";
import type { ItemListEntry } from "./types";

const items: ItemListEntry[] = [
  { id: "a1", kind: "catalog_item", title: "CorteQS Şirketi", platformRoleKey: "isletme", status: "published", claimantEmail: "ali@example.com", adminEmail: null },
  { id: "b2", kind: "profile", title: "Ayşe Yılmaz", platformRoleKey: "bireysel", status: "active", claimantEmail: null, adminEmail: "admin@corteqs.net" },
];

test("renders item list", () => {
  render(<ItemListPanel items={items} selectedItemId={null} onSelectItem={vi.fn()} totalCount={2} />);
  expect(screen.getByText("CorteQS Şirketi")).toBeInTheDocument();
  expect(screen.getByText("Ayşe Yılmaz")).toBeInTheDocument();
});

test("calls onSelectItem when row clicked", () => {
  const onSelect = vi.fn();
  render(<ItemListPanel items={items} selectedItemId={null} onSelectItem={onSelect} totalCount={2} />);
  fireEvent.click(screen.getByText("CorteQS Şirketi"));
  expect(onSelect).toHaveBeenCalledWith("a1");
});
