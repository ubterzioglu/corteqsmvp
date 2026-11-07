import { describe, expect, it } from "vitest";

import { extractZodRequest } from "./extract.mjs";

const NL = String.fromCharCode(10);

describe("extractZodRequest", () => {
  it("bitişik `z.object(` biçimini okur", () => {
    const src =
      "const RequestSchema = z.object({" +
      NL +
      "  query: z.string()," +
      NL +
      "  limit: z.number()," +
      NL +
      "}).strict();";
    expect(extractZodRequest(src)).toEqual({ present: true, fields: ["query", "limit"] });
  });

  it("Prettier'ın böldüğü `z` + satır sonu + `.object(` biçimini de okur (2026-11-07 gerilemesi)", () => {
    const src = [
      "const RequestSchema = z",
      "  .object({",
      "    query: z.string(),",
      "    city: z.string().optional(),",
      "  })",
      "  .strict();",
    ].join(NL);
    expect(extractZodRequest(src)).toEqual({ present: true, fields: ["query", "city"] });
  });

  it("RequestSchema yoksa yalnız zod varlığını bildirir", () => {
    expect(extractZodRequest("const Other = z" + NL + "  .object({ a: z.string() });")).toEqual({
      present: true,
      fields: [],
    });
    expect(extractZodRequest("export default 1;")).toEqual({ present: false, fields: [] });
  });
});
