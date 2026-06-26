// Relocation Tools — #8 İlk 90 Gün Planlayıcı görev üretimi (SQL↔TS AYNASI).
// GERÇEK üretim DB'dedir (20260626170000_relocation_tool_first_90_days.sql:
// relocation_score_first_90_days_v1). Buradaki fonksiyon UI önizlemesi + drift testi içindir.
// Görev kataloğu + gap mantığı + priority formülü SQL ile BİREBİR
// (relocation-tools-planner.test.ts kilitler). docs/10tool/08 §4:
//   priority_score = deadline_urgency*0.40 + legal_dependency*0.25 + user_gap*0.25 + source_trust*0.10

export type PlannerPhase =
  | "before_departure"
  | "day_0_7"
  | "day_8_30"
  | "day_31_90"
  | "ongoing";

export const PHASE_ORDER: Record<PlannerPhase, number> = {
  before_departure: 1,
  day_0_7: 2,
  day_8_30: 3,
  day_31_90: 4,
  ongoing: 5,
};

export const PHASE_LABELS: Record<PlannerPhase, string> = {
  before_departure: "Varıştan Önce",
  day_0_7: "İlk Hafta (0-7 gün)",
  day_8_30: "İlk Ay (8-30 gün)",
  day_31_90: "31-90 Gün",
  ongoing: "Süregelen",
};

export interface PlannerAnswers {
  arrival_date?: string;
  visa_status?: string;
  housing_status?: string;
  health_insurance?: string;
  banking?: string;
  phone_internet?: string;
  address_registration_known?: string;
  documents_ready?: string;
  emergency_contacts?: string;
  transport?: string;
  children_school?: string;
  pets?: string;
  tax_social_security?: string;
  credential_recognition?: string;
  language_course?: string;
  driving_license?: string;
}

export interface PlannerTask {
  key: string;
  title: string;
  phase: PlannerPhase;
  priority: number;
}

interface CatalogEntry {
  key: string;
  phase: PlannerPhase;
  legalDependency: number;
  baseUrgency: number;
  title: string;
  sourceHasLink: boolean;
  gap: (a: PlannerAnswers) => boolean;
}

const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

// Görev kataloğu — SQL catalog values bloğu ile BİREBİR.
const CATALOG: CatalogEntry[] = [
  { key: "health_insurance_setup", phase: "before_departure", legalDependency: 0.7, baseUrgency: 0.9, title: "Sağlık sigortasını netleştir", sourceHasLink: true, gap: (a) => a.health_insurance === "will_buy" || a.health_insurance === "none" || a.health_insurance === undefined },
  { key: "visa_finalize", phase: "before_departure", legalDependency: 1.0, baseUrgency: 1.0, title: "Vize/oturum sürecini tamamla", sourceHasLink: true, gap: (a) => ["applied", "researching", "none"].includes(a.visa_status ?? "") },
  { key: "housing_secure", phase: "before_departure", legalDependency: 0.4, baseUrgency: 0.85, title: "İlk ay konaklamayı garantiye al", sourceHasLink: false, gap: (a) => a.housing_status === "searching" || a.housing_status === "none" || a.housing_status === undefined },
  { key: "documents_copies", phase: "before_departure", legalDependency: 0.6, baseUrgency: 0.7, title: "Belgelerinin dijital + fiziksel kopyalarını hazırla", sourceHasLink: false, gap: (a) => a.documents_ready === "partial" || a.documents_ready === "no" || a.documents_ready === undefined },
  { key: "pets_transfer", phase: "before_departure", legalDependency: 0.5, baseUrgency: 0.6, title: "Evcil hayvan taşıma/sağlık evraklarını tamamla", sourceHasLink: true, gap: (a) => a.pets === "yes" },
  { key: "emergency_save", phase: "day_0_7", legalDependency: 0.3, baseUrgency: 0.8, title: "Acil iletişim numaralarını kaydet", sourceHasLink: true, gap: (a) => a.emergency_contacts === "no" || a.emergency_contacts === undefined },
  { key: "phone_line", phase: "day_0_7", legalDependency: 0.2, baseUrgency: 0.7, title: "Yerel telefon/internet hattı edin", sourceHasLink: false, gap: (a) => a.phone_internet === "temporary" || a.phone_internet === "none" || a.phone_internet === undefined },
  { key: "address_registration", phase: "day_0_7", legalDependency: 0.9, baseUrgency: 0.85, title: "Adres/belediye kaydı için randevu kontrolü yap", sourceHasLink: true, gap: (a) => a.address_registration_known === "no" || a.address_registration_known === undefined },
  { key: "transport_setup", phase: "day_0_7", legalDependency: 0.2, baseUrgency: 0.5, title: "İlk hafta ulaşım planını kur", sourceHasLink: false, gap: (a) => a.transport === "none" || a.transport === undefined },
  { key: "banking_open", phase: "day_8_30", legalDependency: 0.5, baseUrgency: 0.7, title: "Yerel banka hesabı / ödeme çözümü aç", sourceHasLink: false, gap: (a) => a.banking === "researching" || a.banking === "none" || a.banking === undefined },
  { key: "tax_social", phase: "day_8_30", legalDependency: 0.8, baseUrgency: 0.6, title: "Vergi/sosyal güvenlik kayıt adımlarını öğren", sourceHasLink: true, gap: (a) => a.tax_social_security === "no" },
  { key: "school_enroll", phase: "day_8_30", legalDependency: 0.6, baseUrgency: 0.75, title: "Çocuk okul kaydını başlat", sourceHasLink: true, gap: (a) => a.children_school === "yes" },
  { key: "community_connect", phase: "day_8_30", legalDependency: 0.1, baseUrgency: 0.4, title: "Topluluk/mentor desteğiyle bağlan", sourceHasLink: false, gap: () => false },
  { key: "credential_apply", phase: "day_31_90", legalDependency: 0.7, baseUrgency: 0.55, title: "Mesleki denklik/lisans başvurusunu başlat", sourceHasLink: true, gap: (a) => ["yes", "not_sure"].includes(a.credential_recognition ?? "") },
  { key: "language_course", phase: "day_31_90", legalDependency: 0.2, baseUrgency: 0.4, title: "Dil kursu/entegrasyon programına kaydol", sourceHasLink: false, gap: (a) => ["yes", "not_sure"].includes(a.language_course ?? "") },
  { key: "permanent_housing", phase: "day_31_90", legalDependency: 0.3, baseUrgency: 0.5, title: "Kalıcı konut araştırmasını ilerlet", sourceHasLink: false, gap: (a) => ["temporary", "searching", "none"].includes(a.housing_status ?? "") },
  { key: "driving_convert", phase: "day_31_90", legalDependency: 0.5, baseUrgency: 0.4, title: "Ehliyet dönüşümü işlemlerini yap", sourceHasLink: true, gap: (a) => a.driving_license === "yes" },
  { key: "integration_routine", phase: "ongoing", legalDependency: 0.2, baseUrgency: 0.3, title: "Yenileme/entegrasyon rutinini takvimine al", sourceHasLink: false, gap: () => true },
];

// community_connect gap'i dokümanda community_intro=yes; ayrı tutuldu (engine answers içinde).
const COMMUNITY_GAP = (a: PlannerAnswers & { community_intro?: string }) => a.community_intro === "yes";

const PHASE_DEADLINE_BASE: Record<PlannerPhase, number> = {
  before_departure: 1.0,
  day_0_7: 0.85,
  day_8_30: 0.6,
  day_31_90: 0.4,
  ongoing: 0.25,
};

/** Varış tarihinden yakınlık 0..1 (SQL v_proximity aynası). */
export function arrivalProximity(arrivalDate: string | undefined): number {
  if (!arrivalDate || !/^\d{4}-\d{2}-\d{2}$/.test(arrivalDate)) return 0.6;
  const days = Math.round((new Date(arrivalDate).getTime() - Date.now()) / 86_400_000);
  if (days <= 7) return 1.0;
  if (days >= 180) return 0.3;
  return Math.round((1.0 - ((days - 7) / 173) * 0.7) * 1000) / 1000;
}

/** Cevap gap'lerinden öncelikli görev listesi üretir (faz + öncelik sıralı). */
export function generatePlannerTasks(
  answers: PlannerAnswers & { community_intro?: string },
): PlannerTask[] {
  const proximity = arrivalProximity(answers.arrival_date);
  const tasks: PlannerTask[] = [];

  for (const entry of CATALOG) {
    const triggered = entry.key === "community_connect" ? COMMUNITY_GAP(answers) : entry.gap(answers);
    if (!triggered) continue;
    const deadlineUrgency = round4(
      PHASE_DEADLINE_BASE[entry.phase] * 0.5 + entry.baseUrgency * 0.3 + proximity * 0.2,
    );
    const sourceTrust = entry.sourceHasLink ? 0.8 : 0.4;
    const priority = round4(
      deadlineUrgency * 0.4 + entry.legalDependency * 0.25 + 1.0 * 0.25 + sourceTrust * 0.1,
    );
    tasks.push({ key: entry.key, title: entry.title, phase: entry.phase, priority });
  }

  return tasks.sort((a, b) =>
    PHASE_ORDER[a.phase] !== PHASE_ORDER[b.phase]
      ? PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase]
      : b.priority - a.priority,
  );
}

/** Görevleri faza göre gruplar (timeline görünümü için). */
export function groupTasksByPhase(tasks: PlannerTask[]): Array<{ phase: PlannerPhase; tasks: PlannerTask[] }> {
  const phases = Object.keys(PHASE_ORDER) as PlannerPhase[];
  return phases
    .map((phase) => ({ phase, tasks: tasks.filter((t) => t.phase === phase) }))
    .filter((g) => g.tasks.length > 0);
}
