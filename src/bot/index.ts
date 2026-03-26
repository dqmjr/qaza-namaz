import { Telegraf, session } from 'telegraf';
import { migrate } from '../db/schema.js';
import { config } from '../utils/config.js';
import { onChooseLanguage, onStart } from './handlers/start.handler.js';
import { stage } from './stage.js';
import { startScheduler } from '../services/scheduler.service.js';
import { CheckinService } from '../services/checkin.service.js';
import { t } from '../i18n/index.js';
import { UserService } from '../services/user.service.js';
import {
  onCheckin,
  onCheckinAddPrayer,
  onCheckinModeEach,
  onCheckinModeTotal,
  onCheckinTotalInput,
} from './handlers/checkin.handler.js';
import { onEdit, onEditNumber } from './handlers/edit.handler.js';

export async function createBot(): Promise<Telegraf> {
  // eslint-disable-next-line no-console
  console.log('Running migrations...');
  await migrate();
  // eslint-disable-next-line no-console
  console.log('Migrations done');
  const bot = new Telegraf(config.botToken);

  bot.use(session());
  bot.use(stage.middleware() as never);

  bot.start(async (ctx) => onStart(ctx));
  bot.command('setup', async (ctx) => {
    if ('scene' in ctx) {
      await (ctx as any).scene.enter('setup');
    }
  });

  bot.action(/^lang:(kk|ru)$/, async (ctx) => {
    const lang = ctx.match?.[1] === 'kk' ? 'kk' : 'ru';
    await onChooseLanguage(ctx, lang);
  });

  const checkinService = new CheckinService();
  const userService = new UserService();

  bot.action(/^rem:add:(\d+)$/, async (ctx) => {
    const n = Number.parseInt(String((ctx as any).match?.[1]), 10);
    if (!Number.isFinite(n) || n <= 0) return;
    const telegramId = String(ctx.from?.id ?? '');
    const lang = await userService.getLanguage(telegramId);
    await checkinService.addToToday(telegramId, n);
    await ctx.answerCbQuery();
    await ctx.reply(t(lang, 'reminder.added').replace('{n}', String(n)));
  });

  bot.action('rem:open_checkin', async (ctx) => {
    await ctx.answerCbQuery();
    await onCheckin(ctx);
  });

  bot.command('checkin', async (ctx) => onCheckin(ctx));
  bot.action('checkin:mode:each', async (ctx) => onCheckinModeEach(ctx));
  bot.action('checkin:mode:total', async (ctx) => onCheckinModeTotal(ctx));
  bot.action(/^checkin:prayer:(fajr|dhuhr|asr|maghrib|isha)$/, async (ctx) => {
    const prayer = String((ctx as any).match?.[1]) as any;
    await onCheckinAddPrayer(ctx, prayer);
  });

  // If user chose "total", they will send a number; keep it simple for MVP:
  bot.on('text', async (ctx, next) => {
    if (await onEditNumber(ctx)) return;
    const text = (ctx.message.text ?? '').trim();
    if (/^\d{1,3}$/.test(text)) {
      await onCheckinTotalInput(ctx);
      return;
    }
    await next();
  });

  bot.command('edit', async (ctx) => onEdit(ctx));

  startScheduler(bot);
  return bot;
}

