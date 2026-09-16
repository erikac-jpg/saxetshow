import * as SQLite from 'expo-sqlite';

import { initSchema } from './schema';
import { seedInitialEvents } from './seed';
import type { SQLDatabase } from './SQLDatabase';

const DATABASE_NAME = 'saxetshow.db';

let dbPromise: Promise<SQLDatabase> | null = null;

/**
 * Returns the app's singleton SQLite connection, creating it (and running
 * the schema migration) on first call. Safe to call repeatedly from
 * anywhere - subsequent calls reuse the same open connection.
 */
export function getDatabase(): Promise<SQLDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await initSchema(db);
      await seedInitialEvents(db);
      return db;
    })();
  }
  return dbPromise;
}
