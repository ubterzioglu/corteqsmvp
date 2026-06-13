import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  TAVILY_API_KEY: z.string().optional(),
  SERPAPI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  SERVICE_FINDER_WORKER_ID: z.string().default(`sf-worker-${process.pid}`),
  SERVICE_FINDER_POLL_MS: z.coerce.number().int().min(1000).default(5000),
  SERVICE_FINDER_HEARTBEAT_MS: z.coerce.number().int().min(5000).default(60_000),
  SERVICE_FINDER_ENABLE_SERPAPI_FALLBACK: z
    .string()
    .default("true")
    .transform((value) => value !== "false" && value !== "0"),
});

export type WorkerEnv = z.infer<typeof envSchema>;

export function loadEnv(): WorkerEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Service Finder worker env eksik/geçersiz: ${detail}`);
  }
  return parsed.data;
}

/** secret_ref (env değişken adı) → gerçek anahtar. Ham anahtar asla loglanmaz. */
export function resolveSecret(env: WorkerEnv, secretRef: string): string {
  const value = (env as Record<string, unknown>)[secretRef] ?? process.env[secretRef];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Sağlayıcı anahtarı bulunamadı: env ${secretRef} tanımlı değil`);
  }
  return value;
}
