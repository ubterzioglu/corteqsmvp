import { render, screen } from "@testing-library/react";
import EntityCatalogPanel from "./EntityCatalogPanel";
import type { EntityCatalogItem } from "./types";

const items: EntityCatalogItem[] = [
  { kind: "attribute", key: "full_name", label: "Görünen İsim", description: null, data_type: "text", sort_order: 10 },
  { kind: "feature", key: "profile.view_own", label: "Profilimi Görüntüle", description: null, scope_role: "*", sort_order: 20 },
  { kind: "section", key: "contact_card", label: "İletişim Kartı", description: null, section_area: "profile", sort_order: 30 },
];

test("renders all entity kinds with badges", () => {
  render(<EntityCatalogPanel items={items} isLoading={false} />);
  expect(screen.getByText("Görünen İsim")).toBeInTheDocument();
  expect(screen.getByText("Profilimi Görüntüle")).toBeInTheDocument();
  expect(screen.getByText("İletişim Kartı")).toBeInTheDocument();
  expect(screen.getByText("ATR")).toBeInTheDocument();
  expect(screen.getByText("FTR")).toBeInTheDocument();
  expect(screen.getByText("SCT")).toBeInTheDocument();
});
