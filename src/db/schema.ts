import { getDb } from './client.js';

export async function migrate(): Promise<void> {
  const db = getDb();

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      telegram_id TEXT NOT NULL UNIQUE,
      language TEXT NOT NULL,
      selected_years INTEGER,
      total_prayers INTEGER,
      completed_prayers INTEGER NOT NULL DEFAULT 0,
      daily_strategy_type TEXT,
      daily_strategy_value INTEGER,
      reminder_time TEXT,
      reminder_type TEXT,
      reminder_times TEXT,
      city_id TEXT,
      city_name TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      reminder_offset_min INTEGER NOT NULL DEFAULT 5,
      setup_completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Backward-compatible migrations (for existing DBs)
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_type TEXT;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_times TEXT;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS city_id TEXT;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS city_name TEXT;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_offset_min INTEGER;`);
  await db.query(`UPDATE users SET reminder_offset_min = 5 WHERE reminder_offset_min IS NULL;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS method_type TEXT;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS current_prayer TEXT;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cycle_day INTEGER;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_completed_prayers INTEGER;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS debt_fajr INTEGER;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS debt_dhuhr INTEGER;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS debt_asr INTEGER;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS debt_maghrib INTEGER;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS debt_isha INTEGER;`);
  await db.query(`UPDATE users SET method_type = '12day' WHERE method_type IS NULL;`);
  await db.query(`UPDATE users SET current_prayer = 'fajr' WHERE current_prayer IS NULL;`);
  await db.query(`UPDATE users SET cycle_day = 0 WHERE cycle_day IS NULL;`);
  await db.query(`UPDATE users SET total_completed_prayers = 0 WHERE total_completed_prayers IS NULL;`);
  await db.query(`UPDATE users SET debt_fajr = 0 WHERE debt_fajr IS NULL;`);
  await db.query(`UPDATE users SET debt_dhuhr = 0 WHERE debt_dhuhr IS NULL;`);
  await db.query(`UPDATE users SET debt_asr = 0 WHERE debt_asr IS NULL;`);
  await db.query(`UPDATE users SET debt_maghrib = 0 WHERE debt_maghrib IS NULL;`);
  await db.query(`UPDATE users SET debt_isha = 0 WHERE debt_isha IS NULL;`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS checkins (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      prayers_count INTEGER NOT NULL,
      fajr INTEGER,
      dhuhr INTEGER,
      asr INTEGER,
      maghrib INTEGER,
      isha INTEGER,
      manual_count INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, date)
    );
  `);

  await db.query(`ALTER TABLE checkins ADD COLUMN IF NOT EXISTS fajr INTEGER;`);
  await db.query(`ALTER TABLE checkins ADD COLUMN IF NOT EXISTS dhuhr INTEGER;`);
  await db.query(`ALTER TABLE checkins ADD COLUMN IF NOT EXISTS asr INTEGER;`);
  await db.query(`ALTER TABLE checkins ADD COLUMN IF NOT EXISTS maghrib INTEGER;`);
  await db.query(`ALTER TABLE checkins ADD COLUMN IF NOT EXISTS isha INTEGER;`);
  await db.query(`ALTER TABLE checkins ADD COLUMN IF NOT EXISTS manual_count INTEGER;`);
  await db.query(`UPDATE checkins SET fajr = 0 WHERE fajr IS NULL;`);
  await db.query(`UPDATE checkins SET dhuhr = 0 WHERE dhuhr IS NULL;`);
  await db.query(`UPDATE checkins SET asr = 0 WHERE asr IS NULL;`);
  await db.query(`UPDATE checkins SET maghrib = 0 WHERE maghrib IS NULL;`);
  await db.query(`UPDATE checkins SET isha = 0 WHERE isha IS NULL;`);
  await db.query(`UPDATE checkins SET manual_count = 0 WHERE manual_count IS NULL;`);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, date);
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS reminder_sent (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      prayer_key TEXT NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, date, prayer_key)
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_reminder_sent_user_date ON reminder_sent(user_id, date);
  `);
}

