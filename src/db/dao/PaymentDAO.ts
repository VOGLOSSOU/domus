import { getDatabase } from '../database';
import { Payment } from '../../types/index';

export class PaymentDAO {
  static async getAll(): Promise<Payment[]> {
    const db = getDatabase();
    const result = await db.getAllAsync('SELECT * FROM payments ORDER BY paid_at DESC');
    return result as Payment[];
  }

  static async getById(id: number): Promise<Payment | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync('SELECT * FROM payments WHERE id = ?', [id]);
    return result as Payment | null;
  }

  static async getByTenantId(tenantId: number): Promise<Payment[]> {
    const db = getDatabase();
    const result = await db.getAllAsync('SELECT * FROM payments WHERE tenant_id = ? ORDER BY paid_at DESC', [tenantId]);
    return result as Payment[];
  }

  static async getLastPaymentByTenantId(tenantId: number): Promise<Payment | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync('SELECT * FROM payments WHERE tenant_id = ? ORDER BY paid_at DESC LIMIT 1', [tenantId]);
    return result as Payment | null;
  }

  static async create(payment: Omit<Payment, 'id' | 'paid_at'> & { notes?: string }): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO payments (tenant_id, month, amount, notes) VALUES (?, ?, ?, ?)',
      [payment.tenant_id, payment.month, payment.amount, payment.notes || null]
    );
    return result.lastInsertRowId;
  }

  static async update(id: number, payment: Partial<Omit<Payment, 'id' | 'paid_at'>>): Promise<void> {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (payment.tenant_id !== undefined) {
      updates.push('tenant_id = ?');
      values.push(payment.tenant_id);
    }
    if (payment.month !== undefined) {
      updates.push('month = ?');
      values.push(payment.month);
    }
    if (payment.amount !== undefined) {
      updates.push('amount = ?');
      values.push(payment.amount);
    }

    if (updates.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE payments SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  static async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM payments WHERE id = ?', [id]);
  }

  static async getPaymentsByMonth(tenantId: number, month: string): Promise<Payment[]> {
    const db = getDatabase();
    const result = await db.getAllAsync('SELECT * FROM payments WHERE tenant_id = ? AND month = ? ORDER BY paid_at DESC', [tenantId, month]);
    return result as Payment[];
  }

  static async isMonthPaid(tenantId: number, month: string): Promise<boolean> {
    const payments = await this.getPaymentsByMonth(tenantId, month);
    return payments.length > 0;
  }
}