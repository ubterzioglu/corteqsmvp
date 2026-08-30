import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // Tam suite paralel yük altında 5 sn'lik varsayılan zaman aşımına takılıp flaky
    // kızarıyor (2026-07-30 ölçümü: eşzamanlı koşuda 40 test kırmızı, izole 21/21 yeşil;
    // dosya süreleri 1 sn -> 17-53 sn'ye çıkıyordu). Testlerin kendisi hızlı — sınır,
    // makine yükü payı bırakacak kadar gevşetildi.
    testTimeout: 15_000,
    execArgv: ["--no-deprecation"],
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "scripts/**/*.test.mjs",
      "workers/service-finder/src/**/*.test.ts",
      // Edge Function'ların paylaşılan saf modülleri — Deno API'si
      // kullanmadıkları için Node/jsdom altında da koşarlar.
      "supabase/functions/_shared/**/*.test.ts",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
