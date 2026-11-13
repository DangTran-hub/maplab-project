import { Router } from "express";
import { randomUUID } from "node:crypto";

const categories = ["lighting", "paths_drainage", "waste", "shared_facilities"];
const nextStatus = { NEW: "IN_PROGRESS", IN_PROGRESS: "RESOLVED" };

function invalid(res, details) {
  return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "The request is invalid.", details } });
}
function missing(res) {
  return res.status(404).json({ error: { code: "REPORT_NOT_FOUND", message: "Report not found." } });
}

export function reportsRouter(db) {
  const router = Router();
  const find = db.prepare("SELECT * FROM reports WHERE id = ?");
  router.get("/", (req, res) => res.json(db.prepare("SELECT * FROM reports ORDER BY createdAt DESC, id DESC").all()));
  router.get("/:id", (req, res) => {
    const report = find.get(req.params.id);
    return report ? res.json(report) : missing(res);
  });
  router.use((req, res, next) => {
    if (["POST", "PATCH"].includes(req.method) && !req.is("application/json")) {
      return res.status(415).json({ error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Use application/json." } });
    }
    next();
  });
  router.post("/", (req, res) => {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) return invalid(res, [{ field: "body", message: "Must be a JSON object." }]);
    const errors = [];
    const allowed = ["title", "description", "category", "latitude", "longitude", "imageUrl"];
    for (const field of Object.keys(body)) if (!allowed.includes(field)) errors.push({ field, message: "Field is not accepted." });
    for (const field of ["title", "description"]) {
      if (typeof body[field] !== "string" || !body[field].trim()) errors.push({ field, message: "Must contain non-whitespace text." });
    }
    if (!categories.includes(body.category)) errors.push({ field: "category", message: "Unsupported issue category." });
    for (const [field, limit] of [["latitude", 90], ["longitude", 180]]) {
      if (!Number.isFinite(body[field]) || Math.abs(body[field]) > limit) errors.push({ field, message: `Must be a number between -${limit} and ${limit}.` });
    }
    if (Object.hasOwn(body, "imageUrl") && body.imageUrl !== null) errors.push({ field: "imageUrl", message: "Images are not supported; use null or omit." });
    if (errors.length) return invalid(res, errors);
    const id = randomUUID();
    db.prepare("INSERT INTO reports (id,title,description,category,latitude,longitude,imageUrl,status,createdAt) VALUES (?,?,?,?,?,?,NULL,'NEW',?)")
      .run(id, body.title.trim(), body.description.trim(), body.category, body.latitude, body.longitude, new Date().toISOString());
    return res.status(201).location(`/api/reports/${id}`).json(find.get(id));
  });
  router.patch("/:id/status", (req, res) => {
    const report = find.get(req.params.id);
    if (!report) return missing(res);
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 1 || !Object.hasOwn(body, "status") || body.status !== nextStatus[report.status]) {
      return invalid(res, [{ field: "status", message: "Only NEW → IN_PROGRESS → RESOLVED is allowed." }]);
    }
    const result = db.prepare("UPDATE reports SET status = ? WHERE id = ? AND status = ?").run(body.status, report.id, report.status);
    if (result.changes !== 1) return invalid(res, [{ field: "status", message: "Report changed; refresh and try again." }]);
    return res.json(find.get(report.id));
  });
  return router;
}
