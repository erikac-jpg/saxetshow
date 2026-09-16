import type { SQLDatabase } from '../SQLDatabase';
import type { TableRequest, TableRequestStatus } from '../types';
import { nowIso } from './shared';

interface TableRequestRow {
  id: number;
  vendor_id: number;
  event_id: number;
  tables_wanted: number;
  status: TableRequestStatus;
  created_at: string;
  updated_at: string;
}

function mapRow(row: TableRequestRow): TableRequest {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    eventId: row.event_id,
    tablesWanted: row.tables_wanted,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateTableRequestInput {
  vendorId: number;
  eventId: number;
  tablesWanted: number;
  status?: TableRequestStatus;
}

export async function createTableRequest(
  db: SQLDatabase,
  input: CreateTableRequestInput
): Promise<TableRequest> {
  const now = nowIso();
  const result = await db.runAsync(
    `INSERT INTO table_requests (vendor_id, event_id, tables_wanted, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.vendorId, input.eventId, input.tablesWanted, input.status ?? 'pending', now, now]
  );
  const request = await getTableRequestById(db, result.lastInsertRowId);
  if (!request) {
    throw new Error('Failed to create table request');
  }
  return request;
}

export async function getTableRequestById(
  db: SQLDatabase,
  id: number
): Promise<TableRequest | null> {
  const row = await db.getFirstAsync<TableRequestRow>(
    'SELECT * FROM table_requests WHERE id = ?',
    [id]
  );
  return row ? mapRow(row) : null;
}

export async function getTableRequestsForEvent(
  db: SQLDatabase,
  eventId: number
): Promise<TableRequest[]> {
  const rows = await db.getAllAsync<TableRequestRow>(
    'SELECT * FROM table_requests WHERE event_id = ? ORDER BY created_at ASC',
    [eventId]
  );
  return rows.map(mapRow);
}

export async function getTableRequestsForVendor(
  db: SQLDatabase,
  vendorId: number
): Promise<TableRequest[]> {
  const rows = await db.getAllAsync<TableRequestRow>(
    'SELECT * FROM table_requests WHERE vendor_id = ? ORDER BY created_at ASC',
    [vendorId]
  );
  return rows.map(mapRow);
}

export async function updateTableRequestStatus(
  db: SQLDatabase,
  id: number,
  status: TableRequestStatus
): Promise<TableRequest | null> {
  await db.runAsync('UPDATE table_requests SET status = ?, updated_at = ? WHERE id = ?', [
    status,
    nowIso(),
    id,
  ]);
  return getTableRequestById(db, id);
}

export async function deleteTableRequest(db: SQLDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM table_requests WHERE id = ?', [id]);
}
