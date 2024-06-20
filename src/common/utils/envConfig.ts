import dotenv from 'dotenv';
import { cleanEnv, host, num, port, str, testOnly } from 'envalid';

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ devDefault: testOnly('test'), choices: ['development', 'production', 'test'] }),
  HOST: host({ devDefault: testOnly('localhost') }),
  PORT: port({ devDefault: testOnly(3000) }),
  CORS_ORIGIN: str({ devDefault: testOnly('http://localhost:3000') }),
  COMMON_RATE_LIMIT_MAX_REQUESTS: num({ devDefault: testOnly(1000) }),
  COMMON_RATE_LIMIT_WINDOW_MS: num({ devDefault: testOnly(1000) }),
  DATACAPSTATS_API_KEY: str({ devDefault: testOnly('test') }),
  REQUEST_TIMEOUT_LIMIT: num({ default: 5000 }),
  GITHUB_TOKEN: str({ devDefault: testOnly('test') }),
  DATACAP_API_URL: str({ devDefault: testOnly('http://api.datacapstats.io/public/api') }),
  VERIFIER_CLIENTS_QUERY_LIMIT: num({ devDefault: testOnly(20) }),
  UPLOADS_DIR: str({ devDefault: testOnly('uploads') }),
  DB_USER: str({ devDefault: testOnly('test') }),
  DB_HOST: str({ devDefault: testOnly('localhost') }),
  DB_PASSWORD: str({ devDefault: testOnly('test') }),
  DB_PORT: num({ devDefault: testOnly(5432) }),
  DB_NAME: str({ devDefault: testOnly('test') }),
  IP_INFO_TOKEN: str({ devDefault: testOnly('test') }),
  RETRIEVABILITY_RANGE_DAYS: num({ devDefault: testOnly(10), default: 30 }),
});
