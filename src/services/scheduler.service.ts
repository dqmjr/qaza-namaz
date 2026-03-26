import cron from 'node-cron';
import type { Telegraf } from 'telegraf';
import { ReminderService } from './reminder.service.js';
import type { PrayerName } from '../utils/prayer-times.js';
import { reminderQuickAddKeyboard } from '../bot/keyboards/reminder.keyboard.js';
import { t } from '../i18n/index.js';

const reminderService = new ReminderService();

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export function startScheduler(bot: Telegraf): void {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const users = await reminderService.getUsersForEachPrayer();
    const dateYmd = reminderService.dateKey(now);

    for (const u of users) {
      const lat = u.latitude;
      const lon = u.longitude;
      if (lat == null || lon == null) continue;
      const offset = u.reminder_offset_min ?? 5;

      const targets = reminderService.computeTargets(now, lat, lon, offset);

      for (const p of PRAYERS) {
        const target = targets[p];
        if (!reminderService.shouldSend(now, target)) continue;
        if (await reminderService.wasSent(u.id, dateYmd, p)) continue;

        await bot.telegram.sendMessage(
          Number(u.telegram_id),
          t(u.language, 'reminder.prompt'),
          reminderQuickAddKeyboard(),
        );
        await reminderService.markSent(u.id, dateYmd, p);
      }
    }
  });
}

