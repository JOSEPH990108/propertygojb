import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import {
  assertTestSummary,
  EXPECTED_TEST_COUNT,
  verifyPrototype,
} from "../../scripts/prototype/verify.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const { AbortController } = globalThis;
const validTap = (count = 15) =>
  [
    "TAP version 13",
    ...Array.from(
      { length: count },
      (_, index) => `ok ${index + 1} - synthetic`,
    ),
    `1..${count}`,
    `# tests ${count}`,
    `# pass ${count}`,
    "# fail 0",
    "# cancelled 0",
    "# skipped 0",
    "# todo 0",
    "",
  ].join("\n");

async function listen(server, port = 0) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port, exclusive: true }, resolve);
  });
  return server.address().port;
}

async function close(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function freePort() {
  const server = net.createServer();
  const port = await listen(server);
  await close(server);
  return port;
}

async function assertReleased(port) {
  const probe = net.createServer();
  await listen(probe, port);
  await close(probe);
}

async function fixture(t) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "pgjb-prototype-harness-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await mkdir(path.join(cwd, ".next"));
  await writeFile(path.join(cwd, ".next", "BUILD_ID"), "synthetic-build");
  return cwd;
}

const serverCode = `
  const http = require("node:http"), fs = require("node:fs");
  const mode = process.argv[1], file = process.argv[2];
  fs.writeFileSync(file, String(process.pid));
  if (mode === "startup-failure") process.exit(23);
  if (mode === "no-announcement") setInterval(() => {}, 1000);
  else {
    const server = http.createServer((request, response) => {
      fs.appendFileSync(file + ".requests", request.url + "\\n");
      if (mode === "hung-http") return;
      response.writeHead(mode === "http-failure" ? 503 : 200).end("synthetic");
    });
    server.listen(Number(new URL(process.env.PROPERTY_PROTOTYPE_BASE_URL).port), "127.0.0.1",
      () => { console.log("Ready in 1ms"); });
  }
`;

function command(code, ...args) {
  return [process.execPath, "-e", code, ...args];
}

async function runCase(
  t,
  {
    mode = "ready",
    tap = validTap(),
    testCode = "console.log(process.argv[1]);",
    error,
    signal,
    startupTimeoutMs = 1500,
    testTimeoutMs = 1500,
  } = {},
) {
  const cwd = await fixture(t);
  const port = await freePort();
  const pidFile = path.join(cwd, "server.pid");
  const options = {
    cwd,
    port,
    signal,
    startupTimeoutMs,
    testTimeoutMs,
    cleanupTimeoutMs: 3000,
    output: () => {},
    serverCommand: command(serverCode, mode, pidFile),
    testCommand: command(testCode, tap, path.join(cwd, "test.pid")),
  };
  if (error) await assert.rejects(verifyPrototype(options), error);
  else await verifyPrototype(options);
  const pid = Number(await readFile(pidFile, "utf8"));
  assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
  await assertReleased(port);
  return cwd;
}

test("strict TAP accepts exactly the deliberately pinned 15-test contract", () => {
  assert.equal(EXPECTED_TEST_COUNT, 15);
  assert.doesNotThrow(() => assertTestSummary(validTap()));
  assert.doesNotThrow(() =>
    assertTestSummary(validTap().replaceAll("\n", "\r\n")),
  );
});

test("strict TAP fails closed on growth, missing, duplicate and malformed summaries", () => {
  for (const tap of [
    "",
    validTap(14),
    validTap(16),
    validTap().replace("# skipped 0\n", ""),
    validTap() + "# pass 15\n",
    validTap().replace("# tests 15", "# tests fifteen"),
    validTap().replace("# pass 15", "# pass 15 trailing"),
    validTap().replace("1..15", "1..16"),
    validTap().replace("ok 8 - synthetic\n", ""),
    validTap().replace("ok 8 - synthetic", "ok 7 - synthetic"),
    validTap().replace("TAP version 13", "TAP version 12"),
  ]) {
    assert.throws(() => assertTestSummary(tap));
  }
});

test("strict TAP rejects failed, skipped, cancelled, todo and bailed-out results", () => {
  for (const tap of [
    validTap().replace("ok 1 -", "not ok 1 -"),
    validTap().replace("ok 1 - synthetic", "ok 1 - synthetic # SKIP"),
    validTap().replace("# skipped 0", "# skipped 1"),
    validTap().replace("# cancelled 0", "# cancelled 1"),
    validTap().replace("# todo 0", "# todo 1"),
    validTap() + "Bail out! incomplete\n",
  ]) {
    assert.throws(() => assertTestSummary(tap));
  }
});

test("successful owned-server verification cleans up and passes its exact URL", async (t) => {
  await runCase(t, {
    testCode: `
      const assert = require("node:assert/strict");
      const base = new URL(process.env.PROPERTY_PROTOTYPE_BASE_URL);
      assert.equal(base.hostname, "127.0.0.1");
      assert.ok(Number(base.port) > 0);
      fetch(base + "/prototype/properties").then(response => {
        assert.equal(response.status, 200);
        console.log(process.argv[1]);
      });
    `,
  });
});

test("build absence and empty build ID fail before spawning a process", async (t) => {
  const cwd = await fixture(t);
  const options = {
    cwd,
    testCommand: command("process.exit(0)"),
    serverCommand: command('throw Error("must not start")'),
  };
  await writeFile(path.join(cwd, ".next", "BUILD_ID"), "");
  await assert.rejects(
    verifyPrototype(options),
    /production build is required/,
  );
  await rm(path.join(cwd, ".next", "BUILD_ID"));
  await assert.rejects(verifyPrototype(options), { code: "ENOENT" });
});

test("occupied port is neither contacted nor terminated", async (t) => {
  const cwd = await fixture(t);
  let contacts = 0;
  const unrelated = net.createServer(() => contacts++);
  const port = await listen(unrelated);
  t.after(() => close(unrelated));
  const marker = path.join(cwd, "must-not-start");
  await assert.rejects(
    verifyPrototype({
      cwd,
      port,
      serverCommand: command(
        `require("node:fs").writeFileSync(process.argv[1], "bad")`,
        marker,
      ),
      testCommand: command("process.exit(0)"),
      output: () => {},
    }),
    { code: "EADDRINUSE" },
  );
  assert.equal(contacts, 0);
  assert.equal(unrelated.listening, true);
  await assert.rejects(readFile(marker), { code: "ENOENT" });
});

test("startup exit fails and releases its invocation-owned process", async (t) => {
  await runCase(t, { mode: "startup-failure", error: /server exited/ });
});

test("spawn failure propagates instead of waiting for readiness", async (t) => {
  const cwd = await fixture(t);
  const port = await freePort();
  await assert.rejects(
    verifyPrototype({
      cwd,
      port,
      serverCommand: [path.join(cwd, "missing-executable")],
      testCommand: command("process.exit(0)"),
      output: () => {},
    }),
    { code: "ENOENT" },
  );
  await assertReleased(port);
});

test("missing startup announcement times out without any HTTP probe", async (t) => {
  const cwd = await runCase(t, {
    mode: "no-announcement",
    error: /readiness timed out/,
  });
  await assert.rejects(readFile(path.join(cwd, "server.pid.requests")), {
    code: "ENOENT",
  });
});

test("non-200 and hung HTTP readiness time out and clean up", async (t) => {
  for (const mode of ["http-failure", "hung-http"]) {
    await runCase(t, { mode, error: /readiness timed out/ });
  }
});

test("nonzero test exit cannot pass even with a valid summary", async (t) => {
  await runCase(t, {
    testCode: "console.log(process.argv[1]); process.exit(7);",
    error: /tests failed \(exit=7/,
  });
});

test("successful exit cannot hide skipped or malformed test results", async (t) => {
  for (const tap of [
    "",
    validTap().replace("# skipped 0", "# skipped 1"),
    "not TAP",
  ]) {
    await runCase(t, { tap, error: /Invalid prototype TAP/ });
  }
});

test("test execution timeout cleans up the running test and server", async (t) => {
  const cwd = await runCase(t, {
    testCode: `require("node:fs").writeFileSync(process.argv[2], String(process.pid)); setInterval(() => {}, 1000);`,
    testTimeoutMs: 300,
    error: /timeout/i,
  });
  const pid = Number(await readFile(path.join(cwd, "test.pid"), "utf8"));
  assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
});

test("handled abort during readiness cleans up the owned server", async (t) => {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error("synthetic interrupt")),
    300,
  );
  try {
    await runCase(t, {
      mode: "no-announcement",
      signal: controller.signal,
      error: /synthetic interrupt/,
    });
  } finally {
    clearTimeout(timer);
  }
});

test("supported platform cleanup terminates descendants, not just their parent", async (t) => {
  const cwd = await runCase(t, {
    testCode: `
      const fs = require("node:fs"), {spawn} = require("node:child_process");
      const file = process.argv[2];
      const child = spawn(process.execPath, ["-e",
        'const net=require("node:net"),fs=require("node:fs"); const s=net.createServer(); s.listen(0,"127.0.0.1",()=>fs.writeFileSync(process.argv[1],String(s.address().port)));',
        file + ".port"], {stdio:"inherit", windowsHide:true});
      process.on("SIGTERM", () => { child.kill(); child.once("close", () => process.exit()); });
      fs.writeFileSync(file, String(process.pid));
      setInterval(() => {}, 1000);
    `,
    testTimeoutMs: 700,
    error: /timeout/i,
  });
  const childPort = Number(
    await readFile(path.join(cwd, "test.pid.port"), "utf8"),
  );
  await assertReleased(childPort);
});

test(
  "POSIX cleanup escalates when the owned group ignores TERM",
  {
    skip:
      process.platform === "win32"
        ? "POSIX signals require a POSIX host."
        : false,
  },
  async (t) => {
    const cwd = await runCase(t, {
      testCode: `require("node:fs").writeFileSync(process.argv[2], String(process.pid)); process.on("SIGTERM", () => {}); setInterval(() => {}, 1000);`,
      testTimeoutMs: 300,
      error: /timeout/i,
    });
    const pid = Number(await readFile(path.join(cwd, "test.pid"), "utf8"));
    assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
  },
);

test(
  "Windows cleanup uses PID-specific taskkill on a live owned tree",
  {
    skip:
      process.platform !== "win32"
        ? "Windows taskkill requires a Windows host."
        : false,
  },
  async (t) => {
    await runCase(t, {
      testCode: "setInterval(() => {}, 1000);",
      testTimeoutMs: 300,
      error: /timeout/i,
    });
  },
);

test("CLI startup collision returns a failure exit without contacting the listener", async (t) => {
  let contacts = 0;
  const unrelated = net.createServer(() => contacts++);
  await listen(unrelated, 3108);
  t.after(() => close(unrelated));
  const child = spawn(
    process.execPath,
    [path.join(root, "scripts", "prototype", "verify.mjs")],
    { cwd: root, env: process.env, stdio: "pipe", windowsHide: true },
  );
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) child.kill();
  });
  let text = "";
  child.stdout.on("data", (data) => {
    text += data;
  });
  child.stderr.on("data", (data) => {
    text += data;
  });
  const result = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  assert.equal(result, 1);
  assert.match(text, /EADDRINUSE/);
  assert.equal(contacts, 0);
  assert.equal(unrelated.listening, true);
});

test("CLI cannot pass failed, skipped or malformed prototype results and releases port 3108", async (t) => {
  const cwd = await fixture(t);
  const npm = path.join(cwd, "synthetic-npm.cjs");
  for (const [tap, exitCode] of [
    [validTap(), 7],
    [validTap().replace("# skipped 0", "# skipped 1"), 0],
    ["malformed TAP", 0],
  ]) {
    await assertReleased(3108);
    await writeFile(
      npm,
      `
      const assert = require("node:assert/strict");
      assert.deepEqual(process.argv.slice(2), ["run", "test:prototype"]);
      assert.equal(process.env.PROPERTY_PROTOTYPE_BASE_URL, "http://127.0.0.1:3108");
      console.log(${JSON.stringify(tap)});
      process.exit(${exitCode});
    `,
    );
    const child = spawn(
      process.execPath,
      [path.join(root, "scripts", "prototype", "verify.mjs")],
      {
        cwd: root,
        env: { ...process.env, npm_execpath: npm },
        stdio: "pipe",
        windowsHide: true,
      },
    );
    t.after(() => {
      if (child.exitCode === null && child.signalCode === null)
        child.kill("SIGTERM");
    });
    let text = "";
    child.stdout.on("data", (data) => {
      text += data;
    });
    child.stderr.on("data", (data) => {
      text += data;
    });
    const result = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });
    assert.equal(result, 1);
    assert.match(text, /Prototype tests failed|Invalid prototype TAP/);
    assert.doesNotMatch(text, /Verified 15 prototype tests/);
    await assertReleased(3108);
  }
});

test(
  "CLI POSIX interruption exits nonzero and releases the owned server",
  {
    skip:
      process.platform === "win32"
        ? "Node child.kill cannot generate catchable Windows console control events; AbortSignal cleanup is tested separately."
        : false,
  },
  async (t) => {
    await assertReleased(3108);
    const child = spawn(
      process.execPath,
      [path.join(root, "scripts", "prototype", "verify.mjs")],
      {
        cwd: root,
        env: process.env,
        stdio: "pipe",
      },
    );
    t.after(() => {
      if (child.exitCode === null) child.kill("SIGTERM");
    });
    let text = "";
    child.stdout.on("data", (data) => {
      text += data;
    });
    child.stderr.on("data", (data) => {
      text += data;
    });
    const done = new Promise((resolve) => child.once("close", resolve));
    for (let attempt = 0; attempt < 200 && !/Ready in/.test(text); attempt++) {
      if (child.exitCode !== null) throw new Error(text);
      await delay(20);
    }
    assert.match(text, /Ready in/);
    child.kill("SIGINT");
    assert.equal(await done, 1);
    assert.match(text, /interrupted by SIGINT/);
    await assertReleased(3108);
  },
);

test("CI and validate wire the strict harness after build without recursion or removed checks", async () => {
  const pkg = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8"),
  );
  const workflow = await readFile(
    path.join(root, ".github", "workflows", "ci.yml"),
    "utf8",
  );
  const commands = pkg.scripts.validate.split(" && ");
  assert.deepEqual(commands, [
    "npm run sdlc:validate",
    "npm run sdlc:ai-sdlc:validate",
    "npm run sdlc:plan:validate",
    "npm run test:sdlc",
    "npm run format:check",
    "npm run lint",
    "npm run typecheck",
    "npm audit --audit-level=high",
    "npm run build",
    "npm run test:prototype-harness",
    "npm run verify:prototype",
    "npm run db:check",
    "npm run test:db:unit",
    "npm run test:db",
  ]);
  assert.equal(
    pkg.scripts["verify:prototype"],
    "node scripts/prototype/verify.mjs",
  );
  assert.equal(
    pkg.scripts["test:prototype"],
    "node --import tsx --test --test-reporter=tap test/prototype/*.test.ts",
  );
  assert.match(
    workflow,
    /run: npm run build\s+- name: Test prototype verification harness\s+run: npm run test:prototype-harness\s+- name: Verify synthetic prototype against production server\s+run: npm run verify:prototype\s+- name: Check migration history/,
  );
  assert.doesNotMatch(workflow, /continue-on-error:\s*true/);
});
