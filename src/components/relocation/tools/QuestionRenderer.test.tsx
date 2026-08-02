import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuestionRenderer } from "@/components/relocation/tools/QuestionRenderer";
import type { RelocationToolQuestionRow, ToolAnswerValue } from "@/lib/relocation-tools-types";

vi.mock("@/hooks/useGeo", () => ({
  useGeoCountries: () => ({
    data: [
      { code: "DE", name: "Almanya" },
      { code: "NL", name: "Hollanda" },
      { code: "US", name: "ABD" },
      { code: "CA", name: "Kanada" },
      { code: "GB", name: "İngiltere" },
      { code: "FR", name: "Fransa" },
    ],
    isLoading: false,
  }),
}));

function q(
  key: string,
  answer_type: RelocationToolQuestionRow["answer_type"],
  extra: Partial<RelocationToolQuestionRow> = {},
): RelocationToolQuestionRow {
  return {
    id: `id-${key}`,
    tool_key: "profession_salary",
    question_key: key,
    mode: "both",
    section_key: "s",
    prompt_tr: `Soru ${key}`,
    help_tr: null,
    answer_type,
    options: [],
    validation: {},
    scoring: {},
    sort_order: 1,
    is_required: true,
    is_active: true,
    ...extra,
  };
}

describe("QuestionRenderer", () => {
  it("profession_title sorusunu aranabilir dropdown olarak seçtirir", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <QuestionRenderer
        question={q("profession_title", "single", {
          options: [
            { value: "software_engineer", label: "Yazılım Mühendisi" },
            { value: "registered_nurse", label: "Hemşire" },
          ],
        })}
        value={undefined}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /meslek seç/i }));
    await user.type(screen.getByPlaceholderText("Meslek ara..."), "hem");
    await user.click(screen.getByText("Hemşire"));

    expect(onChange).toHaveBeenCalledWith("registered_nurse");
  });

  it("country sorusunda en fazla 5 ülke seçer ve ISO kodlarını virgülle üretir", async () => {
    const user = userEvent.setup();
    let value: ToolAnswerValue | undefined = "";
    const onChange = vi.fn((next: ToolAnswerValue) => {
      value = next;
    });
    const question = q("target_countries", "country");
    const { rerender } = render(
      <QuestionRenderer question={question} value={value} onChange={onChange} />,
    );

    for (const country of ["Almanya", "Hollanda", "ABD", "Kanada", "İngiltere"]) {
      await user.click(screen.getByRole("combobox", { name: /ülke seç/i }));
      await user.click(await screen.findByText(country));
      rerender(<QuestionRenderer question={question} value={value} onChange={onChange} />);
    }

    await user.click(screen.getByRole("combobox", { name: /ülke seç/i }));
    expect(screen.getByText("En fazla 5 ülke seçebilirsin.")).toBeInTheDocument();
    expect(screen.getByText("Fransa").closest("[cmdk-item]")).toHaveAttribute("aria-disabled", "true");
    expect(onChange).toHaveBeenLastCalledWith("DE,NL,US,CA,GB");
  });

  it("target_cities sorusunda şehir fark etmez hızlı cevabını yazar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <QuestionRenderer
        question={q("target_cities", "text", {
          help_tr: "Şehir adlarını virgülle ayır.",
        })}
        value={undefined}
        onChange={onChange}
      />,
    );

    expect(screen.getByPlaceholderText("Örn: Berlin, Amsterdam veya Şehir fark etmez")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Şehir fark etmez" }));
    expect(onChange).toHaveBeenCalledWith("Şehir fark etmez");
  });
});
