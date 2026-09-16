import type { SQLDatabase } from '../SQLDatabase';
import type { Event } from '../types';
import { fromBool, nowIso, toBool } from './shared';

interface EventRow {
  id: number;
  name: string;
  date: string;
  location: string | null;
  description: string | null;
  image: string | null;
  visible: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: EventRow): Event {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    location: row.location,
    description: row.description,
    image: row.image,
    visible: toBool(row.visible),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateEventInput {
  name: string;
  date: string;
  location?: string | null;
  description?: string | null;
  image?: string | null;
  visible?: boolean;
}

export type UpdateEventInput = Partial<CreateEventInput>;

export async function createEvent(db: SQLDatabase, input: CreateEventInput): Promise<Event> {
  const now = nowIso();
  const result = await db.runAsync(
    `INSERT INTO events (name, date, location, description, image, visible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.date,
      input.location ?? null,
      input.description ?? null,
      input.image ?? null,
      fromBool(input.visible ?? true),
      now,
      now,
    ]
  );
  const event = await getEventById(db, result.lastInsertRowId);
  if (!event) {
    throw new Error('Failed to create event');
  }
  return event;
}

export async function getEventById(db: SQLDatabase, id: number): Promise<Event | null> {
  const row = await db.getFirstAsync<EventRow>('SELECT * FROM events WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function getAllEvents(db: SQLDatabase): Promise<Event[]> {
  const rows = await db.getAllAsync<EventRow>('SELECT * FROM events ORDER BY date ASC', []);
  return rows.map(mapRow);
}

export async function getVisibleEvents(db: SQLDatabase): Promise<Event[]> {
  const rows = await db.getAllAsync<EventRow>(
    'SELECT * FROM events WHERE visible = 1 ORDER BY date ASC',
    []
  );
  return rows.map(mapRow);
}

export async function updateEvent(
  db: SQLDatabase,
  id: number,
  input: UpdateEventInput
): Promise<Event | null> {
  const existing = await getEventById(db, id);
  if (!existing) {
    return null;
  }
  await db.runAsync(
    `UPDATE events SET name = ?, date = ?, location = ?, description = ?, image = ?, visible = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.name ?? existing.name,
      input.date ?? existing.date,
      input.location !== undefined ? input.location : existing.location,
      input.description !== undefined ? input.description : existing.description,
      input.image !== undefined ? input.image : existing.image,
      fromBool(input.visible ?? existing.visible),
      nowIso(),
      id,
    ]
  );
  return getEventById(db, id);
}

export async function deleteEvent(db: SQLDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM events WHERE id = ?', [id]);
}
