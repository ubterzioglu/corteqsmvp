// Relocation modülü — Zod şemaları (service-finder-schemas.ts kalıbı).
// Form/payload sınır doğrulaması; tipler z.infer ile türetilir.

import { z } from "zod";

const countryCodeSchema = z.string().trim().length(2, "Ülke kodu 2 harf olmalı").toUpperCase();

export const householdSchema = z.object({
  adults: z.coerce.number().int().min(1, "En az 1 yetişkin").max(20),
  children: z.coerce.number().int().min(0).max(20).default(0),
  pets: z.array(z.string()).default([]),
  // Coarse-grained etiketler — teşhis/sağlık verisi DEĞİL.
  accessibility_needs: z.array(z.string()).default([]),
});

export type HouseholdInput = z.infer<typeof householdSchema>;

export const moveCreateSchema = z
  .object({
    origin_country_code: countryCodeSchema.optional().or(z.literal("")),
    origin_city_code: z.string().trim().optional(),
    target_country_codes: z.array(countryCodeSchema).min(1, "En az bir hedef ülke seçin"),
    move_window_start: z.string().date().optional().or(z.literal("")),
    move_window_end: z.string().date().optional().or(z.literal("")),
    budget_monthly: z.coerce.number().positive("Bütçe pozitif olmalı").optional(),
    setup_budget_max: z.coerce.number().positive().optional(),
    currency: z.string().trim().length(3).toUpperCase().default("EUR"),
    household: householdSchema,
    must_haves: z.array(z.string()).default([]),
    nice_to_haves: z.array(z.string()).default([]),
    preferred_language: z.enum(["tr-TR", "en-US"]).default("tr-TR"),
    allow_personalization: z.boolean().default(true),
    allow_partner_referrals: z.boolean().default(false),
  })
  .refine(
    (v) =>
      !v.move_window_start ||
      !v.move_window_end ||
      v.move_window_start <= v.move_window_end,
    { message: "Taşınma penceresi başlangıcı bitişten sonra olamaz", path: ["move_window_end"] },
  );

export type MoveCreateInput = z.infer<typeof moveCreateSchema>;

/** Wizard adımı cevabı — esnek anahtar/değer; move.wizard_answers'a merge edilir. */
export const wizardAnswerSchema = z.object({
  step: z.string().min(1),
  answers: z.record(z.string(), z.unknown()),
});

export type WizardAnswerInput = z.infer<typeof wizardAnswerSchema>;

export const interactionSchema = z.object({
  move_id: z.string().uuid().optional(),
  entity_type: z.enum(["location", "service", "bureaucratic_step"]).optional(),
  entity_id: z.string().uuid().optional(),
  event_type: z.enum([
    "impression",
    "click",
    "save",
    "dismiss",
    "compare",
    "click_out",
    "checklist_complete",
    "move_success",
  ]),
  rank_position: z.coerce.number().int().min(0).optional(),
  context: z.record(z.string(), z.unknown()).default({}),
});

export type InteractionInput = z.infer<typeof interactionSchema>;
