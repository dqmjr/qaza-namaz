import { Scenes } from 'telegraf';
import type { BotContext, SetupState } from '../types.js';
import { UserService } from '../../services/user.service.js';
import { t } from '../../i18n/index.js';
import { reminderModeKeyboard, setupStrategyKeyboard } from '../keyboards/setup.keyboard.js';
import { isValidTimeHHmm } from '../../utils/date.js';
import { RequestLocationKeyboard } from '../keyboards/location.keyboard.js';
import { cityConfirmKeyboard, cityPickKeyboard, citySearchResultsKeyboard } from '../keyboards/city.keyboard.js';
import { haversineKm } from '../../utils/geo.js';
import { KZ_CITIES } from '../../data/kz-cities.js';

type Ctx = BotContext;

const userService = new UserService();

function telegramId(ctx: Ctx): string {
  const id = ctx.from?.id;
  if (!id) throw new Error('Missing ctx.from.id');
  return String(id);
}

async function lang(ctx: Ctx) {
  return userService.getLanguage(telegramId(ctx));
}

export const setupScene = new Scenes.WizardScene<Ctx>(
  'setup',
  async (ctx) => {
    const l = await lang(ctx);
    (ctx.wizard.state as SetupState) = {};
    await ctx.reply(t(l, 'setup.years.ask'));
    await ctx.reply(t(l, 'setup.years.info'));
    return ctx.wizard.next();
  },
  async (ctx) => {
    const l = await lang(ctx);
    const text =
      ctx.message && 'text' in ctx.message ? String(ctx.message.text).trim() : '';
    const years = Number.parseInt(text, 10);
    if (!Number.isFinite(years) || years < 1 || years > 50) {
      await ctx.reply(t(l, 'setup.years.invalid'));
      return;
    }

    Object.assign(ctx.wizard.state as SetupState, { selectedYears: years });
    await userService.applySetupYears(telegramId(ctx), years);

    // Only one strategy for now: preset (1 year in 12 days).
    const value = 152;
    Object.assign(ctx.wizard.state as SetupState, { strategyType: 'preset', strategyValue: value });
    await userService.applySetupStrategy(telegramId(ctx), 'preset', value);

    await ctx.reply(t(l, 'setup.reminder.mode.ask'), reminderModeKeyboard(l));
    return ctx.wizard.selectStep(4);
  },
  async (ctx) => {
    const l = await lang(ctx);
    const data =
      ctx.callbackQuery && 'data' in ctx.callbackQuery ? String(ctx.callbackQuery.data) : null;

    if (data === 'setup:reminder:each_prayer') {
      await ctx.answerCbQuery();
      await userService.applyReminderMode(telegramId(ctx), 'each_prayer', null);
      await ctx.reply(t(l, 'setup.location.ask'), RequestLocationKeyboard);
      return ctx.wizard.next();
    }

    if (data === 'setup:reminder:daily') {
      await ctx.answerCbQuery();
      await userService.applyReminderMode(telegramId(ctx), 'daily', null);
      await ctx.reply(t(l, 'setup.reminder.ask'));
      return ctx.wizard.selectStep(5);
    }

    // ignore other callback buttons
    return;
  },
  // Each-prayer: request location -> infer city -> confirm/correct
  async (ctx) => {
    const l = await lang(ctx);

    if (ctx.message && 'location' in ctx.message) {
      const { latitude, longitude } = ctx.message.location;
      const here = { lat: latitude, lon: longitude };
      const nearest = KZ_CITIES.map((c) => ({
        c,
        d: haversineKm(here, { lat: c.lat, lon: c.lon }),
      })).sort((a, b) => a.d - b.d)[0]!.c;

      (ctx.wizard.state as SetupState).cityId = nearest.id as any;
      (ctx.wizard.state as SetupState).cityName =
        (l === 'kk' ? nearest.name_kk : nearest.name_ru) as any;
      (ctx.wizard.state as SetupState).lat = latitude as any;
      (ctx.wizard.state as SetupState).lon = longitude as any;

      const msg = t(l, 'setup.location.detected').replace(
        '{city}',
        l === 'kk' ? nearest.name_kk : nearest.name_ru,
      );
      await ctx.reply(msg, cityConfirmKeyboard(l));
      return ctx.wizard.next();
    }

    // allow text search while waiting for location / city selection
    const st = ctx.wizard.state as SetupState;
    const text =
      ctx.message && 'text' in ctx.message ? String(ctx.message.text).trim() : '';
    if (st.citySearching && text) {
      const kb = citySearchResultsKeyboard(l, text);
      // if only the back-to-list button exists => no matches
      // (keyboard always adds "list" button, so we detect by query length and match count)
      const q = text.trim().toLowerCase();
      const anyMatch = KZ_CITIES.some((c) => c.name_ru.toLowerCase().includes(q) || c.name_kk.toLowerCase().includes(q) || c.id.includes(q));
      if (!anyMatch) {
        await ctx.reply(t(l, 'setup.location.search_empty'), cityPickKeyboard(l, st.cityPage ?? 0));
        return;
      }
      await ctx.reply(t(l, 'setup.location.choose_city'), kb);
      return;
    }

    await ctx.reply(t(l, 'setup.location.ask'), RequestLocationKeyboard);
  },
  async (ctx) => {
    const l = await lang(ctx);
    const data =
      ctx.callbackQuery && 'data' in ctx.callbackQuery ? String(ctx.callbackQuery.data) : null;
    const st = ctx.wizard.state as SetupState;

    // Handle search query typed as a message while in "confirm/correct city" step
    const text =
      ctx.message && 'text' in ctx.message ? String(ctx.message.text).trim() : '';
    if (st.citySearching && text) {
      const q = text.trim().toLowerCase();
      const anyMatch = KZ_CITIES.some(
        (c) =>
          c.name_ru.toLowerCase().includes(q) ||
          c.name_kk.toLowerCase().includes(q) ||
          c.id.includes(q),
      );
      if (!anyMatch) {
        await ctx.reply(t(l, 'setup.location.search_empty'), cityPickKeyboard(l, st.cityPage ?? 0));
        return;
      }
      await ctx.reply(t(l, 'setup.location.choose_city'), citySearchResultsKeyboard(l, text));
      return;
    }

    if (!data) return;

    if (data === 'noop') {
      await ctx.answerCbQuery();
      return;
    }

    if (data === 'setup:city_confirm:yes') {
      await ctx.answerCbQuery();
      if (!st.cityId || !st.cityName || !st.lat || !st.lon) return;
      await userService.setUserLocationAndCity(telegramId(ctx), st.cityId, st.cityName, st.lat, st.lon);
      await userService.markSetupCompleted(telegramId(ctx));
      await ctx.reply(t(l, 'setup.done'));
      return ctx.scene.leave();
    }

    if (data === 'setup:city_confirm:no') {
      await ctx.answerCbQuery();
      st.citySearching = false;
      st.cityPage = 0;
      await ctx.reply(t(l, 'setup.location.choose_city'), cityPickKeyboard(l, 0));
      return;
    }

    if (data === 'setup:city_search') {
      await ctx.answerCbQuery();
      st.citySearching = true;
      await ctx.reply(t(l, 'setup.location.search_prompt'));
      return;
    }

    if (data === 'setup:city_list') {
      await ctx.answerCbQuery();
      st.citySearching = false;
      await ctx.reply(t(l, 'setup.location.choose_city'), cityPickKeyboard(l, st.cityPage ?? 0));
      return;
    }

    if (data.startsWith('setup:city_page:')) {
      await ctx.answerCbQuery();
      const p = Number.parseInt(data.slice('setup:city_page:'.length), 10);
      st.cityPage = Number.isFinite(p) ? p : 0;
      await ctx.reply(t(l, 'setup.location.choose_city'), cityPickKeyboard(l, st.cityPage));
      return;
    }

    if (data.startsWith('setup:city:')) {
      await ctx.answerCbQuery();
      const id = data.slice('setup:city:'.length);
      const city = KZ_CITIES.find((c) => c.id === id);
      if (!city) return;
      st.cityId = city.id;
      st.cityName = l === 'kk' ? city.name_kk : city.name_ru;
      st.lat = city.lat;
      st.lon = city.lon;
      const msg = t(l, 'setup.location.detected').replace(
        '{city}',
        l === 'kk' ? city.name_kk : city.name_ru,
      );
      await ctx.reply(msg, cityConfirmKeyboard(l));
      return;
    }
  },
  async (ctx) => {
    const l = await lang(ctx);
    const text =
      ctx.message && 'text' in ctx.message ? String(ctx.message.text).trim() : '';
    if (!isValidTimeHHmm(text)) {
      await ctx.reply(t(l, 'setup.reminder.invalid'));
      return;
    }

    await userService.applySetupReminderTime(telegramId(ctx), text);
    await userService.markSetupCompleted(telegramId(ctx));

    await ctx.reply(t(l, 'setup.done'));
    return ctx.scene.leave();
  },
);

