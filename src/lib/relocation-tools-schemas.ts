// Relocation Tools — Zod şemaları (docs/10tool/00 §"Zod ve TypeScript sınırları").

import { z } from "zod";

export const toolModeSchema = z.enum(["quick", "detailed"]);

export const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.record(z.unknown()),
]);

export type AnswerValue = z.infer<typeof answerValueSchema>;

export const startSessionSchema = z.object({
  toolKey: z.string().min(1),
  mode: toolModeSchema,
  sourceMoveId: z.string().uuid().optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

export const saveToolAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionKey: z.string().min(1),
  answer: answerValueSchema,
});

export type SaveToolAnswerInput = z.infer<typeof saveToolAnswerSchema>;
