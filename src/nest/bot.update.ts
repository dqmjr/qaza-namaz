import { InjectBot, Start, Update, Command, Action, Ctx, On } from 'nestjs-telegraf';
import type { Telegraf, Context } from 'telegraf';
import { Markup } from 'telegraf';
import dayjs from 'dayjs';
import { createCanvas } from '@napi-rs/canvas';
import { LanguageKeyboard } from '../bot/keyboards/language.keyboard.js';
import { t } from '../i18n/index.js';
import { UserService } from '../services/user.service.js';
import { CheckinService } from '../services/checkin.service.js';

const DISCLAIMER_RU =
  '⚠️ Это бот для учёта и мотивации. Он не заменяет религиозные знания и не даёт фетв.';
const DISCLAIMER_KK =
  '⚠️ Бұл бот тек есеп және мотивация үшін. Діни үкім шығармайды.';
const MAKRUH_URL =
  'https://islam.kz/kk/articles/iman-alippesi/islam-sharttary/namaz-oqu/makruh-uaqyttar-588/#gsc.tab=0';

@Update()
export class BotUpdate {
  private readonly users = new UserService();
  private readonly checkins = new CheckinService();

  constructor(
    @InjectBot() private readonly bot: Telegraf,
  ) {}

  private tid(ctx: Context): string {
    const id = ctx.from?.id;
    if (!id) throw new Error('Missing ctx.from.id');
    return String(id);
  }

  private prayerName(lang: 'kk' | 'ru', key: string): string {
    if (lang === 'kk') {
      if (key === 'fajr') return 'Таң';
      if (key === 'dhuhr') return 'Бесін';
      if (key === 'asr') return 'Екінті';
      if (key === 'maghrib') return 'Ақшам';
      return 'Құптан';
    }
    if (key === 'fajr') return 'Фаджр';
    if (key === 'dhuhr') return 'Зухр';
    if (key === 'asr') return 'Аср';
    if (key === 'maghrib') return 'Магриб';
    return 'Иша';
  }

  private mainMenu(lang: 'kk' | 'ru') {
    return Markup.keyboard([
      [t(lang, 'menu.setup'), t(lang, 'menu.checkin')],
      [t(lang, 'menu.report'), t(lang, 'menu.method')],
      [t(lang, 'menu.reset'), t(lang, 'menu.help')],
    ] as any).resize();
  }

  private async showMenu(ctx: any, lang: 'kk' | 'ru') {
    await ctx.reply(t(lang, 'menu.title'), this.mainMenu(lang));
  }

  private monthTitle(lang: 'kk' | 'ru', date: dayjs.Dayjs): string {
    const kk = [
      'Қаңтар',
      'Ақпан',
      'Наурыз',
      'Сәуір',
      'Мамыр',
      'Маусым',
      'Шілде',
      'Тамыз',
      'Қыркүйек',
      'Қазан',
      'Қараша',
      'Желтоқсан',
    ];
    const ru = [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ];
    const m = date.month();
    return `${lang === 'kk' ? kk[m] : ru[m]} ${date.year()}`;
  }

  private colorByTotal(total: number | undefined): string {
    if (typeof total !== 'number') return '#EEF1F5';
    if (total >= 30) return '#8BCF7B';
    if (total >= 10) return '#9CCAF2';
    if (total > 0) return '#F2E29C';
    return '#F2B2B2';
  }

  private async renderYearHeatmapPng(
    lang: 'kk' | 'ru',
    rows: Array<{ date: string; total: number }>,
  ): Promise<Buffer> {
    const width = 1260;
    const height = 1120;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#F6F7F9';
    ctx.fillRect(0, 0, width, height);

    // Card
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E7E9EF';
    ctx.lineWidth = 1;
    const cardX = 28;
    const cardY = 28;
    const cardW = width - 56;
    const cardH = height - 56;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    const now = dayjs();
    const oldest = now.startOf('month').subtract(11, 'month');
    const byDate = new Map<string, number>();
    for (const r of rows) byDate.set(dayjs(r.date).format('YYYY-MM-DD'), r.total);

    ctx.fillStyle = '#101828';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(lang === 'kk' ? 'Жылдық прогресс календары' : 'Годовой календарь прогресса', 62, 88);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#475467';
    ctx.fillText(
      lang === 'kk'
        ? `${this.monthTitle(lang, oldest)} -> ${this.monthTitle(lang, now)}`
        : `${this.monthTitle(lang, oldest)} -> ${this.monthTitle(lang, now)}`,
      62,
      124,
    );

    const blockW = 280;
    const blockH = 275;
    const startX = 62;
    const startY = 170;
    const colGap = 24;
    const rowGap = 28;
    const cell = 30;
    const cellGap = 6;
    const week = lang === 'kk' ? ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жс'] : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    for (let m = 0; m < 12; m += 1) {
      const month = oldest.add(m, 'month');
      const col = m % 4;
      const row = Math.floor(m / 4);
      const x0 = startX + col * (blockW + colGap);
      const y0 = startY + row * (blockH + rowGap);

      ctx.fillStyle = '#FCFCFD';
      ctx.strokeStyle = '#E4E7EC';
      ctx.fillRect(x0, y0, blockW, blockH);
      ctx.strokeRect(x0, y0, blockW, blockH);

      ctx.fillStyle = '#101828';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(this.monthTitle(lang, month), x0 + 12, y0 + 28);

      ctx.fillStyle = '#667085';
      ctx.font = '15px Arial';
      for (let i = 0; i < 7; i += 1) {
        ctx.fillText(week[i]!, x0 + 12 + i * (cell + cellGap), y0 + 52);
      }

      const days = month.daysInMonth();
      const offset = (month.startOf('month').day() + 6) % 7;
      let slot = offset;
      for (let d = 1; d <= days; d += 1) {
        const rr = Math.floor(slot / 7);
        const cc = slot % 7;
        const x = x0 + 12 + cc * (cell + cellGap);
        const y = y0 + 62 + rr * (cell + cellGap);
        const key = month.date(d).format('YYYY-MM-DD');
        const total = byDate.get(key);
        ctx.fillStyle = this.colorByTotal(total);
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = '#EAECF0';
        ctx.strokeRect(x, y, cell, cell);
        slot += 1;
      }
    }

    const legendY = 1035;
    const item = (x: number, color: string, label: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, legendY, 18, 18);
      ctx.strokeStyle = '#D0D5DD';
      ctx.strokeRect(x, legendY, 18, 18);
      ctx.fillStyle = '#475467';
      ctx.font = '18px Arial';
      ctx.fillText(label, x + 28, legendY + 16);
    };

    item(62, '#8BCF7B', lang === 'kk' ? 'Өте жақсы (30+)' : 'Отлично (30+)');
    item(322, '#9CCAF2', lang === 'kk' ? 'Жақсы (10-29)' : 'Хорошо (10-29)');
    item(582, '#F2E29C', lang === 'kk' ? 'Аз (1-9)' : 'Немного (1-9)');
    item(822, '#F2B2B2', lang === 'kk' ? '0 (өтелмеді)' : '0 (не выполнено)');
    item(1032, '#EEF1F5', lang === 'kk' ? 'Жазба жоқ' : 'Нет записи');

    return canvas.toBuffer('image/png');
  }

  private makruhWarningHtml(lang: 'kk' | 'ru'): string {
    if (lang === 'kk') {
      return `⚠️ Ескерту: мәкрүһ уақытта қаза намаз оқуға болмайды.\nТолығырақ: <a href="${MAKRUH_URL}">Мәкрүһ уақыттар</a>`;
    }
    return `⚠️ Важно: не читайте къаза-намаз в макрух-времена.\nПодробнее: <a href="${MAKRUH_URL}">Макрух времена</a>`;
  }

  @Start()
  async start(@Ctx() ctx: Context) {
    const user = await this.users.getOrCreateByTelegramId(this.tid(ctx));
    await ctx.reply(t(user.language, 'start.welcome'));
    await ctx.reply(t(user.language, 'start.language'), LanguageKeyboard);
    await this.showMenu(ctx, user.language);
  }

  @Action(/^lang:(kk|ru)$/)
  async setLang(@Ctx() ctx: any) {
    const lang = ctx.match?.[1] === 'kk' ? 'kk' : 'ru';
    const tid = this.tid(ctx);
    await this.users.getOrCreateByTelegramId(tid);
    await this.users.setLanguage(tid, lang);
    await ctx.answerCbQuery();
    await ctx.reply(t(lang, 'language.saved'));

    // Auto-continue to setup after language selection
    const completed = await this.users.getSetupCompleted(tid);
    const methodState = await this.users.getMethodState(tid);
    if (!completed || !methodState.selected_years || methodState.selected_years <= 0) {
      await this.setup(ctx);
    } else {
      await this.checkin(ctx);
    }
    await this.showMenu(ctx, lang);
  }

  @Command('setup')
  async setup(@Ctx() ctx: any) {
    const tid = this.tid(ctx);
    await this.users.getOrCreateByTelegramId(tid);
    const lang = await this.users.getLanguage(tid);
    ctx.session = ctx.session ?? {};
    ctx.session.setupStep = 'years';
    await ctx.reply(t(lang, 'setup.years.ask'));
    await ctx.reply(t(lang, 'setup.years.info'));
    await this.showMenu(ctx, lang);
  }

  @Command('start12')
  async start12(@Ctx() ctx: any) {
    // convenience command: go straight to setup for 12-day method
    await this.setup(ctx);
  }

  @Command('method')
  async method(@Ctx() ctx: Context) {
    const lang = await this.users.getLanguage(this.tid(ctx));
    await ctx.reply(this.makruhWarningHtml(lang), {
      parse_mode: 'HTML',
    });
    const text =
      lang === 'kk'
        ? `📚 12 КҮН = 1 ЖЫЛ ӘДІСІ\n\nБұл әдіс қаза намаздарды рет-ретімен, жүйелі түрде өтеуге көмектеседі.\n\n🧭 Қалай орындалады:\n1) Бір намаз түрін фокусқа аласыз (мысалы: Таң)\n2) Әр парыз намаздан кейін сол намаздың қазасын 6 рет оқисыз\n3) Күніне барлығы: 6×5 = 30 қаза\n4) 12 күнде: 360 қаза (шамамен 1 жыл)\n5) 12 күн аяқталса, бот сізді автоматты түрде келесі намазға ауыстырады\n\n✅ Бот сізге не көрсетеді:\n• Қазір қай намазды өтеп жатқаныңызды\n• Бүгін қанша шегерілгенін\n• Сол намаздан қанша қалғанын\n• Жалпы қалған қаза санын\n\n📝 Ниет үлгісі:\n«Ниет еттім қаза болған ең соңғы {prayer} намазын өтемекке»\n\n⚠️ Ескерту:\n• Мәкрүһ уақыттарда қаза намаз оқылмайды\n• Бұл бот діни үкім шығармайды\n• Фиқһ мәселесінде өз ұстазыңыздың кеңесін ұстаныңыз\n\n🤲 Ниетіңізге береке берсін. Аз-аздан болса да тұрақты жалғастыру ең маңыздысы.`
        : `📚 МЕТОД «12 ДНЕЙ = 1 ГОД»\n\nЭтот метод помогает закрывать къаза-намазы последовательно и без перегруза.\n\n🧭 Как это работает:\n1) Вы выбираете один намаз для текущего этапа (например: Фаджр)\n2) После каждого фард-намаза читаете 6 къаза этого же намаза\n3) В день получается: 6×5 = 30 къаза\n4) За 12 дней: 360 къаза (примерно 1 год)\n5) После 12 дней бот автоматически переключает вас на следующий намаз\n\n✅ Что показывает бот:\n• Какой намаз сейчас в фокусе\n• Сколько списалось сегодня\n• Сколько осталось по текущему намазу\n• Общий оставшийся долг\n\n📝 Пример намерения:\n«Намерился возместить последний пропущенный {prayer} намаз»\n\n⚠️ Важно:\n• В макрух-времена къаза-намазы не совершаются\n• Бот не выносит религиозных постановлений\n• В вопросах фикха следуйте своему учёному\n\n🤲 Пусть Аллах даст вам стойкость. Главное - регулярность, даже небольшими шагами.`;
    await ctx.reply(text);
    await this.showMenu(ctx, lang);
  }

  @Command('checkin')
  async checkin(@Ctx() ctx: any) {
    const tid = this.tid(ctx);
    const lang = await this.users.getLanguage(tid);
    let state = await this.users.getMethodState(tid);
    if (!state.selected_years || state.selected_years <= 0) {
      await this.setup(ctx);
      return;
    }
    let debt = await this.users.getDebtState(tid);
    if (debt.remainingTotal > 0 && debt[state.current_prayer] <= 0) {
      const adv = await this.users.advance12DayCycle(tid, { incrementDay: false });
      if (adv.switched) {
        const prayerName = this.prayerName(lang, adv.prayer);
        const nextName = this.prayerName(lang, adv.nextPrayer);
        await ctx.reply(
          t(lang, 'cycle.switched').replace('{prayer}', prayerName).replace('{next}', nextName),
        );
        await ctx.reply(t(lang, 'cycle.niyyah').replace('{prayer}', nextName));
      }
      state = await this.users.getMethodState(tid);
      debt = await this.users.getDebtState(tid);
    }
    const prayerName = this.prayerName(lang, state.current_prayer);

    const text = t(lang, 'cycle.status')
      .replace('{prayer}', prayerName)
      .replace('{day}', String(Math.max(0, state.cycle_day)))
      .replace('{fajr}', String(debt.fajr))
      .replace('{dhuhr}', String(debt.dhuhr))
      .replace('{asr}', String(debt.asr))
      .replace('{maghrib}', String(debt.maghrib))
      .replace('{isha}', String(debt.isha))
      .replace('{total}', String(debt.remainingTotal));

    const kb = Markup.inlineKeyboard([
      [Markup.button.callback(`✅ +30 (${prayerName})`, 'cycle:done')],
      [
        Markup.button.callback('➕1', 'cycle:add:1'),
        Markup.button.callback('➕5', 'cycle:add:5'),
        Markup.button.callback('➕10', 'cycle:add:10'),
      ],
      [
        Markup.button.callback(t(lang, 'cycle.btn.manual'), 'cycle:manual'),
        Markup.button.callback(t(lang, 'cycle.btn.refresh'), 'cycle:refresh'),
      ],
      [Markup.button.callback(t(lang, 'cycle.btn.report'), 'cycle:report')],
    ]);

    await ctx.reply(text, kb);
    await this.showMenu(ctx, lang);
  }

  @Action('cycle:manual')
  async cycleManual(@Ctx() ctx: any) {
    const tid = this.tid(ctx);
    const lang = await this.users.getLanguage(tid);
    ctx.session = ctx.session ?? {};
    ctx.session.setupStep = 'cycle_manual';
    await ctx.answerCbQuery();
    await ctx.reply(t(lang, 'cycle.manual.ask'));
  }

  @Action('cycle:refresh')
  async cycleRefresh(@Ctx() ctx: any) {
    await ctx.answerCbQuery();
    await this.checkin(ctx);
  }

  @Action('cycle:report')
  async cycleReport(@Ctx() ctx: any) {
    await ctx.answerCbQuery();
    await this.reportStub(ctx);
  }

  @Action(/^cycle:add:(\d+)$/)
  async cycleQuickAdd(@Ctx() ctx: any) {
    const tid = this.tid(ctx);
    const lang = await this.users.getLanguage(tid);
    const n = Number.parseInt(String(ctx.match?.[1]), 10);
    if (!Number.isFinite(n) || n <= 0) {
      await ctx.answerCbQuery();
      return;
    }

    const state = await this.users.getMethodState(tid);
    if (!state.selected_years || state.selected_years <= 0) {
      await ctx.answerCbQuery();
      await this.setup(ctx);
      return;
    }

    const d = await this.users.deductFromCurrentPrayer(tid, n);
    await ctx.answerCbQuery();
    if (d.deducted <= 0) {
      const adv = await this.users.advance12DayCycle(tid, { incrementDay: false });
      if (adv.switched) {
        const prayerName = this.prayerName(lang, adv.prayer);
        const nextName = this.prayerName(lang, adv.nextPrayer);
        await ctx.reply(
          t(lang, 'cycle.switched').replace('{prayer}', prayerName).replace('{next}', nextName),
        );
        await ctx.reply(t(lang, 'cycle.niyyah').replace('{prayer}', nextName));
        await this.checkin(ctx);
        return;
      }
      await ctx.reply(
        lang === 'kk'
          ? 'Қаза толық жабылған сияқты ✅ /report арқылы тексеріп көріңіз.'
          : 'Похоже, долг уже полностью закрыт ✅ Проверьте через /report.',
      );
      return;
    }

    await this.checkins.addPrayerToToday(tid, state.current_prayer, d.deducted);
    await ctx.reply(
      t(lang, 'cycle.deducted')
        .replace('{prayer}', this.prayerName(lang, state.current_prayer))
        .replace('{n}', String(d.deducted))
        .replace('{left}', String(d.remainingPrayer)),
    );

    const adv = await this.users.advance12DayCycle(tid, { incrementDay: false });
    if (adv.switched) {
      const prayerName = this.prayerName(lang, adv.prayer);
      const nextName = this.prayerName(lang, adv.nextPrayer);
      await ctx.reply(
        t(lang, 'cycle.switched').replace('{prayer}', prayerName).replace('{next}', nextName),
      );
      await ctx.reply(t(lang, 'cycle.niyyah').replace('{prayer}', nextName));
    }
    await this.checkin(ctx);
  }

  @Action('cycle:done')
  async cycleDone(@Ctx() ctx: any) {
    const tid = this.tid(ctx);
    const lang = await this.users.getLanguage(tid);
    const state = await this.users.getMethodState(tid);
    if (!state.selected_years || state.selected_years <= 0) {
      await ctx.answerCbQuery();
      await this.setup(ctx);
      return;
    }

    const d = await this.users.deductFromCurrentPrayer(tid, 30);
    if (d.deducted <= 0) {
      const adv = await this.users.advance12DayCycle(tid, { incrementDay: false });
      await ctx.answerCbQuery();
      if (adv.switched) {
        const prayerName = this.prayerName(lang, adv.prayer);
        const nextName = this.prayerName(lang, adv.nextPrayer);
        await ctx.reply(
          t(lang, 'cycle.switched').replace('{prayer}', prayerName).replace('{next}', nextName),
        );
        await ctx.reply(t(lang, 'cycle.niyyah').replace('{prayer}', nextName));
        await this.checkin(ctx);
        return;
      }
      await ctx.reply(
        lang === 'kk'
          ? 'Қаза толық жабылған сияқты ✅ /report арқылы тексеріп көріңіз.'
          : 'Похоже, долг уже полностью закрыт ✅ Проверьте через /report.',
      );
      return;
    }
    await this.checkins.addPrayerToToday(tid, state.current_prayer, d.deducted);
    const adv = await this.users.advance12DayCycle(tid, { incrementDay: true });

    await ctx.answerCbQuery();
    await ctx.reply(t(lang, 'cycle.done'));
    await ctx.reply(
      t(lang, 'cycle.deducted')
        .replace('{prayer}', this.prayerName(lang, d.prayer))
        .replace('{n}', String(d.deducted))
        .replace('{left}', String(d.remainingPrayer)),
    );

    if (adv.switched) {
      const prayerName = this.prayerName(lang, adv.prayer);
      const nextName = this.prayerName(lang, adv.nextPrayer);
      await ctx.reply(
        t(lang, 'cycle.switched').replace('{prayer}', prayerName).replace('{next}', nextName),
      );
      await ctx.reply(t(lang, 'cycle.niyyah').replace('{prayer}', nextName));
    }
    await this.checkin(ctx);
  }

  @Command('start')
  async legacyStart(@Ctx() ctx: any) {
    // Keep /start working under Nest
    return this.start(ctx);
  }

  @Action(/^rem:add:(\d+)$/)
  async reminderAdd(@Ctx() ctx: any) {
    const n = Number.parseInt(String(ctx.match?.[1]), 10);
    if (!Number.isFinite(n) || n <= 0) return;
    const tid = this.tid(ctx);
    const lang = await this.users.getLanguage(tid);
    await this.checkins.addByDate(tid, new Date().toISOString().slice(0, 10), n);
    await ctx.answerCbQuery();
    await ctx.reply(t(lang, 'reminder.added').replace('{n}', String(n)));
  }

  @Action('rem:open_checkin')
  async reminderOpenCheckin(@Ctx() ctx: any) {
    await ctx.answerCbQuery();
    await this.checkin(ctx);
  }

  @Command('checkin_old')
  async checkinOld(@Ctx() ctx: any) {
    await ctx.reply('Use /checkin');
  }

  @Command('report')
  async reportStub(@Ctx() ctx: any) {
    const tid = this.tid(ctx);
    const lang = await this.users.getLanguage(tid);
    const state = await this.users.getMethodState(tid);
    const debt = await this.users.getDebtState(tid);
    const yearStart = dayjs().startOf('month').subtract(11, 'month').format('YYYY-MM-DD');
    const yearEnd = dayjs().endOf('month').format('YYYY-MM-DD');
    const yearRows = await this.checkins.getDailyTotalsInRange(tid, yearStart, yearEnd);
    const plannedYears = state.selected_years ?? 0;
    const totalPlannedPrayers = Math.max(0, plannedYears * 1825);
    const completedPrayers = Math.max(0, totalPlannedPrayers - debt.remainingTotal);
    const completedApproxYears = Math.floor(completedPrayers / 1825);
    const completedApproxMonths = Math.floor(((completedPrayers % 1825) / 1825) * 12);
    const progressPct =
      totalPlannedPrayers > 0 ? Math.min(100, Math.floor((completedPrayers / totalPlannedPrayers) * 100)) : 0;
    const completedYmText =
      lang === 'kk'
        ? `${completedApproxYears} жыл ${completedApproxMonths} ай`
        : `${completedApproxYears} лет ${completedApproxMonths} мес`;
    const prayerName = this.prayerName(lang, state.current_prayer);

    const text =
      lang === 'kk'
        ? `📊 Жеке статистика\n\n🎯 Жоспар: ${plannedYears} жыл\n✅ Орындалғаны (шамамен): ${completedYmText}\n📈 Прогресс: ${progressPct}%\n⏳ Қалғаны: ${debt.remainingTotal} намаз\n🔥 Ағымдағы фокус: ${prayerName} (${state.cycle_day}/12)\n\nТаң ${debt.fajr}, Бесін ${debt.dhuhr}, Екінті ${debt.asr}, Ақшам ${debt.maghrib}, Құптан ${debt.isha}`
        : `📊 Личная статистика\n\n🎯 План: ${plannedYears} лет\n✅ Выполнено (примерно): ${completedYmText}\n📈 Прогресс: ${progressPct}%\n⏳ Осталось: ${debt.remainingTotal} намазов\n🔥 Текущий фокус: ${prayerName} (${state.cycle_day}/12)\n\nФаджр ${debt.fajr}, Зухр ${debt.dhuhr}, Аср ${debt.asr}, Магриб ${debt.maghrib}, Иша ${debt.isha}`;
    try {
      const image = await this.renderYearHeatmapPng(lang, yearRows);
      await ctx.replyWithPhoto(
        { source: image, filename: 'qaza-report.png' },
        {
          caption: lang === 'kk' ? '📅 Соңғы 12 ай прогрессі' : '📅 Прогресс за последние 12 месяцев',
        },
      );
    } catch {
      await ctx.reply(
        lang === 'kk'
          ? 'Календарь суретін салу сәтсіз болды, бірақ статистика төменде берілді.'
          : 'Не удалось отрисовать календарь-картинку, но статистика ниже доступна.',
      );
    }
    await ctx.reply(text);
    await this.showMenu(ctx, lang);
  }

  @Command('help')
  async help(@Ctx() ctx: any) {
    const lang = await this.users.getLanguage(this.tid(ctx));
    await ctx.reply(
      lang === 'kk'
        ? 'ℹ️ Көмек\n\nЕң ыңғайлысы — төмендегі кнопкаларды пайдалану.\n\nКомандалар:\n/start — ботты қайта ашу\n/setup — баптауды қайта енгізу\n/method — 12 күндік әдіс түсіндірмесі\n/checkin — бүгінгі орындалғанын белгілеу\n/report — жалпы прогресс\n/reset — бәрін тазалап, қайта бастау'
        : 'ℹ️ Помощь\n\nУдобнее всего пользоваться кнопками внизу.\n\nКоманды:\n/start — открыть главное приветствие\n/setup — заново пройти настройку\n/method — подробное объяснение метода на 12 дней\n/checkin — отметить выполненное за сегодня\n/report — посмотреть общий прогресс\n/reset — очистить прогресс и начать заново',
    );
    await this.showMenu(ctx, lang);
  }

  @Command('reset')
  async reset(@Ctx() ctx: any) {
    const tid = this.tid(ctx);
    const lang = await this.users.getLanguage(tid);
    await this.users.resetProgress(tid);
    await ctx.reply(t(lang, 'reset.done'));
    await this.setup(ctx);
  }

  @Action('noop')
  async noop(@Ctx() ctx: any) {
    await ctx.answerCbQuery();
  }

  @On('text')
  async onText(@Ctx() ctx: any) {
    const tid = this.tid(ctx);
    const lang = await this.users.getLanguage(tid);
    const text = String(ctx.message?.text ?? '').trim();
    ctx.session = ctx.session ?? {};

    if (!ctx.session.setupStep) {
      if (text === t(lang, 'menu.setup')) {
        await this.setup(ctx);
        return;
      }
      if (text === t(lang, 'menu.checkin')) {
        await this.checkin(ctx);
        return;
      }
      if (text === t(lang, 'menu.report')) {
        await this.reportStub(ctx);
        return;
      }
      if (text === t(lang, 'menu.method')) {
        await this.method(ctx);
        return;
      }
      if (text === t(lang, 'menu.reset')) {
        await this.reset(ctx);
        return;
      }
      if (text === t(lang, 'menu.help')) {
        await this.help(ctx);
        return;
      }
    }

    if (ctx.session.setupStep === 'years') {
      const years = Number.parseInt(text, 10);
      if (!Number.isFinite(years) || years < 1 || years > 50) {
        await ctx.reply(t(lang, 'setup.years.invalid'));
        return;
      }
      await this.users.applySetupYears(tid, years);
      await this.users.init12DayMethod(tid);
      await this.users.markSetupCompleted(tid);
      const debt = await this.users.getDebtState(tid);
      delete ctx.session.setupStep;
      await ctx.reply(t(lang, 'setup.saved'));
      await ctx.reply(
        t(lang, 'setup.debt.initial')
          .replace('{fajr}', String(debt.fajr))
          .replace('{dhuhr}', String(debt.dhuhr))
          .replace('{asr}', String(debt.asr))
          .replace('{maghrib}', String(debt.maghrib))
          .replace('{isha}', String(debt.isha))
          .replace('{total}', String(debt.remainingTotal)),
      );
      await ctx.reply(
        t(lang, 'method.short'),
        Markup.inlineKeyboard([[Markup.button.callback(t(lang, 'method.more'), 'open:method')]]),
      );
      await this.checkin(ctx);
      return;
    }

    if (ctx.session.setupStep === 'cycle_manual') {
      const n = Number.parseInt(text, 10);
      if (!Number.isFinite(n) || n < 1 || n > 200) {
        await ctx.reply(t(lang, 'cycle.manual.invalid'));
        return;
      }
      const state = await this.users.getMethodState(tid);
      if (!state.selected_years || state.selected_years <= 0) {
        delete ctx.session.setupStep;
        await this.setup(ctx);
        return;
      }
      const d = await this.users.deductFromCurrentPrayer(tid, n);
      if (d.deducted <= 0) {
        const adv = await this.users.advance12DayCycle(tid, { incrementDay: false });
        delete ctx.session.setupStep;
        if (adv.switched) {
          const prayerName = this.prayerName(lang, adv.prayer);
          const nextName = this.prayerName(lang, adv.nextPrayer);
          await ctx.reply(
            t(lang, 'cycle.switched').replace('{prayer}', prayerName).replace('{next}', nextName),
          );
          await ctx.reply(t(lang, 'cycle.niyyah').replace('{prayer}', nextName));
          await this.checkin(ctx);
          return;
        }
        await ctx.reply(
          lang === 'kk'
            ? 'Қаза толық жабылған сияқты ✅ /report арқылы тексеріп көріңіз.'
            : 'Похоже, долг уже полностью закрыт ✅ Проверьте через /report.',
        );
        return;
      }
      await this.checkins.addPrayerToToday(tid, state.current_prayer, d.deducted);
      const adv = await this.users.advance12DayCycle(tid, { incrementDay: false });
      delete ctx.session.setupStep;
      await ctx.reply(
        t(lang, 'cycle.deducted')
          .replace('{prayer}', this.prayerName(lang, state.current_prayer))
          .replace('{n}', String(d.deducted))
          .replace('{left}', String(d.remainingPrayer)),
      );
      if (adv.switched) {
        const prayerName = this.prayerName(lang, adv.prayer);
        const nextName = this.prayerName(lang, adv.nextPrayer);
        await ctx.reply(
          t(lang, 'cycle.switched').replace('{prayer}', prayerName).replace('{next}', nextName),
        );
        await ctx.reply(t(lang, 'cycle.niyyah').replace('{prayer}', nextName));
      }
      await this.checkin(ctx);
      return;
    }
  }

  @Action('open:method')
  async openMethod(@Ctx() ctx: any) {
    await ctx.answerCbQuery();
    await this.method(ctx);
  }
}

