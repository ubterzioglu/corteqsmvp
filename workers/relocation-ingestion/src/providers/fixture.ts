// Fixture provider — gerçek kaynak adapter'ları gelene kadar deterministik örnek üretir.
// Dataset-acceptance-contract.md: Faz 2 worker'ı fixture ile uçtan uca doğrulanır.
// Gerçek adapter (Your Europe / BNetzA / Idealista vb.) bu sözleşmeyi izleyerek eklenir.

import type { ProviderContext, RawRecord, SourceProvider } from "./types.js";

export const fixtureProvider: SourceProvider = {
  key: "fixture",
  supports: ["service", "bureaucratic_step", "emergency_contact"],
  async fetch(ctx: ProviderContext): Promise<RawRecord[]> {
    const { job } = ctx;
    // Maliyet: fixture ücretsiz ama defter akışını doğrulamak için 0 USD kaydı düşülür.
    await ctx.recordCost(0, { provider: "fixture", target_kind: job.target_kind });

    if (job.target_kind === "service") {
      return [
        {
          source_url: "https://example.org/fixture-service",
          raw: {
            category: job.service_category ?? "gsm_operator",
            provider_name: `Örnek ${job.service_category ?? "Servis"} — ${job.country_code}`,
            country_code: job.country_code,
            city_code: job.city_code,
            languages: ["tr", "en"],
            trust_score: 0.6,
          },
        },
      ];
    }
    if (job.target_kind === "bureaucratic_step") {
      return [
        {
          source_url: "https://example.org/fixture-step",
          raw: {
            country_code: job.country_code,
            city_code: job.city_code,
            name: `Örnek bürokrasi adımı — ${job.country_code}`,
            trigger: "after_arrival",
            deadline_rule: "within_14_days",
            required_documents: ["passport"],
          },
        },
      ];
    }
    return [
      {
        source_url: "https://example.org/fixture-emergency",
        raw: {
          country_code: job.country_code,
          city_code: job.city_code,
          type: "emergency",
          label: `Acil — ${job.country_code}`,
          phone: "112",
        },
      },
    ];
  },
};
