import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuestionRenderer } from "@/components/relocation/tools/QuestionRenderer";
import type { RelocationToolQuestionRow, ToolAnswerValue } from "@/lib/relocation-tools-types";

// geo_cities canlıda 76.990 satır; kanca ülkeye göre daraltır, mock da öyle davranır.
// Ülke seçilmeden çağrılırsa boş liste döner (kanca enabled=false).
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  DE: ["Berlin", "Hamburg", "München"],
  NL: ["Amsterdam", "Rotterdam"],
};

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
  useGeoCitiesForCountries: (codes: string[]) => ({
    data: codes.flatMap((code) =>
      (CITIES_BY_COUNTRY[code] ?? []).map((name) => ({
        countryCode: code,
        countryName: code,
        name,
      })),
    ),
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

  it("country sorusunda en fazla 3 ülke seçer ve ISO kodlarını virgülle üretir", async () => {
    const user = userEvent.setup();
    let value: ToolAnswerValue | undefined = "";
    const onChange = vi.fn((next: ToolAnswerValue) => {
      value = next;
    });
    const question = q("target_countries", "country");
    const { rerender } = render(
      <QuestionRenderer question={question} value={value} onChange={onChange} />,
    );

    for (const country of ["Almanya", "Hollanda", "ABD"]) {
      await user.click(screen.getByRole("combobox", { name: /ülke seç/i }));
      await user.click(await screen.findByText(country));
      rerender(<QuestionRenderer question={question} value={value} onChange={onChange} />);
    }

    await user.click(screen.getByRole("combobox", { name: /ülke seç/i }));
    expect(screen.getByText("En fazla 3 ülke seçebilirsin.")).toBeInTheDocument();
    expect(screen.getByText("Fransa").closest("[cmdk-item]")).toHaveAttribute("aria-disabled", "true");
    expect(onChange).toHaveBeenLastCalledWith("DE,NL,US");
  });

  // Revizyon 2b1c1960: target_cities eskiden düz <Input type="text"> idi ve testi
  // "Örn: Berlin, Amsterdam veya Şehir fark etmez" placeholder'ını kilitliyordu.
  // O placeholder testi YANLIŞ davranışı (elle yazım zorunluluğunu) kilitliyordu;
  // aşağıdaki testler doğru davranışı — ülke→şehir drill-down'unu — kilitler.
  describe("target_cities drill-down", () => {
    const cityQuestion = q("target_cities", "text", {
      help_tr: "Şehir adlarını virgülle ayır.",
    });

    it("şehir listesini seçilen ülkeye daraltır", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<QuestionRenderer question={cityQuestion} value={undefined} onChange={onChange} />);

      await user.click(screen.getByRole("combobox", { name: "Şehir için ülke seç" }));
      await user.click(await screen.findByText("Almanya"));

      await user.click(screen.getByRole("combobox", { name: "Şehir seç" }));
      expect(await screen.findByText("Berlin")).toBeInTheDocument();
      expect(screen.queryByText("Amsterdam")).not.toBeInTheDocument();

      await user.click(screen.getByText("Berlin"));
      expect(onChange).toHaveBeenCalledWith("Berlin");
    });

    it("birden fazla şehri virgülle biriktirir ve kaldırabilir", async () => {
      const user = userEvent.setup();
      let value: ToolAnswerValue | undefined = "";
      const onChange = vi.fn((next: ToolAnswerValue) => {
        value = next;
      });
      const { rerender } = render(
        <QuestionRenderer question={cityQuestion} value={value} onChange={onChange} />,
      );

      await user.click(screen.getByRole("combobox", { name: "Şehir için ülke seç" }));
      await user.click(await screen.findByText("Almanya"));

      // Çoklu seçimde liste açık kalır — her şehir için yeniden açmak gerekmez.
      await user.click(screen.getByRole("combobox", { name: "Şehir seç" }));
      for (const city of ["Berlin", "Hamburg"]) {
        await user.click(await screen.findByText(city));
        rerender(<QuestionRenderer question={cityQuestion} value={value} onChange={onChange} />);
      }

      expect(onChange).toHaveBeenLastCalledWith("Berlin, Hamburg");

      await user.keyboard("{Escape}");
      await user.click(screen.getByRole("button", { name: "Berlin kaldır" }));
      expect(onChange).toHaveBeenLastCalledWith("Hamburg");
    });

    it("katalogda olmayan şehri serbest metin olarak ekletir (kullanıcı tıkanmaz)", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<QuestionRenderer question={cityQuestion} value={undefined} onChange={onChange} />);

      // Ülke hiç seçilmedi: liste boş ama serbest metin çıkışı yine de açık olmalı.
      await user.click(screen.getByRole("combobox", { name: "Şehir seç" }));
      await user.type(await screen.findByPlaceholderText("Şehir ara veya yaz..."), "Böblingen");
      await user.click(screen.getByText('"Böblingen" şehrini elle ekle'));

      expect(onChange).toHaveBeenCalledWith("Böblingen");
    });

    it("şehir fark etmez hızlı cevabını yazar ve tekrar basınca temizler", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      const { rerender } = render(
        <QuestionRenderer question={cityQuestion} value={undefined} onChange={onChange} />,
      );

      await user.click(screen.getByRole("button", { name: "Şehir fark etmez" }));
      expect(onChange).toHaveBeenCalledWith("Şehir fark etmez");

      rerender(
        <QuestionRenderer question={cityQuestion} value="Şehir fark etmez" onChange={onChange} />,
      );
      await user.click(screen.getByRole("button", { name: "Şehir fark etmez" }));
      expect(onChange).toHaveBeenLastCalledWith("");
    });
  });
});
