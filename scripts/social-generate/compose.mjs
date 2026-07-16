// scripts/social-generate/compose.mjs
// Arka plan (cache'lenmiş SVG→PNG) + logo + başlık/açıklama/CTA/domain metin
// katmanını Sharp ile birleştirip nihai 1200x1200 PNG üretir.

import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import {
  CANVAS_SIZE,
  COLORS,
  CTA_LABEL,
  DOMAIN_LABEL,
  FONT_FAMILY,
  GRID,
  LOGO_CROP,
  LOGO_PATH,
} from './config.mjs';
import { getMotifSvg } from './background-motifs.mjs';
import { shortDescription, wrapText, xmlEscape } from './text-utils.mjs';

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function backgroundSvg(tool, variantIndex) {
  const motif = getMotifSvg(tool.order, variantIndex);
  return `
<svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="${COLORS.navy}" />
  ${motif}
</svg>`;
}

export async function ensureBackground({ tool, variantIndex, force, backgroundsDir }) {
  await mkdir(backgroundsDir, { recursive: true });
  const backgroundPath = path.join(backgroundsDir, `${tool.id}-variant-${variantIndex + 1}.png`);

  if (!force && (await fileExists(backgroundPath))) {
    return backgroundPath;
  }

  const svg = backgroundSvg(tool, variantIndex);
  await sharp(Buffer.from(svg)).png().toFile(backgroundPath);
  return backgroundPath;
}

function overlaySvg(tool, variantIndex) {
  const categoryLabel = 'CorteQS Test Aracı';
  const title = xmlEscape(tool.name);
  const desc = xmlEscape(shortDescription(tool.description));
  const titleLines = wrapText(title, 26);
  const descLines = wrapText(desc, 46);

  const titleStartY = GRID.titleTop + 90;
  const titleLineHeight = 56;
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="${CANVAS_SIZE / 2}" y="${titleStartY + i * titleLineHeight}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="46" font-weight="700" fill="${COLORS.white}">${line}</text>`,
    )
    .join('');

  const descStartY = titleStartY + titleLines.length * titleLineHeight + 40;
  const descLineHeight = 34;
  const descSvg = descLines
    .map(
      (line, i) =>
        `<text x="${CANVAS_SIZE / 2}" y="${descStartY + i * descLineHeight}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="26" font-weight="400" fill="${COLORS.textMuted}">${line}</text>`,
    )
    .join('');

  const categoryY = GRID.headerTop + 70;
  const categorySvg = `
    <rect x="${CANVAS_SIZE - 340}" y="${categoryY - 34}" width="300" height="48" rx="24" fill="${COLORS.bronze}" opacity="0.18" stroke="${COLORS.bronze}" stroke-width="1.5" />
    <text x="${CANVAS_SIZE - 190}" y="${categoryY}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="20" font-weight="600" fill="${COLORS.bronze}">${xmlEscape(categoryLabel)}</text>`;

  const ctaCenterY = (GRID.ctaTop + GRID.ctaBottom) / 2;
  const ctaSvg = `
    <rect x="${CANVAS_SIZE / 2 - 220}" y="${GRID.ctaTop + 10}" width="440" height="80" rx="40" fill="${COLORS.bronze}" />
    <text x="${CANVAS_SIZE / 2}" y="${ctaCenterY + 12}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="30" font-weight="700" fill="${COLORS.navy}">${xmlEscape(CTA_LABEL)}</text>`;

  const footerY = (GRID.footerTop + GRID.footerBottom) / 2;
  const footerSvg = `<text x="${CANVAS_SIZE / 2}" y="${footerY + 8}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="24" font-weight="400" fill="${COLORS.textMuted}">${xmlEscape(DOMAIN_LABEL)}</text>`;

  return `
<svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
  ${categorySvg}
  ${titleSvg}
  ${descSvg}
  ${ctaSvg}
  ${footerSvg}
</svg>`;
}

async function buildLogoOverlay() {
  const logoBuffer = await sharp(LOGO_PATH).extract(LOGO_CROP).resize({ height: 90 }).png().toBuffer();
  return { input: logoBuffer, left: 40, top: GRID.headerTop + 25 };
}

export async function composePost({ tool, variantIndex, force, outputRoot }) {
  const backgroundsDir = path.join(outputRoot, 'backgrounds');
  const postsDir = path.join(outputRoot, 'posts', tool.id);

  try {
    const backgroundPath = await ensureBackground({ tool, variantIndex, force, backgroundsDir });
    await mkdir(postsDir, { recursive: true });
    const outputPath = path.join(postsDir, `variant-${variantIndex + 1}.png`);

    const overlayBuffer = Buffer.from(overlaySvg(tool, variantIndex));
    const logoLayer = await buildLogoOverlay();

    await sharp(backgroundPath)
      .composite([logoLayer, { input: overlayBuffer, left: 0, top: 0 }])
      .png()
      .toFile(outputPath);

    return { outputPath, backgroundPath, status: 'success' };
  } catch (error) {
    return {
      outputPath: null,
      backgroundPath: null,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
