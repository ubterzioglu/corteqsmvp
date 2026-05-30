// Şehir Elçisi performans skoru — KPI'lardan 0-100 arası tek bir skor üretir.
// Ağırlıklar: Onboarding %35, Etkinlik %20, Aktif Danışman %15,
// Rating %15, Gelir %15. Hedeflere ulaşan değerler 1.0 olarak kapanır.

export interface AmbassadorScoreInput {
  usersOnboarded?: number;
  eventsOrganized?: number;
  activeAdvisors?: number;
  rating?: number;        // 0-5
  revenue?: number;       // EUR
}

const TARGETS = {
  onboarded: 200,
  events: 25,
  advisors: 15,
  revenue: 6000,
};

export function getAmbassadorScore(i: AmbassadorScoreInput): number {
  const onboard = Math.min((i.usersOnboarded ?? 0) / TARGETS.onboarded, 1) * 35;
  const events = Math.min((i.eventsOrganized ?? 0) / TARGETS.events, 1) * 20;
  const advisors = Math.min((i.activeAdvisors ?? 0) / TARGETS.advisors, 1) * 15;
  const rating = Math.min((i.rating ?? 0) / 5, 1) * 15;
  const revenue = Math.min((i.revenue ?? 0) / TARGETS.revenue, 1) * 15;
  return Math.round(onboard + events + advisors + rating + revenue);
}

export function getScoreTier(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Elite", color: "text-gold" };
  if (score >= 60) return { label: "Pro", color: "text-primary" };
  if (score >= 40) return { label: "Aktif", color: "text-turquoise" };
  return { label: "Başlangıç", color: "text-muted-foreground" };
}
