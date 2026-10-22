import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import test from "node:test";
import { validateControls } from "../../scripts/sdlc/validate-controls.mjs";

const schema = JSON.parse(
  await readFile(
    new URL("../../docs/sdlc/control-register.schema.json", import.meta.url),
    "utf8",
  ),
);
const register = JSON.parse(
  await readFile(
    new URL("../../docs/sdlc/controls.json", import.meta.url),
    "utf8",
  ),
);
const ajv = new Ajv2020({ strict: true });
addFormats(ajv, ["date"]);
const validate = ajv.compile(schema);

function copyRegister() {
  return JSON.parse(JSON.stringify(register));
}

function approvalEvidence(control, overrides = {}) {
  return {
    decision_reference: "claimed-decision",
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
    reference: "claimed-evidence",
    control_id: control.id,
    control_version: control.control_version,
    scope_sha256: "c".repeat(64),
    subject_sha: "d".repeat(40),
    observed_on: "2026-10-21",
    ...overrides,
  };
}

function expectInvalid(data, message) {
  assert.equal(validate(data), false, message);
  assert.ok(validate.errors?.length, "Ajv should provide schema errors");
}

test("the actual V2 register validates against Draft 2020-12", () => {
  assert.equal(validate(register), true, JSON.stringify(validate.errors));
});

test("an empty control register is invalid", () => {
  const changed = copyRegister();
  changed.controls = [];
  expectInvalid(changed, "empty controls must fail");
});

for (const riskId of ["risk.R0", "risk.R1", "risk.R2", "risk.R3", "risk.R4"]) {
  test(`schema requires ${riskId}`, () => {
    const changed = copyRegister();
    changed.controls = changed.controls.filter(
      (control) => control.id !== riskId,
    );
    expectInvalid(changed, `${riskId} must be required`);
  });
}

test("schema rejects duplicate baseline IDs", () => {
  const changed = copyRegister();
  changed.controls.push({
    ...changed.controls[0],
    statement: "Duplicate baseline ID",
  });
  expectInvalid(changed, "required baseline ID must occur exactly once");
});

test("a well-formed additional category is valid", () => {
  const changed = copyRegister();
  changed.controls.push({
    id: "security.document-review",
    control_version: 1,
    statement: "An additional proposed category.",
    source: {
      path: "docs/reference/PROPERTYGOJB_AGENTIC_REPOSITORY_BLUEPRINT_2026-10-17.md",
      section: "Additional category fixture",
    },
    approval_status: "proposed",
    approval_evidence: null,
    enforcement_status: "advisory",
    enforcement_evidence: null,
  });
  assert.equal(validate(changed), true, JSON.stringify(validate.errors));
});

test("unknown fields and malformed record fields are invalid", () => {
  const changed = copyRegister();
  changed.controls[0].unexpected = "not allowed";
  expectInvalid(changed, "unknown record field must fail");

  const malformed = copyRegister();
  malformed.controls[0].control_version = 0;
  expectInvalid(malformed, "invalid control version must fail");
});

test("proposed controls reject approval evidence", () => {
  const changed = copyRegister();
  changed.controls[0].approval_evidence = approvalEvidence(changed.controls[0]);
  expectInvalid(changed, "proposed controls cannot carry approval evidence");
});

test("approved claims require structured evidence, not authentication", () => {
  const changed = copyRegister();
  const control = changed.controls[0];
  control.approval_status = "approved";
  control.approval_evidence = approvalEvidence(control);
  assert.equal(validate(changed), true, "schema validates shape only");

  control.approval_evidence.approver_identity = "invented identity";
  control.approval_evidence.authority_reference = "invented authority";
  assert.equal(
    validate(changed),
    true,
    "schema cannot authenticate claim values",
  );

  control.approval_evidence = { decision_reference: "incomplete" };
  expectInvalid(changed, "malformed approval evidence must fail");
});

test("approval and enforcement structures are independent", () => {
  const changed = copyRegister();
  const control = changed.controls[0];
  control.enforcement_status = "tested";
  control.enforcement_evidence = enforcementEvidence(control, "test-run");
  assert.equal(
    validate(changed),
    true,
    "enforcement structure does not require approval",
  );

  control.approval_status = "approved";
  control.approval_evidence = approvalEvidence(control);
  control.enforcement_status = "unavailable";
  control.enforcement_evidence = null;
  assert.equal(
    validate(changed),
    true,
    "approval structure does not imply enforcement",
  );
});

test("platform-enforcement evidence shape is not proof of platform enforcement", () => {
  const changed = copyRegister();
  const control = changed.controls[0];
  control.enforcement_status = "platform-enforced";
  control.enforcement_evidence = enforcementEvidence(
    control,
    "platform-setting",
  );
  assert.equal(
    validate(changed),
    true,
    "schema validates the claim's shape only",
  );

  control.enforcement_evidence.evidence_type = "test-run";
  expectInvalid(changed, "evidence type must correspond to enforcement status");
});

test("malformed and impossible dates are invalid", () => {
  const changed = copyRegister();
  const control = changed.controls[0];
  control.approval_status = "approved";
  control.approval_evidence = approvalEvidence(control, {
    decided_on: "2026-02-30",
  });
  expectInvalid(changed, "impossible approval date must fail");

  control.approval_evidence.decided_on = "not-a-date";
  expectInvalid(changed, "malformed approval date must fail");

  control.approval_status = "proposed";
  control.approval_evidence = null;
  control.enforcement_status = "tested";
  control.enforcement_evidence = enforcementEvidence(control, "test-run", {
    observed_on: "2026-13-01",
  });
  expectInvalid(changed, "impossible enforcement date must fail");
});

test("schema rejects traversal and absolute source paths", () => {
  const changed = copyRegister();
  changed.controls[0].source.path = "../outside.md";
  expectInvalid(changed, "traversal path must fail");

  changed.controls[0].source.path = "C:\\outside.md";
  expectInvalid(changed, "Windows absolute path must fail");
});

test("schema version is pinned to V2", () => {
  const changed = copyRegister();
  changed.version = 1;
  expectInvalid(changed, "legacy v1 register must fail");
});

test("schema and deterministic validator reject the same missing-tier and malformed-field fixtures", async () => {
  const missingTier = copyRegister();
  missingTier.controls = missingTier.controls.filter(
    (control) => control.id !== "risk.R4",
  );
  expectInvalid(missingTier, "schema must reject missing risk.R4");
  assert.ok(
    (await validateControls(missingTier)).some((error) =>
      error.includes("risk.R4"),
    ),
  );

  const malformedField = copyRegister();
  malformedField.controls[0].unexpected = true;
  expectInvalid(malformedField, "schema must reject unexpected properties");
  assert.ok(
    (await validateControls(malformedField)).some((error) =>
      error.includes("unknown field"),
    ),
  );
});
