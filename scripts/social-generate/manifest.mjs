// scripts/social-generate/manifest.mjs
// Üretim sonucu manifest.json (makine-okunur) ve generation-report.md
// (insan-okunur özet) dosyalarını yazar.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function renderReport(entries) {
  const total = entries.length;
  const successCount = entries.filter((e) => e.status === 'success').length;
  const failed = entries.filter((e) => e.status === 'failed');

  const lines = [
    '# Sosyal Medya Görsel Üretim Raporu',
    '',
    `Üretilen: ${successCount} / ${total}`,
    '',
    '## Sonuçlar',
    '',
  ];

  for (const entry of entries) {
    const statusLabel = entry.status === 'success' ? 'Başarılı' : 'Başarısız';
    const detail = entry.status === 'failed' ? ` — ${entry.error}` : ` — ${entry.outputPath}`;
    lines.push(`- ${entry.toolId} varyant ${entry.variant} (${entry.toolName}): ${statusLabel}${detail}`);
  }

  if (failed.length > 0) {
    lines.push('', '## Başarısız Üretimler', '');
    for (const entry of failed) {
      lines.push(`- ${entry.toolId} varyant ${entry.variant}: ${entry.error}`);
    }
  }

  return lines.join('\n');
}

export async function writeManifestAndReport(entries, outputRoot) {
  await mkdir(outputRoot, { recursive: true });
  const manifestPath = path.join(outputRoot, 'manifest.json');
  const reportPath = path.join(outputRoot, 'generation-report.md');

  await writeFile(manifestPath, JSON.stringify(entries, null, 2), 'utf-8');
  await writeFile(reportPath, renderReport(entries), 'utf-8');

  return { manifestPath, reportPath };
}
