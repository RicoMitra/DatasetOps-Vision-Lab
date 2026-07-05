# Design

> Source of truth for DatasetOps Vision Lab typography, color, layout, motion, and component rules.

## Aesthetic Direction

Dark premium computer-vision lab: FlowForger-inspired rounded glass depth, but recolored with charcoal, warm cream, muted copper, and soft blue.

## Dials

- DESIGN_VARIANCE: 7 / 10
- MOTION_INTENSITY: 4 / 10
- VISUAL_DENSITY: 6 / 10

## Type Stack

- Display: Geist
- Body: Geist
- Mono: Geist Mono
- Loaded via `next/font/google`

Banned: regular Inter, Roboto, Arial, default system-ui as primary.

## Color Tokens

```css
:root {
  --bg: oklch(0.11 0.01 70);
  --fg: oklch(0.95 0.01 78);
  --cream: oklch(0.84 0.04 78);
  --copper: oklch(0.72 0.11 78);
  --blue: oklch(0.72 0.11 225);
  --border: oklch(0.72 0.08 80 / 0.18);
}
```

Banned: purple-blue gradients, pure black/white defaults, neon green primary, color-only risk meaning.

## Layout

- Left sidebar for dataset info, scan mode, privacy, limitations.
- Top header for title, quality score, status.
- Center content for import/Fast Scan and class distribution.
- Right rail for risk cards.
- Bottom section for evidence recommendation cards.
- Mobile collapses to single column with no horizontal scroll.

## Components

- Large rounded glass panels: `rounded-[2rem]`.
- Risk cards: compact evidence cards with mono numbers.
- Recommendation cards always show `problem`, `evidence`, and `action`.
- Charts must have text labels and visible values outside color alone.

## Motion

- Use short transform/opacity transitions only.
- Respect `prefers-reduced-motion`.
- No bounce, custom cursor, or long decorative motion.

## Accessibility Floor

- Form inputs have labels.
- Focus rings visible.
- Touch targets at least 44px.
- No information depends only on color.

## Last Updated

2026-07-05: Initial design system for Python report viewer and Browser Fast Scan dashboard.
