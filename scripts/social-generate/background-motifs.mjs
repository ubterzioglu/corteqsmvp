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
