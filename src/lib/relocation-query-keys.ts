// Relocation modülü — React Query anahtar fabrikası (service-finder kalıbı).

export const relocationKeys = {
  all: ["relocation"] as const,
  moves: () => [...relocationKeys.all, "moves"] as const,
  move: (moveId: string) => [...relocationKeys.all, "move", moveId] as const,
  locationRecommendations: (moveId: string) =>
    [...relocationKeys.all, "recommendations", "locations", moveId] as const,
  serviceRecommendations: (moveId: string, category: string) =>
    [...relocationKeys.all, "recommendations", "services", moveId, category] as const,
  checklist: (moveId: string) => [...relocationKeys.all, "checklist", moveId] as const,
  emergencyContacts: (countryCode: string, cityCode?: string) =>
    [...relocationKeys.all, "emergency", countryCode, cityCode ?? "_"] as const,

  // İçerik + ilerleme (20260920120000_relocation_content_and_progress.sql).
  livingCosts: (countryCodes: string[]) =>
    [...relocationKeys.all, "living-costs", [...countryCodes].sort().join(",")] as const,
  requiredDocuments: (countryCodes: string[]) =>
    [...relocationKeys.all, "required-documents", [...countryCodes].sort().join(",")] as const,
  moveProgress: (moveId: string) => [...relocationKeys.all, "progress", moveId] as const,
  moveDocuments: (moveId: string) => [...relocationKeys.all, "documents", moveId] as const,
} as const;
