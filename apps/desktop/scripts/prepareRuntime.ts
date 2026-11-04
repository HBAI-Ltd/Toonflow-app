import { mkdirSync, readFileSync, writeAtomicSync } from "@toonflow/file";
import { resolve } from "node:path";

type RuntimeEntry = {
  archiveSize: number;
  archiveSha256: string;
  executableSize: number;
  executableSha256: string;
};

export default function prepareRuntime() {
  const projectDirectory = resolve(import.meta.dir, "../../..");
  const platform = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos"
    : process.platform === "linux" ? "linux" : undefined;
  if (!platform || !["x64", "arm64"].includes(process.arch)) throw new Error("必要运行时准备仅支持 Windows/macOS/Linux x64/arm64。");
  const target = `${platform}-${process.arch}`;
  const catalog = JSON.parse(readFileSync(resolve(projectDirectory, "apps/desktop/runtimeInfo.json"), "utf8")) as {
    version: string;
    platforms: Record<string, RuntimeEntry>;
  };
  const entry = catalog.platforms[target];
  if (!entry || !/^\d+\.\d+\.\d+$/.test(catalog.version)
    || ![entry.archiveSize, entry.executableSize].every(value => Number.isSafeInteger(value) && value > 0)
    || ![entry.archiveSha256, entry.executableSha256].every(value => /^[a-f0-9]{64}$/.test(value))) {
    throw new Error(`缺少经过核对的必要运行时元数据：${target}。`);
  }
  const dependencies = JSON.parse(readFileSync(resolve(projectDirectory, ".hutch/dependencies.lock"), "utf8")) as {
    objects: { type: string; toolchain?: string; platform: string; version: string }[];
  };
  const runtime = dependencies.objects.find(item => item.type === "toolchain" && item.toolchain === "bun" && item.platform === target);
  if (runtime?.version !== catalog.version) throw new Error(`Bun 托管版本与下载校验清单不一致（${target}），请核对 SDK 与 runtimeInfo.json。`);
  const archiveName = `bun-${platform === "macos" ? "darwin" : platform}-${process.arch === "arm64" ? "aarch64" : "x64"}`;
  const archiveUrl = `https://github.com/oven-sh/bun/releases/download/bun-v${catalog.version}/${archiveName}.zip`;
  const mirrorUrl = `https://cdn.npmmirror.com/binaries/bun/bun-v${catalog.version}/${archiveName}.zip`;
  const sources = [
    { name: "国内镜像（npmmirror）", url: mirrorUrl },
    { name: "CNPM 备用线路", url: `https://r.cnpmjs.org/-/binary/bun/bun-v${catalog.version}/${archiveName}.zip` },
    { name: "GitHub 官方源", url: archiveUrl },
    { name: "SourceForge 镜像", url: `https://downloads.sourceforge.net/project/bun.mirror/bun-v${catalog.version}/${archiveName}.zip` },
  ];
  const info = {
    schemaVersion: 1,
    version: catalog.version,
    platform,
    arch: process.arch,
    archiveUrl,
    mirrorUrl,
    sources,
    ...entry,
    archiveMember: `${archiveName}/bun${platform === "windows" ? ".exe" : ""}`,
  };
  const directory = resolve(projectDirectory, "build/desktop/runtime");
  mkdirSync(directory, { recursive: true });
  // ACT: 校验清单随源码固定；构建不通过镜像动态接受新校验值。
  writeAtomicSync(resolve(directory, "runtimeInfo.json"), `${JSON.stringify(info, null, 2)}\n`);
  if (platform === "windows") {
    const strings = {
      version: info.version,
      architecture: info.arch,
      officialAddress: info.archiveUrl,
      mirrorAddress: info.mirrorUrl,
      archiveDigest: info.archiveSha256,
      binaryDigest: info.executableSha256,
      archiveMember: info.archiveMember,
    };
    writeAtomicSync(resolve(directory, "runtimeConfig.cs"), [
      "internal static class runtimeConfig",
      "{",
      ...Object.entries(strings).map(([key, value]) => `    internal const string ${key} = ${JSON.stringify(value)};`),
      `    internal const long archiveSize = ${info.archiveSize}L;`,
      `    internal const long binarySize = ${info.executableSize}L;`,
      `    internal static readonly string[] sourceNames = { ${sources.map(source => JSON.stringify(source.name)).join(", ")} };`,
      `    internal static readonly string[] sourceAddresses = { ${sources.map(source => JSON.stringify(source.url)).join(", ")} };`,
      "}",
      "",
    ].join("\n"));
  }
  return info;
}
