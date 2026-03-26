import type { Context } from 'telegraf';
import { t } from '../../i18n/index.js';
import { UserService } from '../../services/user.service.js';
import { CheckinService, type PrayerKey } from '../../services/checkin.service.js';
import { checkinMenuKeyboard, checkinPrayerKeyboard } from '../keyboards/checkin.keyboard.js';

const userService = new UserService();
const checkinService = new CheckinService();

function telegramId(ctx: Context): string {
  const id = ctx.from?.id;
  if (!id) throw new Error('Missing ctx.from.id');
  return String(id);
}

export async function onCheckin(ctx: Context): Promise<void> {
  const tid = telegramId(ctx);
  const lang = await userService.getLanguage(tid);
  await ctx.reply(t(lang, 'checkin.menu'), checkinMenuKeyboard(lang));
}

export async function onCheckinModeEach(ctx: Context): Promise<void> {
  const tid = telegramId(ctx);
  const lang = await userService.getLanguage(tid);
  await ctx.answerCbQuery();
  const b = await checkinService.getBreakdownByDate(tid, dayKey());
  await ctx.reply(formatBreakdown(lang, b), checkinPrayerKeyboard());
}

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatBreakdown(lang: 'kk' | 'ru', b: any): string {
  if (lang === 'kk') {
    return (
      `Бүгін:\n` +
      `Таң: ${b.fajr}  Бесін: ${b.dhuhr}  Екінті: ${b.asr}\n` +
      `Ақшам: ${b.maghrib}  Құптан: ${b.isha}\n` +
      `Барлығы: ${b.total}`
    );
  }
  return (
    `Сегодня:\n` +
    `Фаджр: ${b.fajr}  Зухр: ${b.dhuhr}  Аср: ${b.asr}\n` +
    `Магриб: ${b.maghrib}  Иша: ${b.isha}\n` +
    `Итого: ${b.total}`
  );
}

export async function onCheckinAddPrayer(ctx: Context, prayer: PrayerKey): Promise<void> {
  const tid = telegramId(ctx);
  const lang = await userService.getLanguage(tid);
  await ctx.answerCbQuery();
  const b = await checkinService.addPrayerToToday(tid, prayer, 1);
  await ctx.reply(formatBreakdown(lang, b), checkinPrayerKeyboard());
}

export async function onCheckinModeTotal(ctx: Context): Promise<void> {
  const tid = telegramId(ctx);
  const lang = await userService.getLanguage(tid);
  await ctx.answerCbQuery();
  await ctx.reply(t(lang, 'checkin.total.ask'));
}

export async function onCheckinTotalInput(ctx: Context): Promise<void> {
  if (!ctx.message || !('text' in ctx.message)) return;
  const tid = telegramId(ctx);
  const lang = await userService.getLanguage(tid);

  const n = Number.parseInt(String(ctx.message.text).trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 200) {
    await ctx.reply(t(lang, 'checkin.total.invalid'));
    return;
  }

  const total = await checkinService.addToToday(tid, n);
  await ctx.reply(
    t(lang, 'checkin.total.added').replace('{n}', String(n)).replace('{total}', String(total)),
  );
}

