import { readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { openDatabase } from "./database.js";

export function migrate(db) {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)");
  const directory = new URL("./migrations/", import.meta.url);
  for (const name of readdirSync(directory).filter((file) => file.endsWith(".sql")).sort()) {
    db.exec("BEGIN IMMEDIATE");
    try {
      if (!db.prepare("SELECT name FROM schema_migrations WHERE name = ?").get(name)) {
        db.exec(readFileSync(new URL(name, directory), "utf8"));
        db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(name);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = openDatabase();
  try { migrate(db); console.log("Migrations complete."); } finally { db.close(); }
}
