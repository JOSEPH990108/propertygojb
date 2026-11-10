import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  open,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
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
  // Keep fixtures outside build cleanup and the application's TypeScript inputs.
  const fixture = await mkdtemp(path.join(os.tmpdir(), "d1-boundary-"));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  await symlink(
    path.join(repository, "node_modules"),
    path.join(fixture, "node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );
  await mkdir(path.join(fixture, "app"));
  await writeFile(
    path.join(fixture, "package.json"),
    JSON.stringify({ name: "synthetic-d1-boundary", private: true }),
  );
  await writeFile(
    path.join(fixture, "next.config.mjs"),
    // Avoid the worker IPC rejection racing its separately forwarded diagnostics.
    "export default { experimental: { webpackBuildWorker: false }, typescript: { tsconfigPath: 'tsconfig.json' } };\n",
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
  const moduleSource = (modulePath: string) =>
    path
      .relative(path.join(fixture, "app"), modulePath)
      .replaceAll(path.sep, "/");
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
  const build = async () => {
    const outputPath = path.join(fixture, "build-output.log");
    const output = await open(outputPath, "w");
    let result: ReturnType<typeof spawnSync>;
    try {
      // File-backed stdio survives immediate CLI exit without pipe-flush timing.
      result = spawnSync(
        process.execPath,
        [
          path.join(repository, "node_modules", "next", "dist", "bin", "next"),
          "build",
          "--webpack",
        ],
        {
          cwd: fixture,
          env,
          stdio: ["ignore", output.fd, output.fd],
          timeout: 120_000,
          windowsHide: true,
        },
      );
    } finally {
      await output.close();
    }
    return { ...result, diagnostics: await readFile(outputPath, "utf8") };
  };
  const databaseClient = moduleSource(
    path.join(repository, "src", "db", "client"),
  );
  const page = `import { getDatabase } from ${JSON.stringify(databaseClient)};\nexport default function Page() { return <p>{typeof getDatabase}</p>; }\n`;
  await writeFile(path.join(fixture, "app", "page.js"), page);
  const server = await build();
  assert.equal(server.error, undefined, server.diagnostics);
  assert.equal(server.signal, null, server.diagnostics);
  assert.equal(server.status, 0, server.diagnostics);
  const clientModules = [
    {
      path: path.join(repository, "src", "db", "client"),
      exportName: "getDatabase",
      diagnosticPath: "src/db/client.ts",
    },
    {
      path: path.join(repository, "src", "modules", "identity", "auth-config"),
      exportName: "createIdentityAuth",
      diagnosticPath: "src/modules/identity/auth-config.ts",
    },
    {
      path: path.join(repository, "src", "modules", "identity", "adapter"),
      exportName: "createIdentityAdapter",
      diagnosticPath: "src/modules/identity/adapter.ts",
    },
  ];
  for (const module of clientModules) {
    const source = moduleSource(module.path);
    const clientPage = `"use client";\nimport { ${module.exportName} } from ${JSON.stringify(source)};\nexport default function Page() { return <p>{typeof ${module.exportName}}</p>; }\n`;
    await writeFile(path.join(fixture, "app", "page.js"), clientPage);
    const client = await build();
    assert.equal(client.error, undefined, client.diagnostics);
    assert.equal(client.signal, null, client.diagnostics);
    assert.equal(client.status, 1, client.diagnostics);
    assert.match(client.diagnostics, /server-only/);
    assert.match(
      client.diagnostics,
      /This API is only available in Server Components/,
    );
    assert.match(client.diagnostics, /Import trace for requested module:/);
    assert.match(client.diagnostics, /\.\/app\/page\.js/);
    assert.ok(
      client.diagnostics.includes(module.diagnosticPath),
      client.diagnostics,
    );
  }
});
