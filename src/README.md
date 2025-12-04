# Geosint Free Map

Customised Geo-OSINT challenge board inspired by GeoGuessr. Players explore 360° panoramas or static scenes, place a guess on the map, and unlock flags when they pinpoint the location.

## Features

- **Categorised mission hub** – difficulty columns (`easy`, `medium`, `hard`, `final_boss`) with animated cards rendered from `public/info.json`.
- **Panorama modes** – per challenge toggle between Photo Sphere Viewer (360°) and a static image via `panoType` in `challs.json`.
- **Express backend with rate limiting** – POST submissions are capped per challenge to reduce brute force and griefing attempts.
- **Docker-ready** – build-and-run via `docker compose` or plain `docker` without extra setup.
- **Modern UI** – glassmorphism layout, responsive map box with hover enlargement, Lucide icons, and mission briefing sidebar.

## Project Structure

```
├── Dockerfile
├── docker-compose.yml
├── server.js             # Express app & rate limiting
├── challs.json           # Private challenge metadata (coords, flags, panoType)
├── public/
│   ├── info.json         # Public challenge catalogue (categories, thumbnails)
│   ├── css/
│   │   ├── main.css      # Landing page styles
│   │   └── chall.css     # Challenge play page styles
│   ├── js/
│   │   ├── main.js       # Builds landing page cards from info.json
│   │   └── chall.js      # Panorama/Leaflet logic, rate-limit handling
│   └── img/
│       └── <category>/<challenge>/pano.jpg (+thumbs)
├── index.html            # Landing page
└── chall.html            # Challenge play view
```

## Challenge Data

### `public/info.json`

Public catalogue used by the landing page. Keys are difficulty “competitions”, values are challenge slugs and optional thumbnail names.

```json
{
        "first": {
                "one": { "img": "thumb.png" }
        },
        "second": {
                "two": { "img": "thumb.png" }
        }
}
```

### `challs.json`

Private metadata loaded server-side. Each entry must match the slug used in `info.json` and in the filesystem.

```json
{
        "second": {
                "two": {
                        "panoType": 1,
                        "lat": xx.xxxx,
                        "lng": xx.xxxx,
                        "maxZ": 5,
                        "flag": "FLAG{...}" 
                }
        }
}
```

- `panoType: 1` → render via Photo Sphere Viewer (360°).
- `panoType: 0` → render as a static image (`pano.jpg`).
- `lat`/`lng` match the winning coordinates.
- `maxZ` controls Leaflet zoom cap (1–19, practice sticks to 5).
- `flag` is returned to the player upon exact hit.

### Assets

Place challenge media under `public/img/<category>/<challenge>/` with:

- `pano.jpg` – mandatory panorama/static image file.
- optional `thumb.png` (or other extension) for the landing card thumbnail.

Ensure folder names match the slugs in both JSON files.

## Adding a New Challenge

1. **Create folders** – add `public/img/<category>/<slug>/` and drop `pano.jpg` (+thumb if desired).
2. **Update `public/info.json`** – add the slug under the desired category with thumbnail reference.
3. **Update `challs.json`** – add the same slug with panoType, coords, zoom, and flag.
4. **Restart the server / container** – Express loads `challs.json` at startup.
5. **Verify** – open the landing page to confirm the new card appears; navigate to `/category-slug` and test a submission.

## Rate Limiting

- Default limit: **3 attempts per challenge per minute** shared across all players.
- Responses include a cooldown timer when the limit is hit.
- Adjust behaviour in `checkChallengeRateLimit` (e.g., change window or bucket key) as needed.


## Credits

- Based on the original [geosint clone by JustHacking](https://github.com/JustHackingCo/geosint) but changed with free tools.
- Uses Leaflet, Photo Sphere Viewer 4, Lucide icons, and Inter / JetBrains Mono fonts.
