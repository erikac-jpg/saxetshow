import { supabase } from '../supabaseClient';
import type { EventTable } from '../types';

const EVENT_TABLE_SELECT =
  'id, eventId:event_id, tableNumber:table_number, vendorId:vendor_id, paid, createdAt:created_at, updatedAt:updated_at';

export interface CreateEventTableInput {
  eventId: number;
  tableNumber: number;
  vendorId?: number | null;
  paid?: boolean;
}

export async function createEventTable(input: CreateEventTableInput): Promise<EventTable> {
  const { data, error } = await supabase
    .from('tables')
    .insert({
      event_id: input.eventId,
      table_number: input.tableNumber,
      vendor_id: input.vendorId ?? null,
      paid: input.paid ?? false,
    })
    .select(EVENT_TABLE_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as EventTable;
}

export async function getEventTableById(id: number): Promise<EventTable | null> {
  const { data, error } = await supabase
    .from('tables')
    .select(EVENT_TABLE_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as EventTable) ?? null;
}

export async function getTablesForEvent(eventId: number): Promise<EventTable[]> {
  const { data, error } = await supabase
    .from('tables')
    .select(EVENT_TABLE_SELECT)
    .eq('event_id', eventId)
    .order('table_number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as EventTable[];
}

export async function getTablesForVendor(vendorId: number): Promise<EventTable[]> {
  const { data, error } = await supabase
    .from('tables')
    .select(EVENT_TABLE_SELECT)
    .eq('vendor_id', vendorId)
    .order('event_id', { ascending: true })
    .order('table_number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as EventTable[];
}

export async function assignVendorToTable(
  id: number,
  vendorId: number | null
): Promise<EventTable | null> {
  const { data, error } = await supabase
    .from('tables')
    .update({ vendor_id: vendorId })
    .eq('id', id)
    .select(EVENT_TABLE_SELECT)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as EventTable) ?? null;
}

export async function setTablePaid(id: number, paid: boolean): Promise<EventTable | null> {
  const { data, error } = await supabase
    .from('tables')
    .update({ paid })
    .eq('id', id)
    .select(EVENT_TABLE_SELECT)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as EventTable) ?? null;
}

export async function deleteEventTable(id: number): Promise<void> {
  const { error } = await supabase.from('tables').delete().eq('id', id);
  if (error) throw error;
}
