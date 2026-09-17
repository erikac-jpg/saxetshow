import type { SQLDatabase } from './SQLDatabase';

/**
 * `tables` here means the physical vendor tables at an event (the "Table"
 * entity from the spec), not a meta reference to SQL tables in general.
 */
export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('member', 'vendor', 'staff')),
  phone TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  products_they_bring TEXT,
  booth_notes TEXT,
  fees_owed REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT,
  description TEXT,
  image TEXT,
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  total_tables INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS table_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tables_wanted INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_table_requests_event_id ON table_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_table_requests_vendor_id ON table_requests(vendor_id);

CREATE TABLE IF NOT EXISTS tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  paid INTEGER NOT NULL DEFAULT 0 CHECK (paid IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (event_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_tables_event_id ON tables(event_id);
CREATE INDEX IF NOT EXISTS idx_tables_vendor_id ON tables(vendor_id);

CREATE TABLE IF NOT EXISTS agreements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('not_sent', 'sent', 'signed')) DEFAULT 'not_sent',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (vendor_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_agreements_event_id ON agreements(event_id);

CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tables_wanted INTEGER NOT NULL,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (event_id, position)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_event_id ON waitlist(event_id);
`;

export async function initSchema(db: SQLDatabase): Promise<void> {
  await db.execAsync(SCHEMA_SQL);
  await migrateSchema(db);
}

/**
 * `CREATE TABLE IF NOT EXISTS` above only applies to brand-new databases, so
 * columns added later need an explicit migration for installs that already
 * created the table. Each step is a no-op once applied.
 */
async function migrateSchema(db: SQLDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(events)', []);
  const hasTotalTables = columns.some((column) => column.name === 'total_tables');
  if (!hasTotalTables) {
    await db.execAsync(
      'ALTER TABLE events ADD COLUMN total_tables INTEGER NOT NULL DEFAULT 0'
    );
  }
}
