// Admin Brainstorming — Zod form şemaları.
// Limitler statusreport-comments.ts / revision-requests.ts ile tutarlı
// (body max 4000, label max 200).

import { z } from "zod";

export const BRAINSTORMING_STATUSES = ["ok", "partial", "open"] as const;
export type BrainstormingStatus = (typeof BRAINSTORMING_STATUSES)[number];

export const brainstormingSectionFormSchema = z.object({
  groupLabel: z.string().max(200).trim().optional().default(""),
  title: z.string().min(1, "Başlık boş bırakılamaz.").max(300).trim(),
  intro: z.string().max(4000).trim().optional().default(""),
});

export type BrainstormingSectionForm = z.infer<typeof brainstormingSectionFormSchema>;

export const brainstormingRowFormSchema = z.object({
  label: z.string().min(1, "Konu başlığı boş bırakılamaz.").max(200).trim(),
  technical: z.string().min(1, "Teknik açıklama boş bırakılamaz.").max(4000).trim(),
  plain: z.string().min(1, "Sade açıklama boş bırakılamaz.").max(4000).trim(),
  status: z.enum(BRAINSTORMING_STATUSES).nullable().default(null),
});

export type BrainstormingRowForm = z.infer<typeof brainstormingRowFormSchema>;

export const MAX_BRAINSTORMING_COMMENT_LENGTH = 4000;

export const brainstormingCommentFormSchema = z.object({
  body: z.string().min(1, "Yorum boş bırakılamaz.").max(MAX_BRAINSTORMING_COMMENT_LENGTH).trim(),
});
