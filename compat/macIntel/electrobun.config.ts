import type { ElectrobunConfig } from "electrobun";
import shared from "./generated/config.json";

export default {
  app: shared.app,
  build: {
    bun: { entrypoint: "generated/src/index.ts", minify: true },
    copy: {
      "../../build/mcp": "mcp",
      "../../build/web": "views/mainview",
      "../../build/tools": "tools",
      "../../build/nodes": "nodes",
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
      codesign: true,
      notarize: false,
    },
  },
  release: shared.release,
} satisfies ElectrobunConfig;
