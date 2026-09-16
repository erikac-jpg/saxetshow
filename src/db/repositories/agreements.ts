import type { SQLDatabase } from '../SQLDatabase';
import type { Agreement, AgreementStatus } from '../types';
import { nowIso } from './shared';

interface AgreementRow {
  id: number;
  vendor_id: number;
  event_id: number;
  status: AgreementStatus;
  created_at: string;
  updated_at: string;
}

function mapRow(row: AgreementRow): Agreement {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    eventId: row.event_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateAgreementInput {
  vendorId: number;
  eventId: number;
  status?: AgreementStatus;
}

export async function createAgreement(
  db: SQLDatabase,
  input: CreateAgreementInput
): Promise<Agreement> {
  const now = nowIso();
  const result = await db.runAsync(
    `INSERT INTO agreements (vendor_id, event_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [input.vendorId, input.eventId, input.status ?? 'not_sent', now, now]
  );
  const agreement = await getAgreementById(db, result.lastInsertRowId);
  if (!agreement) {
    throw new Error('Failed to create agreement');
  }
  return agreement;
}

export async function getAgreementById(db: SQLDatabase, id: number): Promise<Agreement | null> {
  const row = await db.getFirstAsync<AgreementRow>('SELECT * FROM agreements WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function getAgreementForVendorAndEvent(
  db: SQLDatabase,
  vendorId: number,
  eventId: number
): Promise<Agreement | null> {
  const row = await db.getFirstAsync<AgreementRow>(
    'SELECT * FROM agreements WHERE vendor_id = ? AND event_id = ?',
    [vendorId, eventId]
  );
  return row ? mapRow(row) : null;
}

export async function getAgreementsForEvent(
  db: SQLDatabase,
  eventId: number
): Promise<Agreement[]> {
  const rows = await db.getAllAsync<AgreementRow>(
    'SELECT * FROM agreements WHERE event_id = ? ORDER BY created_at ASC',
    [eventId]
  );
  return rows.map(mapRow);
}

export async function updateAgreementStatus(
  db: SQLDatabase,
  id: number,
  status: AgreementStatus
): Promise<Agreement | null> {
  await db.runAsync('UPDATE agreements SET status = ?, updated_at = ? WHERE id = ?', [
    status,
    nowIso(),
    id,
  ]);
  return getAgreementById(db, id);
}

export async function deleteAgreement(db: SQLDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM agreements WHERE id = ?', [id]);
}
