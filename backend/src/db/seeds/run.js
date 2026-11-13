import { pathToFileURL } from "node:url";
import { openDatabase } from "../database.js";

export function seed(db) {
  const rows = [
    ["38ce5cc0-0fae-4f45-8f51-96e7a5c48101", "Đèn lối vào bị hỏng", "Đèn không sáng vào buổi tối.", "lighting", 21.0051, 105.8432],
    ["38ce5cc0-0fae-4f45-8f51-96e7a5c48102", "Cống thoát nước bị tắc", "Nước đọng trên lối đi sau mưa.", "paths_drainage", 21.0055, 105.8438],
    ["38ce5cc0-0fae-4f45-8f51-96e7a5c48103", "Thùng rác đã đầy", "Cần thu gom rác cạnh sân trường.", "waste", 21.0060, 105.8443],
    ["38ce5cc0-0fae-4f45-8f51-96e7a5c48104", "Ghế sân trường bị gãy", "Một thanh ghế bị gãy, cần sửa chữa.", "shared_facilities", 21.0058, 105.8430],
  ];
  const insert = db.prepare("INSERT INTO reports (id,title,description,category,latitude,longitude,imageUrl,status,createdAt) VALUES (?,?,?,?,?,?,NULL,'NEW',?) ON CONFLICT(id) DO NOTHING");
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const row of rows) insert.run(...row, "2026-11-13T00:00:00.000Z");
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = openDatabase();
  try { seed(db); console.log("Seed complete; existing reports preserved."); } finally { db.close(); }
}
