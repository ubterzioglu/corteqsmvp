import { beforeEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

import { __resetClientErrorReportsForTests, describeError, reportClientError } from "./client-error-reports";

describe("describeError", () => {
  it("supabase-js düz nesne hatasından code/details/hint okur (instanceof Error'a daraltmaz)", () => {
    expect(
      describeError({ message: "phone_verification_required", code: "P0001", details: "x", hint: null }),
    ).toEqual({ message: "phone_verification_required", code: "P0001", details: "x", hint: null });
  });

  it("Error örneğinde ek alanları da okur", () => {
    const error = Object.assign(new Error("kırıldı"), { code: "42501" });
    expect(describeError(error)).toEqual({ message: "kırıldı", code: "42501", details: null, hint: null });
  });

  it("string, undefined ve mesajsız nesneyi boş bırakmaz", () => {
    expect(describeError("düz metin").message).toBe("düz metin");
    expect(describeError(undefined).message).toBe("Bilinmeyen hata");
    expect(describeError({ status: 500 }).message).toBe('{"status":500}');
    expect(describeError({}).message).toBe("Bilinmeyen hata");
  });
});

describe("reportClientError", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ error: null });
    __resetClientErrorReportsForTests();
  });

  it("RPC'yi payload'sız, yalnız hata alanlarıyla çağırır", () => {
    const sent = reportClientError({
      source: "cadde_write",
      context: "createCaddeComment",
      error: { message: "cadde_rate_limited", code: "P0001", details: "60 saniye", hint: "bekle" },
    });

    expect(sent).toBe(true);
    expect(rpcMock).toHaveBeenCalledTimes(1);
    const [fn, args] = rpcMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(fn).toBe("report_client_error");
    expect(args).toMatchObject({
      p_source: "cadde_write",
      p_context: "createCaddeComment",
      p_message: "cadde_rate_limited",
      p_error_code: "P0001",
      p_details: "60 saniye",
      p_hint: "bekle",
      p_component_stack: null,
      p_extra: null,
    });
    // Rota yalnız pathname — query/hash sızmaz.
    expect(String(args.p_route ?? "")).not.toContain("?");
    expect(Object.keys(args)).not.toContain("p_body");
  });

  it("aynı hatayı 60 sn içinde ikinci kez göndermez, farklı bağlamı gönderir", () => {
    const error = { message: "x", code: "P0001" };
    expect(reportClientError({ source: "cadde_write", context: "a", error })).toBe(true);
    expect(reportClientError({ source: "cadde_write", context: "a", error })).toBe(false);
    expect(reportClientError({ source: "cadde_write", context: "b", error })).toBe(true);
    expect(rpcMock).toHaveBeenCalledTimes(2);
  });

  it("sayfa yaşamı boyunca 20 kaydı aşmaz", () => {
    for (let index = 0; index < 25; index += 1) {
      reportClientError({ source: "render", context: `ctx-${index}`, error: new Error(`e${index}`) });
    }
    expect(rpcMock).toHaveBeenCalledTimes(20);
  });

  it("RPC reddedince ya da hata dönünce fırlatmaz", async () => {
    rpcMock.mockRejectedValueOnce(new Error("ağ yok"));
    expect(() =>
      reportClientError({ source: "cadde_read", context: "listCaddeFeed", error: new Error("boom") }),
    ).not.toThrow();

    rpcMock.mockResolvedValueOnce({ error: { message: "forbidden" } });
    expect(() =>
      reportClientError({ source: "cadde_read", context: "listCaddeFeed2", error: new Error("boom") }),
    ).not.toThrow();

    // Mikro görevlerin tamamlanmasına izin ver — reddedilen promise unhandled olmamalı.
    await Promise.resolve();
    await Promise.resolve();
  });

  it("rpc senkron fırlatsa bile yutar", () => {
    rpcMock.mockImplementationOnce(() => {
      throw new Error("client yok");
    });
    expect(() =>
      reportClientError({ source: "unhandled", context: "window", error: "x" }),
    ).not.toThrow();
  });
});
