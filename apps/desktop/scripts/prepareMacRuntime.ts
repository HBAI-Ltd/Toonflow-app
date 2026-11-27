import { $ } from "bun";
import { resolve } from "node:path";
import prepareRuntime from "./prepareRuntime";

const projectDirectory = resolve(import.meta.dir, "../../..");
const runtimeDirectory = resolve(projectDirectory, "build/desktop/runtime");

export default async function prepareMacRuntime() {
  if (process.platform !== "darwin" || !["x64", "arm64"].includes(process.arch)) {
    throw new Error("macOS 必要运行时启动器必须在对应架构的 Mac 上构建。");
  }
  prepareRuntime();
  const target = process.arch === "arm64" ? "arm64-apple-macos11.0" : "x86_64-apple-macos11.0";
  await $`/usr/bin/xcrun swiftc -parse-as-library -swift-version 5 -O -target ${target} -framework AppKit -framework CryptoKit -o ${resolve(runtimeDirectory, "runtimeLauncher")} ${resolve(projectDirectory, "apps/desktop/native/runtimeLauncher.swift")}`;
}
