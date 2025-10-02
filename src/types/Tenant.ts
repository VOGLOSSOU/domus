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