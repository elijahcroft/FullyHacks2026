# Pollution Path Prediction (PPP) Simulator

An interactive ocean drift simulator that helps users visualize how plastic, oil, and chemical pollution can spread across the ocean over time. PPP Simulator lets users drop a bottle or spill point onto a map, simulate drift using ocean current data, and explore which sensitive marine regions may be affected.

## Overview

Pollution Path Prediction (PPP) Simulator was built to make ocean pollution movement more visible, tangible, and easier to understand. Instead of treating marine pollution as a static event, the simulator shows how debris or spills can move across currents, coastlines, gyres, and ecologically sensitive areas.

The app combines geospatial visualization, current-driven simulation, and environmental context into a browser-based experience that is both educational and exploratory.

## Features

* **Interactive ocean map** for exploring global waters
* **Bottle and spill dropping** directly onto the map
* **Drift simulation engine** that advances pollution day by day
* **Simulation controls** to pause, resume, and speed up time
* **Path visualization** showing where pollution has traveled
* **Flow field rendering** to visualize the currents driving the drift
* **Environmental hazard overlays** for sensitive marine regions
* **AI-assisted analysis** for interpreting ecological impact
* **Interception path planning** to help estimate where a response vessel could stop the spread
* **Persistent local state** so scenarios remain available in the browser between sessions

## Why We Built It

We wanted to answer a simple question: when pollution enters the ocean, where does it actually go?

Most people only see the moment pollution is released, but not the long-term journey that follows. PPP Simulator was created to help users understand how currents can carry pollution through open water, onto coastlines, and into fragile habitats. By making those paths interactive and visible, the project encourages prevention, awareness, and better response planning.

## Tech Stack

This project is built with:

* **Next.js 16**
* **React 19**
* **TypeScript**
* **Tailwind CSS 4**
* **Leaflet / React Leaflet** for map interaction
* **Node.js tooling** for scripts and local development

## Project Structure

```text
.
├── app/                # Next.js app router entry points
├── canvas/             # Bottle state and map interaction hooks
├── lib/                # Shared utilities
├── public/             # Static assets and generated data
├── scripts/            # Data generation scripts
├── simulation/         # Simulation state and drift logic
├── types/              # Shared TypeScript types
├── ui/                 # UI and map components
├── next.config.ts
├── package.json
└── tsconfig.json
```

## How It Works

PPP Simulator is centered around a map-first workflow:

1. A user explores the map and drops a bottle or spill point into the ocean.
2. The simulation engine updates the object over time using a pre-generated current field.
3. The app tracks the drift history and renders the evolving path.
4. Hazard overlays and environmental context help users see what ecosystems may be affected.
5. AI-assisted analysis adds region-aware explanations for the selected object.
6. Interception calculations help estimate where response efforts could be deployed.

## Ocean Current Modeling

The simulator includes a script for generating a pre-baked current field used by the app:

```bash
npm run gen:field
```

This creates a current-field JSON asset used by the frontend simulation. The included generator models major ocean gyres to support fast, browser-based path prediction.

## Getting Started

### Prerequisites

* Node.js
* npm

### Installation

Clone the repository:

```bash
git clone https://github.com/elijahcroft/FullyHacks2026.git
cd FullyHacks2026
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the app locally at:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev       # Start the local development server
npm run build     # Build the project for production
npm run start     # Run the production build
npm run gen:field # Generate the current-field data asset
```

## Use Cases

PPP Simulator can be used for:

* Environmental education
* Interactive storytelling about marine pollution
* Scenario testing for drift behavior
* Demonstrating the importance of marine protected areas
* Exploring response and interception planning concepts

## Challenges

One of the main challenges in the project was working through the vector math required for current-based path prediction and rendering the environmental data clearly enough to remain interactive and understandable.

## What We Learned

Through building PPP Simulator, we learned a great deal about:

* geospatial visualization
* current-vector simulation in the browser
* balancing scientific inspiration with usability
* designing interfaces that can layer multiple environmental signals at once

## Future Improvements

Planned next steps include:

* replacing simplified hazard regions with more accurate GeoJSON overlays
* supporting more detailed oil, plastic, and chemical spill modes
* improving interception and cleanup response planning
* incorporating winds, tides, and weather-linked forcing data
* enabling side-by-side scenario comparisons
* expanding educational context and source transparency

## Live Demo

* **Project page:** [https://devpost.com/software/polution-prediction-path-ppp-simulator](https://devpost.com/software/polution-prediction-path-ppp-simulator)
* **Repository:** [https://github.com/elijahcroft/FullyHacks2026](https://github.com/elijahcroft/FullyHacks2026)
* **Deployed app:** [https://polutionpath.vercel.app](https://polutionpath.vercel.app)

## Team

Created for **FullyHacks 2026** by:

* Elijah Croft
* Aidan Dao
* Fristine Sok
* Ryan Wagner
