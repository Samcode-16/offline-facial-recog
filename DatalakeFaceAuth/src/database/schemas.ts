export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS enrolled_persons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  department TEXT,
  enrolled_at INTEGER NOT NULL,
  embedding_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS face_embeddings (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL,
  embedding BLOB NOT NULL,
  lighting_condition TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (person_id) REFERENCES enrolled_persons(id)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL,
  person_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  location_lat REAL,
  location_lng REAL,
  confidence REAL NOT NULL,
  liveness_passed INTEGER NOT NULL,
  challenges_completed TEXT NOT NULL,
  anti_spoof_score REAL,
  device_id TEXT NOT NULL,
  app_version TEXT NOT NULL,
  synced INTEGER DEFAULT 0,
  sync_attempts INTEGER DEFAULT 0,
  synced_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_log (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  records_count INTEGER,
  status TEXT,
  error_message TEXT,
  synced_at INTEGER,
  server_ack_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_embeddings_person ON face_embeddings(person_id);
CREATE INDEX IF NOT EXISTS idx_attendance_synced ON attendance_records(synced);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_records(timestamp);
`;
