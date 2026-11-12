# Repository Guidelines

## Project Structure & Module Organization

This repository contains a working React web prototype and scaffolds for a React Native mobile app and Node.js backend with SQLite. The map still renders sample reports and a sample track; mobile and backend are not runnable yet.

- `web/src/main.jsx` mounts the application; `web/src/App.jsx` composes its page.
- `web/src/pages/` contains pages; `web/src/components/` contains map and layout components.
- `web/src/data/` holds sample reports and track coordinates; `web/src/styles/` holds CSS.
- `web/public/` holds static assets; `web/dist/` is ignored build output.
- `mobile/src/` and `mobile/assets/` reserve space for the reporter app.
- `backend/src/modules/reports/` reserves report logic; `backend/src/db/` contains migration and seed directories. Local runtime files belong in ignored `backend/storage/`.
- `docs/api-spec.md` describes the proposed REST contract. `docs/PRODUCT.md` describes the broader product scope.

## Build, Test, and Development Commands

- `npm run setup`: install web dependencies from `web/package-lock.json`.
- `npm run dev`: start the Vite development server.
- `npm run build`: generate the production bundle in `web/dist/`.
- `npm run preview`: serve the production build locally after building.
- `npm run lint`: run ESLint on the web package.

Run these commands from the repository root. Alternatively, use `npm ci` and the application scripts inside `web/`. On PowerShell, use `npm.cmd` if script execution is disabled. Each app owns its package files; the root forwards web commands.

## Coding Style & Naming Conventions

Use JavaScript ES modules, functional React components, and two-space indentation. Application files generally use double quotes and semicolons; configuration files use single quotes without semicolons. Match the surrounding file.

Use PascalCase for components, such as `MapView.jsx`, camelCase for data exports, and kebab-case for CSS classes. Keep fixtures in `web/src/data/`. ESLint enforces JavaScript, React Hooks, and React Refresh rules; no formatter is configured.

## Testing Guidelines

No automated test framework, test script, or coverage threshold is configured. Before submitting changes, run `npm run lint` and `npm run build`. For map changes, manually check tiles, markers, popup content, the track polyline, zoom interactions, and narrow-screen layout. Tile loading requires network access. If adding automated tests, document the runner, naming convention, and command.

## Commit & Pull Request Guidelines

History uses short, descriptive messages without mandatory prefixes. Prefer imperative summaries and focused commits. Existing branches use patterns such as `feature/report-data-model` and `docs/rest-api-contract`.

Pull requests should describe the behavior changed, link relevant issues, report validation performed, and include screenshots for visible UI changes. Update documentation when report fields or API assumptions change.
