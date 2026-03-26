import 'dotenv/config';

export type AppConfig = {
  botToken: string;
  databaseUrl: string;
  defaultLanguage: 'kk' | 'ru';
  enableCustomStrategy: boolean;
  tz?: string;
};

function mustGet(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const config: AppConfig = {
  botToken: mustGet('BOT_TOKEN'),
  databaseUrl: mustGet('DATABASE_URL'),
  defaultLanguage: (process.env.DEFAULT_LANGUAGE === 'kk' ? 'kk' : 'ru'),
  enableCustomStrategy: process.env.ENABLE_CUSTOM_STRATEGY === '1',
  tz: process.env.TZ,
};

