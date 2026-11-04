import type { ElectrobunConfig } from "./.hutch/devkit/api/config/ElectrobunConfig";
import { fileURLToPath } from "node:url";

const startupTarget = process.platform === "darwin" ? (process.arch === "x64" ? "macX64" : "macArm64")
  : process.platform === "win32" && process.arch === "x64" ? "windowsX64" : undefined;
export const desktopTarget = process.platform === "darwin" ? (process.arch === "x64" ? "macX64" : "macArm64")
  : process.platform === "linux" ? (process.arch === "x64" ? "linuxX64" : "linuxArm64")
  : process.arch === "arm64" ? "windowsArm64" : "";

export default {
  app: {
    name: "toonflow",
    identifier: "local.toonflow.desktop",
    version: process.env.appVersion ?? "2.0.0",
    urlSchemes: ["toonflow"],
  },
  build: {
    mainProcess: "bun",
    // ACT: Photon、anydoc 与沙盒依赖保留运行时目录，避免 WASM/Worker 引用构建机路径。
    bun: {
      entrypoint: "apps/desktop/src/bootstrap.ts", minify: true,
      external: ["@silvia-odwyer/photon-node", "@firecrawl/anydoc", "@firecrawl/anydoc-wasm", "just-bash"],
      ...(process.platform === "darwin" && process.env.TOONFLOW_EXTERNAL_RUNTIME === "1" ? {
        alias: { "electrobun/main": fileURLToPath(new URL("./build/desktop/runtime/electrobunMain.js", import.meta.url)) },
      } : {}),
    },
    copy: {
      "build/desktop/ffmpeg/ffmpegWorker.js": "bun/ffmpegWorker.js",
      "build/desktop/sandbox/sandboxProcess.js": "bun/sandboxProcess.js",
      "build/desktop/node_modules": "bun/node_modules",
      "build/desktop/photon": "bun/node_modules/@silvia-odwyer/photon-node",
      ...(process.platform === "win32" ? {
        "build/desktop/protocol/startupLauncher.exe": "startupLauncher.exe",
        "build/desktop/protocol/protocolLauncher.exe": "protocolLauncher.exe",
        "build/desktop/protocol/saveFileDialog.exe": "saveFileDialog.exe",
        "build/desktop/protocol/updateHelper.exe": "updateHelper.exe",
        "build/desktop/protocol/runtimeDownloader.exe": "runtimeDownloader.exe",
      } : {}),
      ...(process.platform === "win32" && process.arch === "x64" ? {
        "build/desktop/startup/windowsSplashWorker.js": "startup/windowsSplashWorker.js",
      } : {}),
      ...(process.platform === "linux" ? {
        "build/desktop/linux/linuxLauncher.js": "linuxLauncher.js",
      } : {}),
      "build/web": "views/mainview",
      "build/mcp": "mcp",
      "build/tools": "tools",
      // ACT: 团队暂不打包，恢复时取消注释。
      // "build/agents": "agents",
      "build/nodes": "nodes",
      "build/ext": "ext",
      "packages/providers/src": "providers",
      "packages/skills": "skills",
      ...(startupTarget ? {
        "packages/startup/assets/startup.json": "startup/startup.json",
        "packages/startup/assets/license.txt": "startup/license.txt",
        [`packages/startup/assets/${startupTarget}`]: `startup/${startupTarget}`,
      } : {}),
    },
    buildFolder: "build/desktop/app",
    artifactFolder: `build/desktop/artifacts${desktopTarget ? `/${desktopTarget}` : ""}`,
    win: {
      icon: "packages/assets/logo.ico",
      autoGrantPermissions: ["microphone", "notifications"],
    },
    mac: {
      icons: "packages/assets/logo.iconset",
      createDmg: false,
      entitlements: { "com.apple.security.device.audio-input": true },
      // ACT: CI 同时开启签名与公证；本地未配置凭据时仍可构建未签名包。
      codesign: process.env.macCodesign === "1",
      notarize: process.env.macCodesign === "1",
    },
    linux: {
      icon: "packages/assets/logo.iconset/icon_256x256.png",
    },
  },
  release: {
    // ACT: 构建基线和补丁固定取 GitHub；客户端更新源由设置单独控制，默认官方源。
    baseUrl: `${process.env.GITHUB_SERVER_URL || "https://github.com"}/${process.env.GITHUB_REPOSITORY || "HBAI-Ltd/Toonflow-app"}/releases/latest/download`,
    // ACT: 常规构建不访问更新服务器；release:desktop 显式开启增量构建。
    generatePatch: process.env.generateUpdatePatch === "1",
  },
  ...(process.platform === "darwin" ? {
    scripts: {
      postBuild: "apps/desktop/scripts/localizeMac.ts",
      postWrap: "apps/desktop/scripts/localizeMac.ts",
    },
  } : {}),
} satisfies ElectrobunConfig;
