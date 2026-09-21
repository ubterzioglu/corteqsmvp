import { supabase } from "@/integrations/supabase/client";
import type {
  KadroCandidate,
  KadroCandidateDraft,
  KadroCandidateStage,
  KadroPriority,
  KadroRoleEvent,
  KadroRoleState,
  KadroStatus,
} from "./kadro-types";
import { KADRO_CANDIDATE_STAGES, KADRO_PRIORITIES, KADRO_STATUSES } from "./kadro-taxonomy";

type LooseQuery = {
  select: (columns: string) => LooseQuery;
  eq: (column: string, value: unknown) => LooseQuery;
  order: (column: string, options?: { ascending?: boolean }) => LooseQuery;
  limit: (count: number) => LooseQuery;
  single: () => Promise<{ data: unknown; error: unknown }>;
  then: (
    onfulfilled: ((value: { data: unknown; error: unknown }) => unknown) | null,
    onrejected?: ((reason: unknown) => unknown) | null,
  ) => Promise<unknown>;
};

type LooseMutation = {
  insert: (values: Record<string, unknown>) => LooseMutation;
  update: (values: Record<string, unknown>) => LooseMutation;
  upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => LooseMutation;
  delete: () => LooseMutation;
  eq: (column: string, value: unknown) => LooseMutation;
  select: (columns?: string) => LooseMutation;
  single: () => Promise<{ data: unknown; error: unknown }>;
  then: (
    onfulfilled: ((value: { data: unknown; error: unknown }) => unknown) | null,
    onrejected?: ((reason: unknown) => unknown) | null,
  ) => Promise<unknown>;
};

function table(name: string): LooseQuery & LooseMutation {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(name);
}

export async function fetchKadroRoleStates(): Promise<KadroRoleState[]> {
  const { data, error } = await table("kadro_role_states")
    .select("role_key, status, priority, owner_name, note, updated_at, updated_by")
    .order("role_key");

  if (error) throw error;
  return (data as KadroRoleState[]) || [];
}

export async function saveKadroRoleState(
  roleKey: string,
  state: Partial<KadroRoleState>,
  userId: string,
): Promise<KadroRoleState> {
  const { data, error } = await table("kadro_role_states")
    .upsert(
      {
        role_key: roleKey,
        status: state.status,
        priority: state.priority,
        owner_name: state.ownerName,
        note: state.note,
        updated_by: userId,
      },
      { onConflict: "role_key" },
    )
    .select("role_key, status, priority, owner_name, note, updated_at, updated_by")
    .single();

  if (error) throw error;
  return data as KadroRoleState;
}

export async function fetchKadroRoleEvents(roleKey: string): Promise<KadroRoleEvent[]> {
  const { data, error } = await table("kadro_role_events")
    .select("id, role_key, field, old_value, new_value, changed_by, changed_at")
    .eq("role_key", roleKey)
    .order("changed_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data as KadroRoleEvent[]) || [];
}

export async function fetchKadroCandidates(roleKey: string): Promise<KadroCandidate[]> {
  const { data, error } = await table("kadro_candidates")
    .select("id, role_key, full_name, links, stage, note, created_by, created_at, updated_at")
    .eq("role_key", roleKey)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as KadroCandidate[]) || [];
}

export function validateKadroCandidateDraft(draft: KadroCandidateDraft): string | null {
  if (!draft.fullName.trim()) {
    return "Aday adı boş olamaz.";
  }
  if (draft.fullName.length > 200) {
    return "Aday adı 200 karakterden uzun olamaz.";
  }
  if (draft.links && draft.links.length > 500) {
    return "Linkler 500 karakterden uzun olamaz.";
  }
  if (draft.note && draft.note.length > 1000) {
    return "Not 1000 karakterden uzun olamaz.";
  }
  if (!KADRO_CANDIDATE_STAGES[draft.stage as KadroCandidateStage]) {
    return "Geçersiz aday aşaması.";
  }
  return null;
}

export async function createKadroCandidate(
  roleKey: string,
  draft: KadroCandidateDraft,
  userId: string,
): Promise<KadroCandidate> {
  const validationError = validateKadroCandidateDraft(draft);
  if (validationError) {
    throw new Error(validationError);
  }

  const { data, error } = await table("kadro_candidates")
    .insert({
      role_key: roleKey,
      full_name: draft.fullName.trim(),
      links: draft.links?.trim() || null,
      stage: draft.stage,
      note: draft.note?.trim() || null,
      created_by: userId,
    })
    .select("id, role_key, full_name, links, stage, note, created_by, created_at, updated_at")
    .single();

  if (error) throw error;
  return data as KadroCandidate;
}

export async function updateKadroCandidate(
  candidateId: string,
  draft: KadroCandidateDraft,
): Promise<KadroCandidate> {
  const validationError = validateKadroCandidateDraft(draft);
  if (validationError) {
    throw new Error(validationError);
  }

  const { data, error } = await table("kadro_candidates")
    .update({
      full_name: draft.fullName.trim(),
      links: draft.links?.trim() || null,
      stage: draft.stage,
      note: draft.note?.trim() || null,
    })
    .eq("id", candidateId)
    .select("id, role_key, full_name, links, stage, note, created_by, created_at, updated_at")
    .single();

  if (error) throw error;
  return data as KadroCandidate;
}

export async function deleteKadroCandidate(candidateId: string): Promise<void> {
  const { error } = await table("kadro_candidates").delete().eq("id", candidateId);
  if (error) throw error;
}
