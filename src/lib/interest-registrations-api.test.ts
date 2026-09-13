import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

const insertMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import { submitInterestRegistration } from "./interest-registrations-api";

const baseInput = {
  category: "genel",
  role: "danisman",
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+49 555",
  country: "Almanya",
  city: "Berlin",
  organization: "",
  interestArea: "AI",
  supplyDemand: "Danışmanlık veriyorum",
  referralCode: null,
  source: null,
  attachmentUrls: [],
};

describe("submitInterestRegistration", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
  });

  it("interest_registrations tablosuna satır tipiyle eşlenmiş payload gönderir", async () => {
    await submitInterestRegistration(baseInput);

    expect(fromMock).toHaveBeenCalledWith("interest_registrations");
    expect(insertMock).toHaveBeenCalledWith({
      category: "genel",
      role: "danisman",
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+49 555",
      country: "Almanya",
      city: "Berlin",
      organization: "",
      interest_area: "AI",
      supply_demand: "Danışmanlık veriyorum",
      referral_code: null,
      source: null,
      attachment_urls: [],
      message: "Danışmanlık veriyorum",
    });
  });

  it("supabase hata dönerse fırlatır (bileşenin kendi try/catch'i yakalar)", async () => {
    insertMock.mockResolvedValue({ error: { message: "kayıt eklenemedi" } });

    await expect(submitInterestRegistration(baseInput)).rejects.toEqual({ message: "kayıt eklenemedi" });
  });
});
