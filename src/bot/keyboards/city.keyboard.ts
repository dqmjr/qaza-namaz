import { Markup } from 'telegraf';
import type { Language } from '../../i18n/index.js';
import { KZ_CITIES } from '../../data/kz-cities.js';

export function cityPickKeyboard(lang: Language, page = 0, pageSize = 10) {
  const totalPages = Math.max(1, Math.ceil(KZ_CITIES.length / pageSize));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const slice = KZ_CITIES.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const rows = slice.map((c) => [
    Markup.button.callback(lang === 'kk' ? c.name_kk : c.name_ru, `setup:city:${c.id}`),
  ]);

  rows.push([
    Markup.button.callback('⬅️', `setup:city_page:${Math.max(0, safePage - 1)}`),
    Markup.button.callback(`${safePage + 1}/${totalPages}`, 'noop'),
    Markup.button.callback('➡️', `setup:city_page:${Math.min(totalPages - 1, safePage + 1)}`),
  ]);

  rows.push([Markup.button.callback(lang === 'kk' ? '🔎 Іздеу' : '🔎 Поиск', 'setup:city_search')]);

  return Markup.inlineKeyboard(rows);
}

export function cityConfirmKeyboard(lang: Language) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(lang === 'kk' ? '✅ Иә' : '✅ Да', 'setup:city_confirm:yes'),
      Markup.button.callback(lang === 'kk' ? '✏️ Жоқ' : '✏️ Нет', 'setup:city_confirm:no'),
    ],
  ]);
}

export function citySearchResultsKeyboard(lang: Language, query: string) {
  const q = query.trim().toLowerCase();
  const matches = KZ_CITIES.filter((c) => {
    const ru = c.name_ru.toLowerCase();
    const kk = c.name_kk.toLowerCase();
    return ru.includes(q) || kk.includes(q) || c.id.includes(q);
  }).slice(0, 10);

  const rows = matches.map((c) => [
    Markup.button.callback(lang === 'kk' ? c.name_kk : c.name_ru, `setup:city:${c.id}`),
  ]);

  rows.push([Markup.button.callback(lang === 'kk' ? '📋 Тізім' : '📋 Список', 'setup:city_list')]);
  return Markup.inlineKeyboard(rows);
}

