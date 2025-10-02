import { getDatabase } from '../database';
import { Room } from '../../types';

export class RoomDAO {
  static async getAll(): Promise<Room[]> {
    const db = getDatabase();
    const result = await db.getAllAsync('SELECT * FROM rooms ORDER BY name');
    return result as Room[];
  }

  static async getByHouseId(houseId: number): Promise<Room[]> {
    const db = getDatabase();
    const result = await db.getAllAsync('SELECT * FROM rooms WHERE house_id = ? ORDER BY name', [houseId]);
    return result as Room[];
  }

  static async getById(id: number): Promise<Room | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync('SELECT * FROM rooms WHERE id = ?', [id]);
    return result as Room | null;
  }

  static async create(room: Omit<Room, 'id'>): Promise<number> {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO rooms (house_id, name, type) VALUES (?, ?, ?)',
      [room.house_id, room.name, room.type || null]
    );
    return result.lastInsertRowId;
  }

  static async update(id: number, room: Partial<Omit<Room, 'id'>>): Promise<void> {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (room.house_id !== undefined) {
      updates.push('house_id = ?');
      values.push(room.house_id);
    }
    if (room.name !== undefined) {
      updates.push('name = ?');
      values.push(room.name);
    }
    if (room.type !== undefined) {
      updates.push('type = ?');
      values.push(room.type);
    }

    if (updates.length > 0) {
      values.push(id);
      await db.runAsync(
        `UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  static async delete(id: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM rooms WHERE id = ?', [id]);
  }
}