// Giriş/kayıt sonuçlarını Türkçe kullanıcı mesajına çevirir — Profil Workshop WS1
// madde 7 (T19): Supabase e-posta doğrulaması açıldığında /login bunu anlatabilmeli.
//
// Bugünkü canlı yapılandırma (ölçüm 2026-09-04): mailer_autoconfirm = true, yani kayıt
// olan kullanıcı ANINDA oturum alır ve doğrulama e-postası hiç gitmez. Eski metin
// ("Doğrulama bağlantısını gönderdik") bu durumda yanlıştı. Aşağıdaki çözümleme iki
// yapılandırmada da doğru mesajı üretir; anahtar Supabase panelinde çevrildiğinde
// kodda değişiklik gerekmez (runbook: docs/operations/2026-09-04-auth-dogrulama-yol-haritasi.md).
//
// supabase-js AuthError'ı `code` taşır (email_not_confirmed, invalid_credentials …);
// eski sürümler yalnız İngilizce `message` döner — ikisi de eşleştirilir.

export type SignInErrorKind = "email_not_confirmed" | "invalid_credentials" | "other";

export interface SignInErrorInfo {
  kind: SignInErrorKind;
  message: string;
}

export interface AuthErrorLike {
  code?: string | null;
  message?: string | null;
  status?: number | null;
}

export const EMAIL_NOT_CONFIRMED_MESSAGE =
  "E-posta adresin henüz doğrulanmamış. Gelen kutundaki (ve spam klasöründeki) doğrulama bağlantısına tıkla; e-posta gelmediyse aşağıdan yeniden gönderebilirsin.";

export const INVALID_CREDENTIALS_MESSAGE = "E-posta veya şifre hatalı.";

export function describeSignInError(error: AuthErrorLike | null | undefined): SignInErrorInfo {
  const code = (error?.code ?? "").trim();
  const message = (error?.message ?? "").trim();

  if (code === "email_not_confirmed" || /email not confirmed/i.test(message)) {
    return { kind: "email_not_confirmed", message: EMAIL_NOT_CONFIRMED_MESSAGE };
  }
  if (code === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return { kind: "invalid_credentials", message: INVALID_CREDENTIALS_MESSAGE };
  }
  return { kind: "other", message: message || "Giriş yapılamadı. Lütfen tekrar dene." };
}

export type SignUpOutcome = "signed_in" | "confirmation_sent" | "already_registered";

export interface SignUpOutcomeInfo {
  outcome: SignUpOutcome;
  message: string;
}

export interface SignUpDataLike {
  user?: { identities?: unknown[] | null } | null;
  session?: unknown;
}

export const SIGNUP_CONFIRMATION_SENT_MESSAGE =
  "Doğrulama bağlantısını e-posta adresine gönderdik. E-postanı onayladıktan sonra aynı hesapla giriş yapabilirsin.";

export const SIGNUP_SIGNED_IN_MESSAGE = "Hesabın oluşturuldu ve giriş yapıldı.";

export const SIGNUP_ALREADY_REGISTERED_MESSAGE =
  "Bu e-posta zaten kayıtlı. Giriş yap ya da şifreni sıfırla.";

/**
 * signUp() sonucunu yorumlar:
 *  - session geldi → autoconfirm açık (ya da doğrulama gerekmiyor), kullanıcı içeride;
 *  - user.identities boş dizi → e-posta zaten kayıtlı (Supabase, doğrulama açıkken
 *    var olan adres için kimliksiz sahte kullanıcı döner — adres sızdırmamak için);
 *  - aksi hâlde doğrulama e-postası yolda.
 */
export function describeSignUpResult(data: SignUpDataLike | null | undefined): SignUpOutcomeInfo {
  if (data?.session) {
    return { outcome: "signed_in", message: SIGNUP_SIGNED_IN_MESSAGE };
  }
  const identities = data?.user?.identities;
  if (Array.isArray(identities) && identities.length === 0) {
    return { outcome: "already_registered", message: SIGNUP_ALREADY_REGISTERED_MESSAGE };
  }
  return { outcome: "confirmation_sent", message: SIGNUP_CONFIRMATION_SENT_MESSAGE };
}
