import { beforeEach, describe, expect, it, vi } from "vitest";

const insertMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import { submitWelcomePackOrder } from "./welcome-pack-orders-api";

const baseInput = {
  userId: "user-1",
  country: "Almanya",
  city: "Berlin",
  arrivalDate: "2026-10-01",
  adults: 2,
  children: 1,
  hasPet: false,
  petDetails: null,
  needsBabySeat: true,
  needsAirportTransfer: true,
  needsCarRental: false,
  needsFlightDiscount: false,
  needsMentor: true,
  needsSimCard: false,
  mentorType: "volunteer" as const,
  notes: null,
};

describe("submitWelcomePackOrder", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockReturnValue({ insert: insertMock });
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
  });

  it("welcome_pack_orders tablosuna satır tipiyle eşlenmiş payload gönderir", async () => {
    await submitWelcomePackOrder(baseInput);

    expect(fromMock).toHaveBeenCalledWith("welcome_pack_orders");
    expect(insertMock).toHaveBeenCalledWith({
      user_id: "user-1",
      country: "Almanya",
      city: "Berlin",
      arrival_date: "2026-10-01",
      adults: 2,
      children: 1,
      has_pet: false,
      pet_details: null,
      needs_baby_seat: true,
      needs_airport_transfer: true,
      needs_car_rental: false,
      needs_flight_discount: false,
      needs_sim_card: false,
      needs_mentor: true,
      mentor_type: "volunteer",
      notes: null,
    });
  });

  it("supabase hata dönerse fırlatır (bileşenin kendi try/catch'i yakalar)", async () => {
    insertMock.mockResolvedValue({ error: { message: "kayıt eklenemedi" } });

    await expect(submitWelcomePackOrder(baseInput)).rejects.toEqual({ message: "kayıt eklenemedi" });
  });
});
