import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  PROTOCOL,
  SSH_KEYGEN,
  activationStatus,
  canonical,
  digest,
  evaluatePlan,
  loadPolicy,
  runtimeIdentity,
  validateDocument,
  verifyStandingAuthority,
} from "../../scripts/sdlc/plan-approval.mjs";

function command(args) {
  const result = spawnSync(SSH_KEYGEN, args, {
    encoding: "utf8",
    shell: false,
  });
  assert.equal(result.status, 0, result.stderr);
}

async function fixture(t) {
  const trustRoot = await mkdtemp(path.join(tmpdir(), "pgjb-authority-test-"));
  t.after(() => rm(trustRoot, { recursive: true, force: true }));
  const key = path.join(trustRoot, "synthetic-key");
  command(["-q", "-t", "ed25519", "-N", "", "-C", "synthetic-only", "-f", key]);
  const owner = "synthetic-owner";
  await writeFile(
    path.join(trustRoot, "allowed_signers"),
    `${owner} ${(await readFile(`${key}.pub`, "utf8")).trim()}\n`,
  );
  const policy = await loadPolicy();
  const now = Date.now();
  const params = {
    trustRoot,
    mode: "synthetic",
    policy,
    workspaceId: "a".repeat(64),
    baseSha: "b".repeat(40),
    runtimeHash: await runtimeIdentity(),
    now,
  };
  const authority = {
    protocol: PROTOCOL,
    kind: "standing-owner-authorization",
    environment: "synthetic",
    owner,
    repository: "synthetic-fixture",
    workspaceId: params.workspaceId,
    baseSha: params.baseSha,
    policyHash: digest(policy),
    runtimeHash: params.runtimeHash,
    riskDefinitionsHash: digest(policy.riskDefinitions),
    grantId: policy.grant.id,
    approvedPaths: ["README.md"],
    approvedAdrs: [],
    issuedAt: new Date(now - 1000).toISOString(),
    expiresAt: new Date(now + 3600000).toISOString(),
    generation: 1,
    implementationAuthorized: true,
  };
  async function sign() {
    const payload = path.join(trustRoot, "authority.json");
    await writeFile(payload, canonical(authority));
    await rm(`${payload}.sig`, { force: true });
    command(["-Y", "sign", "-f", key, "-n", PROTOCOL, payload]);
    await writeFile(
      path.join(trustRoot, "authority.sig"),
      await readFile(`${payload}.sig`),
    );
    await writeFile(
      path.join(trustRoot, "active.json"),
      JSON.stringify({
        authorityHash: digest(await readFile(payload)),
        generation: authority.generation,
        revoked: false,
      }),
    );
  }
  await sign();
  const files = { "README.md": digest("# Synthetic\n") };
  const plan = {
    protocol: PROTOCOL,
    taskId: "SYNTHETIC-001",
    revision: 1,
    request: {
      reference: "synthetic-owner-task",
      summary: "Clarify local validation.",
    },
    requirements: ["Document the existing command without changing it."],
    acceptanceCriteria: [policy.grant.text],
    architecture: {
      summary: "Documentation only; no architecture change.",
      adrs: [],
    },
    changes: [
      {
        path: "README.md",
        operation: "append-clarification",
        beforeSha256: files["README.md"],
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
      ].map((keyName) => [keyName, "none"]),
    ),
    tests: ["readme-format", "repository-validate"],
    rollback: "Restore the recorded README preimage in the synthetic fixture.",
    unresolvedDecisions: [],
    riskProposal: "R1",
  };
  return {
    trustRoot,
    policy,
    params,
    authority,
    sign,
    files,
    plan,
    verify: () => verifyStandingAuthority(params),
  };
}

test("candidate policy validates but cannot activate any live harness", async () => {
  const policy = await loadPolicy();
  assert.equal(policy.status, "proposed");
  assert.deepEqual(policy.r2Grants, []);
  for (const mode of ["live", "inactive", undefined, { bypassDenied: true }]) {
    assert.equal(activationStatus(mode).enabled, false);
  }
});

test("real SSH signature enables deterministic synthetic R1 evaluation", async (t) => {
  const f = await fixture(t);
  const authority = await f.verify();
  const context = { authority, files: f.files };
  const first = evaluatePlan(f.plan, f.policy, context);
  assert.deepEqual(
    first,
    evaluatePlan(JSON.parse(canonical(f.plan)), f.policy, context),
  );
  assert.equal(first.decision, "AUTO_APPROVED");
  assert.equal(first.implementationPermitted, true);
  assert.deepEqual(first.obligations, ["readme-format", "repository-validate"]);
  assert.equal(digest({ b: 2, a: 1 }), digest({ a: 1, b: 2 }));
});

test("an invented owner object and approved Boolean are not authentication", async (t) => {
  const f = await fixture(t);
  assert.throws(
    () =>
      evaluatePlan(f.plan, f.policy, {
        authority: { ...f.authority, approved: true },
        files: f.files,
      }),
    /UNVERIFIED_AUTHORITY/,
  );
  assert.throws(
    () => validateDocument("plan", { ...f.plan, approved: true }),
    /INVALID_PLAN/,
  );
});

for (const [name, change, reason] of [
  [
    "modified signed payload",
    async (f) => {
      f.authority.implementationAuthorized = false;
      await writeFile(
        path.join(f.trustRoot, "authority.json"),
        canonical(f.authority),
      );
    },
    /INVALID_AUTHORITY/,
  ],
  [
    "modified but schema-valid signed payload",
    async (f) => {
      f.authority.owner = "forged-owner";
      await writeFile(
        path.join(f.trustRoot, "authority.json"),
        canonical(f.authority),
      );
    },
    /INVALID_SIGNATURE/,
  ],
  [
    "forged signature",
    async (f) => {
      await writeFile(
        path.join(f.trustRoot, "authority.sig"),
        "not a signature",
      );
    },
    /INVALID_SIGNATURE/,
  ],
  [
    "wrong workspace",
    async (f) => {
      f.params.workspaceId = "c".repeat(64);
    },
    /WRONG_WORKSPACE/,
  ],
  [
    "changed base",
    async (f) => {
      f.params.baseSha = "c".repeat(40);
    },
    /BASE_CHANGED/,
  ],
  [
    "changed runtime",
    async (f) => {
      f.params.runtimeHash = "c".repeat(64);
    },
    /RUNTIME_CHANGED/,
  ],
  [
    "changed policy",
    async (f) => {
      f.policy.riskDefinitions.R1 += " changed";
    },
    /POLICY_CHANGED/,
  ],
  [
    "expired authority",
    async (f) => {
      f.params.now += 7200000;
    },
    /AUTHORITY_EXPIRED_OR_NOT_YET_VALID/,
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
    "revocation generation mismatch",
    async (f) => {
      const file = path.join(f.trustRoot, "active.json");
      const active = JSON.parse(await readFile(file, "utf8"));
      active.generation += 1;
      await writeFile(file, JSON.stringify(active));
    },
    /AUTHORITY_GENERATION_MISMATCH/,
  ],
]) {
  test(`${name} denies independently of plan content`, async (t) => {
    const f = await fixture(t);
    await change(f);
    await assert.rejects(f.verify, reason);
  });
}

for (const risk of ["R2", "R3", "R4"]) {
  test(`${risk} cannot obtain an edit permit even with signed R1 authority`, async (t) => {
    const f = await fixture(t);
    f.plan.riskProposal = risk;
    const result = evaluatePlan(f.plan, f.policy, {
      authority: await f.verify(),
      files: f.files,
    });
    assert.equal(result.decision, "OWNER_REQUIRED");
    assert.equal(result.effectiveRisk, risk);
    assert.equal(result.implementationPermitted, false);
  });
}

test("R0 is research only; missing conditions and unresolved ADRs never grant edits", async (t) => {
  const f = await fixture(t);
  const context = { authority: await f.verify(), files: f.files };
  const research = { ...f.plan, riskProposal: "R0", changes: [] };
  assert.equal(
    evaluatePlan(research, f.policy, context).decision,
    "RESEARCH_ONLY",
  );
  assert.equal(
    evaluatePlan({ ...f.plan, tests: [] }, f.policy, context).decision,
    "CONDITIONS_PENDING",
  );
  const architecture = {
    summary: "Unapproved decision",
    adrs: [{ path: "adr.md", sha256: "c".repeat(64) }],
  };
  assert.equal(
    evaluatePlan({ ...f.plan, architecture }, f.policy, context).decision,
    "OWNER_REQUIRED",
  );
});

test("protected path and unknown impacts override a planner's R1 claim", async (t) => {
  const f = await fixture(t);
  const context = { authority: await f.verify(), files: f.files };
  f.plan.changes[0].path = "AGENTS.md";
  assert.equal(evaluatePlan(f.plan, f.policy, context).effectiveRisk, "R3");
  f.plan.changes[0].path = "README.md";
  f.plan.impacts.authorization = "unknown";
  assert.equal(
    evaluatePlan(f.plan, f.policy, context).implementationPermitted,
    false,
  );
});

test("required structured plan content cannot be omitted or silently defaulted", async (t) => {
  const f = await fixture(t);
  for (const field of [
    "requirements",
    "acceptanceCriteria",
    "architecture",
    "rollback",
    "tests",
  ]) {
    const incomplete = { ...f.plan };
    delete incomplete[field];
    assert.throws(() => validateDocument("plan", incomplete), /INVALID_PLAN/);
  }
});

test("unverifiable acceptance criteria cannot receive a success-shaped plan permit", async (t) => {
  const f = await fixture(t);
  f.plan.acceptanceCriteria = ["Make unrelated business behavior work."];
  const result = evaluatePlan(f.plan, f.policy, {
    authority: await f.verify(),
    files: f.files,
  });
  assert.equal(result.decision, "CONDITIONS_PENDING");
  assert.equal(result.implementationPermitted, false);
});
