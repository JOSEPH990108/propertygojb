import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import process from "node:process";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import test from "node:test";
import { validateControls } from "../../scripts/sdlc/validate-controls.mjs";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const register = JSON.parse(
  await readFile(
    new URL("../../docs/sdlc/controls.json", import.meta.url),
    "utf8",
  ),
);

function copyRegister() {
  return JSON.parse(JSON.stringify(register));
}

function approvalEvidence(control, overrides = {}) {
  return {
    decision_reference: "claimed-decision-123",
    approver_identity: "claimed-owner",
    authority_reference: "claimed-authority",
    control_id: control.id,
    control_version: control.control_version,
    scope_sha256: "a".repeat(64),
    base_sha: "b".repeat(40),
    decided_on: "2026-10-21",
    ...overrides,
  };
}

function enforcementEvidence(control, evidenceType, overrides = {}) {
  return {
    evidence_type: evidenceType,
    reference: "claimed-evidence-123",
    control_id: control.id,
    control_version: control.control_version,
    scope_sha256: "c".repeat(64),
    subject_sha: "d".repeat(40),
    observed_on: "2026-10-21",
    ...overrides,
  };
}

async function temporaryRepository(t) {
  const root = await mkdtemp(path.join(tmpdir(), "propertygojb-sdlc-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, "source.md"), "synthetic source\n");
  const data = copyRegister();
  for (const control of data.controls) {
    control.source.path = "source.md";
  }
  return { root, data };
}

test("actual baseline contains five proposed and advisory risk controls", async () => {
  assert.deepEqual(await validateControls(register), []);
  assert.deepEqual(
    register.controls.map((control) => control.id),
    ["risk.R0", "risk.R1", "risk.R2", "risk.R3", "risk.R4"],
  );
  assert.ok(
    register.controls.every(
      (control) =>
        control.approval_status === "proposed" &&
        control.approval_evidence === null &&
        control.enforcement_status === "advisory" &&
        control.enforcement_evidence === null,
    ),
  );
});

test("empty register is rejected", async () => {
  const changed = copyRegister();
  changed.controls = [];
  assert.ok(
    (await validateControls(changed)).some((error) =>
      error.includes("must not be empty"),
    ),
  );
});

for (const requiredId of [
  "risk.R0",
  "risk.R1",
  "risk.R2",
  "risk.R3",
  "risk.R4",
]) {
  test(`missing ${requiredId} is rejected`, async () => {
    const changed = copyRegister();
    changed.controls = changed.controls.filter(
      (control) => control.id !== requiredId,
    );
    assert.ok(
      (await validateControls(changed)).some((error) =>
        error.includes(requiredId),
      ),
    );
  });
}

test("duplicate identifiers are rejected even when records differ", async () => {
  const changed = copyRegister();
  changed.controls[1].id = changed.controls[0].id;
  assert.ok(
    (await validateControls(changed)).some((error) =>
      error.includes("duplicates"),
    ),
  );
});

test("a well-formed additional category is accepted", async (t) => {
  const { root, data } = await temporaryRepository(t);
  data.controls.push({
    id: "security.document-review",
    control_version: 1,
    statement: "A future proposed security category.",
    source: { path: "source.md", section: "Synthetic additional category" },
    approval_status: "proposed",
    approval_evidence: null,
    enforcement_status: "advisory",
    enforcement_evidence: null,
  });
  assert.deepEqual(await validateControls(data, { root }), []);
});

test("unknown record fields and malformed source metadata are rejected", async () => {
  const changed = copyRegister();
  changed.controls[0].unexpected = true;
  changed.controls[0].source.section = 7;
  const errors = await validateControls(changed);
  assert.ok(errors.some((error) => error.includes("unknown field")));
  assert.ok(errors.some((error) => error.includes("source.section")));
});

test("proposed controls reject approval evidence", async () => {
  const changed = copyRegister();
  changed.controls[0].approval_evidence = approvalEvidence(changed.controls[0]);
  assert.ok(
    (await validateControls(changed)).some((error) =>
      error.includes("proposed control must have null approval_evidence"),
    ),
  );
});

test("a structurally complete but invented approval remains ineffective", async () => {
  const changed = copyRegister();
  changed.controls[0].approval_status = "approved";
  changed.controls[0].approval_evidence = approvalEvidence(changed.controls[0]);
  const errors = await validateControls(changed);
  assert.ok(
    errors.some((error) =>
      error.includes("no trusted authenticated approval verifier"),
    ),
  );
});

test("approval evidence must match control ID, version, scope format and date", async () => {
  const changed = copyRegister();
  const control = changed.controls[0];
  control.approval_status = "approved";
  control.approval_evidence = approvalEvidence(control, {
    control_id: "risk.other",
    control_version: 99,
    scope_sha256: "not-a-digest",
    decided_on: "2026-02-30",
  });
  const errors = await validateControls(changed);
  assert.ok(
    errors.some((error) => error.includes("control_id does not match")),
  );
  assert.ok(
    errors.some((error) => error.includes("control_version does not match")),
  );
  assert.ok(errors.some((error) => error.includes("scope_sha256")));
  assert.ok(errors.some((error) => error.includes("valid date")));
  assert.ok(
    errors.some((error) =>
      error.includes("no trusted authenticated approval verifier"),
    ),
  );
});

test("malformed or incomplete approval evidence is rejected", async () => {
  const changed = copyRegister();
  changed.controls[0].approval_status = "approved";
  changed.controls[0].approval_evidence = { decision_reference: "invented" };
  const errors = await validateControls(changed);
  assert.ok(
    errors.some((error) =>
      error.includes("approval_evidence.approver_identity is required"),
    ),
  );
  assert.ok(
    errors.some((error) =>
      error.includes("no trusted authenticated approval verifier"),
    ),
  );
});

test("approval and enforcement are independent but neither claim is trusted", async () => {
  const changed = copyRegister();
  const control = changed.controls[0];
  control.enforcement_status = "tested";
  control.enforcement_evidence = enforcementEvidence(control, "test-run");
  const errors = await validateControls(changed);
  assert.ok(
    errors.some((error) => error.includes("no trusted enforcement verifier")),
  );
  assert.ok(!errors.some((error) => error.includes("approval_status")));
});

test("unsupported platform-enforcement claims fail closed", async () => {
  const changed = copyRegister();
  const control = changed.controls[0];
  control.enforcement_status = "platform-enforced";
  control.enforcement_evidence = enforcementEvidence(
    control,
    "platform-setting",
  );
  assert.ok(
    (await validateControls(changed)).some((error) =>
      error.includes("no trusted enforcement verifier"),
    ),
  );
});

test("malformed and impossible evidence dates are rejected", async () => {
  const changed = copyRegister();
  const control = changed.controls[0];
  control.approval_status = "approved";
  control.approval_evidence = approvalEvidence(control, {
    decided_on: "2026-02-30",
  });
  control.enforcement_status = "tested";
  control.enforcement_evidence = enforcementEvidence(control, "test-run", {
    observed_on: "2026-13-01",
  });
  const errors = await validateControls(changed);
  assert.ok(
    errors.some((error) => error.includes("approval_evidence.decided_on")),
  );
  assert.ok(
    errors.some((error) => error.includes("enforcement_evidence.observed_on")),
  );
});

test("missing files, directories, traversal and malformed source paths are rejected", async (t) => {
  const { root, data } = await temporaryRepository(t);
  await mkdir(path.join(root, "directory"));
  const cases = [
    ["missing.md", "does not exist"],
    ["directory", "regular file"],
    ["../outside.md", "resolve inside the repository"],
    ["source\\file.md", "forward slashes"],
  ];
  for (const [sourcePath, expectedError] of cases) {
    const changed = JSON.parse(JSON.stringify(data));
    changed.controls[0].source.path = sourcePath;
    assert.ok(
      (await validateControls(changed, { root })).some((error) =>
        error.includes(expectedError),
      ),
      `${sourcePath} should be rejected for ${expectedError}`,
    );
  }
});

test("source symbolic-link components are rejected", async (t) => {
  const { root, data } = await temporaryRepository(t);
  const outside = await mkdtemp(path.join(tmpdir(), "propertygojb-outside-"));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await writeFile(
    path.join(outside, "external.md"),
    "synthetic outside source\n",
  );
  const linkPath = path.join(root, "linked-directory");
  try {
    await symlink(
      outside,
      linkPath,
      process.platform === "win32" ? "junction" : "dir",
    );
  } catch (error) {
    if (["EPERM", "EACCES", "ENOTSUP"].includes(error.code)) {
      t.skip(`platform cannot create a directory symlink: ${error.code}`);
      return;
    }
    throw error;
  }
  data.controls[0].source.path = "linked-directory/external.md";
  assert.ok(
    (await validateControls(data, { root })).some((error) =>
      error.includes("symbolic links"),
    ),
  );
});

test("the CLI reports its validation scope without claiming authentication", () => {
  const result = execFileSync(
    process.execPath,
    ["scripts/sdlc/validate-controls.mjs"],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  assert.match(result, /Schema-valid register; deterministic checks passed/);
  assert.match(
    result,
    /No approval or enforcement claims were authenticated or activated/,
  );
});
