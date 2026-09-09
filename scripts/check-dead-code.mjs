import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs"];

// These files are loaded by tool configuration rather than by the application import graph.
export const CONFIG_REFERENCED_EXCEPTIONS = new Set([
  "src/test/setup.ts", // vitest.config.ts setupFiles string
  "src/vite-env.d.ts", // ambient Vite declarations included by TypeScript
]);

// Existing unreachable production files are an explicit baseline. New entries fail the check;
// deleting a baseline entry is reported as stale so the list gets smaller over time.
export const KNOWN_DEAD_FILES = new Set([
  // Public barrel reserved for new admin-shell consumers; current code imports concrete files.
  "src/components/admin/shell/index.ts",
]);

const normalizePath = (value) => value.replaceAll("\\", "/").replace(/^\.\//, "");

export function isTestFile(filePath) {
  return /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(filePath);
}

function stripComments(source) {
  let result = "";
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === "\n") {
        lineComment = false;
        result += character;
      } else {
        result += " ";
      }
      continue;
    }

    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        result += "  ";
        index += 1;
      } else {
        result += character === "\n" ? "\n" : " ";
      }
      continue;
    }

    if (quote) {
      result += character;
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      result += character;
    } else if (character === "/" && next === "/") {
      lineComment = true;
      result += "  ";
      index += 1;
    } else if (character === "/" && next === "*") {
      blockComment = true;
      result += "  ";
      index += 1;
    } else {
      result += character;
    }
  }

  return result;
}

export function extractModuleSpecifiers(source) {
  const code = stripComments(source);
  const matches = [];
  const patterns = [
    /(?<![\w$-])(?:import|export)\s+(?:type\s+)?[^;]*?\sfrom\s*["']([^"']+)["']/g,
    /(?<![\w$-])import\s*["']([^"']+)["']/g,
    /(?<![\w$-])import\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      matches.push({ index: match.index ?? 0, specifier: match[1] });
    }
  }

  matches.sort((left, right) => left.index - right.index);
  return [...new Set(matches.map(({ specifier }) => specifier))];
}

export function resolveLocalModule(fromFile, specifier, sourceFiles) {
  let basePath;
  if (specifier.startsWith("@/")) {
    basePath = `src/${specifier.slice(2)}`;
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    basePath = path.posix.join(path.posix.dirname(normalizePath(fromFile)), specifier);
  } else {
    return null;
  }

  const normalizedBase = normalizePath(path.posix.normalize(basePath));
  const hasSourceExtension = SOURCE_EXTENSIONS.includes(path.posix.extname(normalizedBase));
  const candidates = hasSourceExtension
    ? [normalizedBase]
    : [
        ...SOURCE_EXTENSIONS.map((candidateExtension) => `${normalizedBase}${candidateExtension}`),
        ...SOURCE_EXTENSIONS.map((candidateExtension) =>
          `${normalizedBase}/index${candidateExtension}`,
        ),
      ];

  return candidates.find((candidate) => sourceFiles.has(candidate)) ?? null;
}

export function analyzeSourceGraph({
  sources,
  entry,
  knownDeadFiles = KNOWN_DEAD_FILES,
  configReferencedExceptions = CONFIG_REFERENCED_EXCEPTIONS,
}) {
  const sourceFiles = new Set(sources.keys());
  const reachable = new Set();
  const queue = [entry];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || reachable.has(current) || !sourceFiles.has(current)) continue;
    reachable.add(current);

    for (const specifier of extractModuleSpecifiers(sources.get(current))) {
      const resolved = resolveLocalModule(current, specifier, sourceFiles);
      if (resolved && !reachable.has(resolved)) queue.push(resolved);
    }
  }

  const unreachable = [...sourceFiles]
    .filter((filePath) => !reachable.has(filePath))
    .filter((filePath) => !isTestFile(filePath))
    .filter((filePath) => !configReferencedExceptions.has(filePath))
    .sort();

  return {
    reachable,
    knownDead: unreachable.filter((filePath) => knownDeadFiles.has(filePath)),
    newDead: unreachable.filter((filePath) => !knownDeadFiles.has(filePath)),
    staleBaseline: [...knownDeadFiles].filter((filePath) => !unreachable.includes(filePath)).sort(),
  };
}

function collectSources(directory, sources = new Map()) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectSources(absolutePath, sources);
      continue;
    }

    if (!SOURCE_EXTENSIONS.includes(path.extname(entry.name))) continue;
    const relativePath = normalizePath(path.relative(projectRoot, absolutePath));
    sources.set(relativePath, readFileSync(absolutePath, "utf8"));
  }
  return sources;
}

function main() {
  const sources = collectSources(path.join(projectRoot, "src"));
  const result = analyzeSourceGraph({ sources, entry: "src/main.tsx" });

  if (result.newDead.length > 0) {
    console.error(`[check-dead] ${result.newDead.length} yeni erişilemez kaynak dosyası:`);
    for (const filePath of result.newDead) console.error(`  - ${filePath}`);
  }

  if (result.staleBaseline.length > 0) {
    console.error(`[check-dead] ${result.staleBaseline.length} bayat baseline kaydı:`);
    for (const filePath of result.staleBaseline) console.error(`  - ${filePath}`);
  }

  if (result.newDead.length > 0 || result.staleBaseline.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(
    `[check-dead] 0 yeni erişilemez dosya · ${result.knownDead.length} bilinen borç · `
      + `${result.reachable.size} erişilebilir kaynak.`,
  );
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main();
}
