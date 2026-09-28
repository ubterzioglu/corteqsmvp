import { describe, expect, it } from "vitest";

import { type AdminAuthClient, resolveAdminOrSecretCaller, secretsMatch } from "./edge-authorization.ts";

const SECRET = "dispatch-secret-degeri";

/** Yalnız istenen davranışı taklit eden sahte istemci — supabase-js'e ihtiyaç yok. */
function fakeAdmin(options: {
  user?: { id: string } | null;
  userError?: unknown;
  isAdmin?: unknown;
  adminError?: unknown;
}): AdminAuthClient {
  return {
    auth: {
      getUser: async () => ({
        data: { user: options.user ?? null },
        error: options.userError ?? null,
      }),
    },
    rpc: async () => ({ data: options.isAdmin ?? null, error: options.adminError ?? null }),
  };
}

const requestWith = (headers: Record<string, string>) =>
  new Request("https://functions.example", { method: "POST", headers });

describe("secretsMatch", () => {
  it("yalnız birebir aynı değerde doğrudur", () => {
    expect(secretsMatch(SECRET, SECRET)).toBe(true);
    expect(secretsMatch(SECRET + "x", SECRET)).toBe(false);
    expect(secretsMatch("baska", SECRET)).toBe(false);
  });

  it("eksik değerlerde ASLA doğru dönmez", () => {
    // ⚠️ Secret ortamda tanımlı değilse (undefined) boş/rastgele başlık geçmemelidir —
    // aksi halde secret'ı unutmak kapıyı ardına kadar açardı.
    expect(secretsMatch(null, SECRET)).toBe(false);
    expect(secretsMatch(SECRET, undefined)).toBe(false);
    expect(secretsMatch(null, undefined)).toBe(false);
    expect(secretsMatch("", "")).toBe(false);
  });
});

describe("resolveAdminOrSecretCaller", () => {
  it("doğru dispatch secret'ı makine çağrısı olarak kabul eder", async () => {
    const caller = await resolveAdminOrSecretCaller(
      requestWith({ "x-dispatch-secret": SECRET }),
      fakeAdmin({}),
      SECRET,
    );
    expect(caller).toEqual({ authorized: true, adminUserId: null });
  });

  it("yanlış secret'ı ve JWT'siz çağrıyı reddeder", async () => {
    expect(
      await resolveAdminOrSecretCaller(requestWith({ "x-dispatch-secret": "yanlis" }), fakeAdmin({}), SECRET),
    ).toEqual({ authorized: false, adminUserId: null });

    expect(await resolveAdminOrSecretCaller(requestWith({}), fakeAdmin({}), SECRET)).toEqual({
      authorized: false,
      adminUserId: null,
    });
  });

  it("admin JWT'sini kabul eder ve kullanıcı kimliğini döndürür", async () => {
    const caller = await resolveAdminOrSecretCaller(
      requestWith({ Authorization: "Bearer jeton" }),
      fakeAdmin({ user: { id: "kullanici-1" }, isAdmin: true }),
      SECRET,
    );
    expect(caller).toEqual({ authorized: true, adminUserId: "kullanici-1" });
  });

  it("admin OLMAYAN geçerli kullanıcıyı reddeder", async () => {
    // ⚠️ Asıl açık buydu: geçerli bir oturum (hatta yalnız anon anahtarı) tek başına
    // yetki DEĞİLDİR. `is_admin` false ise kapı kapalı kalmalıdır.
    expect(
      await resolveAdminOrSecretCaller(
        requestWith({ Authorization: "Bearer jeton" }),
        fakeAdmin({ user: { id: "kullanici-1" }, isAdmin: false }),
        SECRET,
      ),
    ).toEqual({ authorized: false, adminUserId: null });
  });

  it("`is_admin` HATA verirse reddeder (hatayı yetki saymaz)", async () => {
    expect(
      await resolveAdminOrSecretCaller(
        requestWith({ Authorization: "Bearer jeton" }),
        fakeAdmin({ user: { id: "kullanici-1" }, adminError: new Error("rpc dustu") }),
        SECRET,
      ),
    ).toEqual({ authorized: false, adminUserId: null });
  });

  it("geçersiz jetonu ve `Bearer` öneki olmayan başlığı reddeder", async () => {
    expect(
      await resolveAdminOrSecretCaller(
        requestWith({ Authorization: "Bearer jeton" }),
        fakeAdmin({ userError: new Error("gecersiz jeton") }),
        SECRET,
      ),
    ).toEqual({ authorized: false, adminUserId: null });

    expect(
      await resolveAdminOrSecretCaller(
        requestWith({ Authorization: "jeton" }),
        fakeAdmin({ user: { id: "kullanici-1" }, isAdmin: true }),
        SECRET,
      ),
    ).toEqual({ authorized: false, adminUserId: null });
  });

  it("ortamda secret YOKKEN başlıkla geçilemez", async () => {
    expect(
      await resolveAdminOrSecretCaller(requestWith({ "x-dispatch-secret": "" }), fakeAdmin({}), undefined),
    ).toEqual({ authorized: false, adminUserId: null });
  });
});
