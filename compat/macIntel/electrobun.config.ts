import type { ElectrobunConfig } from "electrobun";
import shared from "./generated/config.json";

export default {
  app: shared.app,
  build: {
    // ACT: 与主桌面构建一致，保留 Photon 原包及其相邻 WASM。
    bun: { entrypoint: "generated/src/index.ts", minify: true, external: ["@silvia-odwyer/photon-node"] },
    copy: {
      "../../build/desktop/photon": "bun/node_modules/@silvia-odwyer/photon-node",
      "../../build/mcp": "mcp",
      "../../build/web": "views/mainview",
      "../../build/tools": "tools",
      "../../build/nodes": "nodes",
      "../../build/ext": "ext",
      "../../packages/providers/src": "providers",
      "../../packages/skills": "skills",
      "../../packages/startup/assets/startup.json": "startup/startup.json",
      "../../packages/startup/assets/license.txt": "startup/license.txt",
      "../../packages/startup/assets/macX64": "startup/macX64",
    },
    buildFolder: "../../build/desktop/macIntel",
    artifactFolder: "../../build/desktop/artifacts/macX64",
    mac: {
      icons: "../../packages/assets/logo.iconset",
      // ACT: 1.18.1 的 x64 二进制缺少签名头空间，重签会覆盖机器码；修复 SDK 后再开启。
      // https://github.com/blackboardsh/electrobun/issues/485
      codesign: false,
      notarize: false,
    },
  },
  release: shared.release,
  scripts: {
    postBuild: "../../apps/desktop/scripts/localizeMac.ts",
    postWrap: "../../apps/desktop/scripts/localizeMac.ts",
  },
} satisfies ElectrobunConfig;
