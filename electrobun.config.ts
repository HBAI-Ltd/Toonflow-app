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
    mac: {
      icons: "packages/assets/logo.iconset",
      // ACT: CI 为 ARM 显式开启签名与公证；本地未配置凭据时仍可构建测试包。
      codesign: process.env.macCodesign === "1",
      notarize: process.env.macCodesign === "1",
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
