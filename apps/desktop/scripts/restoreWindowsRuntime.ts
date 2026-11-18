import { copyFileSync, existsSync, readdirSync } from "@toonflow/file";
import { file } from "@toonflow/file/bun";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import prepareRuntime from "./prepareRuntime";

// ACT: SDK 给 bun.exe 嵌入图标会截掉官方签名并留下悬空的证书表；生成更新归档前恢复原版，与安装器下载的运行时一致。
// 取舍：进程图标回到 Bun 原版，窗口图标继续由 src/index.ts 从 app.ico 设置；有自有签名后可改为保留嵌入并重新签名。
const buildDir = process.env.ELECTROBUN_BUILD_DIR;
if (!buildDir) throw new Error("缺少 ELECTROBUN_BUILD_DIR，无法恢复 Bun 运行时。");
const targets = readdirSync(buildDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => join(buildDir, entry.name, "bin/bun.exe"))
  .filter(path => existsSync(path));
if (targets.length !== 1) throw new Error(`应用目录中的 Bun 运行时数量应为 1，实际为 ${targets.length}：${buildDir}`);

const runtime = prepareRuntime();
const dependencies = await file(resolve(import.meta.dir, "../../../.hutch/dependencies.lock")).json();
const toolchain = dependencies.objects.find((item: { type: string; toolchain?: string; platform: string }) =>
  item.type === "toolchain" && item.toolchain === "bun" && item.platform === `windows-${process.arch}`);
const source = join(process.env.HUTCH_HOME ?? join(homedir(), ".hutch"), toolchain.relativeRoot, "bun.exe");
if (new Bun.CryptoHasher("sha256").update(await file(source).arrayBuffer()).digest("hex") !== runtime.executableSha256) {
  throw new Error(`SDK 托管的 Bun 与下载校验清单不一致，已停止构建：${source}`);
}
copyFileSync(source, targets[0]!);
console.log(`已恢复官方 Bun 运行时：${targets[0]}`);
