import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import {
  DatabaseError,
  databaseMarker,
  errorCode,
  readDatabaseConfig,
  type DatabaseConfig,
} from "./config";
import * as schema from "./schema";

export async function assertDatabaseIdentity(
  client: PoolClient,
  config: DatabaseConfig,
): Promise<void> {
  const result = await client.query<{
    database: string;
    role: string;
    marker: string | null;
  }>(
    `SELECT current_database() AS database, current_user AS role,
       shobj_description(oid, 'pg_database') AS marker
     FROM pg_database WHERE datname = current_database()`,
  );
  const identity = result.rows[0];
  if (
    identity?.database !== config.database ||
    identity.role !== config.user ||
    identity.marker !== databaseMarker(config)
  ) {
    throw new DatabaseError("DB_IDENTITY_MISMATCH");
  }
}

export function createDatabase(config: DatabaseConfig) {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: false,
    max: 5,
    connectionTimeoutMillis: 3_000,
    idleTimeoutMillis: 10_000,
    statement_timeout: 10_000,
    query_timeout: 12_000,
    application_name: `propertygojb-d1-${config.role}`,
  });
  pool.on("error", (error: Error) => {
    console.error(`[database:idle-client] ${errorCode(error)}`);
  });
  return { pool, db: drizzle(pool, { schema }), close: () => pool.end() };
}

let runtime:
  | { config: DatabaseConfig; connection: ReturnType<typeof createDatabase> }
  | undefined;

export async function getDatabase() {
  const config = readDatabaseConfig();
  if (
    runtime &&
    (runtime.config.database !== config.database ||
      runtime.config.port !== config.port ||
      runtime.config.container !== config.container)
  ) {
    throw new DatabaseError("DB_RUNTIME_CONFIGURATION_CHANGED");
  }
  runtime ??= { config, connection: createDatabase(config) };
  const connection = runtime.connection;
  try {
    const client = await connection.pool.connect();
    try {
      await assertDatabaseIdentity(client, config);
    } finally {
      client.release();
    }
    return connection.db;
  } catch (error) {
    console.error(`[database:connect] ${errorCode(error)}`);
    throw new DatabaseError("DB_UNAVAILABLE_OR_UNTRUSTED");
  }
}

export async function closeDatabase(): Promise<void> {
  const current = runtime;
  runtime = undefined;
  if (current) await current.connection.close();
}
