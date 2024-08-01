import { Pool } from 'pg';

import { env } from './common/utils/envConfig';

const replicaConnection = env.DB_REPLICA_CONNECTION_STRING;
const localConnection = env.DB_LOCAL_CONNECTION_STRING;

export const dbReplica = new Pool({
  connectionString: replicaConnection,
});

export const dbLocal = new Pool({
  connectionString: localConnection,
});
