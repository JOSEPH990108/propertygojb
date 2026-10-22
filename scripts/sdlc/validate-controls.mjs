import { lstat, readFile, realpath } from "node:fs/promises";
import process from "node:process";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const registerPath = path.join(repositoryRoot, "docs/sdlc/controls.json");
const schemaPath = path.join(
  repositoryRoot,
  "docs/sdlc/control-register.schema.json",
);
const requiredRiskIds = ["risk.R0", "risk.R1", "risk.R2", "risk.R3", "risk.R4"];
const controlFields = new Set([
  "id",
  "control_version",
  "statement",
  "source",
  "approval_status",
  "approval_evidence",
  "enforcement_status",
  "enforcement_evidence",
]);
const approvalEvidenceFields = new Set([
  "decision_reference",
  "approver_identity",
  "authority_reference",
  "control_id",
  "control_version",
  "scope_sha256",
  "base_sha",
  "decided_on",
]);
const enforcementEvidenceFields = new Set([
  "evidence_type",
  "reference",
  "control_id",
  "control_version",
  "scope_sha256",
  "subject_sha",
  "observed_on",
]);
const validEnforcementStatuses = new Set([
  "unavailable",
  "advisory",
  "configured",
  "tested",
  "platform-enforced",
]);

export async function validateControls(
  register,
  { root = repositoryRoot } = {},
) {
  const errors = [];

  if (
    !register ||
    typeof register !== "object" ||
    Array.isArray(register) ||
    register.version !== 2 ||
    !Array.isArray(register.controls)
  ) {
    return ["register must have version 2 and a controls array"];
  }

  if (register.$schema !== "./control-register.schema.json") {
    errors.push(
      "register.$schema must point to ./control-register.schema.json",
    );
  }

  if (!hasOnlyKeys(register, new Set(["$schema", "version", "controls"]))) {
    errors.push("register contains an unknown field");
  }

  if (register.controls.length === 0) {
    errors.push("register.controls must not be empty");
  }
  let repositoryRealPath;
  try {
    repositoryRealPath = await realpath(root);
  } catch {
    return [...errors, "repository root does not exist or cannot be resolved"];
  }

  const identifiers = new Set();
  const presentRiskIds = new Set();

  for (const [index, control] of register.controls.entries()) {
    const label = `controls[${index}]`;
    if (!control || typeof control !== "object" || Array.isArray(control)) {
      errors.push(`${label} must be an object`);
      continue;
    }

    if (!hasOnlyKeys(control, controlFields)) {
      errors.push(`${label} contains an unknown field`);
    }
    for (const field of controlFields) {
      if (!Object.hasOwn(control, field)) {
        errors.push(`${label}.${field} is required`);
      }
    }

    if (
      typeof control.id !== "string" ||
      !/^[a-z][a-z0-9-]*\.[A-Za-z0-9][A-Za-z0-9.-]*$/.test(control.id)
    ) {
      errors.push(`${label}.id must use the <category>.<control> format`);
    } else if (identifiers.has(control.id)) {
      errors.push(`${label}.id duplicates ${control.id}`);
    } else {
      identifiers.add(control.id);
      if (requiredRiskIds.includes(control.id)) {
        presentRiskIds.add(control.id);
      }
    }

    if (
      !Number.isInteger(control.control_version) ||
      control.control_version < 1
    ) {
      errors.push(`${label}.control_version must be a positive integer`);
    }

    if (
      typeof control.statement !== "string" ||
      !control.statement.trim() ||
      control.statement.length > 2000
    ) {
      errors.push(`${label}.statement must be a non-empty string`);
    }

    if (
      !control.source ||
      typeof control.source !== "object" ||
      Array.isArray(control.source)
    ) {
      errors.push(`${label}.source must include a path and section`);
    } else {
      if (!hasOnlyKeys(control.source, new Set(["path", "section"]))) {
        errors.push(`${label}.source contains an unknown field`);
      }
      if (
        typeof control.source.section !== "string" ||
        !control.source.section.trim()
      ) {
        errors.push(`${label}.source.section must be a non-empty string`);
      }
      if (
        typeof control.source.path !== "string" ||
        !control.source.path.trim() ||
        control.source.path.length > 512
      ) {
        errors.push(
          `${label}.source.path must be a non-empty repository-relative path`,
        );
      } else {
        const sourceError = await validateSourceFile(
          repositoryRealPath,
          control.source.path,
        );
        if (sourceError) errors.push(`${label}.source.path ${sourceError}`);
      }
    }

    if (control.approval_status === "proposed") {
      if (control.approval_evidence !== null) {
        errors.push(
          `${label} proposed control must have null approval_evidence`,
        );
      }
    } else if (control.approval_status === "approved") {
      errors.push(
        `${label} approved claim is ineffective: no trusted authenticated approval verifier is configured`,
      );
      errors.push(...validateApprovalEvidence(control, label));
    } else {
      errors.push(`${label}.approval_status must be proposed or approved`);
    }

    if (!validEnforcementStatuses.has(control.enforcement_status)) {
      errors.push(`${label}.enforcement_status is invalid`);
    } else if (
      control.enforcement_status === "unavailable" ||
      control.enforcement_status === "advisory"
    ) {
      if (control.enforcement_evidence !== null) {
        errors.push(
          `${label} ${control.enforcement_status} control must have null enforcement_evidence`,
        );
      }
    } else {
      errors.push(
        `${label} ${control.enforcement_status} claim is ineffective: no trusted enforcement verifier is configured`,
      );
      errors.push(...validateEnforcementEvidence(control, label));
    }
  }

  for (const requiredId of requiredRiskIds) {
    if (!presentRiskIds.has(requiredId)) {
      errors.push(`register is missing required control ${requiredId}`);
    }
  }

  return errors;
}

function validateApprovalEvidence(control, label) {
  const errors = [];
  const evidence = control.approval_evidence;
  if (!isObject(evidence)) {
    return [
      `${label}.approval_evidence must be a structured object for an approved claim`,
    ];
  }
  if (!hasOnlyKeys(evidence, approvalEvidenceFields)) {
    errors.push(`${label}.approval_evidence contains an unknown field`);
  }
  for (const field of approvalEvidenceFields) {
    if (!Object.hasOwn(evidence, field)) {
      errors.push(`${label}.approval_evidence.${field} is required`);
    }
  }
  for (const field of [
    "decision_reference",
    "approver_identity",
    "authority_reference",
  ]) {
    if (typeof evidence[field] !== "string" || !evidence[field].trim()) {
      errors.push(
        `${label}.approval_evidence.${field} must be a non-empty claim`,
      );
    }
  }
  if (evidence.control_id !== control.id) {
    errors.push(
      `${label}.approval_evidence.control_id does not match the control`,
    );
  }
  if (evidence.control_version !== control.control_version) {
    errors.push(
      `${label}.approval_evidence.control_version does not match the control`,
    );
  }
  if (
    typeof evidence.scope_sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(evidence.scope_sha256)
  ) {
    errors.push(
      `${label}.approval_evidence.scope_sha256 must be a SHA-256 digest`,
    );
  }
  if (!isGitSha(evidence.base_sha)) {
    errors.push(`${label}.approval_evidence.base_sha must be a Git SHA`);
  }
  if (!isDate(evidence.decided_on)) {
    errors.push(`${label}.approval_evidence.decided_on must be a valid date`);
  }
  return errors;
}

function validateEnforcementEvidence(control, label) {
  const errors = [];
  const evidence = control.enforcement_evidence;
  if (!isObject(evidence)) {
    return [
      `${label}.enforcement_evidence must be a structured object for an enforcement claim`,
    ];
  }
  if (!hasOnlyKeys(evidence, enforcementEvidenceFields)) {
    errors.push(`${label}.enforcement_evidence contains an unknown field`);
  }
  for (const field of enforcementEvidenceFields) {
    if (!Object.hasOwn(evidence, field)) {
      errors.push(`${label}.enforcement_evidence.${field} is required`);
    }
  }
  const expectedType = {
    configured: "configuration",
    tested: "test-run",
    "platform-enforced": "platform-setting",
  }[control.enforcement_status];
  if (evidence.evidence_type !== expectedType) {
    errors.push(
      `${label}.enforcement_evidence.evidence_type does not match enforcement_status`,
    );
  }
  if (typeof evidence.reference !== "string" || !evidence.reference.trim()) {
    errors.push(
      `${label}.enforcement_evidence.reference must be a non-empty claim`,
    );
  }
  if (evidence.control_id !== control.id) {
    errors.push(
      `${label}.enforcement_evidence.control_id does not match the control`,
    );
  }
  if (evidence.control_version !== control.control_version) {
    errors.push(
      `${label}.enforcement_evidence.control_version does not match the control`,
    );
  }
  if (
    typeof evidence.scope_sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(evidence.scope_sha256)
  ) {
    errors.push(
      `${label}.enforcement_evidence.scope_sha256 must be a SHA-256 digest`,
    );
  }
  if (!isGitSha(evidence.subject_sha)) {
    errors.push(`${label}.enforcement_evidence.subject_sha must be a Git SHA`);
  }
  if (!isDate(evidence.observed_on)) {
    errors.push(
      `${label}.enforcement_evidence.observed_on must be a valid date`,
    );
  }
  return errors;
}

async function validateSourceFile(rootRealPath, sourcePath) {
  if (
    sourcePath.includes("\0") ||
    sourcePath.includes("\\") ||
    sourcePath.includes(":") ||
    path.posix.isAbsolute(sourcePath) ||
    path.win32.isAbsolute(sourcePath) ||
    path.posix.normalize(sourcePath) !== sourcePath
  ) {
    return "must be a normalized repository-relative path using forward slashes";
  }

  const resolvedPath = path.resolve(rootRealPath, ...sourcePath.split("/"));
  if (!isPathInside(rootRealPath, resolvedPath)) {
    return "must resolve inside the repository";
  }

  let currentPath = rootRealPath;
  const parts = sourcePath.split("/");
  try {
    for (const [index, part] of parts.entries()) {
      currentPath = path.join(currentPath, part);
      const info = await lstat(currentPath);
      if (info.isSymbolicLink()) {
        return "must not contain symbolic links";
      }
      const isLast = index === parts.length - 1;
      if (!isLast && !info.isDirectory()) {
        return "has a non-directory path component";
      }
      if (isLast && !info.isFile()) {
        return "must identify a regular file, not a directory or special file";
      }
    }
    const actualPath = await realpath(currentPath);
    if (!isPathInside(rootRealPath, actualPath)) {
      return "resolves outside the repository";
    }
  } catch {
    return "does not exist or cannot be inspected";
  }

  return null;
}

function isPathInside(rootPath, candidatePath) {
  const relativePath = path.relative(rootPath, candidatePath);
  return (
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value, allowedKeys) {
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

function isGitSha(value) {
  return (
    typeof value === "string" && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value)
  );
}

function isDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

async function main() {
  const register = JSON.parse(await readFile(registerPath, "utf8"));
  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  const ajv = new Ajv2020({ strict: true });
  addFormats(ajv, ["date"]);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(register)) {
    const messages = (validateSchema.errors ?? []).map(
      (error) => `${error.instancePath || "/"} ${error.message}`,
    );
    process.stderr.write(`Schema validation failed:\n${messages.join("\n")}\n`);
    process.exitCode = 1;
    return;
  }

  const errors = await validateControls(register);
  if (errors.length) {
    process.stderr.write(`${errors.join("\n")}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `Schema-valid register; deterministic checks passed for ${register.controls.length} controls. No approval or enforcement claims were authenticated or activated.\n`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    process.stderr.write(`SDLC validation failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
