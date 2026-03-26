import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { config } from '../utils/config.js';
import { migrate } from '../db/schema.js';
import { BotUpdate } from './bot.update.js';
import { SchedulerProvider } from './scheduler.provider.js';
import { UserService } from '../services/user.service.js';
import { CheckinService } from '../services/checkin.service.js';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      useFactory: async () => {
        await migrate();
        return {
          token: config.botToken,
          include: [AppModule],
          launchOptions: { dropPendingUpdates: true },
          middlewares: [session()],
        };
      },
    }),
  ],
  providers: [UserService, CheckinService, BotUpdate, SchedulerProvider],
})
export class AppModule {}

