import { supabase } from "@/integrations/supabase/client";

export type CustomerRequestStatus = "new" | "in_progress" | "waiting_customer" | "resolved" | "closed";

export type CustomerRequestThread = {
  id: string;
  status: CustomerRequestStatus;
  assignedTo: string | null;
  lastInboundAt: string;
  lastMessageAt: string;
  expiresAt: string;
  createdAt: string;
  latestMessagePreview: string | null;
  latestDirection: string | null;
  messageCount: number;
};

export type CustomerRequestMessage = {
  id: string;
  direction: "inbound" | "outbound";
  messageType: string;
  body: string | null;
  templateName: string | null;
  templateLanguage: string | null;
  deliveryStatus: string;
  errorCode: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type ApprovedWhatsAppTemplate = {
  id: string;
  name: string;
  language: string;
  bodyPreview: string | null;
};

const THREAD_STATUSES: CustomerRequestStatus[] = ["new", "in_progress", "waiting_customer", "resolved", "closed"];

function customerRequestStatus(value: string): CustomerRequestStatus {
  return THREAD_STATUSES.includes(value as CustomerRequestStatus) ? value as CustomerRequestStatus : "new";
}

export async function listCustomerRequestThreads(): Promise<CustomerRequestThread[]> {
  const { data, error } = await supabase.rpc("admin_list_whatsapp_customer_threads");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    status: customerRequestStatus(row.status),
    assignedTo: row.assigned_to,
    lastInboundAt: row.last_inbound_at,
    lastMessageAt: row.last_message_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    latestMessagePreview: row.latest_message_preview,
    latestDirection: row.latest_direction,
    messageCount: Number(row.message_count),
  }));
}

export async function listCustomerRequestMessages(threadId: string): Promise<CustomerRequestMessage[]> {
  const { data, error } = await supabase.rpc("admin_list_whatsapp_customer_messages", { p_thread_id: threadId });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    direction: row.direction === "outbound" ? "outbound" : "inbound",
    messageType: row.message_type,
    body: row.body,
    templateName: row.template_name,
    templateLanguage: row.template_language,
    deliveryStatus: row.delivery_status,
    errorCode: row.error_code,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));
}

export async function listApprovedWhatsAppTemplates(): Promise<ApprovedWhatsAppTemplate[]> {
  const { data, error } = await supabase
    .from("whatsapp_message_templates")
    .select("id, name, language, body_preview")
    .eq("approval_status", "approved")
    .eq("parameter_count", 0)
    .not("verified_at", "is", null)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    language: row.language,
    bodyPreview: row.body_preview,
  }));
}

export async function updateCustomerRequestThread(
  threadId: string,
  status: CustomerRequestStatus,
  assignedTo: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_whatsapp_customer_thread", {
    p_thread_id: threadId,
    p_status: status,
    p_assigned_to: assignedTo ?? undefined,
  });
  if (error) throw error;
}

export async function sendCustomerRequestReply(input: {
  threadId: string;
  body?: string;
  template?: ApprovedWhatsAppTemplate;
}): Promise<{ sent?: boolean; duplicate?: boolean; messageId: string }> {
  const requestId = crypto.randomUUID();
  const { data, error } = await supabase.functions.invoke("whatsapp-reply", {
    body: {
      requestId,
      threadId: input.threadId,
      body: input.body?.trim() || undefined,
      templateName: input.template?.name,
      templateLanguage: input.template?.language,
    },
  });
  if (error) throw error;
  if (!data || typeof data !== "object" || typeof data.messageId !== "string") {
    throw new Error("WhatsApp yanıtı doğrulanamadı.");
  }
  return data as { sent?: boolean; duplicate?: boolean; messageId: string };
}

export async function currentAdminUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Admin oturumu bulunamadı.");
  return data.user.id;
}
