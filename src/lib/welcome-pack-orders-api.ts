// R2 (13 Eylül, B6 mixed-data-fetching): WelcomePackOrderForm.tsx doğrudan
// `supabase.from("welcome_pack_orders").insert(...)` çağırıyordu.
// muhasebe-api.ts deseni: bileşen yalnız bu fonksiyonu çağırır.

import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export interface WelcomePackOrderInput {
  userId: string;
  country: string;
  city: string;
  arrivalDate: string;
  adults: number;
  children: number;
  hasPet: boolean;
  petDetails: string | null;
  needsBabySeat: boolean;
  needsAirportTransfer: boolean;
  needsCarRental: boolean;
  needsFlightDiscount: boolean;
  needsMentor: boolean;
  needsSimCard: boolean;
  mentorType: "paid" | "volunteer" | null;
  notes: string | null;
}

/** "Hoşgeldin Paketi" formunun tek sorumluluk insert'i — davranış eskisiyle birebir aynı. */
export async function submitWelcomePackOrder(input: WelcomePackOrderInput): Promise<void> {
  const payload: TablesInsert<"welcome_pack_orders"> = {
    user_id: input.userId,
    country: input.country,
    city: input.city,
    arrival_date: input.arrivalDate,
    adults: input.adults,
    children: input.children,
    has_pet: input.hasPet,
    pet_details: input.petDetails,
    needs_baby_seat: input.needsBabySeat,
    needs_airport_transfer: input.needsAirportTransfer,
    needs_car_rental: input.needsCarRental,
    needs_flight_discount: input.needsFlightDiscount,
    needs_sim_card: input.needsSimCard,
    needs_mentor: input.needsMentor,
    mentor_type: input.mentorType,
    notes: input.notes,
  };

  const { error } = await supabase.from("welcome_pack_orders").insert(payload);
  if (error) throw error;
}
