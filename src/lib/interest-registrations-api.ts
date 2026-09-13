// Q9 (13 Eylül, B6 mixed-data-fetching): InterestForm.tsx doğrudan
// `supabase.from("interest_registrations").insert(...)` çağırıyordu.
// muhasebe-api.ts deseni: bileşen yalnız bu fonksiyonu çağırır, sorgu detayı
// burada tek yerde durur.

import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export interface InterestRegistrationInput {
  category: string;
  role: string | null;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  organization: string;
  interestArea: string;
  supplyDemand: string;
  referralCode: string | null;
  source: string | null;
  attachmentUrls: string[];
}

/** "İlgi kaydı" formunun tek sorumlulu insert'i — davranış eskisiyle birebir aynı. */
export async function submitInterestRegistration(input: InterestRegistrationInput): Promise<void> {
  const payload: TablesInsert<"interest_registrations"> = {
    category: input.category,
    role: input.role,
    name: input.name,
    email: input.email,
    phone: input.phone,
    country: input.country,
    city: input.city,
    organization: input.organization,
    interest_area: input.interestArea,
    supply_demand: input.supplyDemand,
    referral_code: input.referralCode,
    source: input.source,
    attachment_urls: input.attachmentUrls,
    message: input.supplyDemand,
  };

  const { error } = await supabase.from("interest_registrations").insert(payload);
  if (error) throw error;
}
