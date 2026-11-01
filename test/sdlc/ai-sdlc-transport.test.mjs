import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import test from "node:test";
import {
  loadReviewConfiguration,
  validateReviewResult,
} from "../../scripts/sdlc/validate-ai-sdlc-verdict.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const transportPath = join(
  root,
  ".github",
  "ai-sdlc",
  "verdict.transport.schema.json",
);
const transport = JSON.parse(await readFile(transportPath, "utf8"));
const { policy, schema, validateSchema } = await loadReviewConfiguration();
const validateTransport = new Ajv2020({
  strict: true,
  allErrors: true,
}).compile(transport);
const baseSha = "a".repeat(40);
const headSha = "b".repeat(40);
const metadata = {
  pullRequestNumber: 42,
  state: "OPEN",
  baseRefName: "main",
  baseSha,
  headSha,
  headRepository: "JOSEPH990108/propertygojb",
  sourceRepositoryAllowed: true,
  files: [{ path: "docs/guides/ai-review-schema-smoke.md" }],
};
const finding = {
  severity: "LOW",
  file: metadata.files[0].path,
  line: 1,
  title: "Clarify the synthetic example",
  evidence: "The synthetic example has an ambiguous label.",
  recommendation: "Use an explicit synthetic label.",
  confidence: 9,
};
const verdict = (overrides = {}) => ({
  schemaVersion: 1,
  baseSha,
  headSha,
  outcome: "PASS",
  summary: "No actionable findings in the synthetic document.",
  findings: [],
  ...overrides,
});
const withFinding = (overrides = {}) =>
  verdict({
    outcome: "CHANGES_REQUESTED",
    findings: [{ ...finding, ...overrides }],
  });
const evaluate = (rawVerdict, currentMetadata = metadata) =>
  validateReviewResult({
    metadata,
    currentMetadata,
    rawVerdict,
    policy,
    validateSchema,
  });

// This is our conservative transport subset, not an emulator of DeepSeek.
function assertTransportSubset(node) {
  const allowed = {
    object: [
      "type",
      "description",
      "properties",
      "required",
      "additionalProperties",
    ],
    array: ["type", "description", "items"],
    string: ["type", "description", "enum"],
    integer: ["type", "description", "enum"],
  };
  assert.ok(
    Object.hasOwn(allowed, node.type),
    "explicit supported type required",
  );
  for (const key of Object.keys(node)) {
    assert.ok(
      allowed[node.type].includes(key),
      `unsupported transport keyword: ${key}`,
    );
  }
  if (node.type === "object") {
    assert.equal(node.additionalProperties, false);
    assert.deepEqual(
      [...node.required].sort(),
      Object.keys(node.properties).sort(),
    );
    Object.values(node.properties).forEach(assertTransportSubset);
  }
  if (node.type === "array") assertTransportSubset(node.items);
}

function assertSameShape(local, wire) {
  assert.equal(wire.type, local.type ?? "integer");
  if (Object.hasOwn(local, "const")) assert.deepEqual(wire.enum, [local.const]);
  if (local.enum) assert.deepEqual(wire.enum, local.enum);
  if (local.type === "object") {
    assert.deepEqual(wire.required, local.required);
    assert.equal(wire.additionalProperties, local.additionalProperties);
    assert.deepEqual(
      Object.keys(wire.properties),
      Object.keys(local.properties),
    );
    for (const key of local.required) {
      assertSameShape(local.properties[key], wire.properties[key]);
    }
  }
  if (local.type === "array") assertSameShape(local.items, wire.items);
}

test("transport uses explicit types and closed required objects without strict-local keywords", () => {
  assertTransportSubset(transport);
  assertSameShape(schema, transport);
  assert.throws(
    () => assertTransportSubset(schema),
    /unsupported transport keyword/,
  );
  assert.throws(
    () => assertTransportSubset({ const: 1 }),
    /explicit supported type/,
  );
  for (const keyword of [
    "allOf",
    "if",
    "then",
    "else",
    "const",
    "minLength",
    "maxLength",
    "minItems",
    "maxItems",
    "pattern",
    "minimum",
    "maximum",
  ]) {
    assert.throws(
      () => assertTransportSubset({ ...transport, [keyword]: {} }),
      /unsupported transport keyword/,
    );
  }
});

test("valid PASS, actionable CHANGES_REQUESTED and BLOCKED satisfy both contracts", async () => {
  for (const candidate of [
    verdict(),
    withFinding(),
    verdict({
      outcome: "BLOCKED",
      summary: "Insufficient synthetic evidence.",
    }),
    verdict({ outcome: "BLOCKED", findings: [finding] }),
  ]) {
    assert.equal(validateTransport(candidate), true);
    assert.equal(validateSchema(candidate), true);
    const result = await evaluate(JSON.stringify(candidate));
    assert.equal(result.outcome, candidate.outcome);
    assert.deepEqual(result.findings, candidate.findings);
    assert.equal(result.automaticRepairEnabled, false);
    assert.equal(result.autoMergeEligible, false);
  }
});

test("transport-valid outcome and bound violations still fail authoritative validation", async (t) => {
  const cases = [
    ["PASS with findings", verdict({ findings: [finding] })],
    [
      "CHANGES_REQUESTED without findings",
      verdict({ outcome: "CHANGES_REQUESTED" }),
    ],
    ["empty summary", verdict({ summary: "" })],
    ["long summary", verdict({ summary: "x".repeat(2001) })],
    ["invalid base SHA", verdict({ baseSha: "A".repeat(40) })],
    ["short head SHA", verdict({ headSha: "b".repeat(39) })],
    [
      "31 findings",
      verdict({
        outcome: "CHANGES_REQUESTED",
        findings: Array(31).fill(finding),
      }),
    ],
    ["zero line", withFinding({ line: 0 })],
    ["zero confidence", withFinding({ confidence: 0 })],
    ["excess confidence", withFinding({ confidence: 11 })],
  ];
  for (const [key, maximum] of [
    ["file", 512],
    ["title", 200],
    ["evidence", 1500],
    ["recommendation", 1500],
  ]) {
    cases.push([`empty ${key}`, withFinding({ [key]: "" })]);
    cases.push([
      `long ${key}`,
      withFinding({ [key]: "x".repeat(maximum + 1) }),
    ]);
  }
  for (const [name, candidate] of cases) {
    await t.test(name, async () => {
      assert.equal(
        validateTransport(candidate),
        true,
        "transport is not authoritative",
      );
      assert.equal(validateSchema(candidate), false);
      const result = await evaluate(JSON.stringify(candidate));
      assert.equal(result.outcome, "BLOCKED");
      assert.deepEqual(result.findings, []);
      assert.deepEqual(result.scopeReasons, [
        "Reviewer output failed schema validation.",
      ]);
    });
  }
});

test("authoritative inclusive size and numeric limits remain accepted", () => {
  const candidate = withFinding({
    file: "x".repeat(512),
    title: "x".repeat(200),
    evidence: "x".repeat(1500),
    recommendation: "x".repeat(1500),
    confidence: 10,
  });
  candidate.summary = "x".repeat(2000);
  candidate.findings = Array(30).fill(candidate.findings[0]);
  assert.equal(validateSchema(candidate), true);
  assert.equal(validateTransport(candidate), true);
});

test("missing fields, invalid types and unexpected properties fail closed", async (t) => {
  const cases = [
    ["unexpected root property", verdict({ automaticRepairEnabled: true })],
    ["unexpected finding property", withFinding({ command: "do not execute" })],
    ["unknown outcome", verdict({ outcome: "APPROVED" })],
    ["unknown severity", withFinding({ severity: "INFO" })],
    ["wrong version", verdict({ schemaVersion: 2 })],
    ["fractional line", withFinding({ line: 1.5 })],
    ["fractional confidence", withFinding({ confidence: 1.5 })],
  ];
  for (const key of schema.required) {
    const missing = verdict();
    delete missing[key];
    cases.push([`missing ${key}`, missing]);
    cases.push([`null ${key}`, verdict({ [key]: null })]);
  }
  for (const key of schema.properties.findings.items.required) {
    const missing = withFinding();
    delete missing.findings[0][key];
    cases.push([`missing finding ${key}`, missing]);
    cases.push([`null finding ${key}`, withFinding({ [key]: null })]);
  }
  for (const [name, candidate] of cases) {
    await t.test(name, async () => {
      assert.equal(validateTransport(candidate), false);
      assert.equal(validateSchema(candidate), false);
      assert.equal(
        (await evaluate(JSON.stringify(candidate))).outcome,
        "BLOCKED",
      );
    });
  }
});

test("stale base/head output and current revisions never produce PASS", async () => {
  for (const key of ["baseSha", "headSha"]) {
    const stale = verdict({ [key]: "c".repeat(40) });
    assert.equal(validateTransport(stale), true);
    assert.equal(validateSchema(stale), true);
    const result = await evaluate(JSON.stringify(stale));
    assert.equal(result.outcome, "BLOCKED");
    assert.match(result.summary, /different revision/);
    const changed = await evaluate(JSON.stringify(verdict()), {
      ...metadata,
      [key]: "c".repeat(40),
    });
    assert.equal(changed.outcome, "BLOCKED");
    assert.match(changed.summary, /changed while/);
  }
});

test("provider errors, refusals, malformed, empty and oversized responses fail closed", async () => {
  for (const raw of [
    undefined,
    "",
    " ",
    "null",
    "[]",
    "false",
    "not JSON",
    "{",
    "```json\n" + JSON.stringify(verdict()) + "\n```",
    JSON.stringify({
      error: { type: "invalid_request_error", message: "Invalid json schema" },
    }),
    JSON.stringify({ refusal: "Unable to review." }),
    JSON.stringify({ status: "incomplete", output: [] }),
    "x".repeat(131073),
  ]) {
    const result = await evaluate(raw);
    assert.equal(result.outcome, "BLOCKED");
    assert.deepEqual(result.findings, []);
    assert.equal(result.automaticRepairEnabled, false);
    assert.equal(result.autoMergeEligible, false);
    assert.ok(result.scopeReasons.length > 0);
  }
});

test("CLI validation cannot read the transport schema, execute children or write the repository", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "propertygojb-transport-boundary-"),
  );
  const outputPath = join(directory, "outputs.txt");
  const script = join(root, "scripts", "sdlc", "validate-ai-sdlc-verdict.mjs");
  const args = [
    "--permission",
    `--allow-fs-read=${script}`,
    `--allow-fs-read=${join(root, "package.json")}`,
    `--allow-fs-read=${join(root, "node_modules")}`,
    `--allow-fs-read=${join(root, ".github", "ai-sdlc", "verdict.schema.json")}`,
    `--allow-fs-read=${join(root, ".github", "ai-sdlc", "pilot-policy.json")}`,
    `--allow-fs-write=${outputPath}`,
  ];
  const environment = {
    GH_REPO: metadata.headRepository,
    GITHUB_OUTPUT: outputPath,
    AI_REVIEW_METADATA_BASE64: Buffer.from(JSON.stringify(metadata)).toString(
      "base64",
    ),
    AI_REVIEW_CURRENT_METADATA_BASE64: Buffer.from(
      JSON.stringify({
        number: 42,
        state: "OPEN",
        baseRefName: "main",
        baseRefOid: baseSha,
        headRefOid: headSha,
        headRepository: { nameWithOwner: metadata.headRepository },
        files: metadata.files,
      }),
    ).toString("base64"),
  };
  const run = (command, env = {}) =>
    spawnSync(process.execPath, [...args, ...command], {
      cwd: directory,
      env: { ...environment, ...env },
      encoding: "utf8",
    });
  try {
    for (const program of [
      `import { readFileSync } from "node:fs"; readFileSync(${JSON.stringify(transportPath)});`,
      `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(join(directory, "unauthorized.txt"))}, "denied");`,
      `import { spawnSync } from "node:child_process"; spawnSync(process.execPath, ["--version"]);`,
    ]) {
      const denied = run(["--input-type=module", "-e", program]);
      assert.equal(denied.error, undefined);
      assert.notEqual(denied.status, 0);
      assert.match(denied.stderr, /ERR_ACCESS_DENIED/);
    }
    for (const [raw, expected] of [
      [
        JSON.stringify(
          verdict({
            summary:
              "Synthetic untrusted text: $(echo no) @all https://example.invalid",
          }),
        ),
        "PASS",
      ],
      [JSON.stringify(verdict({ findings: [finding] })), "BLOCKED"],
      [JSON.stringify(verdict({ outcome: "CHANGES_REQUESTED" })), "BLOCKED"],
      ["", "BLOCKED"],
      ['{"error":"Invalid json schema"}', "BLOCKED"],
    ]) {
      const result = run([script, "--review"], { AI_REVIEW_VERDICT_JSON: raw });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(JSON.parse(result.stdout).outcome, expected);
    }
    assert.deepEqual(await readdir(directory), ["outputs.txt"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("workflow submits only transport and retains trusted fail-closed publication", async () => {
  const workflow = await readFile(
    join(root, ".github", "workflows", "ai-sdlc.yml"),
    "utf8",
  );
  assert.match(
    workflow,
    /^ +output-schema-file: \.github\/ai-sdlc\/verdict\.transport\.schema\.json$/m,
  );
  assert.match(
    workflow,
    /authoritative local output contract is \.github\/ai-sdlc\/verdict\.schema\.json/,
  );
  const review = workflow.slice(
    workflow.indexOf("\n  review:"),
    workflow.indexOf("\n  publish:"),
  );
  const publish = workflow.slice(workflow.indexOf("\n  publish:"));
  assert.match(workflow, /^ {2}workflow_dispatch:$/m);
  assert.doesNotMatch(
    workflow,
    /^\s+(pull_request|pull_request_target|push|schedule|workflow_run|workflow_call):/m,
  );
  assert.match(review, /permission-profile: ":read-only"/);
  assert.match(review, /safety-strategy: drop-sudo/);
  assert.match(
    review,
    /Do not execute code, edit files, access external services/,
  );
  assert.match(
    review,
    /if: steps\.prepare\.outputs\.review_eligible == 'true'/,
  );
  assert.match(publish, /if: always\(\) && needs\.review\.result == 'success'/);
  assert.match(
    publish,
    /AI_REVIEW_VERDICT_JSON: \$\{\{ needs\.review\.outputs\.verdict \}\}/,
  );
  assert.match(
    publish,
    /node scripts\/sdlc\/validate-ai-sdlc-verdict\.mjs --review/,
  );
  assert.match(
    publish,
    /node scripts\/sdlc\/validate-ai-sdlc-verdict\.mjs --comment/,
  );
  assert.ok(publish.indexOf("--review") < publish.indexOf("--comment"));
  assert.ok(publish.indexOf("--comment") < publish.indexOf("gh api"));
  assert.match(
    publish,
    /if \[ "\$REVIEW_OUTCOME" != "PASS" \]; then[\s\S]*exit 1/,
  );
  assert.doesNotMatch(
    workflow,
    /continue-on-error|git (push|commit)|gh pr (merge|edit)|danger-full-access/,
  );
  assert.equal(workflow.match(/ref: \$\{\{ github\.sha \}\}/g).length, 2);
  assert.equal(workflow.match(/persist-credentials: false/g).length, 2);
});
