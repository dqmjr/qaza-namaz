import { Markup } from 'telegraf';
import type { Language } from '../../i18n/index.js';
import { t } from '../../i18n/index.js';

export function checkinMenuKeyboard(lang: Language) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t(lang, 'checkin.menu.each'), 'checkin:mode:each')],
    [Markup.button.callback(t(lang, 'checkin.menu.total'), 'checkin:mode:total')],
  ]);
}

export function checkinPrayerKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('Таң', 'checkin:prayer:fajr'),
      Markup.button.callback('Бесін', 'checkin:prayer:dhuhr'),
      Markup.button.callback('Екінті', 'checkin:prayer:asr'),
    ],
    [
      Markup.button.callback('Ақшам', 'checkin:prayer:maghrib'),
      Markup.button.callback('Құптан', 'checkin:prayer:isha'),
    ],
  ]);
}

