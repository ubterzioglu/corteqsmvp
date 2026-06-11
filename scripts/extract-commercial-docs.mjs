// Extracts the standalone info-*.html commercial documents into SPA-renderable
// fragments under src/content/commercial/ and pulls the shared embedded hero
// image out into public/commercial-docs/.
//
// Usage: node scripts/extract-commercial-docs.mjs
//
// The generated fragments are committed; re-run this script only when the
// source info-*.html documents change.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "src", "content", "commercial");
const publicImageDir = path.join(rootDir, "public", "commercial-docs");
const sharedImagePublicPath = "/commercial-docs/corteqs-doc-hero.png";

const SCOPE = ".cdoc";

const documents = [
  { slug: "contributor", source: "info-contributor.html" },
  { slug: "influencer-partner", source: "info-influencer-partner.html" },
  { slug: "strategic-partner", source: "info-strategic-partner.html" },
  { slug: "community-leader", source: "info-community-leader.html" },
  { slug: "ambassador", source: "info-ambassador.html" },
];

// Restores user-agent defaults inside the document so Tailwind's preflight
// reset does not alter the original standalone rendering. :where() keeps
// specificity at zero so every document rule still wins.
const preflightNeutralizer = [
  `${SCOPE} :where(*),`,
  `${SCOPE} :where(*)::before,`,
  `${SCOPE} :where(*)::after { all: revert; }`,
  // The documents relied on <body> as their canvas; the wrapper takes over.
  `${SCOPE} { position: relative; isolation: isolate; overflow: clip; }`,
].join("\n");

// Tailwind's .container utility (center + 2rem padding) collides with the
// documents' own .container class; undo the parts the documents do not set.
const containerOverride = `${SCOPE} .container { max-width: none; padding-left: 0; padding-right: 0; }`;

const transformSelectorPart = (part) => {
  const selector = part.trim();

  if (selector === ":root" || selector === "html" || selector === "body") {
    return SCOPE;
  }

  if (selector.startsWith("body")) {
    return `${SCOPE}${selector.slice("body".length)}`;
  }

  if (selector === "*") {
    return `${SCOPE}, ${SCOPE} *`;
  }

  return `${SCOPE} ${selector}`;
};

const transformSelectorList = (selectorList) =>
  selectorList
    .split(",")
    .map(transformSelectorPart)
    .join(",\n");

const findMatchingBrace = (css, openBraceIndex) => {
  let depth = 0;

  for (let i = openBraceIndex; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  throw new Error("Unbalanced braces in CSS input");
};

const scopeCss = (css) => {
  let output = "";
  let cursor = 0;

  while (cursor < css.length) {
    const braceIndex = css.indexOf("{", cursor);

    if (braceIndex === -1) {
      output += css.slice(cursor);
      break;
    }

    const prelude = css.slice(cursor, braceIndex);
    const closeIndex = findMatchingBrace(css, braceIndex);
    const block = css.slice(braceIndex + 1, closeIndex);
    const trimmedPrelude = prelude.trim();

    if (trimmedPrelude.startsWith("@media")) {
      output += `${prelude}{\n${scopeCss(block)}\n}`;
    } else if (trimmedPrelude.startsWith("@")) {
      output += `${prelude}{${block}}`;
    } else {
      const leadingWhitespace = prelude.slice(0, prelude.length - prelude.trimStart().length);
      output += `${leadingWhitespace}${transformSelectorList(trimmedPrelude)} {${block}}`;
    }

    cursor = closeIndex + 1;
  }

  return output;
};

// The documents used position:fixed only for decorative full-page layers
// (grid overlay, orbit circles). Inside the SPA they must stay within the
// document wrapper instead of overlaying the site chrome.
const pinDecorativeLayers = (css) => css.replaceAll("position:fixed", "position:absolute");

const extractSharedImage = (styleContent) => {
  const dataUriPattern = /url\(["']?data:image\/png;base64,([A-Za-z0-9+/=]+)["']?\)/g;
  let imageWritten = fs.existsSync(path.join(publicImageDir, "corteqs-doc-hero.png"));

  return styleContent.replace(dataUriPattern, (_, base64) => {
    if (!imageWritten) {
      fs.mkdirSync(publicImageDir, { recursive: true });
      fs.writeFileSync(
        path.join(publicImageDir, "corteqs-doc-hero.png"),
        Buffer.from(base64, "base64"),
      );
      imageWritten = true;
    }

    return `url("${sharedImagePublicPath}")`;
  });
};

const extractFragment = ({ slug, source }) => {
  const html = fs.readFileSync(path.join(rootDir, source), "utf-8");

  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);

  if (!styleMatch || !bodyMatch) {
    throw new Error(`Could not find <style> or <body> in ${source}`);
  }

  const styleWithoutImages = extractSharedImage(styleMatch[1]);
  const scopedCss = pinDecorativeLayers(scopeCss(styleWithoutImages));

  const fragment = [
    `<!-- AUTO-GENERATED from ${source} by scripts/extract-commercial-docs.mjs. -->`,
    `<!-- Edit the source document and re-run the script instead of editing this file. -->`,
    `<link rel="preconnect" href="https://fonts.googleapis.com">`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
    `<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">`,
    `<style>`,
    preflightNeutralizer,
    scopedCss.trim(),
    containerOverride,
    `</style>`,
    `<div class="cdoc">`,
    bodyMatch[1].trim(),
    `</div>`,
    ``,
  ].join("\n");

  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${slug}.html`);
  fs.writeFileSync(outputPath, fragment, "utf-8");

  return { slug, outputPath, size: fragment.length };
};

for (const document of documents) {
  const result = extractFragment(document);
  console.log(`${result.slug}: ${result.size} chars -> ${path.relative(rootDir, result.outputPath)}`);
}

console.log(`shared image -> public/commercial-docs/corteqs-doc-hero.png`);
