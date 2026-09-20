import { supabase } from '../supabaseClient';
import type { PaymentStatus, TableRequest, TableRequestStatus } from '../types';

const TABLE_REQUEST_SELECT =
  'id, vendorId:vendor_id, eventId:event_id, tablesWanted:tables_wanted, status, paymentStatus:payment_status, paymentMethod:payment_method, checkNumber:check_number, checkedInAt:checked_in_at, createdAt:created_at, updatedAt:updated_at';

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

export interface UpdatePaymentInput {
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  checkNumber?: string | null;
}

export async function updateTableRequestPayment(
  id: number,
  input: UpdatePaymentInput
): Promise<TableRequest | null> {
  const patch: Record<string, unknown> = { payment_status: input.paymentStatus };
  if (input.paymentMethod !== undefined) patch.payment_method = input.paymentMethod;
  if (input.checkNumber !== undefined) patch.check_number = input.checkNumber;

  const { data, error } = await supabase
    .from('table_requests')
    .update(patch)
    .eq('id', id)
    .select(TABLE_REQUEST_SELECT)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as TableRequest) ?? null;
}

/** Toggles day-of check-in for a request. `false` clears it (for corrections). */
export async function setCheckedIn(id: number, checkedIn: boolean): Promise<TableRequest | null> {
  const { data, error } = await supabase
    .from('table_requests')
    .update({ checked_in_at: checkedIn ? new Date().toISOString() : null })
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

export interface VendorRequestHistoryEntry {
  id: number;
  eventId: number;
  eventName: string;
  eventDate: string;
  tablesWanted: number;
  status: TableRequestStatus;
  paymentStatus: PaymentStatus;
  checkedInAt: string | null;
}

/**
 * A vendor's table requests across every event, newest first, with the
 * event's name/date embedded via Postgres's foreign-key join support -
 * one query instead of N+1. Used by the staff-only "Vendor History"
 * section on VendorProfileScreen; attendance (attended / no-show /
 * cancelled) is derived from this in the UI rather than stored, since it
 * follows directly from status + checkedInAt + whether the event has
 * passed.
 */
export async function getRequestHistoryForVendor(
  vendorId: number
): Promise<VendorRequestHistoryEntry[]> {
  const { data, error } = await supabase
    .from('table_requests')
    .select(
      'id, eventId:event_id, tablesWanted:tables_wanted, status, paymentStatus:payment_status, checkedInAt:checked_in_at, event:events(name, date)'
    )
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: number;
    eventId: number;
    tablesWanted: number;
    status: TableRequestStatus;
    paymentStatus: PaymentStatus;
    checkedInAt: string | null;
    event: { name: string; date: string } | null;
  }>).map((row) => ({
    id: row.id,
    eventId: row.eventId,
    eventName: row.event?.name ?? 'Unknown event',
    eventDate: row.event?.date ?? '',
    tablesWanted: row.tablesWanted,
    status: row.status,
    paymentStatus: row.paymentStatus,
    checkedInAt: row.checkedInAt,
  }));
}
