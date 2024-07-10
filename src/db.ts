import { Pool } from 'pg';

import { env } from './common/utils/envConfig';

const connectionString = env.DB_URL;
export const db = new Pool({
  connectionString,
});
