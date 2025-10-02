export interface Payment {
  id: number;
  tenant_id: number;
  month: string; // YYYY-MM
  amount: number;
  paid_at: string;
  notes?: string;
}