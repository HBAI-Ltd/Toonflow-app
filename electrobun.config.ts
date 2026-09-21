import type { ElectrobunConfig } from "./.hutch/devkit/api/config/ElectrobunConfig";

const startupTarget = process.platform === "darwin" ? (process.arch === "x64" ? "macX64" : "macArm64") : "windowsX64";

export default {
  app: {
    name: "toonflow",
    identifier: "local.toonflow.desktop",
    version: process.env.appVersion ?? "2.0.0",
    urlSchemes: ["toonflow"],
  },
  build: {
    mainProcess: "bun",
    bun: { entrypoint: "apps/desktop/src/index.ts", minify: true },
    copy: {
      ...(process.platform === "win32" ? {
        "build/desktop/protocol/protocolLauncher.exe": "protocolLauncher.exe",
        "build/desktop/protocol/saveFileDialog.exe": "saveFileDialog.exe",
        "build/desktop/protocol/updateHelper.exe": "updateHelper.exe",
        "build/desktop/startup/windowsSplashWorker.js": "startup/windowsSplashWorker.js",
      } : {}),
      "build/web": "views/mainview",
      "build/mcp": "mcp",
      "build/tools": "tools",
      // ACT: 团队暂不打包，恢复时取消注释。
      // "build/agents": "agents",
      "build/nodes": "nodes",
      "packages/providers/src": "providers",
      "packages/skills": "skills",
      "packages/startup/assets/startup.json": "startup/startup.json",
      "packages/startup/assets/license.txt": "startup/license.txt",
      [`packages/startup/assets/${startupTarget}`]: `startup/${startupTarget}`,
    },
    buildFolder: "build/desktop/app",
    artifactFolder: process.platform === "darwin" ? `build/desktop/artifacts/${process.arch === "x64" ? "macX64" : "macArm64"}` : "build/desktop/artifacts",
    win: {
      icon: "packages/assets/logo.ico",
    },
  },
  release: {
    baseUrl: process.env.updateBaseUrl ?? "http://127.0.0.1:8091/version/desktopUpdates",
    // ACT: 常规构建不访问更新服务器；release:desktop 显式开启增量构建。
    generatePatch: process.env.generateUpdatePatch === "1",
  },
} satisfies ElectrobunConfig;
