import { getDatabase } from '../db/database';
import { Tenant, TenantWithDetails } from '../types';

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
    try {
      const db = getDatabase();
      console.log('TenantDAO.getByHouseId: Getting tenants for house', houseId);
      const result = await db.getAllAsync('SELECT * FROM tenants WHERE house_id = ? ORDER BY entry_date DESC', [houseId]);
      console.log('TenantDAO.getByHouseId: Found', result.length, 'tenants');
      return result as Tenant[];
    } catch (error) {
      console.error('TenantDAO.getByHouseId error:', error);
      return [];
    }
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

  static async getTenantWithDetails(id: number): Promise<TenantWithDetails | null> {
    const db = getDatabase();

    // Get tenant with house and room info
    const result = await db.getFirstAsync(`
      SELECT
        t.*,
        h.name as house_name,
        h.address as house_address,
        r.name as room_name,
        r.type as room_type
      FROM tenants t
      LEFT JOIN houses h ON t.house_id = h.id
      LEFT JOIN rooms r ON t.room_id = r.id
      WHERE t.id = ?
    `, [id]) as any;

    if (!result) return null;

    const tenant: TenantWithDetails = {
      id: result.id,
      house_id: result.house_id,
      room_id: result.room_id,
      first_name: result.first_name,
      last_name: result.last_name,
      phone: result.phone,
      email: result.email,
      entry_date: result.entry_date,
      payment_frequency: result.payment_frequency,
      rent_amount: result.rent_amount,
      house: result.house_name ? {
        id: result.house_id,
        name: result.house_name,
        address: result.house_address,
        created_at: ''
      } : undefined,
      room: result.room_name ? {
        id: result.room_id,
        house_id: result.house_id,
        name: result.room_name,
        type: result.room_type
      } : undefined
    };

    return tenant;
  }

  static async getAllWithPaymentStatus(): Promise<TenantWithDetails[]> {
    try {
      const db = getDatabase();

      const tenants = await db.getAllAsync(`
        SELECT
          t.*,
          h.name as house_name,
          h.address as house_address,
          r.name as room_name,
          r.type as room_type
        FROM tenants t
        LEFT JOIN houses h ON t.house_id = h.id
        LEFT JOIN rooms r ON t.room_id = r.id
        ORDER BY t.entry_date DESC
      `);

      return tenants.map((row: any) => ({
        id: row.id,
        house_id: row.house_id,
        room_id: row.room_id,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
        email: row.email,
        entry_date: row.entry_date,
        payment_frequency: row.payment_frequency,
        rent_amount: row.rent_amount,
        paymentStatus: 'up_to_date' as const, // Simplified for now
        house: row.house_name ? {
          id: row.house_id,
          name: row.house_name,
          address: row.house_address,
          created_at: ''
        } : undefined,
        room: row.room_name ? {
          id: row.room_id,
          house_id: row.house_id,
          name: row.room_name,
          type: row.room_type
        } : undefined
      })) as TenantWithDetails[];
    } catch (error) {
      console.error('TenantDAO.getAllWithPaymentStatus error:', error);
      return [];
    }
  }
}