import assert from "node:assert/strict";
import test from "node:test";
import { getSchema } from "better-auth/db";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  auditEvent,
  account,
  session,
  user,
  verification,
} from "../../src/modules/identity/schema";
import * as migrationSchema from "../../src/db/migration-schema";

test("Better Auth 1.7.18 logical models match the PostgreSQL Drizzle schema", () => {
  const models = getSchema({});
  const tables = { user, session, account, verification };

  for (const [model, table] of Object.entries(tables)) {
    assert.ok(models[model], `Better Auth model ${model} exists`);
    const config = getTableConfig(table);
    assert.equal(config.schema, "identity");
    assert.equal(config.name, model);
    for (const field of Object.keys(models[model].fields)) {
      assert.ok(
        config.columns.some(
          (column) =>
            column.name ===
            field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
        ),
        `${model}.${field} is represented in Drizzle`,
      );
    }
  }
});

test("provider account identities have a database-level composite uniqueness constraint", () => {
  const config = getTableConfig(account);
  assert.ok(
    config.uniqueConstraints.some(
      (constraint) =>
        constraint.columns.map((column) => column.name).join(",") ===
        "provider_id,account_id",
    ),
  );
});

test("provider account schema forbids persisted credentials and OAuth tokens", () => {
  const config = getTableConfig(account);
  assert.ok(
    config.checks.some(
      (constraint) => constraint.name === "account_tokenless_check",
    ),
  );
});

test("migration entrypoint contains only the approved application tables", () => {
  assert.deepEqual(Object.keys(migrationSchema).sort(), [
    "account",
    "auditEvent",
    "identitySchema",
    "organizationSchema",
    "organizations",
    "session",
    "staffMembership",
    "user",
    "verification",
  ]);
  assert.equal(getTableConfig(auditEvent).schema, "identity");
});
