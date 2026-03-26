import kk from './kk.json' with { type: 'json' };
import ru from './ru.json' with { type: 'json' };

export type Language = 'kk' | 'ru';
export type I18nKey = keyof typeof ru;

const dictionaries: Record<Language, Record<string, string>> = { kk, ru };

export function t(lang: Language, key: string): string {
  return dictionaries[lang]?.[key] ?? dictionaries.ru[key] ?? key;
}

