import { describe, expect, it } from 'vitest';
import { xmlEscape, shortDescription, wrapText } from './text-utils.mjs';

describe('xmlEscape', () => {
  it('escapes XML special characters', () => {
    expect(xmlEscape(`Tom & Jerry's "Test" <tag>`)).toBe(
      'Tom &amp; Jerry&apos;s &quot;Test&quot; &lt;tag&gt;',
    );
  });

  it('preserves Turkish characters unchanged', () => {
    expect(xmlEscape('İstanbul ığşĞÜÖçÇ')).toBe('İstanbul ığşĞÜÖçÇ');
  });
});

describe('shortDescription', () => {
  it('returns the text unchanged when already short', () => {
    expect(shortDescription('Kısa bir açıklama.')).toBe('Kısa bir açıklama.');
  });

  it('truncates at a word boundary within 90 characters', () => {
    const long =
      'Kariyer, yaşam tarzı ve değerlerine göre taşınmak için sana en uygun ülkeyi bulan tıkla-geç test. Kararsız genç profesyoneller için.';
    const result = shortDescription(long);
    expect(result.length).toBeLessThanOrEqual(90);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toMatch(/\s…$/);
  });

  it('never splits a word in half', () => {
    const long = 'a'.repeat(40) + ' ' + 'b'.repeat(60);
    const result = shortDescription(long, 50);
    expect(result).toBe('a'.repeat(40) + '…');
  });
});

describe('wrapText', () => {
  it('wraps text into lines not exceeding maxCharsPerLine', () => {
    const lines = wrapText('Hangi Ülke Sana Uygun Testi Burada', 15);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(15);
    }
    expect(lines.join(' ')).toBe('Hangi Ülke Sana Uygun Testi Burada');
  });
});
