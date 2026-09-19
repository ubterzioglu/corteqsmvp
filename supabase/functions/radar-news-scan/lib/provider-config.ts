/**
 * Multi-provider rotation system for Radar news scanning.
 * 
 * Supports free providers (GDELT, RSS, Atom) and paid providers (NewsAPI, GNews, Bing News, TheNewsAPI).
 * Providers can be individually enabled/disabled via environment variables.
 * Rotation strategies: round-robin, fallback, scheduled, weighted.
 * 
 * Env vars:
 *   RADAR_PROVIDER_ROTATION - Rotation strategy: "round-robin" | "fallback" | "scheduled" | "weighted" (default: "round-robin")
 *   RADAR_PROVIDERS_ENABLED - Comma-separated list of enabled provider keys (default: all with valid API keys)
 *   RADAR_PROVIDER_SCHEDULE - For "scheduled" strategy: JSON mapping day-of-week to provider key
 *   RADAR_PROVIDER_WEIGHTS - For "weighted" strategy: JSON mapping provider key to weight (0-100)
 * 
 * Provider-specific env vars:
 *   NEWSAPI_KEY - NewsAPI.org API key
 *   GNEWS_KEY - GNews.io API key
 *   BING_NEWS_KEY - Bing News Search API key (Azure)
 *   THENEWSAPI_KEY - TheNewsAPI.com API key
 */

export type ProviderTier = "free" | "paid";

export type ProviderConfig = {
  key: string;
  name: string;
  tier: ProviderTier;
  adapterKey: string;
  envKey: string | null;
  enabled: boolean;
  priority: number;
  rateLimit: {
    max: number;
    windowMs: number;
  };
};

export type RotationStrategy = "round-robin" | "fallback" | "scheduled" | "weighted";

const ALL_PROVIDERS: ProviderConfig[] = [
  {
    key: "gdelt",
    name: "GDELT Project",
    tier: "free",
    adapterKey: "gdelt_doc_v2",
    envKey: null,
    enabled: true,
    priority: 10,
    rateLimit: { max: 100, windowMs: 60_000 },
  },
  {
    key: "rss",
    name: "RSS Feeds",
    tier: "free",
    adapterKey: "rss",
    envKey: null,
    enabled: true,
    priority: 20,
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  {
    key: "atom",
    name: "Atom Feeds",
    tier: "free",
    adapterKey: "atom",
    envKey: null,
    enabled: true,
    priority: 21,
    rateLimit: { max: 60, windowMs: 60_000 },
  },
  {
    key: "newsapi",
    name: "NewsAPI.org",
    tier: "paid",
    adapterKey: "newsapi",
    envKey: "NEWSAPI_KEY",
    enabled: false,
    priority: 50,
    rateLimit: { max: 1000, windowMs: 86_400_000 },
  },
  {
    key: "gnews",
    name: "GNews.io",
    tier: "paid",
    adapterKey: "gnews",
    envKey: "GNEWS_KEY",
    enabled: false,
    priority: 51,
    rateLimit: { max: 100, windowMs: 86_400_000 },
  },
  {
    key: "bing",
    name: "Bing News Search",
    tier: "paid",
    adapterKey: "bing_news",
    envKey: "BING_NEWS_KEY",
    enabled: false,
    priority: 52,
    rateLimit: { max: 1000, windowMs: 86_400_000 },
  },
  {
    key: "thenewsapi",
    name: "TheNewsAPI.com",
    tier: "paid",
    adapterKey: "thenewsapi",
    envKey: "THENEWSAPI_KEY",
    enabled: false,
    priority: 53,
    rateLimit: { max: 1500, windowMs: 86_400_000 },
  },
];

export function getRotationStrategy(): RotationStrategy {
  const raw = Deno.env.get("RADAR_PROVIDER_ROTATION") ?? "round-robin";
  const valid: RotationStrategy[] = ["round-robin", "fallback", "scheduled", "weighted"];
  return valid.includes(raw as RotationStrategy) ? (raw as RotationStrategy) : "round-robin";
}

export function getEnabledProviders(): ProviderConfig[] {
  const enabledOverride = Deno.env.get("RADAR_PROVIDERS_ENABLED");
  
  let enabledKeys: Set<string>;
  if (enabledOverride) {
    enabledKeys = new Set(enabledOverride.split(",").map((k) => k.trim()).filter(Boolean));
  } else {
    enabledKeys = new Set<string>();
    for (const provider of ALL_PROVIDERS) {
      if (!provider.envKey) {
        enabledKeys.add(provider.key);
      } else if (Deno.env.get(provider.envKey)) {
        enabledKeys.add(provider.key);
      }
    }
  }

  return ALL_PROVIDERS
    .filter((p) => enabledKeys.has(p.key))
    .sort((a, b) => a.priority - b.priority);
}

export function selectProviderForScan(providers: ProviderConfig[], scanIndex: number = 0): ProviderConfig | null {
  if (providers.length === 0) return null;

  const strategy = getRotationStrategy();

  switch (strategy) {
    case "round-robin": {
      return providers[scanIndex % providers.length];
    }

    case "fallback": {
      return providers[0];
    }

    case "scheduled": {
      const scheduleRaw = Deno.env.get("RADAR_PROVIDER_SCHEDULE");
      if (!scheduleRaw) return providers[0];
      
      try {
        const schedule = JSON.parse(scheduleRaw) as Record<string, string>;
        const dayOfWeek = new Date().getDay();
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const todayName = dayNames[dayOfWeek];
        const providerKey = schedule[todayName];
        
        if (providerKey) {
          const provider = providers.find((p) => p.key === providerKey);
          if (provider) return provider;
        }
        return providers[0];
      } catch {
        return providers[0];
      }
    }

    case "weighted": {
      const weightsRaw = Deno.env.get("RADAR_PROVIDER_WEIGHTS");
      if (!weightsRaw) return providers[0];
      
      try {
        const weights = JSON.parse(weightsRaw) as Record<string, number>;
        const totalWeight = providers.reduce((sum, p) => sum + (weights[p.key] ?? 1), 0);
        let random = Math.random() * totalWeight;
        
        for (const provider of providers) {
          random -= weights[provider.key] ?? 1;
          if (random <= 0) return provider;
        }
        return providers[0];
      } catch {
        return providers[0];
      }
    }

    default:
      return providers[0];
  }
}

export function getProviderByKey(key: string): ProviderConfig | undefined {
  return ALL_PROVIDERS.find((p) => p.key === key);
}

export function getApiKeyForProvider(providerKey: string): string | null {
  const provider = getProviderByKey(providerKey);
  if (!provider || !provider.envKey) return null;
  return Deno.env.get(provider.envKey) ?? null;
}
