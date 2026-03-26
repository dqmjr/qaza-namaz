import pg from 'pg';
import { config } from '../utils/config.js';

export type DbClient = pg.Pool;

let poolSingleton: DbClient | null = null;

export function getDb(): DbClient {
  if (poolSingleton) return poolSingleton;
  poolSingleton = new pg.Pool({
    connectionString: config.databaseUrl,
  });
  return poolSingleton;
}

export async function closeDb(): Promise<void> {
  if (!poolSingleton) return;
  await poolSingleton.end();
  poolSingleton = null;
}

