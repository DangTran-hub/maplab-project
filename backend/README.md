# Backend

This is a scaffold for the planned Node.js API and SQLite storage. No server,
database schema, endpoints, or runnable package is implemented yet.

## Layout

- `src/modules/reports/`: report routes, request validation, business logic, and persistence calls.
- `src/db/migrations/`: versioned database schema changes.
- `src/db/seeds/`: development seed scripts.
- `tests/`: API and persistence tests when the backend is implemented.
- `storage/`: local SQLite database and other runtime files, ignored by Git.

Both clients will use this API; only the backend should read or write SQLite.
Commit migrations and seeds, not database files. When adding configuration,
document variable names in `.env.example` and keep real values in ignored `.env`
files.

Start with `../docs/api-spec.md`, after reconciling its sample categories and
statuses with `../docs/PRODUCT.md`. Add a backend `package.json`, lockfile, server
entry point, and documented run commands when implementing the API.
