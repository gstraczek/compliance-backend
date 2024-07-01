import { env } from './envConfig';

export const axiosConfig = (apiKey: string, params: any) => ({
  headers: {
    'X-API-KEY': apiKey,
  },
  params,
  timeout: env.REQUEST_TIMEOUT_LIMIT,
});
