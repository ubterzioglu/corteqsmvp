import { supabase } from "@/integrations/supabase/client";

export type VipInvitationStatus =
  | "valid"
  | "invalid"
  | "expired"
  | "revoked"
  | "used"
  | "rate_limited";

export type VipInvitationListItem = {
  id: string;
  invitationType: string;
  title: string;
  recipientName: string | null;
  recipientEmail: string | null;
  message: string | null;
  expiresAt: string;
  revokedAt: string | null;
  redeemedAt: string | null;
  createdAt: string;
};

export type ResolvedVipInvitation = {
  status: VipInvitationStatus;
  invitationId: string | null;
  invitationType: string | null;
  title: string | null;
  recipientName: string | null;
  message: string | null;
  expiresAt: string | null;
};

export type CreateVipInvitationInput = {
  recipientName?: string;
  recipientEmail?: string;
  title: string;
  message?: string;
  invitationType?: string;
  validDays: number;
};

export type CreatedVipInvitation = {
  invitationId: string;
  token: string;
  expiresAt: string;
};

const toStatus = (status: string): VipInvitationStatus => {
  const known: VipInvitationStatus[] = ["valid", "invalid", "expired", "revoked", "used", "rate_limited"];
  return known.includes(status as VipInvitationStatus) ? status as VipInvitationStatus : "invalid";
};

export async function listVipInvitations(): Promise<VipInvitationListItem[]> {
  const { data, error } = await supabase
    .from("vip_invitations")
    .select("id, invitation_type, title, recipient_name, recipient_email, message, expires_at, revoked_at, redeemed_at, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    invitationType: row.invitation_type,
    title: row.title,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    message: row.message,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    redeemedAt: row.redeemed_at,
    createdAt: row.created_at,
  }));
}

export async function createVipInvitation(input: CreateVipInvitationInput): Promise<CreatedVipInvitation> {
  const { data, error } = await supabase.rpc("admin_create_vip_invitation", {
    p_recipient_name: input.recipientName?.trim() || undefined,
    p_recipient_email: input.recipientEmail?.trim() || undefined,
    p_title: input.title.trim(),
    p_message: input.message?.trim() || undefined,
    p_invitation_type: input.invitationType?.trim() || "founding_vip",
    p_valid_days: input.validDays,
    p_metadata: {},
  });

  if (error) throw error;
  const created = data?.[0];
  if (!created) throw new Error("VIP daveti oluşturulamadı.");
  return {
    invitationId: created.invitation_id,
    token: created.token,
    expiresAt: created.expires_at,
  };
}

export async function revokeVipInvitation(invitationId: string, reason?: string): Promise<void> {
  const { error } = await supabase.rpc("admin_revoke_vip_invitation", {
    p_invitation_id: invitationId,
    p_reason: reason?.trim() || undefined,
  });
  if (error) throw error;
}

export async function resolveVipInvitation(token: string): Promise<ResolvedVipInvitation> {
  const { data, error } = await supabase.rpc("resolve_vip_invitation", { p_token: token });
  if (error) throw error;
  const resolved = data?.[0];
  if (!resolved) return {
    status: "invalid",
    invitationId: null,
    invitationType: null,
    title: null,
    recipientName: null,
    message: null,
    expiresAt: null,
  };
  return {
    status: toStatus(resolved.status),
    invitationId: resolved.invitation_id,
    invitationType: resolved.invitation_type,
    title: resolved.title,
    recipientName: resolved.recipient_name,
    message: resolved.message,
    expiresAt: resolved.expires_at,
  };
}

export async function redeemVipInvitation(token: string): Promise<{ status: string; invitationId: string | null }> {
  const { data, error } = await supabase.rpc("redeem_vip_invitation", { p_token: token });
  if (error) throw error;
  const redeemed = data?.[0];
  return {
    status: redeemed?.status ?? "invalid",
    invitationId: redeemed?.invitation_id ?? null,
  };
}
