import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

export const PROTOCOL = "propertygojb.plan-approval.v1";
export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const POLICY_PATH = path.join(
  ROOT,
  "docs/sdlc/plan-approval-policy.json",
);
export const SSH_KEYGEN =
  process.platform === "win32"
    ? path.join(
        process.env.SystemRoot ?? "C:\\Windows",
        "System32/OpenSSH/ssh-keygen.exe",
      )
    : "/usr/bin/ssh-keygen";
export const TOOL_NAMES = [
  "evaluate_plan",
  "apply_text_edit",
  "validate_and_report",
  "get_record",
];
const authenticated = new WeakSet();
const text = { type: "string", minLength: 1, maxLength: 2000 };
const hash = { type: "string", pattern: "^[a-f0-9]{64}$" };
const sha = { type: "string", pattern: "^[a-f0-9]{40}$" };
const timestamp = {
  type: "string",
  pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
};
const list = (items, maxItems = 32) => ({ type: "array", items, maxItems });
const object = (properties) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});
const adr = object({ path: text, sha256: hash });
const impactNames = [
  "data",
  "authorization",
  "schema",
  "privacy",
  "provider",
  "production",
  "deployment",
  "controlPlane",
];

export const PLAN_SCHEMA = object({
  protocol: { const: PROTOCOL },
  taskId: { type: "string", pattern: "^[A-Z][A-Z0-9-]{2,63}$" },
  revision: { type: "integer", minimum: 1 },
  request: object({ reference: text, summary: text }),
  requirements: { ...list(text), minItems: 1 },
  acceptanceCriteria: { ...list(text), minItems: 1 },
  architecture: object({ summary: text, adrs: list(adr) }),
  changes: list(
    object({
      path: text,
      operation: { enum: ["append-clarification", "read", "other"] },
      beforeSha256: hash,
    }),
    16,
  ),
  dependencies: list(text),
  impacts: object(
    Object.fromEntries(
      impactNames.map((name) => [
        name,
        { enum: ["none", "changed", "unknown"] },
      ]),
    ),
  ),
  tests: {
    ...list({ enum: ["readme-format", "repository-validate"] }, 2),
    uniqueItems: true,
  },
  rollback: text,
  unresolvedDecisions: list(text),
  riskProposal: { enum: ["R0", "R1", "R2", "R3", "R4"] },
});

export const POLICY_SCHEMA = object({
  protocol: { const: PROTOCOL },
  version: { const: 1 },
  status: { const: "proposed" },
  repository: { const: "JOSEPH990108/propertygojb" },
  riskDefinitions: object(
    Object.fromEntries(
      ["R0", "R1", "R2", "R3", "R4"].map((risk) => [risk, text]),
    ),
  ),
  grant: object({
    id: { const: "r1-readme-local-validation-clarification" },
    risk: { const: "R1" },
    path: { const: "README.md" },
    operation: { const: "append-clarification" },
    text: {
      const: "Local validation does not publish or deploy the application.",
    },
    maxChangedLines: { const: 20 },
    maxChangedBytes: { const: 4096 },
    checks: { const: ["readme-format", "repository-validate"] },
  }),
  permitMinutes: { const: 60 },
  maxPlanBytes: { const: 262144 },
  liveActivation: { const: "blocked-until-runtime-denial-evidence" },
  r2Grants: { const: [] },
});

export const AUTHORITY_SCHEMA = object({
  protocol: { const: PROTOCOL },
  kind: { const: "standing-owner-authorization" },
  environment: { enum: ["synthetic", "live"] },
  owner: { type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9@._-]{0,127}$" },
  repository: { const: "synthetic-fixture" },
  workspaceId: hash,
  baseSha: sha,
  policyHash: hash,
  runtimeHash: hash,
  riskDefinitionsHash: hash,
  grantId: text,
  approvedPaths: { const: ["README.md"] },
  approvedAdrs: list(adr),
  issuedAt: timestamp,
  expiresAt: timestamp,
  generation: { type: "integer", minimum: 1 },
  implementationAuthorized: { const: true },
});
const ACTIVE_SCHEMA = object({
  authorityHash: hash,
  generation: { type: "integer", minimum: 1 },
  revoked: { type: "boolean" },
});
const ajv = new Ajv2020({ strict: true, allErrors: true });
const validators = new Map([
  ["plan", ajv.compile(PLAN_SCHEMA)],
  ["policy", ajv.compile(POLICY_SCHEMA)],
  ["authority", ajv.compile(AUTHORITY_SCHEMA)],
  ["active", ajv.compile(ACTIVE_SCHEMA)],
]);

export class PlanError extends Error {
  constructor(code) {
    super(code);
    this.name = "PlanError";
    this.code = code;
  }
}

export function requireCondition(condition, code) {
  if (!condition) throw new PlanError(code);
}

export function validateDocument(kind, value) {
  const validate = validators.get(kind);
  requireCondition(
    validate && validate(value),
    `INVALID_${kind.toUpperCase()}`,
  );
  return value;
}

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  requireCondition(
    value === null ||
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isSafeInteger(value)),
    "INVALID_CANONICAL_VALUE",
  );
  return JSON.stringify(value);
}

export function digest(value) {
  return createHash("sha256")
    .update(
      typeof value === "string" || Buffer.isBuffer(value)
        ? value
        : canonical(value),
    )
    .digest("hex");
}

export async function readBounded(file, maximum = 262144) {
  const stat = await lstat(file);
  requireCondition(
    stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1,
    "UNSAFE_FILE",
  );
  requireCondition(stat.size <= maximum, "INPUT_TOO_LARGE");
  const bytes = await readFile(file);
  requireCondition(bytes.length <= maximum, "INPUT_TOO_LARGE");
  return bytes;
}

export async function readJson(file, maximum = 262144) {
  const bytes = await readBounded(file, maximum);
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) throw new PlanError("INVALID_JSON");
    throw error;
  }
}

export async function loadPolicy(file = POLICY_PATH) {
  return validateDocument("policy", await readJson(file));
}

export async function runtimeIdentity() {
  const files = [
    "scripts/sdlc/plan-approval.mjs",
    "scripts/sdlc/plan-bridge.mjs",
    ".github/agents/propertygojb-task-orchestrator.agent.md",
    "package.json",
    "package-lock.json",
  ];
  const hashes = {};
  for (const file of files) {
    hashes[file] = digest(
      await readBounded(path.join(ROOT, file), 2 * 1024 * 1024),
    );
  }
  return digest({ files: hashes, node: process.version, tools: TOOL_NAMES });
}

export function activationStatus(mode) {
  // A file or model-supplied assertion cannot certify the untested live harness.
  return mode === "synthetic"
    ? { enabled: true, evidence: "synthetic-only" }
    : { enabled: false, reason: "LIVE_RUNTIME_DENIAL_EVIDENCE_REQUIRED" };
}

function validInstant(value) {
  const ms = Date.parse(value);
  requireCondition(
    Number.isFinite(ms) && new Date(ms).toISOString() === value,
    "INVALID_TIME",
  );
  return ms;
}

export async function verifyStandingAuthority({
  trustRoot,
  mode,
  policy,
  workspaceId,
  baseSha,
  runtimeHash,
  now,
}) {
  requireCondition(
    activationStatus(mode).enabled,
    "LIVE_RUNTIME_DENIAL_EVIDENCE_REQUIRED",
  );
  const payloadPath = path.join(trustRoot, "authority.json");
  const signaturePath = path.join(trustRoot, "authority.sig");
  const signersPath = path.join(trustRoot, "allowed_signers");
  const bytes = await readBounded(payloadPath);
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) throw new PlanError("INVALID_AUTHORITY");
    throw error;
  }
  const authority = validateDocument("authority", parsed);
  await readBounded(signaturePath, 16384);
  await readBounded(signersPath, 16384);
  requireCondition(
    process.platform !== "win32" || Boolean(process.env.PROGRAMDATA),
    "SSH_PROGRAMDATA_REQUIRED",
  );
  const verified = spawnSync(
    SSH_KEYGEN,
    [
      "-Y",
      "verify",
      "-f",
      signersPath,
      "-I",
      authority.owner,
      "-n",
      PROTOCOL,
      "-s",
      signaturePath,
    ],
    {
      input: bytes,
      timeout: 5000,
      maxBuffer: 16384,
      windowsHide: true,
      shell: false,
    },
  );
  requireCondition(!verified.error, "SIGNATURE_VERIFIER_UNAVAILABLE");
  requireCondition(verified.status === 0, "INVALID_SIGNATURE");
  const authorityHash = digest(bytes);
  const active = validateDocument(
    "active",
    await readJson(path.join(trustRoot, "active.json")),
  );
  requireCondition(!active.revoked, "AUTHORITY_REVOKED");
  requireCondition(
    active.authorityHash === authorityHash &&
      active.generation === authority.generation,
    "AUTHORITY_GENERATION_MISMATCH",
  );
  requireCondition(
    authority.environment === "synthetic",
    "LIVE_RUNTIME_DENIAL_EVIDENCE_REQUIRED",
  );
  requireCondition(authority.workspaceId === workspaceId, "WRONG_WORKSPACE");
  requireCondition(authority.baseSha === baseSha, "BASE_CHANGED");
  requireCondition(authority.policyHash === digest(policy), "POLICY_CHANGED");
  requireCondition(authority.runtimeHash === runtimeHash, "RUNTIME_CHANGED");
  requireCondition(
    authority.riskDefinitionsHash === digest(policy.riskDefinitions),
    "RISK_DEFINITIONS_CHANGED",
  );
  requireCondition(authority.grantId === policy.grant.id, "GRANT_MISMATCH");
  const start = validInstant(authority.issuedAt);
  const end = validInstant(authority.expiresAt);
  requireCondition(
    start <= now && now < end && end > start && end - start <= 90 * 86400000,
    "AUTHORITY_EXPIRED_OR_NOT_YET_VALID",
  );
  const result = Object.freeze({
    ...authority,
    authorityHash,
    expiresAtMs: end,
    approvedAdrs: authority.approvedAdrs.map((entry) => Object.freeze(entry)),
  });
  Object.freeze(result.approvedAdrs);
  Object.freeze(result.approvedPaths);
  authenticated.add(result);
  return result;
}

export function evaluatePlan(plan, policy, context) {
  validateDocument("plan", plan);
  validateDocument("policy", policy);
  requireCondition(
    Buffer.byteLength(canonical(plan)) <= policy.maxPlanBytes,
    "PLAN_TOO_LARGE",
  );
  requireCondition(
    authenticated.has(context.authority),
    "UNVERIFIED_AUTHORITY",
  );
  const result = (decision, risk, reason) => ({
    protocol: PROTOCOL,
    decision,
    effectiveRisk: risk,
    implementationPermitted: decision === "AUTO_APPROVED",
    reasonCodes: [reason],
    matchedGrantId: decision === "AUTO_APPROVED" ? policy.grant.id : null,
    obligations: decision === "AUTO_APPROVED" ? [...policy.grant.checks] : [],
  });
  if (
    plan.riskProposal === "R4" ||
    plan.impacts.production !== "none" ||
    plan.impacts.deployment !== "none"
  ) {
    return result(
      "OWNER_REQUIRED",
      "R4",
      "OWNER_OPERATIONAL_AUTHORIZATION_REQUIRED",
    );
  }
  if (
    plan.riskProposal === "R3" ||
    plan.dependencies.length ||
    Object.values(plan.impacts).some((impact) => impact !== "none") ||
    plan.changes.some((change) => change.path !== policy.grant.path)
  ) {
    return result("OWNER_REQUIRED", "R3", "PROTECTED_OR_UNKNOWN_SCOPE");
  }
  if (
    plan.unresolvedDecisions.length ||
    plan.architecture.adrs.some(
      (entry) =>
        !context.authority.approvedAdrs.some(
          (approved) =>
            approved.path === entry.path && approved.sha256 === entry.sha256,
        ) || context.files[entry.path] !== entry.sha256,
    )
  ) {
    return result("OWNER_REQUIRED", "UNKNOWN", "ADR_OR_DECISION_UNRESOLVED");
  }
  if (plan.riskProposal === "R2") {
    return result("OWNER_REQUIRED", "R2", "R2_STANDING_GRANT_MISSING");
  }
  if (plan.riskProposal === "R0" && plan.changes.length === 0) {
    return result("RESEARCH_ONLY", "R0", "NO_EDIT_PERMIT");
  }
  const change = plan.changes[0];
  if (
    plan.riskProposal !== "R1" ||
    plan.changes.length !== 1 ||
    change.operation !== policy.grant.operation
  ) {
    return result("OWNER_REQUIRED", "UNKNOWN", "TASK_CLASS_NOT_GRANTED");
  }
  if (change.beforeSha256 !== context.files[change.path]) {
    return result("BLOCKED", "R1", "PREIMAGE_CHANGED");
  }
  if (canonical(plan.acceptanceCriteria) !== canonical([policy.grant.text])) {
    return result(
      "CONDITIONS_PENDING",
      "R1",
      "ACCEPTANCE_NOT_MACHINE_VERIFIABLE",
    );
  }
  if (
    canonical([...plan.tests].sort()) !==
    canonical([...policy.grant.checks].sort())
  ) {
    return result("CONDITIONS_PENDING", "R1", "VALIDATION_OBLIGATIONS_MISSING");
  }
  return result("AUTO_APPROVED", "R1", "SIGNED_STANDING_GRANT");
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    requireCondition(
      process.argv.length === 3 && process.argv[2] === "--self-check",
      "INVALID_COMMAND",
    );
    await loadPolicy();
    process.stdout.write(
      "Plan policy structure valid; live activation BLOCKED.\n",
    );
  } catch (error) {
    process.stderr.write(
      `${error instanceof PlanError ? error.code : "POLICY_CHECK_FAILED"}\n`,
    );
    process.exitCode = 1;
  }
}
