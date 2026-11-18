import { mkdir, writeFile } from "@toonflow/file";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [name, ...extra] = process.argv.slice(2);
if (!name || name.length > 92 || extra.length || !/^[a-z][a-zA-Z0-9]*$/.test(name) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(name)) {
  throw new Error("用法：bun packages/extScaffold/create.ts <小驼峰扩展名>（不能使用系统保留名称）");
}

const extRoot = fileURLToPath(new URL("../ext/", import.meta.url));
const target = resolve(extRoot, name);
const files: Record<string, string> = {
  "package.json": `${JSON.stringify({
    name: `@toonflow/ext-${name.toLowerCase()}`,
    version: "0.1.0",
    private: true,
    type: "module",
    exports: { ".": "./src/index.ts" },
    scripts: {
      build: "vite build --config viteConfig.ts",
      dev: "vite build --config viteConfig.ts --watch",
      typecheck: "vue-tsc --noEmit",
    },
    peerDependencies: { vue: "^3.5.42" },
    dependencies: { "@toonflow/ext-scaffold": "workspace:*" },
    devDependencies: { typescript: "~6.0.3", vite: "^8.2.2", "vue-tsc": "^3.3.11" },
  }, null, 2)}\n`,
  "tsconfig.json": `${JSON.stringify({
    extends: "../../../tsconfig.base.json",
    compilerOptions: { lib: ["ESNext", "DOM", "DOM.Iterable"], types: ["bun", "vite/client"] },
    include: ["src", "viteConfig.ts"],
  }, null, 2)}\n`,
  "viteConfig.ts": `import { createExtConfig } from "@toonflow/ext-scaffold";
import metadata from "./src/metadata.ts";

export default createExtConfig(metadata, import.meta.url);
`,
  "src/index.ts": `import { defineExt } from "@toonflow/ext-scaffold/runtime";
import metadata from "./metadata";

export default defineExt({ ...metadata, load: () => import("./index.vue") });
`,
  "src/metadata.ts": `import type { ExtDefinition } from "@toonflow/ext-scaffold/runtime";

export default {
  id: "ext-${name}",
  displayName: "${name}",
  icon: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4e9fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5"/></svg>'),
  configRules: [{ type: "inputNumber", field: "fontSize", title: "字号", value: 14, props: { min: 10, max: 32, step: 1 } }],
  extensions: ["${name.toLowerCase()}"],
  resourceKind: "file",
  text: true,
} satisfies Omit<ExtDefinition, "load">;
`,
  "src/index.vue": `<template>
  <textarea
    class="extEditor"
    :value="context.text"
    :disabled="context.loading"
    :aria-label="context.resource.label"
    :spellcheck="false"
    :style="{ fontSize: fontSize + 'px' }"
    @input="updateText"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ExtContext } from "@toonflow/ext-scaffold/runtime";

const props = defineProps<{ context: ExtContext }>();
const fontSize = computed(() => {
  const size = props.context.config.fontSize;
  return typeof size === "number" && size >= 10 && size <= 32 ? size : 14;
});

function updateText(event: Event) {
  props.context.updateText((event.target as HTMLTextAreaElement).value);
}
</script>

<style scoped>
.extEditor {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 20px;
  resize: none;
  border: 0;
  outline: none;
  color: var(--el-text-color-primary);
  background: transparent;
  font: 14px/1.7 Consolas, monospace;
}
</style>
`,
  "readme.md": [
    `# ${name}`,
    "",
    "在 `src/metadata.ts` 中修改显示名、图标、支持后缀和 `configRules`，在 `src/index.vue` 中实现内容组件。组件只接收 `context: ExtContext`，文本变化调用 `context.updateText(text)`，宿主负责保存；字号从 `context.config` 读取。",
    "",
    "从仓库根目录执行：",
    "",
    "```sh",
    "bun install",
    `bun run --cwd packages/ext/${name} typecheck`,
    `bun run --cwd packages/ext/${name} build`,
    "```",
    "",
    "构建产物：`build/ext/" + name + ".ext.js`。文件内包含元数据与组件样式。开发构建同步到 `data/ext/`。接口和宿主接入说明见 `packages/extScaffold/readme.md`。",
    "",
  ].join("\n"),
};

await mkdir(extRoot, { recursive: true });
// mkdir 的排他语义保证目录已存在时直接失败，绝不覆盖已有扩展。
await mkdir(target);
// ACT: 生成失败保留已创建文件，避免目录级回滚误删期间加入的文件或链接。
await mkdir(resolve(target, "src"));
for (const [path, content] of Object.entries(files)) await writeFile(resolve(target, path), content, { flag: "wx" });
console.log(`已创建 packages/ext/${name}。修改 src/metadata.ts 与 src/index.vue 后，执行 bun install 和 bun run --cwd packages/ext/${name} build。`);
