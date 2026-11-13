import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { openDatabase } from "../src/db/database.js";
import { migrate } from "../src/db/migrate.js";
import { seed } from "../src/db/seeds/run.js";
import { createApp } from "../src/app.js";

const valid = {
  title: " Đèn sân trường ",
  description: " Đèn không sáng vào buổi tối. ",
  category: "lighting",
  latitude: 21.0051,
  longitude: 105.8432,
};

async function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "maplab-test-"));
  const path = join(directory, "test.sqlite");
  const db = openDatabase(path);
  migrate(db);
  const server = createApp(db).listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  async function call(path, method = "GET", body, headers = {}) {
    const response = await fetch(base + path, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { response, data: await response.json() };
  }
  return { db, path, base, call };
}

test("empty database, health, missing report and route", async (t) => {
  const { call } = await fixture(t);
  assert.deepEqual((await call("/api/health")).data, { status: "ok" });
  const empty = await call("/api/reports");
  assert.equal(empty.response.status, 200);
  assert.deepEqual(empty.data, []);
  const absent = await call("/api/reports/no-such-id");
  assert.equal(absent.response.status, 404);
  assert.equal(absent.data.error.code, "REPORT_NOT_FOUND");
  assert.equal((await call("/unknown")).data.error.code, "NOT_FOUND");
});

test("create produces normalized server fields and supports exact coordinate boundaries", async (t) => {
  const { call } = await fixture(t);
  const created = await call("/api/reports", "POST", { ...valid, latitude: -90, longitude: 180, imageUrl: null });
  assert.equal(created.response.status, 201);
  assert.match(created.data.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(created.response.headers.get("location"), `/api/reports/${created.data.id}`);
  assert.equal(created.data.status, "NEW");
  assert.equal(created.data.imageUrl, null);
  assert.equal(created.data.title, valid.title.trim());
  assert.equal(created.data.description, valid.description.trim());
  assert.equal(new Date(created.data.createdAt).toISOString(), created.data.createdAt);
  assert.deepEqual((await call(`/api/reports/${created.data.id}`)).data, created.data);
});

test("validation rejects bad data without writing rows", async (t) => {
  const { call } = await fixture(t);
  const bodies = [
    {}, null, [], "text", 42,
    { ...valid, title: "  " }, { ...valid, description: null },
    { ...valid, category: "start" }, { ...valid, category: "landmark" },
    { ...valid, category: "end" }, { ...valid, category: "LIGHTING" },
    { ...valid, latitude: "21" }, { ...valid, latitude: 91 },
    { ...valid, longitude: -181 }, { ...valid, latitude: null },
    { ...valid, imageUrl: "https://example.com/photo.jpg" },
    { ...valid, id: "fake" }, { ...valid, status: "NEW" },
    { ...valid, status: "PENDING" }, { ...valid, createdAt: "now" },
    { ...valid, extra: true },
  ];
  for (const body of bodies) {
    const result = await call("/api/reports", "POST", body);
    assert.equal(result.response.status, 400, JSON.stringify(body));
    assert.equal(result.data.error.code, "VALIDATION_ERROR");
    assert.ok(result.data.error.details.length);
  }
  assert.deepEqual((await call("/api/reports")).data, []);
});

test("all four business categories are accepted", async (t) => {
  const { call } = await fixture(t);
  for (const category of ["lighting", "paths_drainage", "waste", "shared_facilities"]) {
    assert.equal((await call("/api/reports", "POST", { ...valid, category })).response.status, 201);
  }
});

test("status follows forward lifecycle, rejects skips/repeats/reverse/extra fields", async (t) => {
  const { call } = await fixture(t);
  const { data } = await call("/api/reports", "POST", valid);
  const url = `/api/reports/${data.id}/status`;
  for (const body of [{ status: "RESOLVED" }, { status: "PENDING" }, {}, null, [], { status: "IN_PROGRESS", title: "other" }]) {
    assert.equal((await call(url, "PATCH", body)).response.status, 400);
  }
  const progress = await call(url, "PATCH", { status: "IN_PROGRESS" });
  assert.equal(progress.response.status, 200);
  assert.equal(progress.data.status, "IN_PROGRESS");
  assert.equal((await call(url, "PATCH", { status: "IN_PROGRESS" })).response.status, 400);
  assert.equal((await call(url, "PATCH", { status: "NEW" })).response.status, 400);
  assert.equal((await call(url, "PATCH", { status: "RESOLVED" })).data.status, "RESOLVED");
  assert.equal((await call(url, "PATCH", { status: "NEW" })).response.status, 400);
  assert.equal((await call(url, "PATCH", { status: "RESOLVED" })).response.status, 400);
  assert.equal((await call(`/api/reports/${data.id}`)).data.createdAt, data.createdAt);
  assert.equal((await call("/api/reports/missing/status", "PATCH", { status: "IN_PROGRESS" })).response.status, 404);
});

test("concurrent updates allow only one transition", async (t) => {
  const { call } = await fixture(t);
  const { data } = await call("/api/reports", "POST", valid);
  const results = await Promise.all([
    call(`/api/reports/${data.id}/status`, "PATCH", { status: "IN_PROGRESS" }),
    call(`/api/reports/${data.id}/status`, "PATCH", { status: "IN_PROGRESS" }),
  ]);
  assert.deepEqual(results.map((r) => r.response.status).sort(), [200, 400]);
});

test("malformed JSON, wrong media type and oversized requests use safe JSON errors", async (t) => {
  const { base } = await fixture(t);
  for (const [body, type, status, code] of [
    ["{", "application/json", 400, "INVALID_JSON"],
    ["text", "text/plain", 415, "UNSUPPORTED_MEDIA_TYPE"],
    [JSON.stringify({ ...valid, description: "x".repeat(110000) }), "application/json", 413, "PAYLOAD_TOO_LARGE"],
  ]) {
    const response = await fetch(base + "/api/reports", { method: "POST", headers: { "Content-Type": type }, body });
    assert.equal(response.status, status);
    assert.equal((await response.json()).error.code, code);
  }
});

test("CORS allows configured browser origin and preflight only", async (t) => {
  const { base } = await fixture(t);
  const allowed = await fetch(base + "/api/reports", { headers: { Origin: "http://localhost:5173" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");
  await allowed.arrayBuffer();
  const denied = await fetch(base + "/api/reports", { headers: { Origin: "https://untrusted.example" } });
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
  await denied.arrayBuffer();
  const preflight = await fetch(base + "/api/reports/id/status", { method: "OPTIONS", headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "PATCH" } });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get("access-control-allow-methods"), /PATCH/);
});

test("SQLite data persists across connection restart; migration/seed preserve data", async () => {
  const directory = mkdtempSync(join(tmpdir(), "maplab-persist-"));
  const path = join(directory, "test.sqlite");
  let db;
  try {
    db = openDatabase(path);
    migrate(db);
    seed(db);
    const first = db.prepare("SELECT * FROM reports ORDER BY id LIMIT 1").get();
    db.prepare("UPDATE reports SET status = 'IN_PROGRESS' WHERE id = ?").run(first.id);
    db.close();
    db = openDatabase(path);
    migrate(db);
    seed(db);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM reports").get().count, 4);
    assert.equal(db.prepare("SELECT status FROM reports WHERE id = ?").get(first.id).status, "IN_PROGRESS");
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get().count, 1);
    assert.throws(() => db.prepare("UPDATE reports SET category = 'start'").run());
    assert.throws(() => db.prepare("UPDATE reports SET latitude = 91").run());
    assert.throws(() => db.prepare("UPDATE reports SET imageUrl = 'file.jpg'").run());
  } finally {
    db?.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("HTTP create/update survives server restart without reseeding", async () => {
  const directory = mkdtempSync(join(tmpdir(), "maplab-http-restart-"));
  const path = join(directory, "test.sqlite");
  let db;
  let server;
  async function start() {
    db = openDatabase(path);
    server = createApp(db).listen(0, "127.0.0.1");
    await once(server, "listening");
    return `http://127.0.0.1:${server.address().port}/api/reports`;
  }
  try {
    db = openDatabase(path);
    migrate(db);
    db.close();
    let base = await start();
    const created = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(valid) });
    const report = await created.json();
    assert.equal(created.status, 201);
    const changed = await fetch(`${base}/${report.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "IN_PROGRESS" }) });
    assert.equal(changed.status, 200);
    const expected = await changed.json();
    await new Promise((resolve) => server.close(resolve));
    db.close();
    base = await start();
    const loaded = await fetch(`${base}/${report.id}`);
    assert.equal(loaded.status, 200);
    assert.deepEqual(await loaded.json(), expected);
  } finally {
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
    db?.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
