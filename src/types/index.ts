// Base types - defined inline to avoid import issues
export interface House {
  id: number;
  name: string;
  address: string;
  created_at: string;
}

export interface Tenant {
  id: number;
  house_id: number;
  room_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  entry_date: string;
  payment_frequency: 'mensuelle' | 'trimestrielle' | 'semestrielle' | 'annuelle';
  rent_amount: number;
}

export interface Room {
  id: number;
  house_id: number;
  name: string;
  type: string;
}

export interface Payment {
  id: number;
  tenant_id: number;
  month: string; // YYYY-MM
  amount: number;
  paid_at: string;
}

// Additional types for enhanced data
export interface TenantWithDetails extends Tenant {
  house?: {
    id: number;
    name: string;
    address: string;
  };
  room?: {
    id: number;
    name: string;
    type: string;
  };
  paymentStatus: 'up_to_date' | 'overdue';
  lastPayment?: Payment;
  tenant_count?: number; // For compatibility
  total_rent?: number; // For compatibility
  overdue_count?: number; // For compatibility
}

export interface HouseWithTenants extends House {
  tenants: Tenant[];
  totalRent: number;
  overdueCount: number;
}