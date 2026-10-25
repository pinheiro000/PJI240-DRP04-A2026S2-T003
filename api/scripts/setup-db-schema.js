import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from '../src/config.js';

const { Pool } = pg;
if (!config.databaseUrl) {
  throw new Error('Defina DATABASE_URL no arquivo .env antes de configurar o banco.');
}

const directory = path.dirname(fileURLToPath(import.meta.url));
const pool = new Pool({ connectionString: config.databaseUrl });

try {
  const schema = await readFile(path.join(directory, '..', 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Schema do banco preparado; nenhum dado de demonstração foi inserido.');
} finally {
  await pool.end();
}
