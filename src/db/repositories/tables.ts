import type { SQLDatabase } from '../SQLDatabase';
import type { EventTable } from '../types';
import { fromBool, nowIso, toBool } from './shared';

interface EventTableRow {
  id: number;
  event_id: number;
  table_number: number;
  vendor_id: number | null;
  paid: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: EventTableRow): EventTable {
  return {
    id: row.id,
    eventId: row.event_id,
    tableNumber: row.table_number,
    vendorId: row.vendor_id,
    paid: toBool(row.paid),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateEventTableInput {
  eventId: number;
  tableNumber: number;
  vendorId?: number | null;
  paid?: boolean;
}

export async function createEventTable(
  db: SQLDatabase,
  input: CreateEventTableInput
): Promise<EventTable> {
  const now = nowIso();
  const result = await db.runAsync(
    `INSERT INTO tables (event_id, table_number, vendor_id, paid, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.eventId, input.tableNumber, input.vendorId ?? null, fromBool(input.paid ?? false), now, now]
  );
  const table = await getEventTableById(db, result.lastInsertRowId);
  if (!table) {
    throw new Error('Failed to create table');
  }
  return table;
}

export async function getEventTableById(db: SQLDatabase, id: number): Promise<EventTable | null> {
  const row = await db.getFirstAsync<EventTableRow>('SELECT * FROM tables WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function getTablesForEvent(
  db: SQLDatabase,
  eventId: number
): Promise<EventTable[]> {
  const rows = await db.getAllAsync<EventTableRow>(
    'SELECT * FROM tables WHERE event_id = ? ORDER BY table_number ASC',
    [eventId]
  );
  return rows.map(mapRow);
}

export async function getTablesForVendor(
  db: SQLDatabase,
  vendorId: number
): Promise<EventTable[]> {
  const rows = await db.getAllAsync<EventTableRow>(
    'SELECT * FROM tables WHERE vendor_id = ? ORDER BY event_id ASC, table_number ASC',
    [vendorId]
  );
  return rows.map(mapRow);
}

export async function assignVendorToTable(
  db: SQLDatabase,
  id: number,
  vendorId: number | null
): Promise<EventTable | null> {
  await db.runAsync('UPDATE tables SET vendor_id = ?, updated_at = ? WHERE id = ?', [
    vendorId,
    nowIso(),
    id,
  ]);
  return getEventTableById(db, id);
}

export async function setTablePaid(
  db: SQLDatabase,
  id: number,
  paid: boolean
): Promise<EventTable | null> {
  await db.runAsync('UPDATE tables SET paid = ?, updated_at = ? WHERE id = ?', [
    fromBool(paid),
    nowIso(),
    id,
  ]);
  return getEventTableById(db, id);
}

export async function deleteEventTable(db: SQLDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM tables WHERE id = ?', [id]);
}
