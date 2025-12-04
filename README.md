# Panorama Trace Mission — Challenge Guide

## Purpose

Panorama Trace Mission is a geo-OSINT practice challenge inspired by GeoGuessr. Players explore 360° panoramas or static scenes, drop a marker on the map, and receive a flag when they pinpoint the exact latitude and longitude. It was designed for CTF organisers who want a lightweight, self-hostable mission hub that showcases multiple locations grouped by difficulty tiers.

## Components

- **Express backend (`src/server.js`)** serves static assets, validates coordinate submissions, and enforces a global rate limit of three guesses per challenge per minute.
- **Frontend (`src/index.html`, `src/chall.html`, `public/js/*.js`)** renders the mission board, panorama viewer, and Leaflet map interface.
- **Challenge metadata** is split between the public catalogue (`src/public/info.json`) and the private solution file (`src/challs.json`). Flags live only in the private file.
- **Checker script (`checker/solve.py`)** automates verification by replaying the winning coordinates against a live deployment.

## Running Locally

1. Install Node.js 18+ and npm.
2. From `src/`, run `npm install` to pull dependencies (Express, Leaflet helpers, Photo Sphere Viewer, etc.).
3. Launch the server with `npm start` or `node server.js`. The site listens on `http://localhost:6958`.
4. Open the landing page in a browser and select a mission tile to start playing.

### Docker Option

```sh
docker compose up --build
```

This builds the container, mounts the challenge files, and exposes port 6958 ready for players or automated checkers.

## Customising Challenges

1. Add panorama assets under `src/public/img/<category>/<slug>/pano.jpg` (and optional thumbnails).
2. Update `src/public/info.json` to list the new slug under the correct difficulty tier.
3. Add the authoritative coordinates, panorama mode, zoom cap, and flag to `src/challs.json`.
4. Restart the server or container to load the new entries.

## Playing the Challenge

- Visit the mission hub, choose a category tile, and inspect the panorama.
- Drop a pin on the Leaflet map; submissions are sent as latitude/longitude pairs.
- An exact match returns the flag string. Misses provide a hint to adjust the marker.
- If the rate limit triggers, players must wait for the cooldown shown in the response message.

## Verifying Solutions

- Export the deployment base URL as `PTM_URL` if it differs from the default domain.
- Run `python checker/solve.py`; the script loops through every challenge, submits the canonical coordinates, and concatenates the returned flag fragments.
- Any error prints to stderr and exits with code 1, making it CI-friendly.

## Intended Use Cases

- **CTF finals or quals** seeking a location-based OSINT puzzle set.
- **Workshops** focusing on map intelligence or panorama analysis.
- **Onboarding exercises** where organisers can quickly seed approachable missions before scaling difficulty.

Bundle this guide with the repository when sharing the challenge so operators understand how to deploy, extend, and verify the experience.
