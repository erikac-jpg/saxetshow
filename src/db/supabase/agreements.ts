import { supabase } from '../supabaseClient';
import type { Agreement, AgreementStatus } from '../types';

const AGREEMENT_SELECT =
  'id, vendorId:vendor_id, eventId:event_id, status, createdAt:created_at, updatedAt:updated_at';

export interface CreateAgreementInput {
  vendorId: number;
  eventId: number;
  status?: AgreementStatus;
}

export async function createAgreement(input: CreateAgreementInput): Promise<Agreement> {
  const { data, error } = await supabase
    .from('agreements')
    .insert({
      vendor_id: input.vendorId,
      event_id: input.eventId,
      status: input.status ?? 'not_sent',
    })
    .select(AGREEMENT_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as Agreement;
}

export async function getAgreementById(id: number): Promise<Agreement | null> {
  const { data, error } = await supabase
    .from('agreements')
    .select(AGREEMENT_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Agreement) ?? null;
}

export async function getAgreementForVendorAndEvent(
  vendorId: number,
  eventId: number
): Promise<Agreement | null> {
  const { data, error } = await supabase
    .from('agreements')
    .select(AGREEMENT_SELECT)
    .eq('vendor_id', vendorId)
    .eq('event_id', eventId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Agreement) ?? null;
}

export async function getAgreementsForEvent(eventId: number): Promise<Agreement[]> {
  const { data, error } = await supabase
    .from('agreements')
    .select(AGREEMENT_SELECT)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Agreement[];
}

export async function updateAgreementStatus(
  id: number,
  status: AgreementStatus
): Promise<Agreement | null> {
  const { data, error } = await supabase
    .from('agreements')
    .update({ status })
    .eq('id', id)
    .select(AGREEMENT_SELECT)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Agreement) ?? null;
}

export async function deleteAgreement(id: number): Promise<void> {
  const { error } = await supabase.from('agreements').delete().eq('id', id);
  if (error) throw error;
}
