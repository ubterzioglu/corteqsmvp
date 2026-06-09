import { render, screen } from "@testing-library/react";
import CaseDetailPanel from "./CaseDetailPanel";
import type { RoleEntityAssignment } from "./types";

const assignment: RoleEntityAssignment = {
  attributeRules: [
    { attributeKey: "full_name", attributeLabel: "Görünen İsim", is_enabled: true, is_required: true, is_public_default: true },
  ],
  featureFlags: [
    { featureKey: "profile.view_own", featureLabel: "Profilimi Görüntüle", is_enabled: true },
  ],
  sectionRules: [
    { sectionKey: "contact_card", sectionLabel: "İletişim Kartı", is_enabled: false },
  ],
};

test("renders item and role info headers", () => {
  render(
    <CaseDetailPanel
      selectedItemTitle="CorteQS Şirketi"
      selectedRoleLabel="İşletme"
      claimantEmail="ali@example.com"
      adminEmail={null}
      assignment={assignment}
      isLoading={false}
    />
  );
  expect(screen.getByText("CorteQS Şirketi")).toBeInTheDocument();
  expect(screen.getByText("İşletme")).toBeInTheDocument();
  expect(screen.getByText("ali@example.com")).toBeInTheDocument();
});

test("renders assignment tables", () => {
  render(
    <CaseDetailPanel
      selectedItemTitle="Item"
      selectedRoleLabel="Rol"
      claimantEmail={null}
      adminEmail="admin@corteqs.net"
      assignment={assignment}
      isLoading={false}
    />
  );
  expect(screen.getByText("Görünen İsim")).toBeInTheDocument();
  expect(screen.getByText("Profilimi Görüntüle")).toBeInTheDocument();
  expect(screen.getByText("İletişim Kartı")).toBeInTheDocument();
});

test("external mode hides claim/admin and role, keeps item and AFS", () => {
  render(
    <CaseDetailPanel
      mode="external"
      selectedItemTitle="CorteQS Şirketi"
      selectedRoleLabel="İşletme"
      claimantEmail="ali@example.com"
      adminEmail="admin@corteqs.net"
      assignment={assignment}
      isLoading={false}
    />
  );
  expect(screen.getByText("Profile dışarıdan bakıldığında")).toBeInTheDocument();
  // Claim sahibi / admin e-postaları dışarıdan görünümde gizlenir.
  expect(screen.queryByText("ali@example.com")).not.toBeInTheDocument();
  expect(screen.queryByText("admin@corteqs.net")).not.toBeInTheDocument();
  // Rol kutusu gizli; item ve AFS görünür.
  expect(screen.getByText("CorteQS Şirketi")).toBeInTheDocument();
  expect(screen.getByText("Görünen İsim")).toBeInTheDocument();
  expect(screen.getByText("Profilimi Görüntüle")).toBeInTheDocument();
});

test("login mode is the default and shows claim email", () => {
  render(
    <CaseDetailPanel
      selectedItemTitle="CorteQS Şirketi"
      selectedRoleLabel="İşletme"
      claimantEmail="ali@example.com"
      adminEmail={null}
      assignment={assignment}
      isLoading={false}
    />
  );
  expect(screen.getByText("Profil login olduğunda")).toBeInTheDocument();
  expect(screen.getByText("ali@example.com")).toBeInTheDocument();
});

test("shows placeholder when no selection", () => {
  render(
    <CaseDetailPanel
      selectedItemTitle={null}
      selectedRoleLabel={null}
      claimantEmail={null}
      adminEmail={null}
      assignment={null}
      isLoading={false}
    />
  );
  expect(screen.getByText(/Yukarıdan/i)).toBeInTheDocument();
});
