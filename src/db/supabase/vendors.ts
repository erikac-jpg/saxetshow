import { supabase } from '../supabaseClient';
import type { Vendor } from '../types';

const VENDOR_SELECT =
  'id, userId:user_id, businessName:business_name, contactName:contact_name, phone, email, website, address, productsTheyBring:products_they_bring, boothNotes:booth_notes, feesOwed:fees_owed, fflLicenseNumber:ffl_license_number, fflExpirationDate:ffl_expiration_date, vendorCategory:vendor_category, preferredTableLocation:preferred_table_location, staffNotes:staff_notes, insuranceOnFile:insurance_on_file, insuranceExpirationDate:insurance_expiration_date, staffTags:staff_tags, createdAt:created_at, updatedAt:updated_at';

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
  fflLicenseNumber?: string | null;
  fflExpirationDate?: string | null;
  vendorCategory?: string | null;
  preferredTableLocation?: string | null;
  staffNotes?: string | null;
  insuranceOnFile?: boolean;
  insuranceExpirationDate?: string | null;
  staffTags?: string[];
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
      ffl_license_number: input.fflLicenseNumber ?? null,
      ffl_expiration_date: input.fflExpirationDate ?? null,
      vendor_category: input.vendorCategory ?? null,
      preferred_table_location: input.preferredTableLocation ?? null,
      staff_notes: input.staffNotes ?? null,
      insurance_on_file: input.insuranceOnFile ?? false,
      insurance_expiration_date: input.insuranceExpirationDate ?? null,
      staff_tags: input.staffTags ?? [],
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

/**
 * An existing vendor profile with no account linked yet, matching this
 * email - lets a vendor who used self-service before real auth existed
 * "claim" their old profile by signing up with the same email, instead
 * of ending up with a second, empty one. `limit(1)` rather than
 * `maybeSingle()` since old demo data could plausibly have duplicates.
 */
export async function getUnclaimedVendorByEmail(email: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from('vendors')
    .select(VENDOR_SELECT)
    .eq('email', email)
    .is('user_id', null)
    .limit(1);
  if (error) throw error;
  return ((data as unknown as Vendor[]) ?? [])[0] ?? null;
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
  if (input.fflLicenseNumber !== undefined) patch.ffl_license_number = input.fflLicenseNumber;
  if (input.fflExpirationDate !== undefined) patch.ffl_expiration_date = input.fflExpirationDate;
  if (input.vendorCategory !== undefined) patch.vendor_category = input.vendorCategory;
  if (input.preferredTableLocation !== undefined)
    patch.preferred_table_location = input.preferredTableLocation;
  if (input.staffNotes !== undefined) patch.staff_notes = input.staffNotes;
  if (input.insuranceOnFile !== undefined) patch.insurance_on_file = input.insuranceOnFile;
  if (input.insuranceExpirationDate !== undefined)
    patch.insurance_expiration_date = input.insuranceExpirationDate;
  if (input.staffTags !== undefined) patch.staff_tags = input.staffTags;

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
