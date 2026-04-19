Bottle Drop — Ocean Drift Simulation
Project Overview
A web app where users drop virtual bottles anywhere in the ocean and watch them drift using real (or simulated) ocean current data. Bottles carry user messages and drift forever, accumulating in the Great Pacific Garbage Patch or washing ashore on coastlines.
Core Features (MVP)

Drop a bottle — click anywhere on the ocean map, write a message, drop it
Watch it drift — time-lapsed simulation, months of drift in seconds
Many bottles — all user bottles visible simultaneously, drifting together
Destination events — bottle either drifts forever OR triggers an event (reached garbage patch, washed ashore in X country)
Message in a bottle — click any bottle to read its message and see its journey so far

Tech Stack

Framework: Next.js (App Router)
Map: Mapbox GL JS or Leaflet with ocean tile layer
Simulation: Canvas overlay on the map for particle/bottle rendering
Current data: Try HYCOM or Copernicus Marine (free APIs) — fallback to Oscar dataset or a pre-baked vector field JSON
Database: Supabase (store bottles, positions, messages)
Styling: Tailwind CSS, dark ocean theme

Current Data Strategy
Priority order:

HYCOM THREDDS — https://tds.hycom.org/thredds/dodsC/ — free, global, daily ocean currents (u/v components)
Copernicus Marine — https://marine.copernicus.eu/ — requires free account, excellent quality
OSCAR Near-Real-Time — https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_third-deg — simpler format
Fallback: Pre-computed vector field JSON using known gyre patterns (North Pacific, South Pacific, Atlantic gyres). Hardcode major current paths (Gulf Stream, Kuroshio, etc.) as bezier spline vector fields. Good enough for demo.

For the hackathon, start with fallback if API setup takes too long. The simulation math matters more than live data precision.
Simulation Logic
Each bottle has:
  - lat, lng (current position)
  - startLat, startLng (drop point)
  - message (string)
  - droppedAt (timestamp)
  - path (array of [lat,lng] waypoints logged over time)
  - status: 'drifting' | 'garbage_patch' | 'ashore'

Each tick (time step):
  1. Sample current vector (u, v) at bottle's position from current field
  2. Add small random perturbation (turbulence)
  3. Update position: lat += (v * dt), lng += (u * dt)
  4. Check if bottle entered garbage patch zone (approx 135-155W, 35-42N)
  5. Check if bottle hit a coastline (use geojson land polygon)
  6. Log position to path array
  7. Broadcast update to all clients via Supabase realtime
Great Pacific Garbage Patch Zone
Approx bounding box: { lat: 25-45°N, lng: 135-155°W }
When a bottle enters this zone, mark it garbage_patch and show a notification. Slow its drift speed dramatically — it's trapped.
File Structure
/app
  /page.tsx              — main map page
  /api
    /bottles
      /route.ts          — GET all bottles, POST new bottle
    /simulate
      /route.ts          — POST tick update (or run server-side cron)
/components
  /OceanMap.tsx          — Mapbox/Leaflet map wrapper
  /BottleCanvas.tsx      — Canvas overlay rendering all bottle particles
  /DropBottleModal.tsx   — Modal for writing message + dropping
  /BottleCard.tsx        — Popup showing bottle message + journey stats
  /CurrentField.tsx      — Debug overlay showing current vectors (dev only)
/lib
  /currentField.ts       — Load and sample ocean current vector field
  /simulation.ts         — Core drift physics, tick function
  /supabase.ts           — DB client
/data
  /currentField.json     — Pre-baked fallback vector field
  /coastlines.geojson    — Land polygons for collision detection
/hooks
  /useBottles.ts         — Realtime bottle state via Supabase
  /useSimulation.ts      — Client-side simulation tick loop
Visual Design

Dark ocean aesthetic — deep navy/black background
Bottles rendered as glowing particles on canvas, slight trail effect
Map style: dark oceanic (Mapbox dark style or CartoDB dark matter)
When dropping: ripple animation at drop point
Garbage patch zone: faint red/orange tinted overlay
Time controls: play/pause, speed multiplier (1x, 10x, 100x, 1000x)
Current vectors: subtle animated arrows showing flow direction (optional toggle)

Supabase Schema
sqlcreate table bottles (
  id uuid primary key default gen_random_uuid(),
  message text,
  author_name text,
  start_lat float,
  start_lng float,
  current_lat float,
  current_lng float,
  path jsonb default '[]',
  status text default 'drifting',
  dropped_at timestamptz default now(),
  days_drifted int default 0,
  destination text
);
Simulation Clock

1 real second = configurable sim time (default 1 day)
Server-side cron (Supabase edge function or Next.js cron) updates all bottle positions every N seconds
Client subscribes to Supabase realtime for live position updates
Path is sampled every 30 sim-days to keep storage manageable

MVP Cut Line
If running short on time, cut in this order:

Cut real API current data → use fallback vector field ✂️
Cut server-side cron → run simulation client-side only ✂️
Cut coastline collision → only garbage patch destination ✂️
Cut Supabase realtime → just load all bottles on page load ✂️

Core experience that must work for demo: drop bottle, watch it move, see it drift toward garbage patch, click it to read message.
Pitch Angle
"We used real oceanographic current data to simulate how plastic drifts through the ocean. Drop a bottle anywhere — watch where your message ends up. 80% of bottles end up in 5 gyres. This is what we're doing to the ocean."
Resources

HYCOM data access: https://www.hycom.org/data-access
Copernicus Marine: https://marine.copernicus.eu/
OpenDrift (Python ocean drift simulator, good reference): https://opendrift.github.io/
Ocean current visualization reference: https://earth.nullschool.net/
OSCAR dataset: https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_third-deg