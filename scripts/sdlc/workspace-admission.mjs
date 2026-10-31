import { spawnSync } from "node:child_process";
import { lstat, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { requireCondition } from "./operation-contracts.mjs";

export const SOURCE_BASE = "29691f40f751d773cb92aeef9b03060d9ce8053d";
export const REPOSITORY = "JOSEPH990108/propertygojb";
export const REAL_ACTIVATION_ENABLED = false;
export const ISOLATION_REQUIREMENTS = Object.freeze([
  "Separate restricted OS identity or disposable VM for the SDK process",
  "SDK cannot write workspace, Git metadata, trust, audit, policy or runtime inputs",
  "Single trusted broker owns both writable JSON files; no other writer",
  "Kernel-enforced no-follow/reparse-point-safe file replacement",
  "Owner signer, revocation pointer and trusted installation read-only to broker",
  "Network egress limited to approved Copilot endpoint; no production credentials",
  "Bounded validation in a separate credential-free, network-denied worker",
  "Authenticated external launcher enrollment and tested interruption recovery",
]);

async function safeDirectory(root) {
  const resolved = path.resolve(root);
  let current = path.parse(resolved).root;
  for (const component of resolved.slice(current.length).split(path.sep)) {
    if (!component) continue;
    current = path.join(current, component);
    const stat = await lstat(current);
    requireCondition(
      stat.isDirectory() && !stat.isSymbolicLink(),
      "UNSAFE_DIRECTORY",
    );
    requireCondition(
      (await realpath(current)).toLowerCase() === current.toLowerCase(),
      "DIRECTORY_ALIAS",
    );
  }
  return realpath(resolved);
}

function git(executable, root, args) {
  requireCondition(path.isAbsolute(executable), "TRUSTED_GIT_REQUIRED");
  const result = spawnSync(
    executable,
    [
      "-c",
      "core.fsmonitor=false",
      "-c",
      "core.untrackedCache=false",
      "-c",
      "core.hooksPath=",
      "-C",
      root,
      ...args,
    ],
    {
      shell: false,
      encoding: "utf8",
      timeout: 10000,
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    },
  );
  requireCondition(
    !result.error && result.status === 0,
    "WORKTREE_METADATA_INVALID",
  );
  return result.stdout.trim();
}

async function worktreeMetadata(workspaceRoot, executable) {
  const root = await safeDirectory(workspaceRoot);
  const dotGit = await lstat(path.join(root, ".git"));
  requireCondition(
    dotGit.isFile() && !dotGit.isSymbolicLink() && dotGit.nlink === 1,
    "ISOLATED_WORKTREE_REQUIRED",
  );
  const branch = git(executable, root, ["symbolic-ref", "--short", "HEAD"]);
  requireCondition(
    /^feature\/[a-z0-9][a-z0-9/-]{1,100}$/.test(branch),
    "FEATURE_BRANCH_REQUIRED",
  );
  const common = await safeDirectory(
    git(executable, root, [
      "rev-parse",
      "--path-format=absolute",
      "--git-common-dir",
    ]),
  );
  const gitDirectory = await safeDirectory(
    git(executable, root, ["rev-parse", "--absolute-git-dir"]),
  );
  requireCondition(
    path.dirname(gitDirectory) === path.join(common, "worktrees"),
    "WORKTREE_METADATA_ESCAPE",
  );
  return {
    root,
    branch,
    common,
    gitDirectory,
    baseSha: git(executable, root, ["rev-parse", "HEAD"]),
  };
}

// This is inspection, never an admission capability or OS attestation.
export async function inspectRealWorkspace({
  workspaceRoot,
  executable,
  enrollment,
}) {
  requireCondition(
    enrollment?.repository === REPOSITORY &&
      /^[a-f0-9]{40}$/.test(enrollment.baseSha ?? "") &&
      typeof enrollment.branch === "string",
    "OWNER_WORKSPACE_ENROLLMENT_REQUIRED",
  );
  const metadata = await worktreeMetadata(workspaceRoot, executable);
  requireCondition(
    metadata.root === enrollment.workspaceRoot &&
      metadata.common === enrollment.commonRoot &&
      metadata.branch === enrollment.branch &&
      metadata.baseSha === enrollment.baseSha,
    "WORKSPACE_ENROLLMENT_MISMATCH",
  );
  requireCondition(
    git(executable, metadata.root, ["remote"]) === "origin" &&
      git(executable, metadata.root, [
        "remote",
        "get-url",
        "--all",
        "origin",
      ]) === `https://github.com/${REPOSITORY}.git` &&
      git(executable, metadata.root, [
        "remote",
        "get-url",
        "--push",
        "--all",
        "origin",
      ]) === `https://github.com/${REPOSITORY}.git`,
    "REPOSITORY_IDENTITY_MISMATCH",
  );
  git(executable, metadata.root, [
    "merge-base",
    "--is-ancestor",
    SOURCE_BASE,
    "HEAD",
  ]);
  requireCondition(
    git(executable, metadata.root, [
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
    ]) === "",
    "CLEAN_START_REQUIRED",
  );
  return {
    status: "BLOCKED",
    reason: "LIVE_RUNTIME_DENIAL_EVIDENCE_REQUIRED",
    inspection: "metadata-only-not-authenticated-owner-or-OS-evidence",
    ...metadata,
    isolationRequirements: ISOLATION_REQUIREMENTS,
  };
}

export async function admitRealWorkspace(options) {
  requireCondition(
    REAL_ACTIVATION_ENABLED,
    "LIVE_RUNTIME_DENIAL_EVIDENCE_REQUIRED",
  );
  await inspectRealWorkspace(options);
  // Removing one guard cannot substitute for a separately implemented kernel boundary.
  requireCondition(false, "ENROLLED_OS_ISOLATION_PROVIDER_REQUIRED");
}

export async function inspectDisposableWorktree({
  workspaceRoot,
  rehearsalRoot,
  executable,
}) {
  const container = await safeDirectory(rehearsalRoot);
  requireCondition(
    path.dirname(container) === (await realpath(tmpdir())) &&
      path.basename(container).startsWith("pgjb-r1-rehearsal-"),
    "DISPOSABLE_REHEARSAL_REQUIRED",
  );
  const metadata = await worktreeMetadata(workspaceRoot, executable);
  requireCondition(
    metadata.root === path.join(container, "checkout") &&
      metadata.common === path.join(container, "repository", ".git") &&
      metadata.branch.startsWith("feature/r1-rehearsal-"),
    "DISPOSABLE_REHEARSAL_REQUIRED",
  );
  requireCondition(
    git(executable, metadata.root, ["remote"]) === "",
    "SYNTHETIC_REMOTE_FORBIDDEN",
  );
  git(executable, metadata.root, [
    "merge-base",
    "--is-ancestor",
    SOURCE_BASE,
    "HEAD",
  ]);
  return {
    ...metadata,
    evidence: "disposable-actual-repository-not-OS-isolated",
  };
}
