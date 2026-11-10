import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createDatabase } from "../../src/db/client";
import { DatabaseError, readDatabaseConfig } from "../../src/db/config";

const runtimeConfig = readDatabaseConfig();
const migrationConfig = readDatabaseConfig(process.env, "migrator");
const adminConfig = readDatabaseConfig(process.env, "bootstrap");
if (runtimeConfig.mode !== "test") throw new DatabaseError("DB_TEST_ONLY");

const runtime = createDatabase(runtimeConfig);
const migrator = createDatabase(migrationConfig);
const admin = createDatabase(adminConfig);

before(async () => {
  await migrator.pool.query(`
    CREATE SCHEMA synthetic;
    CREATE TABLE synthetic.resource (
      id text PRIMARY KEY,
      organization_id uuid NOT NULL REFERENCES app.organizations(id) ON DELETE RESTRICT,
      assigned_user_id text NOT NULL REFERENCES identity."user"(id) ON DELETE RESTRICT,
      label text NOT NULL
    );
    REVOKE ALL ON SCHEMA synthetic FROM PUBLIC;
    GRANT USAGE ON SCHEMA synthetic TO pgjb_runtime;
    GRANT SELECT ON synthetic.resource TO pgjb_runtime;
  `);
});

after(async () => {
  await Promise.all([runtime.close(), migrator.close(), admin.close()]);
});

test("runtime identity grants permit reads and session lifecycle only", async () => {
  const permissions = await runtime.pool.query<{
    user_read: boolean;
    user_write: boolean;
    membership_read: boolean;
    membership_write: boolean;
    account_table_read: boolean;
    account_identity_read: boolean;
    account_token_read: boolean;
    account_password_read: boolean;
    account_insert: boolean;
    account_update: boolean;
    account_delete: boolean;
    audit_insert: boolean;
    audit_select: boolean;
    audit_update: boolean;
    audit_delete: boolean;
    session_insert: boolean;
    session_delete: boolean;
    session_activity_update: boolean;
    session_revoked_at_update: boolean;
    session_revoked_by_update: boolean;
    session_expiry_update: boolean;
    verification_read: boolean;
    verification_insert: boolean;
    verification_update: boolean;
    verification_delete: boolean;
    schema_create: boolean;
  }>(`
    SELECT
      has_table_privilege('identity.user', 'SELECT') AS user_read,
      has_table_privilege('identity.user', 'UPDATE') AS user_write,
      has_table_privilege('identity.staff_membership', 'SELECT') AS membership_read,
      has_table_privilege('identity.staff_membership', 'UPDATE') AS membership_write,
      has_table_privilege('identity.account', 'SELECT') AS account_table_read,
      has_column_privilege('identity.account', 'provider_id', 'SELECT') AS account_identity_read,
      has_column_privilege('identity.account', 'access_token', 'SELECT') AS account_token_read,
      has_column_privilege('identity.account', 'password', 'SELECT') AS account_password_read,
      has_table_privilege('identity.account', 'INSERT') AS account_insert,
      has_table_privilege('identity.account', 'UPDATE') AS account_update,
      has_table_privilege('identity.account', 'DELETE') AS account_delete,
      has_table_privilege('identity.audit_event', 'INSERT') AS audit_insert,
      has_table_privilege('identity.audit_event', 'SELECT') AS audit_select,
      has_table_privilege('identity.audit_event', 'UPDATE') AS audit_update,
      has_table_privilege('identity.audit_event', 'DELETE') AS audit_delete,
      has_table_privilege('identity.session', 'INSERT') AS session_insert,
      has_table_privilege('identity.session', 'DELETE') AS session_delete,
      has_column_privilege('identity.session', 'last_activity_at', 'UPDATE') AS session_activity_update,
      has_column_privilege('identity.session', 'revoked_at', 'UPDATE') AS session_revoked_at_update,
      has_column_privilege('identity.session', 'revoked_by', 'UPDATE') AS session_revoked_by_update,
      has_column_privilege('identity.session', 'expires_at', 'UPDATE') AS session_expiry_update,
      has_table_privilege('identity.verification', 'SELECT') AS verification_read,
      has_table_privilege('identity.verification', 'INSERT') AS verification_insert,
      has_table_privilege('identity.verification', 'UPDATE') AS verification_update,
      has_table_privilege('identity.verification', 'DELETE') AS verification_delete,
      has_database_privilege(current_database(), 'CREATE') AS schema_create
  `);
  assert.deepEqual(permissions.rows[0], {
    user_read: true,
    user_write: false,
    membership_read: true,
    membership_write: false,
    account_table_read: false,
    account_identity_read: true,
    account_token_read: false,
    account_password_read: false,
    account_insert: false,
    account_update: false,
    account_delete: false,
    audit_insert: true,
    audit_select: false,
    audit_update: false,
    audit_delete: false,
    session_insert: true,
    session_delete: true,
    session_activity_update: true,
    session_revoked_at_update: true,
    session_revoked_by_update: true,
    session_expiry_update: false,
    verification_read: true,
    verification_insert: true,
    verification_update: false,
    verification_delete: true,
    schema_create: false,
  });
  await assert.rejects(
    runtime.pool.query(`CREATE TABLE identity.denied (id integer)`),
    { code: "42501" },
  );
  await assert.rejects(
    runtime.pool.query("SELECT access_token FROM identity.account"),
    { code: "42501" },
  );
  await assert.rejects(
    runtime.pool.query(
      `INSERT INTO identity.account (id, account_id, provider_id, user_id)
       VALUES ('denied', 'denied', 'microsoft-entra-id', 'missing-user')`,
    ),
    { code: "42501" },
  );
  await assert.rejects(
    runtime.pool.query("UPDATE identity.account SET scope = 'denied'"),
    { code: "42501" },
  );
  await assert.rejects(runtime.pool.query("DELETE FROM identity.account"), {
    code: "42501",
  });
  await assert.rejects(
    runtime.pool.query(`UPDATE app.organizations SET slug = 'denied'`),
    { code: "42501" },
  );
});

test("provisioner is non-login and limited to identity provisioning", async () => {
  const permissions = await admin.pool.query<{
    can_login: boolean;
    no_password: boolean;
    user_insert: boolean;
    membership_insert: boolean;
    account_insert: boolean;
    account_token_insert: boolean;
    account_read: boolean;
    session_insert: boolean;
    audit_insert: boolean;
  }>(`
    SELECT
      role.rolcanlogin AS can_login,
      auth.rolpassword IS NULL AS no_password,
      has_column_privilege('pgjb_provisioner', 'identity.user', 'id', 'INSERT') AS user_insert,
      has_table_privilege('pgjb_provisioner', 'identity.staff_membership', 'INSERT') AS membership_insert,
      has_table_privilege('pgjb_provisioner', 'identity.account', 'INSERT') AS account_insert,
      has_column_privilege('pgjb_provisioner', 'identity.account', 'access_token', 'INSERT') AS account_token_insert,
      has_table_privilege('pgjb_provisioner', 'identity.account', 'SELECT') AS account_read,
      has_table_privilege('pgjb_provisioner', 'identity.session', 'INSERT') AS session_insert,
      has_table_privilege('pgjb_provisioner', 'identity.audit_event', 'INSERT') AS audit_insert
    FROM pg_roles role JOIN pg_authid auth ON auth.oid = role.oid
    WHERE role.rolname = 'pgjb_provisioner'
  `);
  assert.deepEqual(permissions.rows[0], {
    can_login: false,
    no_password: true,
    user_insert: true,
    membership_insert: true,
    account_insert: false,
    account_token_insert: false,
    account_read: false,
    session_insert: false,
    audit_insert: false,
  });
  await assert.rejects(runtime.pool.query("SET ROLE pgjb_provisioner"), {
    code: "42501",
  });
});

test("identity key constraints reject duplicate provider identities and orphan memberships", async () => {
  const orgId = adminConfig.organizationId;
  await admin.pool.query(
    `INSERT INTO identity."user" (id, name, email) VALUES
      ('synthetic-user-1', 'Synthetic One', 'tenant.one@identity.invalid'),
      ('synthetic-user-2', 'Synthetic Two', 'tenant.two@identity.invalid')`,
  );
  await admin.pool.query(
    `INSERT INTO identity.account (id, account_id, provider_id, user_id)
     VALUES ('synthetic-account-1', 'tenant:object', 'microsoft-entra-id', 'synthetic-user-1')`,
  );
  await assert.rejects(
    admin.pool.query(
      `INSERT INTO identity.account (id, account_id, provider_id, user_id)
       VALUES ('synthetic-account-2', 'tenant:object', 'microsoft-entra-id', 'synthetic-user-2')`,
    ),
    { code: "23505" },
  );
  await assert.rejects(
    admin.pool.query(
      `INSERT INTO identity.account (id, account_id, provider_id, user_id)
       VALUES ('orphan-account', 'tenant:orphan', 'microsoft-entra-id', 'missing-user')`,
    ),
    { code: "23503" },
  );
  await assert.rejects(
    admin.pool.query(
      `INSERT INTO identity.staff_membership (user_id, organization_id, role)
       VALUES ('missing-user', $1, 'agent')`,
      [orgId],
    ),
    { code: "23503" },
  );
  await admin.pool.query(
    `INSERT INTO identity.staff_membership (user_id, organization_id, role)
     VALUES ('synthetic-user-1', $1, 'agent')`,
    [orgId],
  );
  await assert.rejects(
    admin.pool.query(
      `INSERT INTO identity.staff_membership (user_id, organization_id, role)
       VALUES ('synthetic-user-1', $1, 'owner')`,
      [orgId],
    ),
    { code: "23514" },
  );
  await assert.rejects(
    admin.pool.query(
      `INSERT INTO identity.staff_membership (user_id, organization_id, role)
       VALUES ('synthetic-user-1', $1, 'agent')`,
      [orgId],
    ),
    { code: "23505" },
  );

  await runtime.pool.query(
    `INSERT INTO identity.session (id, expires_at, token, user_id)
     VALUES ('synthetic-revocable-session', now() + interval '1 hour',
       'synthetic-revocable-token', 'synthetic-user-1')`,
  );
  await runtime.pool.query(
    `UPDATE identity.session
     SET revoked_at = now(), revoked_by = 'synthetic-user-2'
     WHERE id = 'synthetic-revocable-session'`,
  );
  await assert.rejects(
    runtime.pool.query(
      `UPDATE identity.session
       SET revoked_at = NULL, revoked_by = NULL
       WHERE id = 'synthetic-revocable-session'`,
    ),
    { code: "23514" },
  );
  await assert.rejects(
    runtime.pool.query(
      `UPDATE identity.session
       SET revoked_by = 'synthetic-user-1'
       WHERE id = 'synthetic-revocable-session'`,
    ),
    { code: "23514" },
  );
  const revokedSession = await admin.pool.query(
    `SELECT revoked_at IS NOT NULL AS revoked,
       revoked_by AS revoked_by
     FROM identity.session
     WHERE id = 'synthetic-revocable-session'`,
  );
  assert.deepEqual(revokedSession.rows, [
    { revoked: true, revoked_by: "synthetic-user-2" },
  ]);

  for (const column of [
    "access_token",
    "refresh_token",
    "id_token",
    "access_token_expires_at",
    "refresh_token_expires_at",
    "password",
  ]) {
    const value = column.endsWith("_at") ? "now()" : "'synthetic-credential'";
    await assert.rejects(
      admin.pool.query(
        `INSERT INTO identity.account (id, account_id, provider_id, user_id, ${column})
         VALUES ('tokenless-${column}', 'tokenless-${column}', 'microsoft-entra-id',
           'synthetic-user-1', ${value})`,
      ),
      { code: "23514" },
    );
  }

  await runtime.pool.query(
    `INSERT INTO identity.audit_event (actor_user_id, event_type)
     VALUES ('synthetic-user-1', 'identity.test')`,
  );
  await assert.rejects(
    runtime.pool.query(
      `UPDATE identity.audit_event SET event_type = 'identity.changed'`,
    ),
    { code: "42501" },
  );
  await assert.rejects(runtime.pool.query(`DELETE FROM identity.audit_event`), {
    code: "42501",
  });
  const auditEvents = await admin.pool.query(
    `SELECT event_type FROM identity.audit_event
     WHERE actor_user_id = 'synthetic-user-1'`,
  );
  assert.deepEqual(auditEvents.rows, [{ event_type: "identity.test" }]);
});
