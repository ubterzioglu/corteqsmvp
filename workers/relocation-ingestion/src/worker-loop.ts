// Worker döngüsü: claim → provider fetch → normalize → upsert candidate → complete(review).
// Maliyet hard_cap aşılırsa budget_stopped. Service-finder worker-loop deseni (sade).
import {
  claimJobs,
  completeJob,
  failJob,
  heartbeat,
  recordCost,
  upsertCandidate,
  type Db,
} from "./db.js";
import { resolveSecret, type WorkerEnv } from "./env.js";
import { normalizeRecord } from "./normalize.js";
import { fixtureProvider } from "./providers/fixture.js";
import type { SourceProvider } from "./providers/types.js";
import type { RelocationJob } from "./types.js";

// Kayıtlı adapter'lar. Gerçek kaynaklar (Your Europe / BNetzA / Idealista) buraya eklenir.
const PROVIDERS: SourceProvider[] = [fixtureProvider];

function pickProvider(job: RelocationJob): SourceProvider | null {
  return PROVIDERS.find((p) => p.supports.includes(job.target_kind)) ?? null;
}

async function processJob(env: WorkerEnv, db: Db, job: RelocationJob): Promise<void> {
  const provider = pickProvider(job);
  if (!provider) {
    await failJob(db, job.id, env.RELOCATION_WORKER_ID, "rl_no_provider", `target_kind=${job.target_kind} için adapter yok`, false);
    return;
  }

  let costTotal = job.cost_total_usd;
  const records = await provider.fetch({
    job,
    resolveSecret,
    recordCost: async (amountUsd, meta) => {
      costTotal = await recordCost(db, {
        job_id: job.id,
        provider_key: provider.key,
        event_type: "fetch",
        billing_unit: "request",
        quantity: 1,
        unit_cost_usd: amountUsd,
        amount_usd: amountUsd,
        request_meta: meta,
      });
    },
  });

  await heartbeat(db, job.id, env.RELOCATION_WORKER_ID, { fetched: records.length });

  if (costTotal > job.hard_cap_usd) {
    await completeJob(db, job.id, env.RELOCATION_WORKER_ID, "budget_stopped", {
      reason: "hard_cap_exceeded",
      cost_total_usd: costTotal,
    });
    return;
  }

  let inserted = 0;
  for (const record of records) {
    const candidate = normalizeRecord(job, record);
    const id = await upsertCandidate(db, job.id, candidate);
    if (id) inserted += 1;
  }

  await completeJob(db, job.id, env.RELOCATION_WORKER_ID, "review", {
    fetched: records.length,
    inserted,
    cost_total_usd: costTotal,
  });
}

export async function runWorkerLoop(env: WorkerEnv, db: Db): Promise<void> {
  console.log(`Relocation ingestion worker başladı: ${env.RELOCATION_WORKER_ID}`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let jobs: RelocationJob[] = [];
    try {
      jobs = await claimJobs(db, env.RELOCATION_WORKER_ID, env.RELOCATION_CLAIM_LIMIT);
    } catch (error: unknown) {
      console.error("claimJobs hatası:", error instanceof Error ? error.message : error);
    }

    if (jobs.length === 0) {
      await new Promise((r) => setTimeout(r, env.RELOCATION_POLL_MS));
      continue;
    }

    for (const job of jobs) {
      try {
        await processJob(env, db, job);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Job ${job.id} hatası:`, message);
        await failJob(db, job.id, env.RELOCATION_WORKER_ID, "rl_job_error", message, true);
      }
    }
  }
}
