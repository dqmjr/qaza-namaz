import { getDb } from '../db/client.js';
import { Injectable } from '@nestjs/common';
import type { Language } from '../i18n/index.js';
import { config } from '../utils/config.js';

export type User = {
  id: string;
  telegram_id: string;
  language: Language;
  setup_completed: boolean;
  created_at: string; // ISO from pg
};

export type SetupStrategyType = 'preset' | 'custom';
export type ReminderType = 'daily' | 'each_prayer';
export type MethodType = '12day' | 'custom';
export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type MethodState = {
  method_type: MethodType;
  current_prayer: PrayerKey;
  cycle_day: number;
  selected_years: number | null;
};

export type DebtState = {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  remainingTotal: number;
};

@Injectable()
export class UserService {
  private db = getDb();

  async getOrCreateByTelegramId(telegramId: string): Promise<User> {
    const existingRes = await this.db.query<User>(
      `SELECT id::text as id, telegram_id, language, setup_completed, created_at::text as created_at
       FROM users
       WHERE telegram_id = $1`,
      [telegramId],
    );
    const existing = existingRes.rows[0];

    if (existing) return existing;

    const lang = config.defaultLanguage;

    const insertedRes = await this.db.query<User>(
      `INSERT INTO users (telegram_id, language, setup_completed)
       VALUES ($1, $2, FALSE)
       RETURNING id::text as id, telegram_id, language, setup_completed, created_at::text as created_at`,
      [telegramId, lang],
    );

    return insertedRes.rows[0]!;
  }

  async setLanguage(telegramId: string, language: Language): Promise<void> {
    await this.db.query(`UPDATE users SET language = $1 WHERE telegram_id = $2`, [
      language,
      telegramId,
    ]);
  }

  async getLanguage(telegramId: string): Promise<Language> {
    const res = await this.db.query<{ language: string }>(
      `SELECT language FROM users WHERE telegram_id = $1`,
      [telegramId],
    );
    return res.rows[0]?.language === 'kk' ? 'kk' : 'ru';
  }

  async getSetupCompleted(telegramId: string): Promise<boolean> {
    const res = await this.db.query<{ setup_completed: boolean }>(
      `SELECT setup_completed FROM users WHERE telegram_id = $1`,
      [telegramId],
    );
    return res.rows[0]?.setup_completed ?? false;
  }

  async applySetupYears(telegramId: string, selectedYears: number): Promise<void> {
    const totalPrayers = selectedYears * 1825;
    const perPrayer = selectedYears * 365;
    await this.db.query(
      `UPDATE users
       SET selected_years = $1,
           total_prayers = $2,
           debt_fajr = $3,
           debt_dhuhr = $3,
           debt_asr = $3,
           debt_maghrib = $3,
           debt_isha = $3,
           total_completed_prayers = 0
       WHERE telegram_id = $4`,
      [selectedYears, totalPrayers, perPrayer, telegramId],
    );
  }

  async applySetupStrategy(
    telegramId: string,
    strategyType: SetupStrategyType,
    strategyValue: number,
  ): Promise<void> {
    await this.db.query(
      `UPDATE users
       SET daily_strategy_type = $1,
           daily_strategy_value = $2
       WHERE telegram_id = $3`,
      [strategyType, strategyValue, telegramId],
    );
  }

  async applySetupReminderTime(telegramId: string, reminderTime: string): Promise<void> {
    await this.db.query(`UPDATE users SET reminder_time = $1 WHERE telegram_id = $2`, [
      reminderTime,
      telegramId,
    ]);
  }

  async applyReminderMode(
    telegramId: string,
    reminderType: ReminderType,
    reminderTimes: string[] | null,
  ): Promise<void> {
    await this.db.query(
      `UPDATE users
       SET reminder_type = $1,
           reminder_times = $2
       WHERE telegram_id = $3`,
      [reminderType, reminderTimes ? JSON.stringify(reminderTimes) : null, telegramId],
    );
  }

  async setUserLocationAndCity(
    telegramId: string,
    cityId: string,
    cityName: string,
    latitude: number,
    longitude: number,
  ): Promise<void> {
    await this.db.query(
      `UPDATE users
       SET city_id = $1,
           city_name = $2,
           latitude = $3,
           longitude = $4
       WHERE telegram_id = $5`,
      [cityId, cityName, latitude, longitude, telegramId],
    );
  }

  async getUserCity(telegramId: string): Promise<{ city_id: string | null; city_name: string | null }> {
    const res = await this.db.query<{ city_id: string | null; city_name: string | null }>(
      `SELECT city_id, city_name FROM users WHERE telegram_id = $1`,
      [telegramId],
    );
    return res.rows[0] ?? { city_id: null, city_name: null };
  }

  async markSetupCompleted(telegramId: string): Promise<void> {
    await this.db.query(`UPDATE users SET setup_completed = TRUE WHERE telegram_id = $1`, [
      telegramId,
    ]);
  }

  async setMethod(telegramId: string, method: MethodType): Promise<void> {
    await this.db.query(`UPDATE users SET method_type = $1 WHERE telegram_id = $2`, [
      method,
      telegramId,
    ]);
  }

  async init12DayMethod(telegramId: string): Promise<void> {
    await this.db.query(
      `UPDATE users
       SET method_type = '12day',
           current_prayer = COALESCE(current_prayer, 'fajr'),
           cycle_day = COALESCE(cycle_day, 0)
       WHERE telegram_id = $1`,
      [telegramId],
    );
  }

  async getMethodState(telegramId: string): Promise<MethodState> {
    const res = await this.db.query<{
      method_type: string | null;
      current_prayer: string | null;
      cycle_day: number | null;
      selected_years: number | null;
    }>(
      `SELECT method_type, current_prayer, cycle_day, selected_years
       FROM users
       WHERE telegram_id = $1`,
      [telegramId],
    );
    const row = res.rows[0];
    const method_type = row?.method_type === 'custom' ? 'custom' : '12day';
    const current_prayer =
      row?.current_prayer === 'dhuhr' ||
      row?.current_prayer === 'asr' ||
      row?.current_prayer === 'maghrib' ||
      row?.current_prayer === 'isha'
        ? (row.current_prayer as PrayerKey)
        : 'fajr';
    const cycle_day = row?.cycle_day ?? 0;
    const selected_years = row?.selected_years ?? null;
    return { method_type, current_prayer, cycle_day, selected_years };
  }

  async getDebtState(telegramId: string): Promise<DebtState> {
    const res = await this.db.query<{
      debt_fajr: number | null;
      debt_dhuhr: number | null;
      debt_asr: number | null;
      debt_maghrib: number | null;
      debt_isha: number | null;
    }>(
      `SELECT debt_fajr, debt_dhuhr, debt_asr, debt_maghrib, debt_isha
       FROM users WHERE telegram_id = $1`,
      [telegramId],
    );
    const row = res.rows[0];
    const fajr = row?.debt_fajr ?? 0;
    const dhuhr = row?.debt_dhuhr ?? 0;
    const asr = row?.debt_asr ?? 0;
    const maghrib = row?.debt_maghrib ?? 0;
    const isha = row?.debt_isha ?? 0;
    return { fajr, dhuhr, asr, maghrib, isha, remainingTotal: fajr + dhuhr + asr + maghrib + isha };
  }

  async deductFromCurrentPrayer(
    telegramId: string,
    amount: number,
  ): Promise<{ deducted: number; prayer: PrayerKey; remainingPrayer: number; debt: DebtState }> {
    const state = await this.getMethodState(telegramId);
    const debt = await this.getDebtState(telegramId);
    const current = debt[state.current_prayer];
    const deducted = Math.max(0, Math.min(amount, current));
    const remainingPrayer = Math.max(0, current - deducted);

    await this.db.query(
      `UPDATE users
       SET ${`debt_${state.current_prayer}`} = GREATEST(0, ${`debt_${state.current_prayer}`} - $1),
           total_completed_prayers = COALESCE(total_completed_prayers, 0) + $1
       WHERE telegram_id = $2`,
      [deducted, telegramId],
    );

    const nextDebt = await this.getDebtState(telegramId);
    return { deducted, prayer: state.current_prayer, remainingPrayer, debt: nextDebt };
  }

  async advance12DayCycle(
    telegramId: string,
    options?: { incrementDay?: boolean },
  ): Promise<{ day: number; switched: boolean; prayer: PrayerKey; nextPrayer: PrayerKey }> {
    const state = await this.getMethodState(telegramId);
    const debt = await this.getDebtState(telegramId);
    const order: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const idx = order.indexOf(state.current_prayer);
    const nextPrayer = order[(idx + 1) % order.length]!;
    const incrementDay = options?.incrementDay !== false;

    const nextDay = incrementDay ? Math.min(12, (state.cycle_day ?? 0) + 1) : (state.cycle_day ?? 0);
    const switchedByDay = incrementDay && nextDay >= 12;
    const switchedByDebt = debt.remainingTotal > 0 && debt[state.current_prayer] <= 0;
    const switched = switchedByDay || switchedByDebt;

    if (!switched) {
      if (incrementDay) {
        await this.db.query(`UPDATE users SET cycle_day = $1 WHERE telegram_id = $2`, [
          nextDay,
          telegramId,
        ]);
      }
      return { day: nextDay, switched: false, prayer: state.current_prayer, nextPrayer };
    }

    // Switch to the next prayer if day reached 12 or current prayer debt is closed.
    await this.db.query(
      `UPDATE users
       SET current_prayer = $1,
           cycle_day = 0
       WHERE telegram_id = $2`,
      [nextPrayer, telegramId],
    );
    return { day: 12, switched: true, prayer: state.current_prayer, nextPrayer };
  }

  async resetProgress(telegramId: string): Promise<void> {
    await this.db.query(
      `UPDATE users
       SET setup_completed = FALSE,
           selected_years = NULL,
           total_prayers = NULL,
           method_type = '12day',
           current_prayer = 'fajr',
           cycle_day = 0,
           total_completed_prayers = 0,
           debt_fajr = 0,
           debt_dhuhr = 0,
           debt_asr = 0,
           debt_maghrib = 0,
           debt_isha = 0
       WHERE telegram_id = $1`,
      [telegramId],
    );
  }
}

