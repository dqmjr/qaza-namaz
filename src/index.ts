import { createBot } from './bot/index.js';
import { config } from './utils/config.js';

if (config.tz) {
  process.env.TZ = config.tz;
}

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught exception:', err);
});

// eslint-disable-next-line no-console
console.log('Starting bot...');
const bot = await createBot();
// eslint-disable-next-line no-console
console.log('Launching bot...');

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

const me = await withTimeout(
  bot.telegram.getMe(),
  10_000,
  'Telegram API timeout: cannot reach api.telegram.org',
);
// eslint-disable-next-line no-console
console.log(`Authenticated as @${me.username ?? 'unknown'}`);

bot
  .launch({ dropPendingUpdates: true })
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Bot started');
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to launch bot:', err);
    process.exitCode = 1;
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

