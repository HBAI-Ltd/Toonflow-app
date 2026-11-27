import { copyFile, mkdir, readFile, rename, rm } from "@toonflow/file";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadConfigFromFile } from "vite";
import vue from "@vitejs/plugin-vue";
import { z } from "zod";
import { localModelDefinitionsSchema } from "@toonflow/plugin-server/localModels";
import { defineExt, type ExtDefinition } from "./src/runtime.ts";

const tiptapGlobals = {
  "@tiptap/core": "toonflowTiptapHost.core",
  "@tiptap/vue-3": "toonflowTiptapHost.vue3",
  "@tiptap/starter-kit": "toonflowTiptapHost.starterKit",
  "@tiptap/markdown": "toonflowTiptapHost.markdown",
  "@tiptap/extension-find-and-replace": "toonflowTiptapHost.findAndReplace",
  "@tiptap/extension-highlight": "toonflowTiptapHost.highlight",
  "@tiptap/extension-image": "toonflowTiptapHost.image",
  "@tiptap/extension-list": "toonflowTiptapHost.list",
  "@tiptap/extension-subscript": "toonflowTiptapHost.subscript",
  "@tiptap/extension-superscript": "toonflowTiptapHost.superscript",
  "@tiptap/extension-table": "toonflowTiptapHost.table",
  "@tiptap/extension-text-align": "toonflowTiptapHost.textAlign",
  "@tiptap/pm/model": "toonflowTiptapHost.model",
  "@tiptap/pm/state": "toonflowTiptapHost.state",
  "@tiptap/pm/view": "toonflowTiptapHost.view",
  "marked": "toonflowTiptapHost.marked",
  "dompurify": "toonflowTiptapHost.dompurify",
};

export type ExtMetadata = Omit<ExtDefinition, "load">;

export function createExtConfig(config: ExtMetadata, configUrl: string) {
  defineExt({ ...config, load: async () => ({ default: {} }) });
  const root = fileURLToPath(new URL(".", configUrl));
  const fileName = `${config.id.slice(4)}.ext.js`;
  const outDir = fileURLToPath(new URL("../../build/ext", import.meta.url));
  const dataDir = fileURLToPath(new URL("../../data/ext", import.meta.url));
  let syncToData = process.env.NODE_ENV === "dev";

  return defineConfig({
    root,
    plugins: [
      vue(),
      {
        name: "extBundle",
        enforce: "post",
        configResolved(resolvedConfig) {
          syncToData ||= Boolean(resolvedConfig.build.watch) || resolvedConfig.mode === "development";
        },
        async generateBundle(_options, bundle) {
          const chunk = bundle[fileName];
          if (!chunk || chunk.type !== "chunk") throw new Error(`未生成扩展文件：${fileName}`);
          const packagePath = resolve(root, "package.json");
          const readmePath = resolve(root, "readme.md");
          const metadataPath = resolve(root, "src/metadata.ts");
          this.addWatchFile(metadataPath);
          const loaded = await loadConfigFromFile({ command: "build", mode: "production" }, metadataPath, root);
          if (!loaded) throw new Error(`扩展缺少声明文件：${metadataPath}`);
          for (const dependency of loaded.dependencies) this.addWatchFile(dependency);
          const { load: _load, ...metadata } = defineExt({ ...loaded.config as unknown as ExtMetadata, load: async () => ({ default: {} }) });
          if (metadata.id !== config.id) throw new Error("修改扩展 ID 后请重新启动构建命令");
          metadata.localModels = localModelDefinitionsSchema.optional().parse(metadata.localModels);
          const configRules = z.array(z.record(z.string(), z.json())).max(100).parse(metadata.configRules ?? []);
          this.addWatchFile(packagePath);
          this.addWatchFile(readmePath);
          const packageInfo = JSON.parse(await readFile(packagePath, "utf8"));
          const version = typeof packageInfo.version === "string" ? packageInfo.version.trim() : "";
          if (!version) throw new Error(`扩展 package.json 缺少有效的 version：${config.id}`);
          const readme = await readFile(readmePath, "utf8").catch((error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") return "";
            throw error;
          });
          let css = "";
          for (const [name, asset] of Object.entries(bundle)) {
            if (name === fileName) continue;
            if (asset.type !== "asset" || !name.endsWith(".css")) throw new Error(`扩展必须构建为单个脚本，不能包含未内联的资源：${config.id} (${name})`);
            css += typeof asset.source === "string" ? asset.source : new TextDecoder().decode(asset.source);
            delete bundle[name];
          }
          const styleId = JSON.stringify(`toonflowExt-${config.id}`);
          const injectStyle = css ? `if(typeof document!=="undefined"){let style=document.getElementById(${styleId});if(!style){style=document.createElement("style");style.id=${styleId};document.head.appendChild(style)}style.textContent=${JSON.stringify(css)}}\n` : "";
          // 压缩完成后加入元数据和样式，单个 JS 即可供扩展加载器使用。
          chunk.code = `/*! toonflowExt:${JSON.stringify({ ...metadata, configRules, version, readme }).replaceAll("/", "\\u002f")} */\n${injectStyle}${chunk.code}`;
          if (Buffer.byteLength(chunk.code, "utf8") > 20 * 1024 * 1024) throw new Error(`扩展文件不能超过 20 MB：${config.id}`);
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
      // ACT: 多个扩展共享目录，构建单包时保留其他扩展产物。
      emptyOutDir: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      cssCodeSplit: false,
      lib: {
        entry: resolve(root, "src/index.ts"),
        name: `toonflowExts.${config.id}`,
        formats: ["umd"],
        fileName: () => fileName,
      },
      rolldownOptions: {
        external: ["vue", "@vue/runtime-core", "@vue/runtime-dom", "element-plus", "@toonflow/i18n/vue", ...Object.keys(tiptapGlobals)],
        output: {
          exports: "default",
          codeSplitting: false,
          globals: {
            ...tiptapGlobals,
            vue: "toonflowExtHost.vue",
            "@vue/runtime-core": "toonflowExtHost.vue",
            "@vue/runtime-dom": "toonflowExtHost.vue",
            "element-plus": "toonflowExtHost.elementPlus",
            "@toonflow/i18n/vue": "toonflowExtHost.i18n",
          },
        },
      },
    },
  });
}
