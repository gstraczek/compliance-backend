import { Pool } from 'pg';

import { env } from './common/utils/envConfig';

export const db = new Pool({
  user: env.DB_USER,
  host: env.DB_HOST,
  database: env.DB_NAME,
  password: env.DB_PASSWORD,
  port: env.DB_PORT,
  ssl: env.isDev ? false : true,
});
