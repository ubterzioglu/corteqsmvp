import { describe, expect, it } from "vitest";

import { diffFunctionSets, repoFunctionNames } from "./check-functions.mjs";

describe("repoFunctionNames", () => {
  it("shared yardımcı dizinini yayınlanabilir fonksiyon saymaz", () => {
    expect(repoFunctionNames(["_shared", "site-assistant", "whatsapp-webhook"])).toEqual([
      "site-assistant",
      "whatsapp-webhook",
    ]);
  });
});

describe("diffFunctionSets", () => {
  it("iki liste aynıysa temiz sonuç verir", () => {
    expect(diffFunctionSets({ repoNames: ["a", "b"], liveNames: ["b", "a"] })).toEqual({
      repoOnly: [],
      liveOnly: [],
      ok: true,
    });
  });

  it("repo ve canlıdaki iki yönlü ayrışmayı ayrı bildirir", () => {
    expect(diffFunctionSets({ repoNames: ["a", "repo-only"], liveNames: ["a", "live-only"] })).toEqual({
      repoOnly: ["repo-only"],
      liveOnly: ["live-only"],
      ok: false,
    });
  });

  it("tekrarlı isimler yanlış ayrışma üretmez", () => {
    expect(diffFunctionSets({ repoNames: ["a", "a"], liveNames: ["a", "a"] })).toEqual({
      repoOnly: [],
      liveOnly: [],
      ok: true,
    });
  });
});
