import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  RELOCATION_WORKER_ID: z.string().default(`rl-worker-${process.pid}`),
  RELOCATION_POLL_MS: z.coerce.number().int().min(1000).default(5000),
  RELOCATION_HEARTBEAT_MS: z.coerce.number().int().min(5000).default(60_000),
  RELOCATION_CLAIM_LIMIT: z.coerce.number().int().min(1).max(10).default(2),
  // Kaynak adapter anahtarları (secret_ref = source_registry'deki env adı; optional).
  // Gerçek adapter eklendiğinde ilgili env eklenir.
});

export type WorkerEnv = z.infer<typeof envSchema>;

export function loadEnv(): WorkerEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Relocation ingestion worker env eksik/geçersiz: ${detail}`);
  }
  return parsed.data;
}

/** secret_ref (env değişken adı) → gerçek anahtar. Ham anahtar asla loglanmaz. */
export function resolveSecret(secretRef: string): string {
  const value = process.env[secretRef];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Kaynak anahtarı bulunamadı: env ${secretRef} tanımlı değil`);
  }
  return value;
}
