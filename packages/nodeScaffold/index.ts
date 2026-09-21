import { copyFile, mkdir, readFile, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import type { Rule } from "@form-create/element-ui";
import { z } from "zod";
import postcssConfig from "../../postcss.config.ts";

export interface NodeConfig {
  name: string;
  displayName: string;
  author: string;
  github: string;
  configRules?: Rule[];
}

export function createNodeConfig(config: NodeConfig, configUrl: string) {
  const { name: nodeName } = config;
  const metadata = {
    displayName: config.displayName.trim(),
    author: config.author.trim(),
    github: config.github.trim(),
    configRules: z.array(z.record(z.string(), z.json())).max(100).parse(config.configRules ?? []),
  };
  if (!metadata.displayName) throw new Error("插件显示名不能为空");
  if (metadata.github) {
    const githubUrl = new URL(metadata.github);
    if (githubUrl.origin !== "https://github.com" || githubUrl.username || githubUrl.password) throw new Error("GitHub 地址必须是 https://github.com 下的地址");
  }
  const root = fileURLToPath(new URL(".", configUrl));
  if (!/^[a-z][a-zA-Z0-9]*$/.test(nodeName)) throw new Error(`节点名必须使用小驼峰：${nodeName}`);
  const fileName = `${nodeName}.umd.js`;
  const outDir = fileURLToPath(new URL("../../build/nodes", import.meta.url));
  const dataDir = fileURLToPath(new URL("../../data/nodes", import.meta.url));
  let syncToData = process.env.NODE_ENV === "dev";

  return defineConfig({
    root,
    css: { postcss: postcssConfig },
    plugins: [
      vue(),
      {
        name: "syncNodeFile",
        configResolved(resolvedConfig) {
          syncToData ||= Boolean(resolvedConfig.build.watch) || resolvedConfig.mode === "development";
        },
        async generateBundle(_options, bundle) {
          const chunk = bundle[fileName];
          if (!chunk || chunk.type !== "chunk") throw new Error(`未生成节点文件：${fileName}`);
          const packagePath = resolve(root, "package.json");
          this.addWatchFile(packagePath);
          const packageInfo = JSON.parse(await readFile(packagePath, "utf8"));
          const version = typeof packageInfo.version === "string" ? packageInfo.version.trim() : "";
          if (!version) throw new Error(`节点 package.json 缺少有效的 version：${nodeName}`);
          const readmePath = resolve(root, "readme.md");
          this.addWatchFile(readmePath);
          const readme = await readFile(readmePath, "utf8").catch((error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") return "";
            throw error;
          });
          // 压缩后再写入，防止元数据注释被移除。
          chunk.code = `/*! toonflowNode:${JSON.stringify({ ...metadata, version, readme }).replaceAll("/", "\\u002f")} */\n${chunk.code}`;
        },
        async writeBundle() {
          if (!syncToData) return;
          await mkdir(dataDir, { recursive: true });
          const targetPath = resolve(dataDir, fileName);
          const tempPath = `${targetPath}.${crypto.randomUUID()}.tmp`;
          try {
            await copyFile(resolve(outDir, fileName), tempPath);
            await rename(tempPath, targetPath);
          } finally {
            await rm(tempPath, { force: true });
          }
        },
      },
    ],
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
      outDir,
      // ACT: 单包构建不清公共产物目录，由根 build:nodes 在批量构建前统一清理。
      emptyOutDir: false,
      cssCodeSplit: true,
      lib: {
        entry: resolve(root, "src/index.vue"),
        name: `toonflowNodes.${nodeName}`,
        formats: ["umd"],
        fileName: () => fileName,
      },
      rolldownOptions: {
        external: ["vue", "@vue/runtime-core", "@vue/runtime-dom", "@vue-flow/core", "element-plus", "@earendil-works/pi-agent-core", "@earendil-works/pi-ai"],
        output: {
          exports: "default",
          globals: {
            vue: "toonflowNodeHost.vue",
            "@vue/runtime-core": "toonflowNodeHost.vue",
            "@vue/runtime-dom": "toonflowNodeHost.vue",
            "@vue-flow/core": "toonflowNodeHost.vueFlow",
            "element-plus": "toonflowNodeHost.elementPlus",
            "@earendil-works/pi-agent-core": "toonflowNodeHost.ai",
            "@earendil-works/pi-ai": "toonflowNodeHost.ai",
          },
        },
      },
    },
  });
}
