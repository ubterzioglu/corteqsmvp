---
name: dala-design-system
description: Dala "constellation on black velvet" dark design system (Refero Styles). Use when building any UI, page, artifact, deck or mockup in the Dala style or when the user asks for this dark violet/amber void aesthetic.
---

# Dala Design System — "constellation floating on black velvet"

Source: Refero Styles — https://styles.refero.design/style/e5f5f8cf-e68d-4ed1-bbf5-6b67569af648
("Your workplace has the answer. Just ask Dala for it.") · **Theme:** dark

Source measurements are normalized; roles and recommendations are interpreted. HTML examples are reconstructions, not source components.
Note: the source lists Deep Verdant once as `#15846` (typo); the correct value is `#15846e` everywhere below.

## When to use
Apply this skill whenever the user asks for something "in the Dala style", "Refero/Dala design", or for this dark-void violet + amber aesthetic — landing pages, HTML artifacts, React components, slides, mockups. Follow the tokens, components and Do/Don't rules exactly.

## Overview
Dala is a dark-stage environment: black voids meet a single vivid violet accent, punctuated by amber sparks. Typography is monolithic and weightless — PPNeueMontreal at weight 400 dominates every heading at outsized scales (78–113px) with aggressive negative tracking, so headlines feel sculptural rather than informational. The visual centerpiece is a constellation of tiny multicolored triangular particles forming an organic brain shape — knowledge visualized as distributed intelligence. Layout is a spacious two-column rhythm — oversized left-aligned headlines paired with generous body copy, floating on pure black with no panels, borders, or cards. Components are reduced to essentials: one violet pill button, ghost text links, large-format text blocks.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Void | `#000000` | `--color-void` | Page canvas, section backgrounds, negative space — pure black, never dark gray |
| Bone White | `#ffffff` | `--color-bone-white` | Headlines, body text, icon fills, nav active state — the only typographic color |
| Ash Gray | `#9a9a9a` | `--color-ash-gray` | Muted nav text, ghost link color, secondary labels |
| Silver Mist | `#bdbdbd` | `--color-silver-mist` | Tertiary body text, captions, supporting context |
| Electric Iris | `#8052ff` | `--color-electric-iris` | Primary action buttons, logo mark, brand accents — the single saturated violet signalling interactivity |
| Saffron Spark | `#ffb829` | `--color-saffron-spark` | Highlight emphasis text, accent links, small labels — warm yellow vs violet = chromatic tension |
| Deep Verdant | `#15846e` | `--color-deep-verdant` | Secondary surface tint, logo gradient stop, subtle accent washes |

## Tokens — Typography

**PPNeueMontreal** — single typeface across all UI. `--font-ppneuemontreal`
- **Substitute:** Inter (preserve weight 200 body / 400 headline convention)
- **Weights:** 200, 400, 600, 700
- **Sizes:** 12, 14, 15, 18, 24, 27, 36, 42, 48, 78, 113px
- **Line heights:** 0.81, 0.90, 1.00, 1.10, 1.20, 1.25, 1.30, 1.50
- **Letter spacing:** -4.52px @113px, -3.12px @78px, -1.68px @42px, -0.48px @24px, normal @18px body; 0.025em @14px uppercase nav
- **OpenType:** `font-feature-settings: "ss01" on`
- **Role:** Display (78–113px) at weight 400 with -0.04em tracking — same weight as body; scale, not weight, creates hierarchy. Weight 200 (ultra-light) for 18px body copy is a signature (airy, non-aggressive). Weight 600 at 14px, 0.025em tracking, uppercase for nav and small labels.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 12px | 1.5 | — | `--text-caption` |
| nav-label | 14px | 1.2 | 0.35px | `--text-nav-label` |
| body | 18px | 1.5 | — | `--text-body` |
| heading-2xs | 24px | 1.25 | -0.48px | `--text-heading-2xs` |
| heading-xs | 27px | 1 | — | `--text-heading-xs` |
| subheading | 36px | 1.2 | — | `--text-subheading` |
| heading-sm | 42px | 1.2 | -1.68px | `--text-heading-sm` |
| heading | 48px | 1.1 | -1.68px | `--text-heading` |
| heading-lg | 78px | 1.1 | -3.12px | `--text-heading-lg` |
| display | 113px | 1.1 | -4.52px | `--text-display` |

## Tokens — Spacing & Shapes

**Base unit:** 6px · **Density:** comfortable

Spacing scale: 6, 12, 18, 24, 30, 36, 60, 96, 120px (`--spacing-6` … `--spacing-120`)

Border radius: nav 24px · tags 9999px · cards 24px · buttons 24px

Layout: page max-width 1280px · section gap 60–120px · card padding 24–38px · element gap 6–18px

## Components

### Primary Action Button
Filled violet pill, the sole interactive CTA. Background `#8052ff`, white text, 22.5px radius (pill on ~45px height), padding 14.4px × 15.96px. PPNeueMontreal 14px weight 400 or 600, uppercase, 0.025em tracking.

### Ghost Text Button
Underlined or bare text link, secondary action. No background, no border, color `#ffffff` or `#9a9a9a`. 14px weight 400. Used for nav items and inline links.

### Logo Lockup
Small triangular angular icon in `#8052ff` with gradient fade through `#15846e`, paired with "Dala" wordmark in white. Echoes the triangular particles.

### Team Member Card
No background/border/shadow. Large rounded portrait (24px radius); role label 12px uppercase `#8052ff`; name in large white display type (27px); social icons small inline glyphs `#9a9a9a`. Whitespace-only separation.

### Carousel Navigation Dot
~8px filled circle, `#8052ff` active; inactive dimmer or omitted. No container; ~30px gap below content.

### Hero Constellation Visualization
Thousands of tiny outlined triangular glyphs (1–2px stroke) in a full vivid spectrum (violet, amber, teal, magenta, blue) forming an organic brain/cloud shape on pure black, with scattered ambient particles around. Animated field of point-lights — the site's defining visual.

### Section Headline Block
Two-column asymmetric: headline 78–113px weight 400 white, -0.04em tracking, left half. Body 18px weight 200 white or silver, with a small uppercase `#ffb829` amber label above. No boxes, no borders.

### Navigation Bar
Transparent on black. Logo left; links (Manifesto, Team, Blog) 14px uppercase, 0.025em tracking — active/hover white, inactive `#9a9a9a`. "Request Access" violet pill anchors right edge. No border, no backdrop blur.

### Ambient Particle Field
Small outlined triangles (`#8052ff`, `#ffb829`, `#15846e`, assorted purples/blues) at low opacity across the background for atmospheric depth.

## Do's and Don'ts

### Do
- Use `#8052ff` exclusively for filled action buttons — no other saturated button background
- Set every headline at weight 400, never bold — hierarchy via scale (78–113px) and tracking (-0.04em)
- Use weight 200 for 18px body text — do not substitute 400
- Keep pure `#000000` as every section background — no dark gray panels or card surfaces
- Apply -0.04em letter-spacing on all display sizes ≥42px (≈ -4.52px at 113px)
- Use 24px radius for buttons, cards, nav; pill shapes only at very small sizes
- Let the particle constellation be the only hero imagery

### Don't
- Don't use filled violet for large background blocks or full sections
- Don't set body text at weight 400
- Don't introduce card containers with borders, shadows, or fills
- Don't use `#0000ee` default link blue — use `#ffb829` or `#ffffff` for links
- Don't add gradients to UI components — gradients only in the logo and particle visualization
- Don't use system fonts where PPNeueMontreal geometry matters — fall back to Inter keeping 200/400 convention
- Don't place multiple filled buttons near each other — one violet pill per view

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Void Canvas | `#000000` | Full page and all section backgrounds |
| 1 | Deep Verdant Tint | `#15846e` | Subtle accent surface for brand gradient and logo depth |
| 2 | Electric Iris | `#8052ff` | Filled buttons, active interactive elements only |

## Elevation
No shadows or elevation. Hierarchy through scale, color contrast and whitespace on flat black. Any shadow breaks the floating-in-space quality.

## Imagery
Entirely procedural and abstract — no photography except team portraits. Signature: dense animated cloud of outlined triangular particles (1–2px, sharp, saturated — never grayscale) forming a brain/neural shape; lower-density ambient particles drift across the page. Team portraits: large 24px-radius crops, no frames/overlays. No product screenshots, lifestyle photos, or 3D renders.

## Layout
Full-bleed sections on pure black, content max ~1280px centered. Hero: two-column asymmetric — 113px left-aligned headline + body + CTA left, particle brain right at massive scale. Following sections alternate (visual-left/text-right, then text-left/visual-right) — zigzag rhythm. Section gaps 60–120px. No card grids, pricing tables, or multi-column feature blocks. Minimal transparent top nav, no sidebar/mega-menu. Extremely spacious — one or two elements per viewport.

## Agent Prompt Guide — Quick Color Reference
- Text: `#ffffff` primary, `#9a9a9a` secondary, `#bdbdbd` tertiary
- Background: `#000000` (canvas only)
- Border: none
- Accent: `#ffb829` for emphasis highlights
- Primary action: `#8052ff` filled

## Example Component Prompts
1. **Hero Section:** Full-bleed `#000000`, two-column. Left: 78px weight 400 headline `#ffffff`, letter-spacing -3.12px, e.g. "Unlock collective wisdom." Body 18px weight 200 white, max-width 480px. Above body: 14px weight 600 uppercase `#ffb829` label, 0.35px tracking. Below: violet pill button `#8052ff`, white 14px weight 600 uppercase, 22.5px radius, 14.4px × 16px padding. Right: large particle constellation (tiny colored triangles forming a brain).
2. **Section Headline + Body:** `#000000` bg. 42px weight 400 white headline, -1.68px. Body 18px weight 200 `#bdbdbd`, max-width 520px. No boxes, borders, cards.
3. **Navigation Bar:** Transparent on black. Left: violet triangular logo + "Dala" white 14px. Right: Manifesto/Team/Blog 14px weight 600 uppercase 0.025em, `#9a9a9a` inactive / `#ffffff` active. Far right: violet pill "Request Access", 22.5px radius, 14px weight 600 uppercase.
4. **Team Card:** No bg/border. Portrait 24px radius. Role label "CO FOUNDER & CTO" 12px weight 400 `#8052ff` uppercase; name 27px weight 400 white; social icons `#9a9a9a`.
5. **Carousel Indicator:** Two ~8px dots, active `#8052ff`, no container, centered with 30px gap.

## Similar Brands
- **Linear** — dark void, oversized weight-400 display, single saturated accent for action
- **Vercel** — pure black canvas, geometric minimalism, single brand color, massive tracked-tight display type
- **Anthropic** — dark-first, geometric sans, one dominant accent, scale over weight
- **Runway** — dark void with particle/constellation generative visuals, ultra-light body, single vivid CTA color

## Quick Start — CSS Custom Properties

```css
:root {
  /* Colors */
  --color-void: #000000;
  --color-bone-white: #ffffff;
  --color-ash-gray: #9a9a9a;
  --color-silver-mist: #bdbdbd;
  --color-electric-iris: #8052ff;
  --color-saffron-spark: #ffb829;
  --color-deep-verdant: #15846e;

  /* Font */
  --font-ppneuemontreal: 'PPNeueMontreal', 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Type scale */
  --text-caption: 12px;       --leading-caption: 1.5;
  --text-nav-label: 14px;     --leading-nav-label: 1.2;     --tracking-nav-label: 0.35px;
  --text-body: 18px;          --leading-body: 1.5;
  --text-heading-2xs: 24px;   --leading-heading-2xs: 1.25;  --tracking-heading-2xs: -0.48px;
  --text-heading-xs: 27px;    --leading-heading-xs: 1;
  --text-subheading: 36px;    --leading-subheading: 1.2;
  --text-heading-sm: 42px;    --leading-heading-sm: 1.2;    --tracking-heading-sm: -1.68px;
  --text-heading: 48px;       --leading-heading: 1.1;       --tracking-heading: -1.68px;
  --text-heading-lg: 78px;    --leading-heading-lg: 1.1;    --tracking-heading-lg: -3.12px;
  --text-display: 113px;      --leading-display: 1.1;       --tracking-display: -4.52px;

  /* Weights */
  --font-weight-extralight: 200;
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Spacing */
  --spacing-unit: 6px;
  --spacing-6: 6px;  --spacing-12: 12px; --spacing-18: 18px;
  --spacing-24: 24px; --spacing-30: 30px; --spacing-36: 36px;
  --spacing-60: 60px; --spacing-96: 96px; --spacing-120: 120px;

  /* Layout (ranges — pick a value within) */
  --page-max-width: 1280px;
  /* section gap 60–120px · card padding 24–38px · element gap 6–18px */

  /* Radius */
  --radius-3xl: 24px;
  --radius-full: 9999px;
  --radius-nav: 24px;
  --radius-tags: 9999px;
  --radius-cards: 24px;
  --radius-buttons: 24px;

  /* Surfaces */
  --surface-void-canvas: #000000;
  --surface-deep-verdant-tint: #15846e;
  --surface-electric-iris: #8052ff;
}
```

## Quick Start — Tailwind v4

```css
@theme {
  --color-void: #000000;
  --color-bone-white: #ffffff;
  --color-ash-gray: #9a9a9a;
  --color-silver-mist: #bdbdbd;
  --color-electric-iris: #8052ff;
  --color-saffron-spark: #ffb829;
  --color-deep-verdant: #15846e;

  --font-ppneuemontreal: 'PPNeueMontreal', 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  --text-caption: 12px;       --leading-caption: 1.5;
  --text-nav-label: 14px;     --leading-nav-label: 1.2;     --tracking-nav-label: 0.35px;
  --text-body: 18px;          --leading-body: 1.5;
  --text-heading-2xs: 24px;   --leading-heading-2xs: 1.25;  --tracking-heading-2xs: -0.48px;
  --text-heading-xs: 27px;    --leading-heading-xs: 1;
  --text-subheading: 36px;    --leading-subheading: 1.2;
  --text-heading-sm: 42px;    --leading-heading-sm: 1.2;    --tracking-heading-sm: -1.68px;
  --text-heading: 48px;       --leading-heading: 1.1;       --tracking-heading: -1.68px;
  --text-heading-lg: 78px;    --leading-heading-lg: 1.1;    --tracking-heading-lg: -3.12px;
  --text-display: 113px;      --leading-display: 1.1;       --tracking-display: -4.52px;

  --spacing-6: 6px;  --spacing-12: 12px; --spacing-18: 18px;
  --spacing-24: 24px; --spacing-30: 30px; --spacing-36: 36px;
  --spacing-60: 60px; --spacing-96: 96px; --spacing-120: 120px;

  --radius-3xl: 24px;
  --radius-full: 9999px;
}
```

## Base styles to start every page

```css
body {
  margin: 0;
  background: var(--color-void);
  color: var(--color-bone-white);
  font-family: var(--font-ppneuemontreal);
  font-weight: 200;
  font-size: var(--text-body);
  line-height: var(--leading-body);
  font-feature-settings: "ss01" on;
}
h1, h2, h3 { font-weight: 400; margin: 0; }
h1 { font-size: var(--text-display); line-height: var(--leading-display); letter-spacing: var(--tracking-display); }
h2 { font-size: var(--text-heading-lg); line-height: var(--leading-heading-lg); letter-spacing: var(--tracking-heading-lg); }
.btn-primary {
  background: var(--color-electric-iris); color: #fff; border: 0;
  border-radius: 22.5px; padding: 14.4px 16px;
  font: 600 14px/1.2 var(--font-ppneuemontreal);
  text-transform: uppercase; letter-spacing: 0.025em;
}
.label { color: var(--color-saffron-spark); font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.35px; }
a { color: var(--color-saffron-spark); }
```
Load Inter from Google Fonts (weights 200,400,600,700) as the PPNeueMontreal substitute when the real font is unavailable.
