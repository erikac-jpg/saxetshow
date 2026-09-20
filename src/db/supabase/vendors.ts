import { supabase } from '../supabaseClient';
import type { Vendor } from '../types';

const VENDOR_SELECT =
  'id, userId:user_id, businessName:business_name, contactName:contact_name, phone, email, website, address, productsTheyBring:products_they_bring, boothNotes:booth_notes, feesOwed:fees_owed, createdAt:created_at, updatedAt:updated_at';

export interface CreateVendorInput {
  userId?: number | null;
  businessName: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  productsTheyBring?: string | null;
  boothNotes?: string | null;
  feesOwed?: number;
}

export type UpdateVendorInput = Partial<CreateVendorInput>;

export async function createVendor(input: CreateVendorInput): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .insert({
      user_id: input.userId ?? null,
      business_name: input.businessName,
      contact_name: input.contactName ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      website: input.website ?? null,
      address: input.address ?? null,
      products_they_bring: input.productsTheyBring ?? null,
      booth_notes: input.boothNotes ?? null,
      fees_owed: input.feesOwed ?? 0,
    })
    .select(VENDOR_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as Vendor;
}

export async function getVendorById(id: number): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from('vendors')
    .select(VENDOR_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Vendor) ?? null;
}

export async function getVendorByUserId(userId: number): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from('vendors')
    .select(VENDOR_SELECT)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Vendor) ?? null;
}

export async function getAllVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select(VENDOR_SELECT)
    .order('business_name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Vendor[];
}

export async function updateVendor(id: number, input: UpdateVendorInput): Promise<Vendor | null> {
  const patch: Record<string, unknown> = {};
  if (input.userId !== undefined) patch.user_id = input.userId;
  if (input.businessName !== undefined) patch.business_name = input.businessName;
  if (input.contactName !== undefined) patch.contact_name = input.contactName;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.email !== undefined) patch.email = input.email;
  if (input.website !== undefined) patch.website = input.website;
  if (input.address !== undefined) patch.address = input.address;
  if (input.productsTheyBring !== undefined) patch.products_they_bring = input.productsTheyBring;
  if (input.boothNotes !== undefined) patch.booth_notes = input.boothNotes;
  if (input.feesOwed !== undefined) patch.fees_owed = input.feesOwed;

  const { data, error } = await supabase
    .from('vendors')
    .update(patch)
    .eq('id', id)
    .select(VENDOR_SELECT)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Vendor) ?? null;
}

export async function deleteVendor(id: number): Promise<void> {
  const { error } = await supabase.from('vendors').delete().eq('id', id);
  if (error) throw error;
}
