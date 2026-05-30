import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const distAssetsDir = path.join(distDir, "assets");
const args = process.argv.slice(2);
const baseUrlArg = args.find((arg) => arg.startsWith("--base-url="));
const baseUrlValue = baseUrlArg
  ? baseUrlArg.slice("--base-url=".length)
  : process.env.BASE_URL ?? process.env.npm_config_base_url ?? null;
const baseUrl = baseUrlValue ? baseUrlValue.replace(/\/+$/, "") : null;

const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exit(1);
};

const ok = (message) => {
  console.log(`OK: ${message}`);
};

const matchesExpectedContentType = (contentType, expectedContentTypes) => {
  if (!expectedContentTypes) {
    return true;
  }

  return expectedContentTypes.some((expected) => contentType.startsWith(expected));
};

const ensureStatusOk = async (url, expectedContentTypes) => {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    fail(`${url} returned ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!matchesExpectedContentType(contentType, expectedContentTypes)) {
    fail(`${url} returned unexpected content-type ${contentType}`);
  }

  return response;
};

const extractHtmlAssets = (html) => {
  const scriptMatch = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/i);
  const styleMatch = html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/i);

  if (!scriptMatch?.[1]) {
    fail("dist/index.html does not contain the main module script");
  }

  if (!styleMatch?.[1]) {
    fail("dist/index.html does not contain the main stylesheet");
  }

  return {
    mainScript: scriptMatch[1],
    mainStyle: styleMatch[1],
  };
};

const extractMuhasebeChunks = (jsSource) => {
  const matches = jsSource.match(/(?:\/)?assets\/(?:MuhasebeLayout|MuhasebeDashboard|GiderlerPage|GelirlerPage|NakitAkisiPage)-[^"')\\\s]+\.js/g) ?? [];
  return [...new Set(matches)].map((chunkPath) => (chunkPath.startsWith("/") ? chunkPath : `/${chunkPath}`));
};

const verifyLocalRelease = async () => {
  const html = await readFile(path.join(distDir, "index.html"), "utf8");
  const { mainScript, mainStyle } = extractHtmlAssets(html);
  const assets = new Set(await readdir(distAssetsDir));

  for (const assetPath of [mainScript, mainStyle]) {
    const fileName = path.basename(assetPath);
    if (!assets.has(fileName)) {
      fail(`missing built asset ${fileName}`);
    }
    ok(`found built asset ${fileName}`);
  }

  const mainScriptPath = path.join(distDir, mainScript.replace(/^\/+/, ""));
  const mainScriptSource = await readFile(mainScriptPath, "utf8");
  const muhasebeChunks = extractMuhasebeChunks(mainScriptSource);

  if (muhasebeChunks.length === 0) {
    fail("could not find muhasebe lazy chunks in the built main bundle");
  }

  for (const chunkPath of muhasebeChunks) {
    const fileName = path.basename(chunkPath);
    if (!assets.has(fileName)) {
      fail(`missing muhasebe chunk ${fileName}`);
    }
    ok(`found muhasebe chunk ${fileName}`);
  }
};

const verifyRemoteRelease = async () => {
  const htmlResponse = await ensureStatusOk(`${baseUrl}/admin/muhasebe`, ["text/html"]);
  const html = await htmlResponse.text();
  const { mainScript, mainStyle } = extractHtmlAssets(html);

  await ensureStatusOk(`${baseUrl}${mainScript}`, ["text/javascript", "application/javascript"]);
  ok(`remote main script is reachable: ${mainScript}`);

  await ensureStatusOk(`${baseUrl}${mainStyle}`, ["text/css"]);
  ok(`remote stylesheet is reachable: ${mainStyle}`);

  const mainScriptResponse = await ensureStatusOk(`${baseUrl}${mainScript}`, ["text/javascript", "application/javascript"]);
  const mainScriptSource = await mainScriptResponse.text();
  const muhasebeChunks = extractMuhasebeChunks(mainScriptSource);

  if (muhasebeChunks.length === 0) {
    fail("could not find muhasebe lazy chunks in the remote main bundle");
  }

  for (const chunkPath of muhasebeChunks) {
    await ensureStatusOk(`${baseUrl}${chunkPath}`, ["text/javascript", "application/javascript"]);
    ok(`remote muhasebe chunk is reachable: ${chunkPath}`);
  }
};

await verifyLocalRelease();
ok("local dist release looks consistent");

if (baseUrl) {
  await verifyRemoteRelease();
  ok(`remote release check passed for ${baseUrl}`);
}
