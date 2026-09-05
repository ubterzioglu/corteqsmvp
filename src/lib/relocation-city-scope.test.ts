import { describe, expect, it } from "vitest";

import {
  TARGET_COUNTRIES_QUESTION_KEY,
  cityScopeFromAnswers,
} from "@/lib/relocation-city-scope";
import type { ToolAnswerValue } from "@/lib/relocation-tools-types";

const answers = (value: ToolAnswerValue | undefined): Record<string, ToolAnswerValue> =>
  value === undefined ? {} : { [TARGET_COUNTRIES_QUESTION_KEY]: value };

describe("cityScopeFromAnswers", () => {
  it("4. sorudaki virgüllü ISO kodlarını okur", () => {
    expect(cityScopeFromAnswers(answers("DE,NL,US"))).toEqual(["DE", "NL", "US"]);
  });

  it("boşluklu yazımı ve dizi biçimini de kabul eder", () => {
    // CountryMultiCombobox "DE,NL" üretir ama seed'in help metni kullanıcıya
    // "ISO ülke kodları, virgülle" diyor — elle "DE, NL" yazılmış eski cevaplar da var.
    expect(cityScopeFromAnswers(answers("DE, NL"))).toEqual(["DE", "NL"]);
    expect(cityScopeFromAnswers(answers(["DE", "nl"]))).toEqual(["DE", "NL"]);
  });

  it("kodları büyük harfe çevirir ve tekrarları eler", () => {
    // Kod TEKNİK bir değerdir (ISO alpha-2) — burada bare toUpperCase doğrudur,
    // Türkçe i/İ kuralı uygulanmaz. Bkz. CLAUDE.md "Türkçe Metin Kuralları" md.1.
    expect(cityScopeFromAnswers(answers("de,DE,nl"))).toEqual(["DE", "NL"]);
  });

  it("cevap yoksa veya boşsa boş kapsam döner (kullanıcı tıkanmaz)", () => {
    // Seed'in help metni: "boş = hepsi". Boş kapsam = daraltma yok, tam ülke listesi.
    expect(cityScopeFromAnswers(answers(undefined))).toEqual([]);
    expect(cityScopeFromAnswers(answers(""))).toEqual([]);
    expect(cityScopeFromAnswers(answers("   "))).toEqual([]);
    expect(cityScopeFromAnswers(answers(","))).toEqual([]);
  });

  it("ISO alpha-2 olmayan çöp değerleri eler", () => {
    // Şehir adı yazılmış eski cevaplar kapsamı bozmasın; "DE" kalır, "Berlin" düşer.
    expect(cityScopeFromAnswers(answers("DE,Berlin,X"))).toEqual(["DE"]);
  });

  it("ölçek/onay gibi kod olmayan cevap tiplerini yok sayar", () => {
    expect(cityScopeFromAnswers(answers(3))).toEqual([]);
    expect(cityScopeFromAnswers(answers(true))).toEqual([]);
  });
});
