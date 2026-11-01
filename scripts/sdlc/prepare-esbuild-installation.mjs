import { Buffer } from "node:buffer";
import console from "node:console";
import { randomUUID } from "node:crypto";
import { constants, promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { PlanError, requireCondition } from "./operation-contracts.mjs";
import { installationTreeHash } from "./task-orchestrator.mjs";

const PACKAGES = [
  ["", "0.25.12"],
  ["@esbuild-kit/core-utils/node_modules/", "0.18.20"],
  ["tsx/node_modules/", "0.28.2"],
];
const READ = constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK;
const sameFile = (a, b) =>
  [a.dev, a.ino, b.dev, b.ino].every(Number.isSafeInteger) &&
  a.dev === b.dev &&
  a.ino === b.ino;
const unchanged = (a, b) =>
  sameFile(a, b) &&
  a.size === b.size &&
  a.mode === b.mode &&
  a.nlink === b.nlink &&
  a.mtimeMs === b.mtimeMs &&
  a.ctimeMs === b.ctimeMs;

export async function prepareEsbuildInstallation(root) {
  requireCondition(
    process.platform === "linux" && process.arch === "x64",
    "ESBUILD_PREPARATION_PLATFORM",
  );
  const handles = [];
  const directories = new Map();
  let temporary;
  async function open(file, flags, mode) {
    const handle = await fs.open(file, flags, mode);
    handles.push(handle);
    return handle;
  }
  async function directory(relative) {
    if (!directories.has(relative)) {
      const location = relative
        ? `${await directory(path.posix.dirname(relative) === "." ? "" : path.posix.dirname(relative))}/${path.posix.basename(relative)}`
        : root;
      const handle = await open(location, READ | constants.O_DIRECTORY);
      directories.set(relative, {
        location,
        handle,
        identity: await handle.stat(),
      });
    }
    // Kernel-owned descriptor paths anchor traversal and rename, not user symlinks.
    return `/proc/self/fd/${directories.get(relative).handle.fd}`;
  }
  async function location(relative) {
    return `${await directory(path.posix.dirname(relative))}/${path.posix.basename(relative)}`;
  }
  async function checkDirectories() {
    for (const { location, identity } of directories.values()) {
      const current = await fs.lstat(location);
      requireCondition(
        current.isDirectory() && sameFile(current, identity),
        "ESBUILD_LAYOUT_CHANGED",
      );
    }
  }
  async function contents(handle, maximum) {
    const before = await handle.stat();
    requireCondition(
      before.isFile() && before.size <= maximum,
      "ESBUILD_BINARY_UNSAFE",
    );
    const bytes = Buffer.alloc(before.size);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await handle.read(
        bytes,
        offset,
        bytes.length - offset,
        offset,
      );
      requireCondition(bytesRead > 0, "ESBUILD_BINARY_CHANGED");
      offset += bytesRead;
    }
    requireCondition(
      unchanged(before, await handle.stat()),
      "ESBUILD_BINARY_CHANGED",
    );
    return bytes;
  }
  async function metadata(relative, name, version) {
    const handle = await open(await location(relative), READ);
    const stat = await handle.stat();
    requireCondition(
      stat.isFile() && stat.nlink === 1 && stat.size <= 65536,
      "ESBUILD_PACKAGE_UNSAFE",
    );
    const value = JSON.parse((await contents(handle, 65536)).toString("utf8"));
    requireCondition(
      value.name === name &&
        value.version === version &&
        unchanged(stat, await handle.stat()),
      "ESBUILD_PACKAGE_MISMATCH",
    );
  }
  async function binary(relative) {
    const file = await location(relative);
    const handle = await open(file, READ);
    const stat = await handle.stat();
    requireCondition(
      stat.isFile() &&
        (stat.mode & 0o7777) === 0o755 &&
        stat.size > 0 &&
        stat.size <= 64 * 1024 * 1024,
      "ESBUILD_BINARY_UNSAFE",
    );
    return { file, handle, stat };
  }
  async function checkBinary(value) {
    requireCondition(
      unchanged(value.stat, await value.handle.stat()) &&
        unchanged(value.stat, await fs.lstat(value.file)),
      "ESBUILD_BINARY_CHANGED",
    );
  }
  try {
    const pairs = [];
    for (const [prefix, version] of PACKAGES) {
      await metadata(`${prefix}esbuild/package.json`, "esbuild", version);
      await metadata(
        `${prefix}@esbuild/linux-x64/package.json`,
        "@esbuild/linux-x64",
        version,
      );
      const source = await binary(`${prefix}@esbuild/linux-x64/bin/esbuild`);
      const target = await binary(`${prefix}esbuild/bin/esbuild`);
      if (source.stat.nlink === 1 && target.stat.nlink === 1) continue;
      requireCondition(
        source.stat.nlink === 2 &&
          target.stat.nlink === 2 &&
          sameFile(source.stat, target.stat),
        "ESBUILD_UNACCOUNTED_LINK",
      );
      const bytes = await contents(source.handle, 64 * 1024 * 1024);
      await checkBinary(source);
      await checkBinary(target);
      pairs.push({ source, target, bytes });
    }
    for (const { source, target, bytes } of pairs) {
      await checkDirectories();
      await checkBinary(source);
      await checkBinary(target);
      const candidate = `${path.posix.dirname(target.file)}/.pgjb-esbuild-${randomUUID()}`;
      const copy = await fs.open(
        candidate,
        constants.O_WRONLY |
          constants.O_CREAT |
          constants.O_EXCL |
          constants.O_NOFOLLOW,
        0o755,
      );
      temporary = candidate;
      try {
        await copy.writeFile(bytes);
        await copy.chmod(0o755);
        await copy.sync();
      } finally {
        await copy.close();
      }
      await checkDirectories();
      await checkBinary(source);
      await checkBinary(target);
      await fs.rename(temporary, target.file);
      temporary = undefined;
      await checkDirectories();
      const replaced = await binaryFromLocation(target.file);
      const remaining = await source.handle.stat();
      const remainingPath = await fs.lstat(source.file);
      requireCondition(
        remaining.isFile() &&
          remaining.nlink === 1 &&
          sameFile(remaining, source.stat) &&
          remainingPath.isFile() &&
          sameFile(remainingPath, remaining) &&
          !sameFile(replaced.stat, source.stat) &&
          (await contents(source.handle, 64 * 1024 * 1024)).equals(bytes) &&
          (await contents(replaced.handle, 64 * 1024 * 1024)).equals(bytes),
        "ESBUILD_COPY_MISMATCH",
      );
    }
    await checkDirectories();
    await installationTreeHash(root);
    return pairs.length;
  } finally {
    try {
      if (temporary) await fs.unlink(temporary);
    } finally {
      await Promise.all(handles.map((handle) => handle.close()));
    }
  }

  async function binaryFromLocation(file) {
    const handle = await open(file, READ);
    const stat = await handle.stat();
    requireCondition(
      stat.isFile() && stat.nlink === 1 && (stat.mode & 0o7777) === 0o755,
      "ESBUILD_COPY_UNSAFE",
    );
    return { handle, stat };
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    requireCondition(
      process.argv.length === 2,
      "ESBUILD_PREPARATION_ARGUMENTS",
    );
    const count = await prepareEsbuildInstallation(
      fileURLToPath(new URL("../../node_modules", import.meta.url)),
    );
    console.log(`[installation:prepare] completed; separatedPairs=${count}`);
  } catch (error) {
    console.error(
      `[installation:prepare] ${error instanceof PlanError ? error.code : "ESBUILD_PREPARATION_FAILED"}`,
    );
    process.exitCode = 1;
  }
}
