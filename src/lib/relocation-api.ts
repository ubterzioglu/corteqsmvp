// src/lib/relocation-api.ts
// Supabase RPC + okuma çağrıları — service-finder-api / muhasebe-api deseni.
// Mutasyonlar security-definer RPC üzerinden; referans listeler RLS'li SELECT.
// NOT: supabase/types.ts relocation_* için henüz regenerate edilmedi (B1 backlog);
// yeni RPC dönüşleri tiplenirken `as unknown as T` kullanılır (geo.ts'teki `as any` deseniyle aynı sebep).

import { supabase } from "@/integrations/supabase/client";
import type {
  InteractionInput,
  MoveCreateInput,
  WizardAnswerInput,
} from "@/lib/relocation-schemas";
import type {
  RelocationEmergencyContactRow,
  RelocationLocationRecommendation,
  RelocationMoveRow,
  RelocationServiceCategory,
  RelocationServiceRow,
  RelocationStepRow,
} from "@/lib/relocation-types";
import {
  normalizeEmergencyContactRow,
  normalizeList,
  normalizeLocationRecommendation,
  normalizeMoveRow,
  normalizeServiceRow,
  normalizeStepRow,
} from "@/lib/relocation-normalize";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ---------------------------------------------------------------------------
// Taşınma dosyaları (mutasyon = RPC)
// ---------------------------------------------------------------------------

export async function createMove(input: MoveCreateInput): Promise<{ move_id: string }> {
  const { data, error } = await db.rpc("relocation_create_move", { p_payload: input });
  if (error) throw error;
  return data as { move_id: string };
}

export async function updateMove(
  moveId: string,
  patch: Partial<MoveCreateInput>,
): Promise<void> {
  const { error } = await db.rpc("relocation_update_move", {
    p_move_id: moveId,
    p_patch: patch,
  });
  if (error) throw error;
}

export async function saveWizardAnswers(
  moveId: string,
  answer: WizardAnswerInput,
): Promise<void> {
  const { error } = await db.rpc("relocation_save_wizard", {
    p_move_id: moveId,
    p_payload: answer,
  });
  if (error) throw error;
}

/**
 * Kullanıcının taşınma dosyaları, en yeni önce.
 *
 * Sayfa `moveId`'yi yalnız bileşen state'inde tutuyordu; sayfa yenilenince dosya
 * kayboluyor ve kullanıcı her girişte YENİ kayıt açıyordu. Canlıda
 * `relocation_moves = 0` olduğu için bu kusur fark edilmemişti (2026-09-20 ölçümü).
 * RLS sahibi dışındakileri zaten eler — burada ayrıca user_id filtresi gerekmez.
 */
export async function listMoves(): Promise<RelocationMoveRow[]> {
  const { data, error } = await db
    .from("relocation_moves")
    .select("*")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return normalizeList(data, normalizeMoveRow);
}

export async function getMove(moveId: string): Promise<RelocationMoveRow> {
  const { data, error } = await db
    .from("relocation_moves")
    .select("*")
    .eq("id", moveId)
    .single();
  if (error) throw error;
  return normalizeMoveRow(data);
}

/** Aktif taşınma lokasyonlarında bulunan benzersiz hedef ülke kodları. */
export async function listActiveRelocationCountryCodes(): Promise<string[]> {
  const { data, error } = await db
    .from("relocation_locations")
    .select("country_code")
    .eq("is_active", true);
  if (error) throw error;

  return Array.from(
    new Set(
      (data ?? [])
        .map((row: { country_code: string | null }) => row.country_code?.trim())
        .filter((code): code is string => Boolean(code)),
    ),
  );
}

// ---------------------------------------------------------------------------
// Öneriler (RPC — kural skoru + açıklamalar DB'de hesaplanır)
// ---------------------------------------------------------------------------

export async function getCityRecommendations(
  moveId: string,
): Promise<RelocationLocationRecommendation[]> {
  const { data, error } = await db.rpc("relocation_rank_locations_v1", { p_move_id: moveId });
  if (error) throw error;
  // Canlı RPC `explanations` döndürmüyordu (2026-09-25 öncesi) → şehir kartı çöküyordu.
  return normalizeList(data, normalizeLocationRecommendation);
}

export async function getServiceRecommendations(
  moveId: string,
  category: RelocationServiceCategory,
): Promise<RelocationServiceRow[]> {
  const { data, error } = await db.rpc("relocation_rank_services_v1", {
    p_move_id: moveId,
    p_category: category,
  });
  if (error) throw error;
  return normalizeList(data, normalizeServiceRow);
}

export async function getChecklist(moveId: string): Promise<RelocationStepRow[]> {
  const { data, error } = await db.rpc("relocation_build_checklist_v1", { p_move_id: moveId });
  if (error) throw error;
  return normalizeList(data, normalizeStepRow);
}

// ---------------------------------------------------------------------------
// Acil iletişim (referans — RLS public read)
// ---------------------------------------------------------------------------

export async function getEmergencyContacts(
  countryCode: string,
  cityCode?: string,
): Promise<RelocationEmergencyContactRow[]> {
  let query = db
    .from("relocation_emergency_contacts")
    .select("*")
    .eq("country_code", countryCode)
    .eq("is_active", true);
  if (cityCode) {
    query = query.or(`city_code.eq.${cityCode},city_code.is.null`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return normalizeList(data, normalizeEmergencyContactRow);
}

// ---------------------------------------------------------------------------
// Etkileşimler (event yazımı — RPC)
// ---------------------------------------------------------------------------

export async function recordInteraction(input: InteractionInput): Promise<void> {
  const { error } = await db.rpc("relocation_record_interaction", { p_payload: input });
  if (error) throw error;
}
