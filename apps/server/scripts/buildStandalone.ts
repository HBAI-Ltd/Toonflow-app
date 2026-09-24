import { $ } from "bun";
import { readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const projectDir = resolve(import.meta.dirname, "../../..");

// ACT: Bun 1.3.14 在 Linux 的 --filter 会误读小驼峰目录；修复后可复用根目录的批量构建命令。
for (const group of ["nodes", "tools"]) {
  const groupDirectory = resolve(projectDir, "packages", group);
  await rm(resolve(projectDir, "build", group), { recursive: true, force: true });
  for (const entry of await readdir(groupDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    await $`${process.execPath} run build`
      .cwd(resolve(groupDirectory, entry.name))
      .env({ ...process.env, NODE_ENV: "production" });
  }
}

await $`${process.execPath} run build`.cwd(resolve(projectDir, "apps/web"));
await $`${process.execPath} run build`.cwd(resolve(projectDir, "apps/server"));
