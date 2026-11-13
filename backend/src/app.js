import express from "express";
import { reportsRouter } from "./modules/reports/routes.js";
import { webOrigins } from "./config.js";

export function createApp(db, { origins = webOrigins } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.vary("Origin");
    if (origins.includes(req.headers.origin)) res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: "100kb", strict: false }));
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/reports", reportsRouter(db));
  app.use((req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found." } }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === "entity.parse.failed") return res.status(400).json({ error: { code: "INVALID_JSON", message: "The request body is not valid JSON." } });
    if (error.type === "entity.too.large") return res.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "JSON body exceeds 100 KB." } });
    console.error(error);
    return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
  });
  return app;
}
