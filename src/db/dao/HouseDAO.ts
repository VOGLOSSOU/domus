import { getDatabase } from '../database';
import { House, HouseWithStats } from '../../types';

export class HouseDAO {
  static async getAll(): Promise<House[]> {
    const db = getDatabase();
    const result = await db.getAllAsync('SELECT * FROM houses ORDER BY created_at DESC');
    return result as House[];
  }

  static async getById(id: number): Promise<House | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync('SELECT * FROM houses WHERE id = ?', [id]);
    return result as House | null;
  }

  static async getAllWithStats(): Promise<HouseWithStats[]> {
    const db = getDatabase();

    // Get all houses
    const houses = await this.getAll();

    // Get stats for each house
    const housesWithStats = await Promise.all(
      houses.map(async (house) => {
        // Count tenants for this house
        const tenantCountResult = await db.getFirstAsync(
          'SELECT COUNT(*) as count FROM tenants WHERE house_id = ?',
          [house.id]
        );
        const tenantCount = tenantCountResult?.count || 0;

        // Sum rent amounts for this house
        const rentResult = await db.getFirstAsync(
          'SELECT SUM(rent_amount) as total FROM tenants WHERE house_id = ?',
          [house.id]
        );
        const totalRent = rentResult?.total || 0;

        // Count overdue tenants for this house
        const overdueResult = await db.getFirstAsync(`
          SELECT COUNT(DISTINCT t.id) as count
          FROM tenants t
          LEFT JOIN payments p ON t.id = p.tenant_id AND p.month = strftime('%Y-%m', 'now')
          WHERE t.house_id = ? AND p.id IS NULL
        `, [house.id]);
        const overdueCount = overdueResult?.count || 0;

        return {
          ...house,
          tenant_count: tenantCount,
          total_rent: totalRent,
          overdue_count: overdueCount,
        };
      })
    );

    return housesWithStats;
  }

  static async create(house: Omit<House, 'id' | 'created_at'>): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO houses (name, address) VALUES (?, ?)',
      [house.name, house.address]
    );
    return result.lastInsertRowId;
  }

  static async update(id: number, house: Partial<Omit<House, 'id' | 'created_at'>>): Promise<void> {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (house.name !== undefined) {
      updates.push('name = ?');
      values.push(house.name);
    }
    if (house.address !== undefined) {
      updates.push('address = ?');
      values.push(house.address);
    }

    if (updates.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE houses SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  static async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM houses WHERE id = ?', [id]);
  }
}