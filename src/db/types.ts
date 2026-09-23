export type UserRole = 'member' | 'vendor' | 'staff';

export type TableRequestStatus = 'pending' | 'approved' | 'denied';

export type AgreementStatus = 'not_sent' | 'sent' | 'signed';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type StaffTag = 'Reliable' | 'New Vendor' | 'VIP' | 'Do Not Rebook';

export interface User {
  id: number;
  authUserId: string | null;
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
  /** Vendor-editable: facts about themselves. */
  fflLicenseNumber: string | null;
  fflExpirationDate: string | null;
  vendorCategory: string | null;
  preferredTableLocation: string | null;
  /** Staff-only: never shown to the vendor about themselves. */
  staffNotes: string | null;
  insuranceOnFile: boolean;
  insuranceExpirationDate: string | null;
  staffTags: string[];
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
  /** Staff-only, per event. */
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  checkNumber: string | null;
  checkedInAt: string | null;
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
