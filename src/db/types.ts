export type UserRole = 'member' | 'vendor' | 'staff';

export type TableRequestStatus = 'pending' | 'approved' | 'denied';

export type AgreementStatus = 'not_sent' | 'sent' | 'signed';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: number;
  userId: number | null;
  businessName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  productsTheyBring: string | null;
  boothNotes: string | null;
  feesOwed: number;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  name: string;
  date: string;
  location: string | null;
  description: string | null;
  image: string | null;
  visible: boolean;
  totalTables: number;
  createdAt: string;
  updatedAt: string;
}

export interface TableRequest {
  id: number;
  vendorId: number;
  eventId: number;
  tablesWanted: number;
  status: TableRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EventTable {
  id: number;
  eventId: number;
  tableNumber: number;
  vendorId: number | null;
  paid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Agreement {
  id: number;
  vendorId: number;
  eventId: number;
  status: AgreementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WaitlistEntry {
  id: number;
  vendorId: number;
  eventId: number;
  tablesWanted: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}
