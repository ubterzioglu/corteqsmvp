export type KadroDeptId = "kurucu" | "pazarlama" | "urun" | "operasyon" | "gelir" | "kurumsal";
export type KadroAxisId = "urun" | "islev" | "cografya" | "merkez";
export type KadroWaveId = 1 | 2 | 3;
export type KadroWorkType = "core" | "part" | "proje" | "topluluk" | "danisman" | "dis";
export type KadroStatus =
  | "dolu" | "destek" | "gorusme" | "aday" | "teklif" | "acik" | "beklemede";
export type KadroPriority = "kritik" | "yuksek" | "orta" | "dusuk";
export type KadroCandidateStage = "aday" | "gorusme" | "teklif" | "kapandi";

export type KadroRoleAd = {
  sum: string;
  does: string[];
  profile: string[];
  test: string;
};

export type KadroRole = {
  id: string;
  dept: KadroDeptId;
  axis: KadroAxisId;
  title: string;
  type: KadroWorkType;
  wave: KadroWaveId;
  pri: KadroPriority;
  status: KadroStatus;
  owner: string;
  reports: string;
  hours: string;
  pay: string;
  esop: string;
  kpi: string[];
  cadence: string;
  tools: string;
  trigger: string;
  exit: string;
  jd: string;
  ad: KadroRoleAd | null;
};

export type KadroRoleState = {
  roleKey: string;
  status: KadroStatus | null;
  priority: KadroPriority | null;
  ownerName: string | null;
  note: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

export type KadroResolvedRole = KadroRole & {
  currentStatus: KadroStatus;
  currentPriority: KadroPriority;
  currentOwner: string;
  note: string;
  hasState: boolean;
  updatedAt: string | null;
};

export type KadroRoleEvent = {
  id: string;
  roleKey: string;
  field: "status" | "priority" | "owner_name" | "note";
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string;
};

export type KadroCandidate = {
  id: string;
  roleKey: string;
  fullName: string;
  links: string;
  stage: KadroCandidateStage;
  note: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type KadroCandidateDraft = {
  fullName: string;
  links: string;
  stage: KadroCandidateStage;
  note: string;
};

export type KadroRoutine = {
  freq: "Günlük" | "Haftalık" | "Aylık" | "Yıllık";
  name: string;
  owner: string;
  detail: string;
};
