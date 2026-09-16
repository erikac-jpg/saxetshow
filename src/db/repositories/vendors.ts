import type { SQLDatabase } from '../SQLDatabase';
import type { Vendor } from '../types';
import { nowIso } from './shared';

interface VendorRow {
  id: number;
  user_id: number | null;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  products_they_bring: string | null;
  booth_notes: string | null;
  fees_owed: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: VendorRow): Vendor {
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    website: row.website,
    address: row.address,
    productsTheyBring: row.products_they_bring,
    boothNotes: row.booth_notes,
    feesOwed: row.fees_owed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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

export async function createVendor(db: SQLDatabase, input: CreateVendorInput): Promise<Vendor> {
  const now = nowIso();
  const result = await db.runAsync(
    `INSERT INTO vendors (
      user_id, business_name, contact_name, phone, email, website, address,
      products_they_bring, booth_notes, fees_owed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.userId ?? null,
      input.businessName,
      input.contactName ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.website ?? null,
      input.address ?? null,
      input.productsTheyBring ?? null,
      input.boothNotes ?? null,
      input.feesOwed ?? 0,
      now,
      now,
    ]
  );
  const vendor = await getVendorById(db, result.lastInsertRowId);
  if (!vendor) {
    throw new Error('Failed to create vendor');
  }
  return vendor;
}

export async function getVendorById(db: SQLDatabase, id: number): Promise<Vendor | null> {
  const row = await db.getFirstAsync<VendorRow>('SELECT * FROM vendors WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function getVendorByUserId(db: SQLDatabase, userId: number): Promise<Vendor | null> {
  const row = await db.getFirstAsync<VendorRow>('SELECT * FROM vendors WHERE user_id = ?', [
    userId,
  ]);
  return row ? mapRow(row) : null;
}

export async function getAllVendors(db: SQLDatabase): Promise<Vendor[]> {
  const rows = await db.getAllAsync<VendorRow>(
    'SELECT * FROM vendors ORDER BY business_name ASC',
    []
  );
  return rows.map(mapRow);
}

export async function updateVendor(
  db: SQLDatabase,
  id: number,
  input: UpdateVendorInput
): Promise<Vendor | null> {
  const existing = await getVendorById(db, id);
  if (!existing) {
    return null;
  }
  const merged: Required<CreateVendorInput> = {
    userId: input.userId !== undefined ? input.userId : existing.userId,
    businessName: input.businessName ?? existing.businessName,
    contactName: input.contactName !== undefined ? input.contactName : existing.contactName,
    phone: input.phone !== undefined ? input.phone : existing.phone,
    email: input.email !== undefined ? input.email : existing.email,
    website: input.website !== undefined ? input.website : existing.website,
    address: input.address !== undefined ? input.address : existing.address,
    productsTheyBring:
      input.productsTheyBring !== undefined ? input.productsTheyBring : existing.productsTheyBring,
    boothNotes: input.boothNotes !== undefined ? input.boothNotes : existing.boothNotes,
    feesOwed: input.feesOwed ?? existing.feesOwed,
  };
  await db.runAsync(
    `UPDATE vendors SET
      user_id = ?, business_name = ?, contact_name = ?, phone = ?, email = ?, website = ?,
      address = ?, products_they_bring = ?, booth_notes = ?, fees_owed = ?, updated_at = ?
     WHERE id = ?`,
    [
      merged.userId,
      merged.businessName,
      merged.contactName,
      merged.phone,
      merged.email,
      merged.website,
      merged.address,
      merged.productsTheyBring,
      merged.boothNotes,
      merged.feesOwed,
      nowIso(),
      id,
    ]
  );
  return getVendorById(db, id);
}

export async function deleteVendor(db: SQLDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM vendors WHERE id = ?', [id]);
}
