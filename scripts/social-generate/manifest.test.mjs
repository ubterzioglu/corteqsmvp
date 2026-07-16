import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

let workDir;

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), 'social-generate-manifest-test-'));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

describe('writeManifestAndReport', () => {
  it('writes a valid manifest.json with all entries', async () => {
    const { writeManifestAndReport } = await import('./manifest.mjs');

    const entries = [
      {
        toolId: 'burak-tool-1',
        toolName: 'Hangi Ülke Sana Uygun?',
        variant: 1,
        canvaPrompt: 'prompt text',
        linkedinPost: 'post text',
        shortDescription: 'kısa açıklama',
        backgroundPath: 'public/social/generated/backgrounds/burak-tool-1-variant-1.png',
        outputPath: 'public/social/generated/posts/burak-tool-1/variant-1.png',
        generatedAt: '2026-07-16T00:00:00.000Z',
        backgroundMethod: 'deterministic-svg',
        status: 'success',
      },
      {
        toolId: 'burak-tool-2',
        toolName: 'Mesleğin Dünyada Ne Kazandırıyor?',
        variant: 2,
        canvaPrompt: 'prompt text 2',
        linkedinPost: 'post text 2',
        shortDescription: 'kısa açıklama 2',
        backgroundPath: null,
        outputPath: null,
        generatedAt: '2026-07-16T00:00:01.000Z',
        backgroundMethod: 'deterministic-svg',
        status: 'failed',
        error: 'boom',
      },
    ];

    const { manifestPath, reportPath } = await writeManifestAndReport(entries, workDir);

    const manifestRaw = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestRaw);
    expect(manifest).toHaveLength(2);
    expect(manifest[0].toolId).toBe('burak-tool-1');
    expect(manifest[1].status).toBe('failed');

    const report = await readFile(reportPath, 'utf-8');
    expect(report).toContain('burak-tool-1');
    expect(report).toContain('burak-tool-2');
    expect(report).toContain('Başarısız');
    expect(report).toContain('1 / 2');
  });
});
