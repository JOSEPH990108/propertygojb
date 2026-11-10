import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { and, eq, sql } from "drizzle-orm";
import { pgSchema, text, uuid } from "drizzle-orm/pg-core";
import { createDatabase } from "../../src/db/client";
import { DatabaseError, readDatabaseConfig } from "../../src/db/config";
import { session } from "../../src/modules/identity/schema";
import {
  authorizeStaffOperation,
  IdentityAuthorizationError,
  resourceScopePredicate,
  sessionExpiryPredicate,
  type AuthorizedOperationInput,
  withIdentityStateMutation,
} from "../../src/modules/identity/authorization";
import type { StaffPermission } from "../../src/modules/identity/permissions";

const runtimeConfig = readDatabaseConfig();
const adminConfig = readDatabaseConfig(process.env, "bootstrap");
if (runtimeConfig.mode !== "test") throw new DatabaseError("DB_TEST_ONLY");
const runtime = createDatabase(runtimeConfig);
const admin = createDatabase(adminConfig);
const synthetic = pgSchema("synthetic");
const resource = synthetic.table("resource", {
  id: text("id").primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  assignedUserId: text("assigned_user_id").notNull(),
  label: text("label").notNull(),
});

interface Fixture {
  userId: string;
  sessionId: string;
  token: string;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function createFixture(
  options: {
    role?: "admin" | "agent";
    userStatus?: "active" | "disabled";
    membershipStatus?: "active" | "disabled" | "revoked";
  } = {},
): Promise<Fixture> {
  const userId = `synthetic-authz-user-${randomUUID()}`;
  const sessionId = `synthetic-authz-session-${randomUUID()}`;
  const token = `synthetic-authz-token-${randomUUID()}`;
  await admin.pool.query(
    `INSERT INTO identity."user" (id, name, email, status)
     VALUES ($1, 'Synthetic Staff', $2, $3)`,
    [userId, `${userId}@identity.invalid`, options.userStatus ?? "active"],
  );
  await admin.pool.query(
    `INSERT INTO identity.staff_membership
       (user_id, organization_id, role, status, deactivated_at, revoked_at)
     VALUES ($1, $2, $3, $4,
       CASE WHEN $4 = 'disabled' THEN clock_timestamp() END,
       CASE WHEN $4 = 'revoked' THEN clock_timestamp() END)`,
    [
      userId,
      runtimeConfig.organizationId,
      options.role ?? "agent",
      options.membershipStatus ?? "active",
    ],
  );
  await admin.pool.query(
    `INSERT INTO identity.session
       (id, token, user_id, expires_at, last_activity_at)
     VALUES ($1, $2, $3, clock_timestamp() + interval '8 hours',
       clock_timestamp())`,
    [sessionId, token, userId],
  );
  return { userId, sessionId, token };
}

function authorization<T>(
  fixture: Fixture,
  permission: StaffPermission,
  operation: NonNullable<AuthorizedOperationInput<T>["operation"]>,
  options: {
    activity?: "foreground" | "passive";
    db?: typeof runtime.db;
  } = {},
) {
  return authorizeStaffOperation({
    db: options.db ?? runtime.db,
    resolveSession: async () => ({
      id: fixture.sessionId,
      userId: fixture.userId,
    }),
    permission,
    activity: options.activity,
    operation,
  });
}

async function expectDenied(
  promise: Promise<unknown>,
  code: IdentityAuthorizationError["code"],
): Promise<void> {
  await assert.rejects(
    promise,
    (error: unknown) =>
      error instanceof IdentityAuthorizationError && error.code === code,
  );
}

async function readActivity(sessionId: string): Promise<Date | null> {
  const result = await admin.pool.query<{ last_activity_at: Date | null }>(
    `SELECT last_activity_at FROM identity.session WHERE id = $1`,
    [sessionId],
  );
  return result.rows[0]?.last_activity_at ?? null;
}

async function epochMicros(timestamp: string): Promise<string> {
  const result = await runtime.db.execute(sql`
    SELECT trunc(extract(epoch FROM ${timestamp}::timestamptz) * 1000000)::text
      AS value
  `);
  const value = result.rows[0]?.value;
  if (typeof value !== "string") throw new Error("EPOCH_MICROS_MISSING");
  return value;
}

async function timestampSnapshot(
  createdAt: string,
  expiresAt: string,
  lastActivityAt: string,
) {
  const [
    createdAtEpochMicros,
    expiresAtEpochMicros,
    lastActivityAtEpochMicros,
  ] = await Promise.all([
    epochMicros(createdAt),
    epochMicros(expiresAt),
    epochMicros(lastActivityAt),
  ]);
  return {
    createdAtEpochMicros,
    expiresAtEpochMicros,
    lastActivityAtEpochMicros,
  };
}

async function waitForExpiry(deadline: Date): Promise<void> {
  await admin.pool.query(
    `SELECT pg_sleep(
       GREATEST(0, EXTRACT(EPOCH FROM $1::timestamptz - clock_timestamp()) + 0.01)
     )`,
    [deadline],
  );
  const result = await admin.pool.query<{ expired: boolean }>(
    `SELECT clock_timestamp() >= $1::timestamptz AS expired`,
    [deadline],
  );
  assert.equal(result.rows[0]?.expired, true);
}

async function captureAuthorizationLogs<T>(
  operation: Promise<T>,
): Promise<string[]> {
  const originalError = console.error;
  const messages: string[] = [];
  console.error = (...args: Parameters<typeof console.error>) => {
    messages.push(args.map(String).join(" "));
  };
  try {
    await operation;
  } finally {
    console.error = originalError;
  }
  return messages;
}

function assertLoggedSqlState(messages: string[], code: string): void {
  assert.ok(
    messages.some((message) => message.includes(code)),
    `Expected PostgreSQL SQLSTATE ${code} in authorization logs; got ${messages.join(" | ")}`,
  );
}

before(async () => {
  await admin.pool.query(
    `INSERT INTO app.organizations (id, slug, display_name)
     VALUES ($1, 'synthetic-second-org', 'Synthetic Second Organization')
     ON CONFLICT (id) DO NOTHING`,
    ["00000000-0000-4000-8000-000000000002"],
  );
});

after(async () => {
  await Promise.all([runtime.close(), admin.close()]);
});

test("absolute and idle expiry deny exactly at their database-time boundaries", async () => {
  const absolute = await createFixture();
  await admin.pool.query(
    `UPDATE identity.session
     SET created_at = clock_timestamp() - interval '8 hours',
         expires_at = clock_timestamp() + interval '1 hour'
     WHERE id = $1`,
    [absolute.sessionId],
  );
  await expectDenied(
    authorization(absolute, "assigned.resource.read", async () => "ran"),
    "IDENTITY_UNAUTHENTICATED",
  );

  const expiresAt = await createFixture();
  await admin.pool.query(
    `UPDATE identity.session SET expires_at = clock_timestamp() WHERE id = $1`,
    [expiresAt.sessionId],
  );
  await expectDenied(
    authorization(expiresAt, "assigned.resource.read", async () => "ran"),
    "IDENTITY_UNAUTHENTICATED",
  );

  const idle = await createFixture();
  await admin.pool.query(
    `UPDATE identity.session
     SET last_activity_at = clock_timestamp() - interval '30 minutes'
     WHERE id = $1`,
    [idle.sessionId],
  );
  await expectDenied(
    authorization(idle, "assigned.resource.read", async () => "ran"),
    "IDENTITY_UNAUTHENTICATED",
  );

  const recent = await createFixture();
  await admin.pool.query(
    `UPDATE identity.session
     SET last_activity_at = clock_timestamp() - interval '29 minutes 59 seconds'
     WHERE id = $1`,
    [recent.sessionId],
  );
  assert.equal(
    await authorization(recent, "assigned.resource.read", async () => "ran"),
    "ran",
  );
});

test("epoch-microsecond expiry comparisons preserve exact deadline boundaries", async () => {
  const absoluteSnapshot = await timestampSnapshot(
    "2026-01-01 00:00:00.123456+00",
    "2026-01-01 09:00:00.654321+00",
    "2026-01-01 07:59:00.123456+00",
  );
  const absoluteChecks = [
    ["2026-01-01 07:59:59.999999+00", true],
    ["2026-01-01 08:00:00.123455+00", true],
    ["2026-01-01 08:00:00.123456+00", false],
    ["2026-01-01 08:00:00.123457+00", false],
  ] as const;
  for (const [at, expected] of absoluteChecks) {
    const result = await runtime.db.execute(sql`
      SELECT ${sessionExpiryPredicate(
        absoluteSnapshot,
        sql`${await epochMicros(at)}::numeric`,
      )}
        AS valid
    `);
    assert.equal(result.rows[0]?.valid, expected, `absolute deadline at ${at}`);
  }

  const storedExpirySnapshot = await timestampSnapshot(
    "2026-01-01 00:00:00.123456+00",
    "2026-01-01 08:00:00.123456+00",
    "2026-01-01 07:30:00.123456+00",
  );
  for (const [at, expected] of [
    ["2026-01-01 08:00:00.123455+00", true],
    ["2026-01-01 08:00:00.123456+00", false],
    ["2026-01-01 08:00:00.123457+00", false],
  ] as const) {
    const result = await runtime.db.execute(sql`
      SELECT ${sessionExpiryPredicate(
        storedExpirySnapshot,
        sql`${await epochMicros(at)}::numeric`,
      )}
        AS valid
    `);
    assert.equal(result.rows[0]?.valid, expected, `stored expiry at ${at}`);
  }

  const idleSnapshot = await timestampSnapshot(
    "2026-01-01 00:00:00.123456+00",
    "2026-01-01 09:00:00.654321+00",
    "2026-01-01 07:30:00.123456+00",
  );
  const idleChecks = [
    ["2026-01-01 07:59:59.999999+00", true],
    ["2026-01-01 08:00:00.123455+00", true],
    ["2026-01-01 08:00:00.123456+00", false],
    ["2026-01-01 08:00:00.123457+00", false],
  ] as const;
  for (const [at, expected] of idleChecks) {
    const result = await runtime.db.execute(sql`
      SELECT ${sessionExpiryPredicate(
        idleSnapshot,
        sql`${await epochMicros(at)}::numeric`,
      )}
        AS valid
    `);
    assert.equal(result.rows[0]?.valid, expected, `idle deadline at ${at}`);
  }
});

test("foreground refresh does not replace the original idle timestamp snapshot", async () => {
  const snapshot = await timestampSnapshot(
    "2026-01-01 00:00:00.123456+00",
    "2026-01-01 09:00:00.654321+00",
    "2026-01-01 07:29:59.999999+00",
  );
  const result = await runtime.db.execute(sql`
    WITH refreshed_activity AS (
      SELECT ${await epochMicros("2026-01-01 07:59:59.999999+00")}::numeric
        AS last_activity_at
    )
    SELECT
      refreshed_activity.last_activity_at
        > ${await epochMicros("2026-01-01 08:00:00.000000+00")}::numeric
          - (30 * 60 * 1000000)
        AS refreshed_valid,
      ${sessionExpiryPredicate(
        snapshot,
        sql`${await epochMicros("2026-01-01 08:00:00.000000+00")}::numeric`,
      )} AS original_snapshot_valid
    FROM refreshed_activity
  `);
  assert.equal(result.rows[0]?.refreshed_valid, true);
  assert.equal(result.rows[0]?.original_snapshot_valid, false);
});

test("expiry predicate and final check are independent of DateStyle and TimeZone", async () => {
  const snapshot = await timestampSnapshot(
    "2026-01-01 00:00:00.123456+00",
    "2026-01-01 09:00:00.654321+00",
    "2026-01-01 07:59:00.123456+00",
  );
  const nowEpochMicros = await epochMicros("2026-01-01 08:00:00.123455+00");
  const settings = [
    { dateStyle: "ISO, MDY", timeZone: "UTC" },
    { dateStyle: "SQL, DMY", timeZone: "Pacific/Kiritimati" },
    { dateStyle: "Postgres, MDY", timeZone: "America/Los_Angeles" },
    { dateStyle: "German, DMY", timeZone: "Asia/Kathmandu" },
  ] as const;

  for (const setting of settings) {
    const valid = await runtime.db.transaction(async (tx) => {
      await tx.execute(sql`
        SELECT set_config('DateStyle', ${setting.dateStyle}, true)
      `);
      await tx.execute(sql`
        SELECT set_config('TimeZone', ${setting.timeZone}, true)
      `);
      const result = await tx.execute(sql`
        SELECT ${sessionExpiryPredicate(
          snapshot,
          sql`${nowEpochMicros}::numeric`,
        )} AS valid
      `);
      return result.rows[0]?.valid;
    });
    assert.equal(valid, true, `${setting.dateStyle}, ${setting.timeZone}`);
  }

  const fixture = await createFixture();
  const result = await authorization(
    fixture,
    "assigned.resource.read",
    async (tx) => {
      await tx.execute(sql`
        SELECT set_config('DateStyle', 'SQL, DMY', true)
      `);
      await tx.execute(sql`
        SELECT set_config('TimeZone', 'Pacific/Kiritimati', true)
      `);
      return "still valid";
    },
  );
  assert.equal(result, "still valid");
});

test("absolute and idle expiry crossed during protected work rolls back writes", async () => {
  for (const expiry of ["absolute", "idle"] as const) {
    const fixture = await createFixture();
    const inserted = deferred<void>();
    const release = deferred<void>();
    await admin.pool.query(
      expiry === "absolute"
        ? `UPDATE identity.session
           SET created_at = clock_timestamp() - interval '7 hours 59 minutes 58 seconds',
               expires_at = clock_timestamp() + interval '1 hour'
           WHERE id = $1`
        : `UPDATE identity.session
           SET last_activity_at = clock_timestamp() - interval '29 minutes 58 seconds'
           WHERE id = $1`,
      [fixture.sessionId],
    );
    const originalActivity = await readActivity(fixture.sessionId);
    assert.ok(originalActivity);
    const deadlineResult = await admin.pool.query<{ deadline: Date }>(
      expiry === "absolute"
        ? `SELECT created_at + interval '8 hours' AS deadline
           FROM identity.session WHERE id = $1`
        : `SELECT last_activity_at + interval '30 minutes' AS deadline
           FROM identity.session WHERE id = $1`,
      [fixture.sessionId],
    );
    const deadline = deadlineResult.rows[0]?.deadline;
    assert.ok(deadline);

    const operation = authorization(
      fixture,
      "assigned.resource.read",
      async (tx) => {
        await tx
          .update(session)
          .set({ lastActivityAt: sql`clock_timestamp()` })
          .where(eq(session.id, fixture.sessionId));
        inserted.resolve();
        await release.promise;
        return "must roll back";
      },
    );
    try {
      await inserted.promise;
      await waitForExpiry(deadline);
    } finally {
      release.resolve();
    }
    await expectDenied(operation, "IDENTITY_UNAUTHENTICATED");

    assert.equal(
      (await readActivity(fixture.sessionId))?.toISOString(),
      originalActivity.toISOString(),
    );
  }
});

test("transaction uses the verified local PostgreSQL timeout settings", async () => {
  const fixture = await createFixture();
  const settings = await authorization(
    fixture,
    "assigned.resource.read",
    async (tx) => {
      const current = await tx.execute(sql`
        SELECT
          current_setting('transaction_timeout') AS transaction_timeout,
          current_setting('statement_timeout') AS statement_timeout,
          current_setting('lock_timeout') AS lock_timeout,
          current_setting('idle_in_transaction_session_timeout')
            AS idle_transaction_timeout
      `);
      return current.rows[0];
    },
  );
  assert.deepEqual(settings, {
    transaction_timeout: "10s",
    statement_timeout: "4s",
    lock_timeout: "2s",
    idle_transaction_timeout: "5s",
  });
});

test("lock wait crossing expiry is denied after the session row lock releases", async () => {
  const fixture = await createFixture();
  const blocker = await admin.pool.connect();
  let blockerPid: number | undefined;
  let operation: Promise<void> | undefined;
  try {
    const pid = await blocker.query<{ pid: number }>(
      `SELECT pg_backend_pid() AS pid`,
    );
    blockerPid = pid.rows[0]!.pid;
    await blocker.query("BEGIN");
    await blocker.query(
      `SELECT id FROM identity.session WHERE id = $1 FOR KEY SHARE`,
      [fixture.sessionId],
    );
    operation = expectDenied(
      authorization(
        fixture,
        "assigned.resource.read",
        async () => "must not run",
      ),
      "IDENTITY_UNAUTHENTICATED",
    );

    let blocked = false;
    for (let attempt = 0; attempt < 2_000 && !blocked; attempt++) {
      const result = await admin.pool.query<{ blocked: boolean }>(
        `SELECT $1 = ANY(pg_blocking_pids(pid)) AS blocked
         FROM pg_stat_activity
         WHERE pid <> pg_backend_pid() AND wait_event_type = 'Lock'`,
        [blockerPid],
      );
      blocked = result.rows.some((row) => row.blocked);
      if (!blocked) await new Promise<void>((resolve) => setImmediate(resolve));
    }
    assert.equal(blocked, true);
    const deadlineResult = await blocker.query<{ deadline: Date }>(
      `UPDATE identity.session
       SET created_at = clock_timestamp() - interval '7 hours 59 minutes 59 seconds',
           expires_at = clock_timestamp() + interval '1 hour'
       WHERE id = $1
       RETURNING created_at + interval '8 hours' AS deadline`,
      [fixture.sessionId],
    );
    const deadline = deadlineResult.rows[0]?.deadline;
    assert.ok(deadline);
    await waitForExpiry(deadline);
    await blocker.query("COMMIT");
    await operation;
  } finally {
    if (operation && blockerPid !== undefined) {
      await blocker.query("ROLLBACK").catch(() => undefined);
    }
    blocker.release();
  }
});

test("only successful foreground activity refreshes idle state", async () => {
  const fixture = await createFixture();
  await admin.pool.query(
    `UPDATE identity.session
     SET last_activity_at = clock_timestamp() - interval '10 seconds'
     WHERE id = $1`,
    [fixture.sessionId],
  );
  const before = await readActivity(fixture.sessionId);
  assert.ok(before);

  await authorization(
    fixture,
    "assigned.resource.read",
    async () => "foreground",
    { activity: "foreground" },
  );
  const afterForeground = await readActivity(fixture.sessionId);
  assert.ok(afterForeground && afterForeground > before);

  const beforePassive = afterForeground;
  await authorization(fixture, "assigned.resource.read", async () => "passive");
  assert.equal(
    (await readActivity(fixture.sessionId))?.toISOString(),
    beforePassive?.toISOString(),
  );

  await assert.rejects(
    authorization(
      fixture,
      "assigned.resource.read",
      async () => {
        throw new Error("SYNTHETIC_OPERATION_FAILURE");
      },
      { activity: "foreground" },
    ),
    (error: unknown) =>
      error instanceof IdentityAuthorizationError &&
      error.code === "IDENTITY_AUTHORIZATION_UNAVAILABLE",
  );
  assert.equal(
    (await readActivity(fixture.sessionId))?.toISOString(),
    beforePassive?.toISOString(),
  );
});

test("missing, invalid, revoked and deleted session state denies access", async () => {
  const missing = await createFixture();
  await admin.pool.query(
    `UPDATE identity.session SET last_activity_at = NULL WHERE id = $1`,
    [missing.sessionId],
  );
  await expectDenied(
    authorization(missing, "assigned.resource.read", async () => "ran"),
    "IDENTITY_UNAUTHENTICATED",
  );

  const future = await createFixture();
  await admin.pool.query(
    `UPDATE identity.session
     SET last_activity_at = clock_timestamp() + interval '1 hour'
     WHERE id = $1`,
    [future.sessionId],
  );
  await expectDenied(
    authorization(future, "assigned.resource.read", async () => "ran"),
    "IDENTITY_UNAUTHENTICATED",
  );

  const revoked = await createFixture();
  await admin.pool.query(
    `UPDATE identity.session SET revoked_at = clock_timestamp(), revoked_by = $2
     WHERE id = $1`,
    [revoked.sessionId, revoked.userId],
  );
  await expectDenied(
    authorization(revoked, "assigned.resource.read", async () => "ran"),
    "IDENTITY_UNAUTHENTICATED",
  );

  const deleted = await createFixture();
  await admin.pool.query(`DELETE FROM identity.session WHERE id = $1`, [
    deleted.sessionId,
  ]);
  await expectDenied(
    authorization(deleted, "assigned.resource.read", async () => "ran"),
    "IDENTITY_UNAUTHENTICATED",
  );
});

test("disabled users and memberships deny previously issued sessions", async () => {
  const disabledUser = await createFixture();
  await withIdentityStateMutation({
    db: admin.db,
    userId: disabledUser.userId,
    mutation: (tx) =>
      tx.execute(
        sql`UPDATE identity."user" SET status = 'disabled' WHERE id = ${disabledUser.userId}`,
      ),
  });
  await expectDenied(
    authorization(disabledUser, "assigned.resource.read", async () => "ran"),
    "IDENTITY_FORBIDDEN",
  );

  const disabledMembership = await createFixture();
  await withIdentityStateMutation({
    db: admin.db,
    userId: disabledMembership.userId,
    mutation: (tx) =>
      tx.execute(
        sql`UPDATE identity.staff_membership
            SET status = 'disabled', deactivated_at = clock_timestamp()
            WHERE user_id = ${disabledMembership.userId}`,
      ),
  });
  await expectDenied(
    authorization(
      disabledMembership,
      "assigned.resource.read",
      async () => "ran",
    ),
    "IDENTITY_FORBIDDEN",
  );
});

test("role permission changes take effect on the next protected operation", async () => {
  const fixture = await createFixture({ role: "admin" });
  assert.equal(
    await authorization(
      fixture,
      "organization.resource.read",
      async () => "allowed",
    ),
    "allowed",
  );
  await withIdentityStateMutation({
    db: admin.db,
    userId: fixture.userId,
    mutation: (tx) =>
      tx.execute(
        sql`UPDATE identity.staff_membership
            SET role = 'agent'
            WHERE user_id = ${fixture.userId}`,
      ),
  });
  await expectDenied(
    authorization(fixture, "organization.resource.read", async () => "ran"),
    "IDENTITY_FORBIDDEN",
  );
});

test("resource scope predicate denies other-assignee and cross-organization rows", async () => {
  const fixture = await createFixture();
  const otherAssignee = await createFixture();
  const currentOrg = runtimeConfig.organizationId;
  const otherOrg = "00000000-0000-4000-8000-000000000002";
  const ownResource = randomUUID();
  const otherAssigneeResource = randomUUID();
  const crossOrgResource = randomUUID();
  await admin.pool.query(
    `INSERT INTO synthetic.resource
       (id, organization_id, assigned_user_id, label)
     VALUES
       ($1, $2, $3, 'assigned'),
       ($4, $2, $5, 'other assignee'),
       ($6, $7, $3, 'other organization')`,
    [
      ownResource,
      currentOrg,
      fixture.userId,
      otherAssigneeResource,
      otherAssignee.userId,
      crossOrgResource,
      otherOrg,
    ],
  );

  const visible = await authorization(
    fixture,
    "assigned.resource.read",
    async (tx, principal) =>
      tx
        .select({ id: resource.id })
        .from(resource)
        .where(
          and(
            eq(resource.id, ownResource),
            resourceScopePredicate(principal, {
              organizationId: resource.organizationId,
              assignedUserId: resource.assignedUserId,
            }),
          ),
        ),
  );
  assert.deepEqual(
    visible.map((row) => row.id),
    [ownResource],
  );

  const deniedIds = await authorization(
    fixture,
    "assigned.resource.read",
    async (tx, principal) =>
      tx
        .select({ id: resource.id })
        .from(resource)
        .where(
          and(
            sql`${resource.id} IN (${otherAssigneeResource}, ${crossOrgResource})`,
            resourceScopePredicate(principal, {
              organizationId: resource.organizationId,
              assignedUserId: resource.assignedUserId,
            }),
          ),
        ),
  );
  assert.deepEqual(deniedIds, []);
});

test("revocation waits for an in-flight authorized operation and denies later work", async () => {
  const fixture = await createFixture();
  const entered = deferred<number>();
  const release = deferred<void>();
  const operation = authorization(
    fixture,
    "assigned.resource.read",
    async (tx) => {
      const backend = await tx.execute(sql`SELECT pg_backend_pid() AS pid`);
      entered.resolve(Number(backend.rows[0]?.pid));
      await release.promise;
      return "completed";
    },
  );
  const operationPid = await entered.promise;
  const revoker = await admin.pool.connect();
  let revocation: Promise<unknown> | undefined;
  try {
    const pidResult = await revoker.query<{ pid: number }>(
      `SELECT pg_backend_pid() AS pid`,
    );
    const revokerPid = pidResult.rows[0]!.pid;
    await revoker.query("BEGIN");
    revocation = revoker
      .query(
        `UPDATE identity.session
         SET revoked_at = clock_timestamp(), revoked_by = $2
         WHERE id = $1`,
        [fixture.sessionId, fixture.userId],
      )
      .then(() => revoker.query("COMMIT"));

    let blocked = false;
    for (let attempt = 0; attempt < 500 && !blocked; attempt++) {
      const result = await admin.pool.query<{ blockers: number[] }>(
        `SELECT pg_blocking_pids($1) AS blockers`,
        [revokerPid],
      );
      blocked =
        result.rows[0]?.blockers.some((pid) => Number(pid) === operationPid) ??
        false;
      if (!blocked) await new Promise<void>((resolve) => setImmediate(resolve));
    }
    assert.equal(blocked, true);
  } finally {
    release.resolve();
    await operation;
    if (revocation) await revocation;
    revoker.release();
  }

  await expectDenied(
    authorization(fixture, "assigned.resource.read", async () => "ran"),
    "IDENTITY_UNAUTHENTICATED",
  );
});

test("database failures and sensitive mutations fail closed", async () => {
  const fixture = await createFixture({ role: "admin" });
  let callbackExecuted = false;
  const unavailable = createDatabase({ ...runtimeConfig, port: 1 });
  try {
    await expectDenied(
      authorization(
        fixture,
        "organization.resource.read",
        async () => {
          callbackExecuted = true;
          return "ran";
        },
        { db: unavailable.db },
      ),
      "IDENTITY_AUTHORIZATION_UNAVAILABLE",
    );
    assert.equal(callbackExecuted, false);
  } finally {
    await unavailable.close();
  }

  await expectDenied(
    authorization(fixture, "identity.staff.manage", async () => "ran"),
    "IDENTITY_FORBIDDEN",
  );
});

test("statement timeout rolls back protected writes with PostgreSQL SQLSTATE 57014", async () => {
  const fixture = await createFixture();
  const originalActivity = await readActivity(fixture.sessionId);
  assert.ok(originalActivity);
  const messages = await captureAuthorizationLogs(
    expectDenied(
      authorization(fixture, "assigned.resource.read", async (tx) => {
        await tx
          .update(session)
          .set({ lastActivityAt: sql`clock_timestamp()` })
          .where(eq(session.id, fixture.sessionId));
        await tx.execute(sql`SELECT pg_sleep(5)`);
        return "must not commit";
      }),
      "IDENTITY_AUTHORIZATION_UNAVAILABLE",
    ),
  );
  assertLoggedSqlState(messages, "57014");
  assert.equal(
    (await readActivity(fixture.sessionId))?.toISOString(),
    originalActivity.toISOString(),
  );
});

test("lock timeout fails closed with PostgreSQL SQLSTATE 55P03", async () => {
  const fixture = await createFixture();
  const blocker = await admin.pool.connect();
  let blockerPid: number | undefined;
  try {
    const pid = await blocker.query<{ pid: number }>(
      `SELECT pg_backend_pid() AS pid`,
    );
    blockerPid = pid.rows[0]!.pid;
    await blocker.query("BEGIN");
    await blocker.query(
      `SELECT id FROM identity.session WHERE id = $1 FOR UPDATE`,
      [fixture.sessionId],
    );
    const messages = await captureAuthorizationLogs(
      expectDenied(
        authorization(fixture, "assigned.resource.read", async () => "ran"),
        "IDENTITY_AUTHORIZATION_UNAVAILABLE",
      ),
    );
    assertLoggedSqlState(messages, "55P03");
  } finally {
    if (blockerPid !== undefined) {
      await blocker.query("ROLLBACK").catch(() => undefined);
    }
    blocker.release();
  }
});

test("transaction timeout terminates its connection and the pool recovers", async () => {
  const fixture = await createFixture();
  const originalActivity = await readActivity(fixture.sessionId);
  assert.ok(originalActivity);
  let timedOutBackendPid = 0;
  const messages = await captureAuthorizationLogs(
    expectDenied(
      authorization(fixture, "assigned.resource.read", async (tx) => {
        await tx
          .update(session)
          .set({ lastActivityAt: sql`clock_timestamp()` })
          .where(eq(session.id, fixture.sessionId));
        const backend = await tx.execute(sql`
          SELECT pg_backend_pid() AS pid
        `);
        timedOutBackendPid = Number(backend.rows[0]?.pid);
        await tx.execute(sql`SET LOCAL statement_timeout = '0'`);
        await tx.execute(sql`SELECT pg_sleep(12)`);
        return "must not commit";
      }),
      "IDENTITY_AUTHORIZATION_UNAVAILABLE",
    ),
  );
  assert.ok(
    messages.some((message) => message.includes("DB_OPERATION_FAILED")),
    `Expected a fail-closed connection termination; got ${messages.join(" | ")}`,
  );
  assert.equal(
    (await readActivity(fixture.sessionId))?.toISOString(),
    originalActivity.toISOString(),
  );
  assert.ok(timedOutBackendPid > 0);
  const terminated = await admin.pool.query<{ alive: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE pid = $1) AS alive`,
    [timedOutBackendPid],
  );
  assert.equal(terminated.rows[0]?.alive, false);
  assert.equal(
    await authorization(fixture, "assigned.resource.read", async (tx) => {
      const result = await tx.execute(sql`SELECT 1 AS one`);
      return Number(result.rows[0]?.one);
    }),
    1,
  );
});
