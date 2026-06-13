import { createDb } from "./db.js";
import { loadEnv } from "./env.js";
import { runWorkerLoop } from "./worker-loop.js";

async function main(): Promise<void> {
  const env = loadEnv();
  const db = createDb(env);

  const shutdown = (signal: string) => {
    console.log(`${signal} alındı; worker durduruluyor. Lease'ler 5 dk içinde düşer.`);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  await runWorkerLoop(env, db);
}

main().catch((error: unknown) => {
  console.error("Service Finder worker kritik hata ile durdu:", error);
  process.exit(1);
});
