import "server-only";

export const POSTGRES_IMAGE =
  "postgres:18.6-bookworm@sha256:5c4783a8cc3f0074912164f94dfa1be4e043438f0f707cf968d7af9a0d31a2c8";
export const SYNTHETIC_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";

export type DatabaseRole = "bootstrap" | "migrator" | "runtime";
export type DatabaseMode = "local" | "test";
export type DatabaseEnvironment = Record<string, string | undefined>;

export interface DatabaseConfig {
  readonly mode: DatabaseMode;
  readonly instance: string;
  readonly container: string;
  readonly host: "127.0.0.1";
  readonly port: number;
  readonly database: string;
  readonly role: DatabaseRole;
  readonly user: string;
  readonly password: string;
  readonly organizationId: string;
}

export class DatabaseError extends Error {
  constructor(
    readonly code: string,
    readonly blocked = false,
  ) {
    super(code);
    this.name = "DatabaseError";
  }
}

export function errorCode(error: unknown): string {
  if (error instanceof DatabaseError) return error.code;
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    /^[0-9A-Z]{5}$/.test(error.code)
  ) {
    return error.code;
  }
  return "DB_OPERATION_FAILED";
}

export function databaseName(mode: DatabaseMode, instance: string): string {
  if (!/^[a-f0-9]{32}$/.test(instance)) {
    throw new DatabaseError("DB_INSTANCE_INVALID");
  }
  return `pgjb_${mode}_${instance}`;
}

export function syntheticPassword(role: DatabaseRole): string {
  return `pgjb_synthetic_${role}`;
}

export function readDatabaseConfig(
  env: Readonly<DatabaseEnvironment> = process.env,
  role: DatabaseRole = "runtime",
): DatabaseConfig {
  const mode = env.PGJB_DB_MODE;
  if (mode !== "local" && mode !== "test") {
    throw new DatabaseError("DB_LOCAL_OR_TEST_ONLY");
  }
  const instance = env.PGJB_DB_INSTANCE ?? "";
  const primaryDatabase = databaseName(mode, instance);
  const container = env.PGJB_DB_CONTAINER ?? "";
  if (!/^[a-f0-9]{64}$/.test(container)) {
    throw new DatabaseError("DB_CONTAINER_ID_REQUIRED");
  }
  const variable = {
    bootstrap: "BOOTSTRAP_DATABASE_URL",
    migrator: "MIGRATION_DATABASE_URL",
    runtime: "DATABASE_URL",
  }[role];
  const value = env[variable];
  if (!value || value !== value.trim()) {
    throw new DatabaseError("DB_URL_REQUIRED");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new DatabaseError("DB_URL_INVALID");
  }
  const database = url.pathname.slice(1);
  const port = Number(url.port);
  if (
    url.protocol !== "postgresql:" ||
    url.hostname !== "127.0.0.1" ||
    !Number.isInteger(port) ||
    port < 1024 ||
    port > 65535 ||
    url.search !== "" ||
    url.hash !== "" ||
    url.username !== `pgjb_${role}` ||
    url.password !== syntheticPassword(role) ||
    (database !== primaryDatabase &&
      !(mode === "test" && database === `${primaryDatabase}_restore`))
  ) {
    throw new DatabaseError("DB_SYNTHETIC_TARGET_REQUIRED");
  }
  const organizationId = env.PGJB_ORGANIZATION_ID ?? "";
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      organizationId,
    )
  ) {
    throw new DatabaseError("DB_ORGANIZATION_ID_INVALID");
  }
  return Object.freeze({
    mode,
    instance,
    container,
    host: "127.0.0.1",
    port,
    database,
    role,
    user: `pgjb_${role}`,
    password: syntheticPassword(role),
    organizationId,
  });
}

export function databaseMarker(config: DatabaseConfig): string {
  return `propertygojb-d1:synthetic:${config.database}:${config.instance}`;
}

export function syntheticEnvironment(
  mode: DatabaseMode,
  instance: string,
  container: string,
  port: number,
): DatabaseEnvironment {
  const name = databaseName(mode, instance);
  const connection = (role: DatabaseRole) =>
    `postgresql://pgjb_${role}:${syntheticPassword(role)}@127.0.0.1:${port}/${name}`;
  return {
    PGJB_DB_MODE: mode,
    PGJB_DB_INSTANCE: instance,
    PGJB_DB_CONTAINER: container,
    PGJB_ORGANIZATION_ID: SYNTHETIC_ORGANIZATION_ID,
    BOOTSTRAP_DATABASE_URL: connection("bootstrap"),
    MIGRATION_DATABASE_URL: connection("migrator"),
    DATABASE_URL: connection("runtime"),
  };
}
