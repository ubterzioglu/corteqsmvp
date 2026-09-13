import { beforeEach, describe, expect, it, vi } from "vitest";

const insertMock = vi.fn();
const updateMock = vi.fn();
const eqMock = vi.fn();
const selectMock = vi.fn();
const orderMock = vi.fn();
const fromMock = vi.fn();
const getAttributeValueMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock("@/lib/profile-helpers", () => ({
  getAttributeValue: (...args: unknown[]) => getAttributeValueMock(...args),
}));

import {
  createServiceRequest,
  listMyServiceRequestsWithProposals,
  markServiceRequestInProgress,
  updateServiceProposalStatus,
} from "./service-requests-api";

const baseRequestInput = {
  userId: "user-1",
  category: "Danışman › Vize",
  subcategory: null,
  title: "Çalışma vizesi",
  description: "Danışmanlık istiyorum",
  city: "Berlin",
  country: "Almanya",
  budgetMin: 100,
  budgetMax: 500,
  preferredTime: "flexible",
  urgency: "normal",
  attachmentUrls: [],
};

describe("createServiceRequest", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
  });

  it("service_requests tablosuna satır tipiyle eşlenmiş payload gönderir", async () => {
    await createServiceRequest(baseRequestInput);

    expect(fromMock).toHaveBeenCalledWith("service_requests");
    expect(insertMock).toHaveBeenCalledWith({
      user_id: "user-1",
      category: "Danışman › Vize",
      subcategory: null,
      title: "Çalışma vizesi",
      description: "Danışmanlık istiyorum",
      city: "Berlin",
      country: "Almanya",
      budget_min: 100,
      budget_max: 500,
      preferred_time: "flexible",
      urgency: "normal",
      attachment_urls: [],
    });
  });

  it("supabase hata dönerse fırlatır", async () => {
    insertMock.mockResolvedValue({ error: { message: "eklenemedi" } });
    await expect(createServiceRequest(baseRequestInput)).rejects.toEqual({ message: "eklenemedi" });
  });
});

describe("listMyServiceRequestsWithProposals", () => {
  beforeEach(() => {
    fromMock.mockReset();
    orderMock.mockReset();
    eqMock.mockReset();
    selectMock.mockReset();
    getAttributeValueMock.mockReset();
  });

  it("her talebin tekliflerini ve danışman adını doldurur (N+1 desen korunur)", async () => {
    // service_requests.select().eq().order()
    const reqOrder = vi.fn().mockResolvedValue({
      data: [{ id: "req-1" }],
    });
    const reqEq = vi.fn(() => ({ order: reqOrder }));
    const reqSelect = vi.fn(() => ({ eq: reqEq }));

    // service_proposals.select().eq().order()
    const propOrder = vi.fn().mockResolvedValue({
      data: [{ id: "prop-1", consultant_id: "consultant-1" }],
    });
    const propEq = vi.fn(() => ({ order: propOrder }));
    const propSelect = vi.fn(() => ({ eq: propEq }));

    fromMock.mockImplementation((table: string) => {
      if (table === "service_requests") return { select: reqSelect };
      if (table === "service_proposals") return { select: propSelect };
      throw new Error(`beklenmeyen tablo: ${table}`);
    });
    getAttributeValueMock.mockResolvedValue("Ada Lovelace");

    const result = await listMyServiceRequestsWithProposals("user-1");

    expect(reqEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(propEq).toHaveBeenCalledWith("request_id", "req-1");
    expect(getAttributeValueMock).toHaveBeenCalledWith("consultant-1", "full_name");
    expect(result).toEqual([
      { id: "req-1", proposals: [{ id: "prop-1", consultant_id: "consultant-1", consultant_name: "Ada Lovelace" }] },
    ]);
  });

  it("talep verisi yoksa boş dizi döner", async () => {
    const reqOrder = vi.fn().mockResolvedValue({ data: null });
    const reqEq = vi.fn(() => ({ order: reqOrder }));
    fromMock.mockReturnValue({ select: vi.fn(() => ({ eq: reqEq })) });

    expect(await listMyServiceRequestsWithProposals("user-1")).toEqual([]);
  });
});

describe("updateServiceProposalStatus / markServiceRequestInProgress", () => {
  beforeEach(() => {
    fromMock.mockReset();
    updateMock.mockReset();
    eqMock.mockReset();
    updateMock.mockReturnValue({ eq: eqMock });
    eqMock.mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ update: updateMock });
  });

  it("teklifi verilen durumla günceller", async () => {
    await updateServiceProposalStatus("prop-1", "accepted");
    expect(fromMock).toHaveBeenCalledWith("service_proposals");
    expect(updateMock).toHaveBeenCalledWith({ status: "accepted" });
    expect(eqMock).toHaveBeenCalledWith("id", "prop-1");
  });

  it("talebi in_progress'e çeker", async () => {
    await markServiceRequestInProgress("req-1");
    expect(fromMock).toHaveBeenCalledWith("service_requests");
    expect(updateMock).toHaveBeenCalledWith({ status: "in_progress" });
    expect(eqMock).toHaveBeenCalledWith("id", "req-1");
  });
});
