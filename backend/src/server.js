import { openDatabase } from "./db/database.js";
import { createApp } from "./app.js";

const db = openDatabase();
// Never migrate or seed implicitly on startup.
try { db.prepare("SELECT id FROM reports LIMIT 1").get(); } catch (error) {
  db.close();
  console.error("Database is not ready. Run npm run migrate in backend/ first.");
  throw error;
}
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "0.0.0.0";
const server = createApp(db).listen(port, host, () => console.log(`Maplab API listening on ${host}:${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
