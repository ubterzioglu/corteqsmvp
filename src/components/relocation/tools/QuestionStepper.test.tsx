import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QuestionStepper } from "@/components/relocation/tools/QuestionStepper";
import type { RelocationToolQuestionRow } from "@/lib/relocation-tools-types";

// Test soru fabrikası — yalnız stepper'ın kullandığı alanları doldurur.
function q(
  key: string,
  answer_type: RelocationToolQuestionRow["answer_type"],
  sort_order: number,
  extra: Partial<RelocationToolQuestionRow> = {},
): RelocationToolQuestionRow {
  return {
    id: `id-${key}`,
    tool_key: "test_tool",
    question_key: key,
    mode: "both",
    section_key: "s",
    prompt_tr: `Soru ${key}`,
    help_tr: null,
    answer_type,
    options:
      answer_type === "single"
        ? [
            { value: "a", label: "Seçenek A" },
            { value: "b", label: "Seçenek B" },
          ]
        : [],
    validation: {},
    scoring: {},
    sort_order,
    is_required: true,
    is_active: true,
    ...extra,
  };
}

describe("QuestionStepper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("single şık seçilince ~250ms sonra otomatik ilerler (son soru değilse)", () => {
    const onComplete = vi.fn();
    render(
      <QuestionStepper
        questions={[q("q1", "single", 1), q("q2", "scale", 2)]}
        onComplete={onComplete}
      />,
    );

    // 1. soru görünür.
    expect(screen.getByText("Soru q1")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    // İlk şıkkı seç.
    fireEvent.click(screen.getByText("Seçenek A"));

    // Henüz ilerlemedi (gecikme dolmadı).
    expect(screen.getByText("Soru q1")).toBeInTheDocument();

    // Gecikme dolunca otomatik 2. soruya geçer.
    act(() => {
      vi.advanceTimersByTime(260);
    });
    expect(screen.getByText("Soru q2")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("SON single soruda otomatik ilerlemez / submit etmez", () => {
    const onComplete = vi.fn();
    render(
      <QuestionStepper
        questions={[q("only", "single", 1)]}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByText("Seçenek A"));
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Tek/son soru: otomatik submit YOK; kullanıcı butona basmalı.
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText("Soru only")).toBeInTheDocument();
  });

  it("scale gibi single olmayan sorularda otomatik ilerlemez", () => {
    render(
      <QuestionStepper
        questions={[q("q1", "scale", 1), q("q2", "scale", 2)]}
        onComplete={vi.fn()}
      />,
    );

    // Slider'ı oynatmak yerine: scale tipinde auto-advance hiç tetiklenmez.
    // Sadece zamanı ilerletip 1. soruda kaldığımızı doğrularız.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText("Soru q1")).toBeInTheDocument();
  });

  it("back, bekleyen otomatik ilerlemeyi iptal eder", () => {
    render(
      <QuestionStepper
        questions={[q("q1", "single", 1), q("q2", "single", 2), q("q3", "scale", 3)]}
        onComplete={vi.fn()}
      />,
    );

    // q1 → seç → otomatik q2.
    fireEvent.click(screen.getByText("Seçenek A"));
    act(() => {
      vi.advanceTimersByTime(260);
    });
    expect(screen.getByText("Soru q2")).toBeInTheDocument();

    // q2'de bir şık seç (otomatik ilerleme zamanlayıcısı kurulur)...
    fireEvent.click(screen.getByText("Seçenek B"));
    // ...ama gecikme dolmadan Geri'ye bas.
    fireEvent.click(screen.getByText(/geri/i));
    expect(screen.getByText("Soru q1")).toBeInTheDocument();

    // Bekleyen zamanlayıcı iptal edildi: zaman ilerlese de q1'de kalır (q2/q3'e atlamaz).
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText("Soru q1")).toBeInTheDocument();
  });

  it("is_required=false soruda bile cevapsız İleri ilerletmez ve uyarı gösterir", () => {
    const onComplete = vi.fn();
    render(
      <QuestionStepper
        questions={[
          q("q1", "multi", 1, {
            is_required: false,
            options: [
              { value: "a", label: "Seçenek A" },
              { value: "b", label: "Seçenek B" },
            ],
          }),
          q("q2", "single", 2),
        ]}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByText("İleri"));

    // Aynı soruda kalır, zorunluluk uyarısı görünür.
    expect(screen.getByText("Soru q1")).toBeInTheDocument();
    expect(screen.getByText("Bu soru zorunlu")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    // Cevap verilince İleri çalışır.
    fireEvent.click(screen.getByText("Seçenek A"));
    fireEvent.click(screen.getByText("İleri"));
    expect(screen.getByText("Soru q2")).toBeInTheDocument();
  });

  it("scale sorusunda dokunulmadan İleri ilerler ve görünen varsayılan (3) kaydedilir", () => {
    const onComplete = vi.fn();
    render(
      <QuestionStepper questions={[q("only", "scale", 1)]} onComplete={onComplete} />,
    );

    // Ortadaki şık ön-seçili görünür...
    expect(screen.getAllByRole("radio")[2]).toHaveAttribute("aria-checked", "true");

    // ...ve hiç dokunulmadan bitirilse bile görünen değer cevap olarak gider.
    fireEvent.click(screen.getByText("Sonucu Gör"));
    expect(onComplete).toHaveBeenCalledWith({ only: 3 });
    expect(screen.queryByText("Bu soru zorunlu")).not.toBeInTheDocument();
  });

  it("ön-seçili 3'e tıklayıp İleri denince ilerler (önce 4 sonra 3 seçmek gerekmez)", () => {
    const onComplete = vi.fn();
    render(
      <QuestionStepper questions={[q("only", "scale", 1)]} onComplete={onComplete} />,
    );

    // Radix, zaten seçili şıkka tıklandığında onValueChange tetiklemez; buna rağmen
    // görünen değer cevap sayıldığı için kullanıcı takılmamalı.
    fireEvent.click(screen.getByText("3"));
    fireEvent.click(screen.getByText("Sonucu Gör"));

    expect(onComplete).toHaveBeenCalledWith({ only: 3 });
  });

  it("scale sorusunda başka bir şık seçilirse varsayılan yerine o değer kaydedilir", () => {
    const onComplete = vi.fn();
    render(
      <QuestionStepper questions={[q("only", "scale", 1)]} onComplete={onComplete} />,
    );

    fireEvent.click(screen.getByText("5 — Yüksek"));
    fireEvent.click(screen.getByText("Sonucu Gör"));

    expect(onComplete).toHaveBeenCalledWith({ only: 5 });
  });

  it("son soruda cevapsız Bitir onComplete'i çağırmaz", () => {
    const onComplete = vi.fn();
    render(
      <QuestionStepper
        questions={[q("only", "single", 1, { is_required: false })]}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByText("Sonucu Gör"));
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText("Bu soru zorunlu")).toBeInTheDocument();
  });

  it("soru içerik kabı sabit min-yükseklik taşır (CLS guard)", () => {
    const { container } = render(
      <QuestionStepper
        questions={[q("q1", "single", 1), q("q2", "scale", 2)]}
        onComplete={vi.fn()}
      />,
    );

    const hasMinHeight = Array.from(container.querySelectorAll("div")).some(
      (el) => el.className.includes("min-h-[300px]") || el.className.includes("min-h-[340px]"),
    );
    expect(hasMinHeight).toBe(true);
  });

  it("kayıtlı cevaplarla ilk eksik sorudan devam eder", () => {
    render(
      <QuestionStepper
        questions={[q("q1", "single", 1), q("q2", "single", 2), q("q3", "scale", 3)]}
        initialAnswers={{ q1: "a", q2: "b" }}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByText("Soru q3")).toBeInTheDocument();
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("her gerçek cevap değişikliğini incremental kayıt callback'ine yollar", () => {
    const onAnswerChange = vi.fn();
    render(
      <QuestionStepper
        questions={[q("q1", "single", 1)]}
        onAnswerChange={onAnswerChange}
        onComplete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Seçenek B"));

    expect(onAnswerChange).toHaveBeenCalledWith("q1", "b");
  });
});
