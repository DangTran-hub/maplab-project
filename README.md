# Maplab

Campus issue reporting: a React/Vite/Leaflet web manager and Node.js/SQLite API.
The M0–M3 backend–web demo is implemented; Android is still a scaffold.
Reports are created with an HTTP tool. No image upload or authentication yet.
Run only on a trusted LAN.

| Path | Current state |
| --- | --- |
| web/ | API-backed map, list, details, status filtering and forward status updates |
| backend/ | Express API, SQLite migrations/seeds and node:test integration tests |
| mobile/ | React Native scaffold; deferred |
| docs/ | Product scope, API contract and manual demo checklist |

Each app owns its dependencies and lockfile. This is not an npm workspace.
Use **Node.js 24**. Only backend accesses SQLite. Runtime files and .env are ignored.

## Start from the repository root

On PowerShell use npm.cmd if script execution policy blocks npm.ps1.

```sh
npm run setup
npm run setup:backend
npm run db:migrate
npm run db:seed
npm run api
```

Keep API running in terminal 1 (port 3001). In terminal 2:

```sh
npm run dev
```

Open http://localhost:5173. Vite proxies /api to http://127.0.0.1:3001.
Seed is optional, repeatable and never resets existing statuses. No automatic
migration/seed runs on startup. The web has no sample-data fallback when API fails.
The simplified street map uses OpenFreeMap vector tiles through a MapLibre layer
inside Leaflet. It retains street names, landmark names and flat building
footprints while removing minor points of interest, decorative patterns and 3D
buildings. Vietnamese map names are preferred when available. No map API key is
required. See the [OpenFreeMap guide](https://openfreemap.org/quick_start/).
The cleaned style is bundled in `web/src/data/streetMapStyle.json`; every polygon
has an explicit light color, including pedestrian areas. The app does not fetch
or modify a live remote style. Run `npm --prefix web run test:map-style` to check
the map color and geometry safeguards.
Named libraries, schools, departments, offices and dormitories are shown from
zoom 15, regardless of their source rank. More nearby destinations appear from
zoom 17, and building/address numbers from zoom 18. Labels prefer Vietnamese,
avoid overlap and use the map provider's actual names; unnamed buildings are
not assigned invented names.
Map assets require internet and the vector renderer requires WebGL. If the style
or renderer fails, the map falls back to standard OpenStreetMap tiles with a
visible notice. Report lists still work if map assets are unavailable.

The manager supports report search, status filters, keyboard-accessible map pins
and a “Xem toàn bộ” control to fit all visible reports.

## Configuration and LAN

- Optional backend/.env: copy backend/.env.example and adjust HOST, PORT,
  DATABASE_PATH and WEB_ORIGINS.
- Optional web/.env: copy web/.env.example and set VITE_API_URL including /api.
  This is a public, build-time setting; restart Vite/rebuild after changing it.
- Default Vite dev/preview proxy allows another device to use
  http://YOUR_LAN_IP:5173 with the same-origin /api URL; backend may remain local.
- If calling backend directly from a browser on a different origin, add the exact
  web origin to WEB_ORIGINS and set VITE_API_URL to a reachable backend URL.
- If backend port changes, update the Vite proxy target or use VITE_API_URL.
- Allow the required port through Windows Firewall on your trusted network.
  Neither CORS nor the UI provides authentication.
- Build output needs /api routed to backend when hosted outside Vite.

## Validation and build

```sh
npm test
npm run lint
npm run build
npm run preview
```

Tests use Node's built-in runner, backend/tests/*.test.js, temporary databases and
ephemeral HTTP ports; they do not modify the demo DB.
Preview serves the production web build with the same local API proxy (default port 4173).

See [HTTP examples and backend setup](backend/README.md),
[manual demo checklist](docs/demo.md), [API contract](docs/api-spec.md) and
[product scope](docs/PRODUCT.md).

The complete MVP 1.0 will additionally require Android reporting, GPS, optional
photo upload, a mobile map and an installable APK.
