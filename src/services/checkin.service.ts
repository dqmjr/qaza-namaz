import dayjs from 'dayjs';
import { getDb } from '../db/client.js';
import { Injectable } from '@nestjs/common';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type CheckinBreakdown = {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  manual: number;
  total: number;
};

@Injectable()
export class CheckinService {
  private db = getDb();

  private todayYmd(): string {
    return dayjs().format('YYYY-MM-DD');
  }

  private async userIdByTelegram(telegramId: string): Promise<string> {
    const userRes = await this.db.query<{ id: string }>(
      `SELECT id::text as id FROM users WHERE telegram_id = $1`,
      [telegramId],
    );
    const userId = userRes.rows[0]?.id;
    if (!userId) throw new Error('User not found');
    return userId;
  }

  async getByDate(telegramId: string, dateYmd: string): Promise<number> {
    const b = await this.getBreakdownByDate(telegramId, dateYmd);
    return b.total;
  }

  async getBreakdownByDate(telegramId: string, dateYmd: string): Promise<CheckinBreakdown> {
    const userId = await this.userIdByTelegram(telegramId);
    const res = await this.db.query<{
      fajr: number;
      dhuhr: number;
      asr: number;
      maghrib: number;
      isha: number;
      manual_count: number;
    }>(
      `SELECT fajr, dhuhr, asr, maghrib, isha, manual_count
       FROM checkins
       WHERE user_id = $1 AND date = $2::date
       LIMIT 1`,
      [userId, dateYmd],
    );
    const row = res.rows[0];
    const fajr = row?.fajr ?? 0;
    const dhuhr = row?.dhuhr ?? 0;
    const asr = row?.asr ?? 0;
    const maghrib = row?.maghrib ?? 0;
    const isha = row?.isha ?? 0;
    const manual = row?.manual_count ?? 0;
    return {
      fajr,
      dhuhr,
      asr,
      maghrib,
      isha,
      manual,
      total: fajr + dhuhr + asr + maghrib + isha + manual,
    };
  }

  async addByDate(telegramId: string, dateYmd: string, count: number): Promise<number> {
    // "Total" mode: store in manual_count so per-prayer breakdown stays meaningful.
    const userId = await this.userIdByTelegram(telegramId);

    await this.db.query(
      `INSERT INTO checkins (user_id, date, prayers_count, fajr, dhuhr, asr, maghrib, isha, manual_count)
       VALUES ($1, $2::date, 0, 0, 0, 0, 0, 0, $3)
       ON CONFLICT (user_id, date)
       DO UPDATE SET manual_count = checkins.manual_count + EXCLUDED.manual_count`,
      [userId, dateYmd, count],
    );

    const b = await this.getBreakdownByDate(telegramId, dateYmd);
    return b.total;
  }

  async addToToday(telegramId: string, count: number): Promise<number> {
    return this.addByDate(telegramId, this.todayYmd(), count);
  }

  async addPrayerToToday(
    telegramId: string,
    prayer: PrayerKey,
    delta = 1,
  ): Promise<CheckinBreakdown> {
    return this.addPrayerByDate(telegramId, this.todayYmd(), prayer, delta);
  }

  async addPrayerByDate(
    telegramId: string,
    dateYmd: string,
    prayer: PrayerKey,
    delta = 1,
  ): Promise<CheckinBreakdown> {
    const userId = await this.userIdByTelegram(telegramId);
    if (!['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(prayer)) {
      throw new Error('Invalid prayer key');
    }

    await this.db.query(
      `INSERT INTO checkins (user_id, date, prayers_count, fajr, dhuhr, asr, maghrib, isha, manual_count)
       VALUES ($1, $2::date, 0, 0, 0, 0, 0, 0, 0)
       ON CONFLICT (user_id, date) DO NOTHING`,
      [userId, dateYmd],
    );

    await this.db.query(
      `UPDATE checkins
       SET ${prayer} = ${prayer} + $1
       WHERE user_id = $2 AND date = $3::date`,
      [delta, userId, dateYmd],
    );

    return this.getBreakdownByDate(telegramId, dateYmd);
  }

  async overwriteByDate(telegramId: string, dateYmd: string, count: number): Promise<number> {
    const userId = await this.userIdByTelegram(telegramId);
    await this.db.query(
      `INSERT INTO checkins (user_id, date, prayers_count, fajr, dhuhr, asr, maghrib, isha, manual_count)
       VALUES ($1, $2::date, 0, 0, 0, 0, 0, 0, $3)
       ON CONFLICT (user_id, date)
       DO UPDATE SET fajr = 0, dhuhr = 0, asr = 0, maghrib = 0, isha = 0, manual_count = EXCLUDED.manual_count`,
      [userId, dateYmd, count],
    );
    const b = await this.getBreakdownByDate(telegramId, dateYmd);
    return b.total;
  }

  async getMonthDailyTotals(
    telegramId: string,
    monthYmd?: string,
  ): Promise<Array<{ date: string; total: number }>> {
    const userId = await this.userIdByTelegram(telegramId);
    const start = monthYmd
      ? dayjs(monthYmd).startOf('month')
      : dayjs().startOf('month');
    const end = start.endOf('month');

    const res = await this.db.query<{
      date: string;
      fajr: number;
      dhuhr: number;
      asr: number;
      maghrib: number;
      isha: number;
      manual_count: number;
    }>(
      `SELECT to_char(date, 'YYYY-MM-DD') as date, fajr, dhuhr, asr, maghrib, isha, manual_count
       FROM checkins
       WHERE user_id = $1
         AND date >= $2::date
         AND date <= $3::date
       ORDER BY date ASC`,
      [userId, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')],
    );

    return res.rows.map((r) => ({
      date: r.date,
      total: (r.fajr ?? 0) + (r.dhuhr ?? 0) + (r.asr ?? 0) + (r.maghrib ?? 0) + (r.isha ?? 0) + (r.manual_count ?? 0),
    }));
  }

  async getDailyTotalsInRange(
    telegramId: string,
    startYmd: string,
    endYmd: string,
  ): Promise<Array<{ date: string; total: number }>> {
    const userId = await this.userIdByTelegram(telegramId);
    const res = await this.db.query<{
      date: string;
      fajr: number;
      dhuhr: number;
      asr: number;
      maghrib: number;
      isha: number;
      manual_count: number;
    }>(
      `SELECT to_char(date, 'YYYY-MM-DD') as date, fajr, dhuhr, asr, maghrib, isha, manual_count
       FROM checkins
       WHERE user_id = $1
         AND date >= $2::date
         AND date <= $3::date
       ORDER BY date ASC`,
      [userId, startYmd, endYmd],
    );

    return res.rows.map((r) => ({
      date: r.date,
      total: (r.fajr ?? 0) + (r.dhuhr ?? 0) + (r.asr ?? 0) + (r.maghrib ?? 0) + (r.isha ?? 0) + (r.manual_count ?? 0),
    }));
  }
}

