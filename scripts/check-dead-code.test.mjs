import { describe, expect, it } from "vitest";

import {
  analyzeSourceGraph,
  extractModuleSpecifiers,
  isTestFile,
  resolveLocalModule,
} from "./check-dead-code.mjs";

describe("extractModuleSpecifiers", () => {
  it("extracts static, side-effect, re-export and dynamic imports", () => {
    const source = `
      import value from "./value";
      import "./styles.css";
      export { helper } from "@/lib/helper";
      const Page = lazy(() => import("./Page.tsx"));
    `;

    expect(extractModuleSpecifiers(source)).toEqual([
      "./value",
      "./styles.css",
      "@/lib/helper",
      "./Page.tsx",
    ]);
  });

  it("ignores imports that only appear in comments", () => {
    const source = `
      // import hidden from "./commented";
      /* export { hidden } from "./also-commented"; */
      import visible from "./visible";
    `;

    expect(extractModuleSpecifiers(source)).toEqual(["./visible"]);
  });

  it("does not interpret ordinary exported JSX as a re-export", () => {
    const source = `
      export const routes = <Route path="bulk-import" title="Bulk import" element={<Page />} />;
    `;

    expect(extractModuleSpecifiers(source)).toEqual([]);
  });
});

describe("resolveLocalModule", () => {
  const sourceFiles = new Set([
    "src/App.tsx",
    "src/lib/helper.ts",
    "src/lib/tools-catalog.generated.ts",
    "src/components/Card/index.tsx",
  ]);

  it("resolves relative and @ aliases with extension and index fallbacks", () => {
    expect(resolveLocalModule("src/main.tsx", "./App", sourceFiles)).toBe("src/App.tsx");
    expect(resolveLocalModule("src/main.tsx", "@/lib/helper", sourceFiles)).toBe(
      "src/lib/helper.ts",
    );
    expect(resolveLocalModule("src/pages/Page.tsx", "@/components/Card", sourceFiles)).toBe(
      "src/components/Card/index.tsx",
    );
    expect(
      resolveLocalModule("src/pages/Page.tsx", "@/lib/tools-catalog.generated", sourceFiles),
    ).toBe("src/lib/tools-catalog.generated.ts");
  });

  it("ignores packages and non-source assets", () => {
    expect(resolveLocalModule("src/main.tsx", "react", sourceFiles)).toBeNull();
    expect(resolveLocalModule("src/main.tsx", "./styles.css", sourceFiles)).toBeNull();
  });
});

describe("analyzeSourceGraph", () => {
  it("walks from main, excludes tests, and separates known dead files from new ones", () => {
    const sources = new Map([
      ["src/main.tsx", 'import App from "./App"; import "@/lib/live";'],
      ["src/App.tsx", 'const Page = lazy(() => import("./pages/Page"));'],
      ["src/pages/Page.tsx", "export default function Page() {}"],
      ["src/lib/live.ts", "export const live = true;"],
      ["src/lib/known-dead.ts", "export const old = true;"],
      ["src/lib/new-dead.ts", "export const stale = true;"],
      ["src/lib/live.test.ts", "test('live', () => {});"],
      ["src/test/setup.ts", "setup();"],
      ["src/vite-env.d.ts", '/// <reference types="vite/client" />'],
    ]);

    const result = analyzeSourceGraph({
      sources,
      entry: "src/main.tsx",
      knownDeadFiles: new Set(["src/lib/known-dead.ts"]),
      configReferencedExceptions: new Set(["src/test/setup.ts", "src/vite-env.d.ts"]),
    });

    expect(result.reachable).toEqual(
      new Set(["src/main.tsx", "src/App.tsx", "src/pages/Page.tsx", "src/lib/live.ts"]),
    );
    expect(result.knownDead).toEqual(["src/lib/known-dead.ts"]);
    expect(result.newDead).toEqual(["src/lib/new-dead.ts"]);
  });
});

describe("isTestFile", () => {
  it("recognizes test and spec source files without excluding config setup", () => {
    expect(isTestFile("src/lib/a.test.ts")).toBe(true);
    expect(isTestFile("src/lib/a.spec.tsx")).toBe(true);
    expect(isTestFile("src/test/setup.ts")).toBe(false);
  });
});
