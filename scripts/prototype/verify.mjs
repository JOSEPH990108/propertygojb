import { spawn } from "node:child_process";
import console from "node:console";
import { readFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, URL } from "node:url";

export const EXPECTED_TEST_COUNT = 15;
const { AbortController, AbortSignal, fetch } = globalThis;
const root = fileURLToPath(new URL("../../", import.meta.url));
const outputLimit = 1024 * 1024;

export function assertTestSummary(tap) {
  const lines = tap.replaceAll("\r", "").split("\n");
  const exact = (pattern, expected, label) => {
    const matches = lines.filter((line) => pattern.test(line));
    if (matches.length !== 1 || matches[0] !== expected) {
      throw new Error(`Invalid prototype TAP ${label}; expected ${expected}.`);
    }
  };
  exact(/^TAP version\b/, "TAP version 13", "version");
  exact(/^\d+\.\./, `1..${EXPECTED_TEST_COUNT}`, "plan");
  for (const [name, count] of Object.entries({
    tests: EXPECTED_TEST_COUNT,
    pass: EXPECTED_TEST_COUNT,
    fail: 0,
    cancelled: 0,
    skipped: 0,
    todo: 0,
  })) {
    exact(new RegExp(`^# ${name}\\b`), `# ${name} ${count}`, name);
  }
  const results = lines.filter((line) => /^(?:not )?ok\b/.test(line));
  if (
    results.length !== EXPECTED_TEST_COUNT ||
    results.some(
      (line, index) =>
        !new RegExp(`^ok ${index + 1} - .+`).test(line) ||
        /#\s*(?:SKIP|TODO)\b/i.test(line),
    ) ||
    lines.some((line) => /^\s*(?:not ok\b|Bail out!)/i.test(line))
  ) {
    throw new Error("Prototype TAP results are incomplete, failed or skipped.");
  }
}

async function assertPortFree(port) {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen({ host: "127.0.0.1", port, exclusive: true }, resolve);
  });
  await new Promise((resolve, reject) =>
    probe.close((error) => (error ? reject(error) : resolve())),
  );
}

function startProcess(command, { cwd, env, output }) {
  const child = spawn(command[0], command.slice(1), {
    cwd,
    env,
    shell: false,
    detached: process.platform !== "win32",
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const state = {
    child,
    stdout: "",
    exited: false,
    closed: false,
    error: undefined,
  };
  state.done = new Promise((resolve) => {
    child.once("error", (error) => {
      state.error = error;
    });
    child.once("exit", () => {
      state.exited = true;
    });
    child.once("close", (code, signal) => {
      state.closed = true;
      resolve({ code, signal, error: state.error });
    });
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (text) => {
    if (state.stdout.length + text.length > outputLimit) {
      state.error = new Error(
        "Prototype subprocess exceeded its output limit.",
      );
    } else {
      state.stdout += text;
    }
    output(text);
  });
  child.stderr.on("data", output);
  return state;
}

function assertRunning(state) {
  if (state.error) throw state.error;
  if (state.exited || state.closed) {
    throw new Error(
      `Prototype server exited before verification completed (${state.child.exitCode ?? state.child.signalCode}).`,
    );
  }
}

function signalGroup(pid, signal) {
  try {
    process.kill(-pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

async function waitForClose(state, timeoutMs) {
  let timer;
  try {
    await Promise.race([
      state.done,
      new Promise((resolve, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `Owned PID ${state.child.pid} did not close after cleanup.`,
              ),
            ),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function stopProcessTree(state, timeoutMs = 5000) {
  const pid = state.child.pid;
  if (!pid) {
    await state.done;
    return;
  }
  if (process.platform === "win32") {
    // Windows signals do not terminate descendants; target only our PID tree.
    if (!state.closed) {
      const killer = spawn(
        path.join(process.env.SystemRoot, "System32", "taskkill.exe"),
        ["/PID", String(pid), "/T", "/F"],
        { shell: false, windowsHide: true, stdio: "ignore" },
      );
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          killer.kill();
          reject(new Error(`Cleanup timed out for owned PID ${pid}.`));
        }, timeoutMs);
        killer.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
        killer.once("close", (code) => {
          clearTimeout(timer);
          resolve(code);
        });
      });
      if (result !== 0 && !state.closed) {
        throw new Error(`Windows tree cleanup failed for owned PID ${pid}.`);
      }
    }
  } else {
    // Each spawned command owns a separate POSIX process group.
    signalGroup(pid, "SIGTERM");
    await Promise.race([state.done, delay(Math.min(timeoutMs, 500))]);
    signalGroup(pid, "SIGKILL");
  }
  await waitForClose(state, timeoutMs);
}

async function waitForReadiness(server, base, timeoutMs, signal) {
  const deadline = Date.now() + timeoutMs;
  let lastResponse = "server has not announced readiness";
  while (Date.now() < deadline) {
    signal.throwIfAborted();
    assertRunning(server);
    // Do not contact a listener that won the preflight/startup port race.
    if (/\bReady in\b/.test(server.stdout)) {
      try {
        const response = await fetch(`${base}/prototype/properties`, {
          redirect: "error",
          signal: AbortSignal.any([
            signal,
            AbortSignal.timeout(
              Math.max(1, Math.min(2000, deadline - Date.now())),
            ),
          ]),
        });
        await response.body?.cancel();
        assertRunning(server);
        if (response.status === 200) return;
        lastResponse = `HTTP ${response.status}`;
      } catch (error) {
        signal.throwIfAborted();
        assertRunning(server);
        lastResponse = error.message;
      }
    }
    await delay(Math.min(100, Math.max(1, deadline - Date.now())), undefined, {
      signal,
    });
  }
  throw new Error(`Prototype readiness timed out: ${lastResponse}.`);
}

export async function verifyPrototype({
  cwd = root,
  port = 3108,
  startupTimeoutMs = 30000,
  testTimeoutMs = 120000,
  cleanupTimeoutMs = 5000,
  signal = new AbortController().signal,
  output = (text) => process.stdout.write(text),
  serverCommand = [
    process.execPath,
    path.join(cwd, "node_modules", "next", "dist", "bin", "next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  testCommand,
} = {}) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Prototype verification requires a valid dedicated port.");
  }
  const buildId = await readFile(path.join(cwd, ".next", "BUILD_ID"), "utf8");
  if (!buildId.trim())
    throw new Error("A successful production build is required.");
  if (!testCommand) {
    if (!process.env.npm_execpath) {
      throw new Error("Run this harness through npm run verify:prototype.");
    }
    testCommand = [
      process.execPath,
      process.env.npm_execpath,
      "run",
      "test:prototype",
    ];
  }
  signal.throwIfAborted();
  await assertPortFree(port);
  const base = `http://127.0.0.1:${port}`;
  const environment = { ...process.env, PROPERTY_PROTOTYPE_BASE_URL: base };
  const processes = [];
  const cleanupErrors = [];
  let failure;
  try {
    const server = startProcess(serverCommand, {
      cwd,
      env: environment,
      output,
    });
    processes.push(server);
    await waitForReadiness(server, base, startupTimeoutMs, signal);
    const tests = startProcess(testCommand, { cwd, env: environment, output });
    processes.push(tests);
    const abort = AbortSignal.any([signal, AbortSignal.timeout(testTimeoutMs)]);
    const result = await new Promise((resolve, reject) => {
      const onAbort = () => reject(abort.reason);
      abort.addEventListener("abort", onAbort, { once: true });
      tests.done.then((value) => {
        abort.removeEventListener("abort", onAbort);
        resolve(value);
      });
      if (abort.aborted) onAbort();
    });
    assertRunning(server);
    if (result.error || tests.error) throw result.error ?? tests.error;
    if (result.code !== 0 || result.signal) {
      throw new Error(
        `Prototype tests failed (exit=${result.code}, signal=${result.signal}).`,
      );
    }
    assertTestSummary(tests.stdout);
  } catch (error) {
    failure = signal.aborted ? signal.reason : error;
  } finally {
    for (const state of processes.reverse()) {
      try {
        await stopProcessTree(state, cleanupTimeoutMs);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
  }
  if (cleanupErrors.length) {
    throw new AggregateError(
      failure ? [failure, ...cleanupErrors] : cleanupErrors,
      "Prototype verification or owned-process cleanup failed.",
    );
  }
  if (failure) throw failure;
  signal.throwIfAborted();
  output(
    `Verified ${EXPECTED_TEST_COUNT} prototype tests; zero skips; owned processes cleaned up.\n`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const controller = new AbortController();
  const onSignal = (signal) =>
    controller.abort(
      new Error(`Prototype verification interrupted by ${signal}.`),
    );
  const handlers = new Map(
    [
      "SIGINT",
      "SIGTERM",
      ...(process.platform === "win32" ? ["SIGBREAK"] : []),
    ].map((signal) => {
      const handler = () => onSignal(signal);
      process.on(signal, handler);
      return [signal, handler];
    }),
  );
  try {
    await verifyPrototype({ signal: controller.signal });
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    for (const [signal, handler] of handlers) process.off(signal, handler);
  }
}
