import type { SQLDatabase } from '../SQLDatabase';
import type { WaitlistEntry } from '../types';
import { nowIso } from './shared';

interface WaitlistRow {
  id: number;
  vendor_id: number;
  event_id: number;
  tables_wanted: number;
  position: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: WaitlistRow): WaitlistEntry {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    eventId: row.event_id,
    tablesWanted: row.tables_wanted,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface JoinWaitlistInput {
  vendorId: number;
  eventId: number;
  tablesWanted: number;
}

/** Appends a vendor to the end of an event's waitlist (position = current max + 1). */
export async function joinWaitlist(
  db: SQLDatabase,
  input: JoinWaitlistInput
): Promise<WaitlistEntry> {
  const now = nowIso();
  const maxPositionRow = await db.getFirstAsync<{ maxPosition: number | null }>(
    'SELECT MAX(position) as maxPosition FROM waitlist WHERE event_id = ?',
    [input.eventId]
  );
  const nextPosition = (maxPositionRow?.maxPosition ?? 0) + 1;
  const result = await db.runAsync(
    `INSERT INTO waitlist (vendor_id, event_id, tables_wanted, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.vendorId, input.eventId, input.tablesWanted, nextPosition, now, now]
  );
  const entry = await getWaitlistEntryById(db, result.lastInsertRowId);
  if (!entry) {
    throw new Error('Failed to join waitlist');
  }
  return entry;
}

export async function getWaitlistEntryById(
  db: SQLDatabase,
  id: number
): Promise<WaitlistEntry | null> {
  const row = await db.getFirstAsync<WaitlistRow>('SELECT * FROM waitlist WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function getWaitlistForEvent(
  db: SQLDatabase,
  eventId: number
): Promise<WaitlistEntry[]> {
  const rows = await db.getAllAsync<WaitlistRow>(
    'SELECT * FROM waitlist WHERE event_id = ? ORDER BY position ASC',
    [eventId]
  );
  return rows.map(mapRow);
}

/** Removes a waitlist entry and shifts everyone behind it up by one position. */
export async function removeFromWaitlist(db: SQLDatabase, id: number): Promise<void> {
  const entry = await getWaitlistEntryById(db, id);
  if (!entry) {
    return;
  }
  await db.runAsync('DELETE FROM waitlist WHERE id = ?', [id]);
  await db.runAsync(
    'UPDATE waitlist SET position = position - 1, updated_at = ? WHERE event_id = ? AND position > ?',
    [nowIso(), entry.eventId, entry.position]
  );
}
