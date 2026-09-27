// Kadro konsolu veri katmanı.
//
// ⚠️ 27.09.2026'ya kadar bu dosya `(supabase as any).from(name)` gevşek şimini
// kullanıyordu ve şim GERÇEK bir kusuru gizliyordu: DB sütunları snake_case
// (`role_key`, `owner_name`, `changed_at`, `full_name`), alan tipleri ise
// camelCase (`roleKey`, `ownerName`, `changedAt`, `fullName`). Satırlar
// dönüştürülmeden `as KadroRoleState[]` ile işaretleniyordu, yani
// `kadro-view.ts`'teki `stateMap` her satırı `undefined` anahtarla kuruyor,
// `KadroEventLog`/`KadroCandidateList` de boş alan okuyordu.
//
// Kusur canlıda görünmedi çünkü üç kadro tablosu da BOŞ (ölçüm 27.09.2026:
// kadro_role_states / kadro_candidates / kadro_role_events → 0 satır). İlk kayıt
// yazıldığında sessizce kaybolacaktı.
//
// Artık tipli istemci kullanılıyor ve dönüşüm AÇIK. Eşleme
// `kadro-api-mapping.test.ts` tarafından kilitlenmiştir.
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type {
  KadroCandidate,
  KadroCandidateDraft,
  KadroCandidateStage,
  KadroRoleEvent,
  KadroRoleState,
} from "./kadro-types";
import { KADRO_CANDIDATE_STAGES } from "./kadro-taxonomy";

type Tables = Database["public"]["Tables"];

const ROLE_STATE_COLUMNS = "role_key, status, priority, owner_name, note, updated_at, updated_by";
const ROLE_EVENT_COLUMNS = "id, role_key, field, old_value, new_value, changed_by, changed_at";
const CANDIDATE_COLUMNS =
  "id, role_key, full_name, links, stage, note, created_by, created_at, updated_at";

type RoleStateRow = Pick<
  Tables["kadro_role_states"]["Row"],
  "role_key" | "status" | "priority" | "owner_name" | "note" | "updated_at" | "updated_by"
>;
type RoleEventRow = Pick<
  Tables["kadro_role_events"]["Row"],
  "id" | "role_key" | "field" | "old_value" | "new_value" | "changed_by" | "changed_at"
>;
type CandidateRow = Pick<
  Tables["kadro_candidates"]["Row"],
  | "id"
  | "role_key"
  | "full_name"
  | "links"
  | "stage"
  | "note"
  | "created_by"
  | "created_at"
  | "updated_at"
>;

/** snake_case satır → camelCase alan tipi. Sütun adı değişirse burası da değişir. */
export function mapKadroRoleState(row: RoleStateRow): KadroRoleState {
  return {
    roleKey: row.role_key,
    status: row.status as KadroRoleState["status"],
    priority: row.priority as KadroRoleState["priority"],
    ownerName: row.owner_name,
    note: row.note,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export function mapKadroRoleEvent(row: RoleEventRow): KadroRoleEvent {
  return {
    id: row.id,
    roleKey: row.role_key,
    field: row.field as KadroRoleEvent["field"],
    oldValue: row.old_value,
    newValue: row.new_value,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
  };
}

// `links` ve `note` DB'de null olabilir ama alan tipi düz string bekler —
// arayüz bu alanları doğrudan input value'suna veriyor, null React uyarısı üretir.
export function mapKadroCandidate(row: CandidateRow): KadroCandidate {
  return {
    id: row.id,
    roleKey: row.role_key,
    fullName: row.full_name,
    links: row.links ?? "",
    stage: row.stage as KadroCandidateStage,
    note: row.note ?? "",
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchKadroRoleStates(): Promise<KadroRoleState[]> {
  const { data, error } = await supabase
    .from("kadro_role_states")
    .select(ROLE_STATE_COLUMNS)
    .order("role_key");

  if (error) throw error;
  return (data ?? []).map(mapKadroRoleState);
}

export async function saveKadroRoleState(
  roleKey: string,
  state: Partial<KadroRoleState>,
  userId: string,
): Promise<KadroRoleState> {
  const { data, error } = await supabase
    .from("kadro_role_states")
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
    .select(ROLE_STATE_COLUMNS)
    .single();

  if (error) throw error;
  return mapKadroRoleState(data);
}

export async function fetchKadroRoleEvents(roleKey: string): Promise<KadroRoleEvent[]> {
  const { data, error } = await supabase
    .from("kadro_role_events")
    .select(ROLE_EVENT_COLUMNS)
    .eq("role_key", roleKey)
    .order("changed_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []).map(mapKadroRoleEvent);
}

export async function fetchKadroCandidates(roleKey: string): Promise<KadroCandidate[]> {
  const { data, error } = await supabase
    .from("kadro_candidates")
    .select(CANDIDATE_COLUMNS)
    .eq("role_key", roleKey)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapKadroCandidate);
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

  const { data, error } = await supabase
    .from("kadro_candidates")
    .insert({
      role_key: roleKey,
      full_name: draft.fullName.trim(),
      links: draft.links?.trim() || null,
      stage: draft.stage,
      note: draft.note?.trim() || null,
      created_by: userId,
    })
    .select(CANDIDATE_COLUMNS)
    .single();

  if (error) throw error;
  return mapKadroCandidate(data);
}

export async function updateKadroCandidate(
  candidateId: string,
  draft: KadroCandidateDraft,
): Promise<KadroCandidate> {
  const validationError = validateKadroCandidateDraft(draft);
  if (validationError) {
    throw new Error(validationError);
  }

  const { data, error } = await supabase
    .from("kadro_candidates")
    .update({
      full_name: draft.fullName.trim(),
      links: draft.links?.trim() || null,
      stage: draft.stage,
      note: draft.note?.trim() || null,
    })
    .eq("id", candidateId)
    .select(CANDIDATE_COLUMNS)
    .single();

  if (error) throw error;
  return mapKadroCandidate(data);
}

export async function deleteKadroCandidate(candidateId: string): Promise<void> {
  const { error } = await supabase.from("kadro_candidates").delete().eq("id", candidateId);
  if (error) throw error;
}
