import { $ } from "bun";
import { mkdirSync, readFileSync } from "@toonflow/file";
import { resolve } from "node:path";
import prepareRuntime from "./prepareRuntime";

const projectDirectory = resolve(import.meta.dir, "../../..");
const runtimeDirectory = resolve(projectDirectory, "build/desktop/runtime");

export async function prepareMacSdk() {
  const sdkDirectory = resolve(projectDirectory, ".hutch/devkit/api/sdks/main");
  const dependencies = JSON.parse(readFileSync(resolve(projectDirectory, ".hutch/dependencies.lock"), "utf8")) as {
    objects: { type: string; version: string }[];
  };
  if (!dependencies.objects.some(item => item.type === "electrobun" && item.version === "2.0.5")) {
    throw new Error("外置运行时的 macOS 更新路径适配仅核对过 Electrobun 2.0.5，请重新核对 SDK 后升级。");
  }
  mkdirSync(runtimeDirectory, { recursive: true });
  let adapted = false;
  const result = await Bun.build({
    entrypoints: [resolve(sdkDirectory, "index.ts")],
    outdir: runtimeDirectory,
    naming: "electrobunMain.js",
    target: "bun",
    minify: true,
    plugins: [{
      name: "toonflowMacRuntimePaths",
      setup(builder) {
        builder.onLoad({ filter: /[\\/]core[\\/]Updater\.ts$/ }, ({ path }) => {
          if (resolve(path) !== resolve(sdkDirectory, "core/Updater.ts")) return;
          const source = readFileSync(path, "utf8");
          if (source.split("dirname(process.execPath)").length !== 4) {
            throw new Error("Electrobun macOS 更新器路径实现已变化，拒绝生成未核对的外置运行时包。");
          }
          adapted = true;
          // ACT: 只修正 SDK 的应用资源定位，MCP、沙盒等子进程仍使用真正的外置 Bun。
          return {
            contents: `import { RESOURCES_FOLDER } from "./Paths";\n${source.replaceAll("dirname(process.execPath)", 'resolve(RESOURCES_FOLDER, "../MacOS")')}`,
            loader: "ts",
          };
        });
      },
    }],
  });
  if (!result.success) throw new AggregateError(result.logs, "macOS 外置运行时 SDK 构建失败。");
  if (!adapted) throw new Error("未找到 Electrobun 更新器，拒绝生成未经路径适配的 macOS 包。");
}

export default async function prepareMacRuntime() {
  if (process.platform !== "darwin" || !["x64", "arm64"].includes(process.arch)) {
    throw new Error("macOS 必要运行时启动器必须在对应架构的 Mac 上构建。");
  }
  prepareRuntime();
  await prepareMacSdk();
  const target = process.arch === "arm64" ? "arm64-apple-macos11.0" : "x86_64-apple-macos11.0";
  await $`/usr/bin/xcrun swiftc -parse-as-library -swift-version 5 -O -target ${target} -framework AppKit -framework CryptoKit -o ${resolve(runtimeDirectory, "runtimeLauncher")} ${resolve(projectDirectory, "apps/desktop/native/runtimeLauncher.swift")}`;
}
