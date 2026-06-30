// StepStone Maaş Karşılaştırma (Almanya) — StepStone Gehaltsreport 2026 verileri (medyan, €/yıl).
// Kaynak: ref101/lib/salary/stepstone-data.ts (StepStone Gehaltsreport 2026). VERİ BİREBİR.
// Saf veri + karşılaştırma; DB yok. Veriler 2026 raporuna dayanır, bilgilendirme amaçlıdır.

export const STEPSTONE_2026 = {
  overall: { median: 53900, mean: 59100 },
  experience: {
    "<1": 46250,
    "1-2": 48400,
    "3-5": 51700,
    "6-10": 55500,
    "11-25": 59500,
    ">25": 60000,
  } as Record<string, number>,
  states: {
    SH: 51750, MV: 47750, HH: 60000, BB: 49250, HB: 55750, BE: 56500, NI: 52750, ST: 48250,
    NRW: 55250, SN: 49000, RP: 53250, TH: 48500, SL: 52750, HE: 58250, BW: 58500, BY: 57750,
  } as Record<string, number>,
  cities: {
    Berlin: 56500, Bremen: 56000, Dresden: 51000, Düsseldorf: 59750, Erfurt: 49500, Hamburg: 60000,
    Hannover: 56750, Kiel: 54000, Magdeburg: 49500, Mainz: 57250, München: 64750, Potsdam: 52750,
    Saarbrücken: 55500, Schwerin: 49500, Stuttgart: 63750, Wiesbaden: 60750, Bielefeld: 56000,
    Bochum: 54000, Dortmund: 55500, Duisburg: 54750, Essen: 55750, "Frankfurt am Main": 64000,
    Köln: 58500, Leipzig: 51250, Nürnberg: 58000, Wuppertal: 55250,
  } as Record<string, number>,
  companySize: {
    "1-50": 48800, "51-500": 54100, "501-5000": 59750, ">5000": 63000,
  } as Record<string, number>,
  education: { yes: 68250, no: 51200 } as Record<string, number>,
  responsibility: { yes: 62000, no: 51300 } as Record<string, number>,
  gender: { m: 55900, f: 50500 } as Record<string, number>,
  jobGroups: {
    Bildung: 60250, Büromanagement: 47250, "Einkauf, Vertrieb & Handel": 60500,
    "Finanzen & Rechnungswesen": 59250, "Gaststätten, Hotellerie und Tourismus": 50500,
    "Gebäudetechnik & Versorgung": 51250, "Gesundheits- und Pflegeberufe": 53000, Altenpflege: 52250,
    "Arzt- & Praxishilfe": 49000, "Human- & Zahnmedizin": 105500, "Pflege, Rettung und Geburtshilfe": 58000,
    Handwerk: 48750, "Hoch- & Tiefbau": 54000, "Informationstechnologie (IT)": 66750,
    Ingenieurwesen: 75000, Lebensmittelproduktion: 46500, "Logistik & Verkehr": 49750,
    "Marketing, Medien & Kommunikation": 57250, "Maschinen- & Fahrzeugtechnik": 57250,
    "Mechatronik & Elektrotechnik": 53500, "Metallbau & -verarbeitung": 49500, Personalwesen: 54500,
    "Recht & Verwaltung": 57500, "Soziale Berufe": 52500, "Technische Entwicklung & Konstruktion": 72250,
    "Unternehmensorganisation und Management": 66750, Verkauf: 48750,
  } as Record<string, number>,
};

export const STEPSTONE_EXPERIENCE_OPTIONS = [
  { value: "<1", label: "< 1 yıl" },
  { value: "1-2", label: "1–2 yıl" },
  { value: "3-5", label: "3–5 yıl" },
  { value: "6-10", label: "6–10 yıl" },
  { value: "11-25", label: "11–25 yıl" },
  { value: ">25", label: "> 25 yıl" },
] as const;

export const STEPSTONE_COMPANY_SIZE_OPTIONS = [
  { value: "1-50", label: "1–50 çalışan" },
  { value: "51-500", label: "51–500 çalışan" },
  { value: "501-5000", label: "501–5.000 çalışan" },
  { value: ">5000", label: "> 5.000 çalışan" },
] as const;

export function getStepstoneJobGroups(): string[] {
  return Object.keys(STEPSTONE_2026.jobGroups).sort((a, b) => a.localeCompare(b, "de"));
}

export function getStepstoneCities(): string[] {
  return Object.keys(STEPSTONE_2026.cities).sort((a, b) => a.localeCompare(b, "de"));
}

export interface StepstoneBenchmark {
  key: string;
  label: string;
  median: number;
}

export interface StepstoneComparison {
  /** Kullanıcının kıyaslayacağı medyanlar (seçilen kriterlere göre). */
  benchmarks: StepstoneBenchmark[];
  /** En anlamlı tek referans (job group varsa o, yoksa genel). */
  primaryMedian: number;
  /** Kullanıcı maaşı verildiyse: medyana göre fark (yüzde, +/-). */
  diffPercent: number | null;
}

export interface StepstoneSelection {
  jobGroup?: string;
  experience?: string;
  city?: string;
  companySize?: string;
  salary?: number;
}

/** Seçimlere göre ilgili medyanları topla + kullanıcı maaşını birincil medyanla kıyasla. */
export function compareStepstone(sel: StepstoneSelection): StepstoneComparison {
  const benchmarks: StepstoneBenchmark[] = [
    { key: "overall", label: "Genel medyan", median: STEPSTONE_2026.overall.median },
  ];

  if (sel.jobGroup && STEPSTONE_2026.jobGroups[sel.jobGroup] !== undefined) {
    benchmarks.push({
      key: "jobGroup",
      label: `Meslek grubu: ${sel.jobGroup}`,
      median: STEPSTONE_2026.jobGroups[sel.jobGroup],
    });
  }
  if (sel.experience && STEPSTONE_2026.experience[sel.experience] !== undefined) {
    benchmarks.push({
      key: "experience",
      label: `Deneyim: ${sel.experience} yıl`,
      median: STEPSTONE_2026.experience[sel.experience],
    });
  }
  if (sel.city && STEPSTONE_2026.cities[sel.city] !== undefined) {
    benchmarks.push({
      key: "city",
      label: `Şehir: ${sel.city}`,
      median: STEPSTONE_2026.cities[sel.city],
    });
  }
  if (sel.companySize && STEPSTONE_2026.companySize[sel.companySize] !== undefined) {
    benchmarks.push({
      key: "companySize",
      label: `Şirket büyüklüğü: ${sel.companySize}`,
      median: STEPSTONE_2026.companySize[sel.companySize],
    });
  }

  // Birincil referans: meslek grubu > deneyim > genel.
  const primaryMedian =
    benchmarks.find((b) => b.key === "jobGroup")?.median ??
    benchmarks.find((b) => b.key === "experience")?.median ??
    STEPSTONE_2026.overall.median;

  const diffPercent =
    sel.salary && sel.salary > 0
      ? Math.round(((sel.salary - primaryMedian) / primaryMedian) * 1000) / 10
      : null;

  return { benchmarks, primaryMedian, diffPercent };
}
