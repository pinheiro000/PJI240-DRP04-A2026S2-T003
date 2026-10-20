import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;
pg.types.setTypeParser(1082, (value) => value);

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL não foi definido. Configure o arquivo .env.');
}

export const pool = new Pool({ connectionString: config.databaseUrl });
