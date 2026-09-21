import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoot = join(process.cwd(), "src");

function walkTsx(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walkTsx(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

function normalizePath(path: string): string {
  return path.split(/[?#]/, 1)[0] || "/";
}

function routeMatches(link: string, route: string): boolean {
  // Catch-all route, bir iç bağlantının gerçekten tanımlı olduğunun kanıtı değildir.
  if (route === "*") return false;
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  const pattern = `(?:^|/)${normalizedRoute.slice(1)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:[^/]+/g, "[^/]+")
    .replace(/\\\*/g, ".*")}$`;
  return new RegExp(pattern).test(link);
}

describe("internal link contract", () => {
  it("every literal absolute Link target has a declared route", () => {
    const files = walkTsx(sourceRoot);
    const routeFiles = files.filter((file) => file.endsWith("App.tsx") || file.endsWith("routes.tsx"));
    const routes = routeFiles.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const directPaths = [...source.matchAll(/\bpath\s*=\s*["']([^"']+)["']/g)].map((match) => match[1]);
      const nestedPaths = [...source.matchAll(
        /<Route\s+path=["']([^"']+)["'][\s\S]*?<Route\s+path=["']([^"']+)["']/g,
      )].map((match) => `${match[1]}/${match[2]}`);
      return [...directPaths, ...nestedPaths];
    });
    const links = files.flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(/\bto\s*=\s*["'](\/[^"']*)["']/g)].map((match) => ({
        file: relative(process.cwd(), file),
        path: normalizePath(match[1]),
      })),
    );

    const broken = links.filter(({ path }) => !routes.some((route) => routeMatches(path, route)));

    expect(broken, `Undeclared internal links: ${broken.map(({ file, path }) => `${file} → ${path}`).join(", ")}`).toEqual([]);
  });
});
