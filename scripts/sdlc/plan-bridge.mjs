import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { realpathSync, statSync } from "node:fs";
import {
  lstat,
  open,
  opendir,
  readdir,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Ajv2020 from "ajv/dist/2020.js";
import { check as checkFormatting } from "prettier";
import {
  PROTOCOL,
  PLAN_SCHEMA,
  POLICY_PATH,
  PlanError,
  activationStatus,
  canonical,
  digest,
  evaluatePlan,
  loadPolicy,
  operationContract,
  readBounded,
  readJson,
  requireCondition,
  runtimeIdentity,
  taskReference,
  verifyTaskIntent,
  verifyStandingAuthority,
} from "./plan-approval.mjs";

const idSchema = { type: "string", pattern: "^[a-f0-9]{64}$" };
const MAX_AUDIT_BYTES = 1024 * 1024;
const MAX_README_BYTES = 262144;
const MAX_TOOL_INPUT_BYTES = 524288;
const MAX_AUDIT_TOTAL_BYTES = 64 * 1024 * 1024;
const MAX_AUDIT_RECORDS = 1024;
const AUDIT_KINDS = ["decision", "intent", "applied", "report", "stopped"];
const input = (properties) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});
export const TOOLS = [
  {
    name: "evaluate_plan",
    description:
      "Evaluate a structured plan; this candidate permits synthetic fixtures only.",
    inputSchema: input({ plan: PLAN_SCHEMA }),
  },
  {
    name: "apply_text_edit",
    description:
      "Apply only the exact signed clarification after write-boundary revalidation.",
    inputSchema: input({
      decisionId: idSchema,
      planHash: idSchema,
      path: { type: "string", minLength: 1, maxLength: 512 },
      beforeSha256: idSchema,
      text: { type: "string", maxLength: MAX_README_BYTES },
    }),
  },
  {
    name: "validate_and_report",
    description:
      "Run fixed validation and persist the actual result; accepts no commands.",
    inputSchema: input({ decisionId: idSchema }),
  },
  {
    name: "get_record",
    description: "Read a decision and its durable implementation report.",
    inputSchema: input({ decisionId: idSchema }),
  },
];
const ajv = new Ajv2020({ strict: true, allErrors: true });
const toolValidators = new Map(
  TOOLS.map((tool) => [tool.name, ajv.compile(tool.inputSchema)]),
);
function requireInputSize(args) {
  requireCondition(
    Buffer.byteLength(canonical(args)) <= MAX_TOOL_INPUT_BYTES,
    "INPUT_TOO_LARGE",
  );
}

function serializeAudit(value) {
  const serialized = canonical({ value, sha256: digest(value) });
  requireCondition(
    Buffer.byteLength(serialized) <= MAX_AUDIT_BYTES,
    "AUDIT_RECORD_TOO_LARGE",
  );
  return serialized;
}

function decisionIdentity(binding) {
  const identity = { ...binding };
  delete identity.nonce;
  delete identity.issuedAt;
  delete identity.expiresAt;
  return digest(identity);
}

const childEnvironment = () => ({
  ...Object.fromEntries(
    [
      "PATH",
      "Path",
      "SystemRoot",
      "TEMP",
      "TMP",
      "HOME",
      "USERPROFILE",
      "APPDATA",
      "LOCALAPPDATA",
    ]
      .filter((key) => process.env[key] !== undefined)
      .map((key) => [key, process.env[key]]),
  ),
  GIT_TERMINAL_PROMPT: "0",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
  npm_config_update_notifier: "false",
});

export function resolveGit() {
  for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!path.isAbsolute(directory)) continue;
    const candidate = path.join(
      directory,
      process.platform === "win32" ? "git.exe" : "git",
    );
    try {
      if (statSync(candidate).isFile()) return realpathSync(candidate);
    } catch (error) {
      if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error;
    }
  }
  throw new PlanError("GIT_EXECUTABLE_UNAVAILABLE");
}

function git(root, args) {
  const executable = resolveGit();
  requireCondition(!contains(root, executable), "GIT_INSIDE_WORKSPACE");
  const result = spawnSync(
    executable,
    [
      "-c",
      "core.fsmonitor=false",
      "-c",
      "core.untrackedCache=false",
      "-C",
      root,
      ...args,
    ],
    {
      encoding: "utf8",
      timeout: 10000,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
      shell: false,
      env: childEnvironment(),
    },
  );
  requireCondition(
    !result.error && result.status === 0,
    "GIT_STATE_UNAVAILABLE",
  );
  return result.stdout;
}

function contains(parent, child) {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

async function directory(root) {
  const stat = await lstat(root);
  requireCondition(
    stat.isDirectory() &&
      !stat.isSymbolicLink() &&
      (await realpath(root)) === root,
    "UNSAFE_DIRECTORY",
  );
}

async function regularPath(root, relative) {
  requireCondition(
    !relative.includes("\\") &&
      !relative.includes(":") &&
      !relative.startsWith("/") &&
      relative
        .split("/")
        .every(
          (part) =>
            part && part !== "." && part !== ".." && !/[. ]$/.test(part),
        ),
    "UNSAFE_PATH",
  );
  let current = root;
  for (const part of relative.split("/")) {
    requireCondition(
      (await readdir(current)).includes(part),
      "PATH_ALIAS_OR_MISSING",
    );
    current = path.join(current, part);
    const stat = await lstat(current);
    requireCondition(
      !stat.isSymbolicLink() && contains(root, await realpath(current)),
      "PATH_ESCAPE",
    );
  }
  const stat = await lstat(current);
  requireCondition(stat.isFile() && stat.nlink === 1, "UNSAFE_FILE");
  return current;
}

async function snapshot(root) {
  await directory(root);
  requireCondition(
    git(root, ["remote"]).trim() === "",
    "SYNTHETIC_REMOTE_FORBIDDEN",
  );
  requireCondition(
    git(root, ["ls-files", "--others", "--exclude-standard", "-z"]) === "",
    "UNTRACKED_SCOPE_CHANGE",
  );
  requireCondition(
    git(root, [
      "ls-files",
      "--others",
      "--ignored",
      "--exclude-standard",
      "-z",
    ]) === "",
    "IGNORED_SCOPE_CHANGE",
  );
  git(root, ["diff", "--cached", "--quiet", "HEAD", "--"]);
  const entries = git(root, ["ls-files", "--stage", "-z"])
    .split("\0")
    .filter(Boolean);
  const files = Object.create(null);
  const modes = Object.create(null);
  for (const entry of entries) {
    const match = /^(100644|100755) [a-f0-9]{40} 0\t(.+)$/.exec(entry);
    requireCondition(match, "UNSUPPORTED_GIT_ENTRY");
    const file = await regularPath(root, match[2]);
    const permissions = (await lstat(file)).mode & 0o7777;
    requireCondition((permissions & 0o7000) === 0, "UNSUPPORTED_FILE_MODE");
    files[match[2]] = digest(await readBounded(file, 1024 * 1024));
    modes[match[2]] = { git: match[1], permissions };
  }
  return { baseSha: git(root, ["rev-parse", "HEAD"]).trim(), files, modes };
}

async function exists(file) {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function resolveNpm() {
  const nodeExecutable = await realpath(process.execPath);
  const nodeDirectory = path.dirname(nodeExecutable);
  const installations = [[nodeDirectory, "node_modules/npm/bin/npm-cli.js"]];
  if (path.basename(nodeDirectory) === "bin") {
    const prefix = path.dirname(nodeDirectory);
    installations.push(
      [prefix, "lib/node_modules/npm/bin/npm-cli.js"],
      [prefix, "share/nodejs/npm/bin/npm-cli.js"],
    );
  }
  for (const [root, relative] of installations) {
    if (!(await exists(path.join(root, relative)))) continue;
    const npmCli = await regularPath(root, relative);
    await readBounded(npmCli);
    return { nodeExecutable, npmCli };
  }
  throw new PlanError("NPM_EXECUTABLE_UNAVAILABLE");
}

function failure(error) {
  return error instanceof PlanError
    ? error.code
    : `BRIDGE_IO_FAILURE:${error.code ?? "UNKNOWN"}`;
}

export async function createBridge({
  mode = "inactive",
  workspaceRoot,
  stateRoot,
  trustRoot,
  policyPath = POLICY_PATH,
  task,
  runtimeBinding = null,
  verifyRuntime,
}) {
  requireCondition(
    activationStatus(mode).enabled,
    "LIVE_RUNTIME_DENIAL_EVIDENCE_REQUIRED",
  );
  const root = await realpath(workspaceRoot);
  const temporaryRoot = await realpath(tmpdir());
  requireCondition(
    path.dirname(root) === temporaryRoot &&
      path.basename(root).startsWith("pgjb-plan-fixture-"),
    "SYNTHETIC_ROOT_REQUIRED",
  );
  await directory(root);
  await directory(path.join(root, ".git"));
  requireCondition(
    (await readBounded(path.join(root, ".pgjb-synthetic"))).toString("utf8") ===
      "synthetic-only\n",
    "SYNTHETIC_MARKER_REQUIRED",
  );
  const state = await realpath(stateRoot);
  const trust = await realpath(trustRoot);
  for (const outer of [state, trust]) {
    await directory(outer);
    requireCondition(
      !contains(root, outer) && !contains(outer, root),
      "TRUST_INSIDE_WORKSPACE",
    );
  }
  requireCondition(
    !contains(state, trust) && !contains(trust, state),
    "AUDIT_TRUST_OVERLAP",
  );
  requireCondition(
    !contains(root, await realpath(policyPath)),
    "POLICY_INSIDE_WORKSPACE",
  );
  const workspaceId = digest(root);
  let busy = false;
  const auditPath = (id, kind) => path.join(state, `${id}.${kind}.json`);
  const lockPath = path.join(state, ".bridge.lock");

  async function auditEntries() {
    await directory(state);
    const entries = new Map();
    let bytes = 0;
    for await (const entry of await opendir(state)) {
      if (entry.name === ".bridge.lock") continue;
      const match = /^([a-f0-9]{64})\.([a-z]+)\.json$/.exec(entry.name);
      requireCondition(
        match && AUDIT_KINDS.includes(match[2]),
        "AUDIT_INTEGRITY_FAILED",
      );
      const stat = await lstat(path.join(state, entry.name));
      requireCondition(
        stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1,
        "UNSAFE_FILE",
      );
      requireCondition(stat.size <= MAX_AUDIT_BYTES, "AUDIT_RECORD_TOO_LARGE");
      entries.set(entry.name, stat.size);
      bytes += stat.size;
      requireCondition(
        entries.size <= MAX_AUDIT_RECORDS && bytes <= MAX_AUDIT_TOTAL_BYTES,
        "AUDIT_QUOTA_EXCEEDED",
      );
    }
    return entries;
  }

  function requireAuditCapacity(entries) {
    const groups = new Map();
    let bytes = 0;
    let records = entries.size;
    for (const [name, size] of entries) {
      bytes += size;
      const [id, kind] = name.split(".");
      if (!groups.has(id)) groups.set(id, new Set());
      groups.get(id).add(kind);
    }
    for (const kinds of groups.values()) {
      requireCondition(kinds.has("decision"), "AUDIT_INTEGRITY_FAILED");
      const pending = kinds.has("stopped")
        ? []
        : kinds.has("report")
          ? ["stopped"]
          : ["intent", "applied", "report", "stopped"];
      for (const kind of pending) {
        if (kinds.has(kind)) continue;
        bytes += MAX_AUDIT_BYTES;
        records++;
      }
    }
    requireCondition(
      bytes <= MAX_AUDIT_TOTAL_BYTES && records <= MAX_AUDIT_RECORDS,
      "AUDIT_QUOTA_EXCEEDED",
    );
  }

  async function audit(id, kind, value) {
    const serialized = serializeAudit(value);
    const entries = await auditEntries();
    const name = `${id}.${kind}.json`;
    requireCondition(!entries.has(name), "AUDIT_RECORD_EXISTS");
    entries.set(name, Buffer.byteLength(serialized));
    requireAuditCapacity(entries);
    const handle = await open(auditPath(id, kind), "wx", 0o600);
    try {
      await handle.writeFile(serialized, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  async function readAudit(id, kind) {
    await directory(state);
    const file = auditPath(id, kind);
    if (!(await exists(file))) return null;
    const record = await readJson(file, MAX_AUDIT_BYTES);
    requireCondition(
      record &&
        Object.keys(record).sort().join(",") === "sha256,value" &&
        record.sha256 === digest(record.value),
      "AUDIT_INTEGRITY_FAILED",
    );
    return record.value;
  }

  async function requireRecoveredJournal() {
    for (const name of (await auditEntries()).keys()) {
      if (!name.endsWith(".intent.json")) continue;
      const id = name.slice(0, -".intent.json".length);
      requireCondition(/^[a-f0-9]{64}$/.test(id), "AUDIT_INTEGRITY_FAILED");
      const intent = await readAudit(id, "intent");
      const applied = await readAudit(id, "applied");
      requireCondition(applied, "RECOVERY_REQUIRED");
      requireCondition(
        intent.decisionId === id &&
          applied.decisionId === id &&
          applied.postimageSha256 === intent.postimageSha256,
        "AUDIT_INTEGRITY_FAILED",
      );
    }
  }

  async function context() {
    if (verifyRuntime) await verifyRuntime();
    await directory(trust);
    const policy = await loadPolicy(policyPath);
    const current = await snapshot(root);
    const runtimeHash = await runtimeIdentity(runtimeBinding);
    const now = Date.now();
    const authority = await verifyStandingAuthority({
      trustRoot: trust,
      mode,
      policy,
      workspaceId,
      baseSha: current.baseSha,
      runtimeHash,
      now,
    });
    return { ...current, policy, authority, runtimeHash, now };
  }

  async function loadDecision(id, enforce = true) {
    const binding = await readAudit(id, "decision");
    requireCondition(
      binding &&
        digest(binding) === id &&
        binding.workspaceId === workspaceId &&
        binding.planHash === digest(binding.plan),
      "DECISION_INVALID",
    );
    if (enforce) {
      requireCondition(!(await readAudit(id, "stopped")), "DECISION_STOPPED");
      requireCondition(Date.now() < binding.expiresAt, "DECISION_EXPIRED");
      requireCondition(
        binding.result.implementationPermitted,
        "NO_EDIT_PERMIT",
      );
    }
    if (task !== undefined) {
      requireCondition(
        binding.plan.request.summary === task &&
          binding.plan.request.reference === taskReference(task),
        "TASK_INTENT_CHANGED",
      );
    }
    return binding;
  }

  async function revalidate(id) {
    await requireRecoveredJournal();
    const binding = await loadDecision(id);
    const current = await context();
    requireCondition(binding.baseSha === current.baseSha, "BASE_CHANGED");
    requireCondition(
      binding.policyHash === digest(current.policy),
      "POLICY_CHANGED",
    );
    requireCondition(
      binding.runtimeHash === current.runtimeHash,
      "RUNTIME_CHANGED",
    );
    requireCondition(
      binding.authorityHash === current.authority.authorityHash,
      "AUTHORITY_CHANGED",
    );
    const reapplied = evaluatePlan(binding.plan, current.policy, {
      authority: current.authority,
      files: binding.files,
    });
    requireCondition(
      canonical(reapplied) === canonical(binding.result),
      "DECISION_CHANGED",
    );
    const applied = await readAudit(id, "applied");
    const intent = await readAudit(id, "intent");
    requireCondition(!intent || applied, "RECOVERY_REQUIRED");
    const expected = { ...binding.files };
    if (applied) {
      requireCondition(
        applied.postimageSha256 ===
          digest(expectedText(binding, current.policy)),
        "APPLIED_RECORD_INVALID",
      );
      expected["README.md"] = applied.postimageSha256;
    }
    requireCondition(
      canonical(current.files) === canonical(expected),
      "WORKSPACE_SCOPE_CHANGED",
    );
    requireCondition(
      canonical(current.modes) === canonical(binding.modes),
      "WORKSPACE_MODE_CHANGED",
    );
    return { binding, current, applied };
  }

  function expectedText(binding, policy) {
    const separator = binding.beforeText.endsWith("\n\n")
      ? ""
      : binding.beforeText.endsWith("\n")
        ? "\n"
        : "\n\n";
    const text = `${binding.beforeText}${separator}${policy.grant.text}\n`;
    requireCondition(
      Buffer.byteLength(text, "utf8") <= MAX_README_BYTES,
      "POSTIMAGE_TOO_LARGE",
    );
    return text;
  }

  async function evaluate(args) {
    await requireRecoveredJournal();
    const current = await context();
    requireCondition(
      git(root, ["status", "--porcelain=v1", "--untracked-files=all"]) === "",
      "CLEAN_START_REQUIRED",
    );
    const plan = JSON.parse(canonical(args.plan));
    if (task !== undefined) verifyTaskIntent(plan, task, current.policy);
    const result = evaluatePlan(plan, current.policy, current);
    const beforeBytes = await readBounded(
      await regularPath(root, "README.md"),
      MAX_README_BYTES,
    );
    const beforeText = beforeBytes.toString("utf8");
    requireCondition(
      Buffer.from(beforeText, "utf8").equals(beforeBytes),
      "NON_UTF8_README",
    );
    const binding = {
      protocol: PROTOCOL,
      nonce: randomUUID(),
      plan,
      planHash: digest(plan),
      policyHash: digest(current.policy),
      runtimeHash: current.runtimeHash,
      authorityHash: current.authority.authorityHash,
      workspaceId,
      baseSha: current.baseSha,
      files: current.files,
      modes: current.modes,
      beforeText,
      result,
      issuedAt: current.now,
      expiresAt: Math.min(
        current.now + current.policy.permitMinutes * 60000,
        current.authority.expiresAtMs,
      ),
    };
    const decisionId = digest(binding);
    if (result.implementationPermitted) {
      requireCondition(
        !beforeText.includes(current.policy.grant.text),
        "CLARIFICATION_ALREADY_PRESENT",
      );
      const text = expectedText(binding, current.policy);
      serializeAudit(binding);
      requireInputSize({
        decisionId,
        planHash: binding.planHash,
        path: current.policy.grant.path,
        beforeSha256: binding.files[current.policy.grant.path],
        text,
      });
    }
    const entries = await auditEntries();
    requireAuditCapacity(entries);
    const identity = decisionIdentity(binding);
    for (const name of entries.keys()) {
      if (!name.endsWith(".decision.json")) continue;
      const id = name.slice(0, -".decision.json".length);
      if (
        entries.has(`${id}.stopped.json`) ||
        entries.has(`${id}.report.json`)
      ) {
        continue;
      }
      const prior = await loadDecision(id, false);
      if (
        prior.expiresAt > current.now &&
        decisionIdentity(prior) === identity
      ) {
        return decisionResponse(id, prior);
      }
    }
    await audit(decisionId, "decision", binding);
    return decisionResponse(decisionId, binding);
  }

  function decisionResponse(decisionId, binding) {
    return {
      ok: true,
      ...binding.result,
      decisionId,
      planHash: binding.planHash,
      policyHash: binding.policyHash,
      authorityHash: binding.authorityHash,
      baseSha: binding.baseSha,
      workspaceId,
      expiresAt: binding.expiresAt,
      evidence: "synthetic-only",
    };
  }

  async function apply(args) {
    const { binding, current, applied } = await revalidate(args.decisionId);
    requireCondition(args.planHash === binding.planHash, "PLAN_CHANGED");
    requireCondition(
      args.path === current.policy.grant.path,
      "PATH_NOT_AUTHORIZED",
    );
    requireCondition(
      args.beforeSha256 === binding.files[args.path],
      "PREIMAGE_CHANGED",
    );
    requireCondition(
      args.text === expectedText(binding, current.policy) &&
        !binding.beforeText.includes(current.policy.grant.text),
      "EDIT_NOT_IN_STANDING_GRANT",
    );
    const added = args.text.slice(binding.beforeText.length);
    requireCondition(
      Buffer.byteLength(added) <= current.policy.grant.maxChangedBytes &&
        added.split("\n").length <= current.policy.grant.maxChangedLines,
      "CHANGE_LIMIT_EXCEEDED",
    );
    if (applied) return { ok: true, ...applied, idempotent: true };
    requireCondition(
      !(await readAudit(args.decisionId, "report")),
      "TASK_ALREADY_REPORTED",
    );
    await audit(args.decisionId, "intent", {
      decisionId: args.decisionId,
      beforeSha256: args.beforeSha256,
      postimageSha256: digest(args.text),
      beforeText: binding.beforeText,
      beforeMode: binding.modes[args.path],
    });
    const target = await regularPath(root, args.path);
    requireCondition(
      digest(await readBounded(target, MAX_README_BYTES)) === args.beforeSha256,
      "PREIMAGE_CHANGED",
    );
    requireCondition(
      ((await lstat(target)).mode & 0o7777) ===
        binding.modes[args.path].permissions,
      "WORKSPACE_MODE_CHANGED",
    );
    const temporary = path.join(root, `.pgjb-write-${randomUUID()}`);
    let renamed = false;
    try {
      const handle = await open(temporary, "wx", 0o600);
      try {
        await handle.writeFile(args.text, "utf8");
        await handle.chmod(binding.modes[args.path].permissions);
        await handle.sync();
      } finally {
        await handle.close();
      }
      await rename(temporary, target);
      renamed = true;
    } finally {
      if (!renamed && (await exists(temporary))) await unlink(temporary);
    }
    const receipt = {
      decisionId: args.decisionId,
      path: args.path,
      postimageSha256: digest(args.text),
      status: "APPLIED",
    };
    await audit(args.decisionId, "applied", receipt);
    return { ok: true, ...receipt };
  }

  async function validate(args) {
    const { binding, current, applied } = await revalidate(args.decisionId);
    requireCondition(applied, "MISSING_ALLOWED_EDIT");
    const existing = await readAudit(args.decisionId, "report");
    if (existing) return { ok: existing.status === "COMPLETED", ...existing };
    const text = (
      await readBounded(await regularPath(root, "README.md"), MAX_README_BYTES)
    ).toString("utf8");
    const manifest = await readJson(await regularPath(root, "package.json"));
    requireCondition(
      typeof manifest.scripts?.validate === "string" &&
        manifest.scripts.validate.trim(),
      "VALIDATION_SCRIPT_MISSING",
    );
    const formatted = await checkFormatting(text, { parser: "markdown" });
    const { nodeExecutable, npmCli } = await resolveNpm();
    const validation = spawnSync(
      nodeExecutable,
      [npmCli, "--if-present=false", "run", "validate"],
      {
        cwd: root,
        env: childEnvironment(),
        encoding: "utf8",
        shell: false,
        windowsHide: true,
        timeout: 120000,
        maxBuffer: 1024 * 1024,
      },
    );
    await revalidate(args.decisionId);
    const passed = formatted && !validation.error && validation.status === 0;
    const report = {
      protocol: PROTOCOL,
      decisionId: args.decisionId,
      planHash: binding.planHash,
      policyHash: binding.policyHash,
      authorityHash: binding.authorityHash,
      runtimeHash: binding.runtimeHash,
      baseSha: binding.baseSha,
      workspaceId,
      status: passed ? "COMPLETED" : "VALIDATION_FAILED",
      changedPaths: ["README.md"],
      beforeSha256: binding.files["README.md"],
      afterSha256: applied.postimageSha256,
      fileMode: binding.modes["README.md"],
      checks: [
        { id: "readme-format", passed: formatted },
        {
          id: "repository-validate",
          command: "npm --if-present=false run validate",
          exitCode: validation.status,
          error: validation.error?.code ?? null,
          stdoutHash: digest(validation.stdout ?? ""),
          stderrHash: digest(validation.stderr ?? ""),
        },
      ],
      acceptance: text === expectedText(binding, current.policy),
      evidence: "synthetic-fixture-real-command",
    };
    await audit(args.decisionId, "report", report);
    return { ok: passed, ...report };
  }

  async function dispatch(name, args) {
    requireCondition(toolValidators.get(name)?.(args), "INVALID_TOOL_INPUT");
    requireInputSize(args);
    if (name === "evaluate_plan") return evaluate(args);
    if (name === "apply_text_edit") return apply(args);
    if (name === "validate_and_report") return validate(args);
    const binding = await loadDecision(args.decisionId, false);
    const stopped = await readAudit(args.decisionId, "stopped");
    const report = await readAudit(args.decisionId, "report");
    const applied = await readAudit(args.decisionId, "applied");
    const intent = await readAudit(args.decisionId, "intent");
    return {
      ok: true,
      decisionId: args.decisionId,
      plan: binding.plan,
      decision: binding.result,
      report,
      status: stopped
        ? "BLOCKED"
        : (report?.status ??
          (intent && !applied
            ? "RECOVERY_REQUIRED"
            : (applied?.status ?? "DECIDED"))),
    };
  }

  return {
    async prepareTask() {
      requireCondition(!(await exists(lockPath)), "AUDIT_STORE_BUSY");
      const entries = await auditEntries();
      requireAuditCapacity(entries);
      for (const name of entries.keys()) {
        const [id, kind] = name.split(".");
        await readAudit(id, kind);
      }
      await requireRecoveredJournal();
      const current = await context();
      const contract = operationContract(current.policy);
      requireCondition(contract.matches(task), "TASK_NOT_IN_CONTRACT");
      for (const name of entries.keys()) {
        if (!name.endsWith(".decision.json")) continue;
        const id = name.slice(0, -".decision.json".length);
        const binding = await readAudit(id, "decision");
        requireCondition(digest(binding) === id, "DECISION_INVALID");
        requireCondition(
          !(await readAudit(id, "stopped")),
          "RECOVERY_REQUIRED",
        );
        requireCondition(
          (await readAudit(id, "report"))?.status === "COMPLETED",
          "PRIOR_TASK_REQUIRES_REVIEW",
        );
      }
      const beforeText = (
        await readBounded(
          await regularPath(root, current.policy.grant.path),
          MAX_README_BYTES,
        )
      ).toString("utf8");
      requireCondition(
        digest(beforeText) === current.files[current.policy.grant.path],
        "NON_UTF8_README",
      );
      const dirty =
        git(root, ["status", "--porcelain=v1", "--untracked-files=all"]) !== "";
      if (dirty) {
        let completed = false;
        for (const name of (await auditEntries()).keys()) {
          if (!name.endsWith(".report.json")) continue;
          const id = name.slice(0, -".report.json".length);
          const report = await readAudit(id, "report");
          const binding = await readAudit(id, "decision");
          if (
            !binding ||
            digest(binding) !== id ||
            report.status !== "COMPLETED"
          )
            continue;
          const expected = {
            ...binding.files,
            [current.policy.grant.path]: report.afterSha256,
          };
          if (
            binding.authorityHash === current.authority.authorityHash &&
            binding.runtimeHash === current.runtimeHash &&
            binding.policyHash === digest(current.policy) &&
            binding.baseSha === current.baseSha &&
            canonical(expected) === canonical(current.files) &&
            canonical(binding.modes) === canonical(current.modes) &&
            report.afterSha256 === digest(expectedText(binding, current.policy))
          ) {
            completed = true;
          }
        }
        requireCondition(completed, "CLEAN_START_REQUIRED");
      }
      return {
        status: contract.satisfied(beforeText) ? "ALREADY_SATISFIED" : "READY",
        task,
        reference: taskReference(task),
        riskDefinitions: current.policy.riskDefinitions,
        contract: {
          id: contract.id,
          risk: current.policy.grant.risk,
          paths: contract.paths,
          operation: contract.operation,
          editInstructions: contract.editInstructions,
          acceptanceCriteria: contract.acceptanceCriteria,
          tests: contract.tests,
        },
        files: {
          [current.policy.grant.path]: {
            sha256: digest(beforeText),
            text: beforeText,
          },
        },
        planSchema: PLAN_SCHEMA,
      };
    },
    async handle(name, args) {
      if (busy)
        return { ok: false, status: "BLOCKED", reason: "CONCURRENT_OPERATION" };
      busy = true;
      let lock;
      let result;
      try {
        try {
          await directory(state);
          lock = await open(lockPath, "wx", 0o600);
        } catch (error) {
          throw new PlanError(
            error.code === "EEXIST"
              ? "AUDIT_STORE_BUSY"
              : `AUDIT_FAILURE:${failure(error)}`,
          );
        }
        result = await dispatch(name, args);
      } catch (error) {
        let reason = failure(error);
        if (
          lock &&
          name !== "get_record" &&
          /^[a-f0-9]{64}$/.test(args?.decisionId ?? "")
        ) {
          try {
            if (
              (await readAudit(args.decisionId, "decision")) &&
              !(await exists(auditPath(args.decisionId, "stopped")))
            ) {
              await audit(args.decisionId, "stopped", {
                reason,
                at: Date.now(),
              });
            }
          } catch (auditError) {
            reason = `AUDIT_FAILURE:${failure(auditError)};${reason}`;
          }
        }
        process.stderr.write(`Plan bridge stopped: ${reason}\n`);
        result = { ok: false, status: "BLOCKED", reason };
      } finally {
        if (lock) {
          try {
            try {
              await lock.close();
            } finally {
              await unlink(lockPath);
            }
          } catch (error) {
            const reason = `AUDIT_LOCK_RELEASE_FAILURE:${failure(error)}`;
            process.stderr.write(`Plan bridge stopped: ${reason}\n`);
            result = { ok: false, status: "BLOCKED", reason };
          }
        }
        busy = false;
      }
      return result;
    },
  };
}

export function createServer(bridge) {
  const server = new Server(
    { name: "propertygojb-sdlc", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = bridge
      ? await bridge.handle(request.params.name, request.params.arguments)
      : {
          ok: false,
          status: "BLOCKED",
          reason: "LIVE_RUNTIME_DENIAL_EVIDENCE_REQUIRED",
        };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      isError: !result.ok,
    };
  });
  return server;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    let bridge;
    if (process.argv.length !== 2) {
      requireCondition(
        process.argv.length === 4 && process.argv[2] === "--synthetic",
        "LIVE_RUNTIME_DENIAL_EVIDENCE_REQUIRED",
      );
      const config = await readJson(process.argv[3]);
      requireCondition(
        config &&
          Object.keys(config).sort().join(",") ===
            "policyPath,stateRoot,trustRoot,workspaceRoot",
        "INVALID_SYNTHETIC_CONFIG",
      );
      bridge = await createBridge({ ...config, mode: "synthetic" });
    }
    await createServer(bridge).connect(new StdioServerTransport());
  } catch (error) {
    process.stderr.write(`Plan bridge startup blocked: ${failure(error)}\n`);
    process.exitCode = 1;
  }
}
