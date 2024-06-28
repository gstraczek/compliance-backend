import { Pool } from 'pg';

import { env } from './common/utils/envConfig';
const connectionString = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?sslmode=${env.isDev ? 'disable' : 'require'}`;
export const db = new Pool({
  connectionString,
});
