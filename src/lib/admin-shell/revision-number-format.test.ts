// Revizyon numarası biçiminin AYNA sözleşmesi.
//
// Biçim iki yerde tanımlıdır ve bu bilinçlidir: Edge Function deploy'u yalnız
// `supabase/functions/` klasörünü yükler, oradan `src/` içine import edilemez.
// Bu test ikisini birbirine kilitler — biri değişirse test patlar.
//
// Kaynaklar:
//   · src/lib/admin-shell/revision-requests.ts                    (arayüz rozeti)
//   · supabase/functions/_shared/emails/revision-request-completed.ts (mail)

import { describe, expect, it } from "vitest";

import { formatRevisionNumber as istemciBicimi } from "./revision-requests";
import { formatRevisionNumber as mailBicimi } from "../../../supabase/functions/_shared/emails/revision-request-completed.ts";

const ORNEKLER: Array<[unknown, string]> = [
  [1, "#REV-001"],
  [42, "#REV-042"],
  [999, "#REV-999"],
  [1234, "#REV-1234"],
  // Numarasız satır: rozet/başlık hiç çizilmemeli.
  [null, ""],
  [undefined, ""],
  [0, ""],
  [-5, ""],
];

describe("revizyon numarası biçimi — istemci ile mail aynı olmalı", () => {
  it.each(ORNEKLER)("%s → %s (istemci)", (girdi, beklenen) => {
    expect(istemciBicimi(girdi as number | null)).toBe(beklenen);
  });

  it.each(ORNEKLER)("%s → %s (mail)", (girdi, beklenen) => {
    expect(mailBicimi(girdi)).toBe(beklenen);
  });

  it("iki uygulama aynı girdide aynı çıktıyı verir", () => {
    for (const [girdi] of ORNEKLER) {
      expect(mailBicimi(girdi)).toBe(istemciBicimi(girdi as number | null));
    }
  });
});
