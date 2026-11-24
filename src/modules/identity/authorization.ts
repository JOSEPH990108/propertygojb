import "server-only";
import {
  and,
  asc,
  eq,
  sql,
  type ExtractTablesWithRelations,
  type SQL,
} from "drizzle-orm";
import {
  drizzle,
  type NodePgDatabase,
  type NodePgTransaction,
} from "drizzle-orm/node-postgres";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { Pool, PoolClient } from "pg";
import * as schema from "../../db/schema";
import {
  errorCode as databaseErrorCode,
  readDatabaseConfig,
} from "../../db/config";
import { identitySessionPolicy } from "./auth-config";
import { session, staffMembership, user } from "./schema";
import {
  hasStaffPermission,
  type StaffPermission,
  type StaffRole,
} from "./permissions";

type IdentityTransaction = NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
type IdentityDatabase = NodePgDatabase<typeof schema> & { $client: Pool };

export type ActivityClassification = "foreground" | "passive";

export interface StaffPrincipal {
  userId: string;
  organizationId: string;
  membershipId: string;
  role: StaffRole;
}

export class IdentityAuthorizationError extends Error {
  constructor(
    readonly code:
      | "IDENTITY_UNAUTHENTICATED"
      | "IDENTITY_FORBIDDEN"
      | "IDENTITY_AUTHORIZATION_UNAVAILABLE",
    readonly status: 401 | 403 | 503,
  ) {
    super(code);
    this.name = "IdentityAuthorizationError";
  }
}

export interface AuthorizedOperationInput<T> {
  db: IdentityDatabase;
  resolveSession: () => Promise<{ id: string; userId: string } | null>;
  permission: StaffPermission;
  activity?: ActivityClassification;
  operation: (tx: IdentityTransaction, principal: StaffPrincipal) => Promise<T>;
}

function deny(code: "IDENTITY_UNAUTHENTICATED" | "IDENTITY_FORBIDDEN"): never {
  throw new IdentityAuthorizationError(
    code,
    code === "IDENTITY_UNAUTHENTICATED" ? 401 : 403,
  );
}

export interface SessionTimestampSnapshot {
  createdAtEpochMicros: string;
  expiresAtEpochMicros: string;
  lastActivityAtEpochMicros: string;
}

export function sessionExpiryPredicate(
  snapshot: SessionTimestampSnapshot,
  nowEpochMicros: SQL = sql`
    trunc(extract(epoch FROM statement_timestamp()) * 1000000)::numeric
  `,
): SQL {
  return sql`
    ${nowEpochMicros} >= ${snapshot.lastActivityAtEpochMicros}::numeric
    AND ${nowEpochMicros} < LEAST(
      ${snapshot.createdAtEpochMicros}::numeric
        + (${identitySessionPolicy.sessionLifetimeSeconds}::numeric * 1000000),
      ${snapshot.expiresAtEpochMicros}::numeric,
      ${snapshot.lastActivityAtEpochMicros}::numeric
        + (${identitySessionPolicy.idleTimeoutSeconds}::numeric * 1000000)
    )
  `;
}

function authorizationErrorCode(error: unknown): string {
  let current = error;
  for (let depth = 0; depth < 4; depth++) {
    if (
      typeof current === "object" &&
      current !== null &&
      "code" in current &&
      typeof current.code === "string" &&
      /^[0-9A-Z]{5}$/.test(current.code)
    ) {
      return current.code;
    }
    if (!(current instanceof Error)) break;
    current = current.cause;
  }
  return databaseErrorCode(error);
}

function isConnectionTermination(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 4; depth++) {
    if (typeof current === "object" && current !== null) {
      if (
        "code" in current &&
        typeof current.code === "string" &&
        ["ECONNRESET", "EPIPE", "57P01", "57P02", "57P03", "25P04"].includes(
          current.code,
        )
      ) {
        return true;
      }
    }
    if (!(current instanceof Error)) return false;
    if (current.message === "Connection terminated unexpectedly") return true;
    current = current.cause;
  }
  return false;
}

async function inAuthorizationTransaction<T>(
  db: IdentityDatabase,
  operation: (tx: IdentityTransaction) => Promise<T>,
): Promise<T> {
  const client: PoolClient = await db.$client.connect();
  let destroyClient = false;
  const transactionStartedAt = performance.now();
  const onClientError = () => {
    destroyClient = true;
  };
  client.on("error", onClientError);
  try {
    const transactionClient = new Proxy(client, {
      getPrototypeOf: () => Object.prototype,
    });
    return await drizzle(transactionClient, { schema }).transaction(operation);
  } catch (error) {
    destroyClient ||=
      isConnectionTermination(error) ||
      performance.now() - transactionStartedAt >= 9_000;
    throw error;
  } finally {
    client.off("error", onClientError);
    client.release(destroyClient);
  }
}

async function lockStaffState(
  tx: IdentityTransaction,
  userId: string,
  organizationId: string,
): Promise<void> {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${"identity:user:" + userId}, 0::bigint))`,
  );
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${"identity:membership:" + userId + ":" + organizationId}, 0::bigint))`,
  );
}

export async function withIdentityStateMutation<T>(input: {
  db: NodePgDatabase<typeof schema>;
  userId: string;
  mutation: (tx: IdentityTransaction) => Promise<T>;
}): Promise<T> {
  const organizationId = readDatabaseConfig().organizationId;
  return input.db.transaction(async (tx) => {
    await tx
      .select({ id: session.id })
      .from(session)
      .where(eq(session.userId, input.userId))
      .orderBy(asc(session.id))
      .for("update");
    await lockStaffState(tx, input.userId, organizationId);
    return input.mutation(tx);
  });
}

export async function authorizeStaffOperation<T>(
  input: AuthorizedOperationInput<T>,
): Promise<T> {
  let candidate: { id: string; userId: string } | null;
  try {
    candidate = await input.resolveSession();
  } catch (error) {
    console.error(`[identity:session-resolve] ${databaseErrorCode(error)}`);
    throw new IdentityAuthorizationError(
      "IDENTITY_AUTHORIZATION_UNAVAILABLE",
      503,
    );
  }
  if (!candidate) deny("IDENTITY_UNAUTHENTICATED");

  let organizationId: string;
  try {
    organizationId = readDatabaseConfig().organizationId;
  } catch (error) {
    console.error(`[identity:organization-config] ${databaseErrorCode(error)}`);
    throw new IdentityAuthorizationError(
      "IDENTITY_AUTHORIZATION_UNAVAILABLE",
      503,
    );
  }

  try {
    return await inAuthorizationTransaction(input.db, async (tx) => {
      await tx.execute(sql`SET LOCAL transaction_timeout = '10s'`);
      await tx.execute(sql`SET LOCAL statement_timeout = '4s'`);
      await tx.execute(sql`SET LOCAL lock_timeout = '2s'`);
      await tx.execute(
        sql`SET LOCAL idle_in_transaction_session_timeout = '5s'`,
      );
      const timeoutResult = await tx.execute(sql`
        SELECT
          current_setting('transaction_timeout')::interval = interval '10 seconds'
            AS transaction_timeout,
          current_setting('statement_timeout')::interval = interval '4 seconds'
            AS statement_timeout,
          current_setting('lock_timeout')::interval = interval '2 seconds'
            AS lock_timeout,
          current_setting('idle_in_transaction_session_timeout')::interval
            = interval '5 seconds' AS idle_transaction_timeout
      `);
      const timeoutSettings = timeoutResult.rows[0];
      if (
        timeoutSettings?.transaction_timeout !== true ||
        timeoutSettings.statement_timeout !== true ||
        timeoutSettings.lock_timeout !== true ||
        timeoutSettings.idle_transaction_timeout !== true
      ) {
        throw new Error("IDENTITY_TIMEOUT_CONFIGURATION_FAILED");
      }

      const sessionResult = await tx.execute(sql`
        SELECT id,
          trunc(extract(epoch FROM created_at) * 1000000)::text
            AS created_at_epoch_micros,
          trunc(extract(epoch FROM expires_at) * 1000000)::text
            AS expires_at_epoch_micros,
          trunc(extract(epoch FROM last_activity_at) * 1000000)::text
            AS last_activity_at_epoch_micros,
          revoked_at IS NOT NULL AS revoked
        FROM identity.session
        WHERE id = ${candidate.id} AND user_id = ${candidate.userId}
        FOR UPDATE
      `);
      const sessionState = sessionResult.rows[0];
      if (
        typeof sessionState?.id !== "string" ||
        typeof sessionState.created_at_epoch_micros !== "string" ||
        typeof sessionState.expires_at_epoch_micros !== "string" ||
        typeof sessionState.last_activity_at_epoch_micros !== "string" ||
        sessionState.revoked !== false
      ) {
        deny("IDENTITY_UNAUTHENTICATED");
      }
      const timestampSnapshot: SessionTimestampSnapshot = {
        createdAtEpochMicros: sessionState.created_at_epoch_micros,
        expiresAtEpochMicros: sessionState.expires_at_epoch_micros,
        lastActivityAtEpochMicros: sessionState.last_activity_at_epoch_micros,
      };

      await lockStaffState(tx, candidate.userId, organizationId);

      const [staffUser] = await tx
        .select({ id: user.id, status: user.status })
        .from(user)
        .where(eq(user.id, candidate.userId))
        .limit(1);
      if (!staffUser || staffUser.status !== "active") {
        deny("IDENTITY_FORBIDDEN");
      }

      const [membership] = await tx
        .select({
          id: staffMembership.id,
          role: staffMembership.role,
          status: staffMembership.status,
        })
        .from(staffMembership)
        .where(
          and(
            eq(staffMembership.userId, candidate.userId),
            eq(staffMembership.organizationId, organizationId),
          ),
        )
        .limit(1);
      if (
        !membership ||
        membership.status !== "active" ||
        (membership.role !== "admin" && membership.role !== "agent")
      ) {
        deny("IDENTITY_FORBIDDEN");
      }

      const validityResult = await tx.execute(sql`
        SELECT ${sessionExpiryPredicate(timestampSnapshot)} AS valid
      `);
      if (validityResult.rows[0]?.valid !== true) {
        deny("IDENTITY_UNAUTHENTICATED");
      }

      const principal: StaffPrincipal = {
        userId: staffUser.id,
        organizationId,
        membershipId: membership.id,
        role: membership.role,
      };
      if (!hasStaffPermission(principal.role, input.permission)) {
        deny("IDENTITY_FORBIDDEN");
      }

      const result = await input.operation(tx, principal);
      if ((input.activity ?? "passive") === "foreground") {
        await tx
          .update(session)
          .set({ lastActivityAt: sql`clock_timestamp()` })
          .where(eq(session.id, sessionState.id));
      }
      const finalValidityResult = await tx.execute(sql`
        SELECT
          ${sessionExpiryPredicate(timestampSnapshot)} AS valid
      `);
      const finalValidity = finalValidityResult.rows[0];
      if (finalValidity?.valid !== true) {
        deny("IDENTITY_UNAUTHENTICATED");
      }
      return result;
    });
  } catch (error) {
    if (error instanceof IdentityAuthorizationError) throw error;
    console.error(`[identity:authorize] ${authorizationErrorCode(error)}`);
    throw new IdentityAuthorizationError(
      "IDENTITY_AUTHORIZATION_UNAVAILABLE",
      503,
    );
  }
}

export function resourceScopePredicate(
  principal: Pick<StaffPrincipal, "organizationId" | "userId" | "role">,
  columns: { organizationId: PgColumn; assignedUserId: PgColumn },
): SQL {
  const organizationMatch = eq(
    columns.organizationId,
    principal.organizationId,
  );
  if (principal.role === "admin") return organizationMatch;
  return and(organizationMatch, eq(columns.assignedUserId, principal.userId))!;
}

export type { IdentityTransaction };
