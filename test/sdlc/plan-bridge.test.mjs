import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import {
  chmod,
  copyFile,
  link,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  PROTOCOL,
  ROOT,
  SSH_KEYGEN,
  canonical,
  digest,
  loadPolicy,
  runtimeIdentity,
} from "../../scripts/sdlc/plan-approval.mjs";
import { createBridge, TOOLS } from "../../scripts/sdlc/plan-bridge.mjs";

function run(executable, args, cwd) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    shell: false,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

async function fixture(
  t,
  {
    validationExit = 0,
    readme = "# Synthetic README\n",
    missingValidate = false,
  } = {},
) {
  const workspaceRoot = await mkdtemp(
    path.join(tmpdir(), "pgjb-plan-fixture-"),
  );
  const control = await mkdtemp(path.join(tmpdir(), "pgjb-plan-control-"));
  t.after(async () => {
    await rm(workspaceRoot, { recursive: true, force: true });
    await rm(control, { recursive: true, force: true });
  });
  const stateRoot = path.join(control, "audit");
  const trustRoot = path.join(control, "trust");
  await mkdir(stateRoot);
  await mkdir(trustRoot);
  const git = (...args) => run("git", ["-C", workspaceRoot, ...args]);
  git("init", "--quiet");
  git("config", "user.name", "Synthetic fixture");
  git("config", "user.email", "synthetic@example.invalid");
  git("config", "core.autocrlf", "false");
  const before = readme;
  await writeFile(path.join(workspaceRoot, "README.md"), before);
  await writeFile(
    path.join(workspaceRoot, ".pgjb-synthetic"),
    "synthetic-only\n",
  );
  await writeFile(
    path.join(workspaceRoot, "AGENTS.md"),
    "Synthetic protected sentinel.\n",
  );
  await writeFile(
    path.join(workspaceRoot, "package.json"),
    JSON.stringify({
      private: true,
      scripts: missingValidate
        ? {}
        : { validate: `node -e "process.exit(${validationExit})"` },
    }),
  );
  if (missingValidate) {
    await writeFile(path.join(workspaceRoot, ".npmrc"), "if-present=true\n");
  }
  git("add", ".");
  git(
    "-c",
    "commit.gpgsign=false",
    "commit",
    "--quiet",
    "-m",
    "Synthetic baseline",
  );
  const policy = await loadPolicy();
  const policyPath = path.join(control, "policy.json");
  await writeFile(policyPath, canonical(policy));
  const key = path.join(control, "synthetic-key");
  run(SSH_KEYGEN, [
    "-q",
    "-t",
    "ed25519",
    "-N",
    "",
    "-C",
    "synthetic-only",
    "-f",
    key,
  ]);
  await writeFile(
    path.join(trustRoot, "allowed_signers"),
    `synthetic-owner ${(await readFile(`${key}.pub`, "utf8")).trim()}\n`,
  );
  const authority = {
    protocol: PROTOCOL,
    kind: "standing-owner-authorization",
    environment: "synthetic",
    owner: "synthetic-owner",
    repository: "synthetic-fixture",
    workspaceId: digest(workspaceRoot),
    baseSha: git("rev-parse", "HEAD"),
    policyHash: digest(policy),
    runtimeHash: await runtimeIdentity(),
    riskDefinitionsHash: digest(policy.riskDefinitions),
    grantId: policy.grant.id,
    approvedPaths: ["README.md"],
    approvedAdrs: [],
    issuedAt: new Date(Date.now() - 1000).toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    generation: 1,
    implementationAuthorized: true,
  };
  const payload = path.join(trustRoot, "authority.json");
  await writeFile(payload, canonical(authority));
  run(SSH_KEYGEN, ["-Y", "sign", "-f", key, "-n", PROTOCOL, payload]);
  await rename(`${payload}.sig`, path.join(trustRoot, "authority.sig"));
  await writeFile(
    path.join(trustRoot, "active.json"),
    JSON.stringify({
      authorityHash: digest(await readFile(payload)),
      generation: 1,
      revoked: false,
    }),
  );
  const plan = {
    protocol: PROTOCOL,
    taskId: "SYNTHETIC-001",
    revision: 1,
    request: {
      reference: "one-synthetic-owner-task",
      summary: "Clarify validation.",
    },
    requirements: [
      "Clarify existing local validation without changing commands.",
    ],
    acceptanceCriteria: [policy.grant.text],
    architecture: { summary: "Documentation only.", adrs: [] },
    changes: [
      {
        path: "README.md",
        operation: "append-clarification",
        beforeSha256: digest(before),
      },
    ],
    dependencies: [],
    impacts: Object.fromEntries(
      [
        "data",
        "authorization",
        "schema",
        "privacy",
        "provider",
        "production",
        "deployment",
        "controlPlane",
      ].map((name) => [name, "none"]),
    ),
    tests: ["readme-format", "repository-validate"],
    rollback: "Restore recorded synthetic README preimage.",
    unresolvedDecisions: [],
    riskProposal: "R1",
  };
  const config = { workspaceRoot, stateRoot, trustRoot, policyPath };
  const configPath = path.join(control, "bridge-config.json");
  await writeFile(configPath, JSON.stringify(config));
  const bridge = await createBridge({ ...config, mode: "synthetic" });
  const edit = (decision) => ({
    decisionId: decision.decisionId,
    planHash: decision.planHash,
    path: "README.md",
    beforeSha256: digest(before),
    text: `${before.trimEnd()}\n\n${policy.grant.text}\n`,
  });
  return {
    ...config,
    configPath,
    control,
    git,
    before,
    plan,
    policy,
    bridge,
    edit,
  };
}

async function clientFor(
  t,
  configPath,
  executable = process.execPath,
  env = {},
) {
  const client = new Client({
    name: "synthetic-acceptance-client",
    version: "1.0.0",
  });
  const transport = new StdioClientTransport({
    command: executable,
    args: [
      path.join(ROOT, "scripts/sdlc/plan-bridge.mjs"),
      ...(configPath ? ["--synthetic", configPath] : []),
    ],
    cwd: ROOT,
    stderr: "pipe",
    env: {
      ...(process.env.PROGRAMDATA
        ? { PROGRAMDATA: process.env.PROGRAMDATA }
        : {}),
      ...env,
    },
  });
  await client.connect(transport);
  t.after(() => client.close());
  const call = async (name, args) => {
    const result = await client.callTool({ name, arguments: args });
    return JSON.parse(result.content[0].text);
  };
  return { client, call };
}

test("default real stdio endpoint stays inactive and exposes no arbitrary execution tool", async (t) => {
  const { client, call } = await clientFor(t);
  const names = (await client.listTools()).tools.map((tool) => tool.name);
  assert.deepEqual(
    names,
    TOOLS.map((tool) => tool.name),
  );
  for (const name of [
    "evaluate_plan",
    "execute",
    "edit",
    "task",
    "other_mcp",
  ]) {
    const result = await call(name, {});
    assert.equal(result.ok, false);
    assert.equal(result.reason, "LIVE_RUNTIME_DENIAL_EVIDENCE_REQUIRED");
  }
});

test("real MCP + SSH + filesystem + validation workflow, then durable report after restart", async (t) => {
  const f = await fixture(t);
  const { client, call } = await clientFor(t, f.configPath);
  const decision = await call("evaluate_plan", { plan: f.plan });
  assert.equal(decision.decision, "AUTO_APPROVED", JSON.stringify(decision));
  assert.equal(decision.implementationPermitted, true);
  const applied = await call("apply_text_edit", f.edit(decision));
  assert.equal(applied.ok, true, JSON.stringify(applied));
  const report = await call("validate_and_report", {
    decisionId: decision.decisionId,
  });
  assert.equal(report.status, "COMPLETED", JSON.stringify(report));
  assert.equal(report.acceptance, true);
  assert.equal(report.checks[1].exitCode, 0);
  assert.equal(
    await readFile(path.join(f.workspaceRoot, "README.md"), "utf8"),
    f.edit(decision).text,
  );
  assert.equal(f.git("status", "--porcelain"), "M README.md");
  await client.close();
  const restarted = await clientFor(t, f.configPath);
  const record = await restarted.call("get_record", {
    decisionId: decision.decisionId,
  });
  assert.equal(record.report.planHash, decision.planHash);
  assert.equal(record.status, "COMPLETED");
  assert.ok(
    (await readdir(f.stateRoot)).some((name) =>
      name.endsWith(".decision.json"),
    ),
  );
  // Scripted client continuation is not a Copilot runtime/permission test.
});

for (const [name, mutate, expected] of [
  [
    "protected file",
    (args) => {
      args.path = "AGENTS.md";
    },
    /PATH_NOT_AUTHORIZED/,
  ],
  [
    "traversal",
    (args) => {
      args.path = "../README.md";
    },
    /PATH_NOT_AUTHORIZED/,
  ],
  [
    "alternate data stream",
    (args) => {
      args.path = "README.md:stream";
    },
    /PATH_NOT_AUTHORIZED/,
  ],
  [
    "case alias",
    (args) => {
      args.path = "readme.md";
    },
    /PATH_NOT_AUTHORIZED/,
  ],
  [
    "changed plan hash",
    (args) => {
      args.planHash = "c".repeat(64);
    },
    /PLAN_CHANGED/,
  ],
  [
    "unapproved text",
    (args) => {
      args.text += "Extra unapproved content.\n";
    },
    /EDIT_NOT_IN_STANDING_GRANT/,
  ],
  [
    "forged preimage",
    (args) => {
      args.beforeSha256 = "c".repeat(64);
    },
    /PREIMAGE_CHANGED/,
  ],
]) {
  test(`${name}: denied at write boundary, all tracked bytes unchanged`, async (t) => {
    const f = await fixture(t);
    const decision = await f.bridge.handle("evaluate_plan", { plan: f.plan });
    assert.equal(decision.decision, "AUTO_APPROVED", JSON.stringify(decision));
    const args = f.edit(decision);
    mutate(args);
    const result = await f.bridge.handle("apply_text_edit", args);
    assert.equal(result.ok, false);
    assert.match(result.reason, expected);
    assert.equal(f.git("status", "--porcelain"), "");
    assert.equal(
      await readFile(path.join(f.workspaceRoot, "README.md"), "utf8"),
      f.before,
    );
    const retry = await f.bridge.handle("apply_text_edit", f.edit(decision));
    assert.equal(retry.ok, false);
    assert.match(retry.reason, /DECISION_STOPPED/);
  });
}

test("missing decision and unknown tools/extra command arguments fail closed", async (t) => {
  const f = await fixture(t);
  for (const [name, args] of [
    [
      "apply_text_edit",
      f.edit({ decisionId: "f".repeat(64), planHash: "a".repeat(64) }),
    ],
    ["execute", { command: "not executed" }],
    ["evaluate_plan", { plan: f.plan, approved: true }],
  ]) {
    assert.equal((await f.bridge.handle(name, args)).ok, false);
  }
  assert.equal(f.git("status", "--porcelain"), "");
});

for (const [name, mutate, reason] of [
  [
    "modified authority",
    async (f) => {
      const file = path.join(f.trustRoot, "authority.json");
      const authority = JSON.parse(await readFile(file, "utf8"));
      authority.owner = "forged-owner";
      await writeFile(file, JSON.stringify(authority));
    },
    /INVALID_SIGNATURE/,
  ],
  [
    "changed policy",
    async (f) => {
      f.policy.riskDefinitions.R1 += " changed";
      await writeFile(f.policyPath, JSON.stringify(f.policy));
    },
    /POLICY_CHANGED/,
  ],
  [
    "changed base",
    async (f) => {
      f.git(
        "-c",
        "commit.gpgsign=false",
        "commit",
        "--allow-empty",
        "--quiet",
        "-m",
        "Synthetic base drift",
      );
    },
    /BASE_CHANGED/,
  ],
  [
    "revocation",
    async (f) => {
      const file = path.join(f.trustRoot, "active.json");
      const active = JSON.parse(await readFile(file, "utf8"));
      active.revoked = true;
      await writeFile(file, JSON.stringify(active));
    },
    /AUTHORITY_REVOKED/,
  ],
  [
    "forged stored plan",
    async (f, decision) => {
      const file = path.join(
        f.stateRoot,
        `${decision.decisionId}.decision.json`,
      );
      const record = JSON.parse(await readFile(file, "utf8"));
      record.value.plan.request.summary = "Modified plan";
      record.sha256 = digest(record.value);
      await writeFile(file, canonical(record));
    },
    /DECISION_INVALID/,
  ],
]) {
  test(`${name} invalidates prior approval before the edit`, async (t) => {
    const f = await fixture(t);
    const decision = await f.bridge.handle("evaluate_plan", { plan: f.plan });
    await mutate(f, decision);
    const result = await f.bridge.handle("apply_text_edit", f.edit(decision));
    assert.equal(result.ok, false);
    assert.match(result.reason, reason);
    assert.equal(
      await readFile(path.join(f.workspaceRoot, "README.md"), "utf8"),
      f.before,
    );
  });
}

test("audit storage failure before approval and before write cannot produce permission or edits", async (t) => {
  const f = await fixture(t);
  const decision = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  const originalAudit = path.join(f.control, "old-audit");
  await rename(f.stateRoot, originalAudit);
  await writeFile(f.stateRoot, "Synthetic storage failure");
  const result = await f.bridge.handle("apply_text_edit", f.edit(decision));
  assert.equal(result.ok, false);
  assert.match(result.reason, /AUDIT_FAILURE/);
  assert.equal(
    (await f.bridge.handle("evaluate_plan", { plan: f.plan })).ok,
    false,
  );
  assert.equal(f.git("status", "--porcelain"), "");
});

test("interrupted durable write intent requires recovery after restart", async (t) => {
  const f = await fixture(t);
  const decision = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  const value = {
    decisionId: decision.decisionId,
    beforeSha256: digest(f.before),
  };
  await writeFile(
    path.join(f.stateRoot, `${decision.decisionId}.intent.json`),
    canonical({ value, sha256: digest(value) }),
  );
  const restarted = await createBridge({ ...f, mode: "synthetic" });
  assert.equal(
    (
      await restarted.handle("get_record", {
        decisionId: decision.decisionId,
      })
    ).status,
    "RECOVERY_REQUIRED",
  );
  const result = await restarted.handle("apply_text_edit", f.edit(decision));
  assert.equal(result.ok, false);
  assert.match(result.reason, /RECOVERY_REQUIRED/);
  assert.equal(f.git("status", "--porcelain"), "");
});

test("hardlinked README cannot mutate its external target", async (t) => {
  const f = await fixture(t);
  const decision = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  const target = path.join(f.control, "external-sentinel");
  const readme = path.join(f.workspaceRoot, "README.md");
  await rename(readme, target);
  await link(target, readme);
  const result = await f.bridge.handle("apply_text_edit", f.edit(decision));
  assert.equal(result.ok, false);
  assert.match(result.reason, /UNSAFE_FILE/);
  assert.equal(await readFile(target, "utf8"), f.before);
});

test("untracked or indexed scope changes are preserved, not reset", async (t) => {
  const f = await fixture(t);
  const decision = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  await writeFile(path.join(f.workspaceRoot, "unrelated.txt"), "preserve me");
  const result = await f.bridge.handle("apply_text_edit", f.edit(decision));
  assert.equal(result.ok, false);
  assert.match(result.reason, /UNTRACKED_SCOPE_CHANGE/);
  assert.equal(
    await readFile(path.join(f.workspaceRoot, "unrelated.txt"), "utf8"),
    "preserve me",
  );
});

test("failed actual validation never claims completion", async (t) => {
  const f = await fixture(t, { validationExit: 7 });
  const decision = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  assert.equal(
    (await f.bridge.handle("apply_text_edit", f.edit(decision))).ok,
    true,
  );
  const result = await f.bridge.handle("validate_and_report", {
    decisionId: decision.decisionId,
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, "VALIDATION_FAILED");
  assert.equal(result.checks[1].exitCode, 7);
  const record = await f.bridge.handle("get_record", {
    decisionId: decision.decisionId,
  });
  assert.equal(record.status, "VALIDATION_FAILED");
});

test("synthetic mode cannot admit the actual repository, regardless of claimed tool restrictions", async () => {
  await assert.rejects(
    () =>
      createBridge({
        mode: "synthetic",
        workspaceRoot: ROOT,
        stateRoot: ROOT,
        trustRoot: ROOT,
        bypassDenied: true,
      }),
    /SYNTHETIC_ROOT_REQUIRED/,
  );
  await assert.rejects(
    () =>
      createBridge({
        mode: "live",
        workspaceRoot: ROOT,
        stateRoot: ROOT,
        trustRoot: ROOT,
        bypassDenied: true,
      }),
    /LIVE_RUNTIME_DENIAL_EVIDENCE_REQUIRED/,
  );
});

test("small append cannot hide removal of pre-existing trailing lines", async (t) => {
  const f = await fixture(t, {
    readme: `# Synthetic README\n${"\n".repeat(40)}`,
  });
  const decision = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  const result = await f.bridge.handle("apply_text_edit", f.edit(decision));
  assert.equal(result.ok, false);
  assert.equal(
    await readFile(path.join(f.workspaceRoot, "README.md"), "utf8"),
    f.before,
  );
});

test("exact repeated edit is idempotent and cannot apply the clarification twice", async (t) => {
  const f = await fixture(t);
  const decision = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  const args = f.edit(decision);
  const first = await f.bridge.handle("apply_text_edit", args);
  const second = await f.bridge.handle("apply_text_edit", args);
  assert.equal(first.ok, true);
  assert.equal(second.idempotent, true);
  assert.equal(
    await readFile(path.join(f.workspaceRoot, "README.md"), "utf8"),
    args.text,
  );
});

test("index changes stop implementation and preserve staged work", async (t) => {
  const f = await fixture(t);
  const decision = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  await writeFile(
    path.join(f.workspaceRoot, "AGENTS.md"),
    "Changed synthetic sentinel.\n",
  );
  f.git("add", "AGENTS.md");
  const result = await f.bridge.handle("apply_text_edit", f.edit(decision));
  assert.equal(result.ok, false);
  assert.equal(f.git("diff", "--cached", "--name-only"), "AGENTS.md");
  assert.equal(
    await readFile(path.join(f.workspaceRoot, "README.md"), "utf8"),
    f.before,
  );
});

test("review regression: malformed UTF-8 is rejected without rewriting original bytes", async (t) => {
  const bytes = Buffer.from([0x23, 0x20, 0xe9, 0x0a]);
  const f = await fixture(t, { readme: bytes });
  const result = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  assert.equal(result.ok, false);
  assert.match(result.reason, /NON_UTF8_README/);
  assert.deepEqual(
    await readFile(path.join(f.workspaceRoot, "README.md")),
    bytes,
  );
  assert.equal(f.git("status", "--porcelain"), "");
});

test("review regression: another existing permit cannot bypass pending journal recovery", async (t) => {
  const f = await fixture(t);
  const first = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  const second = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  assert.equal(first.decision, "AUTO_APPROVED");
  assert.equal(second.decision, "AUTO_APPROVED");
  const value = {
    decisionId: first.decisionId,
    beforeSha256: digest(f.before),
  };
  await writeFile(
    path.join(f.stateRoot, `${first.decisionId}.intent.json`),
    canonical({ value, sha256: digest(value) }),
  );
  const restarted = await createBridge({ ...f, mode: "synthetic" });
  const result = await restarted.handle("apply_text_edit", f.edit(second));
  assert.equal(result.ok, false);
  assert.match(result.reason, /RECOVERY_REQUIRED/);
  assert.equal(
    await readFile(path.join(f.workspaceRoot, "README.md"), "utf8"),
    f.before,
  );
});

test("review regression: npm if-present cannot turn missing validation into completion", async (t) => {
  const f = await fixture(t, { missingValidate: true });
  const decision = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  assert.equal(
    (await f.bridge.handle("apply_text_edit", f.edit(decision))).ok,
    true,
  );
  const result = await f.bridge.handle("validate_and_report", {
    decisionId: decision.decisionId,
  });
  assert.equal(result.ok, false);
  assert.match(result.reason, /VALIDATION_SCRIPT_MISSING/);
  const record = await f.bridge.handle("get_record", {
    decisionId: decision.decisionId,
  });
  assert.notEqual(record.report?.status, "COMPLETED");
});

test("review regression: JSON-expanded audit records remain readable and usable", async (t) => {
  const f = await fixture(t, { readme: "\\".repeat(140000) });
  const decision = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  assert.equal(decision.decision, "AUTO_APPROVED");
  const record = await f.bridge.handle("get_record", {
    decisionId: decision.decisionId,
  });
  assert.equal(record.ok, true, JSON.stringify(record));
  assert.equal(record.status, "DECIDED");
  const result = await f.bridge.handle("apply_text_edit", f.edit(decision));
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(
    await readFile(path.join(f.workspaceRoot, "README.md"), "utf8"),
    f.edit(decision).text,
  );
});

test("review regression: oversized serialized audit refuses a permit before writing a record", async (t) => {
  const f = await fixture(t, { readme: "\u0000".repeat(210000) });
  const result = await f.bridge.handle("evaluate_plan", { plan: f.plan });
  assert.equal(result.ok, false);
  assert.match(result.reason, /AUDIT_RECORD_TOO_LARGE/);
  assert.deepEqual(await readdir(f.stateRoot), []);
  assert.equal(f.git("status", "--porcelain"), "");
});

test("publication regression: JSON-expanded postimage cannot receive an unusable permit", async (t) => {
  const f = await fixture(t, { readme: "\\".repeat(262000) });
  const { call } = await clientFor(t, f.configPath);
  const decision = await call("evaluate_plan", { plan: f.plan });
  const edit = f.edit({
    decisionId: "a".repeat(64),
    planHash: digest(f.plan),
  });
  assert.ok(Buffer.byteLength(edit.text) < 262144);
  assert.ok(Buffer.byteLength(canonical(edit)) > 524288);
  assert.equal(decision.ok, false, JSON.stringify(decision));
  assert.match(decision.reason, /INPUT_TOO_LARGE/);
  assert.deepEqual(await readdir(f.stateRoot), []);
  assert.equal(f.git("status", "--porcelain"), "");
  assert.equal(
    await readFile(path.join(f.workspaceRoot, "README.md"), "utf8"),
    f.before,
  );
});

async function npmInstallation(f, layout) {
  const prefix = path.join(f.control, "node installation & no shell");
  const executable = path.join(
    prefix,
    ...(layout === "windows" ? [] : ["bin"]),
    process.platform === "win32" ? "node.exe" : "node",
  );
  const relative =
    layout === "windows"
      ? ["node_modules", "npm", "bin", "npm-cli.js"]
      : layout === "linux"
        ? ["lib", "node_modules", "npm", "bin", "npm-cli.js"]
        : ["share", "nodejs", "npm", "bin", "npm-cli.js"];
  const cli = path.join(prefix, ...relative);
  await mkdir(path.dirname(executable), { recursive: true });
  await copyFile(process.execPath, executable);
  await chmod(executable, 0o700);
  await mkdir(path.dirname(cli), { recursive: true });
  // The installation layout is simulated; stdio and the child process are real.
  await writeFile(
    cli,
    [
      'const assert = require("node:assert/strict");',
      'assert.deepEqual(process.argv.slice(2), ["--if-present=false", "run", "validate"]);',
      'for (const key of ["npm_execpath", "NODE_OPTIONS", "NODE_PATH", "PGJB_UNTRUSTED_TEST"]) {',
      "  assert.equal(process.env[key], undefined);",
      "}",
      'assert.equal(require("node:fs").existsSync("package.json"), true);',
    ].join("\n"),
  );
  return { executable, cli };
}

for (const layout of ["windows", "linux", "linux-system"]) {
  test(`publication regression: ${layout} npm layout works through sanitized real stdio`, async (t) => {
    const f = await fixture(t);
    const { executable } = await npmInstallation(f, layout);
    const { client, call } = await clientFor(t, f.configPath, executable, {
      PGJB_UNTRUSTED_TEST: "must-not-reach-validation",
    });
    try {
      const decision = await call("evaluate_plan", { plan: f.plan });
      assert.equal(
        decision.decision,
        "AUTO_APPROVED",
        JSON.stringify(decision),
      );
      assert.equal((await call("apply_text_edit", f.edit(decision))).ok, true);
      const report = await call("validate_and_report", {
        decisionId: decision.decisionId,
      });
      assert.equal(report.status, "COMPLETED", JSON.stringify(report));
      assert.equal(report.checks[1].exitCode, 0);
    } finally {
      await client.close();
    }
  });
}

for (const variant of [
  "environment override",
  "missing CLI",
  "linked package",
]) {
  test(`publication regression: npm ${variant} cannot select an untrusted executable`, async (t) => {
    const f = await fixture(t);
    const { executable, cli } = await npmInstallation(f, "linux");
    const decoy = path.join(f.control, "untrusted-npm-cli.js");
    const marker = path.join(f.control, "untrusted-executed");
    await writeFile(
      decoy,
      `require("node:fs").writeFileSync(${JSON.stringify(marker)}, "executed"); process.exit(97);`,
    );
    if (variant === "missing CLI") await rm(cli);
    if (variant === "linked package") {
      const packageRoot = path.dirname(path.dirname(cli));
      const outside = path.join(f.control, "external-npm");
      await rename(packageRoot, outside);
      await symlink(
        outside,
        packageRoot,
        process.platform === "win32" ? "junction" : "dir",
      );
    }
    const { client, call } = await clientFor(t, f.configPath, executable, {
      npm_execpath: decoy,
      PGJB_UNTRUSTED_TEST: "must-not-reach-validation",
    });
    try {
      const decision = await call("evaluate_plan", { plan: f.plan });
      assert.equal(
        decision.decision,
        "AUTO_APPROVED",
        JSON.stringify(decision),
      );
      assert.equal((await call("apply_text_edit", f.edit(decision))).ok, true);
      const report = await call("validate_and_report", {
        decisionId: decision.decisionId,
      });
      if (variant === "environment override") {
        assert.equal(report.status, "COMPLETED", JSON.stringify(report));
      } else {
        assert.equal(report.ok, false);
        assert.equal(report.status, "BLOCKED");
        assert.match(
          report.reason,
          variant === "missing CLI"
            ? /NPM_EXECUTABLE_UNAVAILABLE/
            : /PATH_ESCAPE/,
        );
        const record = await call("get_record", {
          decisionId: decision.decisionId,
        });
        assert.notEqual(record.report?.status, "COMPLETED");
      }
      assert.equal(
        (await readdir(f.control)).includes(path.basename(marker)),
        false,
      );
    } finally {
      await client.close();
    }
  });
}

for (const encoding of ["ASCII", "UTF-8"]) {
  for (const offset of [-1, 0, 1]) {
    test(`publication regression: ${encoding} postimage at byte limit ${offset}`, async (t) => {
      const policy = await loadPolicy();
      const suffix = `\n${policy.grant.text}\n`;
      const bodyBytes = 262144 + offset - Buffer.byteLength(suffix) - 1;
      const body =
        encoding === "ASCII"
          ? "x".repeat(bodyBytes)
          : "\u00e9".repeat(Math.floor(bodyBytes / 2)) +
            "x".repeat(bodyBytes % 2);
      const f = await fixture(t, { readme: `${body}\n` });
      const { call } = await clientFor(t, f.configPath);
      const decision = await call("evaluate_plan", { plan: f.plan });
      assert.equal(Buffer.byteLength(f.edit(decision).text), 262144 + offset);
      if (offset > 0) {
        assert.equal(decision.ok, false, JSON.stringify(decision));
        assert.match(decision.reason, /POSTIMAGE_TOO_LARGE/);
        assert.deepEqual(await readdir(f.stateRoot), []);
        assert.equal(f.git("status", "--porcelain"), "");
        assert.equal(
          await readFile(path.join(f.workspaceRoot, "README.md"), "utf8"),
          f.before,
        );
        return;
      }
      assert.equal(
        decision.decision,
        "AUTO_APPROVED",
        JSON.stringify(decision),
      );
      const edit = f.edit(decision);
      assert.equal((await call("apply_text_edit", edit)).ok, true);
      const report = await call("validate_and_report", {
        decisionId: decision.decisionId,
      });
      assert.equal(report.status, "COMPLETED", JSON.stringify(report));
      assert.equal(report.acceptance, true);
      assert.equal(
        (await readFile(path.join(f.workspaceRoot, "README.md"))).length,
        262144 + offset,
      );
      assert.equal((await call("apply_text_edit", edit)).idempotent, true);
      const expanded = { ...edit, text: `${edit.text}extra\n` };
      assert.equal((await call("apply_text_edit", expanded)).ok, false);
      assert.equal(
        await readFile(path.join(f.workspaceRoot, "README.md"), "utf8"),
        edit.text,
      );
    });
  }
}
