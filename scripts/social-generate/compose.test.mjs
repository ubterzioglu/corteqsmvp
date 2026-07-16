import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

let workDir;

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), 'social-generate-test-'));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

describe('composePost', () => {
  it('produces a 1200x1200 PNG file for a given tool and variant', async () => {
    const { composePost } = await import('./compose.mjs');
    const sharp = (await import('sharp')).default;

    const tool = {
      id: 'burak-tool-1',
      order: 1,
      name: 'Hangi Ülke Sana Uygun?',
      description:
        'Kariyer, yaşam tarzı ve değerlerine göre taşınmak için sana en uygun ülkeyi bulan tıkla-geç test.',
    };

    const result = await composePost({
      tool,
      variantIndex: 0,
      force: true,
      outputRoot: workDir,
    });

    expect(result.status).toBe('success');
    const meta = await sharp(result.outputPath).metadata();
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(1200);
    expect(meta.format).toBe('png');
  });

  it('reuses the cached background on a second call unless forced', async () => {
    const { composePost } = await import('./compose.mjs');

    const tool = {
      id: 'burak-tool-2',
      order: 2,
      name: 'Mesleğin Dünyada Ne Kazandırıyor?',
      description: 'Maaş karşılaştırma aracı.',
    };

    const first = await composePost({ tool, variantIndex: 0, force: true, outputRoot: workDir });
    const firstBg = await readFile(first.backgroundPath);

    const second = await composePost({ tool, variantIndex: 0, force: false, outputRoot: workDir });
    const secondBg = await readFile(second.backgroundPath);

    expect(Buffer.compare(firstBg, secondBg)).toBe(0);
  });

  it('returns a failed status instead of throwing when given an invalid tool order', async () => {
    const { composePost } = await import('./compose.mjs');

    const tool = {
      id: 'burak-tool-x',
      order: 99,
      name: 'Geçersiz',
      description: 'x',
    };

    const result = await composePost({ tool, variantIndex: 0, force: true, outputRoot: workDir });
    expect(result.status).toBe('failed');
    expect(result.error).toBeTruthy();
  });
});
