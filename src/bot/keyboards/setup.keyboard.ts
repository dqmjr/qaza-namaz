import { Markup } from 'telegraf';
import type { Language } from '../../i18n/index.js';
import { t } from '../../i18n/index.js';
import { config } from '../../utils/config.js';

export function setupStrategyKeyboard(lang: Language) {
  const rows = [
    [Markup.button.callback(t(lang, 'setup.strategy.preset'), 'setup:strategy:preset')],
  ];
  if (config.enableCustomStrategy) {
    rows.push([Markup.button.callback(t(lang, 'setup.strategy.custom'), 'setup:strategy:custom')]);
  }
  return Markup.inlineKeyboard(rows);
}

export function reminderModeKeyboard(lang: Language) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t(lang, 'setup.reminder.mode.daily'), 'setup:reminder:daily')],
    [
      Markup.button.callback(
        t(lang, 'setup.reminder.mode.each_prayer'),
        'setup:reminder:each_prayer',
      ),
    ],
  ]);
}

