import { assertDatabaseIdentity, createDatabase } from "../../src/db/client";
import {
  DatabaseError,
  SYNTHETIC_ORGANIZATION_ID,
  readDatabaseConfig,
  type DatabaseConfig,
} from "../../src/db/config";
import { assertContainer, isMain, requireDocker, runCli } from "./bootstrap";

export async function seedSynthetic(config: DatabaseConfig): Promise<void> {
  if (
    config.role !== "migrator" ||
    config.organizationId !== SYNTHETIC_ORGANIZATION_ID
  ) {
    throw new DatabaseError("DB_SYNTHETIC_SEED_ONLY");
  }
  assertContainer(config);
  const connection = createDatabase(config);
  try {
    const client = await connection.pool.connect();
    try {
      await assertDatabaseIdentity(client, config);
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO app.organizations (id, slug, display_name)
         VALUES ($1, 'synthetic-propertygojb', 'Synthetic PropertyGOJB')
         ON CONFLICT (id) DO NOTHING`,
        [SYNTHETIC_ORGANIZATION_ID],
      );
      const result = await client.query<{ slug: string; display_name: string }>(
        "SELECT slug, display_name FROM app.organizations WHERE id = $1",
        [SYNTHETIC_ORGANIZATION_ID],
      );
      if (
        result.rows[0]?.slug !== "synthetic-propertygojb" ||
        result.rows[0].display_name !== "Synthetic PropertyGOJB"
      ) {
        throw new DatabaseError("DB_SYNTHETIC_SEED_CONFLICT");
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await connection.close();
  }
}

if (isMain("seed-synthetic.ts")) {
  void runCli("seed-synthetic", async () => {
    requireDocker();
    await seedSynthetic(readDatabaseConfig(process.env, "migrator"));
  });
}
