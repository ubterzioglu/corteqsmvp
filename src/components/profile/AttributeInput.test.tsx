import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ProfileAttributeState } from "@/lib/member-profile";
import { EDUCATION_LEVEL_OPTIONS } from "@/lib/profile-education";

import { AttributeInput } from "./AttributeInput";

const makeAttribute = (overrides: Partial<ProfileAttributeState>): ProfileAttributeState => ({
  attributeKey: "education_level",
  label: "Öğrenim durumu",
  description: null,
  dataType: "select",
  isSystem: false,
  sortOrder: 55,
  isRequired: false,
  isPublicDefault: false,
  userCanEdit: true,
  userCanHide: true,
  requiresAdminApprovalOnChange: false,
  visibility: "private",
  approvalStatus: "approved",
  valueText: null,
  valueJson: null,
  displayValue: null,
  ...overrides,
});

describe("AttributeInput", () => {
  it("öğrenim durumu select'ini TS tek kaynağındaki Türkçe seçeneklerle çizer ve slug değeri yazar", async () => {
    const onChange = vi.fn();
    render(<AttributeInput attribute={makeAttribute({})} value="" onChange={onChange} />);

    fireEvent.click(screen.getByRole("combobox", { name: "Öğrenim durumu" }));
    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(EDUCATION_LEVEL_OPTIONS.map((option) => option.label));

    fireEvent.click(screen.getByRole("option", { name: "Yüksek lisans" }));
    expect(onChange).toHaveBeenCalledWith("yuksek_lisans");
  });

  it("kayıtlı değerin Türkçe etiketini gösterir", () => {
    render(<AttributeInput attribute={makeAttribute({})} value="on_lisans" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Öğrenim durumu" })).toHaveTextContent("Ön lisans");
  });

  it("seçeneği tanımsız select alanı serbest metin olarak kalır", () => {
    render(
      <AttributeInput
        attribute={makeAttribute({ attributeKey: "some_select", label: "Başka Seçim" })}
        value="x"
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("x")).toBeInTheDocument();
  });

  it("son okul alanı 200 karakterle sınırlıdır", () => {
    render(
      <AttributeInput
        attribute={makeAttribute({ attributeKey: "education_last_school", label: "Son bitirdiği üniversite/okul", dataType: "text" })}
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByPlaceholderText("Son bitirdiği üniversite/okul")).toHaveAttribute("maxLength", "200");
  });
});
