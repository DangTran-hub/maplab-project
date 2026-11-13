# Maplab reports API — M0–M3

Base path: /api. JSON requests/responses. Trusted LAN demo only, without
authentication or role enforcement; do not expose publicly.

## Report model

| Field | Contract |
| --- | --- |
| id | Server-generated UUID string |
| title, description | Required non-whitespace strings, trimmed |
| category | lighting, paths_drainage, waste, shared_facilities |
| latitude | Finite JSON number, -90 through 90 |
| longitude | Finite JSON number, -180 through 180 |
| imageUrl | Always null in this demo |
| status | NEW, IN_PROGRESS, RESOLVED |
| createdAt | Server-generated UTC ISO 8601 timestamp |

Old geographic-route fixtures are not business categories and are not migrated.
No image upload or external image URLs. Omit imageUrl or send null on create.

## Endpoints

- GET /api/health: 200 {"status":"ok"}.
- GET /api/reports: 200 array, newest first (ID breaks timestamp ties); [] when empty.
  No pagination/server filters; web filters locally.
- GET /api/reports/{id}: 200 report or 404 REPORT_NOT_FOUND.
- POST /api/reports: requires title, description, category, latitude, longitude.
  201 report and Location header. Server assigns UUID, NEW and createdAt.
  Client-supplied id, status, createdAt and unknown fields are rejected.
- PATCH /api/reports/{id}/status: {"status":"IN_PROGRESS"} or {"status":"RESOLVED"}.
  200 updated report. Only NEW → IN_PROGRESS → RESOLVED is allowed.
  Skipping, reversing or repeating a state returns 400 VALIDATION_ERROR.
  Unknown fields are rejected. Missing ID returns 404.

Example POST body:

```json
{
  "title": "Đèn sân trường bị hỏng",
  "description": "Đèn cạnh lối vào không sáng vào buổi tối.",
  "category": "lighting",
  "latitude": 21.0051,
  "longitude": 105.8432
}
```

## Errors

```json
{"error":{"code":"VALIDATION_ERROR","message":"The request is invalid.","details":[{"field":"latitude","message":"Must be a number between -90 and 90."}]}}
```

details appears only for validation errors. Codes:
400 VALIDATION_ERROR, 400 INVALID_JSON, 404 REPORT_NOT_FOUND,
404 NOT_FOUND (unknown route), 413 PAYLOAD_TOO_LARGE (JSON limit 100 KB),
415 UNSUPPORTED_MEDIA_TYPE (POST/PATCH require application/json),
500 INTERNAL_ERROR. Internal details are not exposed.
Concurrent status writes are conditional on the previous status.

## Storage and configuration

Only backend accesses SQLite. Startup does not migrate or seed.
Migration and seed are separate explicit commands; repeat seed preserves existing data.
Database defaults to backend/storage/maplab.sqlite, independent of working directory.
See backend/README.md for setup, configuration and HTTP demo commands.
