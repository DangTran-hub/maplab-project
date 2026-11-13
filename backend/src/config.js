import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const backendRoot = fileURLToPath(new URL("../", import.meta.url));
export const databasePath = resolve(backendRoot, process.env.DATABASE_PATH || "storage/maplab.sqlite");
export const webOrigins = (process.env.WEB_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
