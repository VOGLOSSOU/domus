import { getDatabase } from '../database';
import { Tenant } from '../../types/Tenant';

export class TenantDAO {
  static async getAll(): Promise<Tenant[]> {
    const db = getDatabase();
    const result = await db.getAllAsync('SELECT * FROM tenants ORDER BY entry_date DESC');
    return result as Tenant[];
  }

  static async getById(id: number): Promise<Tenant | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync('SELECT * FROM tenants WHERE id = ?', [id]);
    return result as Tenant | null;
  }

  static async getByHouseId(houseId: number): Promise<Tenant[]> {
    const db = getDatabase();
    const result = await db.getAllAsync('SELECT * FROM tenants WHERE house_id = ? ORDER BY entry_date DESC', [houseId]);
    return result as Tenant[];
  }

  static async create(tenant: Omit<Tenant, 'id'>): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO tenants (house_id, room_id, first_name, last_name, phone, email, entry_date, payment_frequency, rent_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenant.house_id, tenant.room_id, tenant.first_name, tenant.last_name, tenant.phone, tenant.email || null, tenant.entry_date, tenant.payment_frequency, tenant.rent_amount]
    );
    return result.lastInsertRowId;
  }

  static async update(id: number, tenant: Partial<Omit<Tenant, 'id'>>): Promise<void> {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (tenant.house_id !== undefined) {
      updates.push('house_id = ?');
      values.push(tenant.house_id);
    }
    if (tenant.room_id !== undefined) {
      updates.push('room_id = ?');
      values.push(tenant.room_id);
    }
    if (tenant.first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(tenant.first_name);
    }
    if (tenant.last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(tenant.last_name);
    }
    if (tenant.phone !== undefined) {
      updates.push('phone = ?');
      values.push(tenant.phone);
    }
    if (tenant.email !== undefined) {
      updates.push('email = ?');
      values.push(tenant.email);
    }
    if (tenant.entry_date !== undefined) {
      updates.push('entry_date = ?');
      values.push(tenant.entry_date);
    }
    if (tenant.payment_frequency !== undefined) {
      updates.push('payment_frequency = ?');
      values.push(tenant.payment_frequency);
    }
    if (tenant.rent_amount !== undefined) {
      updates.push('rent_amount = ?');
      values.push(tenant.rent_amount);
    }

    if (updates.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  static async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM tenants WHERE id = ?', [id]);
  }

  static async getTenantWithDetails(id: number): Promise<any> {
    const db = getDatabase();
    const tenant = await this.getById(id);
    if (!tenant) return null;

    // Get house info
    const house = await db.getFirstAsync('SELECT name, address FROM houses WHERE id = ?', [tenant.house_id]);

    // Get room info
    const room = await db.getFirstAsync('SELECT name, type FROM rooms WHERE id = ?', [tenant.room_id]);

    return {
      ...tenant,
      house,
      room
    };
  }

  static async getAllWithPaymentStatus(): Promise<any[]> {
    const db = getDatabase();
    const tenants = await this.getAll();

    const tenantsWithStatus = await Promise.all(
      tenants.map(async (tenant) => {
        // Get house info
        const house = await db.getFirstAsync('SELECT name, address FROM houses WHERE id = ?', [tenant.house_id]);

        // Get room info
        const room = await db.getFirstAsync('SELECT name, type FROM rooms WHERE id = ?', [tenant.room_id]);

        // Get last payment
        const lastPayment = await db.getFirstAsync(
          'SELECT * FROM payments WHERE tenant_id = ? ORDER BY paid_at DESC LIMIT 1',
          [tenant.id]
        );

        // Determine payment status
        let paymentStatus = 'up_to_date';
        if (!lastPayment) {
          paymentStatus = 'overdue'; // No payment ever made
        } else {
          // Check if the last payment is recent enough based on frequency
          const lastPaymentDate = new Date(lastPayment.paid_at);
          const now = new Date();
          const monthsSinceLastPayment = (now.getFullYear() - lastPaymentDate.getFullYear()) * 12 +
                                        (now.getMonth() - lastPaymentDate.getMonth());

          if (monthsSinceLastPayment > 1) { // More than 1 month since last payment
            paymentStatus = 'overdue';
          }
        }

        return {
          ...tenant,
          house,
          room,
          lastPayment,
          paymentStatus
        };
      })
    );

    return tenantsWithStatus;
  }
}