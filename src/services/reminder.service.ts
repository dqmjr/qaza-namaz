import dayjs from 'dayjs';
import { getDb } from '../db/client.js';
import { computePrayerTimes, type PrayerName, ymd } from '../utils/prayer-times.js';

export type ReminderUserRow = {
  id: string;
  telegram_id: string;
  language: 'kk' | 'ru';
  reminder_type: string | null;
  reminder_time: string | null;
  latitude: number | null;
  longitude: number | null;
  reminder_offset_min: number | null;
};

export class ReminderService {
  private db = getDb();

  async getUsersForEachPrayer(): Promise<ReminderUserRow[]> {
    const res = await this.db.query<ReminderUserRow>(
      `SELECT id::text as id,
              telegram_id,
              language,
              reminder_type,
              reminder_time,
              latitude,
              longitude,
              reminder_offset_min
       FROM users
       WHERE setup_completed = TRUE
         AND reminder_type = 'each_prayer'
         AND latitude IS NOT NULL
         AND longitude IS NOT NULL`,
    );
    return res.rows;
  }

  async wasSent(userId: string, dateYmd: string, prayerKey: PrayerName): Promise<boolean> {
    const res = await this.db.query(
      `SELECT 1
       FROM reminder_sent
       WHERE user_id = $1 AND date = $2::date AND prayer_key = $3
       LIMIT 1`,
      [userId, dateYmd, prayerKey],
    );
    return (res.rowCount ?? 0) > 0;
  }

  async markSent(userId: string, dateYmd: string, prayerKey: PrayerName): Promise<void> {
    await this.db.query(
      `INSERT INTO reminder_sent (user_id, date, prayer_key)
       VALUES ($1, $2::date, $3)
       ON CONFLICT (user_id, date, prayer_key) DO NOTHING`,
      [userId, dateYmd, prayerKey],
    );
  }

  shouldSend(now: Date, target: Date): boolean {
    const n = dayjs(now);
    const t = dayjs(target);
    return n.year() === t.year() && n.month() === t.month() && n.date() === t.date() && n.hour() === t.hour() && n.minute() === t.minute();
  }

  computeTargets(now: Date, lat: number, lon: number, offsetMin: number): Record<PrayerName, Date> {
    const schedule = computePrayerTimes(now, lat, lon);
    return {
      fajr: dayjs(schedule.fajr).add(offsetMin, 'minute').toDate(),
      dhuhr: dayjs(schedule.dhuhr).add(offsetMin, 'minute').toDate(),
      asr: dayjs(schedule.asr).add(offsetMin, 'minute').toDate(),
      maghrib: dayjs(schedule.maghrib).add(offsetMin, 'minute').toDate(),
      isha: dayjs(schedule.isha).add(offsetMin, 'minute').toDate(),
    };
  }

  dateKey(now: Date): string {
    return ymd(now);
  }
}

