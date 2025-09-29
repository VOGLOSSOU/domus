import { getDatabase } from '../db/database';
import { House, HouseWithStats, Tenant } from '../types';
import { TenantDAO } from './TenantDAO';

export class HouseDAO {
  static async getAll(): Promise<House[]> {
    try {
      const db = getDatabase();
      console.log('HouseDAO.getAll: Getting all houses...');
      const result = await db.getAllAsync('SELECT * FROM houses ORDER BY created_at DESC');
      console.log('HouseDAO.getAll: Found', result.length, 'houses');
      return result as House[];
    } catch (error) {
      console.error('HouseDAO.getAll error:', error);
      return [];
    }
  }

  static async getById(id: number): Promise<House | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync('SELECT * FROM houses WHERE id = ?', [id]);
    return result as House | null;
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

  static async getAllWithStats(): Promise<HouseWithStats[]> {
    try {
      console.log('HouseDAO.getAllWithStats: Starting...');
      const db = getDatabase();
      console.log('HouseDAO.getAllWithStats: Database obtained');

      // Simple approach: get houses and calculate stats
      const houses = await this.getAll();
      console.log('HouseDAO.getAllWithStats: Got houses:', houses.length);

      const housesWithStats: HouseWithStats[] = [];
      for (const house of houses) {
        try {
          console.log('HouseDAO.getAllWithStats: Getting tenants for house', house.id);
          const tenants = await TenantDAO.getByHouseId(house.id);
          const totalRent = tenants.reduce((sum: number, tenant: Tenant) => sum + tenant.rent_amount, 0);

          housesWithStats.push({
            ...house,
            tenant_count: tenants.length,
            total_rent: totalRent,
            overdue_count: 0, // Simplified for now
          });
          console.log('HouseDAO.getAllWithStats: Processed house', house.id);
        } catch (error) {
          console.error(`Error getting stats for house ${house.id}:`, error);
          housesWithStats.push({
            ...house,
            tenant_count: 0,
            total_rent: 0,
            overdue_count: 0,
          });
        }
      }

      console.log('HouseDAO.getAllWithStats: Returning', housesWithStats.length, 'houses with stats');
      return housesWithStats;
    } catch (error) {
      console.error('Error in getAllWithStats:', error);
      return []; // Return empty array instead of throwing
    }
  }
}