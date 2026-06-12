// Dünya Kupası kampanyası — admin API katmanı.
// Liste + onay/red, worldcup_* security-definer RPC'leri üzerinden.

import { supabase } from "@/integrations/supabase/client";

import {
  resolveWorldCupErrorMessage,
  type WorldCupAdminRegistration,
  type WorldCupRegistrationStatus,
  type WorldCupReviewResult,
} from "@/lib/dunya-kupasi-schemas";

// Generated types (B1) world_cup_* RPC'lerini tanımıyor; izole cast (cadde-internal deseni).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type AdminRegistrationRow = {
  id: string;
  userId: string;
  email: string | null;
  businessName: string;
  categoryKey: string;
  categoryLabel: string;
  country: string;
  city: string;
  phone: string | null;
  address: string | null;
  imagePath: string | null;
  broadcastConfirmed: boolean;
  applicantNote: string | null;
  status: WorldCupRegistrationStatus;
  reviewedAt: string | null;
  reviewNote: string | null;
  previousRoleKey: string | null;
  roleAssigned: boolean | null;
  createdAt: string;
};

export async function listWorldCupRegistrationsAsAdmin(
  status?: WorldCupRegistrationStatus,
): Promise<WorldCupAdminRegistration[]> {
  const { data, error } = await db.rpc("list_world_cup_registrations_admin_v1", {
    p_status: status ?? null,
  });
  if (error) {
    throw new Error(resolveWorldCupErrorMessage(error));
  }

  return (Array.isArray(data) ? (data as AdminRegistrationRow[]) : []).map((row) => ({
    id: row.id,
    userId: row.userId,
    email: row.email,
    businessName: row.businessName,
    categoryRoleKey: row.categoryKey,
    categoryLabel: row.categoryLabel,
    country: row.country,
    city: row.city,
    phone: row.phone,
    address: row.address,
    imagePath: row.imagePath,
    broadcastConfirmed: row.broadcastConfirmed,
    applicantNote: row.applicantNote,
    status: row.status,
    reviewedAt: row.reviewedAt,
    reviewNote: row.reviewNote,
    previousRoleKey: row.previousRoleKey,
    roleAssigned: row.roleAssigned,
    createdAt: row.createdAt,
  }));
}

export async function reviewWorldCupRegistrationAsAdmin(
  registrationId: string,
  approve: boolean,
  note: string | null,
): Promise<WorldCupReviewResult> {
  const { data, error } = await db.rpc("admin_review_world_cup_registration_v1", {
    p_registration_id: registrationId,
    p_approve: approve,
    p_note: note,
  });
  if (error) {
    throw new Error(resolveWorldCupErrorMessage(error));
  }
  return (data ?? { status: approve ? "approved" : "rejected" }) as WorldCupReviewResult;
}
