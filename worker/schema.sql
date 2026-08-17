-- docs/DESIGN.md §6.5
CREATE TABLE IF NOT EXISTS records (
  space_id    TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER,
  ciphertext  BLOB NOT NULL,
  iv          BLOB NOT NULL,
  PRIMARY KEY (space_id, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_pull ON records (space_id, updated_at);
