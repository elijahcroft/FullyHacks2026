# Drop a Bottle — Agent Instructions

## What This App Is

A browser-only ocean drift simulator. Users drop virtual bottles into the ocean; the app simulates their drift using real ocean current data. No backend, no database — everything lives in `localStorage`.

## Stack

| Thing | Version | Notes |
|---|---|---|
| Next.js | 16.2.4 | App Router. Read `node_modules/next/dist/docs/` before writing Next.js code — APIs may differ from training data |
| React | 19.2.4 | Use `'use client'` for anything with hooks, canvas, or Leaflet |
| Tailwind | v4 | Config-free. No `tailwind.config.js` — use CSS variables and `@apply` in globals.css |
| Leaflet / react-leaflet | 5.x | SSR-incompatible. Always dynamic-import map components |
| TypeScript | strict | All types live in `/types/` |

## Architecture

```
page.tsx
└── SimulationProvider (context/SimulationContext.tsx)
    └── OceanMap
        ├── LeafletMap          ← Leaflet base map
        ├── CanvasOverlay       ← bottles + trails drawn on HTML canvas
        ├── FlowOverlay         ← flow field visualization
        └── SimControls         ← play/pause/speed UI
```

**State layers:**
- `SimulationContext` — running, speedMultiplier, showFlowField (shared across the tree)
- `useBottles` — bottle list, backed by `lib/store.ts` → localStorage
- `useSimulation` — tick loop, reads flow field, advances bottles each second

## Key Files

- `lib/simulation.ts` — pure physics, no I/O. `tickBottle()` and `tickAll()` are unit-testable
- `lib/currentField.ts` — loads and samples the ocean current flow field from `public/data/`
- `lib/store.ts` — localStorage CRUD (`loadBottles`, `saveBottles`, `clearBottles`)
- `context/SimulationContext.tsx` — shared sim state; use `useSimulationContext()` to read it
- `hooks/useSimulation.ts` — 1-second interval tick loop; uses refs to avoid restart on re-render
- `hooks/useBottles.ts` — bottle state + persistence
- `scripts/generateFlowField.ts` — run with `npm run gen:field` to rebuild flow field data

## Conventions

- Components that use Leaflet or canvas must be `'use client'`
- The tick loop in `useSimulation` intentionally has an empty dep array — refs keep it stable, do not "fix" this
- `tickBottle` is pure and must stay pure — no side effects, no imports from `store.ts`
- Speed options are `[1, 10, 100, 1000]` days/second — defined in `SimulationContext.tsx` as `SPEED_OPTIONS`
- Path waypoints are recorded every 30 simulated days (`PATH_SAMPLE_INTERVAL`)

## What to Avoid

- Do not add a backend or database — the app is intentionally offline/local
- Do not SSR map components — Leaflet breaks on the server
- Do not mutate bottles in place — `tickBottle` returns a new object
- Do not restart the tick loop interval unnecessarily — it causes simulation stuttering
