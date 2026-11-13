# Campus Issue Map

## Product purpose

Help people report and track campus facility and environmental issues by location, so responsible staff can find and resolve them.

## Users

- **Reporter:** uses the Android app to view nearby reports, submit an issue with a description, photo, and location, and follow its status.
- **Manager:** uses the web app to review reports, inspect their details and locations, and update their status.

## Core workflow

1. A reporter submits an issue from the app with its category, description, and coordinates; a photo is optional.
2. The backend stores the report and returns it to both clients.
3. The app displays geolocated reports as map markers. Selecting a marker opens the report details and current status.
4. A manager reviews the report on the web and changes its status.
5. The reporter sees the updated status in the app.

## MVP scope

### Current delivery: backend–web demo (M0–M3)

This delivery includes a shared Node.js API, backend-only SQLite access and a web
manager map/list/detail interface with status filtering and forward status updates.
Reports are created with an HTTP tool. Android, device GPS and image upload are
postponed; imageUrl is always null. This is not the complete Android MVP below.

API categories are `lighting`, `paths_drainage`, `waste`, `shared_facilities`.
Statuses advance only `NEW → IN_PROGRESS → RESOLVED`; creation assigns NEW.
Title, description, category and numeric coordinates are required. The server
generates UUID identifiers and UTC timestamps. Old route fixtures are not migrated.
The demo is restricted to a trusted LAN with no authentication or role enforcement.
Refresh is manual and filtering is client-side. No report editing/deletion.

Demo acceptance: HTTP create → SQLite → web marker → web status update → reload
and backend restart preserve the same report and status.

### Full MVP 1.0 (later delivery)

- Android app: report list/map, marker details, create a report, and view report status.
- Web app: report list, report details, status filtering, and status updates.
- Backend: shared API and persistent SQLite storage for reports and their coordinates.
- Statuses: `New`, `In Progress`, and `Resolved`.
- Issue categories: lighting, paths or drainage, waste, and shared facilities.

## Out of scope for MVP

Turn-by-turn navigation, chat, push notifications, public comments, advanced analytics, and reports unrelated to campus facilities or the environment.

## Full MVP success criteria

Using the full MVP, a reporter can submit a geolocated issue, see its marker and details in the app, and later see a manager's status update. A manager can find the same report on the web and change its status. Both clients use the same backend data. The smaller M0–M3 delivery uses the separate demo acceptance above.

## Technical constraints

- Web: React and JavaScript.
- Android: React Native and JavaScript.
- Backend: Node.js.
- Database: SQLite.
- Map markers must be rendered from report coordinates returned by the backend; report data must not be hard-coded into the map UI.
