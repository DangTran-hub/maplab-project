# Maplab

Campus issue reporting with a web manager interface, a planned mobile reporter app,
and a planned shared API with SQLite storage.

## Repository structure

| Path | Purpose | Current state |
| --- | --- | --- |
| `web/` | React, Vite, and Leaflet web application | Runs with sample reports and a sample track |
| `mobile/` | React Native reporter application | Scaffold only; no runnable app yet |
| `backend/` | Node.js API and SQLite access | Scaffold only; no runnable API yet |
| `docs/` | Product scope and API contract | Design documentation |

Each application owns its dependencies and configuration. The root `package.json`
provides convenience commands for the existing web package; this is not an npm
workspace. Keep the web lockfile at `web/package-lock.json`.

## Run the web application

Use a Node.js version supported by Vite 8 (Node 20.19+ or 22.12+).
From the repository root:

```sh
npm run setup
npm run dev
```

Open the local URL printed by Vite. On Windows PowerShell, use `npm.cmd` instead
of `npm` if execution policy prevents loading `npm.ps1`.

```sh
npm run lint     # ESLint for the web application
npm run build    # Production output in web/dist/
npm run preview  # Serve the production build
```

You can also run `npm ci` and `npm run dev` directly inside `web/`.
The web app does not require the backend yet. Map tiles come from OpenStreetMap
and require internet access.

## Architecture and next steps

The intended data flow is `web/mobile -> backend API -> SQLite`. Only the backend
should access the database. Commit migrations and seed scripts; keep local
database files and secrets out of Git.

See [product scope](docs/PRODUCT.md) and [API contract](docs/api-spec.md).
Before implementing the API, reconcile the product's campus issue categories and
statuses with the older sample model (`start`, `landmark`, `end`, and `PENDING`).
Then implement report endpoints, connect the web app through `web/src/services/`,
and build the mobile client against the same API.
