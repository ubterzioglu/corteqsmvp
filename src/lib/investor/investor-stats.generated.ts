// BU DOSYA ÜRETİLİR — elle düzenleme. Kaynak: scripts/generate-investor-stats.mjs
// Güncellemek için: npm run investor:stats

export const INVESTOR_REPO_STATS = {
  "measuredAt": "2026-10-09",
  "sourceFiles": 1039,
  "productionLines": 152480,
  "testFiles": 490,
  "e2eSpecs": 11,
  "pages": 182,
  "components": 401,
  "lazyRoutes": 68,
  "edgeFunctions": 19,
  "migrations": 529,
  "versions": {
    "react": "18.3.1",
    "typescript": "5.8.3",
    "vite": "8.2.2",
    "react-router-dom": "7.17.0",
    "@tanstack/react-query": "5.83.0",
    "tailwindcss": "3.4.17",
    "zod": "3.25.76",
    "react-hook-form": "7.61.1",
    "framer-motion": "12.40.0",
    "@supabase/supabase-js": "2.108.2",
    "vitest": "4.1.11",
    "@playwright/test": "1.57.0"
  },
  "node": ">=22"
} as const;
