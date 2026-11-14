import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { normalizeTurkishText } from "@/lib/text-normalization";

export const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const DEFAULT_RANDOM_LENGTH = 6;

export type ReferralCodeRow = Tables<"referral_codes">;
export type ReferralCodeInsert = TablesInsert<"referral_codes">;
export type ReferralSourceRow = Tables<"referral_sources">;
export type ReferralGroupRow = Tables<"referral_groups">;
export type ReferralTypeRow = Tables<"referral_types">;

export type CreateReferralCodeParams = {
  sourceId: string;
  groupId: string;
  typeId: string;
  validFrom: string;
  validUntil: string;
  note?: string | null;
  createdBy?: string | null;
  randomLength?: 5 | 6 | 7;
};

export function validateReferralCodeToken(code: string) {
  const normalized = normalizeTurkishText(code).toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new Error("Code must be exactly 2 uppercase letters.");
  }
  return normalized;
}

function getRandomValues(length: number) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return values;
}

export function randomString(length: number): string {
  const values = getRandomValues(length);
  let result = "";
  for (let index = 0; index < values.length; index += 1) {
    result += SAFE_CHARS[values[index] % SAFE_CHARS.length];
  }
  return result;
}

export function generateReferralCodeFromParts(params: {
  sourceCode: string;
  groupCode: string;
  typeCode: string;
  validFrom: string;
  validUntil: string;
  randomLength?: number;
}) {
  const sourceCode = validateReferralCodeToken(params.sourceCode);
  const groupCode = validateReferralCodeToken(params.groupCode);
  const typeCode = validateReferralCodeToken(params.typeCode);
  const validFromDate = new Date(params.validFrom);
  const validUntilDate = new Date(params.validUntil);
  if (Number.isNaN(validFromDate.getTime()) || Number.isNaN(validUntilDate.getTime())) {
    throw new Error("Valid from/until dates are required.");
  }
  if (validUntilDate < validFromDate) {
    throw new Error("Valid until date must be after valid from date.");
  }

  const randomLength = params.randomLength ?? DEFAULT_RANDOM_LENGTH;
  const randomPart = randomString(randomLength);
  const prefix = `${sourceCode}${groupCode}${typeCode}`;
  const code = `${prefix}-${randomPart}`;
  const monthNum = validFromDate.getUTCMonth() + 1;
  const yearShort = String(validFromDate.getUTCFullYear()).slice(-2);

  return {
    code,
    prefix,
    sourceCode,
    groupCode,
    typeCode,
    monthNum,
    yearShort,
    randomPart,
  };
}

export function buildReferralInsertPayload(params: {
  source: ReferralSourceRow;
  group: ReferralGroupRow;
  type: ReferralTypeRow;
  validFrom: string;
  validUntil: string;
  note?: string | null;
  createdBy?: string | null;
  randomLength?: 5 | 6 | 7;
}): ReferralCodeInsert {
  if (!params.source.is_active) throw new Error("Selected source is not active.");
  if (!params.group.is_active) throw new Error("Selected group is not active.");
  if (!params.type.is_active) throw new Error("Selected type is not active.");

  const generated = generateReferralCodeFromParts({
    sourceCode: params.source.code,
    groupCode: params.group.code,
    typeCode: params.type.code,
    validFrom: params.validFrom,
    validUntil: params.validUntil,
    randomLength: params.randomLength ?? DEFAULT_RANDOM_LENGTH,
  });

  return {
    code: generated.code,
    source_id: params.source.id,
    group_id: params.group.id,
    type_id: params.type.id,
    source_code: generated.sourceCode,
    group_code: generated.groupCode,
    type_code: generated.typeCode,
    month_num: generated.monthNum,
    year_short: generated.yearShort,
    random_part: generated.randomPart,
    valid_from: params.validFrom,
    valid_until: params.validUntil,
    note: params.note ? normalizeTurkishText(params.note) : null,
    created_by: params.createdBy ?? null,
  };
}

type InsertResult<TData> = {
  data: TData | null;
  error: { code?: string; message: string } | null;
};

export async function createReferralCodeWithRetry<TData extends ReferralCodeRow>(
  params: {
    source: ReferralSourceRow;
    group: ReferralGroupRow;
    type: ReferralTypeRow;
    validFrom: string;
    validUntil: string;
    note?: string | null;
    createdBy?: string | null;
    randomLength?: 5 | 6 | 7;
  },
  insertFn: (payload: ReferralCodeInsert) => Promise<InsertResult<TData>>,
  maxAttempts = 5,
): Promise<TData> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const payload = buildReferralInsertPayload(params);
    const { data, error } = await insertFn(payload);
    if (!error && data) return data;
    if (!error && !data) throw new Error("Referral code insert returned empty result.");
    if (error.code !== "23505") throw new Error(error.message);
  }

  throw new Error("Referral code could not be generated uniquely after multiple attempts.");
}
