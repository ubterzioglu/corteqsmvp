import { describe, expect, it } from "vitest";

import { envConfigOrderPlugin, findEnvConfigOrderProblem } from "./env-config-order.mjs";

const MODULE = '<script type="module" crossorigin src="/assets/main-a.js"></script>';

describe("findEnvConfigOrderProblem", () => {
  it("env-config modüllerden önceyse (defer'li ya da değil) sorun yok", () => {
    expect(findEnvConfigOrderProblem(`<head><script src="/env-config.js" defer></script>${MODULE}</head>`)).toBeNull();
    expect(findEnvConfigOrderProblem(`<head><script src="/env-config.js"></script>${MODULE}</head>`)).toBeNull();
  });

  it("Vite'ın ürettiği düzen: modüller head'de, env-config body'de → YAKALANIR", () => {
    const html = `<head>${MODULE}</head><body><div id="root"></div><script src="/env-config.js" defer></script></body>`;
    expect(findEnvConfigOrderProblem(html)).toMatch(/SONRA/);
  });

  it("async yasak", () => {
    expect(findEnvConfigOrderProblem(`<script async src="/env-config.js"></script>${MODULE}`)).toMatch(/async/);
  });

  it("etiket yoksa yakalanır", () => {
    expect(findEnvConfigOrderProblem(MODULE)).toMatch(/yok/);
  });
});

describe("envConfigOrderPlugin", () => {
  const handler = (html, ctx) => envConfigOrderPlugin().transformIndexHtml.handler(html, ctx);

  it("bozuk sırada build'i düşürür", () => {
    expect(() => handler(`${MODULE}<script src="/env-config.js" defer></script>`, { path: "/index.html" })).toThrow(
      /env-config-order/,
    );
  });

  it("başka HTML girişlerine dokunmaz", () => {
    expect(handler("<html></html>", { path: "/lansman/index.html" })).toBe("<html></html>");
  });
});
