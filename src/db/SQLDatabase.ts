/**
 * Minimal async SQLite interface. `expo-sqlite`'s `SQLiteDatabase` (returned by
 * `openDatabaseAsync`) already satisfies this shape, so production code just
 * passes that object in directly. Tests use the sql.js-backed adapter in
 * `./testing/createInMemoryDatabase` instead, so the same repository code
 * runs against a real SQLite engine without needing a device/simulator.
 */

export type SQLiteBindValue = string | number | null;

export type SQLiteBindParams = SQLiteBindValue[] | Record<string, SQLiteBindValue>;

export interface SQLiteRunResult {
  lastInsertRowId: number;
  changes: number;
}

export interface SQLDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: SQLiteBindParams): Promise<SQLiteRunResult>;
  getAllAsync<T>(source: string, params: SQLiteBindParams): Promise<T[]>;
  getFirstAsync<T>(source: string, params: SQLiteBindParams): Promise<T | null>;
}
