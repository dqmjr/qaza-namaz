import type { Context } from 'telegraf';
import { LanguageKeyboard } from '../keyboards/language.keyboard.js';
import { t } from '../../i18n/index.js';
import type { Language } from '../../i18n/index.js';
import { UserService } from '../../services/user.service.js';

type BotContext = Context;

const userService = new UserService();

function telegramIdFromCtx(ctx: BotContext): string {
  const id = ctx.from?.id;
  if (!id) throw new Error('Missing ctx.from.id');
  return String(id);
}

export async function onStart(ctx: BotContext): Promise<void> {
  const telegramId = telegramIdFromCtx(ctx);
  const user = await userService.getOrCreateByTelegramId(telegramId);

  await ctx.reply(t(user.language, 'start.welcome'));
  await ctx.reply(t(user.language, 'start.language'), LanguageKeyboard);

  if (!user.setup_completed && 'scene' in ctx) {
    // @ts-expect-error Telegraf Scene context injected by stage middleware
    await ctx.scene.enter('setup');
  }
}

export async function onChooseLanguage(ctx: BotContext, lang: Language): Promise<void> {
  const telegramId = telegramIdFromCtx(ctx);
  await userService.getOrCreateByTelegramId(telegramId);
  await userService.setLanguage(telegramId, lang);

  await ctx.answerCbQuery();
  await ctx.reply(t(lang, 'language.saved'));
  if ('scene' in ctx) {
    // @ts-expect-error Telegraf Scene context injected by stage middleware
    await ctx.scene.enter('setup');
  } else {
    await ctx.reply(t(lang, 'start.language'), LanguageKeyboard);
  }
}

