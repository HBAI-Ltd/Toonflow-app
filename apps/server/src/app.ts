import logger from "morgan";
import express from "express";
import cors from "cors";
import { dirname, resolve } from "node:path";
import { lstat, readdir, unlink } from "@toonflow/file";
import type { Request, Response, NextFunction } from "express";
import buildRoute from "@/core";
import { errorFromCause } from "@/lib/responseFormat";
import desktopRequest from "@/lib/desktop";
import { getRuntimePlatform } from "@/lib/platform";
import initializePlugins from "@/utils/plugins/initialize";
import { languageRequest, setLocaleFallback, translateError, translateMessage } from "@/lib/i18n";
import { detectLocale, normalizeLocale } from "@toonflow/i18n";
import type { ResolveModelRunner } from "@/types/localModels";
import { configureModelRunners } from "@/utils/localModel/runners";

export async function createApp({
  webRoot,
  appVersion = "",
  dataDirectory,
  toolsRoot,
  nodesRoot,
  extRoot,
  skillsRoot,
  agentsRoot,
  pluginRevision,
  resolveModelRunner,
}: {
  webRoot: string;
  appVersion?: string;
  dataDirectory?: string;
  toolsRoot?: string;
  nodesRoot?: string;
  extRoot?: string;
  skillsRoot?: string;
  agentsRoot?: string;
  pluginRevision?: string;
  resolveModelRunner?: ResolveModelRunner;
}) {
  // conf 由下方的路由动态加载，必须先确定整个进程共用的数据目录。
  if (dataDirectory) process.env.TOONFLOW_DATA_DIR = resolve(dataDirectory);
  const { default: conf } = await import("@/utils/conf");
  const providerDirectory = resolve(dirname(conf.path), "providers");
  const providerDirectoryInfo = await lstat(providerDirectory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (providerDirectoryInfo) {
    if (providerDirectoryInfo.isSymbolicLink() || !providerDirectoryInfo.isDirectory()) throw new Error("供应商目录不能是符号链接或文件");
    // ACT: 仅迁移清理已移除的内置适配文件；不递归删除目录，不改其他用户供应商。
    for (const file of await readdir(providerDirectory, { withFileTypes: true })) {
      if (file.name.toLowerCase() !== "tfrouter.ts" || (!file.isFile() && !file.isSymbolicLink())) continue;
      await unlink(resolve(providerDirectory, file.name)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  }
  setLocaleFallback(() => normalizeLocale((conf.get("settings", {}).ui as { language?: unknown } | undefined)?.language)
    ?? detectLocale([Intl.DateTimeFormat().resolvedOptions().locale]));
  if (dataDirectory && toolsRoot)
    await initializePlugins(resolve(dataDirectory, "tools"), toolsRoot, /^[a-z][a-zA-Z0-9]*\.tool\.js$/, pluginRevision);
  if (dataDirectory && nodesRoot) await initializePlugins(resolve(dataDirectory, "nodes"), nodesRoot, /^[a-z][a-zA-Z0-9]*\.umd\.js$/, pluginRevision);
  if (dataDirectory && extRoot) {
    const { default: initializeExt } = await import("@/utils/plugins/initializeExt");
    await initializeExt(resolve(dataDirectory, "ext"), extRoot, pluginRevision);
  }
  // ACT: 技能和团队只补首次安装，保留用户修改。
  if (dataDirectory && skillsRoot) await initializePlugins(resolve(dataDirectory, "skills"), skillsRoot);
  if (dataDirectory && agentsRoot) await initializePlugins(resolve(dataDirectory, "agents"), agentsRoot);
  const app = express();
  app.locals.appVersion = appVersion;
  // ACT: 内置身份取自当前发行包的目录，不依赖作者或安装记录；更新后的同名插件仍属于内置插件。
  app.locals.builtinPlugins = Object.fromEntries(await Promise.all(
    Object.entries({ tool: toolsRoot, node: nodesRoot, ext: extRoot, skill: skillsRoot, agent: agentsRoot }).map(async ([type, root]) => {
      const entries = root ? await readdir(root, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return [];
        throw error;
      }) : [];
      const extNameFromFile = type === "ext" ? (await import("@/utils/plugins/ext")).extNameFromFile : undefined;
      const pattern = type === "tool" ? /^[a-z][a-zA-Z0-9]*\.tool\.js$/ : /^[a-z][a-zA-Z0-9]*\.umd\.js$/;
      const names = entries.filter(entry => type === "skill" || type === "agent" ? entry.isDirectory() : entry.isFile() && (extNameFromFile ? !!extNameFromFile(entry.name) : pattern.test(entry.name)))
        .map(entry => entry.isDirectory() ? entry.name : extNameFromFile ? extNameFromFile(entry.name)! : entry.name.replace(/\.(?:tool|umd)\.js$/, ""));
      return [type, new Set(names)];
    }),
  ));

  if (getRuntimePlatform().development) {
    await buildRoute();
    app.use(logger("dev"));
  }
  app.use(cors());
  app.use(languageRequest);
  const { initializeMultiTenantRuntime, multiTenantAccess } = await import("@/utils/multiTenant/runtime");
  initializeMultiTenantRuntime(app);
  app.use(multiTenantAccess);
  const { initializePluginServerRuntime } = await import("@/utils/pluginServer");
  initializePluginServerRuntime(app);
  app.use("/api/pluginServer/message", express.json({ limit: "12mb" }));
  app.use("/a2a", express.json({ limit: "2mb" }));
  app.use(["/api/workspaces/files/write", "/api/assets/save"], express.raw({ type: "application/octet-stream", limit: "100mb" }));
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));
  app.use("/api/desktop", desktopRequest);

  const router = await import("@/router");
  router.default(app);
  const [{ createMcpRouter }, { getMcpTools, runInMcpRequest }, { authorizeMcp }, { skillResources }] = await Promise.all([
    import("@toonflow/mcp"),
    import("@/utils/mcp/tools"),
    import("@/utils/mcp/control"),
    import("@/utils/mcp/resources"),
  ]);
  app.use("/mcp", createMcpRouter({ getTools: getMcpTools, authorize: authorizeMcp, resources: skillResources,
    runInRequest: runInMcpRequest,
    translate: translateMessage,
    translateError,
  }));
  const { createA2aRouter } = await import("@/agent/a2a");
  app.use("/a2a", createA2aRouter());
  app.use(express.static(webRoot));

  // 错误处理
  app.use((err: Error & { status?: number }, request: Request, response: Response, next: NextFunction) => {
    if (response.headersSent) return next(err);
    const body = errorFromCause(err);
    // ACT: 4xx 是已回给调用方的预期失败（如先读后建的 ENOENT、幂等建目录的 EEXIST），只记录 5xx，避免淹没真正的服务端错误。
    if (body.code >= 500) console.error(err);
    response.status(body.code).json(body);
  });

  const { initializeMobileLinkRuntime } = await import("@/utils/mobileLink");
  initializeMobileLinkRuntime(app);
  configureModelRunners(resolveModelRunner);
  return app;
}
