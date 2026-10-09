import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import InvestorGate from "./InvestorGate";
import {
  derivePbkdf2Hex,
  hasInvestorSession,
  INVESTOR_MAX_ATTEMPTS,
  parseInvestorVerifier,
  type InvestorVerifier,
} from "@/lib/investor/investor-access";

const SALT = "00112233445566778899aabbccddeeff";
let verifier: InvestorVerifier;

beforeAll(async () => {
  verifier = parseInvestorVerifier(`pbkdf2:1000:${SALT}:${await derivePbkdf2Hex("abc", SALT, 1000)}`)!;
});

const submit = (value: string) => {
  fireEvent.change(screen.getByLabelText("Parola"), { target: { value } });
  fireEvent.click(screen.getByRole("button"));
};

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("InvestorGate", () => {
  it("doğru parolada kapıyı açar ve oturumu hatırlar", async () => {
    const onUnlock = vi.fn();
    render(<InvestorGate verifier={verifier} onUnlock={onUnlock} />);
    submit("abc");
    await waitFor(() => expect(onUnlock).toHaveBeenCalledTimes(1));
    expect(hasInvestorSession(verifier)).toBe(true);
  });

  it("yanlış parolada açmaz ve hata gösterir", async () => {
    const onUnlock = vi.fn();
    render(<InvestorGate verifier={verifier} onUnlock={onUnlock} />);
    submit("yanlis");
    expect(await screen.findByText("Parola doğrulanamadı.")).toBeInTheDocument();
    expect(onUnlock).not.toHaveBeenCalled();
  });

  it(`${INVESTOR_MAX_ATTEMPTS} yanlış denemede formu geçici kilitler`, async () => {
    render(<InvestorGate verifier={verifier} onUnlock={vi.fn()} />);
    for (let i = 0; i < INVESTOR_MAX_ATTEMPTS; i += 1) {
      submit(`yanlis-${i}`);
      await waitFor(() => expect(screen.getByLabelText("Parola")).toHaveValue(""));
    }
    expect(await screen.findByText("Çok fazla deneme. Lütfen biraz bekleyin.")).toBeInTheDocument();
    expect(screen.getByLabelText("Parola")).toBeDisabled();
  });

  it("doğrulayıcı yapılandırılmamışsa form hiç çizilmez (sessizce açılmaz)", () => {
    const onUnlock = vi.fn();
    render(<InvestorGate verifier={null} onUnlock={onUnlock} />);
    expect(screen.queryByLabelText("Parola")).toBeNull();
    expect(screen.getByRole("alert")).toHaveTextContent("yapılandırılmamış");
    expect(onUnlock).not.toHaveBeenCalled();
  });
});
