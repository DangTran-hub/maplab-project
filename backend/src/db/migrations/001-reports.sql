CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK(length(trim(title)) > 0),
  description TEXT NOT NULL CHECK(length(trim(description)) > 0),
  category TEXT NOT NULL CHECK(category IN ('lighting','paths_drainage','waste','shared_facilities')),
  latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
  imageUrl TEXT CHECK(imageUrl IS NULL),
  status TEXT NOT NULL CHECK(status IN ('NEW','IN_PROGRESS','RESOLVED')),
  createdAt TEXT NOT NULL
);
