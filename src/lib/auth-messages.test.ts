import { describe, expect, it } from "vitest";

import {
  EMAIL_NOT_CONFIRMED_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  SIGNUP_ALREADY_REGISTERED_MESSAGE,
  SIGNUP_CONFIRMATION_SENT_MESSAGE,
  SIGNUP_SIGNED_IN_MESSAGE,
  describeSignInError,
  describeSignUpResult,
} from "./auth-messages";

describe("describeSignInError", () => {
  it("doğrulanmamış e-postayı koddan ve eski İngilizce mesajdan tanır", () => {
    expect(describeSignInError({ code: "email_not_confirmed", message: "Email not confirmed" })).toEqual({
      kind: "email_not_confirmed",
      message: EMAIL_NOT_CONFIRMED_MESSAGE,
    });
    expect(describeSignInError({ message: "Email not confirmed" }).kind).toBe("email_not_confirmed");
  });

  it("yanlış şifreyi Türkçe'ye çevirir", () => {
    expect(describeSignInError({ code: "invalid_credentials", message: "Invalid login credentials" })).toEqual({
      kind: "invalid_credentials",
      message: INVALID_CREDENTIALS_MESSAGE,
    });
    expect(describeSignInError({ message: "Invalid login credentials" }).kind).toBe("invalid_credentials");
  });

  it("bilinmeyen hatada Supabase mesajını korur, boşsa genel metin verir", () => {
    expect(describeSignInError({ message: "Network error" })).toEqual({ kind: "other", message: "Network error" });
    expect(describeSignInError(null).message).toBe("Giriş yapılamadı. Lütfen tekrar dene.");
  });
});

describe("describeSignUpResult", () => {
  it("session geldiyse (autoconfirm açık) doğrulama e-postası vaat etmez", () => {
    expect(describeSignUpResult({ user: { identities: [{ id: "x" }] }, session: { access_token: "t" } })).toEqual({
      outcome: "signed_in",
      message: SIGNUP_SIGNED_IN_MESSAGE,
    });
  });

  it("boş identities = zaten kayıtlı adres", () => {
    expect(describeSignUpResult({ user: { identities: [] }, session: null })).toEqual({
      outcome: "already_registered",
      message: SIGNUP_ALREADY_REGISTERED_MESSAGE,
    });
  });

  it("session yoksa doğrulama e-postası yolda", () => {
    expect(describeSignUpResult({ user: { identities: [{ id: "x" }] }, session: null }).outcome).toBe("confirmation_sent");
    expect(describeSignUpResult(undefined).message).toBe(SIGNUP_CONFIRMATION_SENT_MESSAGE);
  });
});
