import "server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type {
  BetterAuthOptions,
  DBAdapter,
  DBTransactionAdapter,
} from "better-auth";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../db/schema";
import { account, session, user, verification } from "./schema";

const ACCOUNT_READ_FIELDS = ["id", "accountId", "providerId", "userId"];
const ACCOUNT_READ_FIELD_SET = new Set(ACCOUNT_READ_FIELDS);

function isAccountModel(model: string): boolean {
  return model === "account";
}

function rejectAccountMutation(): never {
  throw new Error("IDENTITY_ACCOUNT_MUTATION_FORBIDDEN");
}

function accountSelect(select?: string[]): string[] {
  const safeFields = select
    ? select.filter((field) => ACCOUNT_READ_FIELD_SET.has(field))
    : ACCOUNT_READ_FIELDS;
  return [...new Set(["id", ...safeFields])];
}

function guardIdentityAdapter(
  adapter: DBTransactionAdapter,
): DBTransactionAdapter {
  const create: DBTransactionAdapter["create"] = async (input) => {
    if (isAccountModel(input.model)) {
      rejectAccountMutation();
    }
    return adapter.create(input);
  };
  const findOne: DBTransactionAdapter["findOne"] = async <T>(
    input: Parameters<DBTransactionAdapter["findOne"]>[0],
  ) => {
    if (input.model === "user" && input.join?.account) {
      const join = { ...input.join };
      delete join.account;
      return adapter.findOne<T>({
        ...input,
        join: Object.keys(join).length > 0 ? join : undefined,
      });
    }
    if (!isAccountModel(input.model)) {
      return adapter.findOne<T>(input);
    }
    return adapter.findOne<T>({
      ...input,
      select: accountSelect(input.select),
    });
  };
  const findMany: DBTransactionAdapter["findMany"] = async <T>(
    input: Parameters<DBTransactionAdapter["findMany"]>[0],
  ) => {
    if (!isAccountModel(input.model)) {
      return adapter.findMany<T>(input);
    }
    return adapter.findMany<T>({
      ...input,
      select: accountSelect(input.select),
    });
  };
  const update: DBTransactionAdapter["update"] = async (input) => {
    if (isAccountModel(input.model)) {
      rejectAccountMutation();
    }
    return adapter.update(input);
  };
  const updateMany: DBTransactionAdapter["updateMany"] = async (input) => {
    if (isAccountModel(input.model)) {
      rejectAccountMutation();
    }
    return adapter.updateMany(input);
  };
  const deleteAccount: DBTransactionAdapter["delete"] = async (input) => {
    if (isAccountModel(input.model)) {
      rejectAccountMutation();
    }
    return adapter.delete(input);
  };
  const deleteManyAccount: DBTransactionAdapter["deleteMany"] = async (
    input,
  ) => {
    if (isAccountModel(input.model)) {
      rejectAccountMutation();
    }
    return adapter.deleteMany(input);
  };
  const consumeOne: DBTransactionAdapter["consumeOne"] = async <T>(
    input: Parameters<DBTransactionAdapter["consumeOne"]>[0],
  ) => {
    if (isAccountModel(input.model)) {
      rejectAccountMutation();
    }
    return adapter.consumeOne<T>(input);
  };
  const incrementOne: DBTransactionAdapter["incrementOne"] = async <T>(
    input: Parameters<DBTransactionAdapter["incrementOne"]>[0],
  ) => {
    if (isAccountModel(input.model)) {
      rejectAccountMutation();
    }
    return adapter.incrementOne<T>(input);
  };

  return {
    ...adapter,
    create,
    findOne,
    findMany,
    update,
    updateMany,
    delete: deleteAccount,
    deleteMany: deleteManyAccount,
    consumeOne,
    incrementOne,
  };
}

export function createIdentityAdapter(db: NodePgDatabase<typeof schema>) {
  const factory = drizzleAdapter(db, {
    provider: "pg",
    schemaName: "identity",
    schema: { user, session, account, verification },
    transaction: true,
  });

  return (options: BetterAuthOptions): DBAdapter => {
    const adapter = factory(options);
    const guarded = guardIdentityAdapter(adapter);
    return {
      ...guarded,
      transaction: (callback) =>
        adapter.transaction((transaction) =>
          callback(guardIdentityAdapter(transaction)),
        ),
    };
  };
}
