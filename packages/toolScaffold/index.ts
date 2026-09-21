import { copyFile, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import vue from "@vitejs/plugin-vue";
import postcssConfig from "../../postcss.config.ts";
import { toolMetadataSchema, type ToolMetadata } from "./src/runtime";

export type { ToolMetadata } from "./src/runtime";

export async function createToolConfig(config: Omit<ToolMetadata, "components" | "readme" | "version"> & { components?: Record<string, string> }, configUrl: string) {
  const { components, ...toolConfig } = config;
  if (components !== undefined && (!components || Array.isArray(components) || typeof components !== "object" ||
    Object.entries(components).some(([name, entry]) => !name.trim() || typeof entry !== "string" || !entry.trim()))) {
    throw new Error("工具组件必须是工具名称到组件入口路径的映射");
  }
  const root = fileURLToPath(new URL(".", configUrl));
  const { version } = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  if (typeof version !== "string" || !version.trim() || version.trim().length > 100) {
    throw new Error("工具 package.json 的 version 必须是长度不超过 100 的非空字符串");
  }
  const readme = await readFile(resolve(root, "readme.md"), "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  const metadata = toolMetadataSchema.parse({
    ...toolConfig,
    version: version.trim(),
    ...(components ? { components: Object.keys(components) } : {}),
    displayName: config.displayName.trim(),
    description: config.description.trim(),
    prompt: config.prompt?.trim() ?? "",
    readme,
    author: config.author.trim(),
    github: config.github.trim(),
  });
  const metadataJson = JSON.stringify(metadata).replaceAll("/", "\\u002f");
  const fileName = `${metadata.name}.tool.js`;
  const outDir = fileURLToPath(new URL("../../build/tools", import.meta.url));
  const dataDir = fileURLToPath(new URL("../../data/tools", import.meta.url));
  let clientBanner = "";
  const componentEntries = Object.entries(components ?? {});
  if (componentEntries.length) {
    const entryId = "\0toonflowToolClient";
    const clientResult = await build({
      configFile: false,
      root,
      css: { postcss: postcssConfig },
      plugins: [vue(), {
        name: "toolClientEntry",
        resolveId(id) { return id === "virtual:toonflowToolClient" ? entryId : undefined; },
        load(id) {
          if (id !== entryId) return;
          const imports = componentEntries.map(([, entry], index) =>
            `import component${index} from ${JSON.stringify(resolve(root, entry).replaceAll("\\", "/"))};`);
          const entries = componentEntries.map(([name], index) => `[${JSON.stringify(name)}, component${index}]`);
          return `${imports.join("\n")}\nexport default Object.fromEntries([${entries.join(",")}]);`;
        },
      }],
      define: { "process.env.NODE_ENV": JSON.stringify("production") },
      build: {
        write: false,
        assetsInlineLimit: Number.MAX_SAFE_INTEGER,
        cssCodeSplit: false,
        lib: {
          entry: "virtual:toonflowToolClient",
          name: `toonflowToolViews.${metadata.name}`,
          formats: ["umd"],
          fileName: () => `${metadata.name}.client.js`,
        },
        rolldownOptions: {
          input: "virtual:toonflowToolClient",
          external: ["vue", "@vue/runtime-core", "@vue/runtime-dom", "element-plus", "axios", "@form-create/element-ui"],
          output: {
            exports: "default",
            globals: {
              vue: "toonflowToolHost.vue",
              "@vue/runtime-core": "toonflowToolHost.vue",
              "@vue/runtime-dom": "toonflowToolHost.vue",
              "element-plus": "toonflowToolHost.elementPlus",
              axios: "toonflowToolHost.axios",
              "@form-create/element-ui": "toonflowToolHost.formCreate",
            },
          },
        },
      },
    });
    const output = Array.isArray(clientResult) ? clientResult.flatMap(result => result.output) : "output" in clientResult ? clientResult.output : [];
    const chunks = output.filter(item => item.type === "chunk");
    if (chunks.length !== 1 || output.some(item => item.type === "asset" && !item.fileName.endsWith(".css"))) {
      throw new Error(`工具组件必须构建为单个脚本，且不能包含未内联的资源：${metadata.name}`);
    }
    const css = output.filter(item => item.type === "asset").map(item =>
      typeof item.source === "string" ? item.source : new TextDecoder().decode(item.source)).join("\n");
    const clientJson = JSON.stringify({ code: chunks[0]!.code, css }).replaceAll("/", "\\u002f");
    clientBanner = `/*! toonflowToolClient:${clientJson} */\n`;
  }
  const result = await Bun.build({
    plugins: [{
      name: "toolHost",
      setup(build) {
        // ACT: Bun 1.3 的 external 会保留原始路径，用虚拟转发模块保证产物引用宿主。
        build.onResolve({ filter: /^zod$/ }, () => ({ path: "zod", namespace: "toolHost" }));
        build.onLoad({ filter: /^zod$/, namespace: "toolHost" }, () => ({
          contents: 'module.exports = require("toonflow:tool-zod");',
          loader: "js",
        }));
      },
    }, {
      name: "inlineDshVersion",
      setup(build) {
        build.onLoad({ filter: /[\\/]@deepseek-ai[\\/]dsh-llm[\\/]lib[\\/]index\.js$/ }, async ({ path }) => {
          const source = await Bun.file(path).text();
          // ACT: DSH 0.1.5-rc.2 动态读取自身 package.json；改成静态读取供 Bun 内联版本信息。
          const contents = source.replace("createRequire(import.meta.url)(\"../package.json\")", "require(\"../package.json\")");
          return { contents, loader: "js" };
        });
      },
    }],
    entrypoints: [resolve(root, "src/index.ts")],
    outdir: outDir,
    naming: fileName,
    target: "bun",
    format: "esm",
    packages: "bundle",
    external: ["toonflow:tool-zod"],
    minify: true,
  });
  if (!result.success) throw new AggregateError(result.logs, `工具构建失败：${metadata.name}`);
  // Bun 会把 @bun 标记放在 banner 前，构建完成后再写入首行元数据。
  const builtPath = resolve(outDir, fileName);
  await Bun.write(builtPath, `/*! toonflowTool:${metadataJson} */\n${clientBanner}${await result.outputs[0].text()}`);
  if (process.env.NODE_ENV === "dev") {
    await mkdir(dataDir, { recursive: true });
    // ACT: Windows 的 bun --watch 占用已加载模块，开发同步直接复制覆盖，不使用 rename。
    await copyFile(builtPath, resolve(dataDir, fileName));
  }
}
