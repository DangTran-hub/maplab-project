# Backend — M0–M3

Node.js 24, Express, node:sqlite. Only this process reads/writes SQLite.
No authentication; use a trusted LAN only. API contract: ../docs/api-spec.md.

## Setup

From repository root:

```sh
npm run setup:backend
npm run db:migrate
npm run db:seed
npm run api
```

Or inside backend/: npm ci, npm run migrate, npm run seed, npm start.
npm run dev enables watch mode. Startup requires an already-migrated database.
Migration and seed are explicit; seed is optional and preserves existing records.
The default DB is backend/storage/maplab.sqlite and contains only business reports.
Old route fixtures are not imported. No SQLite or runtime data is committed.

## Configuration

Copy .env.example to .env if needed. Package scripts load backend/.env.

| Variable | Default |
| --- | --- |
| HOST | 0.0.0.0 |
| PORT | 3001 |
| DATABASE_PATH | storage/maplab.sqlite, resolved from backend/ |
| WEB_ORIGINS | http://localhost:5173,http://127.0.0.1:5173 |

Set a different DATABASE_PATH in .env before migrate/start to create a clean demo.
Do not delete a working database merely to clear the screen.
For a backup, stop backend and copy the SQLite file; restore while stopped.
Images do not exist in this phase.

## HTTP demo (PowerShell)

With API running:

```powershell
$apiBase = "http://localhost:3001/api"
Invoke-RestMethod "$apiBase/health"
Invoke-RestMethod "$apiBase/reports"

$reportBody = @{
  title = "Đèn sân trường bị hỏng"
  description = "Đèn cạnh lối vào không sáng vào buổi tối."
  category = "lighting"
  latitude = 21.0051
  longitude = 105.8432
} | ConvertTo-Json

$createdReport = Invoke-RestMethod "$apiBase/reports" -Method Post -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($reportBody))
$createdReport

# Click Làm mới on web, select this report, and change its status there.
Invoke-RestMethod "$apiBase/reports/$($createdReport.id)"

# Or advance via API (only if its current state is still NEW):
Invoke-RestMethod "$apiBase/reports/$($createdReport.id)/status" -Method Patch -ContentType "application/json" -Body '{"status":"IN_PROGRESS"}'
```

POST generates UUID, NEW, UTC timestamp, imageUrl:null. Unknown fields and
server-owned fields are rejected. PATCH accepts only the immediate next state.
Malformed JSON, validation, missing records, oversized payloads and wrong content
types have JSON error responses. No uploads, external image URLs, edit or delete.

## Tests

```sh
npm test
```

Runner: node:test, files tests/*.test.js. Tests exercise real HTTP, enum/coordinate
validation, lifecycle, concurrent transitions, CORS, error contracts, migrations,
repeat seed and persistence across database connection restart.
Temporary databases are isolated from storage/maplab.sqlite.

Layout: src/server.js entrypoint; src/app.js HTTP middleware; src/modules/reports/
routes and validation; src/db/migrations/ versioned SQL; src/db/seeds/ business fixtures.
