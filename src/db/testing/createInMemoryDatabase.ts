import initSqlJs, { type Database as SqlJsDatabaseHandle } from 'sql.js';

import type { SQLDatabase, SQLiteBindParams, SQLiteRunResult } from '../SQLDatabase';
import { initSchema } from '../schema';

/**
 * Test-only `SQLDatabase` implementation backed by sql.js (SQLite compiled
 * to WASM). It lets the repository/schema code run against a real SQLite
 * engine in plain Node (Jest), without a device, simulator, or the native
 * `expo-sqlite` module. Not used by the app itself - see `../client.ts` for
 * the real `expo-sqlite` connection.
 */
class SqlJsDatabaseAdapter implements SQLDatabase {
  constructor(private readonly handle: SqlJsDatabaseHandle) {}

  async execAsync(source: string): Promise<void> {
    this.handle.exec(source);
  }

  async runAsync(source: string, params: SQLiteBindParams = []): Promise<SQLiteRunResult> {
    const stmt = this.handle.prepare(source);
    try {
      stmt.bind(params as never);
      stmt.step();
    } finally {
      stmt.free();
    }
    const changes = this.handle.getRowsModified();
    const idResult = this.handle.exec('SELECT last_insert_rowid() AS id');
    const lastInsertRowId = (idResult[0]?.values[0]?.[0] as number) ?? 0;
    return { lastInsertRowId, changes };
  }

  async getAllAsync<T>(source: string, params: SQLiteBindParams = []): Promise<T[]> {
    const stmt = this.handle.prepare(source);
    const rows: T[] = [];
    try {
      stmt.bind(params as never);
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as unknown as T);
      }
    } finally {
      stmt.free();
    }
    return rows;
  }

  async getFirstAsync<T>(source: string, params: SQLiteBindParams = []): Promise<T | null> {
    const rows = await this.getAllAsync<T>(source, params);
    return rows[0] ?? null;
  }
}

/** Creates a fresh in-memory database with the schema already applied. */
export async function createInMemoryDatabase(): Promise<SQLDatabase> {
  const SQL = await initSqlJs();
  const handle = new SQL.Database();
  const db = new SqlJsDatabaseAdapter(handle);
  await initSchema(db);
  return db;
}
