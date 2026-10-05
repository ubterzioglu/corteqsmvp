/**
 * Plan yapılandırması — TEK KAYNAK.
 *
 * Pricing.tsx'teki sabitler buradan gelir. Fiyat/kampanya değerleri DEĞİŞTİRİLEMEZ
 * (ürün kararı). Yalnızca LOCK_FROM ve isLocked() yardımcı fonksiyonu eklenmiştir.
 *
 * LOCK_FROM: 1 Ocak 2027'den itibaren premium özellikler kilitlenir.
 * Panelde sayaç görünür, kilit kapalı (şimdilik).
 */

import type { LucideIcon } from "lucide-react";

export type PlanFeature = {
  text: string;
  included: boolean;
};

export type Plan = {
  name: string;
  icon: LucideIcon;
  monthlyPrice: number;
  yearlyPrice: number;
  desc: string;
  badge?: string;
  features: PlanFeature[];
};

export type PlanSet = {
  freemium: Plan;
  premium: Plan;
};

export type UserType = "consultant" | "association" | "business";

/**
 * LOCK_FROM — 1 Ocak 2027'den itibaren premium özellikler kilitlenir.
 * Bu tarih değişmez (ürün kararı). Panelde sayaç bu tarihe göre hesaplanır.
 */
export const LOCK_FROM = "2027-01-01";

/**
 * isLocked — LOCK_FROM tarihine ulaşıldı mı?
 * Şu an (Ekim 2026) her zaman false döner. 1 Ocak 2027'den sonra true dönecek.
 */
export function isLocked(): boolean {
  const now = new Date();
  const lockDate = new Date(LOCK_FROM);
  return now >= lockDate;
}

/**
 * daysUntilLock — LOCK_FROM tarihine kaç gün kaldı?
 * Paneldeki sayaç bu değeri kullanır.
 */
export function daysUntilLock(): number {
  const now = new Date();
  const lockDate = new Date(LOCK_FROM);
  const diffMs = lockDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
