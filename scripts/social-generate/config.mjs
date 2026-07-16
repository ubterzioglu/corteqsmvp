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
