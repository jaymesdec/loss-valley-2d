# Loss Valley — CLAUDE.md

## Project Overview

Browser-based educational game teaching Stochastic Gradient Descent through gameplay. Six levels progressively introduce ML concepts. Built for Franklin School's Design & Computing classes.

## Tech Stack

- **Vite 7** + **React 19** + **TypeScript 5.9** + **Tailwind CSS 4**
- HTML5 Canvas for all visualizations (via React refs + requestAnimationFrame)
- Web Audio API for sound effects (SoundService singleton)
- localStorage for persistence (all keys prefixed `lv-`)
- No backend, no API keys, fully static

## Architecture

```
src/
  components/levels/   # One component per level (Level1–Level5, Boss)
  components/canvas/   # Canvas renderers (Scatterplot, Heatmap, Histogram, FogLandscape, LossCurve)
  components/ui/       # Shared UI (Slider, Toggle, StarDisplay, ScoreDisplay, RevealModal, etc.)
  components/layout/   # LevelLayout shell
  hooks/               # useGameState, useCanvas, useReducedMotion, useSound, useLocalStorage
  lib/                 # Pure logic: math.ts, datasets.ts, landscape.ts, training.ts, noise.ts, sound.ts, storage.ts, constants.ts
  types/               # All TypeScript types in index.ts
  data/                # car-data.json
```

## Key Patterns

- **Game state**: `useReducer` in `useGameState.ts`. Discriminated union actions. Auto-persists to localStorage.
- **Canvas rendering**: Each canvas component uses `useCanvas` hook wrapping `requestAnimationFrame`. DPI-aware.
- **Star thresholds**: All in `constants.ts`, marked `// TUNING`. Lower score = better.
- **Level flow**: `NameEntry → Level1 → Level2 → Level3 → Level3Bonus? → Level4 → Level5 → Boss → FieldReport → Results`

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build

## Important Conventions

- Never auto-publish anything — this is a local educational tool
- All star thresholds need playtesting — search for `// TUNING`
- `base: './'` in vite.config.ts for Canvas LMS iframe compatibility
- `@` alias maps to `src/` directory
- Accessibility: keyboard nav for all levels, ARIA labels, `prefers-reduced-motion` support
- localStorage keys always start with `lv-`
