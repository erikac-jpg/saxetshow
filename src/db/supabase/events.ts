import { supabase } from '../supabaseClient';
import type { Event } from '../types';

/**
 * Supabase-backed events repository. Column aliases in the select string
 * map Postgres's snake_case columns straight to the camelCase `Event`
 * shape, so no separate row-mapping function is needed (unlike the local
 * SQLite version in ../repositories/events.ts).
 */
const EVENT_SELECT =
  'id, name, date, location, description, image, visible, totalTables:total_tables, createdAt:created_at, updatedAt:updated_at';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface CreateEventInput {
  name: string;
  date: string;
  location?: string | null;
  description?: string | null;
  image?: string | null;
  visible?: boolean;
  totalTables?: number;
}

export type UpdateEventInput = Partial<CreateEventInput>;

export async function getAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Event[];
}

export async function getVisibleEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('visible', true)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Event[];
}

/** Visible events on or after `referenceDate` (defaults to today), soonest first. */
export async function getUpcomingEvents(referenceDate: string = todayIso()): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('visible', true)
    .gte('date', referenceDate)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Event[];
}

export async function getEventById(id: number): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Event) ?? null;
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: input.name,
      date: input.date,
      location: input.location ?? null,
      description: input.description ?? null,
      image: input.image ?? null,
      visible: input.visible ?? true,
      total_tables: input.totalTables ?? 0,
    })
    .select(EVENT_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as Event;
}

export async function updateEvent(id: number, input: UpdateEventInput): Promise<Event | null> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.date !== undefined) patch.date = input.date;
  if (input.location !== undefined) patch.location = input.location;
  if (input.description !== undefined) patch.description = input.description;
  if (input.image !== undefined) patch.image = input.image;
  if (input.visible !== undefined) patch.visible = input.visible;
  if (input.totalTables !== undefined) patch.total_tables = input.totalTables;

  const { data, error } = await supabase
    .from('events')
    .update(patch)
    .eq('id', id)
    .select(EVENT_SELECT)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Event) ?? null;
}

export async function deleteEvent(id: number): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
