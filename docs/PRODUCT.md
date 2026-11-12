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

- Android app: report list/map, marker details, create a report, and view report status.
- Web app: report list, report details, status filtering, and status updates.
- Backend: shared API and persistent SQLite storage for reports and their coordinates.
- Statuses: `New`, `In Progress`, and `Resolved`.
- Issue categories: lighting, paths or drainage, waste, and shared facilities.

## Out of scope for MVP

Turn-by-turn navigation, chat, push notifications, public comments, advanced analytics, and reports unrelated to campus facilities or the environment.

## Success criteria

Using the demo, a reporter can submit a geolocated issue, see its marker and details in the app, and later see a manager's status update. A manager can find the same report on the web and change its status. Both clients use the same backend data.

## Technical constraints

- Web: React and JavaScript.
- Android: React Native and JavaScript.
- Backend: Node.js.
- Database: SQLite.
- Map markers must be rendered from report coordinates returned by the backend; report data must not be hard-coded into the map UI.