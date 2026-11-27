import { readdir, readFile, realpath } from "@toonflow/file";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { supportedLocales, type Catalogs, type Locale } from "./index.ts";
import { transformSource } from "./transform.ts";

// 文件名与宿主 locales 一致：zh-CN → zhCn、zh-TW → zhTw，其余直接使用语言代码。
const localeFiles = new Map(supportedLocales.map(({ code }) =>
  [code.replace(/-(\w)(\w*)$/, (_, first: string, rest: string) => first + rest.toLowerCase()), code]));

const normalizePath = (path: string) => `${resolve(path).replaceAll("\\", "/").toLowerCase()}/`;

/** 递归查找随插件打包的工作区依赖（软链接到仓库内、不在 node_modules 中的包），返回实际目录。 */
export async function findWorkspaceDependencies(root: string, found = new Set<string>([resolve(root)])): Promise<string[]> {
  const packageInfo = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const names = ["dependencies", "devDependencies", "peerDependencies"].flatMap(field => Object.keys(packageInfo[field] ?? {}));
  for (const name of names) {
    const directory = await realpath(resolve(root, "node_modules", name)).catch(() => undefined);
    if (!directory || found.has(directory) || normalizePath(directory).includes("/node_modules/")) continue;
    found.add(directory);
    await findWorkspaceDependencies(directory, found);
  }
  return [...found].slice(1);
}

/**
 * 读取插件 i18n/*.json，并合并工作区依赖（如 nodeScaffold、nodeShared）各自 i18n 目录中的字典，插件自身优先。
 * 插件没有 i18n 目录时返回 undefined，不启用多语言。roots 为需要做编译期转换的源码目录。
 */
export async function readPluginCatalogs(root: string, watch?: (path: string) => void): Promise<{ catalogs: Catalogs; roots: string[] } | undefined> {
  const own = await readCatalogDirectory(root, watch);
  if (!own) return;
  const catalogs: Catalogs = {};
  const roots = [root];
  for (const directory of await findWorkspaceDependencies(root)) {
    const dependency = await readCatalogDirectory(directory, watch);
    if (!dependency) continue;
    roots.push(directory);
    for (const [locale, catalog] of Object.entries(dependency)) catalogs[locale as Locale] = { ...catalogs[locale as Locale], ...catalog };
  }
  for (const [locale, catalog] of Object.entries(own)) catalogs[locale as Locale] = { ...catalogs[locale as Locale], ...catalog };
  return { catalogs, roots };
}

async function readCatalogDirectory(root: string, watch?: (path: string) => void): Promise<Catalogs | undefined> {
  const directory = resolve(root, "i18n");
  const entries = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return;
    throw error;
  });
  if (!entries) return;
  const catalogs: Catalogs = {};
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const locale = localeFiles.get(entry.name.slice(0, -5));
    if (!locale) throw new Error(`插件多语言文件名无效：${entry.name}，应为 ${[...localeFiles.keys()].map(name => `${name}.json`).join("、")}`);
    // 中文原文即消息键，zhCn.json 只是抽取出的源字典，不打包。
    if (locale === "zh-CN") continue;
    const path = resolve(directory, entry.name);
    watch?.(path);
    const catalog: unknown = JSON.parse(await readFile(path, "utf8"));
    if (!catalog || typeof catalog !== "object" || Array.isArray(catalog) || Object.values(catalog).some(value => typeof value !== "string")) {
      throw new Error(`插件多语言文件必须是“中文原文 → 译文”的字符串对象：${path}`);
    }
    catalogs[locale] = catalog as Record<string, string>;
  }
  return catalogs;
}

/**
 * 插件 Vite 构建使用：把 `@toonflow/i18n/vue` 换成插件自带字典的翻译器，语言与格式化取自宿主的 `toonflow:i18n`；
 * 插件存在 i18n 目录时，对插件及带 i18n 目录的工作区依赖源码执行与宿主相同的编译期文案转换。
 */
export function pluginI18n(root: string): Plugin {
  const virtualId = "\0toonflowPluginI18n";
  let catalogs: Catalogs | undefined;
  let sourceRoots: string[] = [];
  return {
    name: "toonflowPluginI18n",
    enforce: "pre",
    async buildStart() {
      const result = await readPluginCatalogs(root, path => this.addWatchFile(path));
      catalogs = result?.catalogs;
      sourceRoots = result?.roots.map(normalizePath) ?? [];
    },
    resolveId(id) {
      if (id === "@toonflow/i18n/vue") return virtualId;
      if (id === "toonflow:i18n") return { id, external: true };
    },
    load(id) {
      if (id !== virtualId) return;
      // createTranslator 原样转出宿主实现，供随插件打包的宿主加载器（如 toolScaffold/client）使用。
      return `import { createTranslator } from "toonflow:i18n";\nexport { createTranslator };\nexport const markMessages = value => value;\nexport const { locale, msg, translate, t } = createTranslator(${JSON.stringify(catalogs ?? {})});\n`;
    },
    transform(source, id) {
      const path = id.replaceAll("\\", "/");
      const lowerPath = path.toLowerCase();
      // ACT: 只转换插件与带 i18n 目录的工作区依赖；没有 i18n 目录的共享包随插件打包但不转换，其中显式的 t 使用当前插件的字典。
      if (!catalogs || lowerPath.includes("/node_modules/") || !sourceRoots.some(sourceRoot => lowerPath.startsWith(sourceRoot))) return;
      return transformSource(source, path);
    },
  };
}
