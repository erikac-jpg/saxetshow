import { supabase } from '../supabaseClient';
import type { TableRequest, TableRequestStatus } from '../types';

const TABLE_REQUEST_SELECT =
  'id, vendorId:vendor_id, eventId:event_id, tablesWanted:tables_wanted, status, createdAt:created_at, updatedAt:updated_at';

export interface CreateTableRequestInput {
  vendorId: number;
  eventId: number;
  tablesWanted: number;
  status?: TableRequestStatus;
}

export async function createTableRequest(input: CreateTableRequestInput): Promise<TableRequest> {
  const { data, error } = await supabase
    .from('table_requests')
    .insert({
      vendor_id: input.vendorId,
      event_id: input.eventId,
      tables_wanted: input.tablesWanted,
      status: input.status ?? 'pending',
    })
    .select(TABLE_REQUEST_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as TableRequest;
}

export async function getTableRequestById(id: number): Promise<TableRequest | null> {
  const { data, error } = await supabase
    .from('table_requests')
    .select(TABLE_REQUEST_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as TableRequest) ?? null;
}

export async function getTableRequestsForEvent(eventId: number): Promise<TableRequest[]> {
  const { data, error } = await supabase
    .from('table_requests')
    .select(TABLE_REQUEST_SELECT)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as TableRequest[];
}

export async function getTableRequestsForVendor(vendorId: number): Promise<TableRequest[]> {
  const { data, error } = await supabase
    .from('table_requests')
    .select(TABLE_REQUEST_SELECT)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as TableRequest[];
}

export async function updateTableRequestStatus(
  id: number,
  status: TableRequestStatus
): Promise<TableRequest | null> {
  const { data, error } = await supabase
    .from('table_requests')
    .update({ status })
    .eq('id', id)
    .select(TABLE_REQUEST_SELECT)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as TableRequest) ?? null;
}

export async function deleteTableRequest(id: number): Promise<void> {
  const { error } = await supabase.from('table_requests').delete().eq('id', id);
  if (error) throw error;
}
