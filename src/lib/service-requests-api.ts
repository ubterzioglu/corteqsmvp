// R3 (13 Eylül, B6 mixed-data-fetching): ServiceRequestForm.tsx VE
// ServiceRequestsList.tsx aynı iki tabloya (service_requests, service_proposals)
// doğrudan supabase.from() ile yazıp okuyordu — tek modülde toplandı.
//
// ⚠️ Davranış BİREBİR korunmuştur, verimlilik/mantık DÜZELTİLMEMİŞTİR:
// listMyServiceRequestsWithProposals hâlâ N+1 sorgu deseni kullanır (her talep
// için ayrı proposals sorgusu, her teklif için ayrı consultant adı sorgusu).
// Bu taşıma bir refactor değil — dosya konumu değişikliği.

import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export interface ServiceRequestInput {
  userId: string;
  category: string;
  subcategory: string | null;
  title: string;
  description: string;
  city: string | null;
  country: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  preferredTime: string | null;
  urgency: string;
  attachmentUrls: string[];
}

/** "Hizmet talebi" formunun tek sorumluluk insert'i — davranış eskisiyle birebir aynı. */
export async function createServiceRequest(input: ServiceRequestInput): Promise<void> {
  const payload: TablesInsert<"service_requests"> = {
    user_id: input.userId,
    category: input.category,
    subcategory: input.subcategory,
    title: input.title,
    description: input.description,
    city: input.city,
    country: input.country,
    budget_min: input.budgetMin,
    budget_max: input.budgetMax,
    preferred_time: input.preferredTime,
    urgency: input.urgency,
    attachment_urls: input.attachmentUrls,
  };

  const { error } = await supabase.from("service_requests").insert(payload);
  if (error) throw error;
}

export interface ServiceProposalWithConsultant {
  id: string;
  consultant_id: string;
  message: string;
  price: number | null;
  estimated_duration: string | null;
  scope: string | null;
  payment_terms: string | null;
  status: string | null;
  created_at: string;
  consultant_name: string;
}

export interface ServiceRequestWithProposals {
  id: string;
  category: string;
  subcategory: string | null;
  title: string;
  description: string;
  city: string | null;
  country: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_time: string | null;
  urgency: string | null;
  attachment_urls: string[] | null;
  status: string | null;
  created_at: string;
  proposals: ServiceProposalWithConsultant[];
}

/** Girişli kullanıcının kendi taleplerini, her talebin tekliflerini ve her
 * teklifin danışman adını getirir. ServiceRequestsList.tsx'in eski
 * fetchRequests'i ile birebir aynı sorgu sırası/şekli. */
export async function listMyServiceRequestsWithProposals(userId: string): Promise<ServiceRequestWithProposals[]> {
  const { data: reqData } = await supabase
    .from("service_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!reqData) return [];

  const { getAttributeValue } = await import("@/lib/profile-helpers");

  return Promise.all(
    reqData.map(async (req) => {
      const { data: proposals } = await supabase
        .from("service_proposals")
        .select("*")
        .eq("request_id", req.id)
        .order("created_at", { ascending: false });

      const proposalsWithNames = await Promise.all(
        (proposals ?? []).map(async (p) => {
          const fullName = await getAttributeValue(p.consultant_id, "full_name");
          return { ...p, consultant_name: fullName || "Danışman" };
        }),
      );

      return { ...req, proposals: proposalsWithNames } as ServiceRequestWithProposals;
    }),
  );
}

/** Teklifi kabul/ret olarak işaretler. */
export async function updateServiceProposalStatus(proposalId: string, status: "accepted" | "rejected"): Promise<void> {
  const { error } = await supabase.from("service_proposals").update({ status }).eq("id", proposalId);
  if (error) throw error;
}

/** Talebi "devam ediyor" durumuna çeker (teklif kabul edilince çağrılır). */
export async function markServiceRequestInProgress(requestId: string): Promise<void> {
  const { error } = await supabase.from("service_requests").update({ status: "in_progress" }).eq("id", requestId);
  if (error) throw error;
}
