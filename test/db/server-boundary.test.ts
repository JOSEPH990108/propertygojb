import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { createDatabase } from "../../src/db/client";
import { readDatabaseConfig, syntheticEnvironment } from "../../src/db/config";

test("creating a pool is lazy and shutdown needs no PostgreSQL connection", async () => {
  const config = readDatabaseConfig(
    syntheticEnvironment("test", "a".repeat(32), "b".repeat(64), 65534),
  );
  const connection = createDatabase(config);
  assert.equal(connection.pool.totalCount, 0);
  assert.equal(connection.pool.waitingCount, 0);
  await connection.close();
  assert.equal(connection.pool.totalCount, 0);
});

test("database modules cannot cross an actual Next.js client boundary", async (t) => {
  const repository = process.cwd();
  const scratch = path.join(repository, ".next");
  await mkdir(scratch, { recursive: true });
  const fixture = await mkdtemp(path.join(scratch, "d1-boundary-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  await mkdir(path.join(fixture, "app"));
  await writeFile(
    path.join(fixture, "package.json"),
    JSON.stringify({ name: "synthetic-d1-boundary", private: true }),
  );
  await writeFile(
    path.join(fixture, "next.config.mjs"),
    "export default { typescript: { tsconfigPath: 'tsconfig.json' } };\n",
  );
  await writeFile(
    path.join(fixture, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        module: "esnext",
        moduleResolution: "bundler",
        target: "ES2017",
        jsx: "react-jsx",
        esModuleInterop: true,
        skipLibCheck: true,
      },
      include: ["app/**/*", ".next/types/**/*.ts"],
    }),
  );
  await writeFile(
    path.join(fixture, "app", "layout.js"),
    'export default function Layout({ children }) { return <html lang="en"><body>{children}</body></html>; }\n',
  );
  const source = path
    .relative(
      path.join(fixture, "app"),
      path.join(repository, "src", "db", "client"),
    )
    .replaceAll(path.sep, "/");
  const page = `import { getDatabase } from ${JSON.stringify(source)};\nexport default function Page() { return <p>{typeof getDatabase}</p>; }\n`;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  delete env.NODE_OPTIONS;
  for (const key of [
    "DATABASE_URL",
    "MIGRATION_DATABASE_URL",
    "BOOTSTRAP_DATABASE_URL",
    "PGJB_DB_MODE",
  ])
    delete env[key];
  const build = () =>
    spawnSync(
      process.execPath,
      [
        path.join(repository, "node_modules", "next", "dist", "bin", "next"),
        "build",
        "--webpack",
      ],
      {
        cwd: fixture,
        env,
        encoding: "utf8",
        timeout: 120_000,
        maxBuffer: 4 * 1024 * 1024,
      },
    );
  await writeFile(path.join(fixture, "app", "page.js"), page);
  const server = build();
  assert.equal(server.error, undefined);
  assert.equal(server.status, 0, `${server.stdout}\n${server.stderr}`);
  await writeFile(
    path.join(fixture, "app", "page.js"),
    `"use client";\n${page}`,
  );
  const client = build();
  assert.equal(client.error, undefined);
  assert.notEqual(client.status, 0);
  assert.match(`${client.stdout}\n${client.stderr}`, /server-only/);
  assert.match(
    `${client.stdout}\n${client.stderr}`,
    /This API is only available in Server Components/,
  );
  assert.match(
    `${client.stdout}\n${client.stderr}`,
    /Import trace for requested module:/,
  );
  assert.match(`${client.stdout}\n${client.stderr}`, /\.\/app\/page\.js/);
});
