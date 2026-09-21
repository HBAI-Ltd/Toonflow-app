import { $ } from "bun";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import sharedConfig from "../../electrobun.config";

const projectDir = resolve(import.meta.dir, "../..");
const compatDir = import.meta.dir;
const generatedDir = resolve(compatDir, "generated");
const mode = process.argv[2];
if (process.argv.length !== 3 || !["build", "dev"].includes(mode!)) {
  throw new Error("用法：bun compat/macIntel/build.ts <build|dev>");
}
if (process.platform !== "darwin" || process.arch !== "x64") {
  throw new Error("Intel 构建需要 macOS x64。");
}
// ACT: 只清理脚本固定生成目录；源文件和独立 SDK 安装不在清理范围内。
rmSync(generatedDir, { recursive: true, force: true });
mkdirSync(generatedDir, { recursive: true });
writeFileSync(resolve(generatedDir, "config.json"), JSON.stringify({
  app: sharedConfig.app,
  release: sharedConfig.release,
}, null, 2) + "\n");
writeFileSync(resolve(generatedDir, "electrobun.ts"), `import { Utils } from "electrobun/bun";
export * from "electrobun/bun";
export { default } from "electrobun/bun";
// ACT: 1.18.1 原生退出函数固定使用退出码 0，无法转交 2.0 的退出码参数。
const utils = { ...Utils, quit: (exitCode?: number) => { void exitCode; Utils.quit(); } };
export { utils as Utils };
`);

function modulePath(from: string, to: string) {
  return relative(dirname(from), to).replaceAll("\\", "/");
}

// ACT: 桌面源码使用 TypeScript，复制后适配 SDK 和工作区子包导入。
const sourceDir = resolve(generatedDir, "src");
cpSync(resolve(projectDir, "apps/desktop/src"), sourceDir, { recursive: true });
for (const target of new Bun.Glob("**/*.ts").scanSync({ cwd: sourceDir, absolute: true })) {
  const code = readFileSync(target, "utf8")
    .replace(/(["'])electrobun\/main\1/g, () => JSON.stringify(modulePath(target, resolve(generatedDir, "electrobun.ts"))))
    .replace(/(["'])@toonflow\/server\/app\1/g, () => JSON.stringify(modulePath(target, resolve(projectDir, "apps/server/src/app.ts"))))
    .replace(/(["'])@toonflow\/startup\1/g, () => JSON.stringify(modulePath(target, resolve(projectDir, "packages/startup/src/index.ts"))));
  writeFileSync(target, code);
}
const cli = resolve(compatDir, "node_modules/electrobun/bin/electrobun.cjs");
await $`${process.execPath} ${cli} ${mode} ${mode === "build" ? ["--env=stable"] : []}`.cwd(compatDir);
