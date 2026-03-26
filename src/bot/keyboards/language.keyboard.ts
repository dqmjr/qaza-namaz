import { Markup } from 'telegraf';

export const LanguageKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🇰🇿 Қазақша', 'lang:kk')],
  [Markup.button.callback('🇷🇺 Русский', 'lang:ru')],
]);

