import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { prepareEsbuildInstallation } from "../../scripts/sdlc/prepare-esbuild-installation.mjs";
import { installationTreeHash } from "../../scripts/sdlc/task-orchestrator.mjs";

const linux = { skip: process.platform !== "linux" || process.arch !== "x64" };
const packages = [
  ["", "0.25.12"],
  ["@esbuild-kit/core-utils/node_modules/", "0.18.20"],
  ["tsx/node_modules/", "0.28.2"],
];

async function fixture(t) {
  const parent = await fs.mkdtemp(path.join(tmpdir(), "pgjb-install-prep-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, "dependencies");
  const pairs = [];
  for (const [prefix, version] of packages) {
    const vendor = path.join(root, prefix, "@esbuild/linux-x64");
    const cli = path.join(root, prefix, "esbuild");
    await fs.mkdir(path.join(vendor, "bin"), { recursive: true });
    await fs.mkdir(path.join(cli, "bin"), { recursive: true });
    for (const [directory, name] of [
      [vendor, "@esbuild/linux-x64"],
      [cli, "esbuild"],
    ]) {
      await fs.writeFile(
        path.join(directory, "package.json"),
        JSON.stringify({ name, version }),
      );
    }
    const source = path.join(vendor, "bin", "esbuild");
    const target = path.join(cli, "bin", "esbuild");
    const bytes = Buffer.from(`Synthetic executable ${version}\n`);
    await fs.writeFile(source, bytes, { mode: 0o755 });
    await fs.chmod(source, 0o755);
    await fs.link(source, target);
    pairs.push({ source, target, bytes });
  }
  return { parent, root, pairs };
}

test("installation guard still rejects internal and external hardlink aliases", async (t) => {
  const { parent, root, pairs } = await fixture(t);
  await assert.rejects(installationTreeHash(root), /UNSAFE_INSTALLATION_FILE/);
  await fs.link(pairs[0].source, path.join(parent, "outside"));
  await assert.rejects(installationTreeHash(root), /UNSAFE_INSTALLATION_FILE/);
});

test(
  "preparation separates only the three exact pairs, preserves bytes/mode and is idempotent",
  linux,
  async (t) => {
    const { root, pairs } = await fixture(t);
    await assert.rejects(
      installationTreeHash(root),
      /UNSAFE_INSTALLATION_FILE/,
    );
    assert.equal(await prepareEsbuildInstallation(root), 3);
    for (const { source, target, bytes } of pairs) {
      const a = await fs.stat(source);
      const b = await fs.stat(target);
      assert.equal(a.nlink, 1);
      assert.equal(b.nlink, 1);
      assert.notEqual(a.ino, b.ino);
      assert.equal(a.mode & 0o7777, 0o755);
      assert.equal(b.mode & 0o7777, 0o755);
      assert.deepEqual(await fs.readFile(source), bytes);
      assert.deepEqual(await fs.readFile(target), bytes);
    }
    const hash = await installationTreeHash(root);
    assert.equal(await prepareEsbuildInstallation(root), 0);
    assert.equal(await installationTreeHash(root), hash);
    await fs.writeFile(pairs[0].target, "Synthetic tampering");
    assert.notEqual(await installationTreeHash(root), hash);
    await fs.link(pairs[0].target, path.join(root, "new-alias"));
    await assert.rejects(
      installationTreeHash(root),
      /UNSAFE_INSTALLATION_FILE/,
    );
  },
);

test(
  "an external third alias is refused before any pair is changed",
  linux,
  async (t) => {
    const { parent, root, pairs } = await fixture(t);
    await fs.link(pairs[2].source, path.join(parent, "external-alias"));
    await assert.rejects(
      prepareEsbuildInstallation(root),
      /ESBUILD_UNACCOUNTED_LINK/,
    );
    for (const { source, target } of pairs)
      assert.equal((await fs.stat(source)).ino, (await fs.stat(target)).ino);
  },
);

test(
  "a second alias outside the expected pair is not accepted",
  linux,
  async (t) => {
    const { parent, root, pairs } = await fixture(t);
    await fs.unlink(pairs[0].target);
    await fs.writeFile(pairs[0].target, pairs[0].bytes, { mode: 0o755 });
    await fs.link(pairs[0].source, path.join(parent, "external-alias"));
    await assert.rejects(
      prepareEsbuildInstallation(root),
      /ESBUILD_UNACCOUNTED_LINK/,
    );
  },
);

test(
  "unexpected package versions are refused without changing links",
  linux,
  async (t) => {
    const { root, pairs } = await fixture(t);
    await fs.writeFile(
      path.join(root, "esbuild/package.json"),
      JSON.stringify({ name: "esbuild", version: "99.0.0" }),
    );
    await assert.rejects(
      prepareEsbuildInstallation(root),
      /ESBUILD_PACKAGE_MISMATCH/,
    );
    assert.equal((await fs.stat(pairs[0].target)).nlink, 2);
  },
);

test(
  "unrelated hardlinks are never normalized or admitted",
  linux,
  async (t) => {
    const { root } = await fixture(t);
    await fs.writeFile(path.join(root, "other"), "Synthetic unrelated");
    await fs.link(path.join(root, "other"), path.join(root, "other-alias"));
    await assert.rejects(
      prepareEsbuildInstallation(root),
      /UNSAFE_INSTALLATION_FILE/,
    );
    assert.equal((await fs.stat(path.join(root, "other"))).nlink, 2);
  },
);

test(
  "binary and parent-directory symlinks cannot redirect preparation",
  linux,
  async (t) => {
    const { parent, root, pairs } = await fixture(t);
    await prepareEsbuildInstallation(root);
    const outside = path.join(parent, "external");
    await fs.writeFile(outside, "Synthetic external canary");
    await fs.unlink(pairs[0].target);
    await fs.symlink(outside, pairs[0].target);
    await assert.rejects(prepareEsbuildInstallation(root), { code: "ELOOP" });
    await assert.rejects(
      installationTreeHash(root),
      /INSTALLATION_LINK_ESCAPE/,
    );
    await fs.unlink(pairs[0].target);
    await fs.link(pairs[0].source, pairs[0].target);
    const directory = path.dirname(pairs[0].target);
    await fs.rename(directory, `${directory}-moved`);
    await fs.symlink(`${directory}-moved`, directory);
    await assert.rejects(prepareEsbuildInstallation(root), { code: "ENOTDIR" });
    assert.equal(
      await fs.readFile(outside, "utf8"),
      "Synthetic external canary",
    );
  },
);

test(
  "special files fail closed without blocking on FIFO reads",
  linux,
  async (t) => {
    const { root, pairs } = await fixture(t);
    await fs.unlink(pairs[0].target);
    const result = spawnSync("mkfifo", [pairs[0].target]);
    assert.equal(result.status, 0);
    await assert.rejects(
      prepareEsbuildInstallation(root),
      /ESBUILD_BINARY_UNSAFE/,
    );
    await assert.rejects(
      installationTreeHash(root),
      /UNSAFE_INSTALLATION_FILE/,
    );
  },
);

test(
  "directory replacement at rename cannot write through an escaping symlink",
  linux,
  async (t) => {
    const { parent, root, pairs } = await fixture(t);
    const outside = path.join(parent, "outside");
    await fs.mkdir(outside);
    await fs.writeFile(
      path.join(outside, "esbuild"),
      "Synthetic external canary",
    );
    const rename = fs.rename;
    let injected = false;
    t.mock.method(fs, "rename", async (from, to) => {
      if (!injected && from.includes(".pgjb-esbuild-")) {
        injected = true;
        const directory = path.dirname(pairs[0].target);
        await rename(directory, `${directory}-moved`);
        await fs.symlink(outside, directory);
      }
      return rename(from, to);
    });
    await assert.rejects(
      prepareEsbuildInstallation(root),
      /ESBUILD_LAYOUT_CHANGED/,
    );
    assert.equal(injected, true);
    assert.equal(
      await fs.readFile(path.join(outside, "esbuild"), "utf8"),
      "Synthetic external canary",
    );
  },
);

test(
  "source modification at rename is detected without admitting the installation",
  linux,
  async (t) => {
    const { root, pairs } = await fixture(t);
    const rename = fs.rename;
    let injected = false;
    t.mock.method(fs, "rename", async (from, to) => {
      if (!injected && from.includes(".pgjb-esbuild-")) {
        injected = true;
        await fs.writeFile(pairs[0].source, "Synthetic concurrent change");
      }
      return rename(from, to);
    });
    await assert.rejects(
      prepareEsbuildInstallation(root),
      /ESBUILD_COPY_MISMATCH/,
    );
  },
);

test(
  "an exclusive temporary-file collision never deletes the existing file",
  linux,
  async (t) => {
    const { root, pairs } = await fixture(t);
    const open = fs.open;
    let collision;
    t.mock.method(fs, "open", async (file, flags, mode) => {
      if (!collision && file.includes(".pgjb-esbuild-")) {
        collision = path.join(
          path.dirname(pairs[0].target),
          path.basename(file),
        );
        const existing = await open(file, "wx", 0o600);
        await existing.writeFile("Synthetic existing canary");
        await existing.close();
      }
      return open(file, flags, mode);
    });
    await assert.rejects(prepareEsbuildInstallation(root), { code: "EEXIST" });
    assert.equal(
      await fs.readFile(collision, "utf8"),
      "Synthetic existing canary",
    );
    assert.equal((await fs.stat(pairs[0].target)).nlink, 2);
  },
);

test(
  "failed replacement removes only its own temporary file and retains the linked binary",
  linux,
  async (t) => {
    const { root, pairs } = await fixture(t);
    t.mock.method(fs, "rename", async () => {
      throw Object.assign(new Error("Synthetic rename failure"), {
        code: "EIO",
      });
    });
    await assert.rejects(prepareEsbuildInstallation(root), { code: "EIO" });
    assert.deepEqual(await fs.readdir(path.dirname(pairs[0].target)), [
      "esbuild",
    ]);
    assert.equal((await fs.stat(pairs[0].target)).nlink, 2);
    assert.deepEqual(await fs.readFile(pairs[0].source), pairs[0].bytes);
  },
);

test(
  "unexpected binary permissions are not silently repaired",
  linux,
  async (t) => {
    const { root, pairs } = await fixture(t);
    await fs.chmod(pairs[0].source, 0o777);
    await assert.rejects(
      prepareEsbuildInstallation(root),
      /ESBUILD_BINARY_UNSAFE/,
    );
    assert.equal((await fs.stat(pairs[0].source)).mode & 0o7777, 0o777);
    assert.equal((await fs.stat(pairs[0].target)).nlink, 2);
  },
);
