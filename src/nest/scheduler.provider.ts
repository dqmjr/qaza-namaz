import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import type { Telegraf } from 'telegraf';
import { startScheduler } from '../services/scheduler.service.js';

@Injectable()
export class SchedulerProvider implements OnModuleInit {
  constructor(@InjectBot() private readonly bot: Telegraf) {}

  async onModuleInit() {
    // eslint-disable-next-line no-console
    console.log('Telegraf getMe...', await this.bot.telegram.getMe());
    startScheduler(this.bot);
  }
}

