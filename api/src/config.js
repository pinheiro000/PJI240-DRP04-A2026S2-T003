import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
loadEnv({ path: path.join(projectRoot, '.env') });

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET precisa ser configurado em produção.');
}

if (process.env.NODE_ENV === 'production' && !process.env.DEMO_PASSWORD) {
  throw new Error('DEMO_PASSWORD precisa ser configurado em produção.');
}

export const config = {
  host: process.env.API_HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
  port: Number(process.env.PORT || process.env.API_PORT || 3001),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'local-development-secret-change-before-deploy',
  demoLogin: process.env.DEMO_LOGIN || 'operador@biblioteca.local',
  demoPassword: process.env.DEMO_PASSWORD || 'biblioteca123',
  nodeEnv: process.env.NODE_ENV || 'development'
};
