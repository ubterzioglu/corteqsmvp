// scripts/social-generate/index.mjs
// CLI: BURAK_SHARE_TOOLS içeriğinden LinkedIn görselleri üretir.
// Kullanım:
//   node scripts/social-generate/index.mjs --tool burak-tool-1 --variant 1
//   node scripts/social-generate/index.mjs --tool burak-tool-1
//   node scripts/social-generate/index.mjs --all
//   node scripts/social-generate/index.mjs --all --force-backgrounds

import path from 'node:path';

import { OUTPUT_ROOT } from './config.mjs';
import { composePost } from './compose.mjs';
import { shortDescription } from './text-utils.mjs';
import { writeManifestAndReport } from './manifest.mjs';
import { loadBurakShareTools } from './load-tools.mjs';

function parseArgs(argv) {
  const args = { tool: null, variant: null, all: false, forceBackgrounds: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--tool') args.tool = argv[++i];
    else if (arg === '--variant') args.variant = Number(argv[++i]);
    else if (arg === '--all') args.all = true;
    else if (arg === '--force-backgrounds') args.forceBackgrounds = true;
  }
  return args;
}

function selectTargets(tools, args) {
  const targets = [];
  const selectedTools = args.all
    ? tools
    : tools.filter((t) => t.id === args.tool);

  if (!args.all && selectedTools.length === 0) {
    throw new Error(`--tool ${args.tool} bulunamadı`);
  }

  for (const tool of selectedTools) {
    const variantIndexes = args.variant
      ? [args.variant - 1]
      : tool.variants.map((_, i) => i);

    for (const variantIndex of variantIndexes) {
      if (variantIndex < 0 || variantIndex >= tool.variants.length) {
        throw new Error(`${tool.id} için geçersiz varyant: ${variantIndex + 1}`);
      }
      targets.push({ tool, variantIndex });
    }
  }
  return targets;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.all && !args.tool) {
    console.error('Kullanım: --tool <id> [--variant <1-3>] | --all [--force-backgrounds]');
    process.exitCode = 1;
    return;
  }

  const repoRoot = process.cwd();
  const tools = await loadBurakShareTools(repoRoot);
  const targets = selectTargets(tools, args);

  const entries = [];
  let successCount = 0;

  for (const { tool, variantIndex } of targets) {
    const variant = tool.variants[variantIndex];
    const result = await composePost({
      tool,
      variantIndex,
      force: args.forceBackgrounds,
      outputRoot: path.join(repoRoot, OUTPUT_ROOT),
    });

    if (result.status === 'success') successCount++;

    entries.push({
      toolId: tool.id,
      toolName: tool.name,
      variant: variantIndex + 1,
      canvaPrompt: variant.canvaPrompt,
      linkedinPost: variant.linkedinPost,
      shortDescription: shortDescription(tool.description),
      backgroundPath: result.backgroundPath,
      outputPath: result.outputPath,
      generatedAt: new Date().toISOString(),
      backgroundMethod: 'deterministic-svg',
      status: result.status,
      ...(result.error ? { error: result.error } : {}),
    });

    console.log(
      `${result.status === 'success' ? '✓' : '✗'} ${tool.id} varyant ${variantIndex + 1}${
        result.error ? ` — ${result.error}` : ''
      }`,
    );
  }

  const { manifestPath, reportPath } = await writeManifestAndReport(
    entries,
    path.join(repoRoot, OUTPUT_ROOT),
  );

  console.log(`\n${successCount} / ${entries.length} görsel üretildi.`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Rapor: ${reportPath}`);
}

main().catch((error) => {
  console.error('Üretim başarısız:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
