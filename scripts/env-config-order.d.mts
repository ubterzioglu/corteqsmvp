import type { Plugin } from "vite";

// vite.config.ts bu modülü import eder; tsconfig.node.json (typecheck:node) .mjs için tip bildirimi
// ister. Bu dosya yokken CI'nın ilk adımı (verify:quality) 12 Ekim'den beri TS7016 ile düşüyordu.
export declare function findEnvConfigOrderProblem(html: string): string | null;
export declare function envConfigOrderPlugin(options?: { htmlPath?: string }): Plugin;
