import { $ } from "bun";
import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";

const projectDir = resolve(import.meta.dirname, "../../..");
// ACT: 团队暂不打包，恢复时取消注释。
// await $`${process.execPath} run build:teams`.cwd(projectDir);
await $`${process.execPath} run build`.cwd(resolve(projectDir, "packages/mcp"));
await $`${process.execPath} build src/index.ts --target=bun --minify --outdir ../../build/server`.cwd(resolve(projectDir, "apps/server"));
const skillsOutput = resolve(projectDir, "build/skills");
await rm(skillsOutput, { recursive: true, force: true });
await cp(resolve(projectDir, "packages/skills"), skillsOutput, { recursive: true });
const providersOutput = resolve(projectDir, "build/providers");
await rm(providersOutput, { recursive: true, force: true });
await cp(resolve(projectDir, "packages/providers/src"), providersOutput, { recursive: true });
