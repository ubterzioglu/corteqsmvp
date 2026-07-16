# LinkedIn Görsel Üretim Sistemi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `BURAK_SHARE_TOOLS` (12 araç × 3 varyant = 36 içerik) için, deterministik SVG arka plan + Sharp compositing kullanan, tek komutla yeniden üretilebilir, marka tutarlı 1200×1200 LinkedIn görsel üretim CLI'ı kurmak.

**Architecture:** `scripts/social-generate/` altında modüler ESM script'ler. Her araç için tek bir "motif fonksiyonu" (12 motif), her motif `variantIndex` (0/1/2) parametresiyle deterministik kompozisyon farkı üretir. Arka plan SVG'si Sharp ile PNG'ye rasterize edilip cache'lenir (`backgrounds/`); üstüne logo + başlık + açıklama + CTA + domain metni ayrı bir SVG katmanı olarak `sharp().composite()` ile bindirilir, nihai PNG `posts/<toolId>/variant-N.png` olarak yazılır. Manifest + rapor JSON/Markdown olarak üretilir.

**Tech Stack:** Node.js ESM (`.mjs`, repo zaten `"type": "module"`), Sharp `^0.34.5` (mevcut devDependency — PNG rasterization + compositing), düz template-literal SVG (ek paket yok).

## Global Constraints

- **Kapsam:** Yalnız `BURAK_SHARE_TOOLS` (`src/lib/admin-shell/burak-share-tools.ts`, 12 araç × 3 varyant). Diğer içerik kaynakları (`SOCIAL_SHARE_TOOLS`, `DIASPORA_POSTS`, `SOCIAL_TEST_TOOLS`) kapsam dışı.
- **Boyut:** Çıktı tam `1200×1200` px, PNG format.
- **Görsel üretim API/anahtar kullanılmaz** — `backgroundMethod` her zaman `"deterministic-svg"`.
- **Yeni npm bağımlılığı eklenmez** — yalnız mevcut `sharp` kullanılır.
- **Font:** SVG `font-family="Segoe UI"` → tarayıcı/librsvg bulamazsa CSS `sans-serif` fallback zinciri (doğrulandı: Sharp'ın bundled fontconfig'i Windows sistem fontlarını isimle tanıyor, `file://` URL embed gerekmiyor). Harici font indirilmez.
- **Logo:** `src/assets/corteqs-logo.png` (1024×1024, navy zeminli). Dolu içerik bounding box'ı ölçüldü: `x:80-912, y:333-644`. Crop dikdörtgeni padding'li: `{ left: 60, top: 320, width: 860, height: 330 }`. İkinci logo dosyası (`corteqs-logo-globe.png`, krem zeminli) **kullanılmaz**.
- **Renkler** (`src/index.css`'ten türetilmiş gerçek marka renkleri):
  - golden-bronze (ana): `#aa8c42`
  - deep navy (arka plan): `#1b1e29`
  - teal: `#28a693`, orange: `#e8703c`, blue: `#1a8fe3`, indigo: `#7861db`, pink: `#e33d94`, yellow: `#eeb821`
- **Türkçe metin:** Bare `toUpperCase()/toLowerCase()` yasak; `@/lib/text-normalization` gerekirse kullanılır. Üretilen tüm metin temiz UTF-8, mojibake yok.
- **Varyant numarası/teknik bilgi görselde gösterilmez** — yalnız manifest'te saklanır.
- **Grid sabit (36 görselde değişmez):**
  ```
  y=0-140     üst şerit: logo (sol) + kategori etiketi (sağ, pill badge)
  y=140-420   başlık + açıklama (≤90 karakter)
  y=420-980   merkez illüstrasyon (motife özel)
  y=980-1080  CTA buton: "Ücretsiz Testi Çöz"
  y=1080-1200 alt şerit: "corteqs.net"
  ```
- **Cache:** `backgrounds/*.png` var olan dosya varsayılan olarak yeniden üretilmez; `--force-backgrounds` ile yeniden üretilir. `posts/*.png` her çalıştırmada güncellenir.
- **Hata izolasyonu:** Bir varyant hata verirse süreç durmaz, `generation-report.md`'de "failed" işaretlenir, sonrakine geçilir.

---

## File Structure

- **Create** `scripts/social-generate/config.mjs` — renk paleti, boyutlar, font adı, grid koordinatları, logo crop dikdörtgeni.
- **Create** `scripts/social-generate/text-utils.mjs` — `shortDescription(description)`, XML-escape yardımcıları.
- **Create** `scripts/social-generate/background-motifs.mjs` — 12 motif fonksiyonu + `getMotifSvg(toolOrder, variantIndex)` dispatcher.
- **Create** `scripts/social-generate/compose.mjs` — `composePost({ tool, variant, variantIndex, forceBackground })` → arka plan cache + logo/metin/CTA overlay + dosya yazımı.
- **Create** `scripts/social-generate/manifest.mjs` — `writeManifestAndReport(entries)`.
- **Create** `scripts/social-generate/index.mjs` — CLI argüman ayrıştırma + orkestrasyon.
- **Modify** `package.json` — `"social:generate"` script satırı eklenir.
- **Create** (üretim çıktısı, kod değil) `public/social/generated/backgrounds/*.png`, `public/social/generated/posts/<toolId>/variant-N.png`, `public/social/generated/manifest.json`, `public/social/generated/generation-report.md`.

---

## Task 1: Config modülü (`config.mjs`)

**Files:**
- Create: `scripts/social-generate/config.mjs`

**Interfaces:**
- Produces:
  - `const CANVAS_SIZE = 1200`
  - `const COLORS = { navy, bronze, teal, orange, blue, indigo, pink, yellow, white, textMuted }` (tüm değerler HEX string)
  - `const GRID = { headerTop, headerBottom, titleTop, titleBottom, illustrationTop, illustrationBottom, ctaTop, ctaBottom, footerTop, footerBottom }` (px, number)
  - `const FONT_FAMILY = "'Segoe UI', sans-serif"`
  - `const LOGO_PATH = "src/assets/corteqs-logo.png"`
  - `const LOGO_CROP = { left: 60, top: 320, width: 860, height: 330 }`
  - `const OUTPUT_ROOT = "public/social/generated"`
  - `const CTA_LABEL = "Ücretsiz Testi Çöz"`
  - `const DOMAIN_LABEL = "corteqs.net"`

- [ ] **Step 1: Dosyayı oluştur**

```js
// scripts/social-generate/config.mjs
// LinkedIn görsel üretim sistemi — marka sabitleri (renk, grid, font, logo crop).
// Renkler src/index.css'teki gerçek CSS custom properties'inden türetilmiştir.

export const CANVAS_SIZE = 1200;

export const COLORS = {
  navy: '#1b1e29',
  bronze: '#aa8c42',
  teal: '#28a693',
  orange: '#e8703c',
  blue: '#1a8fe3',
  indigo: '#7861db',
  pink: '#e33d94',
  yellow: '#eeb821',
  white: '#ffffff',
  textMuted: '#b7bcc9',
};

export const ACCENT_COLORS = [
  COLORS.teal,
  COLORS.orange,
  COLORS.blue,
  COLORS.indigo,
  COLORS.pink,
  COLORS.yellow,
];

export const GRID = {
  headerTop: 0,
  headerBottom: 140,
  titleTop: 140,
  titleBottom: 420,
  illustrationTop: 420,
  illustrationBottom: 980,
  ctaTop: 980,
  ctaBottom: 1080,
  footerTop: 1080,
  footerBottom: 1200,
};

export const FONT_FAMILY = "'Segoe UI', sans-serif";

export const LOGO_PATH = 'src/assets/corteqs-logo.png';
export const LOGO_CROP = { left: 60, top: 320, width: 860, height: 330 };

export const OUTPUT_ROOT = 'public/social/generated';
export const BACKGROUNDS_DIR = `${OUTPUT_ROOT}/backgrounds`;
export const POSTS_DIR = `${OUTPUT_ROOT}/posts`;

export const CTA_LABEL = 'Ücretsiz Testi Çöz';
export const DOMAIN_LABEL = 'corteqs.net';
```

- [ ] **Step 2: Node ile import doğrulaması**

Run: `node --input-type=module -e "import('./scripts/social-generate/config.mjs').then(m => console.log(Object.keys(m)))"`
Expected: `[ 'CANVAS_SIZE', 'COLORS', 'ACCENT_COLORS', 'GRID', 'FONT_FAMILY', 'LOGO_PATH', 'LOGO_CROP', 'OUTPUT_ROOT', 'BACKGROUNDS_DIR', 'POSTS_DIR', 'CTA_LABEL', 'DOMAIN_LABEL' ]`

- [ ] **Step 3: Commit**

```bash
git add scripts/social-generate/config.mjs
git commit -m "feat(social-generate): marka sabitleri config modülü"
```

---

## Task 2: Metin yardımcıları (`text-utils.mjs`)

**Files:**
- Create: `scripts/social-generate/text-utils.mjs`

**Interfaces:**
- Consumes: yok (saf fonksiyonlar).
- Produces:
  - `function xmlEscape(text: string): string`
  - `function shortDescription(description: string, maxLen?: number): string` (varsayılan `maxLen = 90`)
  - `function wrapText(text: string, maxCharsPerLine: number): string[]`

**Not:** `shortDescription` cümle sınırında kırpar (ilk `. ` veya `; ` öncesi tam cümleyi tercih eder), sığmazsa kelime sınırında kırpıp `…` ekler — kelimenin ortasından kesip anlam bozmaz.

- [ ] **Step 1: Failing test yaz**

`scripts/social-generate/text-utils.test.mjs`:

```js
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
```

- [ ] **Step 2: Testi çalıştır, FAIL gör**

Run: `npx vitest run scripts/social-generate/text-utils.test.mjs`
Expected: FAIL — `text-utils.mjs` mevcut değil.

- [ ] **Step 3: Implementasyonu yaz**

```js
// scripts/social-generate/text-utils.mjs
// Görsel üzerine bindirilecek metinler için XML-güvenli kaçış ve kırpma yardımcıları.

const XML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function xmlEscape(text) {
  return String(text).replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]);
}

export function shortDescription(description, maxLen = 90) {
  const trimmed = description.trim();
  if (trimmed.length <= maxLen) return trimmed;

  const sentenceMatch = trimmed.match(/^(.{1,90}?[.;])\s/);
  if (sentenceMatch && sentenceMatch[1].length <= maxLen) {
    return sentenceMatch[1];
  }

  const slice = trimmed.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${cut}…`;
}

export function wrapText(text, maxCharsPerLine) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}
```

- [ ] **Step 4: Testi çalıştır, PASS gör**

Run: `npx vitest run scripts/social-generate/text-utils.test.mjs`
Expected: PASS (7 test).

- [ ] **Step 5: Commit**

```bash
git add scripts/social-generate/text-utils.mjs scripts/social-generate/text-utils.test.mjs
git commit -m "feat(social-generate): metin kırpma ve XML-escape yardımcıları + testleri"
```

---

## Task 3: Arka plan motifleri (`background-motifs.mjs`)

**Files:**
- Create: `scripts/social-generate/background-motifs.mjs`

**Interfaces:**
- Consumes: `COLORS`, `ACCENT_COLORS`, `CANVAS_SIZE`, `GRID` (Task 1).
- Produces:
  - `function getMotifSvg(toolOrder: number, variantIndex: number): string` — `toolOrder` 1..12, `variantIndex` 0..2. Döndürülen string tam bir `<svg>...</svg>` gövde parçası değil, `illustrationTop`–`illustrationBottom` bandına yerleştirilecek bir `<g>...</g>` fragmanıdır (dıştaki compose katmanı `<svg>` sarmalayıcıyı sağlar).

**Not:** 12 motif fonksiyonu `MOTIFS` adlı bir dizide (index 0 = araç 1) tutulur. Her motif fonksiyonu `(variantIndex, colors) => string` imzasındadır. Vurgu renk çifti `ACCENT_COLORS[(variantIndex * 2) % 6]` ve `ACCENT_COLORS[(variantIndex * 2 + 1) % 6]` olarak deterministik seçilir. Pozisyon/rotasyon farkları `variantIndex` ile sabit formüllerden türetilir (`Math.random` kullanılmaz).

- [ ] **Step 1: Failing test yaz**

`scripts/social-generate/background-motifs.test.mjs`:

```js
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
```

- [ ] **Step 2: Testi çalıştır, FAIL gör**

Run: `npx vitest run scripts/social-generate/background-motifs.test.mjs`
Expected: FAIL — modül mevcut değil.

- [ ] **Step 3: Implementasyonu yaz**

```js
// scripts/social-generate/background-motifs.mjs
// 12 araç için deterministik SVG arka plan motifleri. Her motif fonksiyonu
// variantIndex (0..2) parametresinden sabit formüllerle kompozisyon farkı üretir
// (Math.random KULLANILMAZ — üretim tekrarlanabilir olmalı).

import { ACCENT_COLORS, CANVAS_SIZE, COLORS, GRID } from './config.mjs';

const CENTER_X = CANVAS_SIZE / 2;
const CENTER_Y = (GRID.illustrationTop + GRID.illustrationBottom) / 2;

function accentPair(variantIndex) {
  const a = ACCENT_COLORS[(variantIndex * 2) % ACCENT_COLORS.length];
  const b = ACCENT_COLORS[(variantIndex * 2 + 1) % ACCENT_COLORS.length];
  return [a, b];
}

function glowFilter(id) {
  return `
    <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>`;
}

// 1. Hangi Ülke Sana Uygun? — glob + iniş pini
function motifGlobe(variantIndex) {
  const [a, b] = accentPair(variantIndex);
  const offsetX = (variantIndex - 1) * 60;
  const r = 220;
  return `
    <g>
      ${glowFilter('glow1')}
      <circle cx="${CENTER_X + offsetX}" cy="${CENTER_Y}" r="${r}" fill="none" stroke="${a}" stroke-width="3" opacity="0.55" filter="url(#glow1)" />
      <circle cx="${CENTER_X + offsetX}" cy="${CENTER_Y}" r="${r * 0.72}" fill="${COLORS.bronze}" opacity="0.18" />
      <path d="M ${CENTER_X + offsetX - r} ${CENTER_Y} A ${r} ${r * 0.35} 0 0 1 ${CENTER_X + offsetX + r} ${CENTER_Y}" stroke="${b}" stroke-width="4" fill="none" opacity="0.8" filter="url(#glow1)" />
      <circle cx="${CENTER_X + offsetX + r * 0.9}" cy="${CENTER_Y - 20 + variantIndex * 15}" r="14" fill="${b}" filter="url(#glow1)" />
    </g>`;
}

// 2. Mesleğin Dünyada Ne Kazandırıyor? — bar-chart sütunları
function motifBarChart(variantIndex) {
  const [a, b] = accentPair(variantIndex);
  const bars = [0.4, 0.65, 0.9, 0.55, 0.75].map((h, i) => {
    const shift = (variantIndex - 1) * 8;
    const barWidth = 60;
    const gap = 30;
    const totalWidth = 5 * barWidth + 4 * gap;
    const startX = CENTER_X - totalWidth / 2;
    const x = startX + i * (barWidth + gap) + shift;
    const barHeight = 260 * h;
    const y = CENTER_Y + 150 - barHeight;
    const color = i % 2 === 0 ? a : b;
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="10" fill="${color}" opacity="0.85" />`;
  }).join('');
  return `<g>${glowFilter('glow2')}<g filter="url(#glow2)">${bars}</g></g>`;
}

// 3. Yurt Dışına Taşınmaya Hazır mısın? — gösterge/ibre
function motifGauge(variantIndex) {
  const [a, b] = accentPair(variantIndex);
  const sweep = 0.35 + variantIndex * 0.2;
  const r = 200;
  const startAngle = Math.PI * 0.85;
  const endAngle = startAngle + Math.PI * sweep;
  const nx = CENTER_X + r * Math.cos(endAngle);
  const ny = CENTER_Y + r * Math.sin(endAngle);
  return `
    <g>
      ${glowFilter('glow3')}
      <path d="M ${CENTER_X - r} ${CENTER_Y} A ${r} ${r} 0 0 1 ${CENTER_X + r} ${CENTER_Y}" stroke="${COLORS.textMuted}" stroke-width="26" fill="none" opacity="0.25" />
      <path d="M ${CENTER_X - r} ${CENTER_Y} A ${r} ${r} 0 0 1 ${nx} ${ny}" stroke="${a}" stroke-width="26" fill="none" filter="url(#glow3)" />
      <circle cx="${nx}" cy="${ny}" r="18" fill="${b}" filter="url(#glow3)" />
    </g>`;
}

// 4. Hangi Şehir Sana Daha Uygun? — şehir işaretli harita
function motifCityMap(variantIndex) {
  const [a, b] = accentPair(variantIndex);
  const points = [
    [CENTER_X - 160, CENTER_Y - 60],
    [CENTER_X + 40, CENTER_Y - 120],
    [CENTER_X + 180, CENTER_Y + 80],
  ];
  const markers = points.map(([x, y], i) => {
    const highlight = i === variantIndex % points.length;
    const color = highlight ? COLORS.bronze : (i % 2 === 0 ? a : b);
    const radius = highlight ? 22 : 14;
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" filter="url(#glow4)" />`;
  }).join('');
  const lines = `<path d="M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]} L ${points[2][0]} ${points[2][1]}" stroke="${a}" stroke-width="2" fill="none" opacity="0.5" stroke-dasharray="6 6" />`;
  return `<g>${glowFilter('glow4')}${lines}${markers}</g>`;
}

// 5. Diaspora Ağı Eşleştirme — bağlı profil düğümleri
function motifNetwork(variantIndex) {
  const [a, b] = accentPair(variantIndex);
  const count = 6;
  const r = 200;
  const nodes = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + variantIndex * 0.3;
    return [CENTER_X + r * Math.cos(angle), CENTER_Y + r * Math.sin(angle)];
  });
  const lines = nodes.map(([x, y]) =>
    `<line x1="${CENTER_X}" y1="${CENTER_Y}" x2="${x}" y2="${y}" stroke="${a}" stroke-width="2" opacity="0.5" />`
  ).join('');
  const dots = nodes.map(([x, y], i) =>
    `<circle cx="${x}" cy="${y}" r="16" fill="${i % 2 === 0 ? a : b}" filter="url(#glow5)" />`
  ).join('');
  return `<g>${glowFilter('glow5')}${lines}<circle cx="${CENTER_X}" cy="${CENTER_Y}" r="26" fill="${COLORS.bronze}" filter="url(#glow5)" />${dots}</g>`;
}

// 6. Yurt Dışında Hangi Kariyer Sana Uygun? — dallanan yollar
function motifCareerPaths(variantIndex) {
  const [a, b] = accentPair(variantIndex);
  const branches = 3;
  const paths = Array.from({ length: branches }, (_, i) => {
    const angleSpread = 0.5 + variantIndex * 0.15;
    const angle = -angleSpread + (i / (branches - 1)) * angleSpread * 2;
    const endX = CENTER_X + 260 * Math.sin(angle);
    const endY = CENTER_Y + 200;
    const color = i === 1 ? COLORS.bronze : (i === 0 ? a : b);
    return `<path d="M ${CENTER_X} ${CENTER_Y - 200} Q ${CENTER_X} ${CENTER_Y} ${endX} ${endY}" stroke="${color}" stroke-width="6" fill="none" opacity="0.85" filter="url(#glow6)" />`;
  }).join('');
  return `<g>${glowFilter('glow6')}${paths}</g>`;
}

// 7. Yurt Dışı Yaşam Tarzın Ne? — kişilik rozetleri/parçacıklar
function motifPersonaBadges(variantIndex) {
  const [a, b] = accentPair(variantIndex);
  const badges = 5;
  const dots = Array.from({ length: badges }, (_, i) => {
    const angle = (i / badges) * Math.PI * 2 + variantIndex * 0.5;
    const dist = 140 + (i % 2) * 60;
    const x = CENTER_X + dist * Math.cos(angle);
    const y = CENTER_Y + dist * Math.sin(angle);
    const color = i % 2 === 0 ? a : b;
    return `<circle cx="${x}" cy="${y}" r="${12 + (i % 3) * 6}" fill="${color}" opacity="0.85" filter="url(#glow7)" />`;
  }).join('');
  return `<g>${glowFilter('glow7')}<circle cx="${CENTER_X}" cy="${CENTER_Y}" r="90" fill="${COLORS.bronze}" opacity="0.2" />${dots}</g>`;
}

// 8. İlk 90 Gün Planlayıcı — zaman çizelgesi şeridi
function motifTimeline(variantIndex) {
  const [a, b] = accentPair(variantIndex);
  const y = CENTER_Y + (variantIndex - 1) * 20;
  const milestones = 4;
  const startX = CENTER_X - 240;
  const endX = CENTER_X + 240;
  const dots = Array.from({ length: milestones }, (_, i) => {
    const x = startX + (i / (milestones - 1)) * (endX - startX);
    const color = i % 2 === 0 ? a : b;
    return `<circle cx="${x}" cy="${y}" r="16" fill="${color}" filter="url(#glow8)" />`;
  }).join('');
  return `
    <g>
      ${glowFilter('glow8')}
      <line x1="${startX}" y1="${y}" x2="${endX}" y2="${y}" stroke="${COLORS.bronze}" stroke-width="5" opacity="0.6" />
      ${dots}
    </g>`;
}

// 9. Önce Hangi Soruna Odaklanmalısın? — radar/spot ışık
function motifFocusRadar(variantIndex) {
  const [a] = accentPair(variantIndex);
  const angle = variantIndex * (Math.PI / 3);
  const r = 210;
  const x = CENTER_X + r * Math.cos(angle);
  const y = CENTER_Y + r * Math.sin(angle);
  return `
    <g>
      ${glowFilter('glow9')}
      <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${r}" fill="none" stroke="${COLORS.textMuted}" stroke-width="2" opacity="0.3" stroke-dasharray="4 8" />
      <circle cx="${x}" cy="${y}" r="34" fill="${COLORS.bronze}" filter="url(#glow9)" />
      <circle cx="${x}" cy="${y}" r="60" fill="${a}" opacity="0.25" filter="url(#glow9)" />
    </g>`;
}

// 10. Yurt Dışında İş Bulma Şansın? — olasılık göstergesi
function motifJobOdds(variantIndex) {
  const [a, b] = accentPair(variantIndex);
  const fill = 0.5 + variantIndex * 0.15;
  const barW = 340;
  const barH = 48;
  const x = CENTER_X - barW / 2;
  const y = CENTER_Y;
  return `
    <g>
      ${glowFilter('glow10')}
      <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="24" fill="${COLORS.textMuted}" opacity="0.2" />
      <rect x="${x}" y="${y}" width="${barW * fill}" height="${barH}" rx="24" fill="${a}" filter="url(#glow10)" />
      <circle cx="${x + barW * fill}" cy="${y + barH / 2}" r="20" fill="${b}" filter="url(#glow10)" />
    </g>`;
}

// 11. Almanya'da Sana Hangi Banka Uygun? — kart + sıralı rozetler
function motifBankRanking(variantIndex) {
  const [a, b] = accentPair(variantIndex);
  const cardW = 160, cardH = 100;
  const x = CENTER_X - cardW / 2;
  const y = CENTER_Y - 140;
  const podium = [0, 1, 2].map((i) => {
    const podiumHeights = [60, 90, 40];
    const order = [1, 0, 2];
    const idx = order[i];
    const px = CENTER_X - 150 + i * 150;
    const py = CENTER_Y + 120 - podiumHeights[idx];
    const color = idx === 1 ? COLORS.bronze : (idx === 0 ? a : b);
    return `<rect x="${px - 40}" y="${py}" width="80" height="${podiumHeights[idx] + (variantIndex * 4)}" rx="8" fill="${color}" opacity="0.85" filter="url(#glow11)" />`;
  }).join('');
  return `
    <g>
      ${glowFilter('glow11')}
      <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="14" fill="${a}" opacity="0.7" filter="url(#glow11)" />
      ${podium}
    </g>`;
}

// 12. Almanya'da Hangi Sigortalar Sana Şart? — kalkan + ikonlar
function motifShield(variantIndex) {
  const [a, b] = accentPair(variantIndex);
  const scale = 1 + variantIndex * 0.08;
  const shieldPath = `M ${CENTER_X} ${CENTER_Y - 160 * scale} L ${CENTER_X + 120 * scale} ${CENTER_Y - 100 * scale} L ${CENTER_X + 120 * scale} ${CENTER_Y + 40 * scale} Q ${CENTER_X + 120 * scale} ${CENTER_Y + 160 * scale} ${CENTER_X} ${CENTER_Y + 200 * scale} Q ${CENTER_X - 120 * scale} ${CENTER_Y + 160 * scale} ${CENTER_X - 120 * scale} ${CENTER_Y + 40 * scale} L ${CENTER_X - 120 * scale} ${CENTER_Y - 100 * scale} Z`;
  const icons = [0, 1, 2].map((i) => {
    const angle = -0.9 + i * 0.9;
    const dist = 210;
    const ix = CENTER_X + dist * Math.sin(angle);
    const iy = CENTER_Y + dist * Math.cos(angle) * 0.6;
    const color = i % 2 === 0 ? a : b;
    return `<circle cx="${ix}" cy="${iy}" r="18" fill="${color}" filter="url(#glow12)" />`;
  }).join('');
  return `
    <g>
      ${glowFilter('glow12')}
      <path d="${shieldPath}" fill="${COLORS.bronze}" opacity="0.3" stroke="${a}" stroke-width="4" filter="url(#glow12)" />
      ${icons}
    </g>`;
}

const MOTIFS = [
  motifGlobe,
  motifBarChart,
  motifGauge,
  motifCityMap,
  motifNetwork,
  motifCareerPaths,
  motifPersonaBadges,
  motifTimeline,
  motifFocusRadar,
  motifJobOdds,
  motifBankRanking,
  motifShield,
];

export function getMotifSvg(toolOrder, variantIndex) {
  if (!Number.isInteger(toolOrder) || toolOrder < 1 || toolOrder > MOTIFS.length) {
    throw new Error(`toolOrder must be between 1 and ${MOTIFS.length}, got ${toolOrder}`);
  }
  if (!Number.isInteger(variantIndex) || variantIndex < 0 || variantIndex > 2) {
    throw new Error(`variantIndex must be 0, 1 or 2, got ${variantIndex}`);
  }
  return MOTIFS[toolOrder - 1](variantIndex);
}
```

- [ ] **Step 4: Testi çalıştır, PASS gör**

Run: `npx vitest run scripts/social-generate/background-motifs.test.mjs`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add scripts/social-generate/background-motifs.mjs scripts/social-generate/background-motifs.test.mjs
git commit -m "feat(social-generate): 12 araç için deterministik SVG arka plan motifleri + testleri"
```

---

## Task 4: Compose modülü (`compose.mjs`)

**Files:**
- Create: `scripts/social-generate/compose.mjs`

**Interfaces:**
- Consumes:
  - `CANVAS_SIZE, COLORS, GRID, FONT_FAMILY, LOGO_PATH, LOGO_CROP, BACKGROUNDS_DIR, POSTS_DIR, CTA_LABEL, DOMAIN_LABEL` (Task 1)
  - `xmlEscape, shortDescription, wrapText` (Task 2)
  - `getMotifSvg` (Task 3)
  - `BurakShareTool`, `BurakShareVariant` şeklindeki alanlar (`id`, `order`, `name`, `description`, `variants[].canvaPrompt`, `variants[].linkedinPost`) — bu modül `tool` parametresini düz JS objesi olarak alır; `src/lib/admin-shell/burak-share-tools.ts`'ten yükleme işi `index.mjs`'in sorumluluğudur (bkz. Task 6).
- Produces:
  - `async function ensureBackground({ toolOrder, toolId, variantIndex, force }): Promise<string>` — arka plan PNG dosya yolunu döndürür (cache mantığı burada).
  - `async function composePost({ tool, variantIndex, force }): Promise<{ outputPath, backgroundPath, status, error? }>`
  - `type Tool = { id: string, order: number, name: string, description: string }` (JSDoc yorumuyla belgelenir, gerçek TS tipi değil — `.mjs` dosyası).

**Not:** `access()` ile dosya varlığı kontrol edilir (senkron `existsSync` yerine `fs/promises` kullanılır — repo'nun diğer script'leri de `fs/promises` kullanıyor, bkz. `verify-text-encoding.mjs`).

- [ ] **Step 1: Failing test yaz**

`scripts/social-generate/compose.test.mjs`:

```js
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
```

- [ ] **Step 2: Testi çalıştır, FAIL gör**

Run: `npx vitest run scripts/social-generate/compose.test.mjs`
Expected: FAIL — `compose.mjs` mevcut değil.

- [ ] **Step 3: Implementasyonu yaz**

```js
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
```

- [ ] **Step 4: Testi çalıştır, PASS gör**

Run: `npx vitest run scripts/social-generate/compose.test.mjs`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add scripts/social-generate/compose.mjs scripts/social-generate/compose.test.mjs
git commit -m "feat(social-generate): compose modülü (arka plan cache + logo + metin overlay) + testleri"
```

---

## Task 5: Manifest modülü (`manifest.mjs`)

**Files:**
- Create: `scripts/social-generate/manifest.mjs`

**Interfaces:**
- Consumes: yok (saf veri işleme).
- Produces:
  - `type ManifestEntry = { toolId, toolName, variant, canvaPrompt, linkedinPost, shortDescription, backgroundPath, outputPath, generatedAt, backgroundMethod, status, error? }`
  - `async function writeManifestAndReport(entries: ManifestEntry[], outputRoot: string): Promise<{ manifestPath: string, reportPath: string }>`

- [ ] **Step 1: Failing test yaz**

`scripts/social-generate/manifest.test.mjs`:

```js
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
    expect(report).toContain('2 / 2');
  });
});
```

- [ ] **Step 2: Testi çalıştır, FAIL gör**

Run: `npx vitest run scripts/social-generate/manifest.test.mjs`
Expected: FAIL — `manifest.mjs` mevcut değil.

- [ ] **Step 3: Implementasyonu yaz**

```js
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
```

- [ ] **Step 4: Testi çalıştır, PASS gör**

Run: `npx vitest run scripts/social-generate/manifest.test.mjs`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add scripts/social-generate/manifest.mjs scripts/social-generate/manifest.test.mjs
git commit -m "feat(social-generate): manifest.json + generation-report.md yazıcı + testi"
```

---

## Task 6: CLI orkestrasyonu (`index.mjs`) + `package.json` script

**Files:**
- Create: `scripts/social-generate/index.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `composePost` (Task 4), `writeManifestAndReport` (Task 5), `shortDescription` (Task 2), `OUTPUT_ROOT` (Task 1), `BURAK_SHARE_TOOLS` verisini `src/lib/admin-shell/burak-share-tools.ts`'ten runtime'da doğrudan import eder.
- Produces: `async function loadBurakShareTools(repoRoot: string): Promise<Array<{id, order, name, description, variants: Array<{canvaPrompt, linkedinPost}>}>>`

**Doğrulanmış yöntem:** Bu depo Node.js `v24.13.1` kullanıyor. Node'un yerleşik `--experimental-strip-types` bayrağı `.ts` dosyalarını doğrudan `import()` ile yüklemeye izin verir (tip anotasyonlarını çalışma zamanında siler). Bu, gerçek `burak-share-tools.ts` dosyasına karşı önceden test edilip doğrulandı: `node --experimental-strip-types` ile dosya import edildiğinde `BURAK_SHARE_TOOLS.length === 12`, `[0].id === "burak-tool-1"`, `[0].variants.length === 3` sonucu alındı. Ek bağımlılık (`tsx`, `vite-node`, `esbuild`) gerekmez.

- [ ] **Step 1: `.ts` veri dosyasını runtime'da yükleyen yardımcı fonksiyonu yaz**

`scripts/social-generate/load-tools.mjs`:

```js
// scripts/social-generate/load-tools.mjs
// BURAK_SHARE_TOOLS verisini TypeScript kaynağından runtime'da yükler.
// Node'un yerleşik --experimental-strip-types desteğiyle .ts dosyası doğrudan
// import edilir (bu depo Node 24 kullanıyor; ek derleyici/bağımlılık gerekmez).
// index.mjs bu script'i her zaman `node --experimental-strip-types` ile çalıştırır.

import { pathToFileURL } from 'node:url';
import path from 'node:path';

export async function loadBurakShareTools(repoRoot) {
  const modulePath = path.join(repoRoot, 'src/lib/admin-shell/burak-share-tools.ts');
  const moduleUrl = pathToFileURL(modulePath).href;
  const mod = await import(moduleUrl);
  return mod.BURAK_SHARE_TOOLS;
}
```

- [ ] **Step 2: Doğrulama — import yönteminin bu ortamda çalıştığını teyit et**

Run:
```bash
node --experimental-strip-types --input-type=module -e "
import { loadBurakShareTools } from './scripts/social-generate/load-tools.mjs';
const tools = await loadBurakShareTools(process.cwd());
console.log(tools.length, tools[0].id, tools[0].variants.length, tools[11].id);
"
```
Expected: `12 burak-tool-1 3 burak-tool-12`

- [ ] **Step 3: CLI script'ini yaz**

```js
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
```

- [ ] **Step 5: `package.json`'a script satırını ekle**

`package.json` içindeki `"scripts"` bloğuna, `"ingest:tools"` satırının yanına ekle:

```json
    "social:generate": "node --experimental-strip-types scripts/social-generate/index.mjs",
```

- [ ] **Step 6: İlk örneği üret ve doğrula**

Run: `npm run social:generate -- --tool burak-tool-1 --variant 1`

Expected konsol çıktısı:
```
✓ burak-tool-1 varyant 1

1 / 1 görsel üretildi.
Manifest: .../public/social/generated/manifest.json
Rapor: .../public/social/generated/generation-report.md
```

- [ ] **Step 7: Üretilen görseli boyut/format olarak doğrula**

Run:
```bash
node -e "
const sharp = require('sharp');
sharp('public/social/generated/posts/burak-tool-1/variant-1.png').metadata().then(m => {
  console.log(JSON.stringify({ width: m.width, height: m.height, format: m.format }));
  if (m.width !== 1200 || m.height !== 1200 || m.format !== 'png') process.exitCode = 1;
});
"
```
Expected: `{"width":1200,"height":1200,"format":"png"}`, exit code 0.

- [ ] **Step 8: Görseli oku ve Türkçe karakter/hizalama/taşma kontrolü yap (görsel inceleme)**

Read tool ile `public/social/generated/posts/burak-tool-1/variant-1.png` dosyasını aç, şunları gözle doğrula:
- Logo sol üstte, navy zemin kaynaşmış (görünür çerçeve yok)
- Başlık "Hangi Ülke Sana Uygun?" Türkçe karakterlerle doğru, taşmıyor
- Açıklama 90 karakter altında, okunur boyutta
- Merkez illüstrasyon (glob motifi) görünür, renkli
- CTA "Ücretsiz Testi Çöz" okunur, kontrast yeterli
- Alt "corteqs.net" görünür
- Varyant numarası/teknik bilgi YOK

Herhangi bir hizalama/taşma sorunu bulunursa, Task 4'teki `overlaySvg`/`buildLogoOverlay` fonksiyonlarında ilgili koordinat düzeltilir ve Step 6-8 tekrarlanır.

- [ ] **Step 9: Commit**

```bash
git add scripts/social-generate/index.mjs scripts/social-generate/load-tools.mjs package.json
git commit -m "feat(social-generate): CLI orkestrasyonu + npm run social:generate komutu"
```

---

## Task 7: Toplu üretim (36 görsel) + doğrulama

**Files:**
- Değişiklik yok (yalnız çıktı üretimi ve doğrulama).

- [ ] **Step 1: Tüm 36 görseli üret**

Run: `npm run social:generate -- --all`

Expected: Konsolda 36 satır `✓ burak-tool-N varyant M`, sonunda `36 / 36 görsel üretildi.` (ya da başarısız varsa `X / 36` + hangi varyantların başarısız olduğu listesi — süreç durmaz).

- [ ] **Step 2: Dosya sayısını doğrula**

Run: `find public/social/generated/posts -name "*.png" | wc -l`
Expected: `36`

- [ ] **Step 3: Her dosyanın 1200×1200 PNG olduğunu toplu doğrula**

```bash
node -e "
const sharp = require('sharp');
const { readdirSync } = require('fs');
const path = require('path');

async function main() {
  const root = 'public/social/generated/posts';
  let checked = 0, bad = 0;
  for (const toolDir of readdirSync(root)) {
    const dir = path.join(root, toolDir);
    for (const file of readdirSync(dir)) {
      const full = path.join(dir, file);
      const meta = await sharp(full).metadata();
      checked++;
      if (meta.width !== 1200 || meta.height !== 1200 || meta.format !== 'png') {
        console.error('BAD', full, meta.width, meta.height, meta.format);
        bad++;
      }
    }
  }
  console.log(\`checked=\${checked} bad=\${bad}\`);
  if (bad > 0) process.exitCode = 1;
}
main();
"
```
Expected: `checked=36 bad=0`

- [ ] **Step 4: `manifest.json` içinde 36 girdi ve tüm `status: "success"` olduğunu doğrula**

Run:
```bash
node -e "
const manifest = require('./public/social/generated/manifest.json');
console.log('total', manifest.length);
console.log('success', manifest.filter(e => e.status === 'success').length);
console.log('failed', manifest.filter(e => e.status === 'failed').map(e => e.toolId + '-v' + e.variant));
"
```
Expected: `total 36`, `success 36`, `failed []`. Eğer başarısız varsa, hata mesajı `generation-report.md`'den okunup Task 3/4'teki ilgili motif/compose kodu düzeltilir, bu adım tekrarlanır.

- [ ] **Step 5: `npm run verify:text` çalıştır (Türkçe/mojibake denetimi, `.mjs`/`.md` dosyaları dahil)**

Run: `npm run verify:text`
Expected: PASS.

- [ ] **Step 6: Tüm test paketini çalıştır**

Run: `npm run test`
Expected: Tüm mevcut testler + yeni `scripts/social-generate/*.test.mjs` testleri PASS (regresyon yok).

- [ ] **Step 7: Lint çalıştır**

Run: `npm run lint`
Expected: Temiz (yeni `.mjs` dosyaları `eslint.config.js`'in `**/*.{ts,tsx}` kapsamı dışında olduğu için etkilenmez — repo'daki diğer `scripts/*.mjs` dosyalarıyla tutarlı).

- [ ] **Step 8: Commit (yalnız üretilen görseller + manifest + rapor)**

```bash
git add public/social/generated/
git commit -m "feat(social-generate): 36 LinkedIn görselini üret (12 araç x 3 varyant)"
```

---

## Self-Review

**Spec coverage:**
- Deterministik SVG + Sharp compositing → Task 3, 4 ✓
- Marka renkleri (gerçek CSS'ten) → Task 1 ✓
- Logo crop (ölçülmüş bounding box) → Task 1, 4 ✓
- Sabit grid (36 görselde değişmez) → Task 1, 4 ✓
- 12 motif, `variantIndex` deterministik farkı → Task 3 ✓
- Metin üretim kuralları (≤90 karakter, Türkçe korunur) → Task 2 ✓
- CLI (`--tool`, `--variant`, `--all`, `--force-backgrounds`) → Task 6 ✓
- Cache mantığı (arka plan atlanır, `--force-backgrounds` ile yeniden üretilir) → Task 4, 6 ✓
- Hata izolasyonu (bir varyant başarısız olursa süreç durmaz) → Task 4, 6 ✓
- Manifest + rapor → Task 5 ✓
- İlk örnek (tool-1/variant-1) üretimi + doğrulama → Task 6 ✓
- 36 görsel toplu üretim + doğrulama → Task 7 ✓
- Varyant numarası/teknik bilgi görselde yok → Task 4 (overlaySvg kategori etiketi sabit metin, varyant numarası kullanılmıyor) ✓
- Türkçe karakter/mojibake kontrolü → Task 7 Step 5 (`verify:text`) ✓
- Lint/test/build doğrulama → Task 7 Step 6-7 ✓

**Placeholder scan:** Tüm adımlarda tam kod var. Task 6'daki `.ts` dosyasını runtime'da yükleme yöntemi (`node --experimental-strip-types` ile doğrudan `import()`), plan yazımı sırasında gerçek `burak-share-tools.ts` dosyasına karşı bu ortamda (Node v24.13.1) çalıştırılıp doğrulandı (`12 burak-tool-1 3 burak-tool-12` çıktısı alındı) — belirsiz "dene, olmazsa alternatif kullan" ifadesi kaldırıldı, tek kesin yöntem yazıldı.

**Type consistency:** `composePost({ tool, variantIndex, force, outputRoot })` imzası Task 4 tanımı ile Task 6 kullanımı tutarlı. `tool.order`/`tool.id`/`tool.name`/`tool.description`/`tool.variants[].canvaPrompt`/`tool.variants[].linkedinPost` alan adları `burak-share-tools.ts`'teki gerçek `BurakShareTool`/`BurakShareVariant` tipleriyle birebir eşleşiyor (Task 6 brainstorming aşamasında okunan dosyadan doğrulandı). `getMotifSvg(toolOrder, variantIndex)` Task 3 tanımı ile Task 4 kullanımı (`getMotifSvg(tool.order, variantIndex)`) tutarlı. `shortDescription(description, maxLen?)` Task 2 tanımı ile Task 4/6 kullanımı tutarlı.
