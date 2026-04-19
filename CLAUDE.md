# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bottle Drop** — a web app where users drop virtual bottles in the ocean and watch them drift using real or simulated ocean current data. Bottles carry messages and drift toward the Great Pacific Garbage Patch or wash ashore. This is a hackathon project.

## Tech Stack

- **Framework:** Next.js (App Router) with TypeScript
- **Map:** Mapbox GL JS or Leaflet with dark ocean tile layer
- **Styling:** Tailwind CSS (dark navy/black ocean theme)
- **Database:** Supabase (PostgreSQL + realtime subscriptions)
- **Simulation rendering:** HTML Canvas overlay on the map

## Commands

Once the project is initialized, expected commands are:

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # Lint
```

Environment variables needed in `.env.local`:
- Supabase URL and anon key
- Mapbox API token (if using Mapbox)

## Architecture

The app has three main layers:

**Data layer** — `lib/supabase.ts` connects to Supabase. `lib/currentField.ts` loads ocean current vector fields (either from a live API or the fallback `data/currentField.json`). Ocean current data priority: HYCOM THREDDS → Copernicus Marine → OSCAR → pre-baked fallback JSON.

**Simulation engine** — `lib/simulation.ts` contains the core physics tick:
1. Sample `(u, v)` current vector at bottle position from the current field
2. Add small random turbulence perturbation
3. Update position: `lat += v * dt`, `lng += u * dt`
4. Check garbage patch zone (25–45°N, 135–155°W) → mark `garbage_patch`, slow drift
5. Check coastline collision via `data/coastlines.geojson` → mark `ashore`
6. Append to path array (sampled every 30 sim-days)
7. Broadcast via Supabase realtime

Time scale: 1 real second = 1 simulated day (configurable). Server-side cron drives updates; client subscribes via Supabase realtime. Fallback: client-side tick loop via `hooks/useSimulation.ts`.

**UI layer** — `components/OceanMap.tsx` wraps the map. `components/BottleCanvas.tsx` renders all bottles as glowing particles with trail effects on a canvas overlay. `hooks/useBottles.ts` manages realtime bottle state.

## Supabase Schema

```sql
create table bottles (
  id uuid primary key default gen_random_uuid(),
  message text,
  author_name text,
  start_lat float,
  start_lng float,
  current_lat float,
  current_lng float,
  path jsonb default '[]',         -- array of [lat,lng] waypoints
  status text default 'drifting',  -- 'drifting' | 'garbage_patch' | 'ashore'
  dropped_at timestamptz default now(),
  days_drifted int default 0,
  destination text
);
```

## MVP Priority (cut in this order if time-constrained)

1. Real API current data → use fallback vector field in `data/currentField.json`
2. Server-side cron → client-side simulation only
3. Coastline collision → only detect garbage patch destination
4. Supabase realtime → load all bottles once on page load

**Core experience that must work:** drop bottle → watch it move → see it drift toward garbage patch → click to read message.
