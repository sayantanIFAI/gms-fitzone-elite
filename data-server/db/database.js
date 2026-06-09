const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const { seedDatabase } = require('./seed');

let db;

function getDB() {
  if (!db) {
    db = new DatabaseSync(path.join(__dirname, '../gms.db'));
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      avatar_color TEXT DEFAULT '#7c3aed',
      membership_type TEXT DEFAULT 'standard',
      join_date TEXT NOT NULL,
      phone TEXT,
      payment_status TEXT DEFAULT 'active',
      mandate_ref TEXT,
      access_locked INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT,
      access_point TEXT DEFAULT 'main_entrance',
      FOREIGN KEY (member_id) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      trainer_id TEXT,
      schedule_days TEXT,
      schedule_time TEXT,
      capacity INTEGER DEFAULT 20,
      duration_minutes INTEGER DEFAULT 60,
      location TEXT DEFAULT 'Studio A',
      category TEXT DEFAULT 'fitness',
      color TEXT DEFAULT '#7c3aed'
    );

    CREATE TABLE IF NOT EXISTS class_bookings (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      booking_date TEXT NOT NULL,
      status TEXT DEFAULT 'booked',
      booked_at TEXT NOT NULL,
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (member_id) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      zone TEXT NOT NULL,
      status TEXT DEFAULT 'operational',
      fault_code TEXT,
      fault_description TEXT,
      last_maintenance TEXT,
      total_usage_hours INTEGER DEFAULT 0,
      manufacturer TEXT,
      model_number TEXT,
      installed_date TEXT,
      daily_sessions INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS vitals (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      heart_rate_avg INTEGER,
      heart_rate_max INTEGER,
      calories_burned INTEGER,
      cardio_duration_minutes INTEGER,
      steps INTEGER,
      FOREIGN KEY (member_id) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      exercise TEXT NOT NULL,
      weight_kg REAL,
      reps INTEGER,
      recorded_at TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (member_id) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'GBP',
      due_date TEXT NOT NULL,
      paid_date TEXT,
      status TEXT DEFAULT 'paid',
      failure_code TEXT,
      failure_reason TEXT,
      attempts INTEGER DEFAULT 1,
      mandate_ref TEXT,
      FOREIGN KEY (member_id) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      duration_minutes INTEGER,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'GBP',
      category TEXT DEFAULT 'wellness',
      provider TEXT,
      color TEXT DEFAULT '#06b6d4'
    );

    CREATE TABLE IF NOT EXISTS service_bookings (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      booking_datetime TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed',
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (service_id) REFERENCES services(id),
      FOREIGN KEY (member_id) REFERENCES members(id)
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as cnt FROM members').get();
  if (count.cnt === 0) {
    seedDatabase(db);
    console.log('  ✅ Database seeded with demo data');
  } else {
    console.log('  ✅ Database connected');
  }
}

module.exports = { getDB, initDB };
