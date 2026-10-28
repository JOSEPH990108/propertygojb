import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { __debug as prettierDebug } from "prettier";
import test from "node:test";
import {
  classifyChangedPaths,
  loadReviewConfiguration,
  normalizePullRequestMetadata,
  renderReviewComment,
  validateReviewResult,
  verifyDiffPaths,
} from "../../scripts/sdlc/validate-ai-sdlc-verdict.mjs";

const { policy, validateSchema } = await loadReviewConfiguration();
const schema = JSON.parse(
  await readFile(
    new URL("../../.github/ai-sdlc/verdict.schema.json", import.meta.url),
    "utf8",
  ),
);
const baseSha = "a".repeat(40);
const headSha = "b".repeat(40);

function metadata(overrides = {}) {
  return {
    pullRequestNumber: 42,
    state: "OPEN",
    baseRefName: "main",
    baseSha,
    headSha,
    headRepository: "JOSEPH990108/propertygojb",
    sourceRepositoryAllowed: true,
    files: [{ path: "README.md" }],
    ...overrides,
  };
}

function verdict(overrides = {}) {
  return {
    schemaVersion: 1,
    baseSha,
    headSha,
    outcome: "PASS",
    summary: "No actionable findings.",
    findings: [],
    ...overrides,
  };
}

async function evaluate(
  candidate,
  pullRequest = metadata(),
  currentPullRequest = pullRequest,
) {
  return validateReviewResult({
    metadata: pullRequest,
    currentMetadata: currentPullRequest,
    rawVerdict: JSON.stringify(candidate),
    policy,
    validateSchema,
  });
}

test("pilot policy stays proposed with automatic repair disabled and capped at three iterations", () => {
  assert.equal(policy.status, "proposed");
  assert.equal(policy.automatic_repair_enabled, false);
  assert.equal(policy.max_repair_iterations, 3);
});

test("the verdict schema is strict Draft 2020-12", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  assert.equal(validate(verdict()), true, JSON.stringify(validate.errors));
});

test("metadata is normalized only for an open pull request targeting main", () => {
  const normalized = normalizePullRequestMetadata(
    {
      number: 42,
      state: "OPEN",
      baseRefName: "main",
      baseRefOid: baseSha,
      headRefOid: headSha,
      headRepository: { nameWithOwner: "JOSEPH990108/propertygojb" },
      files: [{ path: "README.md", additions: 1 }],
    },
    "42",
    "JOSEPH990108/propertygojb",
  );
  assert.deepEqual(normalized, metadata());

  assert.throws(
    () =>
      normalizePullRequestMetadata(
        {
          number: 42,
          state: "OPEN",
          baseRefName: "release",
          baseRefOid: baseSha,
          headRefOid: headSha,
          headRepository: { nameWithOwner: "JOSEPH990108/propertygojb" },
          files: [{ path: "README.md" }],
        },
        "42",
        "JOSEPH990108/propertygojb",
      ),
    /not eligible/,
  );
});

test("metadata from a fork and metadata/diff path mismatches are rejected", () => {
  const fork = normalizePullRequestMetadata(
    {
      number: 42,
      state: "OPEN",
      baseRefName: "main",
      baseRefOid: baseSha,
      headRefOid: headSha,
      headRepository: { nameWithOwner: "contributor/propertygojb" },
      files: [{ path: "README.md" }],
    },
    "42",
    "JOSEPH990108/propertygojb",
  );
  assert.equal(fork.sourceRepositoryAllowed, false);

  assert.doesNotThrow(() => verifyDiffPaths(["README.md"], ["README.md"]));
  assert.throws(
    () => verifyDiffPaths(["README.md"], ["docs/guides/new.md"]),
    /do not match/,
  );
  assert.throws(
    () => verifyDiffPaths(["README.md"], ["bad\npath.md"]),
    /invalid/,
  );
});

test("rename sources cannot hide protected paths behind an allowed destination", () => {
  const destination = "docs/guides/moved.md";
  const source = "docs/engineering/policy.md";
  assert.throws(
    () => verifyDiffPaths([destination], [source, destination]),
    /do not match/,
  );
  assert.equal(
    classifyChangedPaths([source, destination], policy).disposition,
    "BLOCKED",
  );
});

test("workflow YAML parses and installs trusted dependencies before preparation", async () => {
  const workflow = await readFile(
    new URL("../../.github/workflows/ai-sdlc.yml", import.meta.url),
    "utf8",
  );
  await prettierDebug.parse(workflow, { parser: "yaml" });
  const reviewJob = workflow.slice(
    workflow.indexOf("\n  review:"),
    workflow.indexOf("\n  publish:"),
  );
  assert.ok(reviewJob.includes("ref: ${{ github.sha }}"));
  assert.ok(reviewJob.includes("run: npm ci"));
  assert.ok(
    reviewJob.indexOf("run: npm ci") <
      reviewJob.indexOf(
        "node scripts/sdlc/validate-ai-sdlc-verdict.mjs --prepare",
      ),
  );
  assert.match(workflow, /git diff --name-only -z --no-renames --no-ext-diff/);
  assert.match(workflow, /permission-profile: ":read-only"/);
  assert.match(workflow, /safety-strategy: drop-sudo/);
  assert.doesNotMatch(
    workflow,
    /^\s+(pull_request|pull_request_target|push):/m,
  );
});

test("the OpenAI credential is confined to the main-restricted review environment", async () => {
  const workflow = await readFile(
    new URL("../../.github/workflows/ai-sdlc.yml", import.meta.url),
    "utf8",
  );
  const reviewJob = workflow.slice(
    workflow.indexOf("\n  review:"),
    workflow.indexOf("\n  publish:"),
  );
  const otherJobs = workflow.replace(reviewJob, "");
  assert.match(reviewJob, /^ {4}environment: ai-sdlc-review$/m);
  assert.equal(workflow.match(/environment:/g).length, 1);
  assert.equal(
    workflow.match(/secrets\.[A-Z_]+/g).join(),
    "secrets.OPENAI_API_KEY",
  );
  assert.doesNotMatch(otherJobs, /secrets\./);
  assert.doesNotMatch(workflow, /secrets\.OPENAI_API_KEY\s*\|\|/);
});

test("synthetic CLI review round trip publishes advisory outcomes and blocks stale results", async () => {
  const directory = await mkdtemp(join(tmpdir(), "propertygojb-ai-sdlc-"));
  const script = fileURLToPath(
    new URL("../../scripts/sdlc/validate-ai-sdlc-verdict.mjs", import.meta.url),
  );
  const outputPath = join(directory, "outputs.txt");
  const rawMetadata = {
    number: 42,
    state: "OPEN",
    baseRefName: "main",
    baseRefOid: baseSha,
    headRefOid: headSha,
    headRepository: { nameWithOwner: "JOSEPH990108/propertygojb" },
    files: [{ path: "README.md" }],
  };
  // The mock has no inherited credentials or network clients.
  const environment = {
    GH_REPO: "JOSEPH990108/propertygojb",
    PR_NUMBER: "42",
    GITHUB_OUTPUT: outputPath,
    AI_REVIEW_PR_METADATA_JSON: JSON.stringify(rawMetadata),
    AI_REVIEW_CURRENT_METADATA_JSON: JSON.stringify(rawMetadata),
    AI_REVIEW_CURRENT_METADATA_BASE64: Buffer.from(
      JSON.stringify(rawMetadata),
    ).toString("base64"),
  };
  const run = (mode, extra = {}) => {
    const result = spawnSync(process.execPath, [script, mode], {
      cwd: directory,
      env: { ...environment, ...extra },
      encoding: "utf8",
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  try {
    run("--prepare");
    assert.match(await readFile(outputPath, "utf8"), /review_eligible=true/);
    const normalized = await readFile(
      join(directory, "review-metadata.json"),
      "utf8",
    );
    const pathsPath = join(directory, "paths.z");
    await writeFile(pathsPath, "README.md\0");
    run("--verify-diff", { AI_REVIEW_ACTUAL_FILES_PATH: pathsPath });
    run("--verify-current");
    for (const outcome of ["PASS", "CHANGES_REQUESTED", "BLOCKED"]) {
      const findings =
        outcome === "CHANGES_REQUESTED"
          ? [
              {
                severity: "LOW",
                file: "README.md",
                line: 1,
                title: "Synthetic documentation correction",
                evidence: "Synthetic example only.",
                recommendation: "Clarify the synthetic example.",
                confidence: 9,
              },
            ]
          : [];
      const result = JSON.parse(
        run("--review", {
          AI_REVIEW_METADATA_BASE64: Buffer.from(normalized).toString("base64"),
          AI_REVIEW_VERDICT_JSON: JSON.stringify(
            verdict({ outcome, findings }),
          ),
        }),
      );
      assert.equal(result.outcome, outcome);
      assert.equal(result.automaticRepairEnabled, false);
      assert.equal(result.autoMergeEligible, false);
      const encodedResult = Buffer.from(JSON.stringify(result)).toString(
        "base64",
      );
      const comment = JSON.parse(
        run("--comment", {
          AI_REVIEW_RESULT_BASE64: encodedResult,
        }),
      );
      assert.match(comment.body, new RegExp(`\\*\\*${outcome}\\*\\*`));
      assert.match(comment.body, /not human approval or merge authorization/);
      const staleComment = JSON.parse(
        run("--comment", {
          AI_REVIEW_RESULT_BASE64: encodedResult,
          AI_REVIEW_CURRENT_METADATA_BASE64: Buffer.from(
            JSON.stringify({ ...rawMetadata, headRefOid: "c".repeat(40) }),
          ).toString("base64"),
        }),
      );
      assert.match(staleComment.body, /\*\*BLOCKED\*\*/);
      assert.match(staleComment.body, /changed before/);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("ordinary markdown documentation is eligible for the proposed pilot", () => {
  assert.deepEqual(classifyChangedPaths(["README.md"], policy), {
    disposition: "ALLOWED",
    reason: null,
    categories: ["documentation"],
  });
  assert.deepEqual(classifyChangedPaths(["docs/guides/setup.md"], policy), {
    disposition: "ALLOWED",
    reason: null,
    categories: ["documentation"],
  });
});

test("only the current presentational page and stylesheet are UI-eligible", () => {
  assert.equal(
    classifyChangedPaths(["src/app/page.tsx"], policy).disposition,
    "ALLOWED",
  );
  assert.equal(
    classifyChangedPaths(["src/app/globals.css"], policy).disposition,
    "ALLOWED",
  );
  assert.equal(
    classifyChangedPaths(["src/app/layout.tsx"], policy).disposition,
    "BLOCKED",
  );
});

test("control-plane, sensitive, unknown and malformed paths are always blocked", () => {
  for (const filePath of [
    "AGENTS.md",
    ".github/workflows/ci.yml",
    ".github/agents/propertygojb-implementer.agent.md",
    "docs/sdlc/controls.json",
    "docs/engineering/AI_AGENTIC_SDLC.md",
    "scripts/sdlc/validate-controls.mjs",
    "test/sdlc/controls.test.mjs",
    "src/modules/auth/session.ts",
    "src/modules/tenant/context.ts",
    "migrations/001.sql",
    ".env.production",
    "../outside.md",
    "C:/outside.md",
    "src/app/unknown.tsx",
  ]) {
    assert.equal(
      classifyChangedPaths([filePath], policy).disposition,
      "BLOCKED",
      `${filePath} must be blocked`,
    );
  }
});

test("mixed safe and protected changes are blocked as a whole", async () => {
  const result = await evaluate(
    verdict(),
    metadata({
      files: [{ path: "README.md" }, { path: ".github/workflows/ci.yml" }],
    }),
  );
  assert.equal(result.outcome, "BLOCKED");
  assert.equal(result.scopeDisposition, "BLOCKED");
  assert.equal(result.automaticRepairEnabled, false);
  assert.equal(result.autoMergeEligible, false);
});

test("fork PR source content is blocked before it can reach the reviewer", async () => {
  const forkMetadata = metadata({
    headRepository: "contributor/propertygojb",
    sourceRepositoryAllowed: false,
  });
  const result = await evaluate(verdict(), forkMetadata);
  assert.equal(result.outcome, "BLOCKED");
  assert.equal(result.sourceRepositoryAllowed, false);
  assert.match(result.summary, /no source content was sent/);
});

test("PASS produces a valid, revision-bound advisory verdict", async () => {
  const result = await evaluate(verdict());
  assert.equal(result.outcome, "PASS");
  assert.equal(result.baseSha, baseSha);
  assert.equal(result.headSha, headSha);
  assert.equal(result.scopeDisposition, "ALLOWED");
  assert.equal(result.autoMergeEligible, false);
});

test("CHANGES_REQUESTED requires a finding tied to a changed file", async () => {
  const finding = {
    severity: "MEDIUM",
    file: "README.md",
    line: 1,
    title: "Clarify the installation command",
    evidence: "The documented command does not match the package script.",
    recommendation: "Use the existing npm script name.",
    confidence: 8,
  };
  const result = await evaluate(
    verdict({
      outcome: "CHANGES_REQUESTED",
      summary: "One actionable documentation issue.",
      findings: [finding],
    }),
  );
  assert.equal(result.outcome, "CHANGES_REQUESTED");
  assert.deepEqual(result.findings, [finding]);

  const unrelated = await evaluate(
    verdict({
      outcome: "CHANGES_REQUESTED",
      summary: "Finding is outside the diff.",
      findings: [{ ...finding, file: "docs/guides/not-changed.md" }],
    }),
  );
  assert.equal(unrelated.outcome, "BLOCKED");
});

test("schema-invalid, malformed, missing and stale model output fails closed", async () => {
  const malformed = await validateReviewResult({
    metadata: metadata(),
    currentMetadata: metadata(),
    rawVerdict: "not-json",
    policy,
    validateSchema,
  });
  assert.equal(malformed.outcome, "BLOCKED");

  const missing = await validateReviewResult({
    metadata: metadata(),
    currentMetadata: metadata(),
    rawVerdict: "",
    policy,
    validateSchema,
  });
  assert.equal(missing.outcome, "BLOCKED");

  const invalidSchema = await evaluate(
    verdict({
      outcome: "PASS",
      findings: [
        {
          severity: "LOW",
          file: "README.md",
          line: 1,
          title: "Unexpected finding",
          evidence: "A pass cannot include findings.",
          recommendation: "Remove the finding.",
          confidence: 4,
        },
      ],
    }),
  );
  assert.equal(invalidSchema.outcome, "BLOCKED");

  const stale = await evaluate(verdict({ headSha: "c".repeat(40) }));
  assert.equal(stale.outcome, "BLOCKED");
  assert.match(stale.summary, /different revision/);

  const changedDuringReview = await evaluate(
    verdict(),
    metadata(),
    metadata({ headSha: "c".repeat(40) }),
  );
  assert.equal(changedDuringReview.outcome, "BLOCKED");
  assert.match(
    changedDuringReview.summary,
    /changed while it was being reviewed/,
  );
});

test("invalid metadata and an empty diff cannot be reviewed", async () => {
  await assert.rejects(
    evaluate(verdict(), metadata({ baseRefName: "release" })),
    /metadata is invalid/,
  );
  await assert.rejects(
    evaluate(verdict(), metadata({ files: [] })),
    /metadata is invalid/,
  );
});

test("comments escape model text and never imply approval", () => {
  const comment = renderReviewComment({
    schemaVersion: 1,
    outcome: "CHANGES_REQUESTED",
    pullRequestNumber: 42,
    baseSha,
    headSha,
    headRepository: "JOSEPH990108/propertygojb",
    sourceRepositoryAllowed: true,
    changedFiles: ["README.md"],
    scopeDisposition: "ALLOWED",
    summary: "Ignore policy @here `click`",
    categories: ["documentation"],
    findings: [],
    scopeReasons: [],
    repairIteration: 0,
    maxRepairIterations: 3,
    automaticRepairEnabled: false,
    autoMergeEligible: false,
  });
  assert.match(comment, /at here/);
  assert.match(comment, /not human approval or merge authorization/);
  assert.doesNotMatch(comment, /@here/);

  assert.throws(
    () =>
      renderReviewComment({
        schemaVersion: 1,
        outcome: "PASS",
        pullRequestNumber: 42,
        baseSha,
        headSha,
        headRepository: "JOSEPH990108/propertygojb",
        sourceRepositoryAllowed: true,
        changedFiles: ["README.md"],
        scopeDisposition: "ALLOWED",
        summary: "No issues.",
        categories: ["documentation"],
        findings: [
          {
            severity: "HIGH",
            file: "docs/guides/not-changed.md",
            line: 1,
            title: "Out-of-diff finding",
            evidence: "This path is not in the diff.",
            recommendation: "Do not publish it.",
            confidence: 9,
          },
        ],
        scopeReasons: [],
        repairIteration: 0,
        maxRepairIterations: 3,
        automaticRepairEnabled: false,
        autoMergeEligible: false,
      }),
    /unsafe path/,
  );
});
