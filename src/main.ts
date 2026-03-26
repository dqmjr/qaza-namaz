import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './nest/app.module.js';
import { config } from './utils/config.js';

if (config.tz) process.env.TZ = config.tz;

// Use a full Nest application (without listening on a port)
// to ensure all lifecycle hooks run as expected for Telegraf integration.
const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
await app.init();

