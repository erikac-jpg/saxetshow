import { supabase } from '../supabaseClient';
import type { WaitlistEntry } from '../types';

const WAITLIST_SELECT =
  'id, vendorId:vendor_id, eventId:event_id, tablesWanted:tables_wanted, position, createdAt:created_at, updatedAt:updated_at';

export interface JoinWaitlistInput {
  vendorId: number;
  eventId: number;
  tablesWanted: number;
}

/** Appends a vendor to the end of an event's waitlist (position = current max + 1). */
export async function joinWaitlist(input: JoinWaitlistInput): Promise<WaitlistEntry> {
  const { data: maxRow, error: maxError } = await supabase
    .from('waitlist')
    .select('position')
    .eq('event_id', input.eventId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxError) throw maxError;
  const nextPosition = (maxRow?.position ?? 0) + 1;

  const { data, error } = await supabase
    .from('waitlist')
    .insert({
      vendor_id: input.vendorId,
      event_id: input.eventId,
      tables_wanted: input.tablesWanted,
      position: nextPosition,
    })
    .select(WAITLIST_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as WaitlistEntry;
}

export async function getWaitlistEntryById(id: number): Promise<WaitlistEntry | null> {
  const { data, error } = await supabase
    .from('waitlist')
    .select(WAITLIST_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as WaitlistEntry) ?? null;
}

export async function getWaitlistForEvent(eventId: number): Promise<WaitlistEntry[]> {
  const { data, error } = await supabase
    .from('waitlist')
    .select(WAITLIST_SELECT)
    .eq('event_id', eventId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as WaitlistEntry[];
}

/** Removes a waitlist entry and shifts everyone behind it up by one position. */
export async function removeFromWaitlist(id: number): Promise<void> {
  const entry = await getWaitlistEntryById(id);
  if (!entry) {
    return;
  }

  const { error: deleteError } = await supabase.from('waitlist').delete().eq('id', id);
  if (deleteError) throw deleteError;

  const { data: rest, error: restError } = await supabase
    .from('waitlist')
    .select('id, position')
    .eq('event_id', entry.eventId)
    .gt('position', entry.position);
  if (restError) throw restError;

  await Promise.all(
    (rest ?? []).map((row) =>
      supabase.from('waitlist').update({ position: row.position - 1 }).eq('id', row.id)
    )
  );
}
