import { Markup } from 'telegraf';

export function reminderQuickAddKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('+1', 'rem:add:1'),
      Markup.button.callback('+5', 'rem:add:5'),
      Markup.button.callback('+10', 'rem:add:10'),
    ],
    [Markup.button.callback('✅ /checkin', 'rem:open_checkin')],
  ]);
}

