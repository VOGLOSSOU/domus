export interface House {
  id: number;
  name: string;
  address: string;
  created_at: string;
}

export interface Room {
  id: number;
  house_id: number;
  name: string;
  type: string;
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

export interface Payment {
  id: number;
  tenant_id: number;
  month: string; // Format: YYYY-MM
  amount: number;
  paid_at: string;
}

export interface TenantWithDetails extends Tenant {
  house?: House;
  room?: Room;
  is_up_to_date?: boolean;
  overdue_months?: string[];
  paymentStatus?: 'up_to_date' | 'overdue';
}

export interface HouseWithStats extends House {
  tenant_count: number;
  total_rent: number;
  overdue_count: number;
}