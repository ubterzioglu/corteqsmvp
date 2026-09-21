import type { KadroRole } from "../kadro-types";
import { GELIR_ROLES } from "./gelir";
import { KURUMSAL_ROLES } from "./kurumsal";
import { LIDERLIK_ROLES } from "./liderlik";
import { OPERASYON_ROLES } from "./operasyon";
import { PAZARLAMA_COGRAFYA_ROLES } from "./pazarlama-cografya";
import { PAZARLAMA_ISLEV_ROLES } from "./pazarlama-islev";
import { PAZARLAMA_URUN_ROLES } from "./pazarlama-urun";
import { URUN_TEKNOLOJI_ROLES } from "./urun-teknoloji";

export const KADRO_ROLES: KadroRole[] = [
  ...LIDERLIK_ROLES,
  ...PAZARLAMA_URUN_ROLES,
  ...PAZARLAMA_ISLEV_ROLES,
  ...PAZARLAMA_COGRAFYA_ROLES,
  ...URUN_TEKNOLOJI_ROLES,
  ...OPERASYON_ROLES,
  ...GELIR_ROLES,
  ...KURUMSAL_ROLES,
];

const BY_ID = new Map(KADRO_ROLES.map((role) => [role.id, role]));

export const KADRO_ROLE_IDS: Set<string> = new Set(BY_ID.keys());

export function kadroRoleById(id: string): KadroRole | undefined {
  return BY_ID.get(id);
}
