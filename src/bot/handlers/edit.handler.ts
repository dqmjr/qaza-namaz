import type { Context } from 'telegraf';
import { t } from '../../i18n/index.js';
import { UserService } from '../../services/user.service.js';
import { CheckinService } from '../../services/checkin.service.js';

const userService = new UserService();
const checkinService = new CheckinService();

function telegramId(ctx: Context): string {
  const id = ctx.from?.id;
  if (!id) throw new Error('Missing ctx.from.id');
  return String(id);
}

function isYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function onEdit(ctx: Context): Promise<void> {
  const tid = telegramId(ctx);
  const lang = await userService.getLanguage(tid);
  const parts = ctx.message && 'text' in ctx.message ? String(ctx.message.text).trim().split(/\s+/) : [];

  const date = parts[1];
  if (!date || !isYmd(date)) {
    await ctx.reply(t(lang, 'edit.usage'));
    return;
  }

  // Store pending edit date in session if available; fallback: ask user to send "/edit YYYY-MM-DD N"
  if ('session' in ctx) {
    (ctx as any).session.pendingEditDate = date;
    await ctx.reply(t(lang, 'edit.ask').replace('{date}', date));
    return;
  }

  await ctx.reply(t(lang, 'edit.ask').replace('{date}', date));
}

export async function onEditNumber(ctx: Context): Promise<boolean> {
  if (!ctx.message || !('text' in ctx.message)) return false;
  if (!('session' in ctx)) return false;

  const tid = telegramId(ctx);
  const lang = await userService.getLanguage(tid);
  const date = (ctx as any).session.pendingEditDate as string | undefined;
  if (!date) return false;

  const n = Number.parseInt(String(ctx.message.text).trim(), 10);
  if (!Number.isFinite(n) || n < 0 || n > 200) {
    await ctx.reply(t(lang, 'edit.invalid'));
    return true;
  }

  const total = await checkinService.overwriteByDate(tid, date, n);
  delete (ctx as any).session.pendingEditDate;
  await ctx.reply(t(lang, 'edit.saved').replace('{date}', date).replace('{total}', String(total)));
  return true;
}

