import { describe, expect, it } from 'vitest';
import { getMotifSvg } from './background-motifs.mjs';

describe('getMotifSvg', () => {
  it('returns a non-empty SVG fragment for every tool order 1..12', () => {
    for (let order = 1; order <= 12; order++) {
      for (let variantIndex = 0; variantIndex < 3; variantIndex++) {
        const svg = getMotifSvg(order, variantIndex);
        expect(typeof svg).toBe('string');
        expect(svg.length).toBeGreaterThan(0);
        expect(svg).toContain('<g');
      }
    }
  });

  it('is deterministic: same inputs produce identical output', () => {
    const first = getMotifSvg(3, 1);
    const second = getMotifSvg(3, 1);
    expect(first).toBe(second);
  });

  it('produces different output for different variantIndex', () => {
    const v0 = getMotifSvg(1, 0);
    const v1 = getMotifSvg(1, 1);
    const v2 = getMotifSvg(1, 2);
    expect(v0).not.toBe(v1);
    expect(v1).not.toBe(v2);
  });

  it('throws for an out-of-range tool order', () => {
    expect(() => getMotifSvg(13, 0)).toThrow();
    expect(() => getMotifSvg(0, 0)).toThrow();
  });
});
