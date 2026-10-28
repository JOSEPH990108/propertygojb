import { Buffer } from "node:buffer";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const policyPath = new URL(
  "../../.github/ai-sdlc/pilot-policy.json",
  import.meta.url,
);
const schemaPath = new URL(
  "../../.github/ai-sdlc/verdict.schema.json",
  import.meta.url,
);
const shaPattern = /^[a-f0-9]{40}$/;
const reviewResultSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "pullRequestNumber",
    "baseSha",
    "headSha",
    "headRepository",
    "sourceRepositoryAllowed",
    "changedFiles",
    "outcome",
    "scopeDisposition",
    "scopeReasons",
    "categories",
    "summary",
    "findings",
    "repairIteration",
    "maxRepairIterations",
    "automaticRepairEnabled",
    "autoMergeEligible",
  ],
  properties: {
    schemaVersion: { const: 1 },
    pullRequestNumber: { type: "integer", minimum: 1 },
    baseSha: { type: "string", pattern: "^[a-f0-9]{40}$" },
    headSha: { type: "string", pattern: "^[a-f0-9]{40}$" },
    headRepository: { type: "string", minLength: 1, maxLength: 255 },
    sourceRepositoryAllowed: { type: "boolean" },
    changedFiles: {
      type: "array",
      minItems: 1,
      maxItems: 300,
      items: { type: "string", minLength: 1, maxLength: 512 },
    },
    outcome: {
      type: "string",
      enum: ["PASS", "CHANGES_REQUESTED", "BLOCKED"],
    },
    scopeDisposition: { type: "string", enum: ["ALLOWED", "BLOCKED"] },
    scopeReasons: {
      type: "array",
      maxItems: 5,
      items: { type: "string", maxLength: 500 },
    },
    categories: {
      type: "array",
      items: {
        type: "string",
        enum: ["documentation", "presentation-ui"],
      },
    },
    summary: { type: "string", minLength: 1, maxLength: 2000 },
    findings: {
      type: "array",
      maxItems: 30,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "severity",
          "file",
          "line",
          "title",
          "evidence",
          "recommendation",
          "confidence",
        ],
        properties: {
          severity: {
            type: "string",
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
          },
          file: { type: "string", minLength: 1, maxLength: 512 },
          line: { type: "integer", minimum: 1 },
          title: { type: "string", minLength: 1, maxLength: 200 },
          evidence: { type: "string", minLength: 1, maxLength: 1500 },
          recommendation: { type: "string", minLength: 1, maxLength: 1500 },
          confidence: { type: "integer", minimum: 1, maximum: 10 },
        },
      },
    },
    repairIteration: { const: 0 },
    maxRepairIterations: { const: 3 },
    automaticRepairEnabled: { const: false },
    autoMergeEligible: { const: false },
  },
};
const validateReviewResultSchema = new Ajv2020({
  allErrors: true,
  strict: true,
}).compile(reviewResultSchema);

export async function loadReviewConfiguration() {
  const [policyText, schemaText] = await Promise.all([
    readFile(policyPath, "utf8"),
    readFile(schemaPath, "utf8"),
  ]);
  const policy = JSON.parse(policyText);
  const schema = JSON.parse(schemaText);

  if (
    policy.version !== 1 ||
    policy.status !== "proposed" ||
    policy.automatic_repair_enabled !== false ||
    policy.max_repair_iterations !== 3 ||
    !Number.isInteger(policy.max_patch_bytes) ||
    policy.max_patch_bytes < 1 ||
    !Number.isInteger(policy.max_findings) ||
    policy.max_findings < 1 ||
    !Array.isArray(policy.documentation_allowlist) ||
    !Array.isArray(policy.ui_allowlist) ||
    !Array.isArray(policy.blocked_exact_paths) ||
    !Array.isArray(policy.blocked_path_prefixes) ||
    !Array.isArray(policy.blocked_path_segments)
  ) {
    throw new Error("AI review pilot policy is invalid or not fail-closed");
  }

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validateSchema = ajv.compile(schema);

  return { policy, schema, validateSchema };
}

export function normalizePullRequestMetadata(
  input,
  expectedNumber,
  expectedRepository,
) {
  const pullRequestNumber = Number(expectedNumber);
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    !Number.isInteger(pullRequestNumber) ||
    pullRequestNumber < 1 ||
    input.number !== pullRequestNumber ||
    input.state !== "OPEN" ||
    input.baseRefName !== "main" ||
    !shaPattern.test(input.baseRefOid) ||
    !shaPattern.test(input.headRefOid) ||
    typeof expectedRepository !== "string" ||
    typeof input.headRepository?.nameWithOwner !== "string" ||
    !Array.isArray(input.files) ||
    input.files.length === 0
  ) {
    throw new Error(
      "Pull request metadata is invalid or not eligible for review",
    );
  }

  const files = input.files.map((file) => {
    if (!file || typeof file !== "object" || !isSafeRepoPath(file.path)) {
      throw new Error("Pull request contains an invalid changed-file path");
    }
    return { path: file.path };
  });

  return {
    pullRequestNumber,
    state: input.state,
    baseRefName: input.baseRefName,
    baseSha: input.baseRefOid,
    headSha: input.headRefOid,
    headRepository: input.headRepository.nameWithOwner,
    sourceRepositoryAllowed:
      input.headRepository.nameWithOwner === expectedRepository,
    files,
  };
}

function isSafeRepoPath(filePath) {
  return (
    typeof filePath === "string" &&
    filePath.length > 0 &&
    filePath.length <= 512 &&
    !filePath.startsWith("/") &&
    !filePath.includes("\\") &&
    !/[\p{C}]/u.test(filePath) &&
    !filePath
      .split("/")
      .some((part) => part === "" || part === "." || part === "..")
  );
}

export function verifyDiffPaths(expectedFiles, actualPaths) {
  if (
    !Array.isArray(expectedFiles) ||
    !Array.isArray(actualPaths) ||
    expectedFiles.some((filePath) => !isSafeRepoPath(filePath)) ||
    actualPaths.some((filePath) => !isSafeRepoPath(filePath))
  ) {
    throw new Error("Diff paths are invalid");
  }

  const expected = [...new Set(expectedFiles)].sort();
  const actual = [...new Set(actualPaths)].sort();
  if (
    expected.length !== actual.length ||
    expected.some((filePath, index) => filePath !== actual[index])
  ) {
    throw new Error(
      "Pull request changed paths do not match the reviewed diff",
    );
  }
}

function isSameRevision(expected, actual) {
  const expectedFiles = expected.files.map((file) => file.path).sort();
  const actualFiles = actual.files.map((file) => file.path).sort();
  return (
    actual.pullRequestNumber === expected.pullRequestNumber &&
    actual.state === "OPEN" &&
    actual.baseRefName === "main" &&
    actual.baseSha === expected.baseSha &&
    actual.headSha === expected.headSha &&
    actual.headRepository === expected.headRepository &&
    actual.sourceRepositoryAllowed === expected.sourceRepositoryAllowed &&
    actualFiles.length === expectedFiles.length &&
    expectedFiles.every((filePath, index) => filePath === actualFiles[index])
  );
}

export function classifyChangedPaths(paths, policy) {
  if (!Array.isArray(paths) || paths.length === 0) {
    return {
      disposition: "BLOCKED",
      reason: "The changed-file list is empty or invalid.",
      categories: [],
    };
  }

  const categories = [];
  for (const filePath of paths) {
    if (!isSafeRepoPath(filePath)) {
      return {
        disposition: "BLOCKED",
        reason: "A changed path is malformed or escapes the repository.",
        categories,
      };
    }

    const segments = filePath.toLowerCase().split("/");
    if (
      policy.blocked_exact_paths.includes(filePath) ||
      policy.blocked_path_prefixes.some((prefix) =>
        filePath.startsWith(prefix),
      ) ||
      segments.some((segment) =>
        policy.blocked_path_segments.includes(segment),
      ) ||
      /(^|\/)\.env(?:\.|$)/i.test(filePath)
    ) {
      return {
        disposition: "BLOCKED",
        reason: "A changed path is in a protected or sensitive area.",
        categories,
      };
    }

    if (
      policy.documentation_allowlist.some(
        (allowedPath) =>
          filePath === allowedPath ||
          (allowedPath.endsWith("/") && filePath.startsWith(allowedPath)),
      )
    ) {
      if (!filePath.endsWith(".md") && filePath !== "README.md") {
        return {
          disposition: "BLOCKED",
          reason: "The documentation pilot only permits Markdown files.",
          categories,
        };
      }
      categories.push("documentation");
      continue;
    }

    if (policy.ui_allowlist.includes(filePath)) {
      categories.push("presentation-ui");
      continue;
    }

    return {
      disposition: "BLOCKED",
      reason: "A changed path is outside the proposed pilot allowlist.",
      categories,
    };
  }

  return {
    disposition: "ALLOWED",
    reason: null,
    categories: [...new Set(categories)],
  };
}

function validateMetadata(metadata) {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata) ||
    !Number.isInteger(metadata.pullRequestNumber) ||
    metadata.pullRequestNumber < 1 ||
    metadata.state !== "OPEN" ||
    metadata.baseRefName !== "main" ||
    !shaPattern.test(metadata.baseSha) ||
    !shaPattern.test(metadata.headSha) ||
    typeof metadata.headRepository !== "string" ||
    typeof metadata.sourceRepositoryAllowed !== "boolean" ||
    !Array.isArray(metadata.files) ||
    metadata.files.length === 0 ||
    metadata.files.some(
      (file) => !file || typeof file !== "object" || !isSafeRepoPath(file.path),
    )
  ) {
    throw new Error(
      "Pull request metadata is invalid or not eligible for review",
    );
  }
}

function blockedResult(metadata, scope, summary, reason) {
  return {
    schemaVersion: 1,
    pullRequestNumber: metadata.pullRequestNumber,
    baseSha: metadata.baseSha,
    headSha: metadata.headSha,
    headRepository: metadata.headRepository,
    sourceRepositoryAllowed: metadata.sourceRepositoryAllowed,
    changedFiles: metadata.files.map((file) => file.path),
    outcome: "BLOCKED",
    scopeDisposition: scope.disposition,
    scopeReasons: reason ? [reason] : [],
    categories: scope.categories,
    summary,
    findings: [],
    repairIteration: 0,
    maxRepairIterations: 3,
    automaticRepairEnabled: false,
    autoMergeEligible: false,
  };
}

export async function validateReviewResult({
  metadata,
  currentMetadata,
  rawVerdict,
  policy,
  validateSchema,
}) {
  validateMetadata(metadata);
  const changedPaths = metadata.files.map((file) => file.path);
  const scope = classifyChangedPaths(changedPaths, policy);

  if (!metadata.sourceRepositoryAllowed) {
    const forkScope = {
      disposition: "BLOCKED",
      reason:
        "Fork pull requests are not sent to external review in this prototype.",
      categories: scope.categories,
    };
    return blockedResult(
      metadata,
      forkScope,
      "Fork pull requests require human review; no source content was sent to the reviewer.",
      forkScope.reason,
    );
  }

  if (!currentMetadata || !isSameRevision(metadata, currentMetadata)) {
    return blockedResult(
      metadata,
      scope,
      "The pull request changed while it was being reviewed; rerun against the current head.",
      "Pull request metadata changed during review.",
    );
  }

  if (scope.disposition === "BLOCKED") {
    return blockedResult(
      metadata,
      scope,
      "This change is outside the proposed low-risk pilot; human review is required.",
      scope.reason,
    );
  }

  if (
    typeof rawVerdict !== "string" ||
    rawVerdict.length === 0 ||
    rawVerdict.length > 131072
  ) {
    return blockedResult(
      metadata,
      scope,
      "The reviewer output is missing or exceeds the supported size; rerun or review manually.",
      "Reviewer output size is invalid.",
    );
  }

  let verdict;
  try {
    verdict = JSON.parse(rawVerdict);
  } catch {
    return blockedResult(
      metadata,
      scope,
      "The reviewer output was not valid JSON; rerun or review manually.",
      "Reviewer output is malformed.",
    );
  }

  if (!validateSchema(verdict)) {
    return blockedResult(
      metadata,
      scope,
      "The reviewer output did not match the required schema; rerun or review manually.",
      "Reviewer output failed schema validation.",
    );
  }

  if (
    verdict.baseSha !== metadata.baseSha ||
    verdict.headSha !== metadata.headSha
  ) {
    return blockedResult(
      metadata,
      scope,
      "The reviewer output refers to a different revision; rerun against the current head.",
      "Reviewer output SHA does not match the pull request.",
    );
  }

  if (verdict.findings.length > policy.max_findings) {
    return blockedResult(
      metadata,
      scope,
      "The reviewer returned more findings than the pilot allows; human review is required.",
      "Finding count exceeds the pilot limit.",
    );
  }

  const changedPathSet = new Set(changedPaths);
  if (verdict.findings.some((finding) => !changedPathSet.has(finding.file))) {
    return blockedResult(
      metadata,
      scope,
      "A finding references a file outside this pull request; human review is required.",
      "Finding path is not part of the reviewed diff.",
    );
  }

  const result = {
    schemaVersion: 1,
    pullRequestNumber: metadata.pullRequestNumber,
    baseSha: metadata.baseSha,
    headSha: metadata.headSha,
    headRepository: metadata.headRepository,
    sourceRepositoryAllowed: metadata.sourceRepositoryAllowed,
    changedFiles: changedPaths,
    outcome: verdict.outcome,
    scopeDisposition: scope.disposition,
    scopeReasons: [],
    categories: scope.categories,
    summary: verdict.summary,
    findings: verdict.findings,
    repairIteration: 0,
    maxRepairIterations: policy.max_repair_iterations,
    automaticRepairEnabled: policy.automatic_repair_enabled,
    autoMergeEligible: false,
  };

  if (verdict.outcome === "BLOCKED") {
    result.scopeReasons.push(
      "The independent reviewer requested human review.",
    );
  }

  return result;
}

function safeText(value, maxLength) {
  const markdownCharacters = new Set([
    "\\",
    "`",
    "*",
    "_",
    "{",
    "}",
    "[",
    "]",
    "(",
    ")",
    "#",
    "+",
    "!",
    "|",
    "<",
    ">",
  ]);
  return value
    .replace(/[\p{C}]/gu, " ")
    .replace(/\bhttps?:\/\/\S+/gi, "external link omitted")
    .replace(/@/g, " at ")
    .replace(/./gs, (character) =>
      markdownCharacters.has(character) ? " " : character,
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function validateCommentResult(result) {
  if (!validateReviewResultSchema(result)) {
    throw new Error("Validated review result is invalid");
  }
  if (
    result.changedFiles.some((filePath) => !isSafeRepoPath(filePath)) ||
    result.findings.some(
      (finding) =>
        !isSafeRepoPath(finding.file) ||
        !result.changedFiles.includes(finding.file),
    )
  ) {
    throw new Error("Validated review result contains an unsafe path");
  }
  if (
    result.findings.some(
      (finding) => !result.changedFiles.includes(finding.file),
    )
  ) {
    throw new Error("Validated review result contains an out-of-diff finding");
  }
}

export function renderReviewComment(result) {
  validateCommentResult(result);
  const lines = [
    `AI review outcome: **${result.outcome}**`,
    `Reviewed head: \`${result.headSha}\``,
    `Scope: ${result.scopeDisposition} (proposed pilot; not an approval)`,
    `Summary: ${safeText(result.summary, 1200)}`,
  ];

  if (result.findings.length > 0) {
    lines.push("", "Findings:");
    for (const [index, finding] of result.findings.entries()) {
      lines.push(
        `${index + 1}. **${finding.severity}** — ${safeText(finding.file, 512)}:${finding.line} — ${safeText(finding.title, 200)}`,
        `   Evidence: ${safeText(finding.evidence, 800)}`,
        `   Suggested correction: ${safeText(finding.recommendation, 800)}`,
        `   Confidence: ${finding.confidence}/10`,
      );
    }
  }

  if (result.scopeReasons.length > 0) {
    lines.push(
      "",
      `Blocked reason: ${safeText(result.scopeReasons.join(" "), 500)}`,
    );
  }

  lines.push(
    "",
    "_Advisory AI output; not human approval or merge authorization._",
  );
  return lines.join("\n");
}

async function writeGitHubOutputs(result) {
  if (!process.env.GITHUB_OUTPUT) return;
  const encoded = Buffer.from(JSON.stringify(result), "utf8").toString(
    "base64",
  );
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `outcome=${result.outcome}\nresult_base64=${encoded}\n`,
    "utf8",
  );
}

async function main() {
  const { policy, validateSchema } = await loadReviewConfiguration();
  const mode = process.argv[2] ?? "--self-check";

  if (mode === "--self-check") {
    process.stdout.write(
      `AI review policy/schema valid; status=${policy.status}; repair_enabled=${policy.automatic_repair_enabled}\n`,
    );
    return;
  }

  if (mode === "--prepare") {
    const rawMetadata = process.env.AI_REVIEW_PR_METADATA_JSON;
    if (typeof rawMetadata !== "string" || rawMetadata.length === 0) {
      throw new Error("Pull request metadata input is required");
    }
    const metadata = normalizePullRequestMetadata(
      JSON.parse(rawMetadata),
      process.env.PR_NUMBER,
      process.env.GH_REPO,
    );
    await writeFile(
      "review-metadata.json",
      `${JSON.stringify(metadata, null, 2)}\n`,
      "utf8",
    );
    if (process.env.GITHUB_OUTPUT) {
      const encoded = Buffer.from(JSON.stringify(metadata), "utf8").toString(
        "base64",
      );
      const scope = classifyChangedPaths(
        metadata.files.map((file) => file.path),
        policy,
      );
      const eligible =
        metadata.sourceRepositoryAllowed && scope.disposition === "ALLOWED";
      await appendFile(
        process.env.GITHUB_OUTPUT,
        `metadata_base64=${encoded}\nbase_sha=${metadata.baseSha}\nhead_sha=${metadata.headSha}\nreview_eligible=${eligible}\n`,
        "utf8",
      );
    }
    return;
  }

  if (mode === "--verify-diff") {
    const metadata = JSON.parse(await readFile("review-metadata.json", "utf8"));
    const pathsFile = process.env.AI_REVIEW_ACTUAL_FILES_PATH;
    if (!pathsFile) {
      throw new Error("Actual changed-file list is required");
    }
    const actualPaths = (await readFile(pathsFile, "utf8"))
      .split("\0")
      .filter(Boolean);
    verifyDiffPaths(
      metadata.files.map((file) => file.path),
      actualPaths,
    );
    return;
  }

  if (mode === "--verify-current") {
    const metadata = JSON.parse(await readFile("review-metadata.json", "utf8"));
    const rawCurrentMetadata = process.env.AI_REVIEW_CURRENT_METADATA_JSON;
    if (
      typeof rawCurrentMetadata !== "string" ||
      rawCurrentMetadata.length === 0
    ) {
      throw new Error("Current pull request metadata is required");
    }
    const currentMetadata = normalizePullRequestMetadata(
      JSON.parse(rawCurrentMetadata),
      metadata.pullRequestNumber,
      process.env.GH_REPO,
    );
    if (!isSameRevision(metadata, currentMetadata)) {
      throw new Error("Pull request changed during review preparation");
    }
    return;
  }

  if (mode === "--review") {
    const metadata = JSON.parse(
      Buffer.from(
        process.env.AI_REVIEW_METADATA_BASE64 ?? "",
        "base64",
      ).toString("utf8"),
    );
    const rawCurrentMetadata = Buffer.from(
      process.env.AI_REVIEW_CURRENT_METADATA_BASE64 ?? "",
      "base64",
    ).toString("utf8");
    if (
      typeof rawCurrentMetadata !== "string" ||
      rawCurrentMetadata.length === 0
    ) {
      throw new Error("Current pull request metadata is required");
    }
    const currentMetadata = normalizePullRequestMetadata(
      JSON.parse(rawCurrentMetadata),
      metadata.pullRequestNumber,
      process.env.GH_REPO,
    );
    const result = await validateReviewResult({
      metadata,
      currentMetadata,
      rawVerdict: process.env.AI_REVIEW_VERDICT_JSON,
      policy,
      validateSchema,
    });
    await writeGitHubOutputs(result);
    process.stdout.write(JSON.stringify(result));
    return;
  }

  if (mode === "--comment") {
    const result = JSON.parse(
      Buffer.from(process.env.AI_REVIEW_RESULT_BASE64 ?? "", "base64").toString(
        "utf8",
      ),
    );
    const rawCurrentMetadata = Buffer.from(
      process.env.AI_REVIEW_CURRENT_METADATA_BASE64 ?? "",
      "base64",
    ).toString("utf8");
    if (rawCurrentMetadata.length === 0) {
      throw new Error("Current pull request metadata is required");
    }
    const currentMetadata = normalizePullRequestMetadata(
      JSON.parse(rawCurrentMetadata),
      result.pullRequestNumber,
      process.env.GH_REPO,
    );
    const expectedMetadata = {
      pullRequestNumber: result.pullRequestNumber,
      state: "OPEN",
      baseRefName: "main",
      baseSha: result.baseSha,
      headSha: result.headSha,
      headRepository: result.headRepository,
      sourceRepositoryAllowed: result.sourceRepositoryAllowed,
      files: result.changedFiles.map((filePath) => ({ path: filePath })),
    };
    if (!isSameRevision(expectedMetadata, currentMetadata)) {
      result.outcome = "BLOCKED";
      result.scopeDisposition = "BLOCKED";
      result.summary =
        "The pull request changed before the verdict could be posted; rerun against the current head.";
      result.findings = [];
      result.scopeReasons = [
        "Pull request metadata changed before publishing.",
      ];
    }
    process.stdout.write(JSON.stringify({ body: renderReviewComment(result) }));
    if (process.env.GITHUB_OUTPUT) {
      await appendFile(
        process.env.GITHUB_OUTPUT,
        `outcome=${result.outcome}\n`,
        "utf8",
      );
    }
    return;
  }

  throw new Error(`Unsupported mode: ${mode}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
