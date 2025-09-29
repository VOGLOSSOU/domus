import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'domus.db';

let databaseInstance: any = null;

export const getDatabase = () => {
  if (!databaseInstance) {
    try {
      console.log('Creating new database connection...');
      databaseInstance = SQLite.openDatabaseSync(DATABASE_NAME);
      console.log('Database connection created successfully');
    } catch (error) {
      console.error('Failed to create database connection:', error);
      throw error;
    }
  }
  return databaseInstance;
};

export const initDatabase = async () => {
  const db = getDatabase();

  try {
    // Test simple query first
    console.log('Testing database connection...');
    await db.getAllAsync('SELECT 1 as test');
    console.log('Database connection test successful');

    // Create houses table
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS houses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );`
    );

    // Create rooms table
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        house_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT,
        FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
      );`
    );

    // Create tenants table
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        house_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        entry_date TEXT NOT NULL,
        payment_frequency TEXT NOT NULL,
        rent_amount REAL NOT NULL,
        FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      );`
    );

    // Create payments table
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER NOT NULL,
        month TEXT NOT NULL,
        amount REAL NOT NULL,
        paid_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );`
    );

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};