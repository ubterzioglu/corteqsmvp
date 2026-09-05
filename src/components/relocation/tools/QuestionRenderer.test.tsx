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

  // Takip işi (2026-09-05): drill-down'ın 1. adımı, kullanıcının 4. soruda
  // (`target_countries`) verdiği cevabı okumuyordu — `QuestionStepper` cevapları kendi
  // state'inde tutuyor, renderer yalnız sıradaki sorunun değerini alıyordu. Sonuç:
  // kullanıcı ülkesini İKİNCİ KEZ seçmeden hiçbir şehir göremiyordu.
  describe("target_cities kapsamı 4. sorunun cevabından gelir", () => {
    const cityQuestion = q("target_cities", "text");

    it("ülke seçilmeden kapsam ülkelerinin şehirlerini listeler", async () => {
      const user = userEvent.setup();

      render(
        <QuestionRenderer
          question={cityQuestion}
          value={undefined}
          onChange={vi.fn()}
          scopeCountryCodes={["DE", "NL"]}
        />,
      );

      await user.click(screen.getByRole("combobox", { name: "Şehir seç" }));

      // İki ülkenin şehirleri de tek listede — ikinci bir ülke seçimi gerekmiyor.
      expect(await screen.findByText("Berlin")).toBeInTheDocument();
      expect(screen.getByText("Amsterdam")).toBeInTheDocument();
    });

    it("kapsamı ülke tetiğinde görünür kılar", async () => {
      render(
        <QuestionRenderer
          question={cityQuestion}
          value={undefined}
          onChange={vi.fn()}
          scopeCountryCodes={["DE", "NL"]}
        />,
      );

      expect(
        screen.getByRole("combobox", { name: "Şehir için ülke seç" }),
      ).toHaveTextContent("Seçtiğin ülkeler (2)");
    });

    it("kapsam ülkelerini listenin başına alır ama diğerlerini GİZLEMEZ", async () => {
      const user = userEvent.setup();

      render(
        <QuestionRenderer
          question={cityQuestion}
          value={undefined}
          onChange={vi.fn()}
          scopeCountryCodes={["NL"]}
        />,
      );

      await user.click(screen.getByRole("combobox", { name: "Şehir için ülke seç" }));

      const labels = screen
        .getAllByRole("option")
        .map((option) => option.textContent ?? "");
      // Kapsam başta...
      expect(labels[0]).toContain("Hollanda");
      // ...ama kapsam dışı ülke hâlâ seçilebilir: ülke bir KAPI değil, daraltmadır.
      expect(labels.some((label) => label.includes("Fransa"))).toBe(true);
    });

    it("1. adımda ülke seçilirse kapsamın yerini o ülke alır", async () => {
      const user = userEvent.setup();

      render(
        <QuestionRenderer
          question={cityQuestion}
          value={undefined}
          onChange={vi.fn()}
          scopeCountryCodes={["DE", "NL"]}
        />,
      );

      await user.click(screen.getByRole("combobox", { name: "Şehir için ülke seç" }));
      await user.click(await screen.findByText("Hollanda"));

      await user.click(screen.getByRole("combobox", { name: "Şehir seç" }));
      expect(await screen.findByText("Amsterdam")).toBeInTheDocument();
      expect(screen.queryByText("Berlin")).not.toBeInTheDocument();
    });

    it("kapsam boşsa eski davranış korunur (ülke seçilmeden şehir gelmez)", async () => {
      const user = userEvent.setup();

      render(
        <QuestionRenderer question={cityQuestion} value={undefined} onChange={vi.fn()} />,
      );

      await user.click(screen.getByRole("combobox", { name: "Şehir seç" }));
      expect(
        await screen.findByText("Önce ülke seç ya da şehir adını yazıp elle ekle."),
      ).toBeInTheDocument();
      expect(screen.queryByText("Berlin")).not.toBeInTheDocument();
    });
  });
});
