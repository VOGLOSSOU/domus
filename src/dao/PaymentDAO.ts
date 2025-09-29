import { getDatabase } from '../db/database';
import { Payment } from '../types';

export class PaymentDAO {
  static async getAll(): Promise<Payment[]> {
    const db = getDatabase();
    const result = await db.getAllAsync('SELECT * FROM payments ORDER BY paid_at DESC');
    return result as Payment[];
  }

  static async getByTenantId(tenantId: number): Promise<Payment[]> {
    const db = getDatabase();
    const result = await db.getAllAsync('SELECT * FROM payments WHERE tenant_id = ? ORDER BY paid_at DESC', [tenantId]);
    return result as Payment[];
  }

  static async getById(id: number): Promise<Payment | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync('SELECT * FROM payments WHERE id = ?', [id]);
    return result as Payment | null;
  }

  static async create(payment: Omit<Payment, 'id' | 'paid_at'>): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO payments (tenant_id, month, amount) VALUES (?, ?, ?)',
      [payment.tenant_id, payment.month, payment.amount]
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

  static async getTotalPaid(tenantId: number): Promise<number> {
    const db = getDatabase();
    const result = await db.getFirstAsync(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE tenant_id = ?',
      [tenantId]
    ) as any;
    return result.total || 0;
  }

  static async isMonthPaid(tenantId: number, month: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM payments WHERE tenant_id = ? AND month = ?',
      [tenantId, month]
    ) as any;
    return result.count > 0;
  }
}